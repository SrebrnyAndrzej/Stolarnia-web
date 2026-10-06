# Prawa i warunki użycia danych oraz zdjęć katalogowych producentów

Data: 2026-10-06
Baza kodu: `c14fa8ef12981eb8d445af57f7302ef0e45a9831` (`origin/main`)
Zakres: warunki pozyskania, lokalnego przechowania, prezentacji i dalszego użycia danych Egger/Kronospan; wstępny research operacyjny, nie opinia prawna.

## Istotny wynik

Repo zawiera setki lokalnych zdjęć dekorów oraz zeskrobane odpowiedzi serwisów producentów, a obrazy są serwowane przez aplikację z lokalnego katalogu. Oficjalne warunki Kronospan znalezione przy źródle zawierają ograniczenia dla automatycznego pobierania oraz kopiowania, przechowywania i dystrybucji materiałów strony bez uprzedniej pisemnej zgody. Warunki Egger dotyczące bazy obrazów/wideo pobieranej przez Customer Portal wprowadzają ograniczone cele użycia, oznaczenie Egger i numeru/nazwy dekoru, zakaz modyfikowania oraz ograniczenie archiwizacji/dalszego przekazywania. Nie ustalono, czy warunki Egger Customer Portal mają zastosowanie do plików pobranych z `cdn.egger.com` w repozytorium.

**Wniosek operacyjny P0:** nie dodawać kolejnych automatycznie pozyskanych Kronospan assetów ani nie rozszerzać ich redystrybucji, dopóki zakres dozwolonego użycia nie zostanie potwierdzony pisemnie przez producenta/właściwego dystrybutora i przejrzany przez prawnika. Obecność publicznego URL, API lub pliku do pobrania nie dowodzi prawa do pobrania seryjnego, zapisu i wbudowania w produkt. Ten brief nie rozstrzyga, czy wcześniejsze pobrania lub obecne użycie naruszają prawo ani umowę; właściwy zakres warunków, odbiorca aplikacji i jurysdykcja wymagają profesjonalnej oceny.

## Stan repozytorium i pochodzenie

- `docs/materialy/README.md` dokumentuje 408 zdjęć Egger i 236 lokalnych zdjęć Kronospan oraz dane pobrane z publicznego Cyfrowego programu dostaw Egger i serwisów Kronospan. Wskazuje też, że „publiczna dostępność zdjęcia nie stanowi osobnego potwierdzenia licencji do jego redystrybucji”.
- `docs/materialy/katalog-dekorow-PL.json` dla przykładowego Egger wpisu zapisuje `image_url` na `cdn.egger.com`, lokalną kopię, SHA-256 i datę pobrania. Wpisy Kronospan wskazują adresy `kronospan.com/pl_PL/decors/...` oraz `kronospan.com/public/thumbs/...`, lokalną kopię i jej hash.
- `src/core/catalog/decors.ts` buduje lokalny adres `/api/dekory/obrazy/...`; `src/server/app.ts` serwuje `docs/materialy/obrazy` jako statyczne pliki pod `/api/dekory/obrazy`. Zatem repo nie przechowuje wyłącznie linków: zawiera binarne kopie obrazów wykorzystywane przez UI/rendering.
- Statyczne wyszukiwanie dokumentacji nie znalazło pisemnej licencji ani zgody producentów na automatyczne pobranie, lokalny cache, dystrybucję w aplikacji i użycie tekstur w wizualizacji. Brak odnalezionego dokumentu nie dowodzi, że zgody nie udzielono poza repo.

## Źródła producentów — fakty i ograniczenia zakresu

1. **Kronospan:** oficjalny [Terms & Conditions](https://kronospan.com/terms_and_conditions/files/Terms-Conditions-202501.pdf), datowany 30.01.2025 (pobrany/zweryfikowany 2026-10-06), obejmuje witrynę kronospan.com. Sekcja Intellectual Property ogranicza kopiowanie, pobieranie, przechowywanie, rozpowszechnianie, odsprzedaż, licencjonowanie, zmianę i inne wykorzystanie materiałów bez uprzedniej wyraźnej zgody, z wyjątkiem jednego wydruku/odniesienia osobistego i niekomercyjnego. Sekcja Prohibition of Data Scraping and Use in Artificial Intelligence zakazuje automatycznego pobierania bez uprzedniej pisemnej zgody. Regulamin może być aktualizowany. Konkretny zakres jego zastosowania do repozytoryjnego pliku, danych dekoru z endpointu oraz lokalnej aplikacji musi ocenić prawnik; nie traktować tego briefu jako rozstrzygnięcia odpowiedzialności.
2. **Egger:** oficjalny [General Terms for Use of EGGER Image and Video Database via Customer Portal (PDF)](https://downloads.egger.com/static/group/GTC_Image_Video_Usage_2021_EN.pdf?country=XK), obowiązujący od 01.01.2021 według dokumentu, dotyczy użycia tej bazy Customer Portal. Opisuje obowiązkowe oznaczenie „EGGER” wraz z numerem/nazwą dekoru, dozwolony cel reklamowania produktów Egger (lub produktów zawierających materiały Egger), brak prawa do edycji i używania wycinków oraz ograniczenia dalszego archiwizowania/udostępniania. Dokument pozwala Egger zmienić warunki przez publikację. Nie znaleziono dowodu, że konkretne pliki aplikacji zostały pobrane z tej bazy; `image_url` przykładowego rekordu prowadzi do `cdn.egger.com`. Ustalić od Egger, które warunki i jaka zgoda obejmują publiczny katalog/API, miniatury z CDN, cache, wizualizację 3D i dostarczanie obrazów klientom.

Data weryfikacji oznacza datę sprawdzenia wskazanych oficjalnych dokumentów/URL, nie gwarantuje, że producent nie opublikował innego dokumentu lub indywidualnej licencji dla konta firmy.

## Decyzje i praca do wykonania

1. **Zatrzymać nowe pozyskiwanie do czasu wyjaśnienia:** nie uruchamiać kolejnego scrape/download dla Kronospan i nie powiększać zestawu lokalnych zdjęć. Nie omijać limitów, logowania, tokenów, robots ani innych kontroli. Dla Egger również ustalić osobno warunki poszczególnych endpointów i obrazów przed nowym pobieraniem masowym.
2. **Wystąpić o pisemną zgodę:** opisać konkretnie: rynek PL, nazwy/numery dekorów, przetwarzane pola i zdjęcia, sposób i częstotliwość pobrania, cache/local storage, wizualizację/wycinki/tekstury, aplikację webową dla stolarni i jej klientów, publiczne/uwierzytelnione dostępne ścieżki, a także wymagane oznaczenia, termin licencji, terytorium, odwołanie, aktualizację oraz usuwanie. Nie wolno przyjąć, że zgoda na pobranie oznacza sublicencję dla użytkowników aplikacji.
3. **Inwentaryzacja assetów:** dla każdego zdjęcia zachować producenta, źródłowy URL, datę, hash, pochodzenie (portal/API/CDN/katalog), dokładny regulamin/wersję, dowód zgody/licencji, warunki modyfikacji/atrybucji i status weryfikacji. Odróżnić dane opisowe SKU/numeru/nazwy (ich status sprawdzić osobno) od chronionych zdjęć, grafik, plików i tekstur.
4. **Fallback po decyzji prawnej:** jeśli brak zgody na obraz, rozważyć neutralny kolor/wzorzec zastępczy, własne próbki sfotografowane za zgodą zakładu, lub link do strony producenta zamiast pobranej kopii. Nie generować syntetycznej tekstury, która udaje rzeczywisty dekor, i nie pokazywać koloru HEX jako potwierdzenia zgodności barwy.
5. **Etykieta i informacja klientowi:** niezależnie od praw do pliku, wizualizacje muszą mówić „podgląd orientacyjny — wybór i kolor potwierdzić na oryginalnej próbce”. Oficjalne warunki Kronospan wskazują, że zdjęcia dekoru są reprodukcjami, a porównanie kolorystyczne należy robić na próbce. Treść i pozycję atrybucji Egger/Krono wdrażać dopiero zgodnie z pisemnie potwierdzonymi wymaganiami.
6. **Polityka dla kolektorów:** przed wdrożeniem skryptu wymagać źródła i warunków, legalnej metody dostępu, częstotliwości/limitu, prawa do trwałego cache, celów wykorzystania, obowiązku usunięcia, ownera zgody oraz testu czyszczenia cache. Odrębnie oceniać dane produktów, zdjęcia i dokumenty PDF.

## Kryteria odbioru

1. Dla 100% dostarczanych do aplikacji zdjęć katalogu są zapisane: właściciel praw, źródło, pisemna podstawa licencji/zgody, dozwolone zastosowanie, atrybucja, modyfikacje, przechowywanie i termin/warunek usunięcia; brakujący status blokuje publikację obrazu.
2. Dla każdego scrape/download producenta istnieje właścicielsko zatwierdzona karta źródła obejmująca warunki automatycznego pobrania, cache i dalszej dystrybucji; zapytania masowe nie uruchamiają się, jeśli zgoda jest nieważna, nieznana lub odwołana.
3. Test budowania katalogu raportuje assety bez licencji i kończy się blokadą publikacji, zamiast po cichu pomijać ostrzeżenie. Raport nie publikuje kluczy, prywatnych URL-i ani danych osobowych.
4. Po zatwierdzeniu fallbacku brak uprawnienia do pliku nie psuje wyboru materiału ani wyceny; UI odróżnia rzeczywiste zdjęcie producenta od neutralnej próbki wizualnej.
5. Karta produktu i dokument PDF klienta nie sugerują gwarantowanej zgodności koloru; zawierają uzgodnioną informację o próbce i atrybucję wymaganą licencją.
6. Wycofanie zgody ma udokumentowany proces usuwania plików/cache ze wszystkich wdrożeń i kopii, uwzględniający retencję backupów bez ponownej publicznej ekspozycji.

## Granice i punkt wznowienia

Nie wydano opinii o zgodności obecnego użycia z prawem; nie kontaktowano producentów w imieniu firmy, nie zmieniono kodu, katalogu, zdjęć ani wdrożenia. Przed decyzją o usunięciu lub pozostawieniu obecnych plików właściciel powinien uzyskać poradę prawną i wyjaśnić licencje/zgody bezpośrednio z Egger/Kronospan; ewentualna odpowiedź producenta ma być zapisana w repo w sposób pozbawiony danych logowania.

Po publikacji: potwierdzić z właścicielem dalsze dozwolone wykorzystanie istniejących obrazów i wstrzymać nowe automatyczne pobrania do wyjaśnienia. Następnie sprawdzić nowe zmiany Claude, P0 autoryzację API/plików oraz czy katalog blokuje assety bez jawnego statusu praw. Ostatnia sprawdzona rewizja: `c14fa8ef12981eb8d445af57f7302ef0e45a9831`.
