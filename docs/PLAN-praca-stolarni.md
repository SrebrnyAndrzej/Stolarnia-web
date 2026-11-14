# Praca stolarni — aktualny zakres

Decyzja użytkownika z 01.11.2026: faktury na razie poza systemem. Zespół: właściciel, Bartek, Kacper. Plan, nie raport wdrożenia. Zastępuje rekomendację pilotażu ERP dla bieżącego etapu.

## Wybór zaplecza

Rozwijamy obecne API Express i Supabase (Postgres, Auth, prywatne pliki). Zachowujemy silnik i generator dokumentacji. Nie wdrażamy teraz Odoo ani integracji banku, faktur, KSeF, podatków czy płac. Właściciel zachowuje istniejący dostęp do wycen; pracownicy nadal bez wycen i finansów.

## Pierwsza kompletna ścieżka

Właściciel wybiera projekt i zatwierdzone wydanie dokumentacji → tworzy zadanie → przypisuje Bartka lub Kacpra → pracownik rozpoczyna pracę → otwiera i drukuje karty → zgłasza blokadę albo kończy zadanie → właściciel widzi postęp i organizuje następny etap.

Pierwsze zadania nie zmieniają automatycznie statusów konstrukcji, nie tworzą nowego wydania produkcyjnego i nie zatwierdzają jakości mebla. Zgłoszenie zakończenia pracy pozostaje oddzielne od odbioru projektu.

## Ekrany

| Ekran pracownika | Zawartość |
|---|---|
| Moja praca | Zadania przypisane do zalogowanej osoby, termin i projekt; filtry aktywne / wstrzymane / zakończone |
| Zadanie | Opis, checklista, start / pauza / zakończ, zgłoszenie problemu, powiązane wydanie dokumentacji |
| Projekty | Dotychczasowy podgląd techniczny, kalkulator szuflad, dokumentacja i druk |
| Zgłoszenia | Brak materiału, błąd wymiaru, uszkodzenie lub problem na montażu; opis i docelowo zdjęcia |

| Ekran właściciela | Zawartość |
|---|---|
| Plan pracy | Zadania Bartka i Kacpra, nieprzypisane prace, terminy i blokady |
| Projekt | Zadania, historia wykonania, wydania dokumentacji i zgłoszenia |
| Zespół | Osobne konta, przydziały projektów, aktywność dostępu |
| Zaopatrzenie — następny etap | Zapotrzebowanie materiałowe, zgłoszone braki, zamówione / dostarczone; później rezerwacje i ruchy magazynowe |

Nie wyświetlamy fikcyjnej dostępności pracowników ani planowanego terminu obliczonego z nieistniejących danych. Brak zadań pokazuje pusty stan, a awaria odczytu błąd z ponowieniem.

## Dane i bezpieczeństwo

- Osobne konta Bartka i Kacpra; nazwa nie jest identyfikatorem dostępu. Do zaproszeń potrzebne będą adresy e-mail. Demo nie tworzy kont produkcyjnych.
- Nowe zadania i zdarzenia w osobnych tabelach; nie w globalnym JSON całej stolarni. Zadanie: ID, projekt, wykonawca, tytuł, opis techniczny, termin, stan, wersja, referencja wydania. Przydział zadania musi odpowiadać przydziałowi projektu.
- Stany robocze zadania: do zrobienia, w pracy, wstrzymane, wykonane. Przejścia sprawdzane na serwerze, z kontrolą wersji i zapisem autora. Ponowienie tej samej operacji nie dubluje zdarzenia.
- Czas pracy: zdarzenia rozpoczęcia i pauzy oraz zamknięte odcinki; bez stawek wynagrodzenia i kosztów. Jedno aktywne zadanie na osobę w pierwszej wersji, wymuszane transakcją. Korekty wymagają śladu w historii.
- Pracownik może aktualizować wykonanie własnych zadań i zgłaszać problemy w przypisanych projektach. Właściciel tworzy zadania, przydziela pracę i zmienia terminy. Pracownik nie zmienia przydziałów ani uprawnień.
- Backend zwraca jawnie dozwolone pola. RLS nowych tabel ma działać w kontekście użytkownika tam, gdzie to możliwe; uprzywilejowane operacje nadal wymagają kontroli serwera. Brak bezpośredniego dostępu pracownika do pełnego ERP/globalnej bazy.
- Dokumentacja pracownika pochodzi z zatwierdzonego wydania. Gdy jest nowsze wydanie, zadanie wymaga jawnego uzgodnienia jego użycia zamiast cichej podmiany kart. Brak wydania nie jest zastępowany szkicem.
- Zdjęcia w prywatnym magazynie, kontrola dostępu przy pobraniu, ograniczenia rodzaju i rozmiaru. Wycofanie dostępu obejmuje pliki. Nie wprowadzać publicznych linków do dokumentacji.
- Odświeżanie sesji, komunikat utraty połączenia i ponowienie zapisu bez utraty wpisanego opisu. Nie pokazywać zapisu jako zakończonego przed potwierdzeniem serwera.

## Kolejność realizacji i odbiór

1. **Trwałe zadania i dostęp:** migracja, reguły uprawnień, API i audyt. Testy: Bartek nie zmieni zadania Kacpra ani nie otworzy nieprzypisanego projektu; ceny nie pojawią się w odpowiedziach. Równoległe edycje nie gubią zmian.
2. **Plan właściciela i Moja praca:** tworzenie/przypisanie, start/pauza/zakończenie, czytelne błędy, puste stany i telefon. Test pełnej ścieżki po odświeżeniu oraz w dwóch sesjach.
3. **Zgłoszenia i dokumenty przy zadaniu:** checklista, problem, potem prywatne zdjęcia; wydruk właściwego wydania. Brak dokumentacji pokazany jawnie.
4. **Zaopatrzenie i montaż:** braki, dostawy, plan montażu, checklisty i odbiór. Pełny magazyn dopiero po określeniu jednostek, rezerwacji i zasad przyjęcia/zużycia — lista braków nie udaje ewidencji stanów.

Nie ma jeszcze wdrożonego nowego backendu zadań ani panelu Moja praca. Przed wdrożeniem sprawdzić bieżące migracje i konfigurację Supabase, wykonać backup i próbę na danych syntetycznych. Bez zmian algorytmów `src/core`, uzgodnionych cen i danych produkcyjnych.
