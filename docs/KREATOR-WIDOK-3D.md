# Czytelny widok 3D w kreatorze

Poprzedni widok przesuwał wielokąty SVG i sortował całe płyty jedynie według Z. Przy nachodzących częściach rysował niewidoczne powierzchnie na widocznych, co dawało efekt odwróconej głębi.

FurnitureScene korzysta z istniejącej zależności Three.js. Każda płyta jest zamkniętą bryłą z tego samego przyciętego obrysu co w 2D, wyciągniętego o jej rzeczywistą głębokość. Z zachowuje kierunek od tyłu do frontu. Nieprzezroczyste materiały i bufor głębokości rozstrzygają widoczność powierzchni; delikatne krawędzie podlegają temu samemu zasłanianiu. Oświetlenie, cień na podłożu i perspektywa 35° pozwalają odczytać grubość płyt.

Obsługa: przeciąganie obraca kamerę, klik wybiera najbliższą widoczną płytę, gest dwóch palców oraz przyciski przybliżają. Kółko myszy przewija stronę. Dostępne są widok początkowy, widok z lewej i na wprost oraz przyciski obrotu. Lista płyt pozostaje równoważną metodą wyboru. Pozycje i wymiary nadal edytuje inspektor. Obrót i zoom nie zmieniają szkicu ani historii Cofnij.

Kamera dopasowuje gabaryt do proporcji okna, uwzględniając także wystające fronty. Zmiana wymiarów zachowuje aktualny kąt; przycisk Widok początkowy ponownie dopasowuje bryłę. Nowy/otwarty model inicjuje scenę na nowo. Rysowanie odbywa się na żądanie, bez automatycznego obrotu i stałej pętli animacji. Moduł 3D ładuje się dopiero po wybraniu tego widoku. Geometrie, materiały, sterowanie, obserwator rozmiaru i kontekst są zwalniane przy wyjściu.

Brak WebGL lub utrata kontekstu pokazuje błąd z ponowieniem. Przód 2D pozostaje dostępny, bez utraty szkicu. Widok przedstawia istniejącą geometrię płyt; nie dodaje fikcyjnych skrzynek, okuć ani oceny poprawności konstrukcji.

Dokumentacja techniczna: [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer), [ExtrudeGeometry](https://threejs.org/docs/pages/ExtrudeGeometry.html), [OrbitControls](https://threejs.org/docs/pages/OrbitControls).
