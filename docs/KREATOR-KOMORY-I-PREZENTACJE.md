# Komory, pomieszczenie, prezentacje i dokumentacja — 2.11.2026

## Uruchomienie

W kreatorze właściciela i pracownika, pod rysunkiem: **Rozpocznij układ komór**. Akcja jawnie zastępuje dotychczasowe wnętrze pustymi komorami; zachowuje korpus i konstrukcję biurka. Nie migrujemy automatycznie starych, niejednoznacznych układów płyt. Cofnij odtwarza poprzednią geometrię.

Komorę wybiera się z listy lub klikając pusty obszar w 2D. Podziały pionowe i poziome mają od 2 do 8 części. Komora podrzędna może mieć zablokowany wymiar światła w mm; pozostałe dzielą wolne miejsce po odjęciu przegród. Sprzeczne blokady dają błąd, nie cichą zmianę wartości. Model jest ograniczony do 60 węzłów, głębokości 12 i 150 płyt.

Wyposażenie: otwarta komora, równo rozmieszczone półki lub stos szuflad. Fronty są osobną decyzją: brak, jedne drzwi, para drzwi albo fronty szuflad; strona zawiasu i osadzenie wpuszczane/nakładane. Wariant nakładany przyjmuje połowę grubości boku pomniejszoną o luz jako założenie szkicu, nie dobór zawiasu. Wyposażenie można skopiować z innej komory. Zmiana strony drzwi jest dostępna osobną akcją.

Każda wygenerowana część ma trwały identyfikator i slot w komorze. Zmiana gabarytów przelicza zależne części, zachowując opisy materiałowe i przypisania istniejących frontów. Usunięte fronty tracą przypisania systemów. Zmiana liczby podziałów/wyposażenia obejmuje Cofnij. Serwer odtwarza geometrię z grafu i sprawdza powiązania przed zapisem. Graf nie może zawierać cyklu, brakującego węzła ani wielokrotnego rodzica.

W biurku są osobne korzenie lewej/prawej szafki i nadstawki. Stronę i szerokość szafek ustala się przed uruchomieniem komór; zmiana układu startowego zastępuje graf, co jest opisane w formularzu. Skosy i schody ograniczają części; front prostokątny mieści się do najniższego punktu swojej komory. Zbyt mała komora, nadmiar półek albo frontów są nazwanymi błędami.

Zaawansowana ręczna zmiana wymiarów części jest oznaczana jako własna korekta i zachowywana. Można przywrócić zależność od komory. Wygenerowanej płyty nie usuwa się osobnym przyciskiem — zmienia się wyposażenie lub podział komory. Podział płyt pozostaje dostępny dla starszych modeli.

## Precyzja i 3D

Pokaż wymiary dodaje gabaryt na rysunku. Komory pokazują światło. Przyciąganie do krawędzi i siatki 10 mm jest przełączalne; tolerancja celu 12 mm jest pomocą interfejsu, nie tolerancją wykonania. Dokładne pola w mm pozostają dostępne. Części komór przesuwa się przez zmianę podziału/blokady, zamiast odrywać je przeciąganiem.

3D ma przełączniki frontów, poglądowego otwarcia i widoku rozstrzelonego. Widoczność nie usuwa części z listy. Drzwi obracają się wokół wskazanej strony do 90°; front szuflady wysuwa się według NL lub poglądowej wartości. Nie dodano fikcyjnych skrzynek ani okuć. Kamera, rozstrzelenie i ukrywanie nie zapisują zmiany konstrukcji.

Kontrola wykrywa przecinające się obwiednie części i problemy z pomiarem. Dodatkowo sprawdza poglądowy wysuw oraz obwiednie drzwi w krokach 15° do 90°. To ostrzeżenia o potencjalnych kolizjach. Nie jest to dokładny test brył okuć, ugięć, technologii zawiasów ani dopuszczenie do produkcji. Nierównoległe/nieregularne części mogą dawać ostrzeżenia wymagające sprawdzenia.

## Pomieszczenie i warianty

Włącz **Sprawdzaj dopasowanie do wnęki** i wpisz pomiar niezależnie od wymiarów mebla. Luzy początkowe są przykładem do zmiany. Można dodać do 20 prostopadłościennych przeszkód i do 12 zapisanych mebli z biblioteki. Każdy mebel zachowuje migawkę geometrii i wersję źródłową; nowa wersja biblioteki nie podmienia wstawionej kopii.

X mierzone od lewego boku bieżącego mebla, Y od podłogi, Z od tyłu. W 3D ramka oznacza pomiar, kolorowe bryły przeszkody, a neutralne bryły dodatkowe meble. Widok początkowy obejmuje pomieszczenie. Sprawdzane jest wyjście dodatkowego mebla poza pomiar oraz przecięcie jego części z bieżącym meblem. Ten szkic ustawienia zapisuje się z modelem; nie zmienia istniejących projektów w osobnym projektancie kuchni.

Porównanie A/B pokazuje bieżący szkic i zapisany model obok siebie, z wymiarami i liczbą części. Nie zapisuje żadnego z nich. Kopię modelu tworzy istniejąca akcja zapisu kopii. Obecny standard materiałów/obrzeży można zastosować grupowo do frontów, korpusu lub wnętrza, z możliwością Cofnij.

## Prezentacja dla klienta

Właściciel może utworzyć odnośnik wyłącznie dla zapisanej, bieżącej wersji. Potrzebny jest sam zapis, nie dodatkowe konto klienta. Odnośnik daje dostęp jego posiadaczowi przez 7 dni. Nie jest wysyłany automatycznie. Właściciel może go wycofać i odczytać uwagi.

Serwer zapisuje zamrożoną geometrię, wizualne opisy materiałów oraz wersję biblioteki, oddzielnie od edytowanego modelu. Nie kopiuje cen, marży, kontaktów, danych innych projektów, instalacji/pomieszczenia ani obliczeń zakupowych. Token ma 256 bitów losowości; w bazie znajduje się jego SHA-256. Publiczny odczyt i uwagi wymagają dokładnego tokenu. Pozostałe API pozostaje za sesją i macierzą ról. Tworzenie, lista i wycofanie są tylko dla właściciela.

Publiczna prezentacja jest oddzielnym widokiem od wyłączonych podglądów ról. Nie pozwala edytować biblioteki. Uwagi są podpisane jako uwagi z linku, nie jako zweryfikowana tożsamość klienta. Mogą wskazać część z tej migawki. Limit: 20 uwag po 1000 znaków, deduplikacja po ID żądania. POST sprawdza origin, odczyt nie jest cache'owany, dokument ustawia no-referrer. Zapis uwagi nie jest akceptacją koncepcji ani zgodą na produkcję.

Po wygaśnięciu lub wycofaniu link zwraca niedostępność. Nie ma automatycznego usuwania historycznych prezentacji; limit przechowywania to 100 rekordów. Przed rozbudową obiegu akceptacji potrzebna będzie osobna polityka archiwizacji i identyfikacji klienta.

## Dokumentacja i etykiety

- CSV: części z ID, materiałem, dekorem, grubością, wymiarami, rdzeniem jeśli rozstrzygnięty oraz brakami. Zabezpieczenie wartości arkusza przed interpretacją jako formuły.
- DXF: obrysy od przodu na osobnych warstwach, ułożone obok siebie, jednostka mm. Nie jest to rozwinięcie wszystkich płaszczyzn ani rozkrój/CNC.
- Karta HTML: zamrożony przy pobraniu bieżący szkic, ilustracja, indeks części i kontrola. Otwiera się offline i pozwala wydrukować/zapisać PDF. Wskazuje wersję bazową oraz to, że może zawierać niezapisane zmiany.
- Etykiety z QR: dostępne po zapisie, bez dirty. Powstają lokalnie w przeglądarce, bez zewnętrznego generatora. Zawierają numer, ID, materiał, wymiary i wersję. QR prowadzi do części w panelu wymagającym sesji. Inny numer wersji jest odrzucany zamiast cichego pokazania nowego wymiaru pod starą etykietą.

Wszystkie eksporty mają status szkicu. Etykieta nie zatwierdza technologii. Nie dodano programów maszyn, instrukcji wierceń bez profilu ani pozornego statusu gotowości. Dotychczasowe wydania produkcyjne pozostają osobnym obiegiem.

## Granica tej wersji

To działający etap projektowania, prezentacji i przygotowania danych. Nie jest kompletnym CAD/CAM ani zweryfikowaną biblioteką wszystkich okuć. Szuflady wewnętrzne za drzwiami wymagają odrębnego systemu; obecny graf nie uznaje takiej konfiguracji za sprawdzoną. Drążki, wiercenia i obciążenia nie są zgadywane. Pełny obieg zwolnienia produkcji, adapter obecnego rozkroju i rzeczywiste zamówienia Mussi pozostają zgodnie z wcześniejszym planem wspólnym etapem silnika hurtowni. Nie uruchomiono realnych zakupów, nowych cen ani automatycznego wysyłania wiadomości.
