# Dane projektowe klientów a publiczne repozytorium

Data przeglądu: 06.10.2026. Autor: Codex. Zakres: ryzyko publikacji dokumentów z danymi projektu, zalecenia dla procesu pracy i aplikacji. To nie jest opinia prawna ani rozstrzygnięcie, czy doszło do naruszenia prawa lub obowiązków zgłoszeniowych.

## Pilne ustalenie z przeglądu Claude

- Publiczny GitHub REST API zwrócił dla `SrebrnyAndrzej/Stolarnia-web` `visibility=public` (`private=false`) w dniu przeglądu. Oficjalna dokumentacja GitHub wskazuje, że zawartość publicznych repozytoriów jest dostępna dla wszystkich w internecie.
- Nowy commit dodał do repozytorium indywidualny model montażowy klienta. Plik zawiera bezpośrednie identyfikatory osób i lokalizacji domu, a także odniesienia do dzieci. Wartości te ani dokładne położenie pliku nie są powielane w tym briefie.
- To jest bezpośrednio obserwowalna publikacja danych w repozytorium publicznym, nie tylko hipotetyczny problem z przyszłymi zdjęciami lub uploadem. Nie sprawdzono, czy plik został pobrany, zforkowany, zindeksowany lub zapisany w cache; nie mamy dostępu do logów odbiorców.
- Równoległy przegląd PDF pokazał, że generator przenosi tytuł modelu na okładkę, nagłówki i stopki. Przy tym wejściu rysunek PDF również zawiera dane identyfikujące. Przykładowy PDF utworzono wyłącznie w katalogu tymczasowym do QA, nie dodano go do repozytorium.

## Dlaczego to ma znaczenie

1. Zasady RODO wymieniają ograniczenie celu, minimalizację danych, ograniczenie przechowywania oraz integralność i poufność. Artykuł 25 mówi o ochronie danych w fazie projektowania i ustawieniach domyślnych, a artykuł 32 o środkach bezpieczeństwa odpowiednich do ryzyka. Są to źródła zasad, nie ocena zgodności tej konkretnej działalności ani instrukcja, czy i komu zgłaszać incydent. Źródło: [Rozporządzenie (UE) 2016/679 w EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj), w szczególności art. 5, 25 i 32.
2. GitHub wyjaśnia, że publiczne repozytorium jest dostępne w internecie, a pliki w repozytorium zachowują historię wersji. Zwykłe usunięcie pliku w kolejnym commicie nie usuwa jego poprzednich wersji. GitHub ostrzega, że usunięcie wrażliwego pliku z historii wymaga skoordynowanego przepisania historii; wcześniejsze klony, forki i cache mogą nadal zachować kopie. Źródła: [widoczność repozytoriów](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories), [usuwanie wrażliwych danych z repozytorium](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).

## Działania rekomendowane

**P0 — ograniczyć dalsze ujawnianie, zachować dowody i nie niszczyć historii bez planu.** Wstrzymać dodawanie kolejnych indywidualnych rysunków, umów, ofert, zdjęć i plików źródłowych klientów do publicznego repozytorium. Zachować potrzebny model w prywatnym, kontrolowanym miejscu i nie publikować kopii w tym briefie. Właściciel repozytorium powinien pilnie zdecydować z osobą odpowiedzialną za dane, czy czasowo ograniczyć widoczność, usunąć plik z bieżącej gałęzi, a następnie przeprowadzić kontrolowane czyszczenie historii oraz sprawdzić forki, klony, cache i inne opublikowane artefakty. Zmiana public/private ma konsekwencje dla forków i hostingu; sama zmiana widoczności nie usuwa kopii, które już powstały. Nie wykonano żadnej z tych zmian.

**P0 — rozdzielić kod publiczny od dokumentów klientów.** Repozytorium z kodem powinno zawierać tylko syntetyczne, zanonimizowane fixture'y testowe. Rysunki produkcyjne, rzuty, umowy, adresy, zdjęcia i PDF-y trzymać w prywatnym magazynie projektu za uwierzytelnieniem i sprawdzeniem członkostwa. Linki do plików udostępniać czasowo, po autoryzacji, z logiem pobrania. Ukrycie pliku przez nazwę, `robots.txt` lub nieznany adres URL nie jest kontrolą dostępu.

**P1 — zapobiegać powtórzeniu.** Dodać kontrolę PR/CI dla ścieżek z danymi instancji klienta oraz test repozytorium zakazujący prawdziwych dokumentów i identyfikatorów w katalogu przykładów. Skaner nazw, adresów i telefonów może wspomagać przegląd, ale nie rozstrzyga samodzielnie, czy treść jest bezpieczna. Każdy przykładowy PDF należy budować z syntetycznego modelu. Do procesu dodać obowiązkowy przegląd listy plików stagingowanych przed publikacją.

**P1 — bezpieczne generowanie PDF.** Model przeznaczony do rysunku może zawierać nazwę projektu dla warsztatu, ale generator powinien pozwalać na neutralny tytuł/alias i jawnie wybrać, które dane identyfikujące mają być na kopii roboczej. Link do źródłowego rzutu lub nazwisko architekta nie powinny być automatycznie kopiowane do publicznego artefaktu. Prywatne wydanie techniczne może zawierać dane potrzebne do pracy, ale wyłącznie w kontrolowanym obiegu.

## Priorytet, zależności i ograniczenia

- **Priorytet:** P0 containment; P0 dla oddzielenia klientowskich artefaktów od repozytorium publicznego. P1 skanowanie i bezpieczne generowanie PDF.
- **Zależności:** decyzja właściciela repozytorium i osoby odpowiedzialnej za dane; poufny magazyn z ACL oraz uwierzytelnienie użytkowników; procedura przeglądu i czyszczenia historii, koordynacja aktywnych klonów i pipeline'ów. Wcześniejszy research wskazuje, że obecne REST/MCP nie mają middleware autoryzującego — wymaga to oddzielnego P0 przed przesyłaniem dokumentów do API.
- **Niepewności:** nie ustalono kto pobrał plik, czy repo ma forki/klony poza zespołem, jakie są ustawienia Vercel ani czy doszło do incydentu w rozumieniu prawa. Sam zapis danych w pliku nie wystarcza, by wyciągnąć wniosek prawny o naruszeniu lub obowiązku notyfikacji.
- **Bezpieczne działanie:** nie wykonano zmiany widoczności ani force-pusha. GitHub wskazuje, że rewrite zmienia hashe i wymaga koordynacji; dopóki właściciel nie wybierze planu, nie należy usuwać historii ani nadpisywać pracy Claude'a.

## Mierzalne kryteria odbioru

1. Publiczne repozytorium i wszystkie jego przykłady/fixture'y nie zawierają dokumentów ani danych rozpoznawalnych klientów; automatyczny test blokuje dodanie pliku do chronionych ścieżek, a przegląd ręczny sprawdza również nazwy plików, metadane PDF i tekst OCR.
2. Każdy projektowy plik jest prywatny z domyślnym brakiem dostępu: niezalogowany użytkownik i członek innej firmy dostają odmowę pobrania; uprawniony członek może go odczytać, a zdarzenie jest audytowane.
3. Link do pliku wygasa zgodnie z krótkim okresem ustalonym przez właściciela; skopiowany link po wygaśnięciu nie daje dostępu. Brak stałych publicznych URL-i do plików klientów.
4. PDF testowy generowany w CI zawiera wyłącznie syntetyczne dane. Odbiór obejmuje sprawdzenie tekstu, nagłówka, stopki, metadanych PDF, nazw załączników i wszystkich stron po renderowaniu.
5. Uzgodniona procedura incydentu i retention określa właściciela decyzji, sposób ustalenia zakresu kopii oraz kanał konsultacji prawnej. Brief nie zastępuje tej procedury.
6. Jeśli właściciel zatwierdzi czyszczenie historii: lista dotkniętych branchy/tagów/PR/klonów jest sprawdzona, kopia kontrolna zabezpieczona, nowy stan potwierdzony skanem, a wszyscy współpracownicy dostają instrukcję re-clone/rebase. Zwykły commit usuwający plik nie jest zaliczany jako pełne usunięcie.

## Przegląd nowego generatora PDF

Commit `537cdc0` dodaje kartę pomiaru/wymiarowania frontów. Lokalnie `npm test` przeszedł (56/56), `npm run typecheck` przeszedł, a PDF A3 z nowego modelu wygenerował się jako 18 stron i został wizualnie sprawdzony. Strona karty pokazuje odrębnie wymiar nominalny, wzór po pomiarze, puste pole do wpisania wyniku oraz ostrzeżenia; nie przelicza automatycznie wymiaru cięcia. To właściwe rozdzielenie dla ręcznego arkusza roboczego, ale dokument nie jest sam w sobie zweryfikowanym plikiem CNC. Drobna niejasność produkcyjna: symbole szerokości `S` pojawiają się w formułach, bez jednoznacznej definicji punktów pomiarowych S na tej karcie; przed przekazaniem ekipie warto opisać bazę wymiaru lub oznaczyć ją w rysunku.

Zakres testów: build/typy i obecne testy ogólne przeszły, ale brak testu regresji samej nowej karty (wzory, łamanie stron i wartości z danych modelu). Odbiór wymaga testowego modelu syntetycznego z długą listą frontów i sprawdzenia, czy strona kontynuacji ponawia nagłówki tabeli oraz zachowuje przypisanie numeru frontu do wzoru.

## Punkt wznowienia

Ostatnia sprawdzona rewizja: commit dodający nową kartę wymiarowania frontów (06.10.2026). Zweryfikowano lokalne testy i układ PDF; bez testów produkcyjnych, deployu ani dostępu do logów pobrań. Następny krok zależny od właściciela: containment i decyzja o przechowywaniu/oczyszczeniu publicznej historii. Dalszy research: wzorce prywatnego magazynu plików klientów, autoryzacja zasobowa i audyt dostępu, po rozwiązaniu P0 API.
