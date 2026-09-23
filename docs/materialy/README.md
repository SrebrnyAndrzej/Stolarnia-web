# Katalog materiałów — Polska, 23.09.2026

## Stan pozyskania

- Egger: 408/408 pozycji polskiej wyszukiwarki dekorów; 408 zdjęć lokalnych.
- Egger: 9214 artykułów z publicznego Cyfrowego programu dostaw PL, łącznie z obrzeżami i laminatami; nie jest to liczba samych płyt. Wersja danych producenta z 18.09.2026.
- Kronospan: 26 kolekcji Kronodesign dla PL; 236 unikalnych dekorów, 236 zdjęć lokalnych. Dekory mogą należeć do wielu kolekcji i mieć wiele struktur.
- 8 dokumentów PDF Kronosfera, w tym 176-stronicowa Oferta produktowa 2026.

## Pliki

`katalog.html` — przeglądarka zdjęć z wyszukiwaniem, działa lokalnie po rozpakowaniu całego folderu.
`katalog-dekorow-PL.json` — dane dekorów, źródła i ścieżki zdjęć.
`egger-warianty-program-dostaw-PL.json` — artykuły programu dostaw.
`dane-zrodlowe/` — pełne odpowiedzi publicznych usług stron producentów.
`pdf/` i `zrodla-pdf.json` — oryginały katalogów z adresami i sumami kontrolnymi.
`pokrycie.json` — kontrola liczebności i jawne braki.

## Ograniczenia kompletności

Nie jest to jeszcze pełna, uzgodniona oferta wszystkich płyt dostępnych w Polsce. Katalog Kronosfera 2026 obejmuje dodatkowo m.in. Home Collection, SKIN, FOCUS i płyty surowe. Trzeba uzgodnić te linie z globalną siatką Kronodesign; nie wolno przypisywać linii innych marek, np. KAINDL, do producenta Kronospan tylko dlatego, że występują w katalogu dystrybuowanym przez Kronosfera. Macierz dekor–produkt–grubość–format Kronospan nie została jeszcze zamieniona w zatwierdzone rekordy produkcyjne.

Wymiary Egger zachowano zgodnie z opisem źródła: dla obrzeży osie oznaczają inne wielkości niż dla płyt. Nie interpretować pola Z globalnie jako grubości. `Program magazynowy` producenta nie oznacza stanu magazynu hurtowni. Nie tworzyć iloczynu wszystkich formatów i grubości dekoru — korzystać z istniejących artykułów.

Zdjęcia są podglądami dekorów. Brakuje potwierdzonej skali fizycznej tekstur i kompletu map PBR. Nie wolno zakładać bezszwowości, odtwarzać struktury z miniatury ani stosować losowych obrotów dekorów kierunkowych. Publiczna dostępność zdjęcia nie stanowi osobnego potwierdzenia licencji do jego redystrybucji w aplikacji.

## Źródła główne

- https://www.egger.com/pl/meble-i-aranzacja-wnetrz/?country=PL
- https://edc-availability.egger.services/?country=pl&language=pl
- https://kronospan.com/pl_PL/decors/by_collection/kronodesign/
- https://kronosfera.pl/katalogi-i-broszury
- https://kronosfera.pl/pobierz-dekory/dla-meblarstwa
