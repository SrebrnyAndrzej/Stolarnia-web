# Kreator mebla — ustalenia użytkownika, 2 listopada 2026

Status: wymagania zatwierdzone; ten dokument nie potwierdza implementacji ani wdrożenia.

## Dostęp i biblioteka

- Kreator dostępny w panelu właściciela i pracownika.
- Zapisany mebel trafia do wspólnej biblioteki warsztatu.
- Właściciel i każdy aktywny pracownik mogą edytować wszystkie modele w bibliotece, również utworzone przez inne osoby. Bez ograniczenia do własnych modeli.
- Decyzja dotyczy modeli mebli; nie rozszerza dostępu do cen, klientów, ustawień ani zarządzania kontami.
- Zapis wymaga sprawdzenia wersji. Konflikt zachowuje lokalne zmiany i nie nadpisuje nowszego modelu. Autor i osoba ostatnio zapisująca pochodzą z sesji.
- Kopia szablonu użyta w projekcie nie może zmienić się wskutek późniejszej edycji biblioteki; należy przechować identyfikator i wersję źródła.

## Konstrukcja

- Edytowalne gabaryty oraz obrys zabudowy prostokątnej, ze skosem i pod schodami.
- Dodawanie płyt, w tym półek i przegród, zmiana wymiarów i pozycji.
- Przesuwanie w podglądzie oraz równoważna edycja liczbowa w mm bez przeciągania.
- Dodawanie liczby szuflad z możliwością mieszania niskich, średnich i wysokich frontów oraz indywidualnej zmiany ich wysokości.
- Wysokość frontu nie jest wysokością boku szuflady. Wymiary skrzynki i otworowanie wymagają wybranego, kompletnego profilu okuć.
- Podgląd i dokumentacja mają korzystać z tej samej konstrukcji. Należy wykrywać elementy poza obrysem, kolizje i niepoprawne wymiary; brak danych produkcyjnych ma być jawny.

## Odbiór

1. Pracownik zapisuje model; drugi pracownik i właściciel widzą go i mogą zapisać zmianę.
2. Dwie otwarte wersje tego samego modelu: drugi zapis starszej wersji zwraca konflikt bez utraty szkicu.
3. Półkę można dodać, przesunąć i zwymiarować klawiaturą; ponowne otwarcie zachowuje parametry.
4. Skos i obrys schodkowy są zachowane po zapisie, a elementy wychodzące poza obrys są zgłaszane.
5. Zestaw mieszanych szuflad zachowuje liczbę, kolejność i wysokości frontów po ponownym otwarciu.
6. Konto nieaktywne i osoba niezalogowana nie mogą czytać ani zmieniać biblioteki przez API.
7. Edycja biblioteki nie zmienia wcześniej zapisanej konstrukcji projektu.

Dokument uzupełnia istniejące briefy kreatora i nie zmienia opisanej w CLAUDE.md odpowiedzialności za implementację silnika.
