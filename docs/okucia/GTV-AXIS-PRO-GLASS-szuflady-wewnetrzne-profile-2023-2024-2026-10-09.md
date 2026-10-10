# GTV Axis Pro GLASS — dane szuflad wewnętrznych z indeksowanych kart 2023/2024

## Aktualizacja: odczyt konfliktującego oficjalnego katalogu — 10.10.2026 00:35

Oficjalny [Drawer System AXIS PRO EN/PL (PDF)](https://gtv.com.pl/wp-content/uploads/2025/04/drawer-system-AXIS-PRO-EN_PL.pdf) jest już dostępny w indeksie dokumentów z ekstrakcją tekstu i struktur tabel. Na drukowanej s. 21, w tabeli „Glass panel for internal front”, ten sam kod `PB-AXISPRO-GLASS-PAWEW-A1` widnieje jako H=56, L=1200 mm, materiał `steel/stal`; kody B1 i C1 analogicznie podają H=88/139, L=1200 mm, `steel/stal`. To nie jest już tylko fragment podglądu wyszukiwarki: ekstrakcja indeksu PDF wskazuje stronę i tabelę. Nie udało się jednak pobrać zrzutu strony PDF (błąd cache przy screenshot), więc obrazu tabeli nie zweryfikowano pikselowo.

To pozostaje w bezpośrednim konflikcie z aktualnymi [kartami produktów GTV A1](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-PAWEW-A1/), [B1](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-PAWEW-B1/) i [C1](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-PAWEW-C1/) oraz z katalogiem [AXIS PRO ONLINE EN/PL](https://gtv.com.pl/wp-content/uploads/2025/04/AXIS_PRO_ONLINE_EN_PL-1.pdf): wszystkie te źródła podają odpowiednio 56/88/139 × 1100 mm i szkło (karty produktu: szkło niehartowane). Oba katalogi pochodzą z oficjalnej domeny GTV; z samej treści publicznej nie da się ustalić, czy to omyłka składu, rewizja produktu, czy inne znaczenie SKU. Nie wybierać wersji na podstawie nazwy pliku ani daty publikacji.

**Nowy status:** konflikt źródeł producenta potwierdzony jako konflikt zapisanych publikacji (pewność wysoka); nie ustalono, który parametr odpowiada towarowi obecnie dostarczanemu pod danym SKU. W zakupowym BOM należy zachować dokładne źródło i wyświetlić sprzeczność. Nie generować długości formatek ani CNC z 1100 lub 1200 mm bez identyfikacji partii/sku na opakowaniu i pisemnego wyjaśnienia GTV/dostawcy. Strona produktu dopuszcza przycięcie szkła, ale nie podaje tolerancji, krawędzi, bazy ani procesu obróbki.

**Priorytet:** P1 dla jakości źródeł i katalogu; P0 przed cięciem szkła/CNC. **Zależności:** zachować odpowiednie wydania PDF, porównać graficzną tabelę stron 20–21 obu katalogów, pozyskać od GTV/dostawcy potwierdzenie wersji dla dokładnego indeksu i fizycznego opakowania; następnie potwierdzić bazę/tolerancję i wykonać próbę. **Kryterium odbioru:** testy źródeł reprezentują obie oficjalne wartości i nie redukują ich do jednego pola; konfiguracja wyświetla konflikt i pozostaje bez wymiaru produkcyjnego do potwierdzenia dokładnego SKU/rewizji. Test nie może dopuścić do CNC z konfliktem `source_conflict`.

## Aktualizacja źródeł: oficjalne strony kart produktów, 09.10.2026 23:34

Bezpośrednie oficjalne karty produktów GTV doprecyzowują metadane trzech szklanych paneli:

| SKU GTV | Wysokość × długość podana przez GTV | Materiał podany przez GTV | Stan dowodu |
|---|---:|---|---|
| `PB-AXISPRO-GLASS-PAWEW-A1` | 56 × 1100 mm | szkło niehartowane | potwierdzone na [karcie GTV A1](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-PAWEW-A1/) |
| `PB-AXISPRO-GLASS-PAWEW-B1` | 88 × 1100 mm | szkło niehartowane | potwierdzone na [karcie GTV B1](https://gtv.com.pl/en/produkt/PB-AXISPRO-GLASS-PAWEW-B1/) |
| `PB-AXISPRO-GLASS-PAWEW-C1` | 139 × 1100 mm | szkło niehartowane | potwierdzone na [karcie GTV C1](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-PAWEW-C1/) |

Karty opisują możliwość przycięcia do wymaganej długości. Jest to potwierdzenie danych katalogowych elementu przez producenta, ale nie rysunek gotowego wymiaru dla konkretnego mebla: nie ustalono tolerancji, obróbki krawędzi, bazy pomiaru ani zasad bezpiecznego cięcia szkła. „Niehartowane” to literalna klasyfikacja materiału na stronie; aplikacja nie powinna z tego wywodzić dodatkowych twierdzeń o bezpieczeństwie.

### Konflikt w oficjalnym zbiorze dokumentów

Oficjalne strony A1/B1/C1 oraz plik [AXIS PRO ONLINE EN/PL](https://gtv.com.pl/wp-content/uploads/2025/04/AXIS_PRO_ONLINE_EN_PL-1.pdf) są zgodne co do długości 1100 mm i szkła. Podobne wartości indeksuje też oficjalny katalog kwartalny 2025 Q1/Q2. Natomiast [Drawer System AXIS PRO EN/PL](https://gtv.com.pl/wp-content/uploads/2025/04/drawer-system-AXIS-PRO-EN_PL.pdf) oraz jego EN/RU wariant w indeksie podają dla tych samych identyfikatorów 1200 mm i materiał stalowy. Bezpośrednie otwarcie PDF-ów w tym środowisku nie powiodło się (błąd HTTP 502/ograniczenie pobrania), zatem treść tego konfliktującego źródła znam tylko z indeksowanego podglądu. Konflikt należy zachować jako rozbieżność źródłową, a nie uśredniać ani nadpisywać po cichu.

Wniosek roboczy: dla zakupowego BOM można pokazać katalogowo potwierdzone A1/B1/C1 wraz z linkiem do dokładnej karty, statusem źródła i uwagą o konflikcie PDF. Nie zwalniać długości cięcia do CNC ani nie uznawać calloutu `S` za ostatecznie przypisany do SKU, dopóki nie porównano zachowanych grafik instrukcji z fizycznym elementem/próbą warsztatową. Odczyty `S={A:56,B:88,C:139}` z indeksu są spójne z wysokościami trzech kart produktu, lecz utożsamienie tabelarycznego `S` z wysokością konkretnych SKU pozostaje wnioskiem, a nie odczytem graficznego rysunku.

**Priorytet:** P1 dla odrębnego modelu wariantów, statusu źródeł i kompletacji zakupowej; P0 przed produkcyjnym CNC szkła. **Zależności:** zachować wizualne kopie/identyfikatory rewizji oficjalnych PDF, porównać rysunki A/B/C, potwierdzić bazę i tolerancję u producenta/dostawcy oraz wykonać próbę z właściwym szkłem. **Kryterium odbioru:** testy katalogu mapują dokładne SKU A1/B1/C1 na 56/88/139 × 1100 mm oraz `niehartowane`, ale pozostawiają formatkę/CNC w stanie `unverified` do jawnego potwierdzenia długości, bazy i obróbki; równocześnie pokazują konflikt 1200/steel z nazwanym dokumentem i nie wybierają go automatycznie.

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
