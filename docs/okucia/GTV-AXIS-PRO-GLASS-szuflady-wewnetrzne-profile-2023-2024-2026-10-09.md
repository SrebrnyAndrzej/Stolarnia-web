# GTV Axis Pro GLASS — dane szuflad wewnętrznych z indeksowanych kart 2023/2024

09.10.2026. Wyszukiwanie oficjalnych materiałów GTV ujawniło osobne tabele dla standardowego panelu szuflady wewnętrznej oraz wariantu z panelem szklanym. Poniższe liczby odczytano z indeksowanych fragmentów/strukturalnego podglądu PDF, którego nie udało się otworzyć ani pobrać w tym środowisku (HTTP 502). **Status: trop źródłowy, niezweryfikowany wizualnie; nie używać jeszcze jako profilu produkcyjnego.**

## Źródła producenta

- [GTV AXIS PRO GLASS — instrukcja opisana jako 2023, załącznik `_13.pdf`](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_PRO_GLASS__%20instrukcja_A4_PL_EN_RU__skrocona__2023r_13.pdf): indeksowana treść przedstawia rysunek „Wymiary elementów szuflady wewnętrznej”, osobno sekcje `STANDARDOWA` oraz `SZKŁO / GLASS`, a także zestawy A/B/C.
- [GTV AXIS PRO GLASS — instrukcja opisana jako 2024, załącznik `_10.pdf`](https://files.gtv.com.pl/resource/assets/attachments/instrukcja/Axis_PRO_GLASS_%20instrukcja_A4_PL_EN_RU_2024r_10.pdf): indeksowany opis pokazuje wariant Glass i tabelę `S (mm)`; bezpośrednie otwarcie PDF zwróciło 502, więc nie ustalono, czy wszystkie liczby/etykiety są identyczne z wersją 2023.
- Oficjalna karta 2024 z rodziny GLASS, załącznik `_2.pdf`, również rozpoznaje tabele zestawów wewnętrznych: [PDF GTV](https://files.gtv.com.pl/resource/assets/attachments/karta_techniczna/Axis_PRO_GLASS__%20instrukcja_A4_PL_EN_RU__skrocona__2024r_2.pdf). Bezpośrednie pobranie/otwarcie nie powiodło się.
- Oficjalna karta produktu GTV dla zestawu A Glass, indeks `PB-AXISPRO-GLASS-ZEWEW-A`, opisuje zestaw jako panel aluminiowy i łączniki frontu; panel szklany nie jest dołączony: [GTV — zestaw A do frontu szklanego](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-ZEWEW-A/). Strona nie została pobrana do lokalnego archiwum. Karta PDF zapisuje kod wariantu z dodatkowym `S` (`...ZESWEW...`), więc identyfikatory dokumentu i karty produktu wymagają jawnego mapowania.

## Dane widoczne w indeksie — do wizualnego potwierdzenia

- Dla panelu standardowego źródło 2023 indeksuje zmienną `R` jako wysokość panelu i tabelę: A = 110 mm, B = 95 mm, C = 110 mm.
- Dla panelu szklanego źródło definiuje `LW` jako wewnętrzną szerokość korpusu i pokazuje w rysunku poprzeczne callouty `LW−80` oraz `LW−100`; tabela osobno podaje `S`: A = 56 mm, B = 88 mm, C = 139 mm.
- `R` i `S` są odrębnymi etykietami źródła dla różnych elementów/wariantów. Nie zamieniać ich ani nie przypisywać obu do jednej wysokości frontu.
- Indeksowane listy zestawów zawierają warianty kolorystyczne oraz osobne kody A/B/C; karta produktu A wyjaśnia, że szkło nie jest częścią zestawu. Dokładna relacja pomiędzy PDF SKU `...ZESWEW...`, kartą produktu `...ZEWEW...`, metalowym profilem, szkłem i pozostałymi łącznikami nie została zweryfikowana.
- W istniejącym briefie GTV o rozbieżnościach 2023/2024 odnotowano różne wysokości boków zewnętrznych. Nie należy z nich wnioskować, że powyższe wymiary panelu/szkła zmieniły się albo obowiązują wszystkie partie; potrzebne jest osobne porównanie wskazanych kart i dokładnych SKU.

## Wniosek dla Claude

**Problem:** jeden profil „Axis Pro” nie opisuje bezpiecznie standardowego Axis Pro, Axis Pro Glass oraz różnych frontów szuflad wewnętrznych. Zlanie danych grozi podaniem wymiaru panelu jako szkła lub zastosowaniem zestawu do niewłaściwego SKU/rewizji.

**Proponowane zachowanie:** modelować `Axis Pro`, `Axis Pro Glass` i szufladę wewnętrzną jako jawne, odrębne warianty danych źródłowych. Na razie zachować wyłącznie notatkę `candidate/unverified` dla tabel `R` i `S`; nie wprowadzać jej do aktywnych reguł cięcia. Utrzymać jawne mapowanie rynku, dokumentu/rewizji i kompletnego SKU, a dla konfiguracji nierozpoznanej zwracać `unknown` i blokować produkcyjne BOM/CNC.

**Priorytet:** P1 dla prawidłowego doboru systemu i części; P0 przed produkcyjnym BOM/CNC.  
**Zależności:** pobranie PDF 2023 i 2024 do kontrolowanego archiwum; porównanie grafik stron; potwierdzenie paneli A/B/C i SKU/koloru na kartach produktów; rozstrzygnięcie różnicy kodów `ZESWEW` vs `ZEWEW`; próbny zestaw/montaż.  
**Mierzalne kryterium odbioru:** po wizualnej weryfikacji test danych zachowuje osobno standardowe `R={A:110,B:95,C:110}` i szklane `S={A:56,B:88,C:139}` oraz niezależne callouty `LW−80`/`LW−100`; każde pole wskazuje stronę, wersję i SKU. Test dla nieznanej rewizji/kodu nie wybiera automatycznie profilu ani nie emituje zatwierdzonych wymiarów. Jeśli PDF-y różnią się, testy potwierdzają odrębność rewizji i pokazują konflikt zamiast nadpisywania.

## Punkt wymagający dalszej pracy

Następny krok to pozyskać zapisowalne kopie PDF-ów z oficjalnego endpointu i odczytać wizualnie strony z wymiarami oraz tabelą zestawów. Do czasu weryfikacji fakty z sekcji powyżej są **niezweryfikowanym odczytem indeksu wyszukiwarki**, nie podstawą cięcia szkła ani formatki. Nie ustalono tolerancji, wymiaru gotowego szkła, krawędzi/bazy, sposobu obróbki szkła ani kompletnego BOM.
