# Szkic kompletnego narzędzia i integracja Mussi

Data: 2 listopada 2026. Ustalony etap: **szkic konstrukcji narzędzia teraz; rzeczywisty silnik i zamawianie razem z wdrożeniem Mussi później**. To decyzja użytkownika z bieżącej rozmowy, doprecyzowująca wcześniejsze polecenie „kompletne narzędzie”. Nie traktować szkicu portalu jako produkcyjnej hurtowni.

## Źródła i sposób sprawdzenia

- Repo Pan Stolarz: SrebrnyAndrzej/Stolarnia-web, feat/pan-stolarz-v2, baza04451c8. Kod i testy zamiast deklaracji w starych raportach.
- Repo Mussi: SrebrnyAndrzej/mussi-plyta, main, ea25327a62a7eb3351ba2295fbeb05b145b50f9d. Projekt Vercel mussi-plyta prj_cWZF1JM6zRonKnJd2W7k40OjdJAm. Repo pobrano wyłącznie do odczytu; nie zmieniono jego konfiguracji ani danych.
- Kontrakt zamówień: https://github.com/SrebrnyAndrzej/mussi-plyta/blob/ea25327a62a7eb3351ba2295fbeb05b145b50f9d/docs/api-zamowienie-csv.md
- Faktyczne działanie API: https://github.com/SrebrnyAndrzej/mussi-plyta/blob/ea25327a62a7eb3351ba2295fbeb05b145b50f9d/src/app/api/v1/zamowienia/route.ts
- Parser koszyka: src/lib/zamowienie-csv.ts; oddzielny parser formatek: src/lib/import-formats.ts.
- Logowanie demonstracyjne Mussi: src/app/api/sesja/route.ts; magazyn katalogu: src/lib/repo.ts; flagi i ceny przykładowe: src/config/brief.ts.
- Reguły Pan Stolarz: WYTYCZNE.md, SPECYFIKACJA-autodobor-okuc.md, RESEARCH-okucia-kuchenne-autodobor.md, materialy/README.md, okucia/README.md, PROJECT_MAP.md, UX-CONTRACT.md.

Badano kod lokalnie, metadane połączonych projektów i zgodność eksportu z parserem Mussi. Nie testowano zakupów, nie wysyłano e-maili, nie składano zamówień i nie używano danych logowania użytkownika.

## Wynik audytu

| Obszar | Stan potwierdzony | Warunek kompletności |
|---|---|---|
| Konta Pan Stolarz | Role owner/employee i profile sprzedaż/produkcja/montaż, kontrola serwerowa, panel kont, aktywacja własnego hasła | Odbiór rzeczywistego procesu na kontach zespołu; testy UI używają atrap |
| Nowy kreator mebla | Gabaryty, skos/schody, płyty, półki, fronty szuflad, biblioteka z wersją, 2D i bryła izometryczna | Jeden wynik konstrukcyjny dla nowych mebli, technologii, części i wstawiania do projektu |
| Skosy | Dwa boki, rozstaw, geometria normalnej grubości, nastawy piły i limit45°, testy matematyczne | Profile technologii połączeń i odbiór próby warsztatowej, nie tylko kąt |
| Dotychczasowy silnik | Części, operacje, standardowe moduły, wydania z migawką i dokumentacja | Zatwierdzone dane producentów, obrzeża, osie/bazy, kompletne profile zamiast statusu roboczego |
| Powiązanie nowej biblioteki z produkcją | Obecnie brak pełnego adaptera | Zachowanie wielokątów skosów i operacji, bez zastępowania części samym prostokątem obwiedni |
| Zamówienia Pan Stolarz | Dodany trwały szkic koszyka, owner-only, wersje i kontrola rewizji projektu | Mapowanie na aktualne indeksy dostawcy i potwierdzona oferta hurtowni |
| Mussi API zakupowe | POST/api/v1/zamowienia, Bearer o zakresie zamowienia, CSV Indeks/Ilość/Jednostka/Uwagi | Trwałe przyjęcie, idempotencja, prawdziwa kartoteka i cennik |
| Trwałość Mussi | API jawnie zwraca zapisane:false; repoSupabase niepodłączone | Zapis transakcyjny, numer z bazy, odczyt statusu po identyfikatorze żądania |
| Tożsamość Mussi | POST/api/sesja przyjmuje demonstracyjną rolę z żądania | Prawdziwe konta, członkostwo firmy, zakresy i przypisanie aktora klucza |
| Wysyłka do Mussi | Nieuruchomiona zgodnie z ustalonym etapem | Wdrożenie Mussi i odbiór integracji na danych rzeczywistych |

**Istotne rozróżnienie:** API zamówienia CSV kupuje indeksy towarów. Nie przenosi listy formatek z wymiarami, obrzeżami i usłojeniem. Mussi ma osobny importer CSV/XLSX w kreatorze formatek. To nie jest ten sam kontrakt i nie wolno przesłać samych ilości płyt jako kompletnego zlecenia rozkroju.

## Co wdraża bieżący etap

Panel właściciela #/panel/zamowienia, wspólny magazyn Supabase Pan Stolarz (purchaseOrders), bez nowej migracji i bez zmiany istniejących projektów lub cen.

- Szkic: tytuł, opcjonalny projekt i jego rewizja, pozycje z nazwą, dokładnym indeksem Mussi, ilością, jednostką i uwagą.
- Nazwa materiału ani kod dekoru nie stają się automatycznie SKU. Brak indeksu można zachować w szkicu, ale blokuje eksport.
- Jednostki koszyka z kontraktu: arkusz, szt, kpl, mb, m2, opak. Jednostki sztukowe wymagają całkowitej ilości; do3 miejsc po przecinku dla długości i powierzchni.
- Kolejne zapisy sprawdzają wersję szkicu oraz istniejący CAS całej bazy. Błąd lub konflikt nie kasuje formularza.
- Powiązanie projektu nie wylicza samoczynnie ilości. Zmiana rewizji blokuje zapis/eksport do czasu jawnej kontroli pozycji.
- CSV koszyka: indeks;ilosc;jednostka;uwagi, BOMUTF-8, CRLF, prawidłowe cytowanie i ochrona przed formułami arkusza. Wysłanie/realizacja nie są skutkiem eksportu.
- Stan zawsze szkic. Odpowiedź eksportu sent:false. Nie ma trasy wysyłającej do hurtowni ani odblokowania wysyłki przez ustawienie w przeglądarce.
- Ochrona niezapisanych zmian useDraftGuard wspólna dla kreatora i zamówień.

## Kolejność dalszego wdrażania

1. **Domknięcie modelu mebla:** materiał i rzeczywista grubość każdej części, kierunek dekoru, osobne krawędzie i obrzeża, kształt wielokąta i baza obróbki, stabilne ID. Undo i walidacja nie mogą zmieniać istniejącego wydania.
2. **Most do technologii:** adapter do istniejącego silnika, części zamiast samej obwiedni, otwory/rowki z profilem i źródłem. Ta sama rewizja w bryle, dokumentacji i liście części. Brak danych pozostaje blokadą produkcji.
3. **Okucia i szuflady:** front ma niezależną wysokość od boku systemowego; profil producenta dobiera dno, plecy, prowadnice, mocowania i luzy. Brak SKU i niezweryfikowane otworowanie nie stają się domyślną poprawną pozycją.
4. **Zapotrzebowanie zakupowe:** rozdzielenie materiału, obrzeży, akcesoriów i usług; powiązanie pozycji z jednoznacznym indeksem oraz jednostką Mussi. Ilości arkuszy wynikają z rozkroju i zatwierdzonych zapasów, nie z samego sumowania powierzchni.
5. **Mussi gotowe do przyjęcia:** prawdziwe logowanie i firmy, trwały magazyn, ceny i stany zatwierdzone przez hurtownię, prawidłowe limity kupieckie, numerowanie i idempotencja. Obecny fallback osoby składającej na demonstracyjny zespół nie może obsługiwać rzeczywistych firm.
6. **Próba integracyjna:** klucz przypisany do właściwej firmy i osoby, aktualny katalog, wycena próbna, porównanie pozycji i całej wartości. Wyłącznie backendy, sekret nigdy w JS przeglądarki. Istniejącej ochrony Vercela nie osłabiamy dla integracji.
7. **Realne zamówienie:** zamrożony pakiet i wersja, akceptacja właściciela konkretnej wartości, trwała kolejka/outbox, stały klucz idempotencji, potwierdzenie odbiorcy i status. HTTP200 nie wystarcza: probny:false, zapisane:true oraz trwały identyfikator zamówienia.
8. **Niepewny wynik:** timeout po wysyłce nie oznacza odrzucenia. Najpierw odczyt/reconciliation po kluczu, potem ewentualne ponowienie. Brak możliwości odczytu statusu blokuje bezobsługowe retry.

## Odbiór docelowy

- Dwie osoby edytują model/szkic bez cichego nadpisania.
- Zmiana skosu zmienia te same części w podglądzie i dokumentacji, w obu kierunkach.
- Brak materiału, obrzeża, profilu lub SKU jest nazwanym brakiem, nie wyceną zero.
- Wydanie pozostaje identyczne po zmianie projektu i katalogu.
- Próba CSV przechodzi parser i aktualny katalog Mussi, bez scalania różnych jednostek i zgadywania indeksów.
- Dwa kliknięcia i ponowienie po timeout nie tworzą drugiego zamówienia.
- Brak sesji, pracownik bez uprawnień zakupowych i klucz innej firmy nie odczytają zamówienia.
- Odbiorca faktycznie odczytuje przyjęte zamówienie po restarcie, a stan potwierdzenia wraca do Pan Stolarz.

## Granica bieżącego wyniku

To działający szkic modułu zamówień w Pan Stolarz i sprawdzony kontrakt pliku. **Nie jest wdrożeniem produkcyjnej hurtowni, automatycznej wysyłki ani kompletnego silnika produkcyjnego.** Nie zmieniono Mussi, jego flag, cenników ani autoryzacji. Realny silnik jest kolejnym wspólnym etapem według decyzji użytkownika.
