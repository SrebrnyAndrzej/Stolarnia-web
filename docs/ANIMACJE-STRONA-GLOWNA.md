# Dwa miejsca na animacje — strona główna Pan Stolarz

Status: plan rozmieszczenia i kontrakt osadzenia. Animacje przygotowuje Claude. Użytkownik potwierdził, że animacja z przejazdem kuchni ma być sterowana przewijaniem. Nie potwierdzono jeszcze formatu ani gotowych plików. Poniższe role są rekomendacją, nie opisem otrzymanych materiałów. Nie dodajemy pustych pól ani komunikatów technicznych dla klientów przed dostarczeniem animacji.

## Miejsce A: pierwszy ekran

Lokalizacja: `web/src/v2/Landing.tsx`, obecne `figure.ps-hero-image`, po prawej od nagłówka „Twoje wnętrze. Dobrze przemyślane.”. Animacja zastąpi wizualizację kuchni. Nagłówek i przycisk „Zaprojektuj kuchnię” pozostają zwykłym HTML, widocznym również bez odtwarzania.

Rola: przyciągnąć uwagę i pokazać rezultat pracy Pan Stolarz. Jeśli materiały Claude mają inną narrację, zamienić kolejność A/B po obejrzeniu obu.

Rekomendowana plansza: 4:3, eksport 1600×1200 px, szerokość na desktopie około 600–850 CSS px. Na telefonie pod tekstem i przyciskiem; pełna szerokość kontenera, proporcje 4:3. Dla gotowego materiału 16:9 zachować oryginalny kadr i uzgodnić zmianę proporcji ramki; nie przycinać istotnych elementów przez object-fit:cover.

Do czasu podłączenia pozostaje obecny obraz. Po podłączeniu dedykowany poster z tej samej animacji, zarezerwowane proporcje i rozmiar, bez przesuwania strony po załadowaniu.

## Miejsce B: przejazd kuchni sterowany przewijaniem

Lokalizacja: po sekcji „Co planujesz w swoim wnętrzu?”, przed sekcją „Jak działamy”. Osobna sekcja o szerokości zgodnej z pozostałą treścią, bez dwóch filmów odtwarzanych obok siebie. Nad nią krótki nagłówek HTML; obok lub pod nią przycisk „Zaprojektuj kuchnię” prowadzący do `#/kreator-kuchni`.

Rola: prezentacja kuchni przez płynny przejazd. To rekomendowane miejsce dla potwierdzonej przez użytkownika animacji scrollowej. Treść tytułu dopasować do materiału Claude; nie przedstawiać filmu jako działania nieistniejących funkcji kreatora.

Rekomendowana plansza: 16:9, eksport 1920×1080 px. Desktop: około 1000–1280 CSS px szerokości; telefon: szerokość kontenera z marginesami 24 px, wysokość wynikająca z proporcji. Sekcja ma stałą ramkę także przy błędzie i przed odtwarzaniem. Przed otrzymaniem materiału ta sekcja nie jest renderowana.

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
- Desktop: sekcja o początkowej długości około 160 vh, kadr `position:sticky` pod nagłówkiem. Cały przejazd przebiega na odcinku od osiągnięcia górnej krawędzi sekcji do końca zakresu sticky. Dokładną długość dopasować po obejrzeniu materiału. Koniec sceny zwalnia kadr do zwykłego przewijania.
- Telefon: krótsza scena, około 120 vh, kadr ograniczony do dostępnej wysokości; nie zasłania treści ani CTA. Ostateczną długość potwierdzić dotykowo na gotowym materiale.
- Nie przechwytywać wheel/touchmove, nie blokować przewijania i nie wymuszać skoków strony. Zwykłe przewijanie, przeciągnięcie suwaka oraz PageDown/Home/End mają działać. Przy wejściu w środek sekcji lub zmianie rozmiaru ekranu odtworzyć właściwy postęp.
- Gdy użytkownik przestaje przewijać, kadr zostaje w danym miejscu. Nie dodać automatycznego dojazdu ani pętli.
- Reduced-motion: jedna reprezentatywna klatka w normalnej sekcji, bez wydłużonego pustego obszaru sticky. Przy niedostępnym rendererze lub pliku ten sam statyczny fallback.
- Preferowany kontrakt od Claude: komponent/scena z jawnym parametrem `progress` od 0 do 1, który ustawia kamerę deterministycznie. Obsługę scrolla prowadzi strona, aby komponent nie dodawał drugiego listenera ani własnego przejmowania przewijania.
- Jeśli plik jest wideo: integracja wymaga sprawdzenia płynnego seekowania w Safari/iOS i Chrome/Android, odpowiednio częstych klatek kluczowych i rozsądnego bitrate. Zmiany currentTime ograniczać do jednej kolejki aktualizacji; nie wymuszać dekodowania wszystkich żądań przy szybkim scrollu. Sam zwykły MP4 z autoplay nie spełni tego wymagania. Wybór wideo lub sceny nastąpi po sprawdzeniu materiału.

Do odbioru dodać: płynny ruch w obie strony, zatrzymanie w dowolnym miejscu, szybki scroll do końca, wejście przez kotwicę, zmianę orientacji telefonu oraz brak blokady dostępu do następnej sekcji. To wymagania integracyjne; gotowej animacji nie otrzymano jeszcze w tym repozytorium.
