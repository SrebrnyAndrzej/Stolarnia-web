# MERIVOBOX M: wymiar dna i kandydackie pozycje nawiercenia

Data weryfikacji: 2026-10-10
Zakres: wizualny odczyt strony 15 producentowego PDF planowania; nie jest to zatwierdzenie operacji CNC ani kompletna tabela SKU.

## Problem

Profil `blum-merivobox-m-wood` przechowuje potwierdzone wymiary cięcia, ale `drilling_status` pozostaje `not_normalized`. Na s.15 tego samego PDF znajduje się dodatkowa tabela „Pozycja otworu w dnie szuflady”. Może uzupełnić dane dla konkretnego wariantu, lecz sama tabela nie rozstrzyga wszystkich baz, zakresów NL i warunków użycia wymaganych do produkcji.

## Dowód i fakty

- Lokalna kopia źródła `docs/okucia/pdf/BLUM-Merivobox-planowanie.pdf` jest zarejestrowana w `sources.json`: bezpośredni adres producenta `https://www.blum.com/file/me25532842_ep_dok_bau?country=pl&language=pl`, końcowy plik `me25532842_ep_dok_bau_$spl-pl_$aof_$v5.pdf`, data pobrania 2026-09-23 i SHA-256 `3361fffd4689454b5f21fe6740dd1ea106ea610bcd15697864dba61eb3a4ece7`.
- Wydruk strony 15, zatytułowanej „MERIVOBOX | Szuflada standardowa – wysokość M”, oznacza „Wymiary przycięcia dla płyty wiórowej 16 mm”. Tabela podaje drewnianą ściankę tylną H=83 mm, długość dna `Z = NL−26 mm` i elementy `A`/`B` o szerokości `LW−51 mm`.
- Tabela „Pozycja otworu w dnie szuflady” podaje możliwość nawiercenia z użyciem wkrętu z łbem talerzykowym oraz pary `NL → X`: 270→128 mm, 300→128 mm, `>350`→256 mm. Rysunek lokalizacji oznacza ponadto wartości 9 i 16 mm.
- Na rysunku `X` jest zwymiarowane od przedniej krawędzi dna do osi oznaczonego miejsca nawiercenia; identyfikacja przedniej krawędzi wynika z widoku izometrycznego i orientacji rzutu, a nie z tekstowej etykiety bazy. To odczyt geometrii rysunku wymagający sprawdzenia na próbce przed użyciem produkcyjnym. Rysunek nie określa średnicy, głębokości ani tolerancji otworu. Wiersz `>350` nie przypisuje wartości długości NL=350 mm ani wszystkim innym długościom.
- Potwierdzono, że lokalna kopia jest aktualną pomocą planistyczną wskazaną na [oficjalnej polskiej stronie pobrań Blum](https://www.blum.com/pl/pl/products/boxsystems/merivobox/downloads-videos/), a nie nieopisaną kopią „z 2023 r.”: sekcja „Prospekt” podaje „Pomoc w zamawianiu MERIVOBOX i AMBIA-LINE PDF | 18 MB | 07-11-2025”, a kliknięcie prowadzi do identyfikatora `me25532842`; lokalny `sources.json` zapisuje ten sam identyfikator, polską wersję `...$spl-pl...$v5.pdf` i SHA-256 `3361fffd4689454b5f21fe6740dd1ea106ea610bcd15697864dba61eb3a4ece7`. Lokalna strona tytułowa mówi „Informacje o zamawianiu i planowaniu”, stopka drukuje `EP-530/5 PL-PL/12.24`, a metadane PDF podają utworzenie 2024-10-21 i modyfikację 2025-06-24. Wniosek: to producentowy plan-book rewizji 12.24 aktualnie udostępniany jako pomoc w zamawianiu (stan strony sprawdzony 2026-10-10). Strona osobno wymienia dokument „MERIVOBOX PDF” z 2026-05-20 w sekcji „Instrukcja montażu”; nie jest on katalogowo przedstawiany jako następca plan-booka. Sam plik z 2026-05-20 nie został odczytany.
- Oficjalna strona Blum wymienia ponadto E-Service „Serwis danych o produktach” i „Interfejs oprogramowania CAD/CAM”. Oficjalny opis E-Services mówi o dostępnych w Product Configurator listach komponentów i danych CAM dla MERIVOBOX, ale dotyczy publikacji Blum USA z 2024 r. (`https://d2.blum.com/services/BEC003/merivobox_ep_dok_bus_$sen-us_$aof_$v2.pdf`). Dostępność tych eksportów dla polskiego konta/SKU i warunki użycia pozostają niezweryfikowane.

## Proponowane zachowanie

**P1 dla kompletności dokumentacji; brak zgody na produkcyjne użycie wartości X.** Zachować te trzy pozycje jako dowód-kandydat przypięty do źródła, strony, hasha, grubości 16 mm i wariantu drewnianego, nie jako aktywną mapę wierceń. Nie rozszerzać ich na inne wysokości MERIVOBOX, dno 21 mm, stalową ściankę tylną, inne długości, TIP-ON ani SKU bez odrębnego źródła.

Przed normalizacją profilu: przyjąć plan-book EP-530/5 PL-PL/12.24 jako bieżące źródło Blum dla tych wymiarów (jest wymieniony na aktualnej stronie producenta), ale potwierdzić próbą warsztatową interpretację bazy `X` oraz rzeczywistą średnicę, głębokość i tolerancję otworu. Nie przypisywać automatycznie `X` do długości NL=350 ani do innych niewymienionych NL. Instrukcję montażu z 2026-05-20 stosować jako odrębne źródło wymagań montażowych, bez założenia, że zastępuje plan-book. Sprawdzić dostępność eksportu i jego warunki dla polskiego konta i dokładnego SKU w E-Service; nie przenosić informacji z rynku USA bez potwierdzenia. Dopiero kompletna karta wariantu i test montażowy mogą zasilić osobny profil CAM.

## Zależności i mierzalne kryteria odbioru

- **Zależności:** dokładna rewizja instrukcji producenta, tabela dostępnych NL i SKU kupowanych przez warsztat, definicja bazy `X`, średnica/głębokość/tolerancja wynikająca z dokumentacji lub potwierdzonej technologii oraz próba na detalu.
- **Odbiór źródłowy:** dla każdej użytej długości zapisano osobno SKU, rewizję dokumentu, stronę, grubość dna, definicję bazy, współrzędne względem wskazanych krawędzi, typ i parametry otworu; wyjątki z tabeli (w tym NL=350) jawnie rozwiązano albo oznaczono `unknown`.
- **Odbiór warsztatowy:** testowy bok/dno właściwego wariantu montuje się bez kolizji i z właściwym wkrętem; zmierzona pozycja otworu mieści się w tolerancji zaakceptowanej przez zakład.
- **Odbiór bezpieczeństwa:** do zakończenia powyższych testów status profilu pozostaje nieprodukcyjny, a eksport CNC nie emituje tych pozycji jako zweryfikowanych otworów.

## Granice

Tabela pochodzi z aktualnej pomocy planistycznej Blum EP-530/5 PL-PL/12.24, ale to nie potwierdza, że konkretna część jest aktualnie kupowana przez warsztat ani że profil w istniejącym kodzie jest zgodny. Nie wykonano testu fizycznego ani zmiany katalogu/logiki aplikacji.

## Oficjalna ścieżka weryfikacji CAD/CAM — 2026-10-10

### Problem

Plan-book pozostawia nieznane parametry otworów, a ręczne przenoszenie punktów z ilustracji nie wystarcza do bezpiecznego zwolnienia operacji CNC. Trzeba sprawdzić, czy producent publikuje zwymiarowany rysunek produkcyjny dla dokładnego artykułu i konfiguracji.

### Potwierdzone fakty producenta

- [Polski Serwis danych CAD/CAM Blum](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-dataservice/) opisuje dostęp do pojedynczych komponentów 3D, skonfigurowanych zespołów 3D, rysunków produkcyjnych 2D, sytuacji konstrukcyjnych 2D i pakietów CAD. Producent deklaruje aktualne, sprawdzone dane oraz pobieralne makra CAM i formaty WOP dla popularnych maszyn CNC.
- [Polski Serwis danych o produktach](https://www.blum.com/pl/pl/services/planning-construction-product-selection/productdata-service/) opisuje aktualizowane pakiety danych produktów dla partnerów oprogramowania; strona wskazuje, że dostęp do bazy produktów jest częścią E-Services.
- [Polska Baza danych o produktach](https://www.blum.com/pl/pl/services/planning-construction-product-selection/product-database/) wymienia szczegóły i cechy techniczne produktów, rysunki produktowe oraz pliki CAD; pełna baza wymaga dostępu do E-Services.
- [Polski Konfigurator produktów](https://www.blum.com/pl/pl/services/planning-construction-product-selection/product-configurator/) opisuje wyszukiwanie list artykułów, danych CAD i informacji planistycznych, konfigurację i przekazywanie kompletnych list do dystrybutora. Pełny zakres wymaga konta/uprawnień.
- [Oficjalne FAQ E-Services](https://www.blum.com/pl/pl/services/faq/) wskazuje aktywację dostępu przez przedstawiciela Blum. Nie znaleziono publicznego, anonimowego eksportu danych CAM dla konkretnego MERIVOBOX SKU.

### Wniosek dla warsztatu i Claude

**P1 — traktować CAD/CAM Service jako pierwszą ścieżkę pozyskania wymiarowego rysunku produkcyjnego, nie jako dowód, że eksport istnieje dla nieustalonego SKU.** Najpierw potrzebne są dokładny kod artykułu, długość nominalna, wysokość/typ boku, grubość dna, sposób mocowania oraz rynek. Następnie uprawniony użytkownik sprawdza, czy dla tego artykułu E-Service udostępnia 2D production drawing lub właściwe makro CAM. Do czasu udokumentowanego wyniku pozycje `X` z plan-booka pozostają kandydackie i nieprodukcyjne.

Z zapisanego pliku producenta należy zachować jego kod/revizję, datę pobrania, SKU i konfigurację, jednostki, bazę pomiarową, współrzędne osi otworu, Ø, głębokość i tolerancję (jeśli są podane), oraz format/wersję CAM. Porównać rysunek z plan-bookiem i fizyczną próbką. Brak dowolnego krytycznego parametru oznacza `unknown` i blokadę wiercenia CNC; format WOP sam w sobie nie potwierdza prawidłowej konfiguracji maszyny ani mocowania.

**Zależności:** dokładny SKU i konfiguracja kupowane w Polsce; legalny, aktywowany dostęp E-Services; właściwy rysunek lub makro producenta; identyfikacja maszyny/sterownika/CAM warsztatu; próba na rzeczywistym detalu.

**Mierzalny odbiór:** dla wybranego SKU istnieje zarchiwizowane źródło Blum z rewizją i sumą kontrolną; współrzędne, baza, średnica i głębokość wiercenia są jawnie przypisane do wskazanych krawędzi; rezultat montuje się bez kolizji, mieści się w zatwierdzonej tolerancji zakładu, a CAM przechodzi symulację dla konkretnej maszyny. Jeśli E-Service nie publikuje dokładnego wariantu lub danych otworów, profil pozostaje niezwolniony, bez fallbacku do innego NL.

**Niezweryfikowane:** dostępność pliku dla zakupionego MERIVOBOX, wymagania/zakres eksportu dla konkretnego konta, licencja na przechowywanie i redystrybucję danych w aplikacji warsztatu, zgodność dowolnego makra z maszyną zakładu oraz fizyczna interpretacja `X` ze strony 15 plan-booka. Nie wysyłano zapytania do producenta ani nie uzyskiwano dostępu do prywatnego konta.

## BXF jako dodatkowa ścieżka do danych wierceń — 2026-10-10

### Nowy dowód producenta

Polskie [FAQ Blum, pytanie „Czym jest plik w formacie BXF?”](https://www.blum.com/pl/pl/services/faq/) stwierdza, że BXF (Blum eXchange Format) zawiera dane okuć oraz dane montażowe formatek, między innymi ich wymiary i pozycje wiercenia. FAQ podaje, że plik można uzyskać z Konfiguratora produktów lub Konfiguratora korpusów, a następnie edytować w zgodnym CAD albo wykorzystać do produkcji na MINIPRESS z EASYSTICK. Osobna polska strona [interfejsu CAD/CAM](https://www.blum.com/pl/pl/services/industrial-production/cad-cam-interface/) opisuje BXF jako sposób przenoszenia wyników planowania z konfiguratorów do CAD.

### Wniosek i ograniczenia

To bardziej bezpośrednia ścieżka sprawdzenia współrzędnych niż ręczny odczyt `X` z obrazka, **jeśli** producentowy konfigurator pozwala zbudować dokładny wariant MERIVOBOX. Nie dowodzi, że każdy wariant/SKU można wyeksportować, że dowolny CAD/CAM poprawnie interpretuje plik, ani że istnieje publiczne API. Dostęp do wybranego E-Service wymaga aktywacji; konto i uprawnienia warsztatu pozostają do sprawdzenia. Nie wpisywać do aplikacji wyprowadzonych z BXF otworów, dopóki nie wiadomo, że konfiguracja źródłowa odpowiada faktycznie zamawianemu SKU, grubości dna, długości i typowi szuflady.

**P1 — następny eksperyment warsztatowy:** na koncie z właściwym uprawnieniem zbudować konfigurację dokładnego, kupowanego SKU; zachować niezmieniony plik BXF, nazwę usługi/konfiguratora, datę pobrania i podsumowanie konfiguracji. Odczytać geometrię w zgodnym narzędziu, porównać z plan-bookiem oraz próbką detalu, a następnie zasymulować ją w rzeczywistym CAD/CAM/sterowniku zakładu. W razie braku dokładnego artykułu, niejednoznaczności konfiguracji lub niezgodności współrzędnych wynik pozostaje `unknown`, a CNC nie jest zwalniane.

**Mierzalny odbiór:** źródłowy BXF da się powiązać z dokładnym SKU/konfiguracją i rewizją usługi; każda pozycja otworu ma zrozumiałą bazę i jednostkę; po imporcie nie zmieniają się geometria i orientacja części; wynik symulacji i próbny montaż potwierdzają zgodność w tolerancji zatwierdzonej przez warsztat. Zachować hash źródłowego pliku i log przekształcenia/importu. Nie uznawać samego udanego parsowania pliku za zatwierdzenie produkcyjne.
