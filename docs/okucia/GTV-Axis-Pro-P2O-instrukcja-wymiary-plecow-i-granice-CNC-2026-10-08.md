# GTV Axis Pro P2O — instrukcja montażu pleców i granice danych CNC

Data researchu: 08.10.2026. Uzupełnia kartę cięcia Axis Pro; dotyczy instrukcji zestawu P2O, płyty 16 mm i „Opcji 1”. Nie przenosi danych na inne systemy ani warianty GTV.

## Źródło i potwierdzone informacje

Oficjalna instrukcja GTV: [Axis PRO, KPL69, P2O — instrukcja montażu](https://api2.gtv.com.pl/pimcore/assets/attachments/instrukcja/Axis%20PRO__KPL69__P2O__%20instrukcja_A4_2.pdf), 10 stron, drukowana s. 8 / PDF s. 5.

- Producent osobno pokazuje ściankę tylną i dno dla płyty 16 mm, w wariancie nazwanym „Opcja 1”. To potwierdza, że przy doborze formatek należy zapisać grubość płyty i wariant konstrukcji; instrukcja nie uzasadnia automatycznego użycia tych wymiarów dla innej grubości lub opcji.
- Tabela wysokości drewnianej ścianki tylnej wskazuje: niski 84 mm, średni 116 mm, wysoki 167 mm, bardzo wysoki 199 mm. Są to wysokości drewnianej części, nie nominalne wysokości metalowych boków.
- Rysunek prezentuje widoki z przodu, z tyłu i z boku oraz wymiary montażowe oznaczone m.in. A (odległość montażowa do górnego relingu), B (odległość między relingami) i NF (nałożenie frontu). Te parametry relingów/frontu nie są wymiarami cięcia pleców.
- Ta tabela powtarza zakres wysokości pleców z aktualnej karty Axis Pro zapisanej w `GTV-Axis-Pro-karta-aktualna-elementy-i-wiercenia-2026-10-07.md`; nie stanowi niezależnego potwierdzenia wzorów szerokości/długości. Wcześniejsze formuły z karty pozostają przypisane do dokładnie opisanej tam płyty 16 mm i definicji LW/NL.

## Czego nie wolno wyprowadzać z tekstowego odczytu

Rysunek zawiera schematy i liczby otworów/odległości, ale ekstrakcja tekstu PDF nie zachowuje ich jednoznacznego przypisania do krawędzi, widoku i osi. Nie publikuję tych liczb jako współrzędnych XY. Instrukcja nie daje w odczytanym materiale kompletnej tabeli wierceń pleców wraz z bazą, średnicą, głębokością, tolerancją i dokładnym SKU łącznika pleców. Sam symbol „płyta 16 mm” oraz wizualny schemat nie wystarczą do programu CNC.

Nie potwierdzono w tym dokumencie wzoru dla „Opcji 2”, innych grubości, innych złączy pleców, Axis Pro Glass ani Modern Box PRO. Nie zakładać zgodności między rodzinami na podstawie podobnego wyglądu.

## Zalecenia dla Claude

| Priorytet | Problem / dowód | Zachowanie | Zależności | Mierzalne kryterium odbioru |
|---|---|---|---|---|
| P0 | Instrukcja wiąże rysunek z płytą 16 mm i Opcją 1; wysokość pleców różni się od wysokości boku. | Profil okuć powinien jawnie identyfikować rodzinę, wariant/opcję, grubość płyty, wysokość boku oraz wysokość drewnianego pleców jako osobne dane. | SKU zestawu oraz potwierdzenie, że używany detal jest Axis Pro P2O. | Test wyboru 4 wariantów zwraca wysokości drewnianych pleców 84/116/167/199, bez kopiowania wysokości boków 86/120/168/200. |
| P0 przed CNC | Obraz zawiera wymiary montażowe, ale tekstowa ekstrakcja nie daje pewnej mapy otworów pleców. | Nie generować ścieżki CNC z niejednoznacznych liczb OCR; utrzymać status wiercenia „brak zweryfikowanych danych”. | Czytelny rysunek producenta powiązany z dokładnym SKU łącznika, baza części, Ø, głębokość, tolerancja i walidacja warsztatowa. | Eksport ma odmówić generowania operacji dla pleców do czasu uzupełnienia i zatwierdzenia wszystkich wymaganych parametrów. |
| P1 | A/B/NF dotyczą osadzenia relingów i frontu; można pomylić je z wymiarami formatek. | Semantycznie rozdzielić w modelu wymiary cięcia, montażu relingów i położenia frontu. | Definicje producenta oraz identyfikacja widoku/krawędzi. | Raport techniczny przypisuje każde pole do nazwanego elementu i celu; test wykrywa próbę użycia A/B/NF jako długości formatki. |

## Status i następny krok

Badanie dokumentacyjne; bez zmian logiki i bez testów aplikacji. Potwierdzono wartości tabeli wysokości oraz ograniczenia instrukcji. Przed CNC pozyskać czytelny arkusz/rysunek GTV dla mocowania drewnianych pleców z identyfikacją SKU i jednoznaczną bazą otworów, a następnie niezależnie zweryfikować go na próbce. Dopóki to nie nastąpi, pozostawić same wymiary formatek z karty Axis Pro jako osobny, ograniczony zakres zatwierdzenia; nie podnosić statusu wierceń pleców.
