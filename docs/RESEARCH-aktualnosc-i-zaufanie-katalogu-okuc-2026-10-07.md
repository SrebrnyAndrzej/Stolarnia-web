# Aktualność i wiarygodność katalogu okuć

Data: 2026-10-07  
Zakres: katalog produktów okuć, rozdzielenie danych handlowych od zatwierdzonych reguł technicznych. To brief produktowo-techniczny, nie audyt prawny ani potwierdzenie dostępności handlowej.

## Najważniejszy wniosek

Katalog powinien jawnie rozróżniać **co wiemy o produkcie**, **kiedy i z jakiego źródła to sprawdziliśmy**, **czy produkt jest aktywny w ofercie**, **czy wybrano dokładny wariant zamówieniowy**, oraz **czy geometria i instrukcja zostały zatwierdzone do produkcji**. Jedna flaga „aktywny” lub samo SKU nie może znaczyć wszystkich tych rzeczy.

## Fakty z repozytorium

- `docs/okucia/produkty/raport.json` opisuje 2 987 rekordów w migawce pobranej 25.09.2026; raport podaje 1 479 źródeł producenta, 1 508 dystrybutora i 5 błędów. W chwili sporządzenia tego briefu migawka ma około 12 dni. Wiek migawki sam w sobie nie dowodzi nieaktualności żadnej pozycji.
- `ProduktOkucia` (`src/core/hardware-products.ts`) zawiera źródłowy URL, typ źródła, czas pobrania, SHA-256, SKU i dokumenty, a `zatwierdzoneProdukcyjnie` jest typowane jako `false`. To użyteczne pochodzenie, ale brak jawnego wyniku sprawdzenia źródła po imporcie, stanu handlowego i rewizji technicznego profilu.
- Importer zapisuje wspólny czas pobrania dla przebiegu (`scripts/okucia/zbierz_katalog_okuc.py`). Jedna data przebiegu nie mówi, czy wszystkie pola każdego rekordu zostały odczytane z aktualnej karty, czy odziedziczone z danych zachowanych.
- `src/service.ts` wymaga dokładnego SKU producenta albo symbolu dystrybutora z EAN dla pozycji dodawanej do cennika i wprost nie przypisuje takiej pozycji automatycznie do reguł produkcyjnych. Opis w interfejsie też zaznacza brak przypisania do produkcji.
- Na oficjalnej karcie GTV dla [A-SN-TG-405-00](https://gtv.com.pl/produkt/A-SN-TG-405-00/) producent pokazuje indeks, zastosowanie do konkretnych systemów, wymiary, obciążenie i osobny plik „Karta techniczna”. Strona zawiera też osobną pozycję „Wycofane produkty” i odrębny panel B2B z pełną ofertą. Są to różne powierzchnie informacji; obecność publicznej karty nie potwierdza bieżącego stanu magazynowego ani warunków zakupu.
- GS1 opisuje GDSN jako sieć synchronizacji danych podstawowych i klasyfikacji produktów; to dowód, że wymiana jakościowych danych produktowych jest odrębną funkcją handlową. Nie potwierdzono, że Blum, GTV, Amix ani używani dystrybutorzy udostępniają tej stolarni kanał GDSN/API.

## Ryzyko i rozdzielenie statusów

**Problem:** karta z poprawnym, ale historycznym SKU może nadal wyglądać jak produkt do zamówienia. Z kolei produkt dostępny w sprzedaży może nie mieć zweryfikowanych wymiarów, zestawu części lub wierceń wymaganych do dokumentacji produkcyjnej. Cena referencyjna sklepu nie jest ceną zakupu zakładu.

Proponowane, niezależne stany rekordu:

1. **Pochodzenie danych:** `źródło producenta`, `źródło dystrybutora`, `ręczny wpis`; URL, czas pierwszej obserwacji i ostatniego udanego sprawdzenia, hash źródłowego dokumentu/odpowiedzi, data przebiegu importu i status błędu. Hash lokalnej kopii nie zastępuje hasha źródła.
2. **Dopasowanie produktu:** rodzina / bazowy element / dokładny wariant producenta / pozycja dystrybutora; SKU producenta, EAN i symbol dystrybutora pozostają odrębnymi polami. Nierozstrzygnięte duplikaty kierować do przeglądu, nie scalać tylko po nazwie.
3. **Stan oferty:** `nieznany`, `obserwowany na stronie`, `potwierdzony przez dostawcę`, `wycofany`, `zastąpiony`, `niedostępny`; przechowywać źródło i datę potwierdzenia. Brak rekordu po imporcie lub błąd HTTP nie jest dowodem wycofania.
4. **Stan techniczny:** `niezweryfikowany`, `sprawdzony opisowo`, `zweryfikowana karta/instrukcja`, `zatwierdzony profil produkcyjny`, `zawieszony`. Przechowywać dokładny wariant, rewizję pliku, strony/rysunki, zakres zweryfikowanych pól, region/język i zatwierdzającego.
5. **Cena:** oddzielić cenę orientacyjną opublikowaną przez sklep, aktualną ofertę zakupu dostawcy, wynegocjowaną cenę firmy oraz historyczny koszt pozycji w zamówieniu. Każda ma walutę, jednostkę, źródło i datę; żadna aktualizacja katalogu nie nadpisuje zatwierdzonej ceny lub historycznego kosztu.

## Rekomendacje dla Claude

### P0 — odświeżenie bez cichej zmiany projektu

- Import powinien tworzyć raport różnic: nowe, zmienione, brakujące, ponownie znalezione, błędne i wymagające decyzji pozycje. „Brak w źródle” pozostaje stanem do wyjaśnienia; nie kasuje automatycznie karty, SKU przypisanego do projektu ani zatwierdzonego profilu.
- Zachować surową migawkę źródłową/identyfikator wydania importu obok normalizowanej karty, aby różnicę dało się przejrzeć i odtworzyć. Publikacja zmian do używanego katalogu po kontroli; dla ręcznych nadpisań ceny lub opisu pokazać konflikt zamiast nadpisywać.
- Katalog i profil produkcyjny wersjonować niezależnie. Projekt oraz zwolniona dokumentacja produkcyjna przypinają wersję użytych reguł; aktualizacja dostawcy nie przelicza po cichu wcześniej zwolnionego projektu. To rozwija istniejącą wytyczną wersjonowania z `docs/ANALIZA_KREATORA.md`, nie zastępuje jej.
- Przy ostrzeżeniu o dawności UI pokazuje „ostatnio sprawdzono” oraz rodzaj źródła, a nie bezpodstawne „dostępny”. Błąd pobrania zachowuje ostatnią migawkę i pokazuje błąd odświeżenia.

### P1 — minimalna obsługa żywotności SKU i zamówień

- Umożliwić zatwierdzoną zamianę SKU na następcę z mapowaniem zgodności. Nie zakładać zamienności geometrii, wierceń, kolorów, kompletacji ani warunków gwarancji na podstawie podobnej nazwy.
- Powiązać zamówienie z konkretnym wariantem i potwierdzoną ofertą dostawcy: ilość, jednostka/opakowanie, cena, waluta, termin ważności oferty, termin dostawy i potwierdzenie. Gdy integracji z dostawcą brak, dopuszczalny jest ręczny zapis oferty z załączonym źródłem.
- Umożliwić zgłoszenie rozbieżności między katalogiem a dostawą (SKU/EAN, wariant, ilość, uszkodzenie), przypisać odpowiedzialnego i zachować rozwiązanie. To zdarzenie zakupowe, nie automatyczna korekta biblioteki reguł.

## Priorytet, zależności i kryteria odbioru

| Priorytet | Wniosek | Zależności | Mierzalne kryterium |
|---|---|---|---|
| P0 | Statusy pochodzenia, świeżości, oferty i zatwierdzenia technicznego są osobne | Stabilne identyfikatory SKU/produktu; ustalenie ról zatwierdzających | Testy potwierdzają, że pozycja bez potwierdzenia dostępności nie jest wyświetlana jako „dostępna”, a `zatwierdzoneProdukcyjnie=false` nie trafia do zwolnionego BOM/rysunku |
| P0 | Import pokazuje różnice i nie usuwa/nie nadpisuje ręcznych ani przypiętych danych bez decyzji | Identyfikator migawki; ślad audytowy i autoryzacja P0 | Test fixtures: zmiana ceny/opisu, błąd źródła, brak SKU w przebiegu i ponowne pojawienie się zachowują poprzedni rekord, cenę firmy i istniejący snapshot projektu |
| P0 | Projekt zwolniony do produkcji przypina profil, SKU i źródłową rewizję | Model rewizji produkcyjnej oraz niezmienne wydania | Odświeżenie katalogu nie zmienia hashy części/BOM/rysunku już zwolnionego wydania; każda zmiana wymaga nowej rewizji i ponownej walidacji |
| P1 | Śledzony następca SKU i zakup potwierdzony ofertą dostawcy | Aktualne karty producenta/dostawcy; uprawnienia zakupowe | Zamiana nie przechodzi automatycznie, jeśli brak zatwierdzonej relacji; oferta ma źródło, cenę/walutę, jednostkę i datę ważności |
| P1 | Raport jakości danych i kolejka przeglądu wyjątków | Log importu i panel uprawniony | Każdy przebieg podaje liczebności nowych/zmienionych/brakujących/błędnych; 100% rekordów zatwierdzanych technicznie ma dokładne źródło i rewizję instrukcji/karty |

## Fakty vs hipotezy / elementy do potwierdzenia

- **Fakt:** aktualna w repo migawka raportu katalogu okuć datowana jest na 25.09.2026; producent GTV oferuje na kartach szczegóły techniczne i pliki do pobrania oraz ma osobną pozycję dla wycofanych produktów.
- **Fakt:** `pobrano` oraz SHA-256 są już w rekordzie, natomiast interfejs typu produktu nie modeluje jawnego stanu handlowego ani wersji/zakresu zatwierdzenia technicznego.
- **Hipoteza wymagająca testu:** po wdrożeniu nowego katalogu generowany raport mógłby zastępować tylko część danych, więc wspólny znacznik pobrania nie gwarantuje jednakowej aktualności każdego pola. Trzeba prześledzić ścieżki importu i ręcznych rekordów, zanim będzie to traktowane jako wada produkcyjna.
- **Niepotwierdzone:** aktualna dostępność, cena zakupu, następstwo SKU, warunki wykorzystania wszystkich źródeł oraz istnienie feedu/API/GDSN dla tej firmy. Nie podejmować decyzji zakupowych ani o wierceniach na podstawie tego briefu.

## Źródła

- [GTV — profil górny A-SN-TG-405-00, indeks, parametry i karta techniczna](https://gtv.com.pl/produkt/A-SN-TG-405-00/)
- [GS1 — czym jest GDSN i ciągła synchronizacja poprawnych danych](https://support.gs1.org/support/solutions/articles/43000734253-what-is-the-global-data-synchronisation-network-gdsn-)
- [GS1 — standardy GDSN i przewodniki implementacyjne](https://www.gs1.org/standards/gdsn)
- [GS1 — Global Data Model](https://www.gs1.org/services/gdsn/global-data-model)

## Punkt wznowienia

W tej iteracji `origin/main` pozostał na `8230275ad6dea52109f581c793bdd8d6f08684d3`; nie wykryto nowych commitów Claude. Brief jest research-only, bez zmian logiki, katalogu danych i produkcyjnych ustawień. Następnie: ponownie sprawdzić świeże `origin/main`; przy zmianach katalogu/testów zweryfikować ścieżkę importu, rozdzielenie statusu handlowego i technicznego oraz niezmienność już zwolnionych projektów. Ostatni analizowany commit `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`.
