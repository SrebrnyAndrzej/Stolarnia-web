# Kontrola jakości danych pozyskanych z instrukcji

01.10.2026. Baza origin/main 98b7d75 po fetch; brak nowych zmian Claude. Ostatnie testy kodu: e8dedfe, 20/20 z 30.09. Nie powtarzano testów kodu przy samym researchu.

## Ustalenia i źródła

Nie udało się w tym przebiegu pozyskać osobnego, wymiarowanego rysunku 175H3100 z oficjalnego źródła w postaci pozwalającej zatwierdzić dodatkowy otwór. Zachować brak danych; nie odtwarzać współrzędnych z nazwy 20/32. Odczyt HTML [strony PL 150](https://publications.blum.com/2024/catalogue/pl/150/) nadal potwierdza dodatkowy wkręt, lecz nie zapewnia jednoznacznego przypisania wymiarów do linii rysunku.

Wyszukiwanie ujawniło także [publikację w ścieżce 2026](https://publications.blum.com/2026/catalogue/en/144/) opisaną wewnątrz jako katalog 2027/2028. Nie utożsamiać roku URL z wydaniem dokumentu ani z datą dostępności produktu w Polsce. To trop do późniejszego sprawdzenia, nie podstawa zastąpienia zweryfikowanego wydania 2024/2025.

Oficjalna [dokumentacja pypdf](https://pypdf.readthedocs.io/en/stable/user/extract-text.html), odczyt 01.10.2026, wyjaśnia, że tabele PDF często są pozycjonowanym tekstem bez semantyki wierszy i kolumn. Ekstraktor nie odczytuje tekstu z obrazów; przy złożonych transformacjach także współrzędne tekstu wymagają ostrożności. Dla cyfrowego PDF najpierw korzystać z istniejącej warstwy tekstowej, zamiast rutynowo zastępować ją OCR.

Oficjalna [dokumentacja PyMuPDF OCR](https://pymupdf.readthedocs.io/en/latest/recipes-ocr.html), odczyt 01.10.2026: obsługa OCR korzysta z Tesseract instalowanego osobno. OCR jest znacznie wolniejszy od zwykłej ekstrakcji; wynik można zachować w TextPage do kolejnych odczytów. To opcja narzędziowa do skanów, nie automatyczne zatwierdzenie technologii. Nie instalowano nowych bibliotek.

## Zalecany proces dla Codexa i Claude

Poniżej propozycje procesu weryfikacji, a nie funkcje już działające w aplikacji.

1. Zachować oryginalny plik/HTML, adres wejściowy i końcowy, czas pobrania, język, wydanie podane w treści oraz SHA-256. Nie nadpisywać starszego źródła przy zmianie treści pod tym samym URL.
2. Rozdzielić ekstrakcję tekstu od odczytu geometrii. Scraper HTML użytkownika jest przydatny do opisu i linków; usuwanie obrazów usuwa jednak dowód konieczny do odczytu otworów.
3. Do każdej reguły przypisać stronę drukowaną, indeks strony pliku, obszar rysunku, SKU/konfigurację, jednostkę, bazę pomiaru i zakres obowiązywania. OCR służy wyszukiwaniu kandydatów do sprawdzenia.
4. Oddzielić statusy: znaleziono źródło, odczytano tekst, sprawdzono rysunek, znormalizowano układ współrzędnych, zweryfikowano komplet operacji. Sprawdzenie jednego wymiaru nie zatwierdza całego profilu.
5. Dla produkcji wymagać kompletności operacji: część i jej strona, pozycja, średnica, głębokość/przelot, narzędzie/rodzaj obróbki i warunki wariantu. Średnica wkrętu nie uzupełnia automatycznie średnicy otworu.

## Zadania i odbiór

| Priorytet | Problem / dowód | Proponowane zachowanie | Zależność i mierzalny odbiór |
|---|---|---|---|
| P0 | Utrata kolumn przy ekstrakcji; dokumentacja pypdf | Odczyt tabeli musi zachować powiązanie wartości z nagłówkiem i wariantem | Zbiór kontrolny: minimum 10 reguł z co najmniej 3 instrukcji, obejmujący tabelę wielokolumnową i rysunek; każda ma zgodne źródło, wariant, jednostkę i bazę |
| P0 | Brak pozycji dodatkowego mocowania 175H3100 | Jawny brak operacji zamiast domyślnej współrzędnej | Profil z nieznanym otworem pozostaje niekompletny pomimo poprawnych pozostałych wymiarów; zero niejawnych wartości zastępczych |
| P1 | Rok URL różni się od etykiety katalogu | Oddzielne pola wydanie, data pobrania, rynek, data obowiązywania jeśli potwierdzona | Fikstura URL /2026/ z etykietą 2027/2028 zachowuje oba fakty; data obowiązywania w Polsce pozostaje nieznana |
| P1 | Zmiana instrukcji pod stałym URL | Nowa rewizja i lista reguł zależnych wymagających przeglądu | Dwa różne hashe tego samego URL nie nadpisują historii; stare wydanie projektu zachowuje swój profil |
| P1 | OCR myli oznaczenia | Zachować surowy odczyt i poprawioną wartość z dowodem | Fikstury: 71B7550/71B7550D, przecinek dziesiętny, znak minus, Ø i „min.”; żadna różnica nie znika bez jawnej weryfikacji |

Kryteria są proponowanymi testami do wdrożenia przez Claude; w tym przebiegu ich nie uruchomiono. Nie zmieniono profili produkcyjnych.

## Punkt wznowienia

Priorytet produkcyjny nadal: rysunek prowadnika/puszki, następnie fronty i plecy Amix/GTV oraz instrukcja zabieraka LEGRABOX. Nie powtarzać samych wyszukiwań 175H3100 bez nowego tropu: następna próba powinna korzystać z pełnego PDF katalogu lub konfiguratora producenta i kontroli wizualnej. Przy braku dostępu przejść do kolejnego systemu. Ostatnia sprawdzona rewizja: 98b7d75. Ceny i historyczne umowy bez zmian.
