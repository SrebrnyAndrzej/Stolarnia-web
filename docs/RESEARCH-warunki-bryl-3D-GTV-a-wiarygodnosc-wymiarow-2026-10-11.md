# Warunki użycia brył 3D GTV a wiarygodność wymiarów

Data weryfikacji źródła: 2026-10-11
Zakres: producentowe bryły 3D okuć GTV i ich użycie w aplikacji stolarskiej. To notatka produktowo-techniczna, nie opinia prawna.

## Ustalenie potwierdzone w regulaminie GTV

Oficjalny [Regulamin korzystania z brył trójwymiarowych GTV](https://gtv.com.pl/regulamin-korzystania-z-bryl-trojwymiarowych/) stanowi, że pobranie wymaga rejestracji użytkownika, jest bezpłatne, a licencja jest niewyłączna i udzielana temu użytkownikowi. Wymienia użycie w kompatybilnych programach/projektach wizualizacyjnych lub obliczeniowych, także w działalności gospodarczej, i użycie modelu jako elementu składowego przedstawianego artykułu meblowego. Jednocześnie zabrania publicznego samodzielnego udostępniania bryły, sublicencji i modyfikowania jej; nie wolno też prezentować bryły jako produktu innej marki niż GTV. Regulamin mówi wprost, że modele są materiałem poglądowym, a rzeczywiste wymiary przedmiotów mogą się różnić od wymiarów udostępnionych brył. GTV zastrzega możliwość zmiany regulaminu.

Oficjalna strona [brył 3D GTV](https://gtv.com.pl/baza-wiedzy/bryly-3d/) wymaga zaznaczenia akceptacji tego regulaminu przy dostępie do pobierania. Karty produktów GTV również zawierają wymagane pole akceptacji, w tym karta [stabilizatora MBSTAB](https://gtv.com.pl/produkt/PB-D-MBSTAB-00/).

## Problem dla aplikacji

Sam fakt, że plik 3D można pobrać lub obejrzeć, nie dowodzi prawa do wbudowania go w publiczną aplikację, przekazania wszystkim jej użytkownikom ani przerobienia na geometrię produkcyjną. Osobno: producent wyraźnie ostrzega, że wymiary bryły mogą różnić się od rzeczywistego wyrobu. Użycie jej jako źródła wierceń, kolizji, rozkroju lub CNC może więc być błędne nawet wtedy, gdy podgląd wygląda wiarygodnie.

Nie ustalono, czy firma posiada odrębną licencję lub zgodę GTV obejmującą konkretną aplikację, jej pracowników/klientów, magazynowanie plików, serwowanie przez backend i wieloużytkownikowe użycie. Regulamin GTV zastrzega również odrębną osobę uprawnioną do majątkowych praw autorskich; zakres praw i zastosowanie regulaminu do konkretnego przepływu musi potwierdzić prawnik lub GTV. Niniejsza notatka nie rozstrzyga zgodności prawnej obecnych ani planowanych działań.

## Rekomendacja dla Claude

**Proponowane zachowanie:** rozdzielić geometrię podglądu od geometrii produkcyjnej. Bryłę producenta, jeżeli udokumentowano wymagane uprawnienia do danego sposobu użycia, traktować wyłącznie jako nieedytowalny, oznaczony podgląd konkretnego produktu. Wymiary, otwory, obwiednie i operacje produkcyjne wyprowadzać z oddzielnego, wersjonowanego profilu opartego na aktualnej karcie/instrukcji technicznej dla dokładnego SKU i konfiguracji albo na własnym pomiarze zatwierdzonym przez warsztat. Nie tworzyć geometrii produkcyjnej przez skalowanie, modyfikowanie ani odczyt wymiarów z bryły GTV.

Przed włączeniem pliku do aplikacji ustalić na piśmie, czy licencja obejmuje danego użytkownika prawnego, użycie wielostanowiskowe, przechowywanie po stronie serwera, renderowanie dla klientów, eksport/udostępnienie projektów i kopie zapasowe. Jeśli zakres jest niejasny, nie importować ani nie udostępniać pliku w aplikacji; użyć własnego neutralnego, parametrycznego symbolu wyłącznie na podstawie oddzielnie zweryfikowanych wymiarów produktu, po ocenie prawnej.

**Priorytet:** P1 dla wiarygodności podglądu 3D i pochodzenia zasobów; P0 przed wytwarzaniem, wierceniem lub CNC zależnym od geometrii pochodzącej z bryły producenta.

**Zależności:** potwierdzenie licencji/zgody dla konkretnego przepływu; dokładny SKU, wariant/kolor i rewizja; źródło wymiarów technicznych; polityka przechowywania, eksportu i usuwania; potwierdzenie warsztatowe geometrii produkcyjnej.

## Mierzalne kryteria odbioru

1. Każdy asset 3D ma zapisane: producenta, SKU/wariant, źródłowy URL, datę i rewizję pliku, status licencji, dozwolone miejsca użycia oraz status zgodności wymiarów. Brak potwierdzenia licencji blokuje publikację assetu.
2. Model 3D producenta nie zasila żadnego pola wierceń, obwiedni kolizji, rozkroju ani CNC; test integracyjny sprawdza, że geometria produkcyjna pochodzi z osobnego, zatwierdzonego profilu.
3. UI i eksporty nazywają bryłę „podglądem orientacyjnym” i nie sugerują zgodności wymiarowej; szczegółowe ograniczenia licencji są prezentowane/egzekwowane zgodnie z potwierdzonym zakresem, nie przez niezweryfikowane założenie.
4. Zasób nie jest edytowany, sublicencjonowany, serwowany jako samodzielny model ani przedstawiany jako produkt innej marki bez odrębnego potwierdzenia uprawnień.
5. Dla geometrii produkcyjnej system wymaga dokładnego SKU/wariantu, aktualnej karty lub instrukcji wymiarowej i zatwierdzenia warsztatowego; stan `unknown` blokuje zwolnienie wierceń/CNC.

## Granice i punkt wznowienia

Potwierdzono treść publicznego regulaminu GTV i wymóg akceptacji na stronie pobierania. Nie pobierano ani nie kopiowano brył 3D, nie sprawdzono posiadanych indywidualnych licencji i nie oceniano stanu prawnego konkretnego wdrożenia. Następny krok: odnieść tę kartę do faktycznych przepływów assetów 3D w aplikacji po sprawdzeniu kolejnego świeżego `origin/main`; jeśli Claude nie wprowadził zmian, uzyskać od właściciela/GTV potwierdzenie zakresu licencji przed jakimkolwiek importem.
