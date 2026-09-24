"""Kolektor katalogu okuć, wkrętów, klejów i chemii meblowej → docs/okucia/produkty/katalog.json.

Źródła (każde z własną funkcją, dane wyłącznie z publicznych kart produktów):
  gtv      – producent GTV: wszystkie karty SKU z mapy strony, bez oświetlenia (kategoria z okruszków karty),
  amix     – producent Amix: wybrane kategorie sklepu (PrestaShop, JSON-LD Product: sku/mpn),
  spraykon – producent Spray-Kon: kleje i zmywacze (indeks producenta i EAN z karty),
  mamut    – Den Braven/Bostik Mamut Glue: karta rodziny z kartą techniczną i kartą charakterystyki,
  merkury  – dystrybutor Merkury AM: marki bez publicznego katalogu producenta w tym zbiorze (Blum, Hettich,
             Häfele, Laguna, Sevroll, Matrix, Astra Trade, Würth…); robots.txt: Crawl-delay 1 s — przestrzegane.

Zasady: nie wymyślamy SKU. `sku` = indeks producenta potwierdzony na karcie; w przeciwnym razie puste i opisane
w parametrach. Dystrybutor: `symbolDystrybutora` osobno; kod producenta tylko, gdy występuje w nazwie produktu.
Ceny dystrybutora zapisujemy jako cenę referencyjną sklepu (nie cenę zakupu). `zatwierdzoneProdukcyjnie=false`.

Użycie:  python scripts/okucia/zbierz_katalog_okuc.py --cache <katalog-cache> [--zrodla gtv,amix,spraykon,mamut,merkury]
Wymaga: httpx, beautifulsoup4, pillow (opcjonalnie ścieżka do bibliotek w zmiennej SCRAPER_DEPS).
"""
import argparse, hashlib, json, os, re, sys, time, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin

if os.environ.get("SCRAPER_DEPS"):
    sys.path.insert(0, os.environ["SCRAPER_DEPS"])
import httpx
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "docs/okucia/produkty"
IMG = OUT / "obrazy"
TERAZ = datetime.now(timezone.utc).isoformat()
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) StolarniaKatalog/1.0"}

# ---------- Pobieranie z cache i limitem ----------

class Pobieracz:
    def __init__(self, cache: Path):
        self.cache = cache
        cache.mkdir(parents=True, exist_ok=True)
        self.c = httpx.Client(follow_redirects=True, timeout=30, headers=UA)
        self.ostatnio: dict[str, float] = {}
        self.blokada = threading.Lock()
        self.opoznienie = {"sklep.merkuryam.pl": 1.05}  # robots.txt Crawl-delay: 1

    def get(self, url: str) -> str:
        f = self.cache / (hashlib.sha256(url.encode()).hexdigest() + ".html")
        if f.exists():
            return f.read_text(encoding="utf-8")
        host = re.sub(r"^https?://([^/]+).*", r"\1", url)
        for proba in range(3):
            with self.blokada:
                czekaj = self.opoznienie.get(host, 0.25) - (time.time() - self.ostatnio.get(host, 0))
                if czekaj > 0:
                    time.sleep(czekaj)
                self.ostatnio[host] = time.time()
            r = self.c.get(url)
            if r.status_code == 429:
                time.sleep(int(r.headers.get("Retry-After", "10")))
                continue
            r.raise_for_status()
            f.write_text(r.text, encoding="utf-8")
            return r.text
        raise RuntimeError(f"429 po 3 próbach: {url}")

    def soup(self, url: str) -> BeautifulSoup:
        return BeautifulSoup(self.get(url), "html.parser")


# ---------- Kategorie aplikacji ----------

KATEGORIE = [
    ("zawiasy", r"zawias|clip ?top|clip-on|puszk"),
    ("podnosniki", r"podnośnik|podnosnik|aventos|kinvaro|siłownik|top-stay|klap|pantograf"),
    ("przesuwne", r"przesuwn|wózek|wozek|układ jezdny|tor |prowadnica górna|prowadnica dolna|laguna|sevroll|drzwi przesuw"),
    ("prowadnice", r"prowadnic|movento|tandem|wysuw|slide"),
    ("szuflady", r"szuflad|box|legrabox|merivobox|tandembox"),
    ("odbojniki", r"odbojnik|tip-on|push|amortyzator|dociąg"),
    ("wkrety", r"wkręt|wkret|konfirmat|śrub|srub|bit|konfi"),
    ("laczniki", r"łącznik|lacznik|łącząc|laczac|łączeni|złącz|zlacz|mimośr|mimosr|kołek|kolek|kołki|trzpie|klin"),
    ("mocowania", r"zawiesz|podpórk|podpork|wspornik|mocowan|kątownik|katownik|listwa"),
    ("nogi", r"nog[ia]|nóżk|nozk|stopk|kółk|kolk|rolki meblowe|rolka"),
    ("uchwyty", r"uchwyt|gałk|galk"),
    ("akcesoria", r"przepust|kratk|obrotnic|magnes|zamek|zamk|stelaż|stelaz|tapicer"),
    ("chemia", r"zmywacz|czyści|czysci|clean|silikon|akryl|olej|wosk|rozpuszczal|rozdzielacz|blocker|farba"),
    ("kleje", r"klej|mamut|cyjanoakryl|lep-kon|aktywator"),
    ("wyposazenie", r"kosz|cargo|organiz|segregator|wieszak|drążek|drazek|relin|ociekark|garderob|kuchn"),
]
NAZWY_KATEGORII = {
    "zawiasy": "Zawiasy", "podnosniki": "Podnośniki", "przesuwne": "Systemy przesuwne", "prowadnice": "Prowadnice",
    "szuflady": "Systemy szuflad", "odbojniki": "Odbojniki i push", "wkrety": "Wkręty i konfirmaty",
    "laczniki": "Łączniki i kołki", "mocowania": "Zawieszki i mocowania", "nogi": "Nogi i kółka",
    "kleje": "Kleje", "chemia": "Chemia meblowa", "wyposazenie": "Wyposażenie mebli", "uchwyty": "Uchwyty i gałki",
    "akcesoria": "Akcesoria (przepusty, kratki, zamki)", "inne": "Inne",
}


def kategoria(*teksty: str) -> str:
    t = " ".join(x for x in teksty if x).lower()
    for k, wz in KATEGORIE:
        if re.search(wz, t):
            return k
    return "inne"


def ean_poprawny(kod: str | None) -> str | None:
    """EAN/GTIN tylko z poprawną cyfrą kontrolną — pola „EAN” u dystrybutorów zawierają czasem kody celne (np. 83024200.)."""
    k = re.sub(r"\s", "", kod or "")
    if not re.fullmatch(r"\d{8}|\d{12,14}", k):
        return None
    cyfry = [int(c) for c in k[:-1]][::-1]
    suma = sum(c * (3 if i % 2 == 0 else 1) for i, c in enumerate(cyfry))
    return k if (10 - suma % 10) % 10 == int(k[-1]) else None


def rekord(**p) -> dict:
    ean = ean_poprawny(p.get("ean"))
    par = dict(p.get("parametry", {}))
    if par.get("EAN") and not ean_poprawny(par["EAN"]):
        par["Kod z pola EAN (niepoprawny EAN)"] = par.pop("EAN")
    if p.get("ean") and not ean:
        par.setdefault("Kod z pola EAN (niepoprawny EAN)", p["ean"])
    p = dict(p, ean=ean, parametry=par)
    klucz = p["producent"].lower().replace(" ", "-") + "-" + hashlib.sha256((p["zrodloURL"] + "|" + p.get("sku", "") + "|" + p["nazwa"]).encode()).hexdigest()[:16]
    zdj = [z for z in p.get("zdjecia", []) if z]
    return {
        "id": klucz,
        "producent": p["producent"],
        "system": p.get("system") or p["producent"],
        "kategoria": p["kategoria"],
        "sku": p.get("sku", ""),
        "rodzajSKU": p.get("rodzajSKU", "wariant" if p.get("sku") else "rodzina"),
        "ean": p.get("ean") or None,
        "symbolDystrybutora": p.get("symbolDystrybutora") or None,
        "nazwa": p["nazwa"],
        "rodzaj": p.get("rodzaj", "element"),
        "zdjecieURL": zdj[0] if zdj else "",
        "zdjecia": zdj[:4],
        "parametry": {k: v for k, v in p.get("parametry", {}).items() if v},
        "dokumenty": list({d["url"]: d for d in p.get("dokumenty", [])}.values())[:12],
        "zrodloURL": p["zrodloURL"],
        "zrodloTyp": p.get("zrodloTyp", "producent"),
        "cenaReferencyjna": p.get("cenaReferencyjna"),
        "pobrano": TERAZ,
        "sha256": p["sha256"],
        "zatwierdzoneProdukcyjnie": False,
    }


def dokumenty(s: BeautifulSoup, url: str) -> list[dict]:
    wynik = []
    for a in s.select("a[href], [data-url]"):
        u = urljoin(url, a.get("data-url") or a.get("href", ""))
        if any(x in u.lower() for x in [".pdf", "controller=attachment", ".stp", ".step", ".dwg"]):
            nazwa = (a.get("data-filename") or a.get_text(" ", strip=True) or "Dokumentacja")[:100]
            wynik.append({"nazwa": nazwa, "url": u})
    return wynik


def json_ld_produkt(s: BeautifulSoup) -> dict | None:
    for x in s.select('script[type="application/ld+json"]'):
        try:
            j = json.loads(x.get_text())
        except Exception:
            continue
        for o in (j if isinstance(j, list) else j.get("@graph", [j])):
            if isinstance(o, dict) and o.get("@type") == "Product":
                return o
    return None


def sha(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()


# ---------- GTV (producent) ----------

def gtv(pb: Pobieracz, istniejace: set[str]) -> list[dict]:
    urls = []
    for i in range(1, 12):
        urls += re.findall(r"<loc>(https://gtv\.com\.pl/produkt/[A-Z0-9][A-Z0-9-]+/)</loc>", pb.get(f"https://gtv.com.pl/product-sitemap{i}.xml"))
    urls = sorted(set(urls))
    print(f"GTV: {len(urls)} kart SKU", flush=True)

    def karta(url):
        html = pb.get(url)
        s = BeautifulSoup(html, "html.parser")
        sku = url.rstrip("/").split("/")[-1]
        if sku in istniejace:
            return None
        okruszki = [a.get_text(" ", strip=True) for a in s.select("a[href*='kategoria-produktu']") if a.get_text(strip=True)]
        # Pierwsze okruszki to ścieżka karty; menu powtarza „Akcesoria meblowe / Bez kategorii / Oświetlenie” na końcu
        sciezka = []
        for k in okruszki:
            if sciezka and k == "Akcesoria meblowe":
                break
            sciezka.append(k)
        if not sciezka or sciezka[0] != "Akcesoria meblowe":
            return None  # oświetlenie i pozostałe działy
        h = s.select_one("h1")
        nazwa = h.get_text(" ", strip=True) if h else sku
        if sku not in s.get_text():
            raise ValueError("Indeks nie występuje na karcie " + sku)
        par = {}
        for r in s.select("tr"):
            c = r.select("td,th")
            if len(c) == 2:
                par[c[0].get_text(" ", strip=True)] = c[1].get_text(" ", strip=True)
        par.pop("Producent", None)
        par["Kategoria producenta"] = " › ".join(sciezka[1:])
        zdj = [urljoin(url, i.get("data-src") or i.get("src")) for i in s.select("img.p-product__photo-main-image") if (i.get("data-src") or i.get("src", "")).startswith("http")]
        if not zdj:  # część kart ma inny układ galerii — zdjęcie z meta og:image albo z serwera zdjęć GTV
            og = s.select_one('meta[property="og:image"]')
            zdj = [og["content"]] if og and og.get("content") else [i.get("data-src") or i.get("src") for i in s.select("img") if "assets.gtv.com.pl" in (i.get("data-src") or i.get("src") or "")][:1]
        kat = kategoria(" ".join(sciezka[1:3]), nazwa)
        return rekord(producent="GTV", system=sciezka[2] if len(sciezka) > 2 else sciezka[-1], kategoria=kat, sku=sku, nazwa=nazwa,
                      rodzaj="zestaw" if re.search(r"komplet|zestaw|kpl", nazwa, re.I) else "element",
                      zdjecia=zdj, parametry=par, dokumenty=dokumenty(s, url), zrodloURL=url, sha256=sha(html))

    return rownolegle(karta, urls, 4, "GTV")


# ---------- Amix (producent) ----------

AMIX_KATEGORIE = [
    "387-zawiasy-meblowe", "101-zawiasy-meblowe-aluminiowe-clip-on", "385-prowadnice-meblowe", "29-podnosniki-meblowe",
    "285-pozostale-akcesoria-system-drzwi-przesuwnych", "42-elementy-laczace", "44-podporki-do-polek", "389-odbojniki",
    "27-nogi-meblowe-nozki-meblowe", "313-nogi-do-mebli", "25-kosze-cargo-magic-cornery", "295-kosze-cargo-wloskie-sige",
    "361-szuflady", "380-segregatory-rubio", "400-clg-nova", "18-wyposazenie-garderoby",
]


def amix(pb: Pobieracz, istniejace: set[str]) -> list[dict]:
    urls = set()
    for kat in AMIX_KATEGORIE:
        for strona in range(1, 40):
            s = pb.soup(f"https://amix.pl/pl/{kat}" + (f"?page={strona}" if strona > 1 else ""))
            nowe = {a["href"].split("#")[0].split("?")[0] for a in s.select("article a[href], .product-miniature a[href]") if re.search(r"amix\.pl/pl/[^/]+/\d+-", a["href"])}
            if not nowe - urls:
                break
            urls |= nowe
    urls = sorted(urls)
    print(f"Amix: {len(urls)} kart", flush=True)

    def karta(url):
        html = pb.get(url)
        s = BeautifulSoup(html, "html.parser")
        p = json_ld_produkt(s)
        if not p:
            return None
        sku = (p.get("mpn") or p.get("sku") or "").strip()
        if sku and sku in istniejace:
            return None
        nazwa_h1 = s.select_one("h1")
        nazwa = nazwa_h1.get_text(" ", strip=True) if nazwa_h1 else p.get("name", "")
        okr = [a.get_text(" ", strip=True) for a in s.select(".breadcrumb a, nav.breadcrumb a") if a.get_text(strip=True)]
        par = {}
        for el in s.select(".product-variants-item"):
            lab = el.select_one(".control-label")
            opcje = [x.get_text(" ", strip=True) for x in el.select("option, .input-container label, .radio-label")]
            if opcje:
                par[lab.get_text(" ", strip=True) if lab else "Warianty"] = ", ".join(dict.fromkeys(opcje))
        for dl in s.select(".product-features dl"):
            for dt, dd in zip(dl.select("dt"), dl.select("dd")):
                par[dt.get_text(" ", strip=True)] = dd.get_text(" ", strip=True)
        if okr:
            par["Kategoria producenta"] = " › ".join(okr[1:])
        img = p.get("image", [])
        img = [img] if isinstance(img, str) else img
        if not img and isinstance(p.get("offers"), dict):
            img = p["offers"].get("image", [])
        # Amix nazywa produkty samym kodem (np. „AGV-HS/0* 3D+”) — dopisujemy kategorię producenta z okruszków
        if okr and sku and nazwa.replace(" ", "") == sku.replace(" ", ""):
            nazwa = f"{okr[-1]} {sku}" if okr[-1].lower() not in ("strona główna", "home") else nazwa
        tekst = re.sub(r"\s+", " ", s.get_text(" ", strip=True))
        ean = re.search(r"EAN:\s*(\d{8,14})", tekst)
        netto = re.search(r"(\d+(?:[ ,]\d{3})*,\d{2})\s*zł\s*netto", tekst)
        cena = {"kwota": float(netto.group(1).replace(" ", "").replace(",", ".")), "waluta": "PLN", "opis": "cena netto w sklepie producenta za jednostkę sprzedaży z karty (sztuka lub opakowanie)", "data": TERAZ[:10]} if netto else None
        warianty = any(k != "Kategoria producenta" for k in par) and any("," in v for v in par.values())
        rodzaj_sku = "wariant" if sku and not warianty else "rodzina"
        if not sku:
            par["Zakres indeksu"] = "Producent nie publikuje indeksu na karcie produktu — wariant i indeks ustal u dostawcy."
        elif warianty:
            par["Zakres indeksu"] = "Indeks karty obejmuje kilka wariantów (kolor, długość) — dokładny wariant wybierz u producenta."
        return rekord(producent="Amix", system=(okr[-1] if okr else p.get("category", "Amix")), kategoria=kategoria(" ".join(okr), nazwa, p.get("category", "")),
                      sku=sku, rodzajSKU=rodzaj_sku, nazwa=nazwa, rodzaj="zestaw" if re.search(r"komplet|zestaw|kpl", nazwa, re.I) else "element",
                      zdjecia=img, parametry=par, dokumenty=dokumenty(s, url), zrodloURL=url, sha256=sha(html),
                      ean=ean.group(1) if ean else None, cenaReferencyjna=cena)

    return rownolegle(karta, urls, 3, "Amix")


# ---------- Spray-Kon (producent) ----------

def spraykon(pb: Pobieracz, istniejace: set[str]) -> list[dict]:
    urls = set()
    for kat in ["25-wszystkie-kleje", "18-zmywacze", "32-kleje-kontaktowe-w-areozolu", "33-kanistry", "27-kleje-meblarskie", "17-kleje-kontaktowe"]:
        for strona in range(1, 10):
            s = pb.soup(f"https://spraykon.pl/{kat}" + (f"?page={strona}" if strona > 1 else ""))
            nowe = {a["href"].split("#")[0] for a in s.select("a[href]") if re.search(r"spraykon\.pl/[^/]+/\d+-.*\.html$", a["href"])}
            if not nowe - urls:
                break
            urls |= nowe
    urls = sorted(urls)
    print(f"Spray-Kon: {len(urls)} kart", flush=True)

    def karta(url):
        html = pb.get(url)
        s = BeautifulSoup(html, "html.parser")
        tekst = re.sub(r"\s+", " ", s.get_text(" ", strip=True))
        indeks = re.search(r"Indeks:\s*([0-9A-Z-]+)", tekst)
        ean = re.search(r"EAN:\s*(\d{8,14})", tekst)
        h = s.select_one("h1")
        nazwa = h.get_text(" ", strip=True) if h else url
        if re.search(r"\b\d+\s*x\s*\d|pude[łl]k|mega zestaw", nazwa, re.I):
            return None  # wielopaki dublują pojedyncze produkty
        og = s.select_one('meta[property="og:image"]')
        opis = s.select_one("#product-description-short, .product-description-short, [itemprop=description]")
        par = {"Opis": opis.get_text(" ", strip=True)[:400] if opis else ""}
        pojemnosc = re.search(r"(\d+(?:[.,]\d+)?)\s*(ml|l|g|kg)\b", nazwa, re.I)
        if pojemnosc:
            par["Opakowanie"] = pojemnosc.group(0)
        return rekord(producent="Spray-Kon", system="Spray-Kon", kategoria=kategoria(url.split("/")[3], nazwa), sku=indeks.group(1) if indeks else "",
                      ean=ean.group(1) if ean else None, nazwa=nazwa, rodzaj="element", zdjecia=[og["content"]] if og else [],
                      parametry=par, dokumenty=dokumenty(s, url), zrodloURL=url, sha256=sha(html))

    return rownolegle(karta, urls, 2, "Spray-Kon")


# ---------- Mamut Glue (Den Braven / Bostik) ----------

def mamut(pb: Pobieracz, istniejace: set[str]) -> list[dict]:
    url = "https://mamutglue.pl/produkt-mamut-glue/"
    html = pb.get(url)
    s = BeautifulSoup(html, "html.parser")
    docs = [{"nazwa": "Karta techniczna (TDS)" if "tds" in d["url"].lower() else "Karta charakterystyki (SDS)" if "sds" in d["url"].lower() else d["nazwa"], "url": d["url"]} for d in dokumenty(s, url)]
    og = s.select_one('meta[property="og:image"]')
    return [rekord(producent="Den Braven / Bostik", system="Mamut Glue", kategoria="kleje", sku="", rodzajSKU="rodzina",
                   nazwa="Mamut Glue — klej montażowy MS polimer (rodzina)", zdjecia=[og["content"]] if og else [],
                   parametry={"Technologia": "MS polimer, jednoskładnikowy, trwale elastyczny",
                              "Wytrzymałość": "do 22 kG/cm² (według producenta)",
                              "Odporność termiczna": "−40°C do +90°C po utwardzeniu",
                              "Zakres indeksu": "Karta rodziny producenta — pojemność i kolor (np. 290 ml biały) wybierz u dostawcy."},
                   dokumenty=docs, zrodloURL=url, sha256=sha(html))]


# ---------- Merkury AM (dystrybutor) ----------

MERKURY_WZORZEC = (r"zawias|prowadnic|przesuw|wozek|wozki|Laguna|Sevroll|podnosnik|AVENTOS|KINVARO|FREE-|Tip-On|TIP-ON|wkret|konfirmat|srub|"
                   r"lacznik|klej|Spray-Kon|SPRAY-KON|Mamut|MAMUT|silikon|akryl|czysc|zmywacz|olej|wosk|MATRIX|ASTRA|MOVENTO|TANDEM-|zawieszk|"
                   r"podporka|mimosrod|kolki|Kolki|amortyzator|odbojnik|CLIP")
MARKI = {"BLUM": "Blum", "WURTH": "Würth", "HAFELE": "Häfele", "HETTICH": "Hettich", "MATRIX": "Matrix", "ASTRA-TRADE": "Astra Trade", "ASTRA TRADE": "Astra Trade",
         "LAGUNA": "Laguna", "TYTAN": "Tytan", "SOUDAL": "Soudal", "ABSORFEN": "Absorfen", "BONIFIX": "Bonifix", "COLORJOINT": "ColorJoint", "CLEANING EXPERT": "Cleaning Expert", "MATT GLOSS": "Matt Gloss", "MAX": "MAX", "WÜRTH": "Würth", "MAMUT": "Den Braven / Bostik", "BOSTIK": "Den Braven / Bostik", "DEN BRAVEN": "Den Braven / Bostik", "SEVROLL": "Sevroll", "TITUS": "Titus", "FGV": "FGV", "DC": "DC", "ITALIANA FERRAMENTA": "Italiana Ferramenta", "SISO": "SISO", "PEKA": "Peka"}
MERKURY_POMIN_MARKI = {"GTV", "SPRAY-KON", "AMIX"}  # te marki mają dane bezpośrednio od producenta


def merkury(pb: Pobieracz, istniejace: set[str]) -> list[dict]:
    mapa = pb.get("https://sklep.merkuryam.pl/sitemap-produkty.xml")
    urls = sorted({u for u in re.findall(r"<loc>([^<]+)</loc>", mapa)
                   if re.search(MERKURY_WZORZEC, u, re.I) and not re.search(r"merkuryam\.pl/\d+x-", u) and not re.search(r"Uchwyt|Galka|LED|Oprawa|Wlacznik", u, re.I)})
    # Chemia i kleje: adresy produktów nie zawierają słów kluczowych (np. „Srodek-czyszczacy-ABSORFEN”) — bierzemy je z kategorii.
    for kat in ["KLEJE-I-CHEMIA-c51", "CZYSCIKI-c62", "KLEJE-c63", "SILIKONY-I-AKRYLE-c64"]:
        s = pb.soup(f"https://sklep.merkuryam.pl/{kat}")
        urls = sorted(set(urls) | {urljoin("https://sklep.merkuryam.pl/", a["href"]).split("#")[0] for a in s.select("a[href]")
                                   if re.search(r"-p\d+$", a["href"]) and not re.search(r"/\d+x-", urljoin("https://sklep.merkuryam.pl/", a["href"]))})
    print(f"Merkury: {len(urls)} kart (1 zapytanie/s)", flush=True)

    def karta(url):
        html = pb.get(url)
        s = BeautifulSoup(html, "html.parser")
        p = json_ld_produkt(s)
        if not p:
            return None
        marka = ((p.get("brand") or {}).get("name") or "").strip()
        nazwa = p.get("name", "")
        marka_z_nazwy = False
        if not marka:
            # Część kart (chemia, kleje) ma pustą markę — ustalamy ją z nazwy według listy znanych marek.
            m = re.search(r"\b(TYTAN|W[UÜ]RTH|SOUDAL|ABSORFEN|BONIFIX|COLORJOINT|CLEANING EXPERT|MATT GLOSS|MAX|DEN BRAVEN|BOSTIK|MAMUT|SPRAY-KON|HENKEL|PATTEX|KLEIBERIT|JOWAT|RAKOLL)\b", nazwa, re.I)
            marka, marka_z_nazwy = (m.group(1), True) if m else ("Marka nieustalona", True)
        if marka.upper() in MERKURY_POMIN_MARKI:
            return None
        symbol = (p.get("sku") or "").strip()
        ostatni = symbol.split(".")[-1] if symbol else ""
        # Kod producenta tylko, gdy ostatni człon symbolu jest całym słowem nazwy, ma litery i cyfry i nie jest wymiarem (np. Blum 71B7550D).
        slowa = {w.upper() for w in re.split(r"[^0-9A-Za-z.]+", nazwa) if w}
        kod = ostatni if (ostatni and len(ostatni) >= 5 and ostatni.upper() in slowa and re.search(r"[A-Za-z]", ostatni) and re.search(r"\d", ostatni)
                          and not re.fullmatch(r"\d+(?:[.,]\d+)?X\d+(?:[.,]\d+)?", ostatni, re.I)
                          and not re.fullmatch(r"\d+(?:[.,]\d+)?(?:ML|L|G|KG|SZT|MM|CM|M|N)", ostatni, re.I)) else ""
        par = {}
        for r in s.select("tr"):
            c = [x.get_text(" ", strip=True) for x in r.select("td,th")]
            if len(c) == 2 and c[0] and c[1] and not re.search(r"wysyłk|odbiór|kurier|paczkomat|opinie|dostępno|waga|cena", c[0], re.I):
                par[c[0]] = c[1]
        opis = s.select_one("#box_description, .product-description, [itemprop=description]")
        if opis:
            par["Opis dystrybutora"] = re.sub(r"\s+", " ", opis.get_text(" ", strip=True))[:500]
        if not kod:
            par["Zakres indeksu"] = "Dystrybutor nie podaje kodu producenta — zamawiaj po symbolu dystrybutora lub EAN."
        if marka_z_nazwy:
            par["Marka"] = "ustalona z nazwy produktu (karta dystrybutora nie podaje marki)" if marka != "Marka nieustalona" else "karta dystrybutora nie podaje marki"
        img = p.get("image")
        oferta = p.get("offers") or {}
        cena = {"kwota": float(oferta["price"]), "waluta": oferta.get("priceCurrency", "PLN"), "opis": "cena detaliczna brutto w sklepie dystrybutora za jednostkę sprzedaży z karty", "data": TERAZ[:10]} if oferta.get("price") else None
        return rekord(producent=MARKI.get(marka.upper(), marka.title() if marka.isupper() and len(marka) > 3 else marka), system=p.get("category", marka),
                      kategoria=kategoria(p.get("category", ""), nazwa), sku=kod, rodzajSKU="wariant" if kod else "dystrybutor",
                      ean=p.get("gtin13"), symbolDystrybutora=symbol, nazwa=nazwa,
                      rodzaj="zestaw" if re.search(r"komplet|zestaw|kpl", nazwa, re.I) else "element",
                      zdjecia=[urljoin(url, img)] if img else [], parametry=par, zrodloURL=url, zrodloTyp="dystrybutor",
                      cenaReferencyjna=cena, sha256=sha(html))

    return rownolegle(karta, urls, 1, "Merkury")


# ---------- Wspólne ----------

BLEDY: list[dict] = []
ZRODLO_HOSTA = {"gtv.com.pl": "gtv", "amix.pl": "amix", "spraykon.pl": "spraykon", "mamutglue.pl": "mamut", "sklep.merkuryam.pl": "merkury"}


def rownolegle(fn, urls, watki, nazwa):
    wynik = []
    with ThreadPoolExecutor(watki) as pula:
        zad = {pula.submit(fn, u): u for u in urls}
        for n, f in enumerate(as_completed(zad), 1):
            try:
                r = f.result()
                if r:
                    wynik.append(r)
            except Exception as e:
                BLEDY.append({"zrodlo": nazwa, "url": zad[f], "blad": str(e)[:300]})
            if n % 50 == 0:
                print(f"  {nazwa}: {n}/{len(urls)}, produktów {len(wynik)}, błędów {len([b for b in BLEDY if b['zrodlo'] == nazwa])}", flush=True)
    return wynik


def zdjecia_lokalne(produkty: list[dict], pb: Pobieracz):
    from io import BytesIO
    from PIL import Image
    IMG.mkdir(parents=True, exist_ok=True)
    zdalne = sorted({p["zdjecieURL"] for p in produkty if p["zdjecieURL"].startswith("http")})

    def pobierz(url):
        klucz = hashlib.sha256(url.encode()).hexdigest()[:20]
        f = IMG / (klucz + ".jpg")
        try:
            if not f.exists():
                if "merkuryam" in url:
                    with pb.blokada:
                        time.sleep(max(0, 1.05 - (time.time() - pb.ostatnio.get("sklep.merkuryam.pl", 0))))
                        pb.ostatnio["sklep.merkuryam.pl"] = time.time()
                r = pb.c.get(url)
                r.raise_for_status()
                im = Image.open(BytesIO(r.content)).convert("RGB")
                im.thumbnail((900, 700))
                im.save(f, "JPEG", quality=84)
            return url, "/api/okucia-katalog/obrazy/" + f.name
        except Exception as e:
            BLEDY.append({"zrodlo": "zdjecie", "url": url, "blad": str(e)[:200]})
            return url, ""

    with ThreadPoolExecutor(3) as pula:
        mapa = dict(pula.map(pobierz, zdalne))
    for p in produkty:
        if p["zdjecieURL"].startswith("http"):
            p["zdjecieZrodloURL"] = p["zdjecieURL"]
            p["zdjecieURL"] = mapa.get(p["zdjecieURL"], "")
        if p.get("zrodloTyp") == "dystrybutor" and p["zdjecieURL"]:
            p["zdjecieOpis"] = "Zdjęcie z karty dystrybutora — może przedstawiać wariant poglądowy."


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", required=True)
    ap.add_argument("--zrodla", default="gtv,amix,spraykon,mamut,merkury")
    a = ap.parse_args()
    pb = Pobieracz(Path(a.cache))
    plik = OUT / "katalog.json"
    stary = json.loads(plik.read_text(encoding="utf-8")) if plik.exists() else []
    # Zachowaj dotychczasowy katalog szuflad (Amix Elite, GTV Axis/Modern Box, Blum) z kategorią „szuflady”.
    zachowane = [dict(p, kategoria=p.get("kategoria") or "szuflady", zrodloTyp=p.get("zrodloTyp") or "producent") for p in stary if (p.get("kategoria") or "szuflady") == "szuflady" and not p.get("zbiorAuto")]
    # Pozycje z poprzednich przebiegów dla źródeł, których teraz nie pobieramy, zostają bez zmian.
    zbierane = {z.strip() for z in a.zrodla.split(",")}
    zachowane += [p for p in stary if p.get("zbiorAuto") and ZRODLO_HOSTA.get(re.sub(r"^https?://([^/]+).*", r"\1", p["zrodloURL"])) not in zbierane]
    istniejace = {p["sku"] for p in zachowane if p.get("sku")}
    nowe: list[dict] = []
    for z in a.zrodla.split(","):
        nowe += globals()[z.strip()](pb, istniejace)
    for p in nowe:
        p["zbiorAuto"] = True
    zdjecia_lokalne(nowe, pb)
    # Deduplikacja po id; kolejność: producent, kategoria, SKU
    wszystkie = {p["id"]: p for p in zachowane + nowe}
    lista = sorted(wszystkie.values(), key=lambda p: (p["kategoria"], p["producent"], p["sku"] or "~", p["nazwa"]))
    plik.write_text(json.dumps(lista, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    from collections import Counter
    raport = {"pobrano": TERAZ, "produkty": len(lista), "kategorie": dict(Counter(p["kategoria"] for p in lista)),
              "producenci": dict(Counter(p["producent"] for p in lista)), "zrodla": dict(Counter(p.get("zrodloTyp", "producent") for p in lista)),
              "bezZdjecia": sum(not p["zdjecieURL"] for p in lista), "bledy": len(BLEDY)}
    (OUT / "raport.json").write_text(json.dumps(raport, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT / "errors.json").write_text(json.dumps(BLEDY, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(raport, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
