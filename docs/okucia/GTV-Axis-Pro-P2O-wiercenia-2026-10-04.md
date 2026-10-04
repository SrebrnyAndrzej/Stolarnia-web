# GTV Axis Pro P2O — ograniczenia pracy, szczelina i wiercenia z instrukcji

04.10.2026. Odczyt wizualny źródłowego PDF producenta, nie implementacja. Baza origin/main d3ce369; `git fetch` nie wykazał nowych commitów Claude. Ostatnie zmiany kodu do przeglądu nadal opisane w docs/PRZEGLAD-2026-10-01-stary-formularz.md.

## Źródło

Instrukcja producenta [GTV Axis Pro Push to Open, skrócona, 2022](https://assets.gtv.com.pl/assets/attachments/instrukcja/Axis_PRO_P2O__%20instrukcja_A4_PL_EN_RU__skrocona__2022r.pdf), pobrana do `docs/okucia/pdf/GTV-Axis-Pro-P2O-instrukcja.pdf` 23.09.2026. Rejestr `docs/okucia/sources.json`, wpis GTV-Axis-Pro-P2O-instrukcja. Odczytano wizualnie strony 1, 2 i 4 z pliku 4-stronicowego. To wydanie 2022; nie potwierdza dostępności handlowej produktu w 2026.

## Fakty z instrukcji

- Profil P2O podaje długości nominalne prowadnic NL 250–600 mm i wysokości boków 69, 86, 120, 168, 200 mm; obciążenie 40 kg.
- Producent podaje ograniczenie: szerokość szuflady nie powinna przekraczać nominalnej długości prowadnicy. Przy przekroczeniu zaleca synchronizator PB-AXISPRO-SYNCHRO-P2O.
- Schemat montażu synchronizatora pokazuje pręt o długości handlowej 1200 mm oraz SPP = LW − 127 mm. To długość odcięcia według podanej definicji LW, nie wymiar gotowej szuflady ani wymiar dna. Nie stosować, jeśli brak synchronizatora lub jego SKU nie jest zgodny.
- Instrukcja P2O wskazuje minimalną szczelinę frontu 2,5 mm przy regulacji działania P2O. To warunek funkcji systemu w pokazanej konfiguracji, nie uniwersalna szczelina wszystkich frontów mebla.
- Rysunek montażowy pokazuje oś otworów frontu: dolny otwór minimum 47,5 mm od dolnej krawędzi i rozstaw pionowy 32 mm. Na rysunku wskazano Ø2. Nie utożsamiać Ø2 z pewną średnicą końcowego otworu dla każdej płyty/łącznika bez powiązania legendy i elementu.
- Dla kilku wysokości frontu występują różne sekwencje rozstawów 32 i 64 mm; układ trzeba odczytywać osobno dla danego wariantu. Minimum 47,5 jest bazą od dolnej krawędzi frontu. Nie przenosić rozstawu z H120 na H168/H200.
- Na rysunku pleców występują oddzielne otwory i baza od górnej krawędzi. Wartości oznaczone na rysunku obejmują 9,5 mm oraz sekwencje 19/32 mm dla niższych wysokości i 32/64 mm dla wyższych. Oś boczna, rodzaj otworu, jego średnica/głębokość i relacja do konkretnego zaczepu wymagają odczytu w pełnym rysunku i identyfikacji mocowania.
- Strona 2 pokazuje wariant średni H120, wysoki H168 i bardzo wysoki H200 oraz dno/plecy z płyty 16 mm. Wskazane wzory tego wariantu: dno LW−75 × NL−24, plecy LW−87 × H, grubość 16 mm. Nie uogólniać ich na wszystkie systemy GTV ani automatycznie na Amix/Blum.

Odczyt wymiarów wierceń jest częściowy. Niniejszy dokument nie zatwierdza gotowego programu CNC, w szczególności nie rozstrzyga, czy Ø2 oznacza nawiercenie pilotujące dla konkretnych wkrętów, i nie przypisuje wszystkich otworów do powierzchni części z jednoznacznym układem współrzędnych.

## Wytyczne dla Claude

| Priorytet | Problem / dowód | Proponowane zachowanie | Zależności | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Otwieranie P2O i nośność zależą od konfiguracji | Osobny wariant Axis Pro P2O z zakresem NL/H i ograniczeniem szerokości | SKU prowadnic, boku, łączników i synchronizatora | W=NL przechodzi warunek proporcji; W>NL pokazuje konkretną rekomendację synchronizacji, a nie ciche zatwierdzenie |
| P0 | Długość odcięcia synchronizatora dotyczy LW | Przy zakupie pręta wymagane LW i SKU; wyliczać SPP=LW−127 tylko dla tego SKU | Zweryfikowana baza LW i informacja o kompletności zestawu | Dla LW=564 wynik SPP=437 mm; brak LW lub niewłaściwy profil nie generuje cięcia |
| P0 | Frontowe otwory różnią się wysokością | Osobna mapa dla każdej wysokości; minimum oddzielone od nominalnego położenia | Rysunek wariantu, identyfikacja mocowania i technologia Ø2 | H120, H168 i H200 mają testy graniczne; system nie kopiuje sekwencji z sąsiedniego wariantu |
| P0 przed CNC | Średnica/typ otworu nie są jeszcze rozstrzygnięte | Zachować Ø2 jako niezweryfikowany atrybut wiercenia z referencją; brak parametrów CNC utrzymuje blokadę | Dokumentacja mocowania i próba technologiczna | Eksport CNC nie powstaje, dopóki otwór nie ma typu, strony, bazy, średnicy, głębokości i tolerancji |
| P1 | Szczelina P2O wpływa na poprawne otwieranie | Walidować minimum 2,5 mm w pokazanej konfiguracji, nie jako ustawienie domyślne dla mebla | Geometria frontów i położenie P2O | Zmniejszenie szczeliny poniżej minimum zgłasza warunek P2O i nie zmienia innych szczelin automatycznie |
| P0 | Wariant standard, wewnętrzny i P2O mogą współdzielić pozornie podobne wymiary | Profil danych wiąże wzory części z dokładną rodziną i trybem otwierania | SKU/rodzina i źródło wydania | Zmiana P2O na zwykły domyk przelicza BOM, synchronizator, szczeliny i walidację wierceń |

### Przykład kontrolny

Założenia: LW=564 mm, NL=500 mm, wariant 16 mm P2O i szuflada nie przekracza NL. Z odczytanych wzorów: dno 489×476 mm, plecy 477 mm szerokości, wysokość zależna od wybranego boku. Jeśli zastosowano synchronizator, SPP=437 mm. To próbka wymiarów do porównania, nie zatwierdzona dokumentacja produkcyjna. Otwory CNC nadal wymagają pełnego przypisania osi, elementu i tolerancji.

## Punkt wznowienia

Ostatnia sprawdzona rewizja przed wpisem: d3ce369; brak nowych commitów Claude. Następnie zweryfikować Axis Pro standard i Modern Box PRO osobno względem już zapisanych reguł, zwłaszcza rysunki mocowania pleców i frontu. Potem wrócić do zachowania R03 starego formularza, jeśli pojawi się implementacja Claude. Ceny i umowy bez zmian.
