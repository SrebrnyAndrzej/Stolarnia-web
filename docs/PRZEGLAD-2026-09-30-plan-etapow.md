# Przegląd i kolejka etapów dla Claude — 30.09.2026

Baza przeglądu: `e8dedfe`. Zakres: celowany przegląd wydań produkcyjnych oraz istniejące testy szuflad, przegród i silnika. Nie jest to pełny audyt wszystkich commitów od 25.09. Codex nie zmienia logiki aplikacji.

## Wyniki sprawdzenia

Kompilacja testów TypeScript zakończona powodzeniem. Uruchomiono `wydania`, `przelicznik-szuflad`, `przegrody`, `silnik`: **20/20** przeszło. Testy regresji nie stanowią niezależnej walidacji odczytów z rysunków producenta. W tej sesji nie zatwierdzono żadnego nowego wymiaru montażowego.

### R01 — zachowanie oryginalnego PDF wydania (P1)

Dowód: `src/service.ts:860–909`, szczególnie `wydaniePdf`, odtwarza dokument przez bieżącą funkcję `dokumentacjaPdf`. Migawka JSON jest chroniona SHA-256, ale nie zapisuje bajtów wydanego PDF. `src/export/pdf.ts:147` deklaruje niezmienność pakietu. Późniejsza zmiana renderera może zmienić rysunek, opisy lub układ starego wydania pomimo niezmienionej migawki. To ograniczenie archiwizacji, nie dowód błędnego obecnego rysunku.

Propozycja: zachować oryginalny pełny PDF wraz z hashem pliku, wersją generatora i manifestem. Ponowne pobranie wydania zwraca ten artefakt. Wyciąg wybranych części generowany później musi być oznaczony jako wyciąg, z odwołaniem do oryginału i wersji renderera. Zależność: prywatne przechowywanie plików i jego kopie zapasowe.

Odbiór: utworzyć wydanie A, wdrożyć zmieniony renderer, pobrać pełne A; SHA-256 pliku ma pozostać taki sam. Zweryfikować sumę po odtworzeniu kopii, a nie tylko na działającej bazie.

### R02 — rozdzielenie archiwum roboczego od zwolnienia do produkcji (P0 przed użyciem na hali)

Dowód: `utworzWydanie` dopuszcza braki, jeżeli `tylkoKompletne` nie jest ustawione. PDF ma oznaczenie „Dokument roboczy — nie do produkcji”, więc nie twierdzimy, że obecnie jest oznaczany jako zatwierdzony. Pytanie Claude z koordynacji wymaga decyzji produktowej, nie uniwersalnej reguły stolarskiej.

Rekomendacja: zachować możliwość archiwizacji roboczej, lecz akcję „Zwolnij do produkcji” oddzielić od „Zapisz migawkę roboczą”. Pierwsza musi wymagać kompletności i uprawnienia; druga nie może trafić do kolejki wykonania. Odbiór: braki blokują produkcję również przez API/MCP, a roboczy PDF pozostaje dostępny do konsultacji.

## Research: trwałość dokumentów i odzyskiwanie danych

Fakt źródłowy: Supabase podaje, że backup bazy nie obejmuje zawartości obiektów Storage, tylko ich metadane. Dostępność backupów zależy od planu; dla planu bezpłatnego zaleca własny eksport i kopie poza usługą. Nie sprawdzano obecnego planu konta użytkownika. Źródło, dostęp 30.09.2026: https://supabase.com/docs/guides/platform/backups

Rekomendacja dla Claude: plan odtwarzania obejmuje bazę, prywatne PDF-y, załączniki, źródłowe dokumenty techniczne i manifest hashy. Kopia nie jest potwierdzona, dopóki izolowane odtworzenie nie pozwoli otworzyć dokumentów i sprawdzić dostępu. Docelową utratę danych i czas przywrócenia uzgodnić przed wyborem płatnego planu; nie uruchamiać płatnych dodatków automatycznie. Testować poza produkcją, bez publikowania danych klientów i sekretów.

## Kolejka realizacji — zadania implementacyjne dla Claude

| Etap | Zakres i zależności | Dane/research Codexa | Kryterium odbioru |
|---|---|---|---|
| A — P0 | Zamknięcie braków technologicznych jednego systemu szuflad; utrzymać status roboczy pozostałych | Oficjalne rysunki prowadnic, frontu, pleców; warianty NL; źródło/strona/hash; odróżnić minimum od stałego wymiaru | Zgodność części i wszystkich operacji z niezależnym odczytem rysunku oraz próbnym montażem |
| B — P0 | Kolizje szuflady wewnętrznej z drzwiami/zawiasem oraz ukrytej szuflady | Konkretny zawias, prowadnik, nałożenie, kąt, dystans, zabierak i wykluczenia | Sprawdzenie ruchu dla dopuszczalnych i niedopuszczalnych przypadków; brak cichego zmieniania okuć |
| C — P0/P1 | Statusy wydań i oryginalne PDF-y; zadania R01/R02 | Manifest pakietu i scenariusze odtwarzania | Brak wydania niekompletnego do produkcji; identyczny oryginalny PDF po aktualizacji aplikacji |
| D — przed kontami | Tożsamość, role, projekty przydzielone pracownikom; ochrona API/MCP/plików | Macierz uprawnień i testy odmowy dostępu | Użytkownik spoza projektu nie pobiera danych żadną ścieżką; odebranie dostępu działa dla istniejącej sesji |
| E — P1 | Akceptacje projektu, zmiany zakresu i cena uzgodniona | Model porównania wersji i akceptowanych dokumentów | Zmiana katalogu nie zmienia umów ani ceny uzgodnionej; zmiana konstrukcji unieważnia właściwą akceptację techniczną |
| F — P1 | Materiały, rozkrój i zamówienia | Macierz format/grubość/struktura, jednostki sprzedaży, ciągłość wzoru | Zakup dotyczy rzeczywistego wariantu; rozkrój zachowuje kierunek i grupy wzoru |
| G — P1 | Produkcja i montaż: części, etykiety, braki i poprawki | Minimalny zestaw informacji dla stanowiska i rewizji części | Poprawka wskazuje konkretną część i wydanie; stary rysunek nie wraca jako bieżący |

Nie rozpoczynać etapów od przepisywania istniejącego silnika: w repo są już drzewo, polecenia, przegrody, fronty i migawki. Najbliższy przyrost to wiarygodność i domknięcie danych, nie kolejna lista funkcji.

## Kolejne źródła i zakres niezamknięty

Oficjalne FAQ Blum opisuje BXF jako dane okuć, montażu i wierceń: https://www.blum.com/gb/en/services/faq/ . To potencjalne źródło porównawcze dla ręcznego odczytu rysunków; nie dowód dostępności publicznego API ani licencji na redystrybucję. Nie zastępować rzeczywistych danych plikiem samodzielnie nazwanym BXF.

Następna sesja: **pakiet A — dokumentacja otworów i frontu LEGRABOX**, według zamówień w KOORDYNACJA-Claude-Codex.md. Odczytać rysunki wizualnie; zebrane liczby opisać z bazami wymiarowania, stronami PDF i niepewnościami. Osobno sprawdzić, czy raster 32 zmienia położenie skrzynki i mocowania frontu spójnie. W tej sesji nie zatwierdzono tej reguły.

## Punkt wznowienia

- Ostatnio pobrany i objęty celowanym przeglądem: e8dedfe.
- Sprawdzone testy: 20, bez błędów. Nie wykonywano pełnego testu UI ani całej aplikacji.
- Zapisane ustalenia: R01 i R02; brak ingerencji w kod i bazę produkcyjną.
- Kontynuować od danych technicznych, a następnie nowych commitów po e8dedfe.
