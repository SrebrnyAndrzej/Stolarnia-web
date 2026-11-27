# Kreator po analizie Rozrys — 27.11.2026

Źródła: gałąź `feat/furniture-release-20261122`. Publikacja Git, Vercel i OVH została zlecona po zakończeniu implementacji.

## Zaimplementowane

- Podgląd ma minimum 340 px na komputerze i 280 px na telefonie. Wybór rzędów jest pod rysunkiem. Można zbliżyć wybraną szafkę, edytować szerokość z wymiaru lub dotykowego przycisku. Wszystkie wejścia korzystają z dotychczasowego formularza i ochrony zmian.
- Jeden wspólny front może kryć 1–3 niezależne szuflady nad główną skrzynką. Silnik wyznacza osobne poziomy prowadnic w rastrze, formatki i okucia. Zbyt mała przestrzeń jest odrzucana bez zmiany projektu. Zabierak zachowuje ograniczenie do jednego wysuwu i wymaga danych właściwego profilu.
- Karta AGD zapisuje model, link do instrukcji, minimalne wymiary niszy i deklarację sprawdzenia wentylacji. Minimalne wymagania są porównywane ze światłem, a nie gabarytem korpusu. Nie jest to certyfikacja instalacji, maksymalnego zakresu niszy ani otwierania. Karta przechodzi do opisu i pakietu warsztatowego.
- Wspólne wymiary obejmują cokół, dolne korpusy 720/800 mm i poziom wiszących. Wysokość blatu wynika również z jego materiału. Zastosuj jest atomowe, respektuje blokady, kolizje i sufit; Cofnij przywraca poprzedni szkic. Starsze szkice zachowują geometrię.
- Nowe wydanie zamraża formatki CSV i pozycje zakupów dla wariantów. Zmiana projektu, materiałów lub nazw okuć w katalogu nie zmienia tego zestawienia. W dokumentacji właściciela jest pobranie CSV z wybranego wydania. Starsze migawki bez formatek nie otrzymują pozorowanego pliku z aktualnego projektu. Statusy dostaw pozostają bieżące.
- Przed zastosowaniem edycji wyświetla się orientacyjna różnica ceny. Obie ceny pochodzą ze wspólnego publicznego API, z kluczem szkicu, anulowaniem starej odpowiedzi i ponowieniem po błędzie. Nie zmieniono modelu mnożnika materiałów ani osobnego montażu i transportu.

## Weryfikacja

- `node --import tsx --test src/core/*.test.ts src/przelicznik-szuflad.test.ts src/wydania.test.ts src/zamowienie.test.ts src/silnik.test.ts src/server/kitchen-packet-unit.test.ts web/src/v2/planner/*.test.ts` — 161/161.
- `npm run typecheck` — poprawnie.
- `npm run build` — poprawnie; istniejące ostrzeżenie o rozmiarze pakietu Three/OrbitControls.
- Prettier dla zmienionych komponentów i nowych testów — poprawnie.
- `audit_project.py . --mode strict` — 0 naruszeń, 0 ostrzeżeń.
- `git diff --check` — poprawnie.
- `npm run test:v2:unit` — 3/3 testy dostępu i 16/16 testy HTTP. Do ekstrakcji PDF użyto bundlowanego Pythona przez `PAN_STOLARZ_QA_PDF_PYTHON`.
- Playwright: `kitchen-editor-upgrades.spec.ts`, `kitchen-storage-variant.spec.ts`, `kitchen-catalog-clarity.spec.ts`, `planner.spec.ts` — 16/16. Komputer/telefon, podgląd i fokus, szuflady, porównanie ceny, anulowanie, cofanie, nisza AGD, wspólne wymiary, dostępność i 3D. Użyto izolowanego serwera `scripts/qa-browser.mts` na 127.0.0.1:4187, bez produkcyjnej bazy.
- Przeglądarka CUA potwierdziła działanie lokalnego kreatora i fokus szerokości z wymiaru. Początkowy błąd proponowania półki przy zachowaniu parametrów szuflad ukrytych został odtworzony, naprawiony i objęty regresją. Dostęp sieciowy został odblokowany na czas publikacji; wcześniejsze ograniczenie nie jest wynikiem testów bieżącego wydania.

## Dalszy zakres

Zamrożenie własnego wydania nie oznacza uzgodnienia z historycznym CSV wysłanym do hurtowni. Import i porównanie takiego pliku oraz ciągłość usłojenia między frontami wymagają osobnego etapu. Nie wysyłano żadnego rzeczywistego zamówienia.
