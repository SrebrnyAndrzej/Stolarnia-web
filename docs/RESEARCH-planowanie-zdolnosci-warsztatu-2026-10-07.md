# Planowanie zdolności warsztatu i wiarygodne terminy

Data: 2026-10-07  
Baza przeglądu: `origin/main` = `8230275ad6dea52109f581c793bdd8d6f08684d3`.  
Zakres: rozwinięcie P2 z `RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md` — rezerwacja zdolności stanowisk i ocena wykonalności terminów dla zleceń meblowych. To rekomendacja produktowa, nie gotowy harmonogram dla konkretnej stolarni.

## Wniosek

Zanim aplikacja poda termin jako wykonalny, musi znać dostępne godziny, zarezerwowaną pracę, kolejność operacji, dostępność materiału krytycznego i niepewność estymaty. Zsumowanie godzin wszystkich operacji albo proste dzielenie przez liczbę stanowisk nie wykrywa wąskiego gardła. Pierwszym etapem powinien być **widok obciążenia i plan ręczny z kontrolą konfliktów**, a nie obietnica w pełni automatycznego harmonogramu.

## Obecny zakres i ograniczenia

Wytyczne podróży produkcyjnej opisują kartę pracy, kroki marszruty, zależności, stanowisko oraz planowane i rzeczywiste czasy jako kolejny etap. W tym briefie nie powielam modelu karty ani śledzenia części. Koncentruję się na pytaniu: jak planista ustala, czy zasoby pozwalają ukończyć kartę w danym terminie.

Statyczny przegląd wskazanych plików nie znalazł obecnie w `src/core/types.ts` modelu zasobu produkcyjnego, kalendarza zmian ani rezerwacji czasu stanowiska. W `RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md` tablica obciążenia i planowane/rzeczywiste czasy są jawnie wskazane jako P2. Wymaga to ponownego sprawdzenia, gdy Claude doda planowanie.

## Dowody ze źródeł pierwotnych

- Microsoft opisuje planowanie finite capacity jako uwzględnianie już zarezerwowanej dostępności zasobów; przy braku miejsca termin jest przesuwany. Konfigurację należy włączyć osobno dla planu i każdego zasobu. Dokument ostrzega, że obliczenia tracą wiarygodność, jeśli pojemność zasobu zmienia się w trakcie, np. przez niestałe zmiany. [Microsoft Learn — finite capacity planning and scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/master-planning/planning-optimization/finite-capacity)
- Microsoft rozróżnia harmonogramowanie operacji od szczegółowego planowania jobs: dokładniejszy wariant rozbija operacje na zadania i pilnuje, by przedziały czasu na tym samym zasobie się nie nakładały. Dostępność materiałów może być dodatkowym ograniczeniem wejścia do operacji. [Microsoft Learn — job scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/job-scheduling)
- Dokumentacja Odoo rozdziela zdolność stanowiska (ile jednostek może być wykonywanych równolegle), efektywność czasu względem normy i OEE. OEE opisuje udział czasu produktywnego, ale wymaga prawidłowo ustawionych danych wejściowych. To użyteczna taksonomia, nie gotowe normy dla tej firmy. [Odoo — OEE](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/reporting/oee.html), [Odoo — work centers](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/manufacturing/advanced_configuration/using_work_centers.html)
- Microsoft podaje, że operacje mogą być planowane w przód od daty rozpoczęcia albo wstecz od wymaganej daty zakończenia; dostępność materiału i zasobu może przesunąć start. [Microsoft Learn — operations scheduling](https://learn.microsoft.com/en-us/dynamics365/supply-chain/production-control/operations-scheduling)

## Minimalny model pojęciowy

1. **Zasób/stanowisko:** typ pracy, konkretne stanowisko lub zasób równoważny, kalendarz roboczy, dostępny przedział, pojemność równoległa, reguła wyłączności i zatwierdzone wyjątki. Stanowisko może być piłą, okleiniarką, CNC albo grupą ręcznego montażu; faktyczny podział ustala zakład.
2. **Operacja planowana:** karta produkcyjna i niezmienne wydanie, krok marszruty, ilość/partia, poprzedniki, wymagane kwalifikacje/maszyny, estymata czasu przygotowania i czasu pracy, jej źródło/pewność oraz warunek materiałowy.
3. **Rezerwacja:** zasób, start/koniec, ilość zarezerwowanej zdolności, status (`propozycja`, `potwierdzona`, `w toku`, `zakończona`, `zwolniona`) i aktor. Sama propozycja nie blokuje bezterminowo stanowiska.
4. **Kalendarz wyjątku:** urlop, awaria, serwis, brak obsady, święto lub blokada dostawy; zapis z zakresem czasu, powodem, właścicielem i datą. Nie traktować braku wpisu o przestoju jako dowodu pełnej dostępności.
5. **Estymata vs obserwacja:** zachować wartości planowane i rzeczywiste oddzielnie. Czas wykonania służy do poprawy normy po zatwierdzeniu, ale nie powinien automatycznie karać konkretnego pracownika ani zmieniać otwartych terminów bez akceptacji planisty.

## Proponowany sposób działania

### P0 — plan jawny i bez fałszywych obietnic

- Pokaż tygodniowe obciążenie zasobu jako liczbę dostępnych i już zarezerwowanych godzin wraz z listą zadań oraz zależności. Konflikt to konkretne nakładające się rezerwacje lub przekroczenie znanej pojemności, nie czerwony kolor bez wyjaśnienia.
- Odróżnij **termin żądany przez klienta**, **wewnętrzny cel warsztatu**, **termin prognozowany przez plan**, **termin potwierdzony przez właściciela** i **rzeczywisty odbiór**. Kalkulacja nie zatwierdza zobowiązania wobec klienta.
- Jeśli nie ma kalendarza, czasu normatywnego, obsady, potwierdzenia materiału lub kolejności kroków, wynik brzmi „brak danych do wiarygodnej prognozy”, nie „mieści się”. Pokaż brakujący warunek i pozwól zaplanować ręcznie z widocznym ostrzeżeniem.
- Nie zakładaj, że wszystkie stanowiska mogą pracować jednocześnie ani że pracownik/maszyna jest zawsze dostępny. Konfiguruj zdolność równoległą i wyłączność osobno.
- Planowanie wsteczne ma być podglądem wykonalności od terminu docelowego; planowanie w przód — prognozą najwcześniejszego ukończenia od dostępnego startu. Gdy brak zdolności, pokaż pierwszy konflikt/bottleneck oraz przyczynę przesunięcia.
- Rezerwacje mają wersję i widoczny stan. Zmiana marszruty, czasu, ilości, wydania technicznego lub dostępności materiału oznacza „plan wymaga przeliczenia”; nie przestawia potwierdzonych zleceń po cichu.

### P1 — kalibracja na danych warsztatu

- Zbieraj plan/wykonanie dla operacji i partii z okresem, typem produktu i zasobem; oddziel czas przezbrojenia/ustawienia od czasu przetwarzania, jeśli pomiar da się rzetelnie zebrać.
- Estymaty oparte na małej próbce oznaczaj jako wstępne; właściciel/technolog zatwierdza normę. Podaj liczbę obserwacji i zakres rozrzutu, zamiast ukrywać zmienność w jednej pozornie precyzyjnej liczbie.
- Pozwól na jawny bufor planistyczny dla prac niestandardowych/poprawek, ale przechowuj jego powód. Nie utożsamiaj bufora z gwarancją terminu.
- Dopiero po rejestrowaniu operacji, wyjątków i braków materiałowych analizuj wąskie gardła, terminowość, przeplanowania i dokładność prognoz.

## Priorytet, zależności i kryteria odbioru

| Priorytet | Wniosek | Zależności | Kryterium odbioru |
|---|---|---|---|
| P0 | Widok obciążenia uwzględnia kalendarz, potwierdzone rezerwacje, zależności i pojemność równoległą | Uwierzytelnienie/ACL, karta pracy i marszruta, trwałe rezerwacje oraz kalendarz | Test fikstur wykrywa nakładanie dwóch wyłącznych prac na jednym zasobie; prace na dwóch niezależnych stanowiskach mogą się pokrywać; wynik pokazuje dokładne przyczyny konfliktu |
| P0 | Prognoza terminu jest odróżniona od zobowiązania klientowskiego i fail-closed przy brakach danych | Pola terminów, polityka zatwierdzania, estymaty | Brak czasu/kalendarza/materiału daje jawny stan „nieznane”; wyliczenie terminu samo nie zmienia terminu klienta ani zaakceptowanej umowy |
| P0 | Przeliczenie po zmianie danych nie przesuwa potwierdzonych zleceń bez decyzji planisty | Audyt zmian i snapshoty | Zmiana wydania/ilości/dostawy tworzy różnicę do zatwierdzenia; test sprawdza niezmienność poprzedniego planu i historii rezerwacji |
| P1 | Normy czasu są oddzielone od pomiarów wykonania i wersjonowane | Zdarzenia hali, identyfikacja aktora/zasobu, zatwierdzenie normy | Każda norma ma źródło/wersję i próbkę; korekta normy nie przepisuje czasów w zakończonych kartach |
| P1 | Raport mierzy jakość prognoz i wąskie gardła, nie ukryty ranking osób | Kilka tygodni poprawnych danych, decyzja właściciela | Co miesiąc raportuje odchylenie prognoza–wykonanie i przyczyny przeplanowania na poziomie operacji/zasobu; nie publikuje rankingu pracowników |

## Czego nie przesądzać

- Nie ma podstaw do przyjęcia norm czasu cięcia, okleinowania, wiercenia ani montażu w tej stolarni; muszą pochodzić z obserwacji lub zatwierdzonego pomiaru zakładu.
- Nie wiadomo, czy warsztat chce planować osoby, maszyny, gniazda, partie, czy tylko terminy projektów. To wymaga krótkiego warsztatu z właścicielem i zespołem.
- Microsoft/Odoo opisują rozbudowane systemy produkcyjne. Są źródłami wzorców pojęciowych, a nie dowodem, że mała stolarnia powinna wdrożyć pełne MES/APS/OEE.
- Brak kalendarza albo danych o pracach poza aplikacją ogranicza prognozę do widocznego wycinka; UI ma wskazywać zakres, którego harmonogram nie obejmuje.

## Punkt wznowienia

W tej iteracji `origin/main` pozostał na `8230275ad6dea52109f581c793bdd8d6f08684d3`; nie wykryto nowych commitów Claude. Brief rozwija wskazany już etap P2 tablicy obciążenia i czasów, nie dodaje logiki ani danych firmowych. Następnie: ponownie pobrać `origin/main`; przy pierwszej implementacji rezerwacji przejrzeć współbieżne przydziały, ACL, nadpisania kalendarza i niezmienność zaakceptowanych/zwolnionych wydań. Ostatni analizowany commit `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`.
