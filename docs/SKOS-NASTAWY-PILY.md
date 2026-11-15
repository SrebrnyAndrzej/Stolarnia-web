# Skos i nastawy piły — 2026-11-02

Użytkownik używa pilarki stołowej i zagłębiarki Mac Allister z Castoramy, tarcze Freud; podał limit tarczy45°, bez identyfikatora modeli. Nie przypisywać mu konkretnego modelu, głębokości ani instrukcji regulacji pokręteł.

Wymiary wejściowe: W = pozioma szerokość zewnętrzna, h = wysokość krótkiego boku na zewnętrznej krawędzi, H = analogiczna wysokość długiego boku, t = grubość. Wymagane H>=h>0, W>2t. alfa=atan2(H-h,W), w stopniach. To kąt skosu od poziomu, nie połowa kąta.

Domyślny model: wieniec między pionowymi bokami; górna linia wszystkich elementów to obrys. Wieniec nie nachodzi na boki. Wewnętrzna krawędź krótkiego boku = h+t*tan(alfa); długiego = H-t*tan(alfa). Długość górnej krawędzi wieńca = (W-2t)/cos(alfa). Grubość wieńca prostopadle do powierzchni; pionowy offset = t/cos(alfa). To gotowe geometryczne krawędzie, bez rzazu i obrzeża, nie długość surowej formatki z zapasem.

Nastawy dotyczą pochylenia tarczy przy szerokiej powierzchni płyty leżącej płasko, przy skali0°=prostopadle. Boki: alfa. Zakończenia wieńca między bokami: alfa. To nie jest obrót przykładnicy w blacie. Odbicie mebla zmienia orientację części, nie wartości kątów.

Osobne porównanie równych uciosów: kąty wewnętrzne krótkiego/długiego narożnika to90+alfa i90-alfa. Pochylenia obu łączonych płyt w danym narożniku to(180-kąt wewnętrzny)/2, czyli45-alfa/2 i45+alfa/2. Dla dodatniego skosu długi narożnik przekracza45°. Porównanie nie zmienia rysunku na konstrukcję uciosową ani nie podaje jej długości. Nie redukować kąta ponad45° przez arbitralne odjęcie od90 i nie proponować trzymania płyty pionowo.

Przykład W1000 h1500 H2000 t18: alfa26,565°, uciosy31,717° i58,283°; krótszy bok zewnętrznie1500, wewnętrznie1509; dłuższy zewnętrznie2000, wewnętrznie1991. Cięcie w zakresie kątowym nie jest potwierdzeniem głębokości ani możliwości podparcia części. Rzaz konkretnej tarczy Freud wpływa na stronę odpadu i położenie linii, nie na geometrię kąta.

Źródła parametrów sprzętu (nie utożsamiają modelu z maszyną użytkownika):
- oficjalna karta Castoramy, pilarka Mac Allister1500W254mm5059340270050: limit pochylenia45°, https://www.castorama.pl/pilarka-stolowa-macallister-1500-w-254-mm/5059340270050_CAPL.prd
- oficjalna karta B&Q Mac Allister MCB1348PLG: https://www.diy.com/departments/mac-allister-1200w-240v-165mm-corded-plunge-saw-mcb1348plg/5063022800251_BQ.prd
Formuły wynikają z przekroju geometrycznego implementacji i są sprawdzane w src/slope-cut.test.ts. Nie są zaczerpniętą instrukcją konkretnego modelu piły.

Most: scripts/verify-ovh-bridge.mjs, osiem bezstanowych przypadków, bez loginów i haseł, ten sam status i JSON bezpośrednio oraz przez OVH. GETconfig200authReadytrue; sesja401; bibliotekaGET/PUT401; pusty login poprawnyOrigin400; obcyOrigin403; logoutbezsesji200 i host-onlySecureHttpOnlySameSiteStrict; prywatnyPDF401. Wszystkie odpowiedzi no-store. Nie weryfikowano rzeczywistego zalogowanego zapisu ani treści prywatnegoPDF.
