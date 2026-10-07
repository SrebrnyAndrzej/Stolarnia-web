# LEGRABOX — odnaleziony arkusz wzoru wiercenia frontu

Data sprawdzenia: 07.10.2026. Baza repozytorium: `8230275` (brak nowych commitów `origin/main` po odświeżeniu). To aktualizacja indeksu źródeł, nie odczyt wymiarów ani aprobata produkcyjna.

## Potwierdzony fakt ze strony producenta

Oficjalna strona Blum USA [LEGRABOX — Downloads & videos](https://www.blum.com/us/en/products/boxsystems/legrabox/downloads-videos/) w sekcji „Technical data sheet” wymienia:

- „LEGRABOX drawer front boring pattern”, PDF 137 KB, data strony 02-07-2024;
- „LEGRABOX Drawer component preparation”, PDF 181 KB, data strony 07-02-2026.

Strona podaje ponadto osobne aktualne instrukcje montażu LEGRABOX oraz odsyła do Product Database i EASY ASSEMBLY jako usług Blum. Są to fakty o katalogu źródeł, nie o geometrii otworów.

## Ograniczenie pozyskania

Link z karty arkusza prowadzi do oficjalnego endpointu Blum `https://www.blum.com/file/lbxfrdrill_td_dok_bus?country=us&language=en`. W tej sesji próba pobrania przez dostępny podgląd zakończyła się „Cache miss”. Nie udało się uzyskać ani obejrzeć PDF; jego zawartości, schematu, wariantów i wymiarów nie weryfikowano. Nie przenosić liczb z wyników wyszukiwania/fragmentów do reguł produkcyjnych.

Link do drugiego pliku prowadzi do `cme224466_td_dok_bus_$sen-us_$aof_$v1.pdf`, lecz również nie jest dostępny w podglądzie. Sama data strony nie dowodzi rewizji technicznej zawartości ani zgodności z polskim wariantem produktu.

## Zalecenie dla Claude

1. Dodać ten arkusz do kolejki źródeł LEGRABOX jako istniejący, lecz niepozyskany i niezweryfikowany; nie opisywać go jako „brakującego u producenta”.
2. Pozyskać plik z oficjalnego źródła Blum (portal strony, Product Database / EASY ASSEMBLY albo pobranie ręczne) i zapisać URL, rynek/język, nazwę, rewizję/identyfikator, datę pozyskania oraz SHA-256.
3. Dopiero po renderowaniu i wizualnym sprawdzeniu stron opisać każdą operację: wariant frontu, SKU, baza, oś, rozstaw, średnica, głębokość, typ mocowania i warunki zastosowania. Rozdzielić otwory alternatywne od wymaganych.
4. Jeśli arkusza nie da się pozyskać, pozostawić otwory frontu LEGRABOX jako jawny brak danych i blokadę zatwierdzenia produkcyjnego.

**Priorytet:** P1 dla pozyskania (otwory frontu są na liście otwartych danych CNC); P0 dla samego bezpieczeństwa: nie generować niezweryfikowanych operacji.

**Zależności:** identyfikacja dokładnego profilu/rodziny LEGRABOX, system mocowania i wariant frontu; kontrola lokalnego PDF i zgodności rysunku z instrukcją montażu.

**Kryterium odbioru:** źródłowy PDF istnieje w repozytorium z SHA-256 i udokumentowanym odczytem; testy sprawdzają przynajmniej dwa warianty frontu lub potwierdzają ograniczony zakres. Dopóki to nie nastąpi, API/lista operacji jawnie zwraca „brak zweryfikowanych danych” i `production_approved=false` dla operacji zależnych od tego wzoru.

## Następny krok

Ponowić pozyskanie arkusza w oficjalnej bibliotece Blum lub Product Database; po pozyskaniu zestawić go z lokalnym `BLUM-Legrabox-planowanie.pdf` i z odczytem frontu wewnętrznego w `LEGRABOX-M-front-weryfikacja-2026-10-01.md`. Nie zmieniać obecnych wymiarów ani statusów produkcyjnych na podstawie samego indeksu źródeł.
