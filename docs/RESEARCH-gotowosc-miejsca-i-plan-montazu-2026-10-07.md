# Gotowość miejsca i planowanie montażu

Data: 2026-10-07  
Baza przeglądu `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: operacyjna gotowość pomieszczenia, dostawy i ekipy przed rozpoczęciem montażu. Nie określa wymagań prawnych, instalacyjnych ani tolerancji dla zakładu.

## Luka w aktualnych briefach

Repo ma termin montażu przy projekcie i oddzielny brief protokołu/usterek po wykonaniu. Nie znaleziono szczegółowego procesu, który przed wyjazdem ekipy pokaże, czy zatwierdzony projekt i części dotarły, czy miejsce jest przygotowane, czy możliwe są prace w planowanym zakresie, kto potwierdził gotowość i co zrobić przy blokadzie. Bez niego termin w kalendarzu może wyglądać na potwierdzony, mimo że nie gotowe są meble, pomieszczenie albo zależności innych ekip.

## Dowody z oficjalnych materiałów

- IKEA Polska zaleca przed montażem sprawdzić zakończenie prac pomieszczenia, przyłącza zgodne z projektem, kompletność/dostarczenie produktów, dostęp i przestrzeń do pracy. Opisuje też weryfikację przedinstalacyjną jako sposób sprawdzenia wymiarów i zgodności projektu z rzeczywistym pomieszczeniem. [IKEA — Jak przygotować się do montażu kuchni?](https://www.ikea.com/pl/pl/customer-service/knowledge/articles/795fc57c-0b41-410g-8d3e-37c4c4eg5ebb.html), [IKEA — usługa montażu krok po kroku](https://www.ikea.com/pl/pl/customer-service/services/assembly/montaz-i-instalacja-kuchni-pubc6df5290/)
- IKEA podaje, że kuchnie częściowo można montować mimo niegotowych instalacji, ale wtedy nie da się zakończyć i uruchomić urządzeń; zakres możliwego montażu jest więc zależny od warunków i ma jawnie ograniczony zakres. [IKEA — montaż bez instalacji](https://www.ikea.com/pl/pl/customer-service/knowledge/articles/97756589-0833-4b6f-bb63-f741d5gg8316.html)

To checklisty i proces jednego dostawcy, a nie uniwersalny wymóg techniczny lub prawny. Nie przenosić jego wymiarów, wymogów dot. ścian, instalacji czy warunków odmowy na tę stolarnię. Ich właściwe kryteria oraz zakres usług muszą być zdefiniowane przez właściciela/technologa i specjalistów od instalacji.

## Zalecany workflow

**P1 — po ACL, prywatnych załącznikach i podstawowym kalendarzu zleceń.** Wprowadzić gotowość jako checklistę przygotowania pracy, odrębną od statusu „zamontowano” i od reklamacji.

1. **Planowana wizyta** ma cel i zakres prac, adres operacyjny chroniony rolami, kontakt do osoby zapewniającej dostęp (tylko gdy potrzebny), przypisaną ekipę, czas/okno, pozycje do przewiezienia, wymagany projekt/wydanie i zależności. Nie zakładać optymalizacji tras GPS ani śledzenia pracowników.
2. **Checklistę konfiguruje warsztat** per rodzaj zlecenia (np. montaż samych korpusów, kuchnia z blatem, pomiar kontrolny). Pozycja ma pytanie zrozumiałe dla klienta/pracownika, odpowiedzialną stronę (warsztat/klient/inny wykonawca), status: niepotwierdzone, gotowe, blokuje zakres, odstępstwo zatwierdzone, opis i datę weryfikacji. Właściciel może dodać, usunąć lub zmienić element; wartości i teksty nie mogą być zaszyte jako rzekomy standard branżowy.
3. **Przed wizytą:** potwierdzić zgodność projektu/rewizji oraz ilość/kompletność materiałów, dostęp do budynku i pomieszczenia, miejsce rozładunku/stagingu, zakończenie prac, kolizje z innymi ekipami i gotowość klienta. Pytania o instalacje odsyłają do zatwierdzonego planu i właściwego fachowca; aplikacja nie instruuje laika jak przerabiać prąd/gaz/wodę.
4. **Dowody:** do pozycji można dodać zdjęcie lub dokument, ale załączniki są prywatne, minimalne i powiązane z projektem/checklistą. Poproś tylko o obrazy potrzebne do oceny, bez niepotrzebnych osób, dokumentów lub danych z mieszkania. Termin retencji i widoczność zatwierdza właściciel zgodnie z briefem prywatności.
5. **Decyzja operacyjna:** status wizyty `planowana → potwierdzana → gotowa / warunkowo gotowa / wymaga decyzji → w toku → zakończona / przerwana / przełożona`. „Warunkowo gotowa” ma jawny, ograniczony zakres i zatwierdzającą osobę; nie może omijać zależności bezpieczeństwa lub brakującego krytycznego materiału. Sam system nie podejmuje prawnej decyzji o odmowie usługi.
6. **Blokada i zmiana terminu:** zapisuje przyczynę operacyjną, stronę/ekipę do działania, następny krok, termin ponownego potwierdzenia i wpływ na wizyty zależne. Wysyłka przypomnienia/zmiana terminu nie zmienia umowy ani uzgodnionej ceny; tekst klientowski zatwierdza właściciel.
7. **W dniu montażu:** pracownik widzi adres i kontakt tylko zgodnie z przydziałem, wymagany pakiet dokumentacji, listę elementów do załadunku i aktualny status checklisty. Skan/odznaczenie pozycji jest audytowane. Jeżeli zakres zmieniono, wymaga wskazania wydania i jawnej zgody; nie zastępuje protokołu odbioru.
8. **Częściowy zakres:** jeśli zakład dopuszcza etapową pracę, plan wskazuje czynności wykonalne oraz blokowane zależnością (np. meble vs. podłączenie urządzenia) i osobę decydującą. Nie obiecuje zakończenia, uruchomienia ani testów usług, których warunki nie są spełnione.

## Zależności, priorytet i odbiór

- **P0:** auth/ACL i ograniczenie adresów/zdjęć do przypisanych osób (`RESEARCH-macierz-autoryzacji-tras-2026-10-05.md`, brief prywatności), aktualne wydanie produkcyjne, prywatne załączniki; bez nich nie publikować portalowej checklisty ani publicznego linku.
- **P1:** kalendarz montażu, definicja checklist warsztatu, przydział ekipy, status gotowości i blokady; połączyć z `RESEARCH-odbior-montaz-reklamacje-2026-10-06.md` tylko przez identyfikator wizyty, pozostawić protokół odbioru osobnym rekordem.
- **P2:** widok obciążenia ekip i analiza przyczyn przekładania; dopiero gdy rzeczywiste wizyty i blokady są rejestrowane.

Kryteria dla Claude:

1. Zlecenie nie przechodzi do „gotowe do wyjazdu”, gdy checklist ma niepotwierdzoną pozycję oznaczoną przez warsztat jako blokująca; wyjątek wymaga roli uprawnionej, zakresu, powodu i śladu audytu.
2. Dla warunkowo gotowej wizyty lista jawnie pokazuje, jakie prace są dozwolone i zablokowane, kto zaakceptował ograniczony zakres oraz co ma zostać potwierdzone; status nie jest równoznaczny z ukończeniem.
3. Przesunięcie terminu nie nadpisuje poprzednich dat ani nie zmienia umowy/ceny; historia zapisuje kto, kiedy, dlaczego i kogo poinformowano.
4. Zmiana rewizji po przygotowaniu ekipy wymaga odświeżenia listy materiałów i dokumentów. Wydruk offline pokazuje rewizję i czas wygenerowania; połączenie słabe/offline nie może udawać, że ma nowszy stan serwera.
5. Pracownik spoza projektu nie odczytuje adresu, zdjęć, kontaktu ani checklisty przez podmianę ID; klient/odbiorca zewnętrzny nie widzi wewnętrznych notatek, marży i przyczyn personalnych.
6. Test scenariusza: brak jednego elementu dostawy i niedostępne pomieszczenie blokują gotowość; po dopisaniu potwierdzenia odpowiedzialnego i nowej daty lista zachowuje pierwotną blokadę jako historię, nie zmienia ukończonego protokołu poprzedniej wizyty.
7. Szablony checklist są wersjonowane lub snapshotowane przy wizycie, żeby późniejsza edycja wzoru nie zmieniała zapisanej oceny wcześniejszej gotowości.
8. Nie istnieją w kodzie uniwersalne wymagania o konkretnym typie ściany, odległości gniazda, temperaturze, czasie dojścia, kosztach anulowania czy terminie ustawowym bez zatwierdzonego źródła i decyzji właściciela.

## Niezweryfikowane założenia

Nie badano rzeczywistego kalendarza, sposobu przydziału ekip, zakresu usług, przewożonych elementów, dojazdu/parkingu, osób posiadających klucze ani warunków na budowach klientów. Hipotezą jest, że checklist przedwyjazdowa zmniejszy przekładanie i dodatkowe kursy; to należy zmierzyć po wdrożeniu, nie deklarować jako fakt.

## Punkt wznowienia

- Świeże `origin/main`: `8230275ad6dea52109f581c793bdd8d6f08684d3`; brak nowych commitów Claude podczas tej kontroli.
- Brief opublikowany na osobnej gałęzi researchowej; `main` pozostaje nietknięty. To dokumentacja produktowa, więc testów aplikacji nie uruchamiano.
- Następny temat: w kolejnej kontroli porównać nowe zmiany Claude i status P0 auth; jeśli brak implementacji, ocenić zarządzanie wydaniami/feature flags oraz bezpieczne wdrożenie migracji bez naruszenia historycznych projektów.
