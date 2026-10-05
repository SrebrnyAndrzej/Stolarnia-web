# Akceptacja projektu przez klienta: wersja, zakres i dowód

Data: 2026-10-05
Baza kodu: `fd08affeb194bce949c345736f9b6d7e32c85e2d`
Zakres: uzupełnienie istniejącego punktu B03 o model danych i kryteria odbioru; nie jest to opinia prawna ani projekt e-podpisu.

## Stan i problem

Wytyczna `RESEARCH-kreator-premium-dla-Claude.md` ma już punkt B03: akceptacja projektu, zakresu, materiałów i zmian; `RESEARCH-silnik-mebli-i-konta.md` wymaga zatwierdzenia projektu przed produkcją. Obecne wydanie produkcyjne ma zamrożony stan i hash SHA-256 (`WydanieProdukcyjne` w `src/core/types.ts`), a umowa jest zapisaną kopią danych. Nie znaleziono modelu obiektu akceptacji ani powiązania między zatwierdzeniem klienta a konkretnym hashem/wydaniem. UI umów wyraźnie informuje, że zapisanie umowy nie oznacza jej podpisania; nie ma analogicznego, jawnego śladu akceptacji projektu.

Bez takiego rozdzielenia pracownik może nie wiedzieć, czy klient zatwierdził aktualny układ, materiały, cenę, czy tylko obejrzał render. Sam status „projekt zaakceptowany” powiązany z mutowalnym projektem nie dowodzi, co klient widział.

## Zalecany model

**P1 — zależności:** najpierw P0 uwierzytelnianie i kontrola dostępu; potem niemutowalne wydanie/manifest renderowany po stronie serwera i audyt zdarzeń. Ustalić z właścicielem zakres akceptacji i rozróżnić ją od umowy/podpisu.

Każda prośba o akceptację powinna wskazywać niezmienny snapshot: `projectId`, rewizję, hash artefaktu, wersje materiałów/reguł oraz jawny zakres. Zakresy traktować osobno, np. koncepcja/układ, materiały i wykończenia, cena/zakres oferty, zmiana do umowy, zgoda na produkcję. Nie utożsamiać zatwierdzenia wizualizacji z weryfikacją technologiczną ani gotowością CNC.

Stan obiegu powinien odróżniać co najmniej: przygotowany, wysłany, otwarty, zaakceptowany, odrzucony, wygasły, anulowany/superseded. Samo otwarcie albo pobranie nie jest akceptacją. Rekord zachowuje serwerowy czas, zakres i hash widzianej wersji, tożsamość/uzgodniony sposób identyfikacji, kanał, rezultat oraz aktora wewnętrznego, który wysłał prośbę. Nie używać przewidywalnego `projectId` jako klucza dostępu.

Jeżeli korzysta się z linku klienta, token powinien być losowy, przechowywany jako hash, ograniczony do pojedynczej prośby/projektu, mieć datę ważności i możliwość unieważnienia; po wejściu klient widzi dokładnie zamrożony artefakt oraz czytelną listę zakresu. Nie daje on dostępu do kosztów, notatek ani innych projektów. Akceptacja przechowywana jest jako osobny append-only rekord; nie nadpisuje się jej po zmianie projektu.

## Zasady unieważnienia i bramki

- Zmiana pola objętego zakresem (geometria, fronty, AGD, materiał, wykończenie) powoduje oznaczenie wcześniejszej akceptacji jako dotyczącej starszej rewizji; do kolejnego snapshotu trzeba poprosić o akceptację ponownie.
- Zmiana ceny, zaliczki lub zakresu oferty wymaga osobnej nowej akceptacji zakresu handlowego; nie zmienia historycznej umowy ani zachowanej ceny.
- Produkcyjne wydanie wymaga oddzielnie: aktualnego snapshotu konstrukcji, walidacji profili/operacji oraz spełnionych akceptacji, które zakład oznaczył jako wymagane. Klient nie zatwierdza parametrów CNC przez samo oglądanie modelu.
- Rewizja katalogu lub reguł technologicznych nie zmienia snapshotu zaakceptowanego. Jeśli unieważnia jego produkcyjną przydatność, system tworzy nową rewizję i wymaga ponownego wewnętrznego zatwierdzenia oraz wskazanych akceptacji klienta.
- Obsługa akceptacji przekazanej poza portalem powinna rejestrować kto ją wprowadził, kiedy, jaki dokładny artefakt/scope potwierdził i gdzie przechowuje się dowód, z dostępem zgodnym z polityką prywatności.

Nazwy stanów i sposób identyfikacji klienta wymagają decyzji właściciela. Nie zakładamy, że taki portalowy klik jest podpisem umowy albo konkretną formą prawną oświadczenia; skutki prawne ewentualnego kanału akceptacji trzeba ocenić osobno. Ten brief nie zmienia aktualnych umów.

## Mierzalne kryteria odbioru

1. Klientowi pokazana rewizja i hash są zapisane przy akceptacji; serwer potrafi później odtworzyć ten sam PDF/podgląd oraz zakres.
2. Test: klient akceptuje rev. 12, po zmianie materiału powstaje rev. 13; rev. 12 pozostaje zaakceptowana historycznie, rev. 13 jest „wymaga akceptacji”, a eksport produkcyjny nie przypisuje zgody rev. 12 do rev. 13.
3. Test niezależny: akceptacja renderu nie ustawia technicznej flagi `gotowaDoProdukcji`; wydanie blokują niezweryfikowane otwory/brak wymaganej kontroli.
4. Zmiana tylko kosztu wewnętrznego nie zmienia uzgodnionej ceny/umowy. Zmiana ceny dla klienta tworzy nowy snapshot oferty i odrębną prośbę o akceptację, bez edycji historycznego dokumentu.
5. Dla dostępu portalowego: wygasły/unieważniony token, inny projekt, inna firma i wielokrotne użycie po zatwierdzeniu nie odsłaniają niepowiązanych danych; test sprawdza skopiowany link i zmianę identyfikatorów.
6. Dziennik zapisuje wysłanie, otwarcie, odmowę, akceptację i unieważnienie bez kopiowania adresu, telefonu lub treści umowy do logów technicznych.
7. Dla każdej wymaganej akceptacji na liście projektu widać: zakres, rewizję, skrót hash, osobę/źródło, czas i aktualność wobec bieżącej rewizji.

## Dowody i odniesienia w repozytorium

- `docs/RESEARCH-kreator-premium-dla-Claude.md` B03 opisuje potrzebę akceptacji, ale nie workflow/hash.
- `docs/RESEARCH-silnik-mebli-i-konta.md` rozdziela prezentację klienta i produkcję oraz wymaga, by zmiana nie przepisywała zatwierdzonych dokumentów.
- `src/core/types.ts`: wydanie produkcyjne jest snapshotem z hash SHA-256; brak typu akceptacji w sprawdzonym modelu.
- `web/src/views/Contracts.tsx`: zapis umowy jawnie nie jest równoznaczny z podpisaniem.
- Zabezpieczenie URL/API: `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md`; audit działań: `docs/RESEARCH-audit-zdarzen-zespolowych-2026-10-05.md`.

Nie zmieniono aplikacji ani dokumentów klienta. Zgodność prawna przyszłego obiegu wymaga odrębnej decyzji właściciela i właściwego przeglądu.
