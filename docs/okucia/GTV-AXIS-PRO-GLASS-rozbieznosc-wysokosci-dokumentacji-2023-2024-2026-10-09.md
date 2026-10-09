# GTV AXIS PRO GLASS: rozbieżne wysokości w instrukcjach 2023 i 2024

Stan: ustalenie źródłowe z publicznych materiałów producenta; niezatwierdzone do produkcji. Data weryfikacji: 2026-10-09.

## Problem

W dwóch instrukcjach GTV dla AXIS PRO GLASS różnią się podane wartości wysokości trzech wariantów. W pliku nazwanym jako instrukcja 2023 tabela podaje Low 86 mm, Medium 120 mm, High 168 mm. Instrukcja nazwana 2024 podaje odpowiednio 84, 116 i 167 mm. Nowszy dokument dodatkowo powtarza te wymiary w tabeli elementów płyty 16 mm i na rysunkach montażowych. Samo porównanie publicznych plików nie wyjaśnia, czy jest to zmiana konstrukcji, zmiana definicji wymiaru, błąd publikacyjny czy przypisanie do innej wersji/SKU.

## Dowód i zakres

- [Instrukcja AXIS PRO GLASS opisana jako 2023](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_PRO_GLASS__%20instrukcja_A4_PL_EN_RU__skrocona__2023r_13.pdf), PDF, s. 1: Low 86, Medium 120, High 168 mm. W tym samym dokumencie opisano pełny wysuw 300–550 mm i obciążenie 40 kg.
- [Instrukcja AXIS PRO GLASS opisana jako 2024](https://api2.gtv.com.pl/pimcore/assets/attachments/karta_techniczna/Axis_PRO_GLASS__%20instrukcja_A4_PL_EN_RU__skrocona__2024r%20_1.pdf), PDF, s. 1–2: Low 84, Medium 116, High 167 mm; tabela elementów z płyty 16 mm powtarza 84/116/167 mm. Rysunki montażowe są oznaczone H=84/116/167.
- [Strona produktu GTV AXIS PRO ze szklanymi bokami](https://gtv.com.pl/produkt/systemy-szuflad-gtv-axis-pro-soft-close-ze-szklanymi-bokami/) opisuje trzy warianty wysokości, nominalne długości 300–550 mm, obciążenie 40 kg i trwałość 60 000 cykli. Dostępna treść strony nie rozstrzyga rozbieżności 2023/2024.

Nowsza instrukcja jest mocniejszym dowodem dla wymiarowania jej własnego zakresu, ale nie stanowi dowodu, że zastąpiła dokumentację wszystkich wcześniej sprzedanych SKU. PDF-y nie zostały pobrane do lokalnego repozytorium, więc ich bajtowe sumy kontrolne i trwała kopia nie są dostępne. Weryfikacja opiera się na bezpośrednio odczytanej treści publicznych plików; źródła należy ponownie sprawdzić przed użyciem produkcyjnym.

## Rekomendacja dla profili

- Traktować AXIS PRO GLASS jako odrębny profil sprzętowy od AXIS PRO oraz MODERN BOX PRO. Nie dziedziczyć ich reguł elementów ani wierceń na podstawie nazwy handlowej.
- Przechowywać wartości H wraz z wersją/dniem dokumentu i dokładnym SKU zestawu. Dla zamówienia bez rozstrzygniętego SKU/revizji wynik ma status `unknown`/nieprodukcyjny, a nie automatyczny wybór między 2023 a 2024.
- Zachować rozbieżność jako konflikt źródeł do wyjaśnienia z producentem lub porównania z fizycznym zestawem. Nie uśredniać wartości i nie podmieniać historycznej dokumentacji zamówienia na nowszą bez mapowania.
- Te karty potwierdzają różnicę wymiarów, ale nie kompletną technologię: nie zatwierdzają wierceń CNC, obróbki szkła, tolerancji ani pełnego zestawu części.

## Priorytet, zależności i odbiór

Priorytet: wysoki dla wyboru profilu i kontroli wysokości frontu; brak podstaw do uruchomienia nowej reguły CNC.

Zależności: dokładne SKU i rewizja kupowanego zestawu, potwierdzenie producenta lub zgodność z fizycznym zestawem, wizualny odczyt wszystkich rysunków wymiarowych, osobne mapowanie elementów i wierceń.

Kryteria odbioru: (1) dla obu źródeł zapisane osobne przykłady Low/Medium/High i pokazana różnica 86/120/168 vs 84/116/167 mm; (2) test wyboru profilu nie miesza dokumentów i zwraca konflikt/`unknown`, jeśli SKU/revizja nie mapuje się jednoznacznie; (3) eksport produkcyjny nie emituje zatwierdzonych wierceń dla tego profilu przed weryfikacją rysunków i powiązaniem SKU; (4) przetestowana wysokość frontu/korpusu dla każdego potwierdzonego wariantu.

## Czego nie ustalono

Nie ustalono przyczyny zmian między plikami, daty wejścia w życie, przypisania wartości do kodów produktu ani tego, który wariant znajduje się w magazynie zakładu. Nie sprawdzono kompletnego rysunku wizualnie przez warsztat, nie skontaktowano się z GTV i nie wykonano testu fizycznego. Do czasu rozstrzygnięcia wartości nie są podstawą do zwolnienia formatki do CNC.
