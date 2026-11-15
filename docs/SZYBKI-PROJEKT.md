# Szybki projekt kuchni: kontrakt silnika (2026-11-01)

Cel (Mateusz, na pomiarze u klienta): ułożyć meble z gotowej biblioteki, wybrać dekory i okucia, a potem wygenerować wycenę w kilka minut.
Silnik zwraca **zwykłe moduły projektu** (`Modul`, te same co przy ręcznym dodawaniu), więc 3D, rzut, wycena, produkcja i PDF działają bez zmian.
Ten dokument opisuje backend. Kreator UI: `web/src/views/SzybkiProjekt.tsx` (commit dc3aa5c).

Kod: `src/core/uklad.ts` (rozkład i układ I/L/U), `src/core/styl.ts` (dekory → materiały), `src/core/pricing.ts` (`dobierzOkucia` z wyborem projektu), metody `Stolarnia.wypelnijCalaSciane / szybkiUklad / ustawStyl / stylPomieszczenia / opcjeOkuc / ustawOkucia` w `src/service.ts`. Testy: `src/szybki-projekt.test.ts`.

Wejście jest walidowane wspólnymi schematami zod (`src/schematy-szybki.ts`) w usłudze, więc REST i MCP mają te same limity. Błędne dane (np. `korpus: "abc"`, `NaN`, blenda narożna > 150) dają HTTP 400 z opisem pola.

Wszystkie operacje zapisujące mają `podglad: true`, które liczy wynik na kopii projektu i niczego nie zapisuje. Zapis jest atomowy: przy błędzie projekt się nie zmienia.

## 1. Wypełnij całą ścianę

`POST /api/projekty/:id/sciany/:sid/wypelnij` · MCP `wypelnij_cala_sciane` · `api.wypelnijCalaSciane(id, sid, opcje)`

| Pole | Typ | Opis |
|---|---|---|
| `rzad` | `"dolny" \| "wiszacy"` | wymagane |
| `konstrukcja` | `"shelves" \| "drawers"` | dla dolnych, domyślnie `shelves`. Wiszące mają zawsze półki |
| `szerokosci` | `number[]` | preferowane szerokości w kolejności, domyślnie `600, 500, 400, 800, 900, 300, 450`. Szerokości spoza katalogu są pomijane |
| `symetria` | `boolean` | szafki ułożone lustrzanie, blenda dzielona na oba końce |
| `odXMM`, `doXMM` | `number` | zakres wypełnienia, domyślnie cała ściana |
| `blendaNaroznaMM` | `number` | blenda przy module ze ściany prostopadłej, 0–150, domyślnie 50 (założenie). `0` wyłącza blendę |
| `podglad` | `boolean` | |

Reguły:
- Wypełniane są tylko wolne odcinki. Stojące moduły zostają (np. zmywarka, piekarnik, słupek).
- Za zajęte uznawane są też moduły z innych ścian pomieszczenia, jeśli ich obrys z frontem wchodzi w pas przy tej ścianie (np. szafka narożna ślepa ze ściany A zajmuje na ścianie B odcinek 0–578 mm). Obok takiego modułu silnik wstawia blendę narożną. Wyjątek: moduł narożny `lCorner` / `wallCorner`, przy którym blendy nie ma.
- Reszta 20–149 mm jest zamykana blendą (moduł `filler`, jak `wypelnijLuke`). Blenda stoi przy końcu ściany. Blenda to panel bez boków — budowa nie sprawdza jej jak korpusu (wystarczy szerokość > 0).
- Reszta < 20 mm to **luz montażowy**: bez modułu, z ostrzeżeniem (pole `luzy`).
- Reszta 150–299 mm, której nie da się zejść poniżej 150 mm: w rzędzie dolnym **cargo 150/200 z katalogu** (+ blenda lub luz na resztę); w rzędzie wiszącym (brak cargo) blenda szersza niż 150 mm z ostrzeżeniem. To **decyzja koordynatora z 1.11.2026, do potwierdzenia przez Mateusza** — nie wstawiamy wąskich szafek z półkami i drzwiami.
- Reszta ≥ 300 mm bez pełnych szafek (np. przy zawężonej liście `szerokosci`): szafki dopasowane po **maks. 900 mm** (dzielone na równe części).
- Lista `szerokosci` bez żadnego modułu w katalogu dla rzędu = błąd.
- Zawsze: suma szerokości modułów + luzy = długość wolnego odcinka.

Odpowiedź `WynikWypelnienia`: `{ podglad, moduly: (Modul & {rola})[], wolne: {odMM,doMM}[], zajete: Przedzial[], luzy: {odMM,doMM}[], ostrzezenia, zalozenia }`.
Pole `rola` przyjmuje wartości: `szafka | blenda | blendaNarozna | dopasowana | naroznik | zlew | zmywarka | plyta | lodowka | slupek | okap`.

## 2. Szybki układ I / L / U

`POST /api/projekty/:id/szybki-uklad` · MCP `szybki_uklad` · `api.szybkiUklad(id, ZadanieSzybkiegoUkladu)`

| Pole | Opis |
|---|---|
| `typ` | `"I"` (1 ściana), `"L"` (2), `"U"` (3) |
| `pomieszczenieId` | domyślnie pierwsze pomieszczenie |
| `scianyIds` | kolejne ściany układu. Domyślnie pierwsze nie-wirtualne ściany pomieszczenia |
| `dlugosciScianMM` | ustawia długości ścian. Brakujące ściany są tworzone. Ściany z CAD nie są zmieniane (zwracany jest błąd) |
| `wysokoscMM` | wysokość pomieszczenia, ustawiana na ścianach układu |
| `zlew` | `{ sciana?, xMM?, szerokoscMM? = 600 }`. `null` = bez zlewu. Szafka `base-sink-*` |
| `zmywarka` | `{ szerokoscMM?: 450\|600 = 600, strona?: "lewa"\|"prawa" = "prawa" }` obok zlewu. `null` = bez zmywarki |
| `plyta` | `{ sciana?, xMM?, szerokoscMM? = 600, piekarnikPod? = true }`. Szafka `base-oven-600`, a dla 800/900 lub bez piekarnika `base-drawers-*` |
| `lodowka` | `{ sciana?, xMM?, rodzaj?: "slupek"\|"wolnostojaca", szerokoscMM?, strona?: "poczatek"\|"koniec" }`. Słupek to `tall-refrigerator-600`. Lodówka wolnostojąca dostaje rezerwację wnęki bez szafki. `null` = bez lodówki |
| `slupki` | dodatkowe słupki z katalogu obok lodówki (np. `tall-oven-600`) |
| `wiszace` | domyślnie `true` |
| `okap` | `"szafka"` (`wall-hood-<szer. płyty>`) albo `"brak"` (przerwa nad płytą) |
| `naroznik` | `"slepa"` (domyślnie, `base-blind-corner-1100`, drzwi 450 od strony ciągu) albo `"L"` (`base-l-corner-900`). Na górze zawsze `wall-corner-600` |
| `dolne` | wypełnienie dolnych: `"drawers"` (domyślnie) albo `"shelves"` |
| `szerokosci`, `symetria` | jak w punkcie 1 |
| `przerwyWiszacych` | `[{ sciana, odMM, doMM }]`, np. okno. Przerwa spoza układu → ostrzeżenie; przerwa w narożniku → bez szafki narożnej wiszącej (ostrzeżenie) |
| `zastap` | **wymagane**, gdy na ścianach układu stoją moduły. Bez tej flagi silnik zwraca błąd i niczego nie zmienia |
| `podglad` | |

Geometria: narożnik leży na końcu ściany *i* i na początku ściany *i+1*. Kolejność ścian wynika z łańcucha 90° albo ze współrzędnych CAD. Silnik sprawdza, czy ściany się stykają i czy kolejna idzie w głąb pomieszczenia. Na ścianie *i+1* rezerwowany jest odcinek narożnika: dla szafki ślepej to korpus 560 + front, potem blenda 50; dla narożnika L to 900 mm.

Moduły **spoza układu** (np. szafka ślepa na sąsiedniej ścianie, której układ nie obejmuje): po usunięciu modułów układu silnik liczy zajętość każdej ściany (`zajeteNaScianie`). Zajętość przy końcu ściany skraca wolny odcinek (rezerwacja „Zajęte: …”) i dostaje blendę narożną 50 mm (bez blendy przy `lCorner`/`wallCorner`). Zajętość w środku ściany = błąd z prośbą o przesunięcie modułu.

Słupek lub lodówka przy drzwiach szafki ślepej (lodówka `strona: "koniec"` na ścianie z narożnikiem): blenda 50 mm i ostrzeżenie o możliwej kolizji frontu/uchwytu. Słupek = moduł katalogu `tall` albo wysokość ≥ 1800 mm.

`dlugosciScianMM` przy zamkniętym obrysie pomieszczenia (≥ 3 ściany, koniec ostatniej = początek pierwszej): ostrzeżenie, że rzut przestaje się domykać.

Domyślne rozmieszczenie, gdy nie podano `sciana` ani `xMM`:
- I: wszystko na ścianie 0;
- L: lodówka i zlew na 0, płyta na 1;
- U: lodówka 0, zlew 1, płyta 2.

Lodówka stoi przy początku ściany. Elementy z podanym `xMM` są stałe, a pozostałe trafiają do najdłuższego wolnego odcinka. Odstępy między elementami spełniają minima z założeń (niżej). Nadwyżka jest dzielona według wag (blat zlew–płyta ×2) i dociągana do sum pełnych szafek. Resztę przejmuje odcinek przy wolnym końcu ściany, gdzie stoi blenda.

Wiszące: wypełnienie `wall-shelves-*` od narożnika do narożnika. Rząd wiszący jest pomijany nad słupkami i nad lodówką wolnostojącą, a nad płytą stoi szafka okapowa.

Odpowiedź `WynikSzybkiegoUkladu`: `{ podglad, pomieszczenieId, sciany[], moduly: (Modul & {rola})[], rezerwacje: {scianaId, rzad, odMM, doMM, opis}[], usunieto, ostrzezenia[], zalozenia[] }`.
W rzędzie dolnym zawsze: suma modułów + suma rezerwacji (narożniki, zajętość spoza układu, wnęki, luzy) = długość ściany.

### Założenia ergonomii (nie normy)

Wartości są w `ZALOZENIA_UKLADU` w `src/core/uklad.ts` i wracają w każdej odpowiedzi w polu `zalozenia`. Zakład musi je potwierdzić.

| Założenie | Wartość | Przy braku miejsca |
|---|---|---|
| Blat między zlewem a płytą | ≥ 600 mm | zmniejszany jako ostatni, z ostrzeżeniem |
| Płyta od narożnika, końca ściany, słupka | ≥ 300 mm (wg Mateusza „~300”) | zmniejszany jako drugi |
| Blat odkładczy przy lodówce (przed zlewem) | ≥ 300 mm | zmniejszany jako pierwszy |
| Blenda narożna przy szafce prostopadłej | 50 mm | — |
| Blenda | 20–149 mm; < 20 mm luz; 150–299 mm cargo 150/200 albo szeroka blenda (decyzja koordynatora, do potwierdzenia przez Mateusza) | — |

Gdy odstęp trzeba zmniejszyć, odpowiedź zawiera ostrzeżenie (np. L 3000+2400 z lodówką i zmywarką 600: odstęp lodówka–zlew spada do 100 mm). Jeśli same elementy nie mieszczą się na ścianie, silnik zwraca błąd.

## 3. Pakiet stylu

`POST /api/projekty/:id/styl` · MCP `ustaw_styl` · `api.ustawStyl(id, d)`

`{ pomieszczenieId?, korpus?, front?, blat?, wyczyscWyjatkiModulow?, podglad? }`. Każde z pól `korpus`, `front` i `blat` przyjmuje jedną z dwóch form:
- `{ materialId }` — materiał z bazy;
- `{ dekor: "Egger:H1384 ST40", artykul?, gruboscMM?, szerokoscArkuszaMM?, wysokoscArkuszaMM?, glebokoscMM?, dlugoscMM?, struktura? }` — dekor z galerii (`GET /api/dekory`, pole `key`).

Reguły dla dekoru:
- **Korpus i front:** silnik szuka artykułu Egger (płyta) o grubości z ustawień (korpus `gruboscPlytyKorpusuMM`, front `gruboscFrontuMM`). Preferowany jest format 2800×2070, a przy innych formatach wybierany jest największy. Pole `alternatywy` podaje liczbę innych pasujących artykułów.
- **Blat:** artykuł Egger `PG_WORKTOPS` o grubości `gruboscBlatuMM` i głębokości ≥ `glebokoscBlatuMM`. Wybierany jest najpłytszy. Materiał ma typ `blatLaminowany` albo `blatKompaktowy` i jednostkę `metrBiezacy`.
- **Brak danych** (np. wszystkie dekory Kronospan, dekor Egger bez artykułu w tej grubości): dekor nie jest aktywowany. Silnik zwraca `braki: [{ rola, komunikat: "… wymaga wpisania grubości/formatu" }]`, a pozostałe role ustawia. Jawny wpis wymiarów przez użytkownika jest dozwolony: płyta potrzebuje kompletu grubość + format, blat grubość + głębokość + długość. Źródło wymiarów jest wtedy oznaczone jako „wpis użytkownika”.
- Nowy materiał jest dodawany do bazy z ceną 0 („Brak ceny zakupu”). Ponowne dodanie zwraca istniejący rekord, więc cena i zmiany użytkownika nie są nadpisywane. W wycenie płyta albo blat bez ceny dostaje cenę domyślną wariantu, a pozycja jest **oznaczona błędem** (`jestBledemWyceny`). Wcześniej blat bez ceny był po cichu zastępowany innym blatem z bazy.
- Moduły z własnym materiałem zachowują go, a silnik wypisuje ostrzeżenie. Opcja `wyczyscWyjatkiModulow: true` ujednolica materiał.

- Typ materiału musi pasować do roli: korpus — płyta laminowana / MDF / sklejka; front — także materiał typu `front`; blat — blat w mb. Niepasujący materiał trafia do `braki` i nie jest zapisywany.

Odpowiedź `WynikStylu`: `{ podglad, pomieszczenieId, ustawiono: {korpus?, front?, blat?}, zrodla[], aktywowane: Material[], braki[], ostrzezenia[], wyczyszczono }`.

Odczyt bieżącego stylu: `GET /api/projekty/:id/styl?pomieszczenieId=` · MCP `styl_pomieszczenia` · `api.stylPomieszczenia(id, pid?)` → `{ pomieszczenieId, korpus, front, blat, modulyZWlasnymMaterialem, okucia }`. Każda rola to `{ materialId, nazwa, typ, gruboscMM, dekor?, artykul?, zdjecieURL, maCene }`, gdzie `dekor` to klucz galerii, jeśli materiał z niej pochodzi.

Galeria `GET /api/dekory` ma flagę `maBlat` (dekor ma artykuł blatu roboczego Egger `PG_WORKTOPS`) do filtrowania galerii blatów.

## 4. Okucia projektu

- `GET /api/okucia-projektu/opcje` · MCP `opcje_okuc_projektu` · `api.opcjeOkucProjektu()` zwraca `{ systemySzuflad, zawiasy, podnosniki, profileSzuflad, profilDomyslny }`. Pozycje pochodzą z bazy okuć i mają pole `maCene`.
- `PUT /api/projekty/:id/okucia` z `{ okucia: OkuciaProjektu | null }` · MCP `ustaw_okucia_projektu` · `api.ustawOkuciaProjektu(id, okucia)`.

`Projekt.okucia?: { systemSzuflad?, zawiasy?, podnosniki?, profilSzuflad? }` to opcjonalne pole JSON, bez migracji.
- `systemSzuflad`, `zawiasy`, `podnosniki` to `Okucie.id`. Typ jest sprawdzany: system szuflad może być typu `systemSzuflad` albo `prowadnica`.
- `profilSzuflad` to id z `reguly-szuflad.json`. Zastępuje profil z ustawień technologii w konstrukcji i dokumentacji. Moduły z własnym `konfiguracja.profilSzuflad` zachowują swój profil, a szuflady z płyty profilu nie używają.
- Wycena (`dobierzOkucia`) używa wybranej pozycji **we wszystkich wariantach** zamiast doboru wariantem. Gdy pozycji brakuje, jest nieaktywna albo nie ma ceny, wycena zawiera pozycję z ceną 0 i `jestBledemWyceny: true`. Ceny zastępczej nie ma. Pozostałe okucia nadal dobiera wariant.
- Cena uzgodniona (`cenaUzgodnionaBrutto`) jest nienaruszona (test w `szybki-projekt.test.ts`).
- **Oferta PDF** (`POST /api/projekty/:id/oferta.pdf`) jest blokowana (HTTP 400), gdy wybrany wariant ma pozycje `jestBledemWyceny` (okucie lub materiał bez ceny albo bez rekordu). Komunikat wymienia nazwy pozycji bez wewnętrznych id — klient nie dostanie oferty z ceną zastępczą.

## Jawne braki danych

- Kronospan (236 dekorów): brak grubości i formatów w danych. Pakiet stylu wymaga dla nich wpisu użytkownika.
- Blaty z galerii są dostępne tylko dla dekorów Egger z artykułem `PG_WORKTOPS` (82 klucze dekorów w danych artykułów). Wszystkie mają cenę 0 do uzupełnienia w cenniku.
- Katalog modułów zawiera tylko szafkę piekarnikową 600, lodówkę w słupku 600, okapy 600/800/900, narożnik wiszący 600 i ślepe 900/1000/1100. Innych wariantów silnik nie wymyśla, tylko wypisuje ostrzeżenie.
- Odstępy ergonomiczne, blenda narożna 50 mm i drzwi szafki ślepej 450 mm (pod LeMans) to założenia robocze.
- Mapowanie systemu szuflad z bazy okuć (np. `blum.legrabox.pure`) na profil konstrukcyjny (`blum-legrabox-m-wood`) nie jest automatyczne. Bez `profilSzuflad` silnik wypisuje ostrzeżenie.

## Do zrobienia w UI (część zrobiona w dc3aa5c)

- Kreator „szybki układ”: typ I/L/U, długości i wysokość, punkty stałe (zlew, płyta, lodówka, zmywarka), narożnik, `podglad` → akceptacja. Przy istniejących modułach potwierdzenie `zastap`.
- Przycisk „wypełnij całą ścianę” (dolne / wiszące) przy ścianie w Designerze.
- Pakiet stylu z galerii (`DecorCatalog`) dla korpusu, frontów i blatu w jednym oknie. Pokazywanie `braki` z polami do wpisania grubości i formatu.
- Wybór okuć projektu (z `opcjeOkucProjektu`) przy wycenie. Wyróżnianie pozycji `jestBledemWyceny`.
