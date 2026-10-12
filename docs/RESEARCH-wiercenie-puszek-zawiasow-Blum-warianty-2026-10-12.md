# Profil wiercenia puszki zawiasu Blum musi rozróżniać warianty

Data sprawdzenia źródeł: 12.10.2026. Zakres: głębokość otworu puszki frontowej dla wskazanych grup CLIP top BLUMOTION. To wymaganie danych produkcyjnych, nie pełna specyfikacja wszystkich otworów zawiasu.

## Zweryfikowane fakty

- Aktualna polska strona producenta dla systemu [CLIP top BLUMOTION — obróbka i montaż](https://www.blum.com/pl/pl/products/hingesystems/clip-top-blumotion/assembly/) podaje ogólną zasadę rodziny: ten sam wzór wiercenia co CLIP top, przy czym głębokość wiercenia puszki zmienia się na 13 mm.
- Polska strona producenta [CLIP top BLUMOTION — przegląd](https://www.blum.com/pl/pl/products/hingesystems/clip-top-blumotion/overview/) wyróżnia zawias 107° z płytką głębokością wiercenia 11,5 mm i podaje kompatybilność z frontami od 15 mm grubości; opisuje go także jako wygięty wariant do drzwi bliźniaczych.
- Oficjalna karta producenta [CLIP top BLUMOTION 107°, ID20203](https://d2.blum.com/services/BEC003/iak0203-id20203_at_dok_bau_%24sen-sg_%24aof_%24v7.pdf) potwierdza wprost otwór puszki 11,5 mm dla drzwi o grubości co najmniej 15 mm, kąt 107° oraz numery artykułów m.in. 75B1550, 75B1650, 75B1750, 75B1580, 75B1680, 75B1780 i warianty 75B…E.
- Osobny oficjalny folder producenta [CLIP top BLUMOTION 107°](https://d2.blum.com/services/BEC003/clp0014-ep-239_ep_dok_bau_%24sen-th_%24aof_%24v2.pdf) powtarza 11,5 mm, min. 15 mm i podaje zastosowania nakładane, bliźniacze oraz wpuszczane. Nie należy traktować tych zastosowań jako jednego uniwersalnego układu frontu.

**Wniosek liczbowy:** nie wpisywać jednej głębokości dla całej marki ani nawet dla całej nazwy handlowej CLIP top BLUMOTION. Oficjalne materiały rozróżniają regułę rodziny 13 mm i konkretną gałąź 107° z 11,5 mm. Różnica wynosi 1,5 mm i ma znaczenie przy cienkim froncie; liczby odnoszą się do głębokości otworu puszki, nie do głębokości wszystkich wkrętów lub otworów prowadnika.

## Rekomendacja dla Claude

**Problem:** reguła „Blum” lub jedna głębokość puszki może wywiercić zbyt głęboko front albo wygenerować profil, który nie odpowiada rzeczywistemu zawiasowi. Sama wspólna nazwa systemu i zgodność planu otworów nie gwarantują zgodności głębokości.

**Proponowane zachowanie:** profil produkcyjny zawiasu wybierać po numerze artykułu / dokładnym wariancie, a nie wyłącznie po marce lub rodzinie. Przechowywać odrębnie co najmniej: średnicę i pozycję puszki, głębokość jej wiercenia, dopuszczalną grubość frontu, metodę mocowania puszki, kąt i typ nałożenia. Osobno opisywać wiercenia ramienia/płytki w korpusie. Brak numeru artykułu lub autorytatywnego rysunku oznacza geometrię niezweryfikowaną i blokuje CNC; nie nadpisywać istniejącego profilu po cichu.

**Priorytet:** P0 przed wydaniem wierceń frontu/CNC; P1 dla kompletności katalogu okuć.

**Zależności:** wybrany numer zawiasu, wariant mocowania, grubość i materiał frontu, właściwy aktualny dokument Blum, profil wiercenia korpusu/płytki oraz postprocesor docelowej maszyny.

**Mierzalne kryteria odbioru:**

1. Fixture dla zweryfikowanego wariantu 107° generuje głębokość puszki 11,5 mm i odrzuca front cieńszy niż 15 mm; test sprawdza, że wartość nie jest odziedziczona z domyślnego profilu 13 mm.
2. Fixture dla innego, konkretnie wskazanego CLIP top BLUMOTION respektuje jego dokumentowaną głębokość 13 mm; brak numeru wariantu nie może automatycznie dostać wartości 13 mm ani 11,5 mm.
3. Plik CNC i rysunek frontu pokazują średnicę, głębokość, odległość od krawędzi, SKU/artykuł, źródło i rewizję; oddzielne otwory płytki korpusowej zachowują własny profil.
4. Zmiana SKU/artykułu unieważnia zależne zatwierdzenie wierceń i wymusza ponowną walidację; regresja testowa wykrywa przypadkowe użycie profilu siostrzanego.

**Granice:** źródła potwierdzają opisane wartości dla wskazanych materiałów producenta. Nie weryfikują pozostałych wariantów Blum, dokładnych współrzędnych CNC dla danego zakładu ani tego, jaki zawias jest aktualnie wybrany w projekcie. Nie wpisywać współrzędnych otworów na podstawie samej tej notatki; sprawdzić właściwy rysunek artykułu i maszynę.

## Przegląd implementacji na `origin/main` 8230275a (2026-10-12)

**Fakty z kodu:** `src/core/settings.ts:70-78` ustawia domyślnie puszkę Ø35 × 13 mm, oś 22,5 mm od krawędzi i jedno pole `zawiasyZatwierdzone=false`. `src/core/technologia.ts:132-142` publikuje stałe identyfikatory `zawias.puszka35@1` i `zawias.prowadnik.s32@1`; pierwsza reguła nazywa Blum jedynie przykładem i zastrzega weryfikację, druga mówi o weryfikacji karty producenta. Status obu reguł jest jednak sterowany przez to samo pole zakładu. Wiercenia frontu w `src/core/technologia.ts:332-347` są generowane wyłącznie z tych ogólnych parametrów; związek z konkretnym numerem zawiasu nie jest widoczny w tym przebiegu.

**Znaczenie:** przy pozostawionych ustawieniach otwory frontu są geometrycznie określone, ale mają status roboczy. Włączenie jednego zakładowego zatwierdzenia zmieni jednocześnie status puszki oraz wierceń prowadnika, mimo że to dwa różne interfejsy/źródła. Nie ma w tej ścieżce udokumentowanego wyboru dokładnego SKU, który odróżnia źródłowe 13 mm rodziny od konkretnego wariantu 107° z 11,5 mm. To ryzyko błędnego zwolnienia po zatwierdzeniu profilu ogólnego; nie przesądza, czy użytkownik faktycznie włączył tę opcję ani czy wygenerowane pliki zostały użyte.

**Weryfikacja:** `npx tsx --test src/technologia.test.ts` zaliczył 8/8 testów, a `npm run typecheck` zakończył się poprawnie. Obecne testy obejmują m.in. stronę zawiasów i pozycje produkcyjne, ale nie testują rozróżnienia 13/11,5 mm, minimalnej grubości frontu ani zachowania zatwierdzenia po zmianie wariantu. Testy potwierdzają aktualne zachowanie objęte zestawem, nie poprawność profilu producenta.

**Rekomendacja dla Claude — P0 przed zwalnianiem wierceń frontów do produkcji:**

1. Wymagać wyboru dokładnego SKU/artykułu i wersji źródła producenta przed nadaniem regule statusu zatwierdzonego. Nieznany lub ogólny profil Ø35 nie może samodzielnie uzyskać produkcyjnej akceptacji.
2. Oddzielić zatwierdzenie geometrii puszki frontowej od prowadnika/płytki korpusowej; zatwierdzenie jednego nie może zatwierdzać drugiego.
3. Dodać test wariantu 107°: głębokość 11,5 mm i front min. 15 mm; test profilu o źródłowo potwierdzonych 13 mm; oraz test „brak SKU/zmiana SKU ⇒ status roboczy i blokada wydania”. Nie podstawiać 13 mm dla nieznanego SKU.
4. Na karcie frontu i eksporcie CNC pokazać SKU, średnicę, głębokość, odległość od krawędzi, ograniczenia frontu oraz identyfikator/rewizję rysunku źródłowego.

**Kryterium odbioru:** bez wskazanego, zatwierdzonego wariantu nie da się wydać wierceń do CNC; zatwierdzenie dokładnego profilu 107° generuje 11,5 mm i blokuje front <15 mm; zmiana SKU unieważnia akceptację puszki, lecz nie zmienia niezależnego statusu prowadnika.

## Prowadnik/płytka korpusowa: 20/32, 37/32 i sposób mocowania

**Zweryfikowane źródła producenta (katalog Blum 2024/2025, Polska):** [spis i opis rodzajów prowadników, strona katalogu 154](https://publications.blum.com/2024/catalogue/pl/150/) rozróżnia prowadnik prosty 20/32 (m.in. artykuły 175H3100 i 177H3100E) od krzyżakowego 37/32 (m.in. 173H7100, 174H7100I i 174H7100E). Opisuje też odmienne mocowanie: wkręty, INSERTA i EXPANDO. [Strona katalogu 156](https://publications.blum.com/2024/catalogue/pl/152/) przypisuje 173H7100 mocowanie na wkręty do płyt wiórowych Ø3,5 lub Ø4 mm, a INSERTA i EXPANDO wskazuje jako osobne artykuły/rozwiązania.

**Fakty z kodu na `origin/main` 8230275a:** w `src/core/settings.ts:74-77` parametry podparcia zawiasu to pozycja 37 mm, rozstaw 32 mm, otwór Ø5 × 13 mm; `src/core/technologia.ts:139-142` ma jeden ogólny `zawias.prowadnik.s32@1` i jedno źródło opisane jako „system 32 — do weryfikacji”. Generator wierci te wartości bez wyboru artykułu płytki i metody mocowania. Oznacza to, że model nie wyraża rozróżnienia źródłowych prowadników prostych 20/32 i krzyżakowych 37/32 ani wskazanych w katalogu metod zamocowania. Katalog nie potwierdza w przytoczonym opisie, że Ø5 × 13 mm pasuje do każdego z tych artykułów; średnicy/głębokości dla konkretnych wariantów nie należy dopowiadać z samego schematu 20/32 lub 37/32.

**Proponowane zachowanie dla Claude (P0 przed wydaniem wierceń):** wiązać geometrię korpusu z dokładnym SKU płytki, jej typem (prosta/krzyżakowa), rozstawem, wysokością, sposobem mocowania i źródłową rewizją. Wymagane odrębne rekordy profilu dla np. 175H3100 (prosta 20/32, wkrętowa) i 173H7100 (krzyżakowa 37/32, wkrętowa); INSERTA/EXPANDO nie mogą dziedziczyć profilu wkrętowego bez sprawdzenia ich rysunku obróbki. Brak dokładnego artykułu lub rysunku ma pozostawiać operację roboczą i blokować CNC.

**Mierzalne kryterium:** test dwóch zweryfikowanych fixture'ów pokazuje odmienne geometrie 20/32 i 37/32; testy INSERTA/EXPANDO blokują zwolnienie bez potwierdzonej średnicy/głębokości i mocowania; zmiana SKU unieważnia wyłącznie akceptację wierceń płytki. Każda karta operacji i eksport CNC zawiera SKU, metodę mocowania oraz źródło/rewizję. Nie przeliczać ani nie publikować współrzędnych produkcyjnych wyłącznie z oznaczenia 20/32 lub 37/32.

## Rozdzielenie rozmiaru wkrętu od głębokości wiercenia (kontynuacja, 2026-10-12)

**Nowy dowód producenta:** oficjalny [Blum CLIP Mounting Plates, edycja 2025, str. 49](https://d2.blum.com/services/BEC003/concealedhinges_ep_dok_bus_%24sen-us_%24aof_%24v18.pdf) opisuje prowadnik krzyżakowy 173H9100 jako mocowany wkrętem systemowym Ø5 × 13 mm (alternatywnie wskazuje wkręt do drewna #7 × 5/8"). Ten zapis opisuje wymiar elementu mocującego, a nie jednoznacznie głębokość otworu w płycie. Dla porównania [polski katalog Blum 2024/2025, str. 156](https://publications.blum.com/2024/catalogue/pl/152/) wskazuje dla artykułu 173H7100 mocowanie wkrętami do płyty Ø3,5 lub Ø4 mm. Zatem `Ø5 × 13` nie można przenosić na wszystkie płytki, a „13” w oficjalnym opisie 173H9100 występuje jako długość wkrętu systemowego. W tych źródłach nie potwierdziłem, że 13 mm jest głębokością nawiercania.

**Zestawienie z implementacją:** `src/core/settings.ts` ma `prowadnikSrednicaMM: 5` i `prowadnikGlebokoscMM: 13`. `src/core/technologia.ts` przekazuje obie te wartości do rekordu operacji typu `otwor` jako `srednica` i `glebokosc`. W konsekwencji kod traktuje 13 mm jako głębokość wiercenia, podczas gdy znaleziona karta producenta potwierdza jedynie wkręt Ø5 × 13 mm dla określonego artykułu. To nierozstrzygnięta rozbieżność semantyczna i wymóg walidacji, nie dowód, że konkretny program CNC na pewno jest błędny.

**Rekomendacja dla Claude (P0 przed zwolnieniem wierceń):** nie utożsamiać długości wkrętu z głębokością otworu. Profil SKU powinien przechowywać niezależnie: metodę mocowania, typ i rozmiar wkrętu/kołka, średnicę i głębokość otworu oraz ich źródła. Dla 173H9100 można wpisać udokumentowany wkręt Ø5 × 13, ale głębokość wiercenia pozostawić `unknown` do czasu potwierdzenia na rysunku obróbki/instalacji konkretnego systemu mocowania. Dla 173H7100 zachować udokumentowane mocowanie wkrętami Ø3,5/4 bez automatycznego dziedziczenia otworu Ø5.

**Mierzalne kryterium:** test i podgląd operacji wyraźnie pokazują, że długość wkrętu 13 mm nie wypełnia pola `glebokosc` sama z siebie; bez zweryfikowanej głębokości wiercenia eksport do CNC pozostaje zablokowany. Zmiana artykułu 173H9100 ↔ 173H7100 wymusza ponowną walidację średnicy/mocowania. Należy zamknąć `unknown` dopiero po pozyskaniu właściwej instrukcji/rysunku Blum albo potwierdzeniu procesu maszynowego przez warsztat.

### Ślad weryfikacji rysunku (2026-10-12 18:47Z)

Ponowna kwerenda oficjalnych źródeł Blum nie ujawniła osobnej publicznej instrukcji instalacji/rysunku wiercenia dla 173H9100. Dostępna karta „CLIP Mounting Plates”, edycja 2025, str. 49, identyfikuje artykuł, układ i rodzaj mocowania; potwierdza wkręt Ø5 × 13 mm, ale nie podaje jawnie głębokości wywiercanego otworu. Próba odczytu/obrazu strony PDF przez użyte narzędzie nie powiodła się (plik zbyt duży do otwarcia, zrzut strony niedostępny); odczyt tekstowy nie wystarcza do walidacji rysunku. Zostawić głębokość operacji jako `unknown`; brak podstaw do zatwierdzenia ani odrzucenia 13 mm jako procesu produkcyjnego bez właściwego rysunku lub próby warsztatowej.
