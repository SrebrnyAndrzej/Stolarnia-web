# Dwa miejsca na animacje — strona główna Pan Stolarz

Status: plan rozmieszczenia i kontrakt osadzenia. Animacje przygotowuje Claude; ich temat, format i gotowe pliki nie zostały jeszcze potwierdzone w tym repozytorium. Poniższe role są rekomendacją, nie opisem otrzymanych materiałów. Nie dodajemy pustych pól ani komunikatów technicznych dla klientów przed dostarczeniem animacji.

## Miejsce A: pierwszy ekran

Lokalizacja: `web/src/v2/Landing.tsx`, obecne `figure.ps-hero-image`, po prawej od nagłówka „Twoje wnętrze. Dobrze przemyślane.”. Animacja zastąpi wizualizację kuchni. Nagłówek i przycisk „Zaprojektuj kuchnię” pozostają zwykłym HTML, widocznym również bez odtwarzania.

Rola: przyciągnąć uwagę i pokazać rezultat pracy Pan Stolarz. Jeśli materiały Claude mają inną narrację, zamienić kolejność A/B po obejrzeniu obu.

Rekomendowana plansza: 4:3, eksport 1600×1200 px, szerokość na desktopie około 600–850 CSS px. Na telefonie pod tekstem i przyciskiem; pełna szerokość kontenera, proporcje 4:3. Dla gotowego materiału 16:9 zachować oryginalny kadr i uzgodnić zmianę proporcji ramki; nie przycinać istotnych elementów przez object-fit:cover.

Do czasu podłączenia pozostaje obecny obraz. Po podłączeniu dedykowany poster z tej samej animacji, zarezerwowane proporcje i rozmiar, bez przesuwania strony po załadowaniu.

## Miejsce B: pokazanie procesu / wejście do kreatora

Lokalizacja: po sekcji „Co planujesz w swoim wnętrzu?”, przed sekcją „Jak działamy”. Osobna sekcja o szerokości zgodnej z pozostałą treścią, bez dwóch filmów odtwarzanych obok siebie. Nad nią krótki nagłówek HTML; obok lub pod nią przycisk „Zaprojektuj kuchnię” prowadzący do `#/kreator-kuchni`.

Rola: pomóc zrozumieć, jak pomysł przechodzi w projekt. Jeśli druga animacja dotyczy realizacji/montażu, nagłówek i przycisk dopasować do rzeczywistej treści — nie przedstawiać filmu jako działania funkcji kreatora, których jeszcze nie ma.

Rekomendowana plansza: 16:9, eksport 1920×1080 px. Desktop: około 1000–1280 CSS px szerokości; telefon: szerokość kontenera z marginesami 24 px, wysokość wynikająca z proporcji. Sekcja ma stałą ramkę także przy błędzie i przed odtwarzaniem. Przed otrzymaniem materiału ta sekcja nie jest renderowana.

## Wspólne zasady dla Claude i integracji

- Oryginalny znak Pan Stolarz; kolory marki #1C2B30, #A5B859, #435058. Bez nowej wersji logo. Teksty i CTA poza wideo, aby zachować czytelność, dostępność i możliwość edycji.
- Przekazanie: format źródłowy, docelowy format do strony, proporcje, czas trwania, informacja o pętli, poster, prawa do wykorzystanych materiałów oraz opis treści. Ścieżki planowane: `web/public/animations/home-hero.*`, `home-process.*` i odpowiadające postery. To kontrakt nazw, plików jeszcze nie ma.
- Dla eksportu wideo: MP4/H.264 jako wariant zgodności, opcjonalnie WebM; bez ścieżki audio dla dekoracyjnego tła. Orientacyjny cel kompresji: do 3 MB dla A i do 5 MB dla B, z kontrolą jakości. Nie używać ciężkich GIF-ów.
- Jeśli Claude dostarcza komponent React/SVG/Lottie zamiast wideo, zachować te same ramki, poster i zasady sterowania. Zależność/runtime ocenić przed włączeniem; ciężki moduł ładować dynamicznie.
- Animacja A: najpierw poster, odtwarzanie bez dźwięku tylko gdy widoczna i użytkownik nie ogranicza ruchu. Widoczny przycisk Wstrzymaj/Odtwórz dla ruchu trwającego ponad 5 s. Brak blokady przewijania i oczekiwania na koniec filmu.
- Animacja B: ładowanie w pobliżu viewportu, uruchamianie po wejściu w widok lub przyciskiem. Poza ekranem i w nieaktywnej karcie odtwarzanie jest wstrzymane. Nie pobierać obu pełnych materiałów przy pierwszym wejściu.
- `prefers-reduced-motion` i oszczędzanie danych: poster, start na żądanie. Odrzucony autoplay nie jest błędem strony. Awaria medium zachowuje poster i dostępny przycisk do kreatora.
- Jeśli animacja przekazuje istotne informacje, dodać odpowiedni opis tekstowy; dla mowy także napisy. Nie polegać na samym ruchu do przekazania instrukcji.

## Układ strony po dostarczeniu materiałów

Nagłówek → tekst + CTA i animacja A → oferta kuchni/szaf/zabudów → animacja B z dopasowaną treścią i CTA → Jak działamy → formularz → stopka.

## Odbiór integracji

Desktop i 390 px: brak przycięcia treści i poziomego przepełnienia, brak przesunięcia layoutu po pobraniu, działające pauza/start z klawiatury, reduced-motion, błąd pliku, blokada autoplay i działanie strony bez animacji. Sprawdzić masę transferu i czas ładowania przed/po. Plan nie oznacza, że animacje są już osadzone lub że ich treść została zatwierdzona.
