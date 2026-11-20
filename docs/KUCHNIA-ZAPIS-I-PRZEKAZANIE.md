# Kuchnia: zapis, uzgodnienia i przekazanie

## Jeden szkic, jawne wersje

Zapis online korzysta z istniejącej prywatnej tabeli `stolarnia_baza`, w osobnych rekordach `kitchen:<uuid>`. Nie czyta i nie zapisuje dokumentu warsztatu `glowna`. RLS i istniejące uprawnienia service_role pozostają bez zmian; migracja SQL nie jest potrzebna. Lokalnie ten sam kontrakt zapisuje oddzielne pliki JSON.

Link edycji i link podglądu mają różne losowe tokeny 256-bitowe, przekazywane w fragmencie adresu oraz nagłówku Authorization, nigdy w ścieżce API. Baza przechowuje tylko skróty tokenów. Podgląd nie daje zapisu. Odczyt i zapis: no-store; linki wygasają po 90 dniach. Osoba posiadająca link może odczytać projekt i oryginały, o czym klient jest informowany przed udostępnieniem. Otworzenie linku pokazuje osobny podgląd; dopiero jawne wczytanie zastępuje lokalny szkic, zachowując Cofnij.

Zapis wymaga aktualnej rewizji (CAS). Konflikt 409 nie nadpisuje danych; klient może wczytać nowszą wersję lub zapisać osobną kopię. Limit nowych projektów: 12 na godzinę na identyfikator przeglądarki/adres serwera pośredniczącego; nie jest to ochrona przed rozproszonym nadużyciem. Schemat ogranicza rozmiar modelu, liczbę i sumę załączników. Oryginały są w istniejącym prywatnym magazynie plików, w niezmiennych fragmentach do 2 MiB, aby żądania mieściły się w limicie funkcji Vercela. Oryginał jest wymagany przy zapisie i przekazaniu; brak pliku daje błąd zamiast pozornego sukcesu.

## Akceptowane decyzje i pomiary

`KitchenItem.locked` zachowuje pozycję, gabaryty i wyposażenie. Wspólny strażnik zmiany chroni też elementy, które przesunęłyby się po edycji wcześniejszej szafki. Jawne odblokowanie umożliwia edycję. Generator przywraca blokady tylko na zgodnych stanowiskach i ponownie waliduje geometrię. Jeśli nie potrafi zachować wszystkich blokad, odmawia zmiany z komunikatem; nie obiecuje pełnego solvera ograniczeń. Oryginalne uzupełnianie istniejącego ciągu pozostaje dostępne.

Deklaracje pomiarów dotyczą dokładnego zestawu wymiarów i przyłączy. Zmiana ścian, wysokości, układu lub oznaczeń przyłączy unieważnia ich oznaczenie. Zmiana dekoru go nie unieważnia. Deklaracje klienta nie są zatwierdzeniem produkcji.

Gabaryty przedmiotów sprawdza się wobec światła pomiędzy rzeczywistymi płytami szafek półkowych z buildera, bez obrotu przedmiotu. Wynik nie potwierdza przejścia przez drzwi, nośności, luzu zawiasów ani pojemności szuflad/AGD. Ostateczny dobór okuć jest osobnym etapem.

## Poprawki i budżet

Propozycje korekt kolizji obejmują bezpieczne odsunięcia ostatniej szafki ciągu. Muszą zmniejszać liczbę problemów, nie wprowadzać nowych i zachować blokady. Klient widzi plan po zmianie oraz oba wymiary przed zastosowaniem; wspólne Cofnij przywraca projekt.

Oszczędności porównują rzeczywiste wyceny tego samego silnika: podstawowy laminat lub jedna niezablokowana szafka półkowa zamiast szufladowej. Nie stosujemy procentowych rabatów ani nie usuwamy AGD. Cena jest modelowa, bez zakupu urządzeń i prac instalacyjnych. Zastosowanie wariantu zmienia szkic dopiero po jawnej akcji.

## Zapytanie i pakiet warsztatowy

Przejście do zapytania zapisuje projekt z oryginałami, a następnie tworzy niezmienną migawkę. Formularz zawiera numer wersji, prywatny link tej migawki i skrót opisu. Dopiero wysłanie istniejącego formularza zapytania przekazuje dane kontaktowe stolarni. Kolejna edycja nie zmienia wcześniejszej migawki. Ponowienie tworzenia migawki tej samej rewizji jest idempotentne.

Zalogowany właściciel może pobrać z zamkniętej migawki pakiet JSON i formatki CSV. Pakiet zawiera pełny model, cenę sprzedaży, AGD, materiały/dekory, okucia z buildera, metadane oryginałów i braki. CSV ma wymiary **po oklejeniu**, podział na materiały/dekory oraz krawędzie DA/DB/KA/KB. Korpus modelowy jest biały 18 mm; wybór dekoru frontu nie zmienia go na dekor korpusu. Reguły widocznych krawędzi, produkty okuć i materiały wymagają zatwierdzenia technologicznego przed zamówieniem. Ten pakiet jest szkicem przygotowania, nie zatwierdzonym rozkrojem produkcyjnym i nie wysyła zamówienia do Mussi.

Źródła: `src/server/kitchen-projects.ts`, `src/core/kitchen-project-details.ts`, `kitchen-locks.ts`, `kitchen-storage-check.ts`, `kitchen-repairs.ts` oraz istniejące `builder`, `production`, `kitchen-estimate`. Testy: `src/server/kitchen-projects.test.ts`, `src/core/kitchen-project-tools.test.ts`, `tests/v2/kitchen-online.spec.ts`.
