# Kamień, parter: kuchnia i łazienka. Dane z DWG

Źródło: `ARCH_KAMIEN_WN_26-06-29-out(1).dwg`. Projekt: MOOI Architekci / Shelter, AC1032, jednostki cm. Odczyt: 30.09.2026, biblioteka libredwg-web.
Wymiary pochodzą z geometrii i wymiarów rysunku. **Przed produkcją trzeba je zweryfikować pomiarem.**
W pliku nie ma opisów frontów, materiałów ani AGD, poza blokami „lodowka” i symbolem mrożenia.

## Kuchnia: układ równoległy, przejście 95

### Zabudowa przy ścianie: 346 × 60
Kolejność modułów: 60 | 68 | 90 | 68 | 60.
- Na rzucie wymiary ciągu to 60 / 226 / 60. W moduł 60 z symbolem mrożenia wpisano blok `lodowka`.
- Na drugim końcu jest też moduł 60.
- Moduł 90 ma w rzucie wewnętrzny prostokąt 51 × 79 (urządzenie do zabudowy).
- Między tyłem zabudowy a ścianą konstrukcyjną jest ok. 23 cm. Do wyjaśnienia: instalacje albo głębsza lodówka.

### Widok zabudowy
Widok w DWG jest narysowany do góry nogami (podłoga u góry arkusza). Po odwróceniu wysokości od podłogi:

| Strefa | Wysokość [cm] | Uwagi |
|---|---|---|
| Cokół | ok. 5 | |
| Fronty dolne | 41 + 34 | Do ok. 80, wieniec do 85 |
| Blat | 1,2 | Spiek lub kompakt 12 mm, wierzch na ok. 86 |
| Wnęka | 58,8 | Gniazda, szerokość 226 |
| Szafki wiszące | 40 + 40 + 35 | Od ok. 145 do ok. 260 |
| Do sufitu | ok. 11 | Sufit ok. 271 |

- Moduł 90 ma w rzucie płytę 79 × 51 (płyta 80).
- Słupek 60 z niszą AGD ok. 90 cm (86–176): piekarnik z mikrofalą. Drugi słupek 60: lodówka do zabudowy.

### Wyspa: 280 × 60, przejście 95 do zabudowy
Kolejność modułów: 60 (zlew, warstwa armatury) | 80 | 80 (drzwi lub urządzenie z uchwytem) | 60.

Widok wyspy:
- widok także odwrócony; wysokość blatu wyspy 87 cm;
- podział wzdłuż wyspy: 142 | 76 | 62 (razem 280);
- z sufitu zwisa element szer. ok. 120 cm, dół na ok. 189 cm (lampa lub okap).

Układ i funkcję elementów w widoku wyspy trzeba potwierdzić.

### Pozostałe elementy
- Box 75 × 93 z symbolem mrożenia leży za ścianą konstrukcyjną, poza kuchnią. Może to być zamrażarka w spiżarni lub korytarzu.
- Duży prostokąt z krzyżem ok. 500 × 252 jest na warstwie `widok`. To rzut elementu powyżej (otwór lub antresola), nie mebel.

## Łazienka na parterze (WC gościnne z prysznicem)
Wymiary pomieszczenia: ok. 279 × 125–139 (w świetle).
Wymiary wzdłuż ściany tylnej: 139 | 91 | 49.

- **WC podwieszane** przy lewej ścianie:
  - zabudowa stelaża 18 cm, szerokość 60;
  - miska 38 × ok. 54, oś miski 44 od krawędzi zabudowy.
- **Umywalka nablatowa 60 × 40** (blok `umywaka60x40`, misa 48 × 27):
  - przy ścianie tylnej, 109–169 cm od lewej ściany;
  - pod nią ewentualna szafka 60 × 40; w rysunku brak podziału frontów.
- **Prysznic** ok. 90 × 124 przy prawej ścianie:
  - ścianka lub szyba na granicy;
  - deszczownica na ramieniu ze ściany tylnej;
  - wymiary 96 i 44 wyznaczają położenie odpływu i deszczownicy.
- Dwa punkty oświetlenia sufitowego: nad umywalką i w prysznicu.
- Drzwi ok. 80 w ścianie frontowej.
- **Poza łazienką:** szafka pod schodami, długość 110 (korytarz).

## Projekty online
Zbudowane 30.09.2026 skryptem `scripts/kamien-parter.ts`: „Kamień — kuchnia parter” (4dec301f) i „Kamień — łazienka parter” (215a0cf1). Założenia opisane w notatkach projektów.

## Do potwierdzenia
1. Podział frontów zabudowy 346 i wyspy (przyjęto: dolne 2 szuflady, wiszące drzwi z 2 półkami, wyspa: zlew 60, szuflady 80/80/60).
2. AGD: modele lodówki, piekarnika z mikrofalą, płyty 80, zlewu; ewentualna zmywarka w wyspie.
3. 23 cm między tyłem zabudowy a ścianą konstrukcyjną.
4. Dekory kuchni (przyjęto biel) i łazienki (przyjęto K547 jak na piętrze); blat 12 mm: spiek czy kompakt.
5. Łazienka: wysokość zabudowy stelaża (przyjęto 120), szafka pod umywalką (przyjęto wisząca 60 × 35 × 40, 1 szuflada).
