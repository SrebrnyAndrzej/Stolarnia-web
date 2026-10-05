# KSeF 2.0 a obieg ofert, umów i zaliczek w Stolarnia-web

Data researchu: 2026-10-05
Baza repozytorium: `ce13e640b44132bdc1a477c060ae1ad9352647ee` (`origin/main`)
Zakres: przegląd bieżących oficjalnych informacji Ministerstwa Finansów i statyczny przegląd modułów ofert/umów. To wymagania produktowe, nie porada podatkowa ani potwierdzenie statusu podatnika firmy.

## Co już jest w aplikacji

W `src` i `web/src` istnieją oferty PDF, umowy PDF oraz kwota zaliczki z przełącznikiem „potwierdzam otrzymanie”. W wyszukiwanym kodzie nie znaleziono modułu faktur, integracji KSeF, modelu faktury ustrukturyzowanej ani importu faktur kosztowych. Umowa/oferta/kwit wpłaty i faktura mają różne znaczenie; obecne oznaczenie otrzymanej zaliczki samo w sobie nie tworzy dokumentu w KSeF. Plik PDF oferty lub umowy nie zastępuje XML faktury ustrukturyzowanej.

## Fakty z aktualnych źródeł MF

- Na 05.10.2026 obowiązek wystawiania w KSeF objął największe podmioty od 1.02.2026, a pozostałych podatników od 1.04.2026. Do końca 2026 r. przewidziano wyjątek dla podatników, których miesięczna sprzedaż dokumentowana fakturami nie przekracza 10 000 zł brutto; MF podaje, że wcześniejsi beneficjenci tego odroczenia będą objęci obowiązkiem od 1.01.2027. Statusu VAT firmy, kwoty objętej progiem, rodzaju transakcji i ewentualnych wyłączeń nie ustalano.
- Obowiązek otrzymywania faktur w KSeF rozpoczął się 1.02.2026 r. także dla mniejszych podmiotów, których obowiązek wystawiania zaczął się później. Faktury konsumenckie są w KSeF dobrowolne; jeśli sprzedawca je tam wystawi, musi zapewnić konsumentowi uzgodniony dostęp, m.in. przez odpowiedni kod/link.
- Od 1.02.2026 obowiązującą strukturą e-faktury jest FA(3), XML zgodny ze schematem MF. MF wymienia typy dokumentów, w tym podstawowe, korygujące, zaliczkowe i rozliczające. Numer KSeF jest dowodem przyjęcia/identyfikatorem faktury; potwierdzenie transakcji przed nadaniem numeru jest dokumentem biznesowo-technicznym, nie fakturą.
- KSeF rozróżnia online, offline24, niedostępność systemu i awarię; terminy późniejszego przesłania, sposób udostępnienia oraz QR zależą od konkretnego trybu. Dla wybranych faktur udostępnianych poza KSeF wymagane są kody QR. Trybu nie wolno sprowadzać do zwykłego „offline” aplikacji ani samodzielnie zgadywać.
- W trybach offline certyfikat typu 2 służy do podpisania/oznaczenia kodu tożsamości wystawcy; certyfikaty typu 1 i 2 mają różne przeznaczenie. MF podkreśla potrzebę kontroli dystrybucji i rozliczalności certyfikatów. Klucze/certyfikaty nie mogą trafić do kodu frontendu ani do repozytorium.
- Wysyłka faktury do KSeF nie oznacza automatycznie, że wystarczy wygenerować PDF. FA(3) odrzuca plik niezgodny z aktualnym schematem lub brakującymi wymaganymi polami. Każda zmiana schematu lub API powinna być wersjonowana.

## Wpływ na produkt

**Problem:** oferta i umowa już niosą cenę oraz zaliczkę, ale obecny przepływ nie ma oddzielnego rejestru płatności, faktury zaliczkowej/końcowej, korekty ani potwierdzenia przyjęcia przez KSeF. Jeśli aplikacja będzie rozwijana jako pełny system pracy stolarni, pracownik może pomylić zapisane „zaliczka otrzymana”, PDF umowy i faktycznie wystawioną fakturę.

**Rekomendacja P1 — wymiana danych z programem księgowym, nie budowa pełnego programu podatkowego:** zbudować najpierw bezpieczny eksport/most z zaakceptowanej oferty, umowy i zarejestrowanej płatności do istniejącego programu księgowego z obsługą KSeF 2.0. Właściciel/księgowość zatwierdza status podatkowy, typ nabywcy, kwalifikację zdarzenia i stawki przed utworzeniem/wysłaniem faktury. Bez tej decyzji funkcja pozostaje szkicem/eksportem roboczym.

**Nie podejmować automatycznego wystawienia faktury na podstawie podpisania umowy albo zaznaczenia zaliczki.** Zdarzenie „wpłata odnotowana” musi być oddzielne od „faktura przygotowana”, „wysłana”, „przyjęta z numerem KSeF” oraz „przekazana klientowi”. Terminy i obowiązek dla danej umowy/zaliczki trzeba potwierdzić z księgowym.

## Minimalny model workflow do przekazania Claude

1. **Źródła prawdy pozostają rozdzielone:** oferta (propozycja ceny), akceptacja zakresu, umowa (niezmienna kopia), wpłaty (zdarzenia z dowodem/opisem), faktura (niezmienny snapshot) i identyfikatory odpowiedzi KSeF.
2. **Profil podatkowy firmy zatwierdzany przez właściciela/księgowość:** nazwa/NIP, status i daty obowiązku, domyślne ustawienia stawek/zwolnień, rachunki/płatności oraz zakres uprawnień. Nie wnioskować ze samego NIP-u ani kwoty oferty. Rejestrować datę ostatniej weryfikacji; po zmianie przepisów wymusić ponowny przegląd.
3. **Wystawienie wymaga jawnej czynności i podglądu danych:** wybrać kontrahenta (konsument/podatnik, krajowy/zagraniczny), rodzaj faktury (zaliczkowa/rozliczająca/korygująca), podstawę z zaakceptowanej umowy/pozycji oraz płatność. Użytkownik z uprawnieniem finansowym sprawdza draft FA(3) lub eksport do księgowości. Nie kopiować do pola „opis” pełnej umowy, danych technicznych kuchni ani marketingowych załączników; załączniki KSeF mają własne warunki i nie służą do dowolnych plików.
4. **Statusy bez fałszywego sukcesu:** szkic → walidacja lokalna → oczekuje na wysyłkę / wysyłanie → zaakceptowana + numer KSeF i znaczniki czasowe / odrzucona z błędem → wizualizacja przekazana (sposób, czas, adresat). Samo `HTTP 200` przy przyjęciu zlecenia, wygenerowanie XML/PDF lub nieznany wynik po timeout nie może ustawić statusu „wystawiona”.
5. **Idempotencja i korekta:** każda próba wysłania ma stały identyfikator operacji; timeout nie może tworzyć duplikatu. Po nieznanym wyniku najpierw odpytać KSeF/dostawcę o rezultat, potem zdecydować o ponowieniu. Przy zmianie po wystawieniu nie edytować oryginalnego snapshotu — powiązać korektę z fakturą pierwotną.
6. **Offline to osobny proces prawno-techniczny:** na pierwszą wersję przekazać go integratorowi księgowemu. Jeśli później system ma sam wystawiać offline, wymaga oddzielnej specyfikacji dla rodzajów niedostępności, terminów dosłania, certyfikatu typu 2, QR, retry i alarmów zaległej wysyłki; nie jest to część ogólnego trybu offline aplikacji.
7. **Zakupy i koszt materiału:** później rozważyć odczyt/import faktur zakupowych KSeF do magazynu/kosztów jako osobny kierunek. Nie zamieniać pozycji katalogu okuć/płyt ani prognozy oferty w rzeczywisty koszt bez dokumentu zakupu i przypisania do projektu.

## Priorytety, zależności, kryteria odbioru

| Priorytet | Zakres | Zależności | Kryterium odbioru |
|---|---|---|---|
| P0 — wiarygodność istniejących danych | Oddzielić „umowa”, „otrzymana płatność”, „faktura” i „status KSeF”; zachować historyczne umowy i uzgodnioną cenę bez zmian | Model zdarzeń/audyt; uprawnienia do cen, klientów i finansów | Test pokazuje, że podpisanie umowy i zaznaczenie zaliczki nie tworzą faktury ani statusu KSeF; istniejące umowy pozostają niezmienione |
| P1 — obieg sprzedażowy | Wygenerować kontrolowany draft/eksport dla księgowości z zaakceptowanego źródła; przechowywać referencję KSeF i stan procesu | Potwierdzony status podatnika, kontrahent, księgowość i dostawca/API; rola finansowa; idempotentny event log | Test sandbox: prawidłowy FA(3) ma identyfikator KSeF po przyjęciu; odrzucenie zachowuje czytelny błąd, timeout nie duplikuje faktury, retry sprawdza status |
| P1 | Odbiór faktur kosztowych/materiałowych przez istniejący system księgowy | Zatwierdzony integrator, mapowanie dostawca→projekt/magazyn, uprawnienia | Faktura kosztowa nie zwiększa stanu magazynu automatycznie bez decyzji/odbioru towaru; łącze i identyfikator KSeF zachowane |
| P2 — bezpośrednie API MF/offline | Generowanie, wysyłka, pobieranie, certyfikaty, QR i tryby awarii | Osobny audyt prawny/księgowy i bezpieczeństwa; oficjalny sandbox; monitoring i obsługa zmian API | Pełna macierz online/offline, trybów niedostępności i awarii przechodzi kontraktowe testy MF; brak sekretów po stronie klienta; alarm dla niewysłanej faktury przed terminem |

## Decyzje wymagane przed wdrożeniem

- Właściciel/księgowość: czy aplikacja ma tylko przekazywać dane do używanego programu księgowego, czy kiedykolwiek bezpośrednio komunikować się z KSeF?
- Księgowość: dla podmiotu prowadzącego stolarnię — status VAT, data objęcia wystawianiem KSeF, wyjątki/próg 10 000 zł miesięcznie w 2026, typowe transakcje konsumenckie/B2B, faktury zaliczkowe i rozliczające oraz korekty. Nie zgadujemy tych danych.
- Właściciel: które osoby w aplikacji mogą zobaczyć kwoty, potwierdzać płatności, przygotować fakturę, wysłać ją, pobrać zakupowe dokumenty i dokonać korekty?
- Księgowość i dostawca: źródło numeracji wewnętrznej, rozrachunki, archiwizacja, synchronizacja statusu i obsługa duplikatów.

## Źródła oficjalne MF — sprawdzone 05.10.2026

- Zakres i terminy obowiązkowego KSeF: https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/zakres-obowiazkowego-ksef/ — terminy, próg 10 000 zł do końca 2026, odbiór od 1.02.2026 i wyłączenia (w tym konsumenci).
- Etapy wdrożenia: https://ksef.podatki.gov.pl/etapy-wdrozenia-ksef/ — wskazuje 1.01.2027 dla wcześniej odroczonych najmniejszych podmiotów.
- FA(3) i faktura ustrukturyzowana: https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/faktura-ustrukturyzowana-i-struktura-logiczna-fa/ — XML, numer KSeF, typy zaliczkowe/rozliczające/korygujące, potwierdzenie transakcji i brak statusu faktury przed identyfikatorem.
- Tryby szczególne: https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/tryby-szczegolne-wystawiania-faktur/ — procedury online/offline i różne obowiązki.
- Certyfikaty KSeF: https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/certyfikaty-ksef/ — typ 1/2, wykorzystanie offline, ważność i rozliczalność w organizacji.
- Kody QR: https://ksef.podatki.gov.pl/informacje-ogolne-ksef-20/kody-weryfikujace-qr/ — udostępnianie, jeden/dwa kody i różnice statusu przed/po nadaniu numeru.
- Informacje dla integratorów: https://ksef.podatki.gov.pl/integratorzy-it/ — data wystawienia, tryby, FA(3), walidacja struktury i faktury zaliczkowe.
- Wystawianie i otrzymywanie faktur: https://ksef.podatki.gov.pl/ksef-news/wystawianie-i-otrzymywanie-faktur/ — odbiór, konsument, przekazanie wizualizacji i potwierdzenie transakcji.

Źródła MF mogą się aktualizować. Przed budową lub wdrożeniem integracji ponownie odczytać schemat FA(3), specyfikację API, środowisko testowe, tryby i komunikaty; odrębnie potwierdzić zastosowanie przepisów dla firmy z księgowym. Ten brief nie definiuje stawek, nie wystawia dokumentów podatkowych i nie zmienia umów ani cen.
