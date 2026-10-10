# MERIVOBOX M: wymiar dna i kandydackie pozycje nawiercenia

Data weryfikacji: 2026-10-10
Zakres: wizualny odczyt jednej strony (drukowana s.15) archiwalnego, producentowego PDF planowania; nie jest to zatwierdzenie operacji CNC ani kompletna tabela SKU.

## Problem

Profil `blum-merivobox-m-wood` przechowuje potwierdzone wymiary cięcia, ale `drilling_status` pozostaje `not_normalized`. Na s.15 tego samego PDF znajduje się dodatkowa tabela „Pozycja otworu w dnie szuflady”. Może uzupełnić dane dla konkretnego wariantu, lecz sama tabela nie rozstrzyga wszystkich baz, zakresów NL i warunków użycia wymaganych do produkcji.

## Dowód i fakty

- Lokalna kopia źródła `docs/okucia/pdf/BLUM-Merivobox-planowanie.pdf` jest zarejestrowana w `sources.json`: bezpośredni adres producenta `https://www.blum.com/file/me25532842_ep_dok_bau?country=pl&language=pl`, końcowy plik `me25532842_ep_dok_bau_$spl-pl_$aof_$v5.pdf`, data pobrania 2026-09-23 i SHA-256 `3361fffd4689454b5f21fe6740dd1ea106ea610bcd15697864dba61eb3a4ece7`.
- Wydruk strony 15 oznacza „Wymiary przycięcia dla płyty wiórowej 16 mm”. Tabela podaje drewnianą ściankę tylną H=83 mm, długość dna `Z = NL−26 mm` i elementy `A`/`B` o szerokości `LW−51 mm`.
- Tabela „Pozycja otworu w dnie szuflady” podaje możliwość nawiercenia z użyciem wkrętu z łbem talerzykowym oraz pary `NL → X`: 270→128 mm, 300→128 mm, `>350`→256 mm. Rysunek lokalizacji oznacza ponadto wartości 9 i 16 mm.
- W powiększonym obrazie rysunku wymiar `X` biegnie wzdłuż elementu A, ale strona nie nazywa wprost krawędzi, od której należy go bazować. Nie określa też średnicy, głębokości ani tolerancji nawiercenia. Wiersz `>350` nie wyjaśnia wprost długości 350 mm ani wszystkich dostępnych nominalnych długości.
- Oficjalna polska strona pobrań Blum obecnie wymienia plik „MERIVOBOX PDF” z datą 2026-05-20 w sekcji „Instrukcja montażu”, a osobno „Pomoc w zamawianiu MERIVOBOX i AMBIA-LINE PDF” z datą 2025-07-11 w sekcji „Prospekt”: https://www.blum.com/pl/pl/products/boxsystems/merivobox/downloads-videos/ . Bezpośredni odczyt nowego pliku z 2026-05-20 nie powiódł się. Klasyfikacja na stronie rozstrzyga wcześniejszą niepewność katalogową: dokument z 2026 r. jest przedstawiany jako instrukcja montażu, a nie jako następca pomocy w zamawianiu; nie dowodzi to jednak, czy rysunek planowania z 2023 r. nadal jest technicznie aktualny.
- Oficjalna strona Blum udostępnia także pozycję „E-Service Serwis danych o produktach” oraz „Interfejs oprogramowania CAD/CAM” w sekcji planowania/produkcji. Nie zweryfikowano dostępności ani warunków danych dla tego projektu; to potencjalna droga pozyskania wersjonowanych danych producenta, nie źródło już zastosowane do profilu.

## Proponowane zachowanie

**P1 dla kompletności dokumentacji; brak zgody na produkcyjne użycie wartości X.** Zachować te trzy pozycje jako dowód-kandydat przypięty do źródła, strony, hasha, grubości 16 mm i wariantu drewnianego, nie jako aktywną mapę wierceń. Nie rozszerzać ich na inne wysokości MERIVOBOX, dno 21 mm, stalową ściankę tylną, inne długości, TIP-ON ani SKU bez odrębnego źródła.

Przed normalizacją profilu: sprawdzić przede wszystkim oficjalną „Pomoc w zamawianiu” z 2025-07-11 jako dokument planowania; instrukcję montażu z 2026-05-20 porównać pomocniczo dla wymagań montażowych, bez założenia, że zastępuje arkusz planowania. Potwierdzić u Blum/dostawcy, czy `X` liczy się od frontu czy od pleców, do jakiego dokładnego punktu i dla jakich NL obowiązuje. Ustalić rzeczywiste wymiary/typ nawiercenia z instrukcji lub montażu próbnego, a nie wyprowadzać go z oznaczenia wkrętu. Sprawdzić, czy E-Service udostępnia dla dokładnego SKU wersjonowany eksport CAD/CAM, i udokumentować jego zakres/licencję przed użyciem. Dopiero kompletna, zatwierdzona karta wariantu może zasilić osobny profil CAM.

## Zależności i mierzalne kryteria odbioru

- **Zależności:** dokładna rewizja instrukcji producenta, tabela dostępnych NL i SKU kupowanych przez warsztat, definicja bazy `X`, średnica/głębokość/tolerancja wynikająca z dokumentacji lub potwierdzonej technologii oraz próba na detalu.
- **Odbiór źródłowy:** dla każdej użytej długości zapisano osobno SKU, rewizję dokumentu, stronę, grubość dna, definicję bazy, współrzędne względem wskazanych krawędzi, typ i parametry otworu; wyjątki z tabeli (w tym NL=350) jawnie rozwiązano albo oznaczono `unknown`.
- **Odbiór warsztatowy:** testowy bok/dno właściwego wariantu montuje się bez kolizji i z właściwym wkrętem; zmierzona pozycja otworu mieści się w tolerancji zaakceptowanej przez zakład.
- **Odbiór bezpieczeństwa:** do zakończenia powyższych testów status profilu pozostaje nieprodukcyjny, a eksport CNC nie emituje tych pozycji jako zweryfikowanych otworów.

## Granice

To nowy odczyt strony archiwalnego pliku już przechowywanego w repozytorium, nie potwierdzenie aktualności jego wymiarów, sprzedaży SKU, montażu ani zgodności istniejącego kodu. Nie wykonano testu fizycznego, zmiany katalogu ani logiki aplikacji.
