# Obowiązujący standard ofert Pan Stolarz

Decyzja właściciela: 13.11.2026. Ten format jest jedynym domyślnym formatem wycen i ofert dla klientów, również z publicznego kalkulatora kuchni. Nie wracamy do ofert wielostronicowych z dużą liczbą tabel ani osobnych wariantów graficznych.

Wzór referencyjny: `oferty/wzor-oferty-pan-stolarz.pdf`, zaakceptowana oferta łazienki oparta na ofercie szafy z 12.11.2026. Cena konkretnego mebla nie jest cennikiem kuchni.

## Dwie strony A4, pionowo

1. Oryginalne logo, data, status wstępny lub oferta. Nagłówek dotyczący konkretnego mebla. Grafitowe pole z dużą ceną brutto i informacją o montażu/transporcie. Obok mały poglądowy widok frontów. Niżej krótki zakres: konstrukcja, materiały, okucia, wyposażenie, blat/realizacja. Trzy składniki ceny: meble, blat/dodatki, transport i montaż. Założenia i wyłączenia są jawne.
2. Wstępny projekt z wymiarami, widok wnętrza oraz założenia do potwierdzenia. Rysunek koncepcyjny nie jest dokumentacją produkcyjną. Zachowujemy proporcje rzeczywistych szafek i osobne ściany.

Przy nietypowo długich uzgodnieniach dopuszczalny jest dodatek w tym samym stylu. Nie obcinamy ani nie ukrywamy warunków tylko po to, aby zmieścić je na dwóch stronach. Zwykła kuchnia i oferta ze wzoru pozostają dwustronicowe.

Marka: grafit #1C2B30, zieleń #A5B859, opisy #435058, delikatne linie #D5DCDA. Kwoty w PLN brutto, wymiary w mm, polskie znaki. Klient nie dostaje kosztów zakupu, roboczogodzin, narzutów ani marży. Bez wymyślonych danych firmy, terminów, płatności i zobowiązań.

Właściciel implementacji: `src/export/offer-standard.ts`. Zarówno `src/export/oferta.ts`, jak i publiczne `/api/public/kitchen-estimate/pdf` wywołują ten sam renderer. Nie tworzymy kolejnych lokalnych szablonów. Historyczne PDF pozostają archiwum, nie alternatywą w interfejsie.

## Zasady kalkulatora kuchni

- Istniejący publiczny kreator: `#/kreator-kuchni`; bez logowania i bez dostępu do danych zakładu.
- Jeden właściciel geometrii i walidacji: `core/kitchen-configuration`. Te same szafki, ustawienia i elementy buduje istniejący silnik `builder`.
- Obliczenia ceny tylko na serwerze: `core/kitchen-estimate`, istniejące `pricing` i `production`. Publiczny DTO zawiera jedynie cenę sprzedaży, trzy grupy, zakres i założenia. Brak zapisu lub wysyłania zamówienia przez obliczenie/PDF.
- Fronty laminowane, MDF lakierowany lub ryflowany; blat laminowany/HPL; Amix lub Blum, zawiasy Hettich; montaż opcjonalny. Kolor i dekor to odrębne wybory od technologii frontu.
- Obecne stawki są **modelowe, nie zatwierdzony cennik firmy**. Korpusy, pozostałe materiały, robocizna, narzuty i usługi: istniejące katalogi i ustawienia domyślne projektu. Aktualne punkty odniesienia 13.11.2026: ryflowany lakierowany MDF 600 zł/m² brutto, Amix Elite Box 83 zł/kpl. brutto i Hettich Sensys z prowadnikiem 14,88 zł/kpl. brutto. To składniki, nie końcowe ceny gotowych mebli; rozmiar/model okuć do potwierdzenia.
- Bez mnożenia łazienki za 4900 zł przez metry kuchni. Ilości płyt/frontów/szuflad z geometrii; czas pracy i zakup arkuszy przybliżone. Liczba arkuszy jest szacunkiem powierzchni z 15% rezerwą, nie planem rozkroju.
- Brak ceny wymaganej pozycji, pusta kuchnia, przepełnienie ściany lub kolizja ze słupkiem blokują kwotę i PDF. Nie pokazujemy starej ceny podczas zmiany szkicu lub błędu API. Serwer ponownie liczy PDF z przesłanego szkicu; klient nie podaje kwoty.
- W L/U narożniki po 650 mm pozostają puste; ich wykończenie i systemy są osobną pozycją do indywidualnej wyceny. Bez zakupu AGD, zlewu, baterii i prac instalacyjnych. Transport lokalny do potwierdzenia adresem.
- Wybory zapisują się z lokalnym szkicem i przechodzą do formularza zapytania. Nie deklarujemy wysłania przed zapisem przez istniejący formularz. Bez publikacji na OVH/Vercelu do wznowienia wdrożeń przez właściciela.

Źródła kontrolne cen składników:

- https://tanieszuflady.pl/pl/menu/szuflady-elite-box-151.html
- https://allegro.pl/produkt/zawias-meblowy-nakladany-hettich-67-x-25-mm-b83f87ee-c84d-4f34-9406-7d06cacc8ebc
- https://allegro.pl/oferta/fronty-meblowe-lakierowane-frezowane-ryflowane-mdf-18mm-kolory-mat-polmat-18274409889
