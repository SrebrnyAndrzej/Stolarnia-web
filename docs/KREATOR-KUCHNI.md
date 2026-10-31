# Kreator kuchni — pierwszy zakres klienta

Dostęp bez logowania: `/#/kreator-kuchni` oraz przycisk „Zaprojektuj kuchnię” na stronie głównej.

Działa: układ prosty, L i U; pomiary w mm; szafki dolne, szuflady, wiszące, słupki, zlew i AGD z istniejącego katalogu; dokładanie na końcu rzędu; kolejność strzałkami, usuwanie i Cofnij; cztery poglądowe kolory frontów; elewacja, rzut i 3D z istniejącego buildera; zapis na urządzeniu; eksport/import wersjonowanego JSON; opis układu przenoszony do formularza zapytania. Logowanie ani Supabase nie są potrzebne do projektowania; wysłanie zapytania nadal wymaga konfiguracji serwera opisanej w PAN-STOLARZ-2.0.md.

Nie zmieniono `src/core`: adapter składa dane z katalogu i wywołuje `zbudujModul`. Nie zastępuje konstruktora prowadzonego przez Claude. Narożnik L pozostaje pustą strefą 650 mm na ścianie B. Wstępnie sprawdzamy zmieszczenie modułów na ścianie i nakładanie wiszących ze słupkami, bez gwarancji montażowej.

Kolejny etap: pomiar okien, drzwi i przyłączy; swobodne pozycjonowanie z wpisywaniem odległości i przyciąganiem; rzeczywisty narożnik z katalogu; projekt zapisany w chmurze i przejęcie przez stolarza. Te funkcje wymagają uzgodnienia adaptera z logiką silnika, bez tworzenia drugich reguł konstrukcji we frontendzie. Pełnego standardu planera IKEA nie deklarujemy dla tej iteracji.

Bez danych kontaktowych w localStorage, maksymalnie 24 moduły. Import sprawdza format, wersję i identyfikatory katalogowe; nieznane pola są usuwane. JSON klienta nie może być bezpośrednio wydany na produkcję. Cofnięcie zmian nie obejmuje poprzednich sesji przeglądarki.

Układ U: trzy ściany A/B/C z niezależnymi długościami. Puste strefy narożników 650 mm na początku B i C; geometria ścian z istniejącego renderera (łańcuch 90°). Zmiana na mniejszy układ jest blokowana, dopóki na usuwanej ścianie są szafki. Starsze szkice bez długości C otrzymują domyślne 3600 mm; zapis wersji 1 pozostaje czytelny.
