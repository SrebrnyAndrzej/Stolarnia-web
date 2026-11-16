# Programy meblowe, otwarte projekty i materiały wideo

Przegląd: 14.11.2026. Cel: krótsza droga od pomysłu do poprawnej konfiguracji, wyceny i czytelnych rysunków. Strony producentów opisują oferowane funkcje; nie zastępują testu tych produktów ani sprawdzenia wygenerowanej dokumentacji na warsztacie.

## Co promują narzędzia dostępne w Polsce

| Narzędzie i źródło | Sprawdzone deklaracje | Porównanie z Pan Stolarz i dalszy krok |
|---|---|---|
| [Rozkrój / rozrys.visual-form.com](https://rozrys.visual-form.com/) | Import projektu z pCon, odczyt formatek, kierunku usłojenia i obrzeży; plan cięcia, własny cennik, oferta i specyfikacja; łączenie projektów. | Mamy model, wycenę, PDF, pliki CAD i wspólne przygotowanie biblioteki. Załączenie DXF/DWG nie jest jeszcze odtworzeniem kompletnego mebla. Potrzebny kontrolowany import z mapowaniem jednostek, części i materiałów. |
| [eRozrys — opis systemu NCS](https://ncsit.pl/systemy/) i [wdrożenie BARTiX](https://www.bartix.pl/e-rozrys) | Materiały, okleiny i usługi, optymalizacja oraz składanie zamówień do konkretnego wykonawcy. | Inny produkt niż Rozkrój. U nas jest szkic zamówienia Mussi. Rzeczywiste wysyłanie nadal wymaga silnika i uzgodnionego kontraktu Mussi zgodnie z decyzją użytkownika. |
| [PRO100 7 — dokumentacja nowości](https://www.ecru.pl/pl/blg/wersja-7-manual) | Warstwy z widocznością i blokadami, zapisywane układy okien, komentarze na rzutach, kamery, klonowanie i przesuwanie w osi. | Mamy kompaktowy inspektor, wybór części, izolację, przekrój i cofanie. Najbardziej przydatny dalszy krok: własne notatki przypięte do wymiarowanego widoku oraz zapisywane widoki. |
| [KD Max — funkcje](https://www.kdmax.pl/funkcje/) | Dopasowanie wyposażenia do wnętrza korpusu, pozycjonowanie względem sąsiadów, otwieranie frontów i szuflad; narzędzia dokumentacji i prezentacji. | Mamy komory i parametryczne wyposażenie; publiczna kuchnia potrzebuje dokładniejszych frontów i dopasowania szafek. Nie mamy pełnej symulacji ruchu i kontroli kolizji otwierania. |
| [Rozpis — funkcje](https://www.rozpis.pl/funkcje.php) | Parametry korpusów i pleców, odliczanie obrzeży, różne szuflady i ich głębokości, dodatkowe części, wydruki zamówień i montażu. | W panelach mamy wiele tych danych. Trzeba dalej scalać wybór konkretnego systemu, wymiarowanie frontu, geometrię części i dokumentację; publiczny klient korzysta z uproszczonego zakresu. |
| [Corpus — komunikacja Lignumsoft](https://pl.linkedin.com/company/lignumsoft-adam-wile%C5%84ski) | Własne materiały webinarowe promują automatyzację projektowania, list materiałowych i przygotowania CNC. | Kierunek: mniej przepisywania danych i kontrolowany przepływ projektu do produkcji. Strona główna Lignumsoft nie zwróciła czytelnej treści w odczycie tekstowym; szczegółów aktualnego wydania nie uznano za zweryfikowane. |

Na stronie Rozkroju sekcja filmu pokazuje zapowiedź materiału, więc nie ma podstaw do opisywania jego transkrypcji. Sama domena rozrys.pl nie zwróciła czytelnego opisu funkcji; nazwy nie zostały utożsamione.

## Transkrypcje i filmy: co rzeczywiście odczytano

1. [OpenCutList po polsku — SU11, Jarek Ostaszewski](https://www.youtube.com/watch?v=VpPKP2xRbB4). Pobrano polskie napisy automatyczne. Merytoryczne punkty: 2:24–4:22 definiowanie materiału i formatu arkusza; 5:08–6:39 lista części oraz różnica wymiarów gotowych i cięcia; 6:41–7:58 wskazywanie i nazywanie części; 8:23–9:18 rzaz, odpad użytkowy i plan cięcia; 9:42–10:28 eksport CSV; 10:34–13:05 rysunek i wspólne nazwy części. Napisy mają błędy rozpoznania mowy, więc liczby w nich nie są danymi technologicznymi.
2. [PRO100 wersja 7 — przegląd nowości](https://www.youtube.com/watch?v=pCE2B3xlYh4). Eksport napisów zadziałał, lecz zawiera głównie muzykę i pojedyncze nierozpoznane słowa. Funkcje ustalono z towarzyszącego artykułu producenta, nie z tych napisów.
3. [KD Max — tworzenie dokumentacji projektu](https://www.youtube.com/watch?v=4pdIoms8gOI). Film dostępny, narzędzie eksportu nie udostępniło transkrypcji. Nie przypisano nagraniu nieodczytanych wypowiedzi.
4. [Rozpis — Kuchnia na wymiar, zrób to sam](https://www.youtube.com/watch?v=_XMKWjVipJ8). Film wskazany na stronie produktu; eksport nie udostępnił transkrypcji. Podstawą porównania jest strona funkcji.
5. [MasterSketchUp — OpenCutList](https://www.youtube.com/watch?v=8f_R9Gzs4gU). Próba eksportu nie zwróciła transkrypcji; bez wniosków przypisanych treści nagrania.

Zachowujemy własne notatki i odnośniki, a nie pełne kopie transkrypcji w publicznym repozytorium.

## GitHub: konkretne inspiracje

| Projekt | Odczytana dokumentacja | Przydatny wzorzec |
|---|---|---|
| [OpenCutList](https://github.com/lairdubois/lairdubois-opencutlist-sketchup-extension) | README: zestawienia części, rozkrój, etykiety, koszty, masa, rozstrzelenie i eksporty. | Jeden model części i oznaczeń w rysunku, tabeli i pliku dla warsztatu; odrębne wymiary cięcia, gotowe i naddatki. |
| [Woodworking dla FreeCAD](https://github.com/dprojects/Woodworking) | README: magicStart, magicMove, magicResizer, magicGlue, pomiary, wiercenia i zestawienia. | Trwałe zależności między płytami i kontrolowane operacje z cofnięciem; równe światła utrzymywane po zmianie gabarytów. |
| [Cabinet Studio](https://github.com/petervanderwalt/cabinet-studio) | README: konfigurowalne fronty, okucia, podgląd części, projekt wielu szafek i eksporty. Dokumentuje ograniczenia konkretnych modeli okuć. | Konfiguracja i podgląd w jednym obszarze, wybór rzeczywistej części, reguły okuć odrębne od wyglądu i kontrola operacji przed eksportem. |

Przejrzano dokumentację repozytoriów. Nie uruchamiano obcych programów ani nie dodawano ich kodu do aplikacji. Bieżąca implementacja rozwija istniejący model i silnik Pan Stolarz.

## Wprowadzony etap

- Publiczna kuchnia: równe fronty, niski front u góry i własne wysokości od góry. Puste pole oznacza automatyczny podział pozostałej wysokości. Szczeliny pochodzą z ustawień konstrukcji, minimum 60 mm jest ograniczeniem szkicu.
- Niewykonalny podział pozostawia formularz do poprawy i nie zastępuje zastosowanego modelu. Jeden zapis do szafki to jeden krok Cofnij.
- Wybranie konkretnego frontu przekazuje jego rzeczywiste wymiary do kalkulatora, zamiast zawsze przekazywać pierwszy element.
- Dopasowanie wybranej szafki do wolnego miejsca w jej rzędzie: oddzielnie szafki wiszące i dolne, z zachowaniem obecnej rezerwy narożnika. Zabudowa AGD zachowuje szerokość katalogową. Dopasowanie uzupełnia pole; dopiero Zastosuj zmienia model.
- Import, lokalny szkic, wycena serwerowa, rysunki i opis zapytania korzystają z tego samego podziału. Starsze pliki bez nowego pola zachowują dotychczasową konstrukcję.

## Kolejność braków

1. Otwory pomieszczenia i instalacje z położeniem oraz wymiarami; swobodne pozycje szafek i jawne luzy montażowe.
2. Blendy, rzeczywiste narożniki, panele boczne i ciągły blat w publicznym kreatorze, z prawidłową ilością materiału w wycenie.
3. Trwałe relacje płyt: odległość od sąsiada, równe światła po zmianie mebla, rozwiązywanie sprzecznych wymiarów.
4. Notatki na rysunkach i zapis widoków, a następnie symulacja otwierania z rozróżnieniem wizualizacji i rzeczywistej kontroli kolizji.
5. DXF od architekta: podgląd jednostek i mapowanie warstw przed importem brył lub części; żadnego automatycznego uznania pliku za gotowy mebel.
6. Magazyn odpadów użytkowych i optymalizacja na zapasie; ciągłość usłojenia między frontami, zamiast samej blokady obrotu formatki.
7. Uzupełnienie profili konkretnych okuć z dokumentacji producentów i operacje połączeń z określoną stroną, średnicą i głębokością.
8. Rzeczywisty silnik Mussi: dopiero z uzgodnionymi indeksami, cennikami, walidacją i potwierdzeniem przyjęcia zamówienia.

To kolejność dalszej pracy, nie deklaracja wdrożenia wszystkich wymienionych funkcji.
