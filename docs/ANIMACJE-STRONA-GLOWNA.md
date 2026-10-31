# Dwa miejsca na animacje — strona główna Pan Stolarz

Status: animacja otwierająca osadzona w podglądzie; drugie miejsce zaplanowane. Animacje przygotowuje Claude. Użytkownik potwierdził, że animacja z przejazdem kuchni ma być sterowana przewijaniem. Otrzymano Kuchnia-Darii-animacja.mp4: H.264, 1920×1080, 25 kl./s, 14 s, bez ścieżki dźwiękowej. Drugi materiał nie został jeszcze dostarczony. Poniższe role są rekomendacją, nie opisem otrzymanych materiałów. Nie dodajemy pustych pól ani komunikatów technicznych dla klientów przed dostarczeniem animacji.

## Miejsce A: pierwszy ekran

Lokalizacja: tło całej sekcji hero w `web/src/v2/HomeIntro.tsx`, nie osobna karta obok tekstu. Film i poster są absolutną warstwą pod tekstem i CTA. Ciemna nakładka zapewnia czytelność białej typografii i zielonego akcentu Pan Stolarz.

Źródło filmu ma proporcje 16:9, ale ekran wypełnia przez object-fit:cover. Kadrowanie jest responsywne, szczególnie na telefonie; jest to świadoma konsekwencja doprecyzowania użytkownika „filmik w tle sekcji hero”. Obraz zajmuje cały obszar, bez białej ramki.

Nagłówek i opis pojawiają się stopniowo wraz ze scrollem, bez zmiany zajętego miejsca. Przyciski są widoczne od początku. Fokus klawiatury w obszarze CTA odsłania cały tekst. Reduced-motion, oszczędzanie danych i błąd filmu pokazują statyczne tło i pełny tekst, bez wydłużonej sekcji.

## Miejsce B: druga animacja — oczekuje na materiał

Lokalizacja pozostaje zaplanowana po sekcji „Co planujesz w swoim wnętrzu?”, przed „Jak działamy”. Format rekomendowany 16:9. Sekcja nie jest renderowana, dopóki nie otrzymamy drugiej animacji. Nie powielamy filmu Darii w dwóch miejscach. Temat i sposób sterowania drugą animacją ustalimy po obejrzeniu materiału.

## Wspólne zasady dla Claude i integracji

- Oryginalny znak Pan Stolarz; kolory marki #1C2B30, #A5B859, #435058. Bez nowej wersji logo. Teksty i CTA poza wideo, aby zachować czytelność, dostępność i możliwość edycji.
- Przekazanie: format źródłowy, docelowy format do strony, proporcje, czas trwania, informacja o pętli, poster, prawa do wykorzystanych materiałów oraz opis treści. Ścieżki planowane: `web/public/animations/home-hero.*`, `home-process.*` i odpowiadające postery. To kontrakt nazw, plików jeszcze nie ma.
- Dla eksportu wideo: MP4/H.264 jako wariant zgodności, opcjonalnie WebM; bez ścieżki audio dla dekoracyjnego tła. Orientacyjny cel kompresji: do 3 MB dla A i do 5 MB dla B, z kontrolą jakości. Nie używać ciężkich GIF-ów.
- Jeśli Claude dostarcza komponent React/SVG/Lottie zamiast wideo, zachować te same ramki, poster i zasady sterowania. Zależność/runtime ocenić przed włączeniem; ciężki moduł ładować dynamicznie.
- Animacja A: najpierw poster, odtwarzanie bez dźwięku tylko gdy widoczna i użytkownik nie ogranicza ruchu. Widoczny przycisk Wstrzymaj/Odtwórz dla ruchu trwającego ponad 5 s. Brak blokady przewijania i oczekiwania na koniec filmu.
- Animacja B: ładowanie w pobliżu viewportu; postęp jest sterowany pozycją scrolla, nie samoczynną pętlą. Poza ekranem i w nieaktywnej karcie nie aktualizować sceny. Nie pobierać obu pełnych materiałów przy pierwszym wejściu.
- `prefers-reduced-motion` i oszczędzanie danych: poster, start na żądanie. Odrzucony autoplay nie jest błędem strony. Awaria medium zachowuje poster i dostępny przycisk do kreatora.
- Jeśli animacja przekazuje istotne informacje, dodać odpowiedni opis tekstowy; dla mowy także napisy. Nie polegać na samym ruchu do przekazania instrukcji.

## Układ strony po dostarczeniu materiałów

Nagłówek → tekst + CTA i animacja A → oferta kuchni/szaf/zabudów → animacja B z dopasowaną treścią i CTA → Jak działamy → formularz → stopka.

## Odbiór integracji

Desktop i 390 px: brak przycięcia treści i poziomego przepełnienia, brak przesunięcia layoutu po pobraniu, działające pauza/start z klawiatury, reduced-motion, błąd pliku, blokada autoplay i działanie strony bez animacji. Sprawdzić masę transferu i czas ładowania przed/po. Plan nie oznacza, że animacje są już osadzone lub że ich treść została zatwierdzona.

## Przejazd kuchni: uzgodniony sposób działania

- Scroll w dół przesuwa kamerę do przodu; scroll w górę cofa przejazd. To powiązanie postępu 0–1 z pozycją sekcji (scrub), nie jednorazowy start filmu po wejściu na ekran.
- Desktop: sekcja o początkowej długości około 360 vh, kadr `position:sticky` pod nagłówkiem. Cały przejazd przebiega na odcinku od osiągnięcia górnej krawędzi sekcji do końca zakresu sticky. Dokładną długość dopasować po obejrzeniu materiału. Koniec sceny zwalnia kadr do zwykłego przewijania.
- Telefon: krótsza scena, około 280 vh, kadr ograniczony do dostępnej wysokości; nie zasłania treści ani CTA. Ostateczną długość potwierdzić dotykowo na gotowym materiale.
- Nie przechwytywać wheel/touchmove, nie blokować przewijania i nie wymuszać skoków strony. Zwykłe przewijanie, przeciągnięcie suwaka oraz PageDown/Home/End mają działać. Przy wejściu w środek sekcji lub zmianie rozmiaru ekranu odtworzyć właściwy postęp.
- Po zatrzymaniu scrolla kadr łagodnie dochodzi do wskazanej pozycji i zatrzymuje się; nie ma pętli ani samoczynnego odtwarzania. Zastępuje to pierwotny sztywny scrub zgodnie z feedbackiem o zbyt szybkiej i agresywnej reakcji.
- Reduced-motion: jedna reprezentatywna klatka w normalnej sekcji, bez wydłużonego pustego obszaru sticky. Przy niedostępnym rendererze lub pliku ten sam statyczny fallback.
- Preferowany kontrakt od Claude: komponent/scena z jawnym parametrem `progress` od 0 do 1, który ustawia kamerę deterministycznie. Obsługę scrolla prowadzi strona, aby komponent nie dodawał drugiego listenera ani własnego przejmowania przewijania.
- Jeśli plik jest wideo: integracja wymaga sprawdzenia płynnego seekowania w Safari/iOS i Chrome/Android, odpowiednio częstych klatek kluczowych i rozsądnego bitrate. Zmiany currentTime ograniczać do jednej kolejki aktualizacji; nie wymuszać dekodowania wszystkich żądań przy szybkim scrollu. Sam zwykły MP4 z autoplay nie spełni tego wymagania. Wybór wideo lub sceny nastąpi po sprawdzeniu materiału.

Do odbioru dodać: płynny ruch w obie strony, zatrzymanie w dowolnym miejscu, szybki scroll do końca, wejście przez kotwicę, zmianę orientacji telefonu oraz brak blokady dostępu do następnej sekcji. Są to kryteria mechanizmu osadzonego w HomeIntro.tsx; nie oznaczają zakończenia testów na fizycznych urządzeniach.

## Osadzenie filmu Darii

Film otwiera stronę w `v2/HomeIntro.tsx`, wywołanym przez Landing. Film wypełnia tło całego hero przez responsywne kadrowanie cover; tekst i CTA pozostają HTML nad przyciemnieniem. Kopia do strony: `web/public/animations/kuchnia-darii.mp4`, H.264 1280×720, 14 s, 2 577 076 B zamiast 8 138 389 B. Kluczowe klatki co 6 klatek dla seekowania. Poster z pierwszej klatki: `kuchnia-darii-poster.jpg` (około 66 KB). Oryginał jest załącznikiem użytkownika, nie dodawano jego cięższej kopii do publicznych zasobów.

Ta animacja jest sterowana scrollem już w pierwszym ekranie: zakres 360 svh na desktopie i 280 svh na telefonie, przyklejona treść hero. Ruch jest dwukierunkowy, bez autoplay i bez przechwytywania scrolla. Widoczny przycisk pozwala wstrzymać i wznowić powiązanie z przewijaniem. Reduced-motion/oszczędzanie danych pokazują poster, z jawnym opt-in do animacji; błąd filmu zachowuje poster i normalną wysokość sekcji. Materiał jest ładowany dopiero w pobliżu sekcji. Kolejka seeków pomija nieaktualne cele, a dokument w tle nie aktualizuje klatek.

Wcześniejsze propozycje przypisania przejazdu do miejsca B zastępuje identyfikacja użytkownika: przesłany film jest animacją otwierającą. Miejsce B pozostaje przygotowane wyłącznie w planie.

Ostatnie doprecyzowanie: tekst ujawniany jest poprzez opacity i delikatne przesunięcie, zależne od tej samej wartości postępu scrolla; nie przez uruchamianie timera. Przyciski nie są wygaszane. Wsteczny scroll cofa także ujawnienie tekstu.

## Uspokojenie przejazdu po feedbacku

Zakres aktywnego przewijania wzrósł z 65 do 260 svh na komputerze (4×) i z 35 do 180 svh na telefonie (około 5×). HomeIntro nie przypisuje już od razu docelowego czasu filmu: helper home-motion.ts wygładza go w czasie, z limitem skoku po dużym ruchu scrolla i bez oscylacji. Nagłówek/opis również mają wygładzany postęp. Mechanizm zasypia po osiągnięciu celu, poza sekcją i w nieaktywnej karcie. Pause zatrzymuje film, a wznowienie łagodnie dochodzi do aktualnej pozycji.
