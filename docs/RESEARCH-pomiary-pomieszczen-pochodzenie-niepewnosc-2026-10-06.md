# Pomiary pomieszczeń: pochodzenie, rozbieżności i gotowość do produkcji

Data researchu: 06.10.2026. Autor: Codex. Baza przeglądu: `6419f820859528239cb8509ae9d4bb18a0db475f` (`origin/main`). Zakres: wymagania, źródła i kryteria odbioru; implementację prowadzi Claude. Nie jest to opis funkcji już wdrożonych ani norma tolerancji stolarskich.

## Stan potwierdzony w repozytorium

- `src/core/types.ts` definiuje `Sciana` przez geometrię i wykończenie oraz `Pomieszczenie` przez ściany i materiały. W tych typach nie ma źródła, daty, autora, sposobu pomiaru, instrumentu, punktu odniesienia ani statusu weryfikacji.
- `Modul` przechowuje położenie i wymiary, ale model pokazany w tym pliku nie wskazuje, z którego pomiaru lub rewizji ściany wynikają jego pozycje.
- Wytyczne `docs/RESEARCH-kreator-premium-dla-Claude.md` już mówią o pochodzeniu, dacie i statusie sprawdzenia pomiarów; uwzględniają ściany nieprostopadłe, otwory, parapety, instalacje, wentylację i możliwość montażu. AR/panorama mają pomagać w prezentacji, ale nie zastępują zweryfikowanego pomiaru.
- To przegląd statyczny modelu i wytycznych. Nie badano interfejsu, nie wykonywano pomiarów w lokalach ani testów na danych warsztatowych. Brak pól w tych typach nie dowodzi, że żaden inny plik lub ręczna procedura nie przechowuje podobnych informacji.

## Fakty ze źródeł

1. NIST TN 1900 opisuje wynik pomiaru w szerszym kontekście niż sama liczba oraz omawia model pomiaru, wejścia do modelu i sposoby oceny i wyrażania niepewności. Jest to przewodnik metrologiczny, nie instrukcja pomiaru kuchni i nie narzuca stolarni akredytacji ani określonych tolerancji. Źródło: [NIST, Simple Guide for Evaluating and Expressing the Uncertainty of NIST Measurement Results](https://www.nist.gov/publications/simple-guide-evaluating-and-expressing-uncertainty-nist-measurement-results), TN 1900.
2. NIST wyjaśnia, że spójność pomiarowa jest właściwością wyniku, wiązaną z udokumentowanym, nieprzerwanym łańcuchem porównań, z których każde wnosi niepewność. Samo posiadanie skalibrowanego przyrządu nie wystarcza, by wynik automatycznie był spójny pomiarowo. W aplikacji warsztatowej należy użyć tego jako przypomnienia o kontekście wyniku, nie jako wymogu formalnej spójności z SI. Źródło: [NIST, Metrological Traceability FAQ](https://www.nist.gov/metrology/metrological-traceability).

## Problem i proponowane zachowanie

**Problem:** ta sama długość ściany może pochodzić z pomiaru ręcznego, dalmierza, rzutu, importu CAD albo być wyliczona z innych danych. Bez pochodzenia, czasu i kontroli nie da się rozpoznać, czy to wartość sprawdzona na miejscu, przybliżenie czy wymiar pochodny. Sprzeczne odczyty lub późniejsza zmiana mogą po cichu unieważnić dopasowanie mebli i dokumentację produkcyjną.

**Rekomendacja P1 przed użyciem do wydań produkcyjnych:** do danych pomieszczenia dodać audytowalną kartę pomiaru, niezależną od samej geometrii. Każdy wymiar powinien zachowywać wartość, jednostkę, miejsce/płaszczyznę pomiaru, źródło i metodę (np. ręczny, dalmierz, rzut/CAD, fotografia, wartość wyliczona), autora i czas zapisu. Model/identyfikator przyrządu, jego rozdzielczość lub deklarowaną dokładność wprowadzać tylko, gdy są znane; nie wyprowadzać ich z nazwy urządzenia. Dla wymiaru pochodnego przechowywać zależności od wejściowych pomiarów i metodę obliczenia.

Zachować osobne odczyty, zamiast nadpisywać niezgodne wartości. Pokazywać rozbieżność i wymagać jawnego rozstrzygnięcia przez użytkownika. Nie wyliczać „pewności” statystycznej z samych powtórzeń bez uzasadnionego modelu błędu. Opcjonalną tolerancję/widełki można zapisać jako deklarację użytkownika lub narzędzia wraz z jej źródłem, ale nie ustawiać jednej domyślnej tolerancji dla wszystkich ścian.

W kartotece pomieszczenia uwzględnić osobne obserwacje w kluczowych przekrojach i wysokościach: długość przy podłodze/na wysokości blatu/u góry, wysokości pomieszczenia w kilku punktach, odchylenie narożników od kąta prostego, pion/poziom oraz lokalizacje otworów, parapetów, rur, gniazd, wentylacji, listew i innych przeszkód. Są to zalecane dane robocze; dokładny formularz i miejsca pomiaru powinien zatwierdzić warsztat na swoich przypadkach.

Status powinien odróżniać co najmniej: **niezweryfikowany**, **sprawdzony przez autora**, **sprawdzony przez drugą osobę**. Zmiana pomiaru po akceptacji powinna tworzyć nową rewizję, wskazywać pomiar zastąpiony oraz oznaczać zależne rozmieszczenie modułów/dokumenty jako wymagające ponownego sprawdzenia. Wydanie produkcyjne powinno wskazywać dokładną rewizję pomiarów, z której powstało; nie może po cichu podążać za późniejszą edycją.

Fotografie i rzuty mogą dokumentować przeszkody, ale wymagają prywatnego dostępu z kontrolą uprawnień. Na zdjęciu warto wiązać adnotacje z identyfikatorem obserwacji i punktem ściany; obraz nie powinien automatycznie stawać się wymiarem bez jawnego zatwierdzenia. Dla importu CAD zachować nazwę/wersję pliku i jednostki, a skalę lub niepewne wymiary oznaczyć do kontroli na miejscu.

## Priorytet, zależności i ograniczenia

- **Priorytet:** P1; warunek wiarygodnego projektu i wydania produkcyjnego. Blokada automatycznego wydania z niezweryfikowanych danych powinna być P0 dla każdego przepływu, który już twierdzi, że gwarantuje produkcyjną poprawność na podstawie pomiaru.
- **Zależności:** uwierzytelnianie i uprawnienia do prywatnych zdjęć/dokumentów, audyt zmian, rewizjonowanie projektu/pomiarów, migawka wydania produkcyjnego i unieważnianie zależnych zatwierdzeń. Bez tych elementów sam status „sprawdzony” nie zapewni historii ani kontroli dostępu.
- **Ograniczenie:** nie ustalono dopuszczalnej różnicy pomiarów, minimalnej liczby przekrojów ani reguły „gotowe do produkcji”. NIST nie dostarcza tolerancji stolarskich. Progi i checklistę musi określić warsztat na podstawie używanych narzędzi, materiałów, luzów montażowych i praktyki instalacyjnej; do tego czasu aplikacja ma pokazywać jawne braki i konflikty, nie zgadywać.
- **Prywatność:** zdjęcia mieszkań mogą pokazywać osoby, adresy i rzeczy osobiste. ACL, retencja, eksport i usuwanie plików wymagają osobnego przeglądu; nie należy umieszczać takich materiałów w publicznym katalogu assetów.

## Mierzalne kryteria odbioru

1. Każdy wymiar pomieszczenia zachowuje wartość, jednostkę, źródło/metodę, czas i status; brakujące informacje są jawnie oznaczone jako nieznane, a nie domyślnie „zweryfikowane”.
2. Różne odczyty tej samej cechy nie nadpisują się. Interfejs pokazuje oba wyniki, ich autora/czas i pozwala odnotować rozstrzygnięcie z uzasadnieniem.
3. Wartość wyliczona wskazuje pomiary wejściowe; zmiana wejścia oznacza zależny wymiar jako nieaktualny do ponownego sprawdzenia.
4. Zmiana zweryfikowanego pomiaru tworzy historię rewizji. Wydanie produkcyjne zachowuje identyfikator/hash konkretnej rewizji, a późniejsza zmiana nie modyfikuje już wydanego dokumentu.
5. Niezweryfikowane pomiary lub nierozstrzygnięty konflikt blokują oznaczenie pomieszczenia jako gotowego do wydania; wyjątek wymaga jawnego uprawnienia, przyczyny i śladu audytowego, jeśli warsztat w ogóle dopuści taki tryb.
6. Zdjęcia/załączniki są dostępne tylko dla uprawnionych osób. Testy odrzuconego dostępu obejmują innego użytkownika/firmę i niezalogowaną sesję.
7. Testy migracji zachowują stare projekty bez dopisywania fikcyjnego pochodzenia; historyczne pomiary dostają status „brak danych historycznych” i wymagają ponownej weryfikacji przed wydaniem.
8. Przypadki odbiorowe zawierają ścianę nierównoległą, różne wysokości podłoga/sufit, sprzeczne długości, pomiar z CAD oraz fotografię z przeszkodą. Żaden przypadek nie może automatycznie zamienić poglądowego AR/zdjęcia w zatwierdzony wymiar.

## Do ustalenia z warsztatem

1. Jakie przyrządy i metody są faktycznie używane oraz które dane o przyrządzie da się wiarygodnie zapisać?
2. Które przekroje i punkty pomiarowe są obowiązkowe dla kuchni, a które dla szaf/łazienek?
3. Kto może zatwierdzić pomiar i kiedy wymagana jest druga osoba lub ponowna wizyta?
4. Jak zorganizować checklistę „gotowe do produkcji” i wyjątki, żeby odpowiedzialność była czytelna?
5. Jak długo przechowywać zdjęcia/załączniki, kto może je pobrać i jak odseparować je od publicznych katalogów materiałów?

## Punkt wznowienia

Na aktualnym fetchu `HEAD` i `origin/main` nadal wskazują `6419f820859528239cb8509ae9d4bb18a0db475f`; brak nowych zmian Claude od poprzedniej kontroli. Ten brief jest rekomendacją opartą na statycznym przeglądzie, nie testem implementacji. Następny przebieg: sprawdzić świeże zmiany w obszarze dostępu/API, zdjęć i wydania produkcyjnego; jeśli brak zmian, zebrać kolejne dane warsztatowe lub oficjalne dotyczące importu planów i wersjonowania załączników.
