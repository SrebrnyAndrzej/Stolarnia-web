## Samoczynne hero i przejście do następnej sekcji — 31.10.2026

HomeIntro przełączono z timeline scrolla na odtwarzanie muted/playsInline 0,75×, bez pętli. Po naturalnym ended przechodzi płynnie do następnej sekcji. Brak długiej wysokości i sticky. Ręczna nawigacja, fokus w hero, reduced-motion i ukryta karta chronią przed automatycznym przesunięciem. Pauza poza widokiem i w ukrytej karcie; blokada autoplay pokazuje przycisk i pełną treść. Pauza użytkownika odsłania tekst i zachowuje go po wznowieniu.

Typecheck i build poprawne. 7/7 nowych testów przeglądarkowych: samoczynny postęp przy scrollY=0, rzeczywisty ended i przejście, pauza/wznowienie, reduced-motion bez pobierania, telefon/CTA, awaria, ręczna nawigacja bez wymuszonego skoku, zablokowane autoplay. Koniec filmu w teście przyspieszono przez seek blisko końca, po sprawdzeniu naturalnego odtwarzania; nie czekano pełnych 34,7 s w każdej próbie. Axe w teście pauzy bez serious/critical findings. Audyt premium strict: 0 findings. Historyczne testy seekowania scrollowego zastąpione testami bieżącego zachowania.

## Spokojniejsze otwieranie — 31.10.2026

Zmniejszono limit prędkości czasu filmu z 4× do 1× i zwiększono tłumienie z 0,28 s do 0,45 s. Hero ma 560 svh desktop / 400 svh telefon. Build i 2 testy home-motion poprawne. Pięć scenariuszy hero poprawnych; test telefonu wymagał wydłużenia oczekiwania na przekroczenie 5 s czasu filmu (przy limicie 1× nie może to nastąpić w 5 s testu). Ponowiony scenariusz telefonu poprawny. Potwierdzono pauzę, przewijanie w obie strony, ograniczenie skoków, fallback i reduced-motion.

## Film hero v4 — 31.10.2026

Dostarczony film 1080p/26 s zoptymalizowano do 720p H.264 (6 166 969 bajtów), bez audio, z częstymi klatkami kluczowymi i faststart. Zaktualizowano źródło hero i poster; nie zmieniono scroll range, tłumienia ani limitów szybkości. Build poprawny, pełne dekodowanie ffmpeg bez błędów. Pięć testów hero poprawnych; szósty miał próg czasu dla wcześniejszego filmu 14 s. Po zastąpieniu progu odsetkiem długości nowego filmu ponowiony test dużego scrolla przeszedł. Zaktualizowano też progi testu dwukierunkowego do rzeczywistej długości. Bez zmian w zasadach motion/reduced-motion. Screenshoty desktop/telefon odzwierciedlają film v4.

## Dopracowanie paneli i przepływów — 31.10.2026

- Typecheck i build: poprawne. Renderer 3D zachowuje osobny duży chunk; jego pobranie w panelu jest odroczone do wyboru 3D, co potwierdza test żądań sieciowych.
- Pełny przebieg 27 testów Playwright: 26 poprawnych; jeden starszy test 3D przekroczył dotychczasowe 5 s przy zimnym, odroczonym ładowaniu. Po dostosowaniu oczekiwania do jawnego stanu ładowania (15 s) ponowiono ten scenariusz: poprawny, 12,2 s łącznie. Nie zmieniono geometrii ani silnika, zachowano powrót do 2D.
- Nowe scenariusze: link pracownika z parametrami i odświeżenie, zachowanie etapu i projektu, pusty filtr i odzyskanie listy, wyszukiwanie zapytań oraz zmiana roli demo na telefonie, błędny e-mail i widoczność hasła, odświeżenie dokumentacji po wygenerowaniu PDF.
- Pierwsze robocze błędy nowych testów dotyczyły atrapy zwracającej zawsze pierwszy projekt oraz etykiety selecta; poprawiono atrapę i jawne powiązanie label/id w UI. Końcowe scenariusze są poprawne.
- `npm run test:v2:unit`: 3/3 poprawne. Audyt premium strict: 0 findings. Mobilne ekrany właściciela, pracownika i zapytań: brak poziomego overflow i 0 serious/critical axe findings.
- Nie zmieniono src/core, finansów, polityki uprawnień, mediów hero ani konfiguracji prawdziwych kont. Brak konfiguracji auth/formularza nadal blokuje pełne uruchomienie produkcyjne.

## Dokumentacja techniczna i montażowa — 31.10.2026

- `npm run typecheck` i `npm run build`: poprawne, istniejące ostrzeżenie dużego chunka 3D bez zmian.
- `node --import tsx scripts/verify-v2-access.mjs`: 38 kontroli API, izolowana baza i mock auth. Dokumenty oraz PDF: role, przydział, nieaktywne konto, rewizja, błędny moduł/wydanie, cache i brak danych prywatnych. Tekst rzeczywistych PDF-ów sprawdzony przez pdftotext, w tym pełny pakiet właściciela i karty pracownika z zamrożonego wydania po zmianie bieżącego projektu.
- `tests/v2/documents.spec.ts`: 4/4 poprawne po poprawieniu zakresu selektora alertu i oczekiwania na lazy-loaded widok. Przygotowanie, błąd i ponowienie, zachowanie zakresu, pobranie Blob/PDF, mobilny reflow, brak wydania oraz syntetyczny demo PDF.
- `tests/v2/interface.spec.ts`: 6/6 poprawne w przebiegu z nową dokumentacją (pierwszy przebieg miał 2 błędy w nowych testach dokumentacji, następnie poprawione jak wyżej).
- `src/pdf.test.ts` i `src/wydania.test.ts`: 3/3 poprawne. Potwierdzono domyślny generator i niezmienność wydania.
- Audyt statyczny premium strict: 0 findings. Axe na otwartym panelu dokumentacji pracownika przy 390×844: 0 serious/critical, brak poziomego overflow. Obejrzano raster wektorowej karty szafki (wymiary, części, tabela operacji, okucia i status roboczy).
- Wydruk sprawdzono do etapu wygenerowania i pobrania PDF; nie wykonano fizycznego wydruku ani warsztatowego odbioru konstrukcji. Prawdziwe konta nadal wymagają konfiguracji środowiska/migracji.

## Iteracja 31.10.2026 — układ strony i ekrany ról

- Typecheck i build: poprawne; pozostaje ostrzeżenie Vite o dużym istniejącym chunku 3D.
- 12 testów Playwright (home-animation + interface): poprawne. Rozszerzone asercje nagłówków ról, skrótów i braku żądań finansowych pracownika.
- 3 testy serwerowego zakresu dostępu i technicznego DTO: poprawne.
- Statyczny audyt premium strict: 0 findings.
- Obejrzano ekran właściciela 1488×1056 i pracownika 390×844, bez poziomego overflow. Screenshoty przeglądu lokalnie w /tmp, dane syntetyczne.
- Prawdziwe sesje i przyjmowanie zapytań niezweryfikowane: konfiguracja Supabase/środowiska i migracja pozostają do uruchomienia. Testy UI mockują sesje; nie dowodzą gotowości kont produkcyjnych.

> Aktualizacja 31.10.2026: film hero zastąpiony dostarczoną wersją Kuchnia-Darii-animacja-v2.mp4 (14 s). Sterowanie i wygładzanie scrolla pozostają bez zmian. Rendery i nową animację składania przygotowuje Claude. Wcześniejsze prototypy Codex wycofano z publikowanej strony i zachowano w lokalnym archiwum; poniższe wzmianki o ich wdrożeniu są historyczne. Codex odpowiada za układ i treści.

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

## Wolniejszy, łagodniejszy przejazd

Po feedbacku użytkownika wydłużono aktywny zakres scrolla czterokrotnie na desktopie i około pięciokrotnie na telefonie. Film i tekst mają wygładzany postęp zamiast natychmiastowego skoku. Helper czasu ogranicza gwałtowne zmiany i nie oscyluje. Po dojściu do celu oraz poza widokiem nie utrzymuje pętli aktualizacji.

Zaliczone: build/typecheck, 2 testy wygładzania (limit skoku także po długiej przerwie; zbieżność w obu kierunkach bez przekroczenia celu), audyt premium bez ustaleń oraz 8 ukierunkowanych scenariuszy Chromium (6 intro + formularz i dostępność). Nowy scenariusz weryfikuje dłuższy zakres, brak natychmiastowego skoku po przesunięciu do 85% sekcji i późniejsze dojście/cofnięcie. Zaktualizowano zrzuty. Pauza, statyczny fallback i dostępność CTA zachowane.

## Składanie szafki i rendery zapisanych projektów

Na prośbę użytkownika odczytano trzy rzeczywiste analizy projektów z aplikacji stolarnia-web oraz kolory użytych materiałów. Nie zmieniano danych źródłowych ani src/core. Eksport korzysta z istniejącego technicalView i geometrii elementów; publiczne pliki nie zawierają kontaktów, nazw klientów, finansów ani JSON projektów.

Wynik: trzy JPG 1920×1200 (projekty 16/11/12 modułów), ZIP z opisem, animacja 8 s, 1280×720, 25 kl./s, H.264, bez audio, 120 085 B. Pokaz składa 9 elementów szafki dolnej 600 mm; kolejność jest wizualizacją, nie zatwierdzoną instrukcją montażu. Oświetlenie i tło są studyjne, materiały i kolory poglądowe; nie dodano modeli AGD ani tekstur producentów.

Oględziny wykazały zbyt jasne pierwsze eksporty: poprawiono ekspozycję, kontrast płyt i kąt widoku układu z wyspą. W animacji dopasowano końcowe ujęcie do złożonej szafki. Obejrzano trzy finalne obrazy i wybrane klatki animacji. Pipeline i odtwarzalny sposób eksportu: scripts/brand-media/README.md.

Zaliczone: build/typecheck, formatter i audyt premium bez ustaleń; 11 scenariuszy Chromium obejmujących intro, formularz, dostępność i nowe media. Po ostatniej zmianie kadru i eksporcie ponownie zaliczono 3 scenariusze mediów: obrazy 1920 px bez żądań API prywatnych projektów; rzeczywiste odtworzenie filmu/8 s i telefon bez przepełnienia; awaria z posterem. Axe nowych sekcji: zero serious/critical. Dowody: qa/project-renders-desktop.png i qa/cabinet-assembly-mobile.png. Brak sprawdzenia na fizycznym urządzeniu.
