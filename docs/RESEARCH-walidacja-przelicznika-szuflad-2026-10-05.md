# Walidacja wejść i dobór długości w kalkulatorze szuflad

Data: 2026-10-05
Baza kodu: `5705505b23033012ef14b7aef3addc8765f9a893` (`origin/main`)
Zakres: statyczny przegląd `src/core/catalog/drawers.ts`, `src/service.ts`, `src/server/app.ts`, konstruktorów i testów. Uruchomiono `npx tsx --test src/przelicznik-szuflad.test.ts src/technologia.test.ts`: 15/15 testów przeszło.

## Ustalenia

1. Wszystkie sześć profili w `docs/okucia/reguly-szuflad.json` ma `production_approved: false`, `drilling_status: not_normalized` i `allowed_nominal_lengths_status: not_normalized`. Test `T07` potwierdza, że brak pełnych wierceń ustawia `gotowaDoProdukcji` na `false`. To ważna blokada bezpieczeństwa: poniższe uwagi dotyczą wyników kalkulatora, części i widoku roboczego; nie stwierdzają, że niezatwierdzone profile mogą być zwolnione do CNC.
2. `dobierzNL()` używa wspólnej listy długości `[270, 300, 350, 400, 450, 500, 550, 600, 650]` dla każdej rodziny. Sama funkcja nie przyjmuje profilu. Długości producenta są tymczasem zależne od rodziny i konkretnego wariantu; np. zapisana instrukcja GTV Axis Pro P2O podaje zakres 250–600, a tabela TANDEMBOX antaro M ma własny zestaw 270–650, z różnym zakresem zależnym od nośności. W repo istnieje jawny status „nieznormalizowane”, więc wspólny typoszereg nie powinien być interpretowany jako zatwierdzony zakres producenta.
3. `wymiarySzuflady()` dla jawnie podanego `wariantJawny` wyszukuje wariant. Gdy go nie znajdzie, kontynuuje dobór z wysokości frontu (a bez wysokości — wybiera najwyższy profil) i zwraca wymiary. `przeliczSzuflade()` dopisuje ostrzeżenie, ale nadal zwraca wynik liczbowy. Testy pokrywają ostrzeżenie dla `wariant: "Z"`, nie asercję, że jawnie błędny wybór nie może zasilać produkcyjnego snapshotu.
4. `przelicznikSzuflad()` w serwisie odrzuca brak/niepoprawne `LW`, ale `NL` sprawdza przez `if (!NL)`. Wartość ujemna jest prawdziwa logicznie i przechodzi; dodatnia, lecz nieskończona również. Konkretna długość jest przyjmowana bez walidacji względem wybranej rodziny. Trasa GET zamienia parametry tekstowe na `Number` i rzutuje typ ścianki tylnej, lecz nie stosuje schematu wejściowego. Przykładowo nieznany tekst `sciankaTylna` nie jest równy `"stalowa"`, więc wynik zachowuje się jak dla drewna bez informacji o błędnej wartości.
5. Poprawne wymiary dla `LW=564`, `NL=500` i znormalizowane przykłady są testowane. Brak testów dla ujemnej/nieskończonej NL, NL spoza zakresu rodziny, błędnego typu ścianki oraz blokady jawnie nieobsługiwanego wariantu. 15 testów przechodzi, ale nie obejmuje tych granic.

## Zalecenia dla Claude

| Priorytet | Problem / dowód | Proponowane zachowanie | Zależności | Mierzalny odbiór |
|---|---|---|---|---|
| P0 przed użyciem wartości do zakupu/produkcji | `NL` nie jest weryfikowane jako skończona, dodatnia liczba; `LW` ma taką kontrolę | Walidować jednostki i zakresy przed obliczeniami; odrzucać NaN, ±Infinity, zero i wartości ujemne | Schemat wejściowy wspólny dla REST/MCP/serwisu | Testy dla `NL=-1`, `0`, `Infinity`, `NaN` zwracają błąd; żaden wynik nie zawiera wymiaru ujemnego/nieskończonego |
| P0 przed automatycznym doborem | Globalna lista NL nie jest profilem producenta; status zakresów dla wszystkich kandydatów jest `not_normalized` | Zakres długości wiązać z exact profile/SKU, nośnością i funkcją otwierania; nie wybierać długości spoza źródła. Przy niekompletnych danych pokazać brak wyboru i blokadę produkcyjną zamiast wnioskować z ogólnego typoszeregu | Znormalizowane oficjalne tabele dla każdej rodziny/wariantu; rozdzielenie nośności i push/soft-close | Dla każdej rodziny testy granic: najmniejsza/największa udokumentowana NL przechodzi, sąsiednia spoza tabeli jest odrzucona; brak danych nie wybiera profilu |
| P0 dla jawnego wyboru | Nieznany `wariant` daje zastępcze wymiary i tylko ostrzeżenie | Gdy użytkownik podał wariant, albo dokładnie go użyć, albo zwrócić błąd walidacji; automatyczny dobór pozostawić tylko dla braku jawnego wyboru i pokazać wybrany wariant | Kontrakt UI/API; każdy wariant powiązany ze źródłem | Żądanie z nieistniejącym wariantem nie zwraca wymiarów części ani eksportu; dobór automatyczny zwraca uzasadnienie i identyfikator wariantu |
| P0 | Nieznany `sciankaTylna` jest interpretowany jak drewniana | Walidować enum wejściowy. Gdy rodzaj nie jest wspierany przez profil, odrzucać lub zwracać jawny status `unknown`; nie podstawiać innej geometrii | Schemat wejściowy, model części w profilu | Wartości `stalowa`, `drewniana` dają jawne odrębne obliczenia; `metalowa`, pusty bądź obcy wariant nie zwracają gotowych wymiarów |
| P1 | Przykładowe wyniki robocze mogą być odczytane jako zatwierdzenie | Każdy wynik przenosi status danych i przyczynę blokady do 3D, BOM, PDF i API/MCP; niekompletny profil pozostaje poglądowy | Wspólny status źródła i walidacji wydania | Dla sześciu aktualnych profili zero dokumentów oznaczonych jako gotowe do produkcji; test obejmuje eksport i status wydania |

## Minimalny zestaw testów kontraktowych

- Walidacja numeryczna tych samych wejść przez HTTP GET, MCP i bezpośrednią metodę serwisu; metody nie mogą różnić się pod względem dopuszczonych wartości.
- Każdy profil: LW/NL graniczne, wariant wspierany, wariant jawnie błędny, brak wariantu, typ pleców wspierany i niewspierany.
- Wymiary wynikowe są skończone i dodatnie, a każda wartość ma profil, grubość, źródło/stronę i status zatwierdzenia.
- Niezatwierdzony lub niekompletny profil może służyć do podglądu z ostrzeżeniem, ale nigdy do utworzenia gotowego wydania produkcyjnego.
- Dokładna długość NL dobiera się wyłącznie po tabeli właściwej dla profilu; nie interpolować luk ani nie korzystać z długości należącej do innego systemu.

## Ograniczenia i źródła

To przegląd logiki wejściowej i testów repozytorium, nie błąd zgłoszony z produkcji. Istniejący bezpiecznik `production_approved=false` oraz diagnostyka wierceń ograniczają gotowość do produkcji; pozostawić je aktywne, dopóki dokumenty i profile nie zostaną zatwierdzone. Nie wprowadzono nowych wymiarów okuć.

- Repozytorium: `src/core/catalog/drawers.ts` (`dobierzNL`, `wymiarySzuflady`, `przeliczSzuflade`), `src/service.ts` (`przelicznikSzuflad`), `src/server/app.ts` (konwersja parametrów query), `src/przelicznik-szuflad.test.ts`, `src/technologia.test.ts`.
- Dane producentów: `docs/okucia/reguly-szuflad.json`, `docs/okucia/AMIX-Elite-Box-wewnetrzne-wiercenia-2026-10-03.md`, `docs/okucia/GTV-Modern-Box-PRO-wiercenia-2026-10-04.md`, `docs/okucia/GTV-Axis-Pro-P2O-wiercenia-2026-10-04.md`, `docs/okucia/BLUM-TANDEMBOX-antaro-M-plecy-i-prowadnice-2026-10-04.md`.

Nie zmieniano kodu, wymiarów danych producentów, ceny Pieszczyńskich ani historycznych umów.
