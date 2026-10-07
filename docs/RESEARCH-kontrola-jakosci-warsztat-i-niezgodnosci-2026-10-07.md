# Kontrola jakości w warsztacie i obsługa niezgodności

Data: 2026-10-07  
Baza `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: wymagania dla kontroli międzyoperacyjnej i końcowej, poza postępem karty pracy oraz reklamacją klienta. Bez zmian logiki i bez ustanawiania własnych tolerancji produkcyjnych.

## Problem i granica względem istniejących funkcji

Brief karty pracy opisuje rejestrowanie ukończenia operacji, usterek i poprawek. Brief odbioru/montażu/reklamacji obejmuje klienta i usterki po przekazaniu. W sprawdzonym `origin/main` wyszukiwanie nie wykazało odrębnego modelu kontroli warsztatowej: zaplanowanego punktu kontroli powiązanego z operacją i wydaniem, z zapisem pomiaru/wyniku, blokadą dalszej pracy oraz formalną decyzją o niezgodnej części. Karta pracy może stwierdzić „sprawdzono”, ale bez wersjonowanego kryterium nie wiadomo, co sprawdzono i według jakiej tolerancji.

## Dowody ze źródeł

- Dokumentacja Odoo Quality pozwala wiązać punkty kontroli z konkretną operacją, produktem i częstotliwością. Rodzaje kontroli obejmują instrukcję, zdjęcie, pass/fail, pomiar z wartością normatywną i tolerancją, worksheet oraz potwierdzenie ilości. [Odoo 18 — Quality Control Points](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_control_points.html), [Odoo 18 — Quality Checks](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_checks.html)
- Odoo Quality Alerts wiąże problem z produktem/operacją, odpowiedzialnym, przyczyną i działaniami korygującymi oraz zapobiegawczymi. Jest to odrębny tor do rozwiązania przyczyny, a nie wyłącznie status „poprawka”. [Odoo 18 — Quality Alerts](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/quality/quality_management/quality_alerts.html)
- Repo `docs/RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md` już postuluje śledzenie WIP, ilości dobrych/braków, hold, rework oraz zdarzeń append-only. Ten research doprecyzowuje kryterium kontroli i decyzję o niezgodności; nie zastępuje tamtego obiegu.

Wzorce Odoo są przykładem funkcji PLM/MES, a nie obowiązkiem ani normą dla tej stolarni. Żadne źródło nie wyznacza tolerancji konkretnych płyt, okuć, CNC, szczelin ani montażu dla tego zakładu. Takie liczby muszą pochodzić z zatwierdzonego rysunku/wyrobu, producenta lub decyzji technologicznej zakładu.

## Zalecane zachowanie

**P1, po wydaniu produkcyjnym i karcie pracy oraz P0 auth/audyt.** Utrzymywać prosty, konfigurowalny plan kontroli warsztatu, powiązany z konkretną rewizją wydania. Nie wdrażać automatycznego losowego próbkowania ani nie deklarować zgodności normatywnej bez uzasadnionej potrzeby.

1. Punkt kontroli wskazuje operację/stanowisko, część lub grupę części, rewizję dokumentacji, kryterium, metodę, wymaganą częstość, odpowiedzialną rolę i zachowanie przy niepowodzeniu. Wartości normy/tolerancji pochodzą z zatwierdzonego źródła; brak kryterium to jawny brak konfiguracji, nie domyślna tolerancja.
2. Wynik zapisuje oddzielnie od zdarzenia wykonania operacji: pass/fail, zmierzoną wartość i jednostkę, oczekiwany zakres, opcjonalny komentarz/zdjęcie, aktora, czas serwera, część/ilość/partię, wydanie produkcyjne i wersję planu. Korekta wyniku jest nowym zdarzeniem z autorem i powodem.
3. Wykrycie fail tworzy niezgodność, automatycznie blokuje dalsze etapy danej części/ilości i pokazuje fizyczny status „wstrzymane/do segregacji”. Nie może ono zniknąć w ogólnym statusie ukończenia operacji. Dla partii wynik określa liczby sprawdzone, dobre, wadliwe i oczekujące.
4. Uprawniony decydent jawnie wybiera: poprawa i ponowna kontrola, złom/wykonanie nowej sztuki, użycie warunkowe/odstępstwo z uzasadnieniem i akceptacją technologiczną, albo odrzucenie niezgodności jako błędnego zgłoszenia. Nie ma cichego ustawienia „pass” ani kontynuacji bez decyzji.
5. Każda poprawka jest nowym zadaniem powiązanym z oryginalną częścią i wydaniem; wynik pierwotny pozostaje. Po poprawie wymagane kontrole uruchamiają się ponownie, a część nie jest zaliczona przed pozytywnym wynikiem.
6. Dla pojedynczych mebli na zamówienie zacząć od kontroli wszystkich punktów oznaczonych przez technologa jako krytyczne dla montażu/bezpieczeństwa/funkcji, np. interfejsu okucia lub wymiaru wskazanego na rysunku. Nie narzucać 100% lub próbkowania dla wszystkich cech: politykę wybiera zakład dla danej kontroli. Wartości i przykłady krytyczności wymagają zatwierdzenia właściciela/technologa.
7. Wydanie zamraża aktywną wersję planu kontroli; zmiana planu nie zmienia kryteriów już użytych przy historycznym wyniku. Jeżeli specyfikacja lub okucie zmienią się, nowa rewizja jawnie wymaga nowego planu/punktu kontroli.
8. Na hali interfejs jest szybki: skan/wybór części → krótkie kryterium i rysunek → wynik → przy fail kod problemu i segregacja. Bez wymaganych danych lub przy braku połączenia nie oznaczać czeku jako zaliczonego. Ewentualna kolejka offline stosuje zasady idempotencji i konfliktów z istniejącego briefu offline.
9. Analizę przyczyn i działania zapobiegawcze wprowadzić dopiero przy mierzonej potrzebie. Startować od ograniczonego słownika powodów plus notatka, a nie rozbudowanego systemu statystycznego ani oceny pracownika.

## Priorytet, zależności i odbiór

- **P0:** zakres P0 z `RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`, trwałe wydanie/hash, audyt append-only oraz odtwarzalna kopia; tylko autoryzowane role mogą zatwierdzać wyjątek.
- **P1:** kontrolne punkty wersjonowane z wydaniem, wyniki, blokady, decyzje i poprawki; zależy od `RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md`.
- **P2:** dashboard trendów dla powtarzających się wad i skuteczności działań; wymaga wystarczająco spójnych zapisów i kodów przyczyn.

Kryteria dla Claude:

1. Test: kryterium ma normę i zakres tolerancji z zatwierdzonego punktu rewizji; wpis spoza zakresu zapisuje wynik fail wraz z faktycznym odczytem i jednostką. Aplikacja nie podmienia ani nie zaokrągla pomiaru tak, by zmienił pass/fail.
2. Wydanie 17 przechowuje kontrolę według planu 4. Edycja planu do wersji 5 nie zmienia wcześniej zapisanych wyników wydania 17.
3. Dla partii 6: wynik 4 OK, 1 fail, 1 oczekująca blokuje przekazanie pełnej partii jako gotowej; możliwe jest jawne przekazanie tylko 4 dobrych, jeśli reguła zakładu to pozwala.
4. Fail blokuje zależne operacje na danej ilości. Jedynie rola z zatwierdzonej polityki może wykonać odstępstwo; wyjątek zapisuje powód, zakres, użytkownika i timestamp oraz pozostaje widoczny w eksporcie karty.
5. Poprawka daje nowy powiązany wynik. Historia pierwotnego fail jest niezmienna; część wymaga ponownego zaliczenia wskazanego punktu kontroli.
6. W scenariuszu awarii/braku odpowiedzi ponowne wysłanie tego samego wyniku nie tworzy duplikatu; konflikt dwu kontrolerów nie usuwa wyniku ani nie pozwala cicho nadpisać decyzji.
7. Brak punktu kontroli lub brak źródłowej tolerancji jest widoczny jako „brak kryterium do zatwierdzenia”, a nie zielony wynik. Niekompletna dokumentacja nie zwalnia produkcji według reguł wydania.
8. Nie ma domyślnego limitu wymiarowego ani próbki losowej narzuconej przez kod; test potwierdza, że konfiguracja jest przypisana do wersji i można odtworzyć, kto ją zatwierdził.

## Niewiadome i dalsze badanie

Nie przeprowadzono obserwacji hali, nie znamy obecnych narzędzi pomiarowych, krytycznych cech, dopuszczonych wyjątków, liczby osób kontrolujących ani sposobu oznaczania odłożonych elementów. To wymaga krótkiego przeglądu z właścicielem/technologiem i pracownikiem; nie wymyślać za warsztat limitów, etapów, kodów wad ani częstotliwości. Ten brief nie wprowadza zmian prawnych, norm branżowych ani instrukcji producentów okuć.

## Punkt wznowienia

- Ostatnie świeże `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude w bieżącej kontroli.
- Poprzednie nowe briefy są na `codex/research-zmiany-projektu-2026-10-07`, nie na `main`.
- Następny temat: po sprawdzeniu nowych commitów i P0 autoryzacji, zbadać przepływ planowania montażu u klienta — checklistę gotowości miejsca, zależności dostaw i kolejności ekip — o ile nie ma go już w bieżących briefach. Nie dublować odbioru/reklamacji.
