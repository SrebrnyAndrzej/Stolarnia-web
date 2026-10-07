# LEGRABOX standard N/K oraz wysoki front C — częściowy odczyt plansz Blum

Data odczytu: 07.10.2026. Odczyt wizualny lokalnego dokumentu producenta; bez zmian logiki ani zwolnienia wierceń do produkcji.

## Źródło i zakres

Dokument: `docs/okucia/pdf/BLUM-Legrabox-planowanie.pdf`, 100 stron, SHA-256 `7537f2530257e4e56a08de0398dd825465c4262e54a63ee5b16cd596f779421a`. Oficjalny adres: https://www.blum.com/file/lbx0264-ep-390_ep_dok_bau?country=pl&language=pl . Wizualnie sprawdzono strony PDF 11 (standard N), 23 (standard K) i 29–30 (wysoki front C). Wnioski dotyczą wyłącznie tych pokazanych konfiguracji.

## Dno standard N i K

Obie plansze N/K pokazują płytę wiórową 16 mm. W tabeli: tylna drewniana ścianka N ma wysokość 39 mm, K — 101 mm; jej szerokość to `LW − 38 mm`. Dno ma długość `NL − 10 mm`. Widok „Wymiary nawiertów — dno szuflady” pokazuje otwór 24 mm od końca, kolejne pozycje w podziałce 128 mm oraz wymiar 48,5 mm poprzecznie do krawędzi płyty. To odczyt oznaczeń z rysunku, nie kompletna specyfikacja operacji: plansza nie podaje w tym widoku średnicy, głębokości, tolerancji ani jawnego kierunku/bazy dla wszystkich osi. Nie generować z tych trzech liczb pełnego programu CNC ani wierceń korpusu.

**Ważne rozdzielenie wariantów:** standard N/K ma własne plansze; nie przenosić automatycznie na szufladę wewnętrzną. W starszym odczycie strony 19 dla LEGRABOX *inner drawer M* zanotowano inne oznaczenie poprzeczne — 18,5 mm — i ograniczenia interpretacji (`docs/okucia/LEGRABOX-M-front-weryfikacja-2026-10-01.md`). To inny wariant, a nie sprzeczna wartość do uśrednienia.

## Mocowania wysokiego frontu C — identyfikacja części, nie wzór otworów

Strona 29 zestawia dla wysokiego frontu C mocowania: EXPANDO `ZF7C70E2`, EXPANDO T `ZF7C70T2` i wkręty `ZF7C7002`, po 2 sztuki. Pokazuje też alternatywny wariant 4a, po 4 sztuki: `ZF7M70E2`, `ZF7M70T2` lub `ZF7M7002`. Strona 30 potwierdza kontekst „LEGRABOX free | Szuflada z wysokim frontem – wysokość C” oraz komponenty konfiguracji; nie zawiera tu płaskiego wymiarowego wzoru wiercenia frontu. Nie wnioskować, że wariant 4a jest zawsze wymagany albo że jego kod M zmienia geometrię — trzeba dobrać go do wskazanej konfiguracji i potwierdzić pełnym źródłem producenta.

## Wnioski dla danych i bezpieczeństwa produkcji

- Rozdzielić profil części, wysokość N/K/C, typ szuflady (standard/wewnętrzna/free), rodzaj mocowania frontu i liczbę mocowań. Nie używać jednego wymiaru lub SKU jako globalnej reguły LEGRABOX.
- Strony 11 i 23 są użytecznym częściowym źródłem dla BOM/wymiarów drewna i rysunku nawiertów dna N/K; nie stanowią pełnego postprocesora CNC.
- Pozostawić `production_approved=false` dla wierceń dna i frontu, dopóki nie ma zweryfikowanych baz, średnic, głębokości, tolerancji i testu montażowego. Osobny brief standard M nadal nie ma kompletnego X ani wszystkich parametrów otworów.

**Priorytet:** P0 nie generować produkcyjnych wierceń z częściowego szkicu; P1 zachować rozróżnienie standard/wewnętrzna/free oraz wysokość i SKU mocowania.

**Zależności:** pełna plansza/odrębna instrukcja wiercenia dla konkretnego mocowania frontu; katalog komponentów dla wariantu; jednoznaczne bazy detalu i próba montażowa.

**Mierzalny odbiór:** test danych potwierdza, że N i K pobierają właściwą wysokość pleców (39/101 mm) oraz formuły LW−38 i NL−10, a rodzina `inner_drawer` nie dziedziczy automatycznie oznaczenia 48,5 mm; wynik wiercenia bez średnic/głębokości/tolerancji pozostaje jawnie niezatwierdzony. Dla C walidacja rozróżnia SKU 2-sztukowe C od alternatywy 4-sztukowej z tabeli, bez deklarowania współrzędnych CNC.

## Punkt wznowienia

`origin/main=8230275`, brak nowych commitów Claude w tym przebiegu. Sprawdzone plansze w tej migawce PDF; nie potwierdzano dostępności nowszej rewizji. Renderowane podglądy QA są tymczasowe i nie wchodzą do repozytorium. Następnie: pozyskać/odblokować producentowski arkusz „LEGRABOX drawer front boring pattern” oraz sprawdzić otwory prowadnic od przedniej krawędzi dla każdej NL.
