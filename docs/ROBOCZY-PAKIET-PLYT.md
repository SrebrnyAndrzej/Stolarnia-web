# Pierwszy adapter biblioteki do rozkroju — 3.11.2026

## Wieniec pod skosem

Kalkulator cięcia skosu pokazuje osobno długość po górnej krawędzi, rzeczywistą głębokość i grubość wieńca oraz obwiednię półfabrykatu w płaszczyźnie płyty. Wymiary pochodzą z `platePolygon` aktualnego wieńca, także po ręcznej zmianie jego szerokości/głębokości i odbiciu skosu. Nie są poziomą szerokością mebla.

Dla standardowego wieńca między bokami, kąta α i grubości t: długość górnej krawędzi wynosi `(W − 2t)/cos α`. Skrajne punkty obu ściętych końców zajmują długość większą o `t·tan α`. Jest to geometryczna obwiednia płyty, bez rzazu, obrzeży i naddatków obróbki. Porównanie uciosów w kalkulatorze nie przebudowuje połączenia ani nie wyznacza wymiarów dla innej technologii. Skośny wieniec nadal wymaga indywidualnej technologii i nie jest automatycznie dopuszczany przez adapter prostokątnych formatek.

W kreatorze mebli zapisz model, otwórz **Przygotowanie płyt do rozkroju**, przypisz rzeczywiste materiały katalogowe i wybierz **Oblicz roboczy rozkrój**. Przycisk zbiorczy przypisuje wybrany materiał tylko częściom o zgodnej grubości. Obliczenie dotyczy zapisanej wersji, nie niezapisanego szkicu.

## Co działa

- Serwer sprawdza aktywną rolę zespołu i oczekiwaną wersję biblioteki.
- Prostokątne części trafiają do istniejących funkcji `rozkroj` i `zapotrzebowanieObrzeza` jako formatki z trwałymi ID.
- Wymiar gotowy/rdzeń jest jawną decyzją. Obrzeże odejmowane dokładnie raz; dla geometrii rdzenia obrys gotowy powiększa się o odpowiednie obrzeża. Kierunek V zamienia osie i krawędzie, a nie tylko etykietę.
- Obsługiwane obrzeża ABS 0,8/2 mm. Inny profil, nieokreślony kierunek, brak materiału/formatu, zła grubość lub nierozwinięty skos blokują obliczenie całego modelu.
- Pakiet JSON zawiera źródłową geometrię i opisy, mapowanie materiałów, bezcenowe migawki katalogowe, ustawienia, rewizję, SHA-256, formatki, rozmieszczenie arkuszy oraz zapotrzebowanie obrzeży. Pobrany plik nie zmienia się po aktualizacji katalogu. API nie prowadzi jeszcze archiwum tych pakietów.
- Arkusze i nierozmieszczone części są liczone przez istniejący silnik, zamiast przybliżenia po samym m².

## Granice

Plan obejmuje tylko płyty obecne w modelu, w tym fronty szuflad, ale nie dodaje skrzynek ani nie udaje kompletu okuć. Nie ma operacji wierceń, połączeń ani pełnego pakietu maszynowego. `readyForProduction` jest zawsze false. To roboczy plan materiału, nie zlecenie cięcia ani wydanie produkcyjne. Brakujące dane i sumy kontrolne nie są podpisem technologa.

Nie podłącza automatycznie mebla do projektu kuchni i nie dopisuje pozycji do Mussi. Następny etap to kompletacja skrzynek i okuć oraz adapter zatwierdzonych operacji, następnie trwały pakiet wydania i dopiero zakup z tego pakietu. Obieg zakupowy Claude operuje na projektach kuchni i pozostaje osobnym źródłem do czasu tej integracji.

## Integracja gotowych funkcji Claude

Do aktualnej gałęzi przeniesiono ST-APP-004 (`630ce06` → `c0dbcc7`) i ST-APP-003 (`806c4b6`). Poprawki integracyjne: bezpieczne dialogi, ujęcia bez pamięci współdzielonej przez konta, propozycja PDF bez zgadywanego maksimum ceny, CSV odporne na formuły, walidacja dat i ochrona statusu dostawy przed nieaktualnym zapisem. Karta dostaw jest dostępna również w panelu Zamówienia.

Zestawienie dostaw zachowuje decyzję użytkownika „zostaw jak jest”: grupowanie dostawca/producent, wariant Standard, potwierdzanie przez właściciela, jeden PDF z sekcjami dostawców. Geometria z wydania i bieżące katalogi są wyraźnie rozróżnione. Rzeczywista wysyłka Mussi pozostaje wyłączona.

Testy: src/furniture-preparation.test.ts, src/zamowienie.test.ts, src/szybki-projekt.test.ts, src/server/uprawnienia.test.ts oraz tests/v2/{quick-project,supplier-orders,furniture-preparation}.spec.ts. Do odczytu PDF można użyć Popplera albo ustawionego jawnie `PAN_STOLARZ_QA_PDF_PYTHON` z pypdf; dotyczy wyłącznie testów.
