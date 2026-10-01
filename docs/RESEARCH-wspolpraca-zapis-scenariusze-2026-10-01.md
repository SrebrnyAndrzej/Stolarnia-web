# Zapis zespołowy: scenariusze odbioru przed kontami pracowników

01.10.2026. Baza origin/main 8371276; fetch nie wykazał nowych commitów. Uzupełnienie Z02 z RESEARCH-kreator-premium-dla-Claude.md i planu kont; bez zmian implementacji.

## Dowód lokalny i granice

W src/store/store.ts:93–102 PATCH zawiera warunek globalnej wersji dokumentu. Pusty wynik powoduje KonfliktZapisu, a src/server/app.ts:264 mapuje go na HTTP 409. Istnieje więc ochrona współbieżnego zapisu dwóch instancji — nie należy opisywać jej jako nieobecnej. Kompilacja konfiguracją ../tsconfig-firmowe-tests.json oraz istniejący test dist/tests/store.chmura.test.js zakończyły się powodzeniem: 1/1. Test korzysta z lokalnej atrapy PostgREST, nie z produkcyjnej bazy.

Zakres testu: dwie instancje odczytały ten sam stan magazynu, druga zapisała, pierwsza dostała konflikt. Nie dowodzi to ochrony starego formularza w przeglądarce: serwer może pobrać świeżą wersję dopiero przy późniejszym żądaniu. Sygnatura zmienProjekt w src/service.ts:338 nie zawiera oczekiwanej rewizji projektu. To luka do zbadania testem całej ścieżki, nie potwierdzenie utraty danych na produkcji. Globalny dokument obejmuje także katalog i wszystkie projekty, więc niezależne zapisy mogą konkurować o tę samą wersję.

## Oficjalne źródła, odczyt 01.10.2026

S1: [PostgreSQL — izolacja transakcji](https://www.postgresql.org/docs/current/transaction-iso.html). Domyślny Read Committed daje migawkę dla zapytania. Przy współbieżnym UPDATE warunek WHERE jest ponownie sprawdzany względem zaktualizowanego wiersza. To podstawa atomowego porównania rewizji; samo osobne SELECT i późniejsze UPDATE bez warunku nie zastępuje takiej kontroli. Wyższe poziomy izolacji mogą wymagać ponowienia transakcji. Wersji PostgreSQL wdrożonej w projekcie nie sprawdzano.

S2: [Supabase — RLS](https://supabase.com/docs/guides/database/postgres/row-level-security). Polityki ograniczają dostęp do wierszy; klucze serwisowe mogą omijać RLS i nie mogą trafić do przeglądarki. Wniosek projektowy: przejście na konta wymaga sprawdzenia tożsamości i członkostwa także w serwerowej ścieżce używającej klucza uprzywilejowanego. Kontrola rewizji i kontrola uprawnień rozwiązują różne problemy.

## Rekomendacje i testy do wdrożenia przez Claude

| Priorytet | Problem / dowód | Zachowanie i zależności | Mierzalne kryterium |
|---|---|---|---|
| P0 przed wspólną edycją | Stary formularz nie jest tym samym co równoległy PATCH; kod i S1 | Przeglądarka przesyła rewizję, od której zaczęła edycję; serwer atomowo porównuje ją przy zapisie | A i B otwierają r10; A zapisuje r11; B dopiero potem wysyła zmianę tego samego pola z r10: konflikt, r11 zachowana, szkic B możliwy do odzyskania |
| P1 | Globalna wersja wiąże niezależne projekty; store.ts | Rewizje per projekt po migracji modelu kont; wspólne katalogi mają własne wersje | Jednoczesna zmiana dwóch różnych projektów nie powoduje konfliktu wyłącznie przez globalny licznik |
| P0 | Odświeżenie po 409 może zniszczyć niezapisane dane użytkownika | Zachować lokalny szkic oraz pokazać porównanie własnej i zapisanej wartości; nie wykonywać ślepego retry | Po konflikcie i odświeżeniu dostępne oba zestawy zmian; brak samoczynnego nadpisania ceny, konstrukcji lub umowy |
| P0 | Nieznany wynik po przerwaniu odpowiedzi | Identyfikator operacji i odczyt wyniku jej wykonania; zależność: transakcyjny rejestr operacji | Serwer zatwierdza zapis, odpowiedź ginie; ponowienie z tym samym ID tworzy jedną rewizję i najwyżej jedno wydanie |
| P0 przed kontami | Cofnięcie uprawnienia w otwartej sesji; S2 | Kontrola członkostwa przy każdym zapisie, w tej samej granicy transakcyjnej co zmiana; nie ufać tenantId z formularza | Odebranie dostępu przed zapisem blokuje operację; użytkownik innej stolarni nie odczytuje projektu ani zawartości konfliktu |
| P1 | Powiadomienie o obecności nie zapewnia spójności | Obecność/realtime tylko informacyjna; potwierdzenie zapisu pochodzi z serwera | Wyłączenie kanału realtime nie omija kontroli rewizji; stan „zapisano” nie pojawia się przed potwierdzeniem |

Proponowana kolejność: test starego formularza → zachowanie szkicu → projektowa rewizja i uprawnienia → idempotencja wydań → opcjonalna obecność zespołu. Nie wdrażać automatycznego scalania konstrukcji, cen i umów wyłącznie według czasu zapisu. To decyzja projektowa wymagająca reguł domenowych.

## Punkt wznowienia

Sprawdzono origin/main 8371276 i dodatkowo istniejący test chmury 1/1. Brak nowych zmian Claude. Następny przegląd: test API starego formularza i utraconej odpowiedzi na środowisku testowym, bez dotykania danych klientów. Research produkcyjny pozostaje P0: konkretne mocowania Amix/GTV i brakujące operacje Blum; temat zawiasu nie został zatwierdzony. Ceny i historyczne umowy pozostają bez zmian.
