# Pan Stolarz 2.0 — wynik weryfikacji

Data: 2026-10-31. Zakres: gałąź robocza, lokalny kod i izolowane odpowiedzi testowe. Nie testowano produkcyjnej bazy ani prawdziwych kont.

## Sprawdzenia zaliczone

- `npm run typecheck`: backend i frontend.
- `npm run build`: frontend i backend. Pozostaje ostrzeżenie Vite o dużym współdzielonym pakiecie Three.js; strona publiczna jest dzielona od narzędzi warsztatowych.
- 74 testy regresji rdzenia i dostępu: `node --import tsx --test --test-isolation=none src/*.test.ts src/server/*.test.ts`. Pierwszy przebieg miał blokadę sieci dla atrapy Supabase; po uruchomieniu z dostępem do lokalnych gniazd komplet przeszedł.
- 22 sprawdzenia rzeczywistego Express z atrapą Supabase: anonimowy, pracownik, klient, właściciel, przypisany/obcy projekt, wyłączenie członkostwa, finanse, eksporty, HTTP MCP i CSRF. Brak dostępu do produkcji.
- 6 scenariuszy Chromium: formularz klienta i zachowanie danych po błędzie, właściciel, pracownik na telefonie, konto klienta, demonstracja 2D/3D, dostępność axe (brak poważnych/krytycznych ustaleń w sprawdzonych stanach). Odpowiedzi kont/projektów w tych testach są syntetyczne. To test UI, nie potwierdzenie uruchomienia Supabase Auth.
- Formatter nowych komponentów, `git diff --check` oraz statyczny audyt frontend-design-premium.

## Kontrole wyglądu

Zrzuty `qa/owner-desktop.png`, `qa/client-mobile.png` i `qa/visual-comparison.png` dokumentują działającą implementację. Wymiary testów: desktop 1488×1056; telefon 390×844. Dodatkowo zebrano geometrię przy 1440, 1728 i 390 px.

Znaleziono i poprawiono: przepełnienie nagłówka strony na telefonie, nadpisany rozmiar kwoty w inspektorze, pionowe przepełnienie ramki obrazu i zbyt małe pola dotykowe kompaktowych kontrolek. Osobne stany danych przykładowych są jawnie oznaczone. Raport pomiarowy traktuje dolne wyrównanie stopki (`margin-top:auto`) i celowo przewijaną poziomo listę mobilną jako odchylenia; nie są one przepełnieniem dokumentu ani utratą dostępu do przycisków. Nie podajemy ogólnego wyniku punktowego ani deklaracji pełnej zgodności WCAG.

## Pozostaje przed produkcją

1. Wykonać i przetestować migrację tabel oraz RPC na izolowanym PostgreSQL/Supabase.
2. Skonfigurować poprawny origin, klucze Auth, pierwszego właściciela i pracowników. Sprawdzić rzeczywiste sesje i ograniczenia kont.
3. Potwierdzić Vercel: obecne połączenie zwraca 403 dla szczegółów projektu.
4. Uzupełnić zatwierdzone informacje o prywatności przed zbieraniem publicznych zapytań.
5. Osobny etap: zaproszenia/reset hasła, pliki, konfigurator klienta z wyceną i udostępnianie zaakceptowanych ofert. Nie są przedstawiane jako ukończone.

Wynik: sprawdzona wersja robocza do przeglądu; **bez deklaracji gotowości produkcyjnej**.
