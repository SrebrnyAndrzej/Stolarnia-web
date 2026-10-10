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
