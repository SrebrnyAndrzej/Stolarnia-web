# Zapasy, rezerwacje, zakupy i faktyczne zużycie materiałów

Data: 2026-10-06
Baza kodu: `9b0f925950d286a9d3781082a40943bab3ebc579` (`origin/main`)
Zakres: wymagania workflow zakupowo-magazynowego dla warsztatu; rekomendacje dla Claude, bez zmian logiki aplikacji.

## Problem

Aplikacja może obliczyć listę formatek i koszty, ale właściciel potrzebuje również odpowiedzi na inne pytania: czego fizycznie jest na stanie, co zostało przypisane do danego zlecenia, co należy domówić, co faktycznie dostarczono i ile materiału zeszło po cięciu. Cennik zakupu i katalog artykułów nie są stanem magazynowym. Pomieszanie ich grozi podwójnym zakupem, brakiem elementu na dzień produkcji albo nieprawdziwym kosztem rzeczywistym.

## Dowody w repozytorium

- `Material` opisuje artykuł (kod, producent, typ, dekor, grubość, wymiary arkusza, jednostka, cena, VAT/rabat, aktywność, kierunek dekoru); nie zawiera ilości fizycznej, lokalizacji składowania, partii ani dostawcy.
- `Okucie` ma SKU, producenta, jednostkę i cenę, ale nie ma stanu, rezerwacji, czasu dostawy ani rekordu zakupu.
- `CennikMaterialow` zachowuje własną cenę netto i datę ostatniej zmiany; jest używany przez wycenę, nie przez ewidencję dostaw i rozchodów.
- `src/core/production.ts` wylicza potrzeby/formatki i rozkrój, a `src/service.ts` wylicza projektową wycenę. Nie znaleziono przepływu rezerwowania płyty/okucia, przyjęcia dostawy, częściowego przyjęcia, wydania na produkcję ani zamknięcia różnicy między planowanym a rzeczywistym zużyciem.
- `src/store/store.ts` przechowuje listy materiałów, cennik, okucia i projekty, ale nie wykryto osobnych encji magazynowych ani zamówienia zakupu.

To wnioski z wyszukiwania statycznego modeli, usług i kodu produkcyjnego. Nie sprawdzano ewidencji poza aplikacją ani istniejących arkuszy/magazynu warsztatu.

## Zalecany model

**P1 — po P0 auth/ACL, wersjonowaniu danych i kopii/restore.** Najpierw ustalić z właścicielem, czy aplikacja ma rejestrować tylko orientacyjne stany, czy ma być źródłem prawdy dla zakupów. Nie przedstawiać wyliczonego stanu z jednego importu jako potwierdzonego fizycznego spisu.

1. **Katalog oddzielony od zapasu:** zachować obiekt `Material`/`Okucie` jako specyfikację i pozycję kosztową. Stan prowadzić jako osobne ilościowe ruchy. Rozdzielić referencyjną cenę katalogową, własną cenę zakupową, prognozę kosztu i koszt faktycznie otrzymanej partii.
2. **Jednostka i identyfikacja:** pozycja magazynowa ma jednoznaczny SKU/ID i jawną jednostkę (szt., arkusz, m², mb, komplet, para, kg). Płyty identyfikować co najmniej po producencie, dekorze, grubości i formacie; obrzeża/okucia po SKU i wymiarach/kolorze. Nie konwertować m²↔arkusz ani kompletów↔sztuk bez zapisanej reguły i źródła.
3. **Ruch zamiast nadpisania licznika:** append-only przyjęcie, wydanie/zużycie, rezerwacja, zwolnienie, zwrot, korekta/inwentaryzacja i złomowanie; każdy ruch zapisuje ilość, jednostkę, czas, autora, powód, dokument źródłowy i link do projektu/zakupu. Błąd koryguje się ruchem kompensującym, nie edycją historii.
4. **Stan dostępny:** pokazywać osobno `fizycznie na stanie`, `zarezerwowane`, `dostępne` i `w drodze`. Rezerwacja nie jest zużyciem; anulowanie lub zmiana rewizji produkcyjnej bezpiecznie zwalnia/zamienia rezerwację. Ujemny stan wymaga jawnego ostrzeżenia/zgody i audytu, nie ukrywa się go zerem.
5. **Zapotrzebowanie projektu:** tworzyć listę materiałową z konkretnego wydania produkcyjnego, nie z dowolnego bieżącego projektu. Ująć płyty, okleiny, blaty, okucia/SKU, ilości zaokrąglane do jednostek sprzedaży, straty/naddatki z widoczną metodą i niepewne pozycje. Nie odejmować automatycznie zużycia tylko dlatego, że wygenerowano rozkrój.
6. **Resztki płyt:** po cięciu użytkownik może ręcznie lub przez potwierdzony odczyt zapisać resztkę: materiał/dekor/grubość, dokładny wymiar prostokąta, kierunek usłojenia, jakość/uszkodzenia, lokalizację, datę. Nie utożsamiać geometrycznego odpadu z resztką nadającą się do ponownego użycia. Rezerwacja resztki wskazuje projekt i zwalnia ją przy anulowaniu.
7. **Zakupy i dostawa:** projekt zamówienia grupuje niezaspokojone potrzeby po dostawcy/SKU, pokazuje brakujące ilości, istniejące zamówienia, proponowany zakup i termin potrzebny na produkcję. Wysłane/zatwierdzone zamówienie pozostaje snapshotem; zmiana potrzeby pokazuje różnicę do obsłużenia, nie edytuje potajemnie zamówienia. Obsłużyć częściowe przyjęcia, zamiennik zatwierdzony przez człowieka, różnice ilości/ceny oraz dokument dostawcy.
8. **Rzeczywisty koszt i cena klienta:** pozycja przyjęta zapisuje cenę partii i rabaty dostawcy. Koszt rzeczywisty projektu można później raportować obok planowanego, ale nigdy nie aktualizuje wstecz `cenaUzgodnionaBrutto`, zaakceptowanej oferty ani historycznej umowy.
9. **Liczenie i uprawnienia:** tylko wskazane role zatwierdzają korekty, anulowanie/ponowne przyjęcie oraz rozchód. Spis cykliczny ma zachować stan systemowy, ilość policzoną, różnicę, autora i uzasadnienie. Widok „ostatni spis” nie jest automatycznie bieżącym stanem fizycznym.

## Priorytety i zależności

- **P0:** auth i izolacja firm (wszystkie zapisy magazynowe i załączniki), integralność/migracje jednego payloadu JSON, odtwarzalne kopie, audyt zdarzeń.
- **P1:** pozycje zapasu i jednostki; ledger ruchów; rezerwacja z wydania; rozliczenie przyjęcia/zużycia; widok zapotrzebowania i zakupów.
- **P2:** automatyczna agregacja rozkroju z resztkami, etykiety i kody kreskowe, wielu dostawców i import zamówień, statystyki niedoborów i rotacji. Integrować tylko po wyborze przez właściciela konkretnego formatu dostawców.

## Mierzalne kryteria odbioru

1. Test: przy stanie 10 arkuszy, zamówieniu w drodze 4 i rezerwacji 6 widok rozróżnia stan fizyczny 10, zarezerwowane 6, dostępne 4 i w drodze 4; powtórne odczyty nie zmieniają stanu.
2. Test: rezerwacja utworzona dla wydania 7 nie przełącza się na rewizję 8 po zmianie projektu; nowa potrzeba pokazuje delta i wymaga jawnego zwolnienia/ponownej rezerwacji.
3. Test: przyjęcie częściowe 5 z zamówionych 8 zapisuje 5 przyjętych, 3 oczekujące i zachowuje oryginalne zamówienie oraz dokument dostawy.
4. Test: korekta błędnego rozchodu przez ruch kompensujący zachowuje oba zdarzenia i autora; raport bieżącego stanu jest odtwarzalny z ledgeru.
5. Test: użycie resztki uwzględnia jej realny wymiar, dekor, grubość i orientację; formatka nie mieści się w resztce — system jej nie rezerwuje i podaje powód.
6. Test: oferta i umowa pozostają identyczne po zmianie ceny zakupu lub przyjęciu rzeczywistej faktury; cena uzgodniona z klientem nie aktualizuje się automatycznie.
7. Użytkownik bez uprawnienia do magazynu nie potrafi przez API, MCP, bezpośredni ID ani eksport zobaczyć/zmienić stanów, zamówień lub dokumentów innych ról/firm.
8. Raport rozbieżności pokazuje jednostkę, partię, lokalizację i źródłowe ruchy; brak potwierdzonego stanu jest wyświetlany jako nieznany, a nie zero.

## Granice i punkt wznowienia

Nie dodano kodu, stanów ani zapasów na podstawie zgadywania; nie ustalono jednostek, dostawców, stanów początkowych ani polityki rezerwacji za firmę. Nie wykonano testów aplikacji, bo jest to brief. Po publikacji sprawdzić nowe zmiany Claude, P0 auth/ACL oraz migracje; jeżeli wdroży model inventory, przeglądać ledger, rezerwacje względem snapshotów i niezmienność ceny klienta. Ostatnia sprawdzona rewizja: `9b0f925950d286a9d3781082a40943bab3ebc579`.
