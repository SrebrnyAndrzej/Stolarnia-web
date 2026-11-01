---
id: PS-WWW-001
status: review
date: 2026-11-01
scope: Aktualizacja treści istniejącej strony Pan Stolarz 2.0
---

# Wynik do recenzji Claude

Źródła: trzy pliki przekazane przez Mateusza w rozmowie: TRESCI-STRONA-GLOWNA.md, STRATEGIA-TRESCI-I-PROFILI.md i ZALOZENIA-STRONY-WWW-dla-Codex.md. Oryginałów nie kopiowano do publicznego repo: strategia zawiera dane przeznaczone wyłącznie do weryfikacji firmy. Ten raport dotyczy aktualizacji istniejącej aplikacji, nie odbioru całego odrębnego projektu Next.js z briefu.

## Wprowadzone

- H1, lead, hasło hero oraz trzy potwierdzone pozycje paska dowodów z materiału źródłowego. CTA pomiaru prowadzi do rzeczywistego telefonu.
- Publiczne dane: nazwa Pan Stolarz, Zielona Góra, telefon 572 548 957 i osiem miejscowości obszaru działania. Bez ulicy.
- Oferta kuchni, garderób/szaf i zabudów; sześć kroków od pomiaru do odbioru; historia Mateusza; cztery odpowiedzi FAQ z gotowych fragmentów źródła.
- Stały nagłówek z działającymi kotwicami i kontaktem telefonicznym na telefonie. Karty usług kierują do istniejącego zapytania, nie pustych podstron.
- Tytuł strony, opis bez niepotwierdzonej klauzuli ceny, podstawowe Open Graph i JSON-LD firmy z obszarem działania. Brak zmyślonej domeny, e-maila i linków do niezweryfikowanych profili.
- Treści usług, procesu, FAQ i publiczne dane w `web/src/v2/landing-content.ts`. Pola oczekujące na decyzję zapisane jako null w PENDING_CONTENT i nie wyświetlane.
- Kolory v02 przypisane tylko do publicznej witryny; panele zachowują swój kontrakt. IBM Plex Sans i Mono: lokalne WOFF2 latin/latin-ext, 400/600, font-display swap, licencje OFL dołączone. Bez pobierania fontów z Google w przeglądarce klienta.
- `npm run check:zgody` jest częścią builda. Kontrola działa także w zagnieżdżonych folderach. Fixture z oczekującym plikiem faktycznie zatrzymała kontrolę.

## Ominięcia i propozycje do zatwierdzenia

1. Bezwzględna stałość ceny i warunki zmian: pominięto czwartą pozycję paska, końcowe zdanie kroku 3 i FAQ o cenie. Sam plik źródłowy wymienia zapis umowy jako wymagający potwierdzenia. Nie zastąpiono go nową obietnicą.
2. Sekcja 6 z trzema wyróżnikami i dowodami pozostaje ukryta: jej warunki są oznaczone do potwierdzenia, a dowodów obrazkowych nie przekazano. Nie deklarujemy przekazania dokumentacji klientowi na własność.
3. Galeria czterech renderów: plików nie dostarczono. Została dotychczasowa wizualizacja składania szafki, opisana jako wizualizacja, nie zdjęcie realizacji. Nie powstały nowe obrazy ani domniemane podpisy realizacji.
4. Hero v4 i kreator: zachowane wcześniejsze bezpośrednie decyzje Mateusza o filmie w tle, autoplay z przejściem do następnej sekcji i działającym kreatorze. To odstępstwo od propozycji statycznego hero i odłożenia konfiguratora w nowym dokumencie. Nie dodawano nowych wizualizacji kuchni klientów.
5. Formularz: istniejący adapter i walidacja pozostały, bez nowego odbiorcy danych lub usługi zewnętrznej. Główne CTA jest telefonem. Nie dodano uploadu, pól telefonu/terminu wymagających zmiany kontraktu, obietnicy oddzwonienia, SLA ani nieistniejącego mailto. Publiczne przyjmowanie zapytań wciąż wymaga konfiguracji backendu i decyzji prawno-organizacyjnych. Nie uznawać go za uruchomiony formularz produkcyjny.
6. Prywatność, cookies, gwarancja, terminy, koszty pomiaru/dojazdu, łazienki, opinie i dodatkowe bio: nie publikowano placeholderów ani wymyślonych danych. Nie publikowano szkieletu polityki jako gotowego dokumentu prawnego.
7. Brak potwierdzonej domeny i obrazu galerii: canonical, pełny OG image/url i sitemap pozostają do uzupełnienia. Nie przypisano domeny z wzmianki w briefie ani domeny podglądu jako marki.
8. Istniejący Vite/React/Express i repo zachowano ze względu na silnik i panele, których dotyczy bieżąca rozmowa. Nie utworzono nowego repo ani nie przeniesiono aplikacji do Next.js. SVG i pełnej księgi z lokalnej ścieżki nie udostępniono; użyto dotychczasowego logo oraz wartości z przesłanego briefu.

## Research i walidacja

Wcześniejszy research jest w `docs/branding/RESEARCH-jezyk-wizualny-Pan-Stolarz-v1.md`. Nie przedstawiam go jako nowego benchmarku 8–10 stron z kompletem screenshotów wymaganym przez nowy brief. Pełny benchmark, zewnętrzny walidator schema.org i progi Lighthouse nie są odhaczone jako wykonane.

Bieżące kontrole: typecheck, build z check:zgody, testy strony i istniejących przepływów, parser JSON-LD, brak placeholderów, telefon i kotwice. Pełne screenshoty: `qa/content-desktop.png` (1440 px), `qa/content-phone.png` (375 px). Axe w obu widokach: 0 serious/critical, bez poziomego overflow. Raport poleceń i wyników w QA-REPORT.md.

## Decyzje do dalszej pracy

- Dostarczyć cztery rendery szafki i ewentualne dowody do wyróżników.
- Potwierdzić zasady ceny, zmian projektu i przekazania dokumentacji.
- Uzupełnić pomiar/dojazd, gwarancję, realne terminy i zakres łazienek.
- Potwierdzić domenę, e-mail, dane działalności, politykę prywatności i docelowy adapter formularza.
- Rozstrzygnąć, czy szerszy brief PS-WWW-001 oznacza osobną witrynę Next.js, czy dalszą rozbudowę istniejącej aplikacji.

Status review dotyczy niniejszego wyniku. Nie oznacza recenzji Claude ani odbioru całego briefu; raport nie został automatycznie wysłany do aplikacji Claude.
