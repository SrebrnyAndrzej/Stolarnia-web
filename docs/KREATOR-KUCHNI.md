# Kreator kuchni — zakres klienta

Dostęp bez logowania: `/#/kreator-kuchni` oraz przycisk „Zaprojektuj kuchnię” na stronie głównej. Poniżej stan lokalnego kodu na 15.11.2026; nie oznacza publikacji każdej funkcji na produkcji. Klient projektuje własną kuchnię i otrzymuje orientacyjną cenę wstępną. Samodzielne kalkulatory warsztatowe są wyłącznie dla zalogowanego, aktywnego zespołu w panelu Kalkulatory stolarza.

## Projektowanie

Rozszerzenie 15.11: klient edytuje korpus w cm lub mm, dodaje pasującą szafkę w wybranej luce i widzi przy podglądzie orientacyjną cenę oraz wpływ ostatniej zmiany. Pod podglądem dostępne są: Sprawdź projekt, Okna/drzwi/przyłącza, Zabudowa narożnika oraz Porównaj dwa warianty.

- Okna i drzwi mają ścianę, położenie, szerokość, wysokość oraz poziom od podłogi. Woda, odpływ i prąd są punktami. Woda ustawia środek zlewu; prąd preferuje ścianę gotowania. Generator omija otwory, przycinając nowe szafki do przechowywania; nie przesuwa istniejących urządzeń. Oznaczenia są w szkicu, rzucie, elewacji, opisie zapytania; otwory również poglądowo w 3D i PDF.
- Narożnik ślepy 110 cm z katalogu może zastąpić koniec przechowywania przed zakrętem L/U. Zachowuje odsunięcie sąsiedniej ściany 65 cm i jest wyceniany jako rzeczywista konstrukcja. Kolizja z AGD/słupkiem/osłoną wymaga poprawy przez użytkownika. System wysuwany i otwieranie pozostają do doboru.
- Warianty A/B zapisują na urządzeniu dwie pełne wersje kuchni z oddzielnymi aktualnymi cenami. Użycie wariantu można cofnąć. To nie zapis w chmurze; przy awarii pamięci kopie zostają w otwartej karcie z komunikatem.

Po audycie klienta z 15.11: pomieszczenie można podać w cm (domyślnie publicznie) lub mm; wybór jednostki przelicza pola. Silnik i zapis nadal używają mm. Ułóż całą kuchnię jest główną akcją bezpośrednio po wymiarach; samodzielny start opisano jako dodawanie od zera. Telefon pokazuje najpierw podgląd, a katalog później; strefy rozwijają się pod rysunkiem. Stały dolny pasek prowadzi do podsumowania i z powrotem. Niezastosowana zmiana szafki wymaga Zastosuj lub Anuluj zmiany; nie przechodzi po cichu do ceny. W podsumowaniu taka edycja wstrzymuje cenę oraz PDF.

Na pierwszym ekranie można wybrać Ułóż całą kuchnię po podaniu wymiarów i ewentualnej zmianie założeń hydrauliki. Powstaje od razu edytowalny układ stref; nie trzeba zaczynać od pojedynczego dodawania szafek. Przy istniejącym projekcie akcja jest nazwana Zastąp całą kuchnię. Ręczne wejście pozostaje dostępne.

- Układ prosty, L i U; niezależne długości ścian w mm. W L/U pozostają puste rezerwy narożników 650 mm na początku ścian B/C.
- Szafki dolne, wiszące, szuflady, słupki, zlew i AGD z istniejącego katalogu. Wymiary, liczba półek i szuflad edytowane z walidacją; rzeczywiste światła między półkami.
- W dolnej szafce do przechowywania można zamienić drzwi i półki na szuflady oraz odwrotnie w polu „Wyposażenie szafki”. Zachowane ID, miejsce, gabaryty, przerwa i osłony; bez usuwania i dodawania na końcu ściany. Zastosuj zatwierdza zmianę i aktualizuje cenę, Anuluj przywraca formularz, Cofnij odtwarza również wcześniejsze własne wysokości frontów. AGD oraz wiszące i wysokie pozostają swoimi wariantami.
- Kliknięcie szafki w podglądzie lub na liście prowadzi fokusem do jej edycji. „Wróć do podglądu” zamyka edytor i pokazuje rysunek; niezastosowane zmiany wymagają najpierw Zastosuj lub Anuluj.
- Podział frontów szuflad: dotychczasowy, równy, niski front u góry i własne wysokości. Puste pole Auto dzieli pozostałą wysokość po odjęciu szczelin. Zalogowany właściciel lub pracownik może przekazać wybrany front do kalkulatora szuflad z jego wymiarami; klient nie widzi narzędzi obróbki.
- Blendy dolne, wiszące i wysokie, szerokość 20–300 mm. To rzeczywista płyta frontowa, a nie pełna szafka z okuciami.
- Przerwa przed elementem: pusta przestrzeń w jego rzędzie, bez płyty i blatu. Przesuwa również kolejne elementy tego rzędu. Dopasowanie szerokości uwzględnia przerwy, inne elementy i narożnik.
- Proponowana kuchnia ma strefy chłodzenia, zmywania, przygotowania i gotowania: lodówkę, zlew, sąsiadującą zmywarkę, blat roboczy, piekarnik z płytą i okapem. W L/U funkcje rozłożone między ramiona. Można podać ścianę i dokładny środek zlewu oraz wybrać zmywarkę 600/450 mm lub jej brak. Niekompletna propozycja nie zastępuje projektu.
- Automatyczne uzupełnianie brakujących stref zachowuje istniejące elementy. Jeżeli nie można dodać brakującej funkcji bez przestawiania mebli, wyświetla błąd. Osobne cele Przechowywanie i Przygotowanie uzupełniają wskazaną lukę albo wszystkie luki wybranego rzędu, również między szafkami. Dolne otrzymują półki lub szuflady, górne półki, wysokie słupki spiżarniane; 20–199 mm jako dopasowana blenda. Górne omijają słupki. Pozostałe szafki zachowują pozycje i wymiary. Cały rząd zatwierdzany atomowo, z jednym krokiem Cofnij; luzy poniżej 20 mm pozostają z komunikatem.
- Wykrywanie ciągów Dolny / Górny / Wysoki działa po rzeczywistym sąsiedztwie, poziomie, wysokości i głębokości. Przerwa lub zmiana gabarytu rozdziela ciągi. Liczniki i zwijane narzędzia są bezpośrednio pod podglądem.
- Boki i wieńce osłonowe: sugestia odsłoniętych końców, z jawnym zastosowaniem. Domyślne wysunięcie 20 mm przed zewnętrzne lico frontów, edytowane 0–100 mm. Grubość 18 mm lub 19 mm dla lakieru, zgodnie z materiałem frontu. Domyślnie zachowujemy obrys ciągu, pokazując przed zmianą zwężenie szafki bez AGD. Nisza urządzenia pozostaje stała; brak miejsca blokuje zmianę. Można jawnie dopuścić powiększenie obrysu.
- Osłony są fizycznymi płytami we wspólnym builderze, rzucie, elewacji, 3D i wycenie. Wieńce są modułowe na każdej szafce. Górny wieniec dla wiszących i wysokich, dolny dla wiszących; dolne szafki zamyka istniejący blat. Boki szafek stojących sięgają podłogi, blat obejmuje ich grubość. Osłony są przypisane do szafek i zachowywane w szkicu, imporcie, opisie zapytania i PDF.
- Czytelny podział katalogu na hydraulikę, gotowanie/okap i chłodzenie. Strefy nad podglądem pokazują faktyczne położenia; kliknięcie wybiera element. Oznaczenia AGD na elewacji, poglądowe urządzenia w 3D i aktualizowana po edycji lista braków.
- Kolejność strzałkami, usuwanie, Cofnij/Ponów. Jawne Zastosuj dla edycji wymiarów i wnętrza. Jedna operacja dopełnienia to jeden krok historii.

## Widoki, wycena i zapis

Elewacja, rzut i 3D korzystają z istniejącego buildera. Cztery kolory poglądowe i wybór dekoru; kolor nie zastępuje potwierdzonej specyfikacji. Publiczny serwer wycenia geometrię na stawkach modelowych. PDF zachowuje wzór dwóch A4: cena i zakres oraz wstępny projekt. Liczba blend jest oddzielona od szafek; przerwy nie obejmują ciągłego blatu.

Zapis na urządzeniu, eksport/import wersjonowanego JSON, ochrona przed nadpisaniem przez drugą kartę i opis układu w formularzu zapytania. Maksymalnie 24 elementy, bez danych kontaktowych w localStorage. Import sprawdza wersję i wspólny schemat; nieznane pola są usuwane. Starsze szkice bez nowych pól zachowują dotychczasowe działanie. Historia cofania dotyczy bieżącej sesji.

Logowanie ani Supabase nie są potrzebne do projektowania. Wysłanie zapytania wymaga konfiguracji serwera opisanej w PAN-STOLARZ-2.0.md. JSON klienta jest koncepcją do dalszej weryfikacji.

## Dalsze prace

Swobodne przeciąganie i przyciąganie w publicznym kreatorze, konstrukcje narożne L i dobór systemów wysuwanych, ciągłe blaty i wycięcia, kontrola otwierania, zapis w chmurze oraz przejęcie przez stolarza. Sprawdzamy gabaryty na ścianie, otwory i nakładanie wiszących ze słupkami. Otwory w 3D są oznaczeniami na powierzchni ściany, bez operacji bryłowego wycięcia. Nie jest to kompletna kontrola montażu, dobór technologii okuć lub dokumentacja produkcyjna.

Inspiracje i priorytety: [research polski i wideo](RESEARCH-programy-meblowe-i-wideo-2026-11-14.md), [research rynku zachodniego](RESEARCH-rynek-zachodni-2026-11-14.md).

Kolejność produktu ustalona przez użytkownika: najpierw łatwe projektowanie całej kuchni; później osobny proces projektowania własnych szaf wnękowych.
