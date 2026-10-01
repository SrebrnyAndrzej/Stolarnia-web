# Szuflady za drzwiami: zawias, ogranicznik i rzeczywiste światło

Data: 01.10.2026. Brief danych dla Claude, bez zmian logiki aplikacji.
Baza przeglądu: origin/main eb75743; ostatnia rewizja kodu e8dedfe. Po ponownym fetch brak nowych commitów. Wynik wcześniejszych testów e8dedfe: 20/20; tego samego kodu nie testowano ponownie. Dokument nie zatwierdza profilu do produkcji.

## Potwierdzone źródła i granice ustaleń

S1: [Blum EASY ASSEMBLY — ograniczniki zawiasów 155°](https://ea.blum.com/en/opening-angle-stops-155-hinges/), publikacja 2016, aktualizacja wskazana na stronie 2021; odczyt 01.10.2026. Dla opisanego CLIP top 155° producent podaje ograniczniki 70T7553.09 (92°) i 70T7553 (110°), zachowujące zerowe wystawanie. Zastosowanie: ograniczenie kolizji drzwi ze ścianą, sąsiednim korpusem lub uchwytem. To dowód możliwości konfiguracji, nie potwierdzenie aktualnej dostępności w Polsce ani zgodności każdego SKU zawiasu 155°.

S2: [Blum, katalog 2022/2023, strona 83](https://publications.blum.com/2022/catalogue/en/83/), odczyt 01.10.2026. Planowanie zawiasu 155° rozdziela nałożenie pełne, współdzieloną przegrodę i montaż wpuszczany. Uwzględnia FD (grubość frontu), TB (odległość wiercenia), MD (dystans prowadnika), FA (nałożenie) oraz szczelinę F. Wymiary dotyczą ustawienia fabrycznego; producent zaleca próbę montażową przy nałożeniu obok ściany. Odczytano HTML; tabel liczbowych nie przepisano jako danych produkcyjnych bez sprawdzenia rysunków.

Wniosek projektowy: nominalny kąt zawiasu nie zastępuje danych wystawania dla konkretnego zestawu i położenia drzwi. Ogranicznik może umożliwić użyteczny montaż przy ścianie, ale nie zwalnia ze sprawdzenia obrysu drzwi i uchwytu. Brak dowodu dla wariantu oznacza stan niezweryfikowany.

## Stan aplikacji i problem

`src/core/technologia.ts:444` zachowuje brak danych ZAWIAS_ZA_DRZWIAMI. To właściwa blokada; nie wykryto nowej regresji dopuszczającej kompletną produkcję. Wskazówka wymienia jednak 155°/170° jako przykłady, co użytkownik może odczytać jako wystarczający warunek. Zalecenie: wymagać zweryfikowanej konfiguracji zawiasu, prowadnika i nałożenia, zamiast samego kąta.

`src/core/silnik/budowa.ts:290` przyjmuje LW ze strefy, a około linii 326 jedynie ostrzega o listwie dystansowej. Ostrzeżenie nie stanowi modelu listwy ani pomniejszenia światła. Nie usuwać blokady na podstawie ręcznie zaznaczonego pola „zawias szerokokątny”.

## Minimalny pakiet danych do pozyskania

Proponowany kontrakt danych, nie istniejący schemat implementacji:

- Dokładny SKU zawiasu, rodzaj mocowania puszki, SKU i wysokość prowadnika, opcjonalny SKU ogranicznika oraz tabela kompatybilności zestawu.
- Wariant nałożenia, rzeczywiste FA, FD, TB, szczeliny, zakres regulacji i dopuszczalny zakres parametrów profilu.
- Wystawanie drzwi i ramienia zawiasu w światło przy wymaganym kącie wysuwania; obrys ruchu od zamknięcia do otwarcia, strona lewa/prawa oraz pozycje zawiasów w pionie.
- Rzeczywiście osiągalny kąt po uwzględnieniu ścian, innych frontów, uchwytów i urządzeń. Kąt ogranicznika i osiągalny kąt to osobne dane.
- Dla listwy: grubość, długość, wysokość, materiał, mocowanie i jego operacje, strona montażu oraz wpływ na LW i pozycję prowadnic. Nie przyjmować domyślnie 18 mm jako reguły producenta.
- Źródło, wydanie, strona/rysunek, hash pobranego pliku, zakres weryfikacji i osoba zatwierdzająca profil. Aktualna dostępność handlowa oddzielona od poprawności geometrii.

Dla dwóch równoległych listew na płaszczyznach mocowania proponowany model geometryczny to LW użytkowe = światło strefy − listwa lewa − listwa prawa. Jest to zależność geometryczna, nie wzór katalogowy zawiasu. Zależność obowiązuje tylko wtedy, gdy te listwy rzeczywiście wyznaczają płaszczyzny prowadnic. Przykład testowy: 764 − 18 − 18 = 728 mm; liczby 18 są fiksturą testu, nie zaleceniem montażowym. Dopiero do tak ustalonego LW stosować zweryfikowane wzory konkretnej szuflady.

## Zadania dla Claude i kryteria odbioru

| ID / priorytet | Problem i dowód | Proponowane zachowanie | Zależności | Mierzalne kryterium odbioru |
|---|---|---|---|---|
| H01 / P0 przed produkcją | Sam kąt nie opisuje konfiguracji: S2 oraz aktualny komunikat | Dobór zestawu zawias + prowadnik + nałożenie z zakresem parametrów | Karta konkretnego SKU i zweryfikowane tabele | Samo wpisanie 155° lub 170° nie usuwa ZAWIAS_ZA_DRZWIAMI; parametry poza zakresem ponownie blokują kompletność |
| H02 / P0 | Drzwi mogą nie osiągnąć wymaganej pozycji: S1 | Sprawdzenie osiągalnego otwarcia i przestrzeni wysuwu; osobno blokada drzwi, ramienia i szuflady | Geometria pomieszczenia, drzwi, uchwytów, zawiasów | Fikstura z przeszkodą przed wymaganym kątem daje kolizję i brak dopuszczenia; usunięcie przeszkody usuwa wyłącznie ten powód |
| H03 / P0 | Listwa istnieje obecnie w ostrzeżeniu, nie w tej kalkulacji LW | Rzeczywista część konstrukcji z mocowaniem, ceną i zmianą wymiarów szuflady | Profil listwy, operacje mocowania, wzory szuflady | Fikstura 764/18/18 daje LW 728; rozkrój, BOM, wiercenia i 3D wskazują te same dwie listwy; brak mocowania nadal blokuje produkcję |
| H04 / P1 | Obiecująca konfiguracja przy ścianie: S1 | Ograniczniki 92°/110° jako osobne akcesoria, tylko przy potwierdzonej zgodności SKU | Aktualna karta kompatybilności i weryfikacja obrysu | Zmiana ogranicznika zmienia zakres ruchu i BOM; nie zmienia automatycznie statusu innych braków technologicznych |
| H05 / P0 | Dwa skrzydła i przegroda wymagają oceny obu stron: S2 | Walidacja każdego skrzydła i jego nałożenia niezależnie | Profile dla pełnego, połówkowego i wpuszczanego wariantu | Poprawna lewa strona + nieznana prawa nie daje kompletności; zamiana pełnego na połówkowe unieważnia poprzedni wynik do czasu ponownej oceny |
| H06 / P1 | Realistyczny obraz nie dowodzi prześwitu; wymaganie premium wspólnego modelu | Ten sam obrys roboczy w kontroli ruchu, 3D i dokumentacji | Model ruchu H01–H03 | Test dla lewej i prawej strony wykazuje identyczne minimalne prześwity po odbiciu; brak obrysu nie jest prezentowany jako „brak kolizji” |

Priorytety P0 oznaczają warunki zwolnienia do produkcji, nie zakaz tworzenia oznaczonych projektów roboczych. Wynik „nieznany” należy odróżniać od „kolizja” i „sprawdzono bez kolizji”. Nie zatwierdzać geometrii z samej miniatury produktu.

## Kolejność i punkt wznowienia

1. Pozyskać aktualną kartę PL konkretnego CLIP top 155° oraz pasującego prowadnika; wariant pełny i połówkowy badać osobno. Potwierdzić aktualną zgodność ograniczników z wybranymi SKU. Źródła S1/S2 są historyczne, nie wystarczają do zatwierdzenia całego zestawu.
2. Pozyskać wymiarowane obrysy lub CAD i instrukcje montażu; sprawdzić osie, jednostki i zakres regulacji. Dopiero wtedy znormalizować profile i otwory.
3. Po H01/H02 wrócić do danych frontów Amix/GTV oraz tylnego mocowania szuflad z listy zamówień Claude. Nadal otwarta osobna instrukcja zabieraka ZI7.0M07.

Ostatni sprawdzony origin/main: eb75743. Ostatni przegląd zmienionego kodu i testy: e8dedfe, 30.09.2026. Ten pakiet zawiera wyłącznie dokumentację; bez zmian aplikacji, cen i umów.
