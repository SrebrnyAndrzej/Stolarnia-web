# Zmiana zakresu projektu po akceptacji i w trakcie realizacji

Data: 2026-10-07  
Stan repozytorium podczas przeglądu: `8230275ad6dea52109f581c793bdd8d6f08684d3` (`origin/main`)  
Zakres: rekomendacje do przepływu zmian klienta po akceptacji i po uruchomieniu zakupów/produkcji. Nie zmieniać logiki ani dokumentów klienta w ramach tego researchu.

## Problem i granica istniejących ustaleń

Repo ma już trzy ważne elementy: akceptacja klienta wskazuje niezmienny zakres i rewizję (`RESEARCH-akceptacja-klienta-wersja-i-zakres-2026-10-05.md`), wydanie produkcyjne zamraża dane i dokumentację, a karta pracy ma rozstrzygać różnice, gdy pojawi się nowsze wydanie (`RESEARCH-karta-podrozy-i-postep-produkcji-2026-10-06.md`). Nie należy dublować tych funkcji.

Pozostaje jednak pytanie operacyjne pomiędzy nimi: gdy klient zgłosi zmianę po akceptacji, jak zarejestrować jej wpływ na materiały już zamówione, części wycięte lub pracę już rozpoczętą; kto wycenia i zatwierdza skutki; i która rewizja nadal obowiązuje na stanowisku. Samo utworzenie nowej rewizji nie daje kompletnego, przejrzystego obiegu tej zmiany.

## Dowody z oficjalnych źródeł

- Odoo PLM opisuje Engineering Change Order (ECO) jako kontrolowany wniosek ze wskazaniem, co się zmienia, przypisaniem odpowiedzialnego, wersją roboczą BoM i odróżnieniem zmian od wersji produkcyjnej. Proponowane zmiany można przeglądać, zatwierdzać, a do produkcyjnej BoM trafiają dopiero po zatwierdzeniu. Historia zachowuje stare wersje i załączone pliki. [Odoo 18 — Engineering Change Orders](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/plm/manage_changes/engineering_change_orders.html), [Odoo 18 — Version control](https://www.odoo.com/documentation/18.0/applications/inventory_and_mrp/plm/manage_changes/version_control.html)
- Autodesk opisuje Change Order z numerem śledzenia, wymaganymi zatwierdzającymi, powodem i opisem zmiany, priorytetem, listą dotkniętych elementów, załącznikami i workflow. To potwierdza praktyczną wartość jawnego zakresu wpływu i właściciela zmiany, a nie tylko numerowania rewizji. [Autodesk Fusion Manage — Change orders](https://help.autodesk.com/view/fusion360/ENU/?contextId=MNG-COS-OVERVIEW)

Źródła dokumentują wzorce w systemach PLM, nie narzucają małej stolarni pełnego PLM ani konkretnej procedury handlowej. Poniższe zachowania są rekomendacją projektową opartą o te wzorce i obecne snapshoty aplikacji.

## Proponowane zachowanie

**P1, po P0 uwierzytelnieniu/uprawnieniach i trwałym wydaniu produkcyjnym.** Dodać lekki rekord „zmiana do projektu” wiążący żądanie klienta z wersją bazową, zamiast edytować zatwierdzone wydanie lub umowę.

1. Zapisuje zgłaszającego/kanał, datę, opis, powód, odpowiedzialnego i dokładną rewizję bazową. Wniosek ma stany: nowy, ocena wpływu, oczekuje na decyzję, zatwierdzony do wdrożenia, odrzucony/anulowany, wdrożony. „Zatwierdzony przez klienta” i „zwolniony do produkcji” to różne decyzje.
2. Osoba odpowiedzialna tworzy porównanie: elementy/okucia/rysunki, które się zmieniają; elementy i operacje już rozpoczęte lub ukończone; materiały zamówione/przyjęte; dokumenty klienta objęte zmianą. Nie liczyć wpływu automatycznie, dopóki nie ma wiarygodnych stanów tych procesów.
3. Zapisuje ocenę kosztu i terminu jako osobne pola: materiał już poniesiony, koszt pracy/utraty lub ponownego wykonania (jeśli warsztat to mierzy), dodatkowy koszt/sprzedaż dla klienta, wpływ na termin, niepewność i autor oceny. Brak danych jest jawny; aplikacja nie wymyśla wartości ani nie modyfikuje ceny uzgodnionej.
4. Wymaga decyzji właściciela/wyznaczonej roli dla skutków handlowych i technologa dla nowego wydania. Jeżeli zakres/cena/termin wobec klienta się zmienia, powstaje nowy snapshot oferty/akceptacji; historyczna umowa i poprzednie akceptacje pozostają nietknięte.
5. Po zatwierdzeniu tworzy kolejne wydanie. Karta pracy wskazuje, które pozycje są nadal użyteczne, wstrzymane, zastąpione albo wymagają poprawki. Brak automatycznego przepięcia rozpoczętych części i już zarejestrowanych zdarzeń. Każda decyzja dyspozycji ma aktora i powód.
6. Na hali bieżące zadanie pokazuje numer/rewizję obowiązującą. Zastąpiona rewizja oznaczona jest „nie używać do nowych operacji”; istniejące rekordy pozostają widoczne jako historia. Jeżeli pracownik jest offline, zgodnie z obecnym briefem awaryjnym nie wolno udawać, że zna nowszą zmianę.

## Zależności i ryzyko

- Zależności: konta/ACL, niezmienny snapshot i oryginalny PDF, audyt append-only, rewizje produkcyjne, karta pracy, zamówienia i przyjęcia magazynowe. Zakres zakupów zależy od wdrożenia `RESEARCH-magazyn-zakupy-zapotrzebowanie-2026-10-06.md`.
- Ryzyko: przedwczesne wdrożenie może dać pozór automatycznej kalkulacji kosztu zmiany mimo niepełnego pomiaru rzeczywistego zużycia i nakładu pracy. W pierwszej wersji lepsza jest jawna ręczna ocena z opisanym źródłem niż pozorna precyzja.
- Hipoteza do sprawdzenia z właścicielem/pracownikiem: częstotliwość zmian po akceptacji i typowe momenty, w których powodują koszt (po zakupie, rozkroju, okleinowaniu, montażu). Nie zakładać wartości oszczędności bez pomiaru.

## Priorytet i kryteria odbioru dla Claude

1. **P1:** można zarejestrować wniosek do rewizji 5 i utworzyć rewizję 6; poprzednie zatwierdzenie i pliki nadal odtwarzają dokładnie rewizję 5.
2. **P1:** zatwierdzenie zmiany przez klienta nie zwalnia jej do produkcji; nowe wydanie wymaga odrębnej kontroli technicznej i wymaganych akceptacji.
3. **P1:** w scenariuszu, gdzie 3 pozycje są ukończone, 2 rozpoczęte, a 4 nierozpoczęte, nowa rewizja pokazuje wszystkie 9 i wymaga jawnej dyspozycji; nie kasuje ani nie przepisuje historii.
4. **P1:** po utworzeniu rewizji 6, nowe rozpoczęcie pracy na rewizji 5 jest zablokowane lub wymaga jawnego uprawnionego wyjątku i przyczyny; wyjątek jest widoczny w audycie.
5. **P1:** brak kalkulacji wpływu kosztu/terminu pozostaje „nieoceniony”, a nie zerowy; system nie zmienia `cenaUzgodnionaBrutto`, umowy ani faktów historycznych po samym zgłoszeniu zmiany.
6. **P2:** po pomiarze warsztatowym raportuje się liczbę zmian według etapu i przyczynę, czas od zgłoszenia do decyzji, liczbę pozycji wstrzymanych/poprawek oraz rzeczywiście zarejestrowane skutki kosztowe. Zanim zbierze się wiarygodne dane, nie przedstawia wskaźników jako oszczędności.

## Następny krok i punkt wznowienia

- Ostatnio sprawdzona rewizja: `8230275ad6dea52109f581c793bdd8d6f08684d3`; w tym przebiegu brak nowego commitu Claude względem poprzedniego przeglądu.
- Brief przygotowuje wyłącznie wymagania; nie zmienia kodu, produkcyjnej bazy, umów ani cen.
- Następny temat researchu: ścieżka dostępu i minimalizacja danych przy udostępnianiu zewnętrznym podwykonawcom (np. stolarz/CNC/monter) — zakres rysunków i dokumentów, wygaśnięcie dostępu, odwołanie, ślad pobrań; najpierw sprawdzić, czy został pokryty w aktualnych briefach auth, prywatności i eksportów.
