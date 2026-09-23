"""Scraper HTML -> Markdown based on the user's example.

Install: pip install httpx beautifulsoup4 html2text
Usage: python scrape_for_llm.py URL --output DIRECTORY
Preserves original HTML, provenance, diagram URLs and attachment candidates.
PDF/CAD files require separate inspection; Markdown is not production data.
"""
import argparse
import hashlib
import json
import pathlib
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import httpx
from bs4 import BeautifulSoup
import html2text

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

def scrape_for_llm(url: str, output_dir=None) -> str:
    if urlparse(url).scheme not in ('http', 'https'):
        raise ValueError('Only public HTTP(S) URLs are supported')
    with httpx.Client(headers=HEADERS, follow_redirects=True, timeout=40) as client:
        response = client.get(url)
        response.raise_for_status()
    if 'html' not in response.headers.get('content-type', '').lower():
        raise ValueError('Not HTML: retain the original PDF/CAD and inspect separately')
    soup = BeautifulSoup(response.text, 'html.parser')
    title = soup.title.get_text(' ', strip=True) if soup.title else str(response.url)
    assets = []
    for a in soup.select('a[href]'):
        absolute = urljoin(str(response.url), a['href'])
        a['href'] = absolute
        label = a.get_text(' ', strip=True)
        searchable = (absolute + ' ' + label).lower()
        if any(s in searchable for s in ('.pdf', '.stp', '.step', '.dxf', '.dwg', '.zip', 'attachment', '/file/', 'pobran', 'download', '3d')):
            assets.append({'url': absolute, 'label': label})
    # Some manufacturers expose downloads as buttons, not links (e.g. GTV).
    for element in soup.select('[data-url]'):
        absolute = urljoin(str(response.url), element['data-url'])
        if urlparse(absolute).scheme in ('http','https'):
            assets.append({'url': absolute, 'label': element.get('data-filename') or element.get_text(' ',strip=True),
                           'category': element.get('data-category','')})
    diagrams = [{'url': urljoin(str(response.url), i.get('src', '')), 'alt': i.get('alt', '')}
                for i in soup.select('img[src]')]
    for element in soup(['script', 'style', 'nav', 'footer', 'iframe', 'header', 'aside']):
        element.decompose()
    main = soup.find('main') or soup.find('article') or soup
    converter = html2text.HTML2Text()
    converter.ignore_links = False
    converter.ignore_images = True
    converter.body_width = 0
    markdown = converter.handle(str(main))
    meta = {'title': title, 'requested_url': url, 'final_url': str(response.url),
            'retrieved_at': datetime.now(timezone.utc).isoformat(),
            'sha256': hashlib.sha256(response.content).hexdigest(),
            'content_type': response.headers.get('content-type'),
            'attachments': list({a['url']:a for a in assets}.values()), 'images': diagrams,
            'status': 'extracted_not_technically_validated'}
    if output_dir:
        out = pathlib.Path(output_dir)
        out.mkdir(parents=True, exist_ok=True)
        (out/'source.html').write_bytes(response.content)
        (out/'content.md').write_text(f'# {title}\n\nSource: {response.url}\n\n'+markdown, encoding='utf-8')
        (out/'source.json').write_text(json.dumps(meta,ensure_ascii=False,indent=2),encoding='utf-8')
    return markdown

if __name__ == '__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('url')
    parser.add_argument('--output',default='scraped-page')
    args=parser.parse_args()
    scrape_for_llm(args.url,args.output)
    print('Saved HTML, Markdown and source.json to',args.output)
