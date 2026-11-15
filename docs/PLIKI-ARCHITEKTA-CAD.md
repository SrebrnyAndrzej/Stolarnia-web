# DXF i DWG od architekta

W panelu wybierz **Projekty → projekt → Pliki od architekta**. Wybierz lub przeciągnij jeden plik, następnie **Zapisz plik w projekcie**. Zapisany oryginał można pobrać na innym urządzeniu. Nowa zawartość pod tą samą nazwą pozostaje osobnym plikiem; ponowienie identycznej zawartości nie tworzy duplikatu. Limit: 3 MiB na plik i 50 plików w projekcie. Limit żądania uwzględnia kodowanie base64 i obecny transport przez Vercel.

Właściciel i projektant z profilem sprzedaży mają dostęp do nieprzefiltrowanych oryginałów. Produkcja i montaż korzystają z dotychczasowej dokumentacji technicznej. Pliki nie pojawiają się w prezentacjach dla klientów.

## Podgląd

ASCII DXF do 1 MiB: przestrzeń modelu, wybór warstwy i jednostki oraz gabaryt widocznych linii. Obsługiwane linie, proste polilinie, koła i łuki. Pomijane opisy, wymiarowanie, bloki, XREF, splajny, polilinie z bulge i geometria poza płaszczyzną XY. To podgląd referencyjny, nie kompletna przeglądarka CAD. Ograniczenia: 20 000 analizowanych encji, 5000 ścieżek, 50 000 punktów, 10 000 wierzchołków pojedynczej polilinii, 5 sekund pracy workera. Import nie zmienia mebla ani pomieszczenia.

DWG i binarny DXF są przechowywane i pobierane w oryginale. Do podglądu DWG potrzebny jest osobny eksport ASCII DXF z programu architekta. Nie uruchomiono niesprawdzonego konwertera DWG w funkcji Vercel.

INSUNITS: mm, cm, m, cale, stopy; brak lub inna jednostka wymaga wskazania przez użytkownika. Zmiana skali dotyczy wyłącznie podglądu. Należy porównać gabaryt ze znanym wymiarem rysunku; aplikacja nie zgaduje jednostki na podstawie wielkości liczb.

## Przechowywanie

Prywatny bucket `pan-stolarz-project-files`, limit 3 MiB, MIME application/octet-stream. Bez publicznego odczytu i bez dodawania polityk dostępu dla przeglądarek. Serwer autoryzuje każde pobranie i sprawdza sumę SHA-256; obiekty mają klucz niezależny od nazwy pliku. Metadane zapisują się z obecną kontrolą konfliktów bazy. Nieudany zapis metadanych po zapisie obiektu może pozostawić niedostępny obiekt; ponowienie z tym samym ID odzyskuje zapis. Nie dodano automatycznego trwałego kasowania oryginałów.

## Źródła techniczne

- [Autodesk — INSUNITS](https://help.autodesk.com/cloudhelp/2023/ENU/AutoCAD-Core/files/GUID-A58A87BB-482B-4042-A00A-EEF55A2B4FD8.htm)
- [Supabase — prywatne buckety](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- [Supabase — tworzenie bucketów i limity](https://supabase.com/docs/reference/javascript/file-buckets-createbucket)
- [dxf-parser — repozytorium biblioteki](https://github.com/gdsestimating/dxf-parser)
