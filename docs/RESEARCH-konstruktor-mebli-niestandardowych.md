# Konstruktor mebli niestandardowych i modyfikacji modułów

Research Claude z 25.09.2026, z porównaniem z [RESEARCH-silnik-mebli-i-konta.md](RESEARCH-silnik-mebli-i-konta.md) (Codex, ten sam dzień). To plan, nie opis gotowej funkcji.

Zakres: budowa własnego mebla i modyfikacja modułów, m.in.:
- zamiana drzwi na szuflady,
- szuflady wewnętrzne za drzwiami,
- szuflada koszowa (wysoka, „garnkowa”) z ukrytą szufladą.

## 1. Jak robią to inni

| Narzędzie | Model mebla | Co przenosimy |
|---|---|---|
| **Mozaik** (CNC dla stolarni) | Dwie osobne warstwy: **Face** (front) i **Interior** (wnętrze). Obie dzielone podziałami poziomymi, pionowymi i wielokrotnymi. Sekcja frontu to: drzwi, para drzwi, szuflada, front szuflady, panel albo otwarta. Sekcja wnętrza to: półka, półka stała, trawers, wysuw, półka wysuwana, przegroda, drążek. **„Lock to split”** przypina element wnętrza do podziału frontu (półka stała idzie za zmianą wysokości szuflady). **„Automate Interior”** układa wnętrze według frontu. [Poradnik edycji szafek](https://www.phillanton.com/blogs/mozaik-guides/how-to-edit-cabinets-in-mozaik), [przegląd funkcji](https://www.mozaiksoftware.com/products/mozaik-manufacturing/additional-features) | Cały układ warstw, przypinanie i automatyczne dopasowanie wnętrza |
| **IKEA METOD** | Korpus, fronty i wyposażenie to osobne produkty. Szuflady mają 3 wysokości (10/20/30 cm), fronty mają własne wysokości. Reguła: *wysokość frontu − wysokość szuflady = miejsce na szuflady wewnętrzne za tym samym frontem* (np. front 40 cm i szuflada 20 cm dają miejsce na 2 × 10 cm albo 1 × 20 cm). Przy froncie 60 cm zalecają drzwi z mocowaniem szuflady do drzwi. [IKEA: które szuflady wewnętrzne pasują](https://www.ikea.com/se/en/customer-service/knowledge/articles/925bf3bb-b393-4967-g3d6-b8d7gc065g90.html) | **Budżet wysokości** frontu jako proste, sprawdzalne ograniczenie |
| **Blum LEGRABOX** (dokumentacja producenta, `docs/okucia/pdf/BLUM-Legrabox-planowanie.pdf`) | Program ma osobne typy: szuflada, **szuflada wewnętrzna** (wysokość M, K), **wysoka szuflada wewnętrzna** (C), szuflada z wysokim frontem. Szuflada wewnętrzna **z zestawem zabieraka** (ZI7.0M07) ma zabierak mocowany do frontu, a na frontach trzeba wywiercić gniazdo pod obudowę zabieraka. Blum podaje: „możliwa od wysokości 71 mm”, „kombinacja zestawu zabieraka z TIP-ON BLUMOTION nie jest możliwa”, front metalowy szuflady wewnętrznej „LW − 126 mm” (s. 16–19). | Typy szuflad, zabierak jako osobny komponent z operacją na froncie i **wykluczenia kompatybilności** |
| **Blum konfigurator / E-SERVICES** | Konfigurator produktów (OPC) i korpusów z listami części oraz eksportem CAD/CAM. [OPC](https://www.blum.com/us/en/services/e-services/onlineproductconfigurator/), [E-SERVICES](https://e-services.blum.com/) | Wzór wyników (lista części, dane do CAD/CAM). **Publicznego API nie potwierdzono**, więc nie budujemy na nim zależności |
| **Amix Elite Box — szuflady wewnętrzne** (`docs/okucia/pdf`, arkusz „Wymiary montażowe dla szuflad wewnętrznych”) | Osobny arkusz wymiarów zabudowy szuflad wewnętrznych (panel frontu wewnętrznego, m.in. oznaczenia „Min50”, „Min33”, „LT = NL + 16”) | Źródło reguł dla drugiego systemu. **Liczby trzeba odczytać z rysunku przed użyciem**; nie interpretujemy ich z samego tekstu |
| Praktyka stolarska (m.in. [forum TechnikiStolarskie](http://www.technikistolarskie.pl/forum/viewtopic.php?f=59&t=3184), [Blum: drzwi otwierane do wewnątrz](https://www.blum.com/pl/pl/products/cabinet-applications/inward-opening-door/overview/)) | Szuflady za drzwiami kolidują z zawiasami. Rozwiązania: **listwa dystansowa** pod prowadnicę po stronie zawiasów (zmniejsza światło) albo zawiasy o zerowym wystawaniu z dużym kątem otwarcia | Reguła kolizji zawias–szuflada z dwoma wariantami rozwiązania |

Nie znalazłem gotowego silnika do osadzenia w aplikacji webowej. Mozaik, Cabinet Vision, imos i SWOOD to zamknięte programy desktopowe albo nakładki na CAD. Blum nie udostępnia publicznego API. Rozwiązanie to **własny model warstwowy** na wzór Mozaika, z regułami z dokumentacji producentów, którą już mamy w `docs/okucia`.

## 2. Model: korpus + przestrzenie + fronty + wysuwy

Dzisiejszy `KonfiguracjaModulu` to płaskie liczniki (półki, drzwi, szuflady). Nie da się w nim opisać szuflady za drzwiami ani ukrytej szuflady. Proponowany model modułu:

```
Mebel
├─ korpus: gabaryty, materiały, plecy, cokół/nogi, wieńce, przegrody pionowe
├─ przestrzenie (drzewo): Podział { kierunek: "pion" | "poziom", części: Część[] }
│    Część { rozmiar: stały mm | proporcja | reszta, przegroda: rzeczywista (płyta) | umowna,
│            wyposażenie?: półka | półka stała | szuflada wewnętrzna | cargo | drążek | pusta }
├─ fronty (osobna siatka na obrysie czoła): Podział frontów { kierunek, części }
│    Front { typ: drzwi (strona, zawiasy) | front szuflady | klapa | blenda | otwarte, luzy }
└─ wysuwy: Wysuw { profil okucia, NL, wysokość boku, front: FrontId | brak,
                   powiązanie: "z frontem" | "za drzwiami" | "ukryta za frontem szuflady" | "z zabierakiem do frontu" }
```

Zasady:
- **Front i wnętrze są niezależne, ale mogą być przypięte.** Element wnętrza może mieć `przypięcie: { podziałFrontu, krawędź }`, tak jak „lock to split” w Mozaiku. Półka stała nad szufladami idzie wtedy za zmianą wysokości szuflady.
- **Wysuw to pierwszorzędny obiekt.** Łączy profil okucia (skrzynka), miejsce we wnętrzu i front, jeśli go ma. Z niego builder liczy dno, plecy, boki, wiercenia prowadnic, operacje na froncie (np. gniazdo zabieraka) i listę okuć.
- **Wymiary:** stały, proporcja albo reszta. Przy podziale odejmujemy grubości przegród i luzy. Sprzeczność daje czytelny błąd (zgodnie z Codexem), a nie ujemną formatkę.

## 3. Operacje, o które pytałeś, i ich reguły

Każda operacja to **polecenie** z walidacją (da się je cofnąć i wywołać też przez MCP).

| Polecenie | Co robi w modelu | Reguły, które musi sprawdzić |
|---|---|---|
| **Zamień drzwi na szuflady** (N szuflad, podziałka) | Front „drzwi” zamienia na N frontów szuflad. Wnętrze tej strefy zmienia się w N wysuwów „z frontem”. Półki nastawne znikają, półka stała zostaje, jeśli jest przypięta | Budżet wysokości (suma frontów z luzami = wysokość strefy); długość NL z głębokości użytkowej; szerokość LW w profilu; zawiasy i ich okucia usunięte z listy |
| **Dodaj szuflady za drzwiami** | Front zostaje drzwiami. We wnętrzu powstają wysuwy „za drzwiami” (szuflady wewnętrzne z niskim frontem albo bez frontu) | **Kolizja z zawiasami:** listwa dystansowa po stronie zawiasów (nowa formatka, mniejsze LW, inne wymiary dna i pleców) albo zawiasy o zerowym wystawaniu i minimalnym kącie otwarcia z profilu. Drzwi dwuskrzydłowe bez słupka oznaczają kolizję po obu stronach. Front wewnętrzny według profilu (LEGRABOX front metalowy: LW − 126 mm) |
| **Szuflada koszowa z ukrytą szufladą** | Jeden wysoki front (typ „front szuflady”) i dwa wysuwy: dolna szuflada garnkowa z tym frontem oraz górna szuflada wewnętrzna. Dwa warianty: **(a) niezależna** („ukryta za frontem szuflady”): po wysunięciu frontu wysuwa się ją osobno (IKEA MAXIMERA). **(b) z zabierakiem** („z zabierakiem do frontu”): sprzężona z frontem, wysuwa się razem z nim (Blum ZI7.0M07) | **Budżet wysokości (reguła IKEA):** wysokość frontu − wysokość szuflady dolnej ≥ wysokość szuflady wewnętrznej + luzy z profilu. Wariant (b): min. wysokość z profilu (LEGRABOX: od 71 mm), **wykluczenie TIP-ON BLUMOTION**, operacja wiercenia frontu pod obudowę zabieraka (wymiary z s. 18 PDF Blum). Wariant (a): własne wymiary szuflady wewnętrznej i frontu wewnętrznego z profilu |
| **Dodaj / usuń przegrodę, podziel strefę** | Nowy Podział w drzewie przestrzeni. Przegroda rzeczywista to formatka z konfirmatami lub kołkami | Minimalne światło komory dla wyposażenia; przeliczenie LW wysuwów w komorze |
| **Zmień wymiar mebla** | Przeliczenie drzewa: stałe zostają, proporcje i reszta się zmieniają | Wysuw lub okucie, które przestaje pasować, dostaje ostrzeżenie. Nie podmieniamy go po cichu (zgodnie z Codexem) |

Regułę z każdego źródła zapisujemy w **profilu okucia** (`docs/okucia/reguly-szuflad.json`, rozszerzonym) z odwołaniem do strony PDF i statusem weryfikacji. Nie wpisujemy luzów „na markę”.

## 4. Porównanie z researchem Codexa

| Temat | Codex | Claude | Wniosek |
|---|---|---|---|
| Kierunek | Własny silnik parametryczny w TS, Three.js tylko do podglądu | To samo | **Zgoda** |
| Model | Drzewo przestrzeni, „podział frontów niezależny od wnętrza”, wymiary stałe, proporcje, reszta | To samo, plus **przypinanie** wnętrza do podziału frontu (Mozaik) i **Wysuw** jako osobny obiekt łączący front, skrzynkę i profil | Uzupełnienie: bez Wysuwu nie da się opisać zabieraka ani szuflady za drzwiami |
| Szuflady za drzwiami, ukryta szuflada | Jedno zdanie: „jeden front może zasłaniać kilka szuflad wewnętrznych” | Konkretne reguły: kolizja zawiasów (dystans albo zawias o zerowym wystawaniu), zabierak ZI7.0M07 z wymiarami i wykluczeniem TIP-ON, budżet wysokości | **Braki u Codexa** w pytaniu kluczowym dla Ciebie |
| Źródła | Blum (konfigurator korpusów, BXF), SWOOD, OpenCutList, JSketcher, replicad, Three.js | Mozaik, IKEA METOD, PDF-y planowania Blum i Amix, praktyka stolarska | Codex: szerzej o narzędziach CAD; Claude: głębiej o regułach okuć |
| Walidacja i ruch | Kolizje ruchu frontów, zawiasów, szuflad; nie podmieniać okuć po cichu | To samo, plus konkretne kolizje do sprawdzenia | **Zgoda** |
| Architektura obliczeń | Web Worker, graf zależności bez cykli, cache z wersją silnika | Obecny builder liczy moduł w milisekundach, więc Web Worker dopiero przy dużych projektach | Drobna różnica priorytetów |
| Produkcja | Niezmienne wydanie produkcyjne, profil zatwierdzony próbnym montażem | Zgoda | **Zgoda** |
| Konta i role | Duża część dokumentu (Supabase Auth, role, RLS) | Poza zakresem tego researchu | Osobny etap; nie blokuje konstruktora |

## 5. Plan wdrożenia (propozycja)

1. **Typy i adapter.** Nowe typy (`Przestrzen`, `SiatkaFrontow`, `Wysuw`, `Przypiecie`) i adapter: obecny `KonfiguracjaModulu` → nowy model. Stary builder zostaje, dopóki testy nie pokażą identycznych formatek dla wszystkich dzisiejszych konstrukcji.
2. **Builder z drzewa.** Korpus, przegrody, półki, fronty i wysuwy „z frontem”. Test regresji: szafka szufladowa, słupek z szufladami pod drzwiami, słupek AGD. Te same formatki co dziś.
3. **Polecenia:** „zamień drzwi na szuflady” i „dodaj szuflady za drzwiami” z regułą zawiasów (dystans jako formatka i zmienione LW).
4. **Szuflada koszowa z ukrytą szufladą** dla jednego systemu (LEGRABOX M/K), oba warianty; dla wariantu z zabierakiem (ZI7.0M07): wymiary z s. 16–19 PDF Blum odczytane z rysunku, operacja na froncie i wykluczenie TIP-ON. Profil zatwierdzamy dopiero po próbnym montażu.
5. **Edytor w panelu.** Rzut czołowy modułu z dwiema zakładkami, „Fronty” i „Wnętrze” (jak Mozaik). Klik w strefę pozwala ją podzielić albo przypisać typ. Szybkie akcje odpowiadają poleceniom z pkt 3–4. Podgląd 3D z tego samego modelu.
6. **MCP:** te same polecenia dla Claude.

Kryterium odbioru każdego kroku: formatki, wiercenia, okucia i 3D pochodzą z jednego modelu. Niepewne dane z producenta blokują wydanie produkcyjne, ale nie projektowanie.

## 6. Stan wdrożenia (25.09.2026)

**Etap 1 — zrobiony** (`src/core/silnik/`), na przykładzie kuchni Darii (Pieszczyńscy):
- `model.ts`: model mebla — korpus, drzewo przestrzeni wnętrza (podziały pionowe i poziome, półka stała lub przegroda, strefy bez pleców), niezależna siatka frontów (szczelina wspólna lub osobna) i wysuwy z rodzajem powiązania.
- `budowa.ts`: silnik liczący elementy, plecy dzielone wokół nisz, fronty, skrzynki i okucia; `ukladFrontow` i `ukladWnetrza` do poleceń.
- `adapter.ts`: dotychczasowa konfiguracja → drzewo. Tu są reguły szablonów starego buildera.
- `polecenia.ts`: **zamień drzwi na szuflady**. Równe fronty, usunięcie półek nastawnych i cargo za frontem, wysuwy, błąd przy frontach poniżej 100 mm i przy niszy AGD.
- Integracja: `Modul.drzewo`. Gdy jest ustawione, moduł buduje silnik (gabaryty zawsze z modułu). API: `POST /api/projekty/:id/moduly/:mid/polecenie`, `DELETE …/drzewo`. MCP: `zamien_drzwi_na_szuflady`, `przywroc_konstrukcje_standardowa`. Panel: sekcja „Konstrukcja (silnik)” w inspektorze modułu.
- Testy (`src/silnik.test.ts`):
  - silnik = stary builder dla 11 szafek Darii (`kuchnia-darii.fixture.json`), całego katalogu i ponad 150 wariantów;
  - A2 Darii po zamianie na 3 szuflady daje dokładnie formatki szafki szufladowej z równą podziałką;
  - pełny obieg przez serwis.

**Etap 2 — szuflady za drzwiami, zrobione częściowo:**
- polecenie `dodajSzufladyZaDrzwiami` (`polecenia.ts`): dolna część strefy za drzwiami dzieli się na N stref po 160 mm (można zmienić), każda z wysuwem „zaDrzwiami”; półki zostają nad szufladami, jeśli się mieszczą;
- budowa (`budowa.ts`) według `inner_drawer` z profilu. Dla Amix Elite:
  - NL + 16 ≤ głębokość użytkowa;
  - skrzynka cofnięta o 18 mm;
  - wariant boku z minimalnej komory: H84 112, H116 144, H167 195, H199 227;
  - stalowy panel frontu wewnętrznego 05B.023-FB (L = LW − 37) jako okucie;
- dokumentacja: prowadnice wewnętrzne w tym samym rastrze 32 co szuflady z frontem, otwory +18 mm, diagnostyka `ZAWIAS_ZA_DRZWIAMI` na drzwiach, `SZUFLADA_WEWNETRZNA` dla profili bez danych (Blum, GTV);
- API: `POST …/polecenie {typ:"dodajSzufladyZaDrzwiami", liczba, wysokoscMM}`; MCP `dodaj_szuflady_za_drzwiami`; przycisk w inspektorze;
- system szuflad z inspektora działa także na modułach z drzewem (wcześniej drzewo trzymało stary profil).

**Nie ma jeszcze:**
- reguły zawiasu i listwy dystansowej dla szuflad za drzwiami (brak danych — zamówione u Codexa),
- szuflady z ukrytą szufladą i zabierakiem,
- przegród pionowych w edytorze,
- edytora graficznego z zakładkami „Fronty” i „Wnętrze”,
- profilu produkcyjnego zatwierdzonego próbnym montażem.

Wysuwy o innym powiązaniu niż „z frontem” silnik jawnie odrzuca ostrzeżeniem.

Kuchni Darii w bazie nie zmieniono: szafka A2 ma nadal drzwi, a jej funkcję („szuflady / zmywarka”) ustala klient.
