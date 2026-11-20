# Wyceniarka właściciela: materiał ×2 z kontrolą kosztów

Decyzja: materiał ×2 jest kandydatem ceny, a nie gwarancją zarobku. Nowy symulator jest pod `#/panel/wycena`, wyłącznie dla aktywnego właściciela. Pracownicy nie widzą nawigacji ani kosztów API. Publiczny kalkulator kuchni i zapisane oferty pozostają na dotychczasowych zasadach, do kalibracji rzeczywistymi kosztami.

## Definicje

- Materiał gotowy do produkcji = płyty, fronty, okucia, materiały pomocnicze i koszt zakupionych usług przygotowania. Odpadu płyty, taśmy i oklejania nie doliczamy powtórnie, jeśli są już w tej pozycji.
- Praca = osobogodziny × pełny koszt produktywnej godziny, zawierający wynagrodzenie właściciela/pracowników i przypadający koszt warsztatu. Dwie osoby po 8 godzin to 16 osobogodzin.
- Osobne koszty: montaż całego zlecenia, dostawy/transport, kupowany blat, koszty nieujęte wcześniej. Koszty stałe uwzględnia się raz: w stawce albo w dodatkowej pozycji.
- Koszt chroniony = wszystkie powyższe koszty + jednorazowa rezerwa na ryzyko. Startowo 3%.

## Algorytm

1. Kandydat = materiał gotowy × mnożnik + kupowany blat × (1 + narzut na blat) + koszt montażu + transport. Robocizna produkcji jest finansowana z mnożnika, nie dodawana do niego drugi raz.
2. Dolny próg = maksimum: koszt chroniony / (1 − minimalna marża), koszt chroniony + minimalny zysk, minimalna wartość zlecenia.
3. Docelowy poziom = maksimum dolnego progu oraz kosztu chronionego / (1 − docelowa marża).
4. Wybór = maksimum dolnego progu i minimum kandydata oraz docelowego poziomu. Zatem tanie materiały z dużą pracochłonnością nie wymuszają sprzedaży ze stratą, a drogie materiały nie narzucają automatycznie podwójnej ceny.
5. VAT na końcu, potem zaokrąglenie brutto w górę. Wszystkie pieniądze liczone w groszach.

Startowe parametry robocze: mnożnik 2; minimalna marża 15%; docelowa 25%; minimalny zysk 500 zł netto; minimum zlecenia 1500 zł netto; rezerwa 3%; narzut na kupowany blat 10%; VAT 23%; zaokrąglenie do 50 zł brutto. Wszystkie są edytowalne. Są to założenia symulacji, nie ustalony cennik firmy ani porada dotycząca właściwej stawki VAT. Minimum zarobku ma pierwszeństwo przed docelowym ograniczeniem mnożnika.

## Dane i ryzyko

Wczytanie szkicu używa tego samego buildera i wewnętrznego kosztorysu dotychczasowego silnika przez owner-only `POST /api/v2/kitchen-pricing-source`. Nie potwierdza tych danych jako zakupowych. W szczególności nie przyjęto historycznej ceny Mussi 4,50 zł/mb. Wczytane godziny starego silnika trzeba zweryfikować przy zakupie gotowych formatek. Polityka marży ustawiona przez właściciela nie jest nadpisywana przy wczytaniu kosztów.

Przy ręcznej edycji wynik natychmiast znika. Oblicz jawnie waliduje wszystkie pola. Puste lub ujemne koszty, praca z zerową stawką, NaN/Infinity i docelowa marża niższa od minimum są odrzucane. Symulacja nie zapisuje kosztów do localStorage ani bazy; wewnętrzny JSON można pobrać na własny dysk. Zysk to wynik po podanych kosztach i rezerwie, przed podatkiem dochodowym. Nie jest gwarantowany, gdy koszty lub czas są niepełne.

## Właściciele i sprawdzenie

Wspólna matematyka: `src/core/fair-quote.ts`. Dane z kuchni: `src/server/fair-kitchen-quote.ts`. Publiczny handler zawsze wysyła wyłącznie DTO sprzedażowy `estimate`; wewnętrzne `costing` nie opuszcza owner-only API. Widok używa istniejących pól, Feedback, tokenów i nawigacji panelu. Testy obejmują minimum zarobku, ograniczenie mnożnika, kupowane blaty, osobogodziny, poprawną marżę, VAT, zaokrąglenia, skrajne przypadki, walidację i uprawnienia HTTP oraz telefon.

Kontekst badawczy: [Pro100 — metody i ograniczenia mnożników](https://www.pro100usa.com/support/blog/how-to-price-a-cabinet-job), [CabinetHub — koszt pracy, narzut a marża](https://www.cabinethub.com/guides/how-to-price-custom-cabinets). Konkretne parametry powyżej są propozycją własną, a nie stawkami tych źródeł.
