# CNC: adaptery maszynowe i bezpieczne zwalnianie programów

Data weryfikacji źródeł: 07.10.2026. Autor: Codex. To brief badawczy dla Claude, nie opis wdrożonej funkcji i nie program dla konkretnej maszyny. Nie znamy zatwierdzonego modelu centrum CNC, sterownika, wersji CAM, narzędzi ani mocowań warsztatu; dlatego żadnego formatu wyjściowego ani operacji nie wolno uznać tu za gotowe do produkcji.

## Problem i dowody

W `docs/RESEARCH-kreator-premium-dla-Claude.md` P05 słusznie wymaga eksportu dla wybranej maszyny, symulacji i kontrolowanego detalu, a `docs/ANALIZA_KREATORA.md` wiąże rysunek produkcyjny z każdą częścią i operacją. Brakuje osobnego kontraktu między geometrią/operacjami obliczonymi przez aplikację a plikiem programu zrozumiałym dla konkretnej maszyny. Samo wygenerowanie DXF, CSV lub pliku nazwanego „CNC” nie dowodzi poprawnych baz, strony obróbki, narzędzia, głębokości ani bezpiecznego mocowania.

- **Fakt — HOMAG:** oficjalny opis DXF-importu woodWOP mówi, że informacje technologiczne są kodowane warstwami/rulesetami; conversion rules tworzą operacje, a część informacji wymaganych do obróbki nie może być przeniesiona samym DXF. Materiał dla podstawowego postprocesora stwierdza też, że wygenerowane makra nie są zmienne i trzeba je sprawdzić, uzupełnić lub zmodyfikować w woodWOP. DXF jest więc wejściem wymiany, nie samowystarczalnym dowodem gotowości maszyny.
- **Fakt — Biesse:** producent opisuje import plików stron trzecich jako natywny CIX w B_SOLID, gdzie można je dalej edytować i włączyć do symulatora oraz listy pracy. Opis cyfrowej symulacji wymienia parametry rzeczywistego cyklu, m.in. ramp-up/ramp-down i zmianę narzędzia; deklaruje korzyść w zapobieganiu kolizjom. Pokazuje to, że walidacja i wykonanie są zależne od środowiska maszyny/CAM.
- **Granica dowodu:** są to przykłady konkretnych produktów HOMAG i Biesse. Nie dowodzą, że warsztat ma takie oprogramowanie, że ich formaty są otwarte ani że ich reguły można przenosić na inną maszynę.

## Rekomendacja dla produktu

1. Zachować jeden neutralny, wersjonowany opis części i operacji jako źródło prawdy; każde wiercenie/frezowanie zawiera co najmniej bazę i układ współrzędnych, stronę/kierunek, pozycję, geometrię, głębokość, typ operacji, źródło reguły i status weryfikacji. Nie wypełniać brakujących danych domyślnie.
2. Format wymiany geometrii (np. DXF) oraz lista formatek pozostają artefaktami pomocniczymi. Adapter konkretnej maszyny/sterownika jest osobnym, wersjonowanym profilem, który jawnie mapuje operacje, materiały, narzędzia, bazy i ograniczenia mocowań. Brak mapowania któregokolwiek pola krytycznego daje `blocked/needs_review`, nigdy `ready`.
3. Rozdzielić stany: `model_validated` (reguły konstrukcyjne), `export_generated` (utworzono artefakt), `cam_simulated` (sprawdzono w wskazanej wersji CAM/symulatorze), `test_part_approved` (operator zatwierdził próbny detal), `released` (wydano pakiet z niezmiennym snapshotem). Żaden stan nie wynika automatycznie z poprzedniego.
4. Każdy program maszynowy odnosi się do niezmiennego wydania projektu i przechowuje hash pliku, wersję adaptera, identyfikator/model i wersję sterownika/CAM, datę, operatora oraz wynik symulacji/próby. Zmiana modelu, mapowania lub wersji adaptera unieważnia poprzednie zatwierdzenie; nie zmienia historycznego wydania.
5. Raport eksportu pokazuje operacje pominięte, zamienione albo wymagające ręcznego uzupełnienia, wraz z częścią, bazą i źródłem. Operator potwierdza orientację części, stronę obróbki, narzędzie i mocowanie przed zwolnieniem. Interfejs nie może sugerować, że brak ostrzeżeń oznacza bezpieczeństwo, jeśli nie wykonano symulacji.

## Priorytet, zależności i odbiór

- **P0 przed deklaracją produkcyjnego CNC:** jawne `unknown/blocked` dla niewspieranych operacji; weryfikowalny mapping-neutral-to-machine i raport różnic; powiązanie artefaktów z niezmiennym snapshotem wydania.
- **Zależności:** potwierdzenie od właściciela warsztatu modelu maszyny, sterownika/CAM i wersji, osi/baz, dostępnych narzędzi, agregatów, mocowań i materiałów; kompletne, źródłowe reguły wierceń; ACL/auth dla wydawania; snapshot i audyt. Nie projektować adaptera docelowego na bazie przykładowych nazw formatów.
- **Kryteria odbioru:** (a) fixture z jednym detalem zawierającym znane wiercenie, kieszeń i operację krawędziową przechodzi test walidacji neutralnego modelu; (b) adapter wykrywa wszystkie nieobsługiwane operacje i jednostki/strony bez cichego pominięcia; (c) eksport odtwarza się bitowo z zapisanej rewizji albo jego hash jest niezmienny; (d) próbna symulacja jest opisana identyfikatorem maszyny i wersją CAM; (e) ręczny testowy detal zostaje zatwierdzony przez wskazanego operatora; (f) zmiana projektu po zwolnieniu tworzy nową rewizję i nie nadpisuje poprzedniego programu; (g) testy obejmują obrót/lustrzane odbicie, zamianę strony, jednostki, brak narzędzia, ograniczenie głębokości, zderzenie z mocowaniem i błąd zaokrąglenia — bez automatycznej akceptacji negatywnego przypadku.

Na ten moment nie można ustalić tolerancji, bezpiecznych odległości od mocowań, postprocesora, wersji CAM ani zakresu symulacji dla zakładu. To wymaga danych warsztatu i dokumentacji producenta konkretnej maszyny.

## Źródła pierwotne

- HOMAG, [DXF import — CNC software](https://www.homag.com/fileadmin/software/brochures/cnc/Software-CNC-en.pdf), sekcja „woodWOP DXF import”, s. 14 w broszurze: warstwy i reguły konwersji; oraz [DXF-Postprozessor Basic](https://www.homag.com/fileadmin/software/downloads/woodwop-dxf_import_basic.pdf): ograniczenia przenoszenia danych i konieczność kontroli makr w woodWOP.
- Biesse, [Digital twin simulation software delivers hard benefits to CNC users](https://biesse.com/br/pt/news/digital-twin-simulation-software-delivers-hard-benefits-to-cnc-users/): import CIX do B_SOLID, edycja/integracja z symulatorem i listą pracy; zmienne rzeczywistego cyklu w symulacji.
- Biesse, [Software](https://biesse.com/in/en/software/): opis B_SOLID jako 3D CAD/CAM wspierającego operacje obróbcze. Opis marketingowy nie zastępuje dokumentacji API/formatu.

