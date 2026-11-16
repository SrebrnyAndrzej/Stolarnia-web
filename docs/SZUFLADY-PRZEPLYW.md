# Kalkulator konkretnej szuflady

Stan lokalny, aktualizacja 15.11.2026. Kalkulatory są dostępne tylko dla aktywnego właściciela i pracownika. Wejście: panel stolarni → Kalkulatory stolarza; stare bezpośrednie linki również wymagają logowania. Publiczny klient zachowuje projektowanie kuchni i orientacyjną wycenę, ale nie widzi poniższego przekazania frontu. API, także stare adresy demo, sprawdza sesję i uprawnienia serwerowo. Zmiany nie dodają nowych wymiarów okuć ani zatwierdzeń produkcyjnych.

1. W kuchni wybierz szafkę, następnie konkretny front od góry i Przelicz szufladę tej szafki.
2. Kalkulator otrzymuje jego wymiary oraz światło i długość prowadnicy. Front, dno i plecy są pokazane osobno; dno i plecy mają grubość płyty skrzynki.
3. Odświeżenie zachowuje ostatnią rozpoczętą kalkulację z tego źródła. Można przejść do skosów lub podziału frontów i wrócić bez utraty parametrów.
4. Wróć do kreatora kuchni otwiera tę samą szafkę, ścianę i front. Ręczne zmiany w kalkulatorze nie nadpisują projektu.
5. Przywróć dane z projektu resetuje kalkulację do danych bieżącego łącza, również wybór systemu oraz ręczne pozycje otworów. Zmieniony front lub wymiary źródłowe również rozpoczynają nowe obliczenie.

Pamiętana jest jedna ostatnia kalkulacja z projektu, oddzielnie od samodzielnego kalkulatora. Zapis pozostaje na urządzeniu, bez wyników i danych kontaktowych. Uszkodzona lub niedostępna pamięć nie zastępuje wymiarów z łącza przypadkowymi wartościami. Brak szafki lub usunięty front podczas powrotu daje informację zamiast odtwarzania nieaktualnej konstrukcji.

Nie zmieniono wzorów producentów. Front ma osobny wymiar; wysokość frontu nie jest wysokością boku szuflady. Dno i plecy nadal korzystają z istniejącego serwisu, a nie z drugiej wersji wzorów w UI. Profile robocze pozostają robocze. Zmiana danych lub błąd usuwa poprzednie wyniki i wiercenia z ekranu.

Szuflada za drzwiami ma teraz domyślnie automatyczną szerokość frontu: światło korpusu przed dystansem minus 36 mm po stronie zawiasów, np. 564 − 36 = 528 mm. Zmiana światła lub boków przelicza pole, rysunek i zapytanie. Nie dodaje luzu ani drugiego potrącenia. Checkbox pozwala wrócić do własnej szerokości. Starsze zapisane wartości ręczne pozostają ręczne; montaż wpuszczany zachowuje osobny wymiar.
