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
3. Podgląd Vercel 2.0 ma potwierdzony status READY; prawdziwe konta nadal wymagają uruchomienia Supabase.
4. Uzupełnić zatwierdzone informacje o prywatności przed zbieraniem publicznych zapytań.
5. Osobny etap: zaproszenia/reset hasła, pliki, konfigurator klienta z wyceną i udostępnianie zaakceptowanych ofert. Nie są przedstawiane jako ukończone.

Wynik: sprawdzona wersja robocza do przeglądu; **bez deklaracji gotowości produkcyjnej**.

## Kreator kuchni — 31.10.2026

- Build i typecheck zaliczone; statyczny audyt premium: zero ustaleń.
- 3 testy adaptera szkicu oraz 3 istniejące testy dostępu zaliczone.
- 12 scenariuszy Chromium sprawdzonych: 6 dotychczasowych i 6 kreatora. Po naprawie etykiet katalogu ostatni pełny przebieg zaliczył 11; pozostały scenariusz dostępności/3D zaliczono osobno po dostosowaniu oczekiwania na faktyczne załadowanie ciężkiego modułu 3D (do 15 s). Nie pominięto kontroli obecności canvas.
- Kreator: zapis/odtworzenie, kolejność, usunięcie/Cofnij, eksport i przekazanie do formularza; odrzucenie wymiaru/wyjścia poza ścianę; 390 px bez przepełnienia; L i rezerwa narożnika; błędny i poprawny import; dialog anulowania resetu; jawny wybór wersji z innej karty; niedostępne localStorage; axe bez poważnych/krytycznych ustaleń w sprawdzonym stanie; przełączanie elewacja/3D.
- Zrzuty: qa/planner-desktop.png i qa/planner-mobile.png. Dane syntetyczne, rzeczywista geometria buildera. Brak pomiaru na fizycznym urządzeniu.
- Nie testowano wysłania prawdziwego zapytania do stolarni: Supabase nie jest skonfigurowany. Test potwierdza przeniesienie opisu do formularza, nie wysyłkę.

## Układ U

Rozszerzenie sprawdzone: build/typecheck, 5 testów modelu (w tym geometria U, przepełnienie C i zgodność dawnych szkiców), 3 scenariusze Chromium (U: wybór/wymiar C, kontrola miejsca, blokada utraty szafek przy zmianie układu, odtworzenie, rzut/3D, 390 px, opis w formularzu; regresja L i import starszego formatu). Wszystkie zaliczone. Audyt premium: zero ustaleń. Zrzut: `qa/planner-u.png`.

Po oględzinach U dopasowano start kamery do pierwszej użytej ściany szkicu i zmianę ściany do nowego ujęcia. Ponowny scenariusz U oraz kontrola typów frontendu zaliczone.

## Film kuchni Darii w intro

Źródło użytkownika: Full HD H.264 25 kl./s, 14 s, bez audio, 8 138 389 B. Wersja strony: 1280×720 H.264, częste klatki kluczowe, 2 577 076 B i poster około 66 KB. Cały kadr 16:9, bez kadrowania.

Zaliczone: build/typecheck, audyt premium (zero ustaleń), diff check i 10 testów Chromium. Cztery nowe scenariusze: seek zgodny ze scrollem w dół/górę, pauza/wznowienie, brak autoplay; reduced-motion bez pobierania MP4 i jawne włączenie; telefon 390 px (cały kadr, brak przepełnienia, wejście do kreatora); awaria MP4 zachowująca obraz/formularz. Sześć wcześniejszych scenariuszy ról i formularza również zaliczone. Axe w intro bez ustaleń serious/critical. Zrzuty: qa/home-intro-desktop.png i qa/home-intro-mobile.png. Nie sprawdzano na fizycznym iPhonie/Androidzie.

## Korekta hero: film jako tło, tekst ze scrollem

Zgodnie z doprecyzowaniem użytkownika film wypełnia całe hero przez cover, zamiast zajmować osobną kartę 16:9. Na filmie leżą przyciemnienie, tekst i CTA. Nagłówek oraz opis ujawniają się ze scrollem; CTA są zawsze dostępne. Fokus na CTA odsłania tekst. Statyczny wariant pokazuje pełny tekst.

Zaliczone: build/typecheck, audyt premium bez ustaleń, 11 testów Chromium (5 intro + 6 regresji). Nowe kontrole: rozmiar warstwy filmu równy rozmiarowi hero, object-fit cover na telefonie, progres opacity w obie strony, widoczne CTA i ujawnienie po fokusie, pełny tekst w reduced-motion. Zaktualizowano i obejrzano zrzuty home-intro-desktop.png i home-intro-mobile.png. Poprzednia kontrola pełnego kadru dotyczy wcześniejszej wersji, zastąpionej celowym kadrowaniem tła.
