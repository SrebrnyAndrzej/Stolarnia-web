# Wyspa i dokumentacja architekta

Publiczny kreator: `#/kreator-kuchni`. Etap szafek zawiera „Dodaj wyspę kuchenną” i „Pliki architekta”; dokumentację można też dodać na etapie pomiarów.

Wyspa ma własne szafki, położenie, obrót i głębokość blatu. Boki, tył dekoracyjny i rzeczywisty blat trafiają do podglądu, ceny i PDF. W tym etapie obsługujemy wyspy przechowujące/robocze z możliwością nadwieszenia blatu; bez automatycznego doboru podpór ani przyłączy zlewu i płyty.

Zalecenie 120 cm między wyspą i szafkami jest wskazówką projektową opartą na [poradniku IKEA METOD](https://www.ikea.com/se/en/customer-service/knowledge/articles/a199c667-dada-401b-9ec8-3bc026ab3781.html). Nie jest to deklaracja wymaganej prawem szerokości; otwieranie urządzeń i droga przejścia wymagają osobnego sprawdzenia. Kontrola kolizji korzysta z prostokątnych gabarytów, nie z torów otwierania.

Pliki: DXF, DWG, PDF, wiele plików w jednym szkicu. Można opisać pomieszczenie i rodzaj: rzut, elewacja, instalacje, inspiracja. To materiały źródłowe projektu, nie automatyczne zamienianie dowolnego rysunku w meble.

DXF: istniejący parser w workerze, obsługiwane linie/proste polilinie/koła/łuki. Jednostki z INSUNITS są propozycją do potwierdzenia; przy braku nagłówka wymagane jest sprawdzenie jednostki. Wybór warstwy, obrót i przesunięcie pozwalają nałożyć kilka rysunków. Przyjmowanie szerokości/głębokości z obrysu wymaga jawnego kliknięcia. Opisy, bloki, XREF i geometria 3D nie są odtwarzane. Formaty i jednostki: [Autodesk — DXF](https://help.autodesk.com/cloudhelp/2015/ENU/AutoCAD-DXF/files/GUID-73E9E797-3BAA-4795-BBD8-4CE7A03E93CF.htm), [Autodesk — jednostki importu](https://help.autodesk.com/cloudhelp/2019/ENU/InventorLT-Help/files/GUID-18277840-BB1F-467A-83E3-66EFFDE4FDB2.htm).

PDF: oryginał i natywny podgląd, bez automatycznego odczytywania skali i OCR. DWG: zachowany oryginał, do podkładu potrzebny eksport ASCII DXF. Istniejący konwerter warsztatowy DWG nie jest wystawiany jako niechroniona usługa publiczna.

Oryginały są lokalne w IndexedDB. Pobrana paczka JSON projektu zawiera szkic i pliki, może zostać wczytana na innym urządzeniu. Mały dotychczasowy szkic JSON zawiera sam manifest. Dane nie są wysyłane opisem zapytania ani wspólnie edytowane w chmurze. Utrata danych strony usuwa lokalne pliki; do zachowania służy paczka z oryginałami.
