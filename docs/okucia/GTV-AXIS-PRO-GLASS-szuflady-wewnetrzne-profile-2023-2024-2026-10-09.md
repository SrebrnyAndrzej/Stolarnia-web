# GTV Axis Pro GLASS — dane szuflad wewnętrznych z indeksowanych kart 2023/2024

## Korekta nazewnictwa zestawów i materiałów — 10.10.2026 03:37

**Korekta wcześniejszego skrótu:** nie należy opisywać wszystkich wariantów `ZEWEW` jako „stalowego zestawu”. Aktualne oficjalne karty rozdzielają trzy pozycje, których nazwy łatwo pomylić:

| Rodzina indeksu | Co potwierdza karta producenta | Czego nie zakładać |
|---|---|---|
| `...GLASS-PAWEW-…` | Sam panel szklany frontu wewnętrznego; karta wariantu B1 podaje szkło niehartowane, 88 × 1100 mm, opakowanie 5 szt. | Długość magazynowa 1100 mm nie jest zatwierdzonym wymiarem gotowego cięcia ani wierceniem. |
| `...GLASS-ZEWEW-…` | Zestaw do szuflady wewnętrznej przeznaczony do frontu szklanego; karta B2 mówi wprost, że **nie zawiera panelu szklanego**, a zestaw zawiera panel aluminiowy i złączki frontu. | Nie mylić go ani z samą szybą PAWEW, ani z zestawem `ZESWEW`; nie opisywać całego kompletu jako wyłącznie stalowego. |
| `...ZESWEW-…` (bez `GLASS`) | Standardowy zestaw szuflady wewnętrznej; karta A2 podaje `PANELWEW-110 + WEWMOCA`, a wyższe zestawy mogą zawierać także reling — skład zależy od wariantu. | Nie zakładać, że każdy A/B/C/D ma ten sam skład; nie łączyć z glass-kitem `GLASS-ZEWEW` tylko na podstawie wspólnego fragmentu `ZEWEW`. |

**Dowód:** [PAWEW B1 (karta GTV)](https://gtv.com.pl/sk/produkt/PB-AXISPRO-GLASS-PAWEW-B1/) opisuje panel jako szkło niehartowane, 88 × 1100 mm, 5 szt./opak.; [GLASS-ZEWEW B2 (karta GTV)](https://gtv.com.pl/produkt/PB-AXISPRO-GLASS-ZEWEW-B2/) podaje, że szkła nie zawiera, i wymienia panel aluminiowy oraz złączki; [ZESWEW A2 (karta GTV)](https://gtv.com.pl/produkt/PB-AXISPRO-ZESWEW-A2/) wskazuje kod składników `PB-AXISPRO-PANELWEW-110 + PB-AXISPRO-WEWMOCA` oraz stal/aluminium. Oficjalny katalog [Q1+Q2 2026](https://gtv.com.pl/wp-content/uploads/2026/05/EN-Kwartalnik_AM_Q2.pdf) indeksuje PAWEW-A2/B2/C2 jako szkło 1100 mm i osobno używa zapisu `ZEWEW_B2` dla glass-kit; bezpośredni PDF jest za duży do otwarcia w tym środowisku, więc ten szczegół katalogowy pozostaje odczytem indeksu, a nie oględziną strony.

**Skutek dla katalogu aplikacji:** trzy rodziny muszą być osobnymi rekordami zakupowymi z pełnym kodem i URL źródła; glass-kit ma jawnie `glassIncluded=false`, a sam panel PAWEW jest oddzielną pozycją materiałową. W lokalnym `docs/okucia/produkty/katalog.json` nie znaleziono żadnej z tych rodzin. **Kryterium odbioru:** test katalogu odróżnia `PAWEW`, `GLASS-ZEWEW` oraz `ZESWEW`, nie scala ich po podobieństwie kodu; test glass-kit nie uznaje zestawu za zawierający szkło. Kody wariantów, kolorów ani opakowań wolno dodać wyłącznie dla kart, które potwierdzają je jawnie. Ceny, aktualna dostępność, dokładne cięcie/baza i CNC pozostają nieustalone.

## Aktualizacja: katalog Q2 2026 i brak SKU w migawce aplikacji — 10.10.2026 02:36

Najnowszy znaleziony oficjalny [katalog GTV Q1+Q2 2026](https://gtv.com.pl/wp-content/uploads/2026/05/EN-Kwartalnik_AM_Q2.pdf) ponownie wymienia PAWEW jako „Glass panel for internal front” z długością 1100 mm i wysokościami A=56, B=88, C=139 mm. To dodatkowo wspiera karty produktów i katalog ONLINE, a odróżnia go od 1200-milimetrowego zestawu ZEWEW/komponentów szuflady. Bezpośrednie otwarcie dużego PDF (ok. 38 MB) nie powiodło się w tym środowisku, więc odczyt jest z indeksowanej ekstrakcji/struktury katalogu, nie kontroli obrazu.

**Fakt z repozytorium:** wyszukanie dokładnych ciągów `PAWEW`, `ZEWEW` i `AXISPRO-GLASS` w `docs/okucia/produkty/katalog.json` (migawka katalogu) nie zwraca żadnego produktu. To oznacza, że sprawdzone SKU paneli i zestawów nie są obecnie reprezentowane w tej migawce zakupowej. Nie dowodzi to ich braku na rynku ani w dynamicznym źródle producenta.

**Problem dla użytkownika:** projektant nie może z tej migawki dodać dokładnego szklanego frontu i zestawu do BOM/zakupów; nazwy podobne do `ZEWEW`/`ZESWEW` lub ogólne „Axis Pro Glass” grożą pomieszaniem szkła, metalowych paneli/złączek i kompletów. **Zalecane zachowanie:** dodać osobne rekordy kandydujące PAWEW-A1/B1/C1 (szkło; H=56/88/139; stock L=1100; producent deklaruje możliwość przycięcia) i ZEWEW (zestaw/komponenty do szuflady; własne kody i atrybuty wg karty), zachowując URL, kod, wersję/rynek, czas sprawdzenia i konflikty. Nie używać cen ani dostępności bez potwierdzenia dostawcy; nie przypisywać produkcyjnej geometrii lub reguł cięcia z samych metadanych katalogowych.

**Priorytet:** P1 dla kompletności wyboru i BOM zakupowego; P0 przed zwolnieniem do CNC szkła. **Zależności:** dokładne karty wariantów/kolorów, rozstrzygnięcie nazwy SKU `ZEWEW`/`ZESWEW`, aktualna oferta dystrybutora, etykieta kupionego indeksu, osobna weryfikacja wymiaru cięcia i próba. **Kryterium odbioru:** kontrola katalogu zawiera oddzielne, źródłowe rekordy co najmniej dla potwierdzonych PAWEW-A1/B1/C1 i dokładnie tych wariantów ZEWEW, dla których karta potwierdza indeks; nie tworzy nieudowodnionych kolorów/SKU. Brak ceny/dostępności oznacza „niepotwierdzone”; test nie tworzy formatki CNC bez osobnej zweryfikowanej technologii i zatwierdzenia.

## Aktualizacja: rozdzielenie SKU panelu szklanego i zestawu — 10.10.2026 01:35

Porównanie oficjalnej instrukcji Glass 2024 z katalogiem AXIS PRO EN/PL i kartami produktów wyjaśnia najpewniej, skąd powstała rozbieżność:

- `PB-AXISPRO-GLASS-PAWEW-A1/B1/C1` to **same panele szklane frontu wewnętrznego**. Karty produktu GTV oraz katalog `AXIS_PRO_ONLINE_EN_PL-1.pdf` podają dla nich H=56/88/139 mm, długość wejściową 1100 mm i materiał szkło (na kartach produktu: szkło niehartowane); producent deklaruje możliwość przycięcia na wymaganą długość.
- `PB-AXISPRO-GLASS-ZEWEW-A1/B1/C1` to **zestawy do szuflady wewnętrznej pod front szklany**, osobne od szyby PAWEW. Aktualna karta B2 potwierdza, że zestaw zawiera panel aluminiowy i złączki, a **nie zawiera panelu szklanego**. Katalog/indeks podaje długość 1200 mm i zbiorczą informację o stali; nie traktować tego jako pełnego BOM materiałowego dla każdego elementu.
- Instrukcja Glass 2024 osobno pokazuje rysunek szklanego frontu z calloutem `S` oraz tabelą A/B/C = 56/88/139 mm; to mocno wspiera przypisanie `S` do wysokości PAWEW, choć grafika nie została obejrzana pikselowo. Dwa callouty `LW−80` i `LW−100` pozostają wymiarami różnych elementów rysunku — nie przypisywać ich do konkretnych części bez graficznego odczytu.

### Ocena konfliktu i rekomendacja katalogowa

Drukowana s.21 katalogu `drawer-system-AXIS-PRO-EN_PL.pdf` powtarza w tabeli nazwanej „Glass panel for internal front” te same PAWEW A1/B1/C1, lecz podaje L=1200 mm i `steel/stal`. Są to właśnie parametry zgodne z zestawami ZEWEW pokazanymi na poprzedniej stronie. Karty produktu GTV, katalog `AXIS_PRO_ONLINE_EN_PL-1.pdf` i instrukcja Glass 2024 rozdzielają role SKU i zgodnie wspierają 1100 mm/szkło dla PAWEW. **Hipoteza o błędzie składu/kopiowania tabeli s.21 jest silna, ale nadal niepotwierdzona przez GTV**; nie twierdzić, że producent oficjalnie sprostował dokument.

**Zachowanie:** katalog aplikacji ma modelować `GLASS-PAWEW` (szklany panel), `GLASS-ZEWEW` (zestaw do jego montażu bez szkła) i `ZESWEW` (standardowy zestaw, którego skład zależy od wariantu) jako oddzielne dokładne SKU/pozycje BOM, nawet gdy litera A/B/C jest ta sama. Dla PAWEW można użyć metadanych 1100 mm, szkła i wysokości 56/88/139 w doborze zakupowym, z odnośnikami do kart producenta. Wartości cięcia pozostają `unverified`: „można przyciąć” nie podaje tolerancji, krawędzi, bazy ani technologii zakładu. Rozbieżność katalogu EN/PL musi być widoczna w pochodzeniu danych jako konflikt publikacji, ale nie może unieważnić identyfikacji trzech różnych rodzin.

**Priorytet:** P1 dla prawidłowego wyboru zakupowego/BOM i pochodzenia; P0 przed emisją formatek CNC szkła. **Zależności:** zachować identyfikatory/rewizje PDF i kart produktów; do formatek pozyskać tolerancję i bazę cięcia od producenta/dostawcy oraz zatwierdzić próbę. **Mierzalne kryterium odbioru:** testy A/B/C nie mieszają `GLASS-PAWEW`, `GLASS-ZEWEW` i `ZESWEW`; panel glass-kit nie jest uznawany za szybę; dokładny skład standardowego `ZESWEW` zależy od SKU. PAWEW=1100 mm + szkło + S=56/88/139 pozostaje zakupowym opisem, nie gotowym wymiarem cięcia. Źródło EN/PL strony 21 pozostaje oznaczone jako konflikt dla PAWEW. Żaden przypadek nie może wygenerować zwolnionej formatki CNC bez osobno zweryfikowanej bazy/tolerancji i akceptacji próbki.

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
