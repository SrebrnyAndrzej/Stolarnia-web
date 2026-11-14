# Okucia i wiercenia frontu - etap 12.11.2026

Wdrożony w kodzie ręczny plan przy konkretnej części, inspirowany przepływem warsztatowym SpaceTool. Nie kopiowano jego kodu ani wzorów okuć.

## Obsługa

Kreator → wybierz drzwi lub front szuflady → Płyta → Okucia.

- Zawiasy: liczba 2-8, strona, osie skrajnych zawiasów od dołu i góry, oś puszki od krawędzi, średnica i głębokość. Pozostałe osie rozstawiają się równomiernie. Wartości startowe są ręczne i robocze.
- Uchwyt: środek X/Y, rozstaw, kierunek pion/poziom, średnica. Rozstaw zero oznacza pojedynczy otwór gałki; otwory przelotowe w płycie.
- Masa: edytowalna masa powierzchniowa płyty i dodatkowa masa lustra. Bez automatycznego doboru zawiasów i deklaracji nośności.
- Numery otworów w głównym rzucie 2D; telefon ma też mały schemat w inspektorze. Podrzędne parametry zwinięte, aby nie wydłużać formularza.
- „Pobierz kartę do druku” zapisuje statyczny HTML z rysunkiem i tabelą; w przeglądarce można wydrukować lub zapisać jako PDF. Dokument zbiorczy mebla ma tylko krótkie podsumowanie.

## Granice i sprawdzanie

Rzut od przodu. X od lewej, Y od dołu. Wiercenie od tyłu samej płyty; trzeba zachować oznaczenie fizycznych krawędzi po odwróceniu. Plan nie obejmuje wiercenia tafli lustra.

Sprawdzane są: pełny prostokątny front, otwory wraz z obwodem w obrębie płyty, głębokość puszki mniejsza od grubości, nakładanie otworów i sensowny rozstaw skrajnych zawiasów. Błąd usuwa cały rysunek otworów i eksport szczegółowej karty. Zmiana geometrii od razu przelicza pozycje, nie pozostawia starych wyników.

Przecięcie strefy przy puszce z półką daje ostrzeżenie. To kontrola rzutu, nie symulacja ramienia, prowadnika i ruchu drzwi. Nie tworzy otworów śrub puszki, prowadników ani CNC. Podanie nazwy lub źródła nie jest zatwierdzeniem poprawności technologii. Bezwzględny środek uchwytu nie jest automatycznie centrowany po zmianie wielkości frontu.

Ustawienia zapisują się w istniejącej wersjonowanej bibliotece jako opcjonalne dane frontHardware. Starsze modele pozostają czytelne. Cofnij usuwa/przywraca plan razem z innymi zmianami. Regeneracja tego samego rodzaju elementu w tym samym slocie zachowuje ustawienia, po zmianie rodzaju nie przenosi ich bezwarunkowo.

## Weryfikacja

- Rzeczywista obsługa w przeglądarce na komputerze: wybór frontu, zakładka Okucia, włączenie dwóch planów, zapis i otwarcie zapisanej wersji. Lokalny serwer `scripts/qa-front-hardware.mts` działa tylko pod 127.0.0.1 i ma syntetyczne dane, bez dostępu do klientów.
- 193/193 testy logiki i HTTP; dodatkowy zestaw kontroli uprawnień poprawny.
- 39/39 scenariuszy bieżącego kreatora: m.in. komputer/telefon, zapis, wydruk, ponowne otwarcie i wstrzymanie otworów po zmniejszeniu frontu. Testy przeglądarkowe korzystają z izolowanych odpowiedzi API.
- TypeScript i build poprawne, statyczny audyt UI bez naruszeń. Sprawdzono wizualnie kartę wydruku i zrzuty interfejsu.
- Nie zaliczamy całej historycznej paczki testów; wcześniej wykryte nieaktualne scenariusze dawnych podglądów pozostają poza tym zestawem.

Zrzuty w tym katalogu: `Kreator-okucia-desktop-2026-11-12.png`, `Kreator-okucia-telefon-2026-11-12.png`, `Karta-frontu-proba-2026-11-12.png`. Są to przykłady z danych testowych, nie dokumentacja wykonawcza szafy klienta.
