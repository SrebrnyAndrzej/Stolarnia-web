# AMIX Elite Box wewnętrzna — części i częściowo zweryfikowane wiercenia

Odczyt wizualny 03.10.2026. Źródło lokalne `docs/okucia/pdf/AMIX-Elite-Box-wewnetrzne.pdf`, strona 2/3. Rejestr w `docs/okucia/sources.json`: pobrano 23.09.2026; SHA-256 `2f45a550286fcfaaaa730c0966deb6b862aa444334f572cdb7694eefac91baee`. Instrukcja producenta Amix, zawiera warianty montażu i rozkrój. Nie oznacza to aktualnego potwierdzenia dostępności każdego zestawu.

## Potwierdzone odczyty strony 2

- Grubość materiału podana na stronie: 18 mm.
- Dla szuflady wewnętrznej: LT = NL + 16. Rysunek standardowy na tej samej stronie pokazuje LT = NL + 5. Rozróżniać wariant; nie współdzielić automatycznie wartości między profilami.
- Dno: szerokość LW − 75; długość L = NL − 26. Plecy: szerokość LW − 87. Różne elementy nie mają tej samej szerokości.
- Wewnętrzny front: długość L2 = LW − 37; instrukcja pokazuje dwie wersje oznaczone 05B.023-J (19 mm) i 05B.023-FB (18 mm). Nie utożsamiać wymiaru L2 z pełną szerokością widocznego frontu szafki.
- Przekrój montażowy podaje min. 50 przy przednim mocowaniu/wymiarze szuflady wewnętrznej oraz min. 33 dla prześwitu/pozycji wskazanej na rysunku. Wymiary mają różne linie bazowe; przed użyciem wymagają mapowania do lokalnej osi części.
- Front wewnętrzny H84 i H116: para otworów z pionowym rozstawem 32 mm, dolny otwór co najmniej 49,5 mm od dolnej krawędzi według rysunku. H167/H199: rysunek pokazuje od dołu 49,5; następnie 32; 64; 32 mm wzdłuż pionowej sekwencji otworów. Są to minimalne wartości rysunku, nie potwierdzone nominalne punkty wiercenia do CNC.
- Dno ma oddzielny rysunek: szerokość LW−75, długość L; wymiar 8,8 od zaznaczonej krawędzi, 5 przy końcowym otworze, rozstaw/podział 100 i 16 w zaznaczonym obszarze. Tabela podaje L1=0 dla NL 250/270/300 oraz L1=95 dla NL 350–550. Pozycje 8,8 / 5 / 100 / 16 i L1 opisują różne bazy na rysunku; nie sumować ich bez przepisania geometrii.
- Konfiguracja H84 + reling kwadratowy ma osobny rysunek. Synchronizator push-open pokazano tylko dla modeli push-open; rysunek oznacza długość LW−117 i zakaz przycinania/łączenia w sposób sugerowany symbolem przekreślenia — dokładny zakres symbolu potwierdzić w wysokiej rozdzielczości przed regułą.

## Kontrola stron 1 i 3 — układ zestawu wewnętrznego (09.10.2026)

Ponownie obejrzałem wizualnie strony 1 i 3 z lokalnego PDF (pobrany 23.09.2026; hash pozostaje w `sources.json`). Na stronie 1 rysunek wymiarów montażowych pokazuje zmienny układ graficznych grup mocowań według długości: w przedstawionych przykładach 250–350 mm widać dwie grupy, a przy 400–550 mm trzy. Schemat nie etykietuje tych grup numerami części 14–17, więc ich rodzaj trzeba potwierdzić przed przypisaniem do BOM. Łańcuch wymiarów ma kilka baz i odsadzeń; nie przepisuję go jako współrzędnych wiercenia, dopóki każda linia nie zostanie przypisana do krawędzi bazowej oraz właściwego elementu.

Ta sama strona numeruje elementy mocowania frontu według wysokości: 14=H84, 15=H116, 16=H167, 17=H199. To są numery pozycji na schemacie producenta, a nie potwierdzone indeksy zamówieniowe. Potwierdza to potrzebę rozdzielenia BOM co najmniej po długości nominalnej i wysokości frontu; sam wariant „Amix Elite Box wewnętrzna” nie determinuje liczby ani położenia wszystkich elementów. Strona 3 ilustruje oddzielne instrukcje montażu frontu standardowego i wewnętrznego oraz montaż/demontaż prowadnicy; nie dostarcza sama pełnej średnicy, głębokości ani tolerancji wierceń.

**Rekomendacja dla Claude — P0 przed BOM/CNC:** utrzymywać odrębne, źródłowo przypisane pozycje zestawu dla exact NL oraz H frontu; numerów 14–17 nie przedstawiać jako SKU. Kryterium odbioru: porównanie konfiguracji NL350 i NL400 wykazuje rozbieżny układ/ilość elementów dokładnie jak na rysunku, H84/H116/H167/H199 wybiera właściwą pozycję mocowania, a nieznany zakupowy SKU, baza lub parametr otworu pozostaje jawnie `unknown` i blokuje eksport CNC. Zależności: mapowanie symboli rysunku do listy części, identyfikatory SKU z dostawcy Amix oraz zakładowa próba montażowa.

## Czego źródło nie potwierdza w odczycie tekstowym

W rysunku strony 2 widoczne są punkty mocowania dna, frontu i mocowań tylnych, ale sam rysunek/ekstrakcja nie daje tutaj bezpiecznej, jednoznacznej specyfikacji średnicy i głębokości każdego otworu, pełnego poziomego położenia wszystkich punktów na froncie ani tolerancji. Nie kodować maksimów/minimów jako osi nominalnych. Otwory pokazane na schemacie złożenia i wkręty/łączniki ze stron montażowych należy powiązać z właściwym SKU. Wykonać kontrolowany odczyt całych stron 1–3, powiększonych rysunków i kompatybilnej listy elementów; jeśli średnica lub głębokość nie występuje w dokumentacji, profil produkcyjny pozostaje niekompletny do czasu zatwierdzonej technologii zakładu.

## Konkretne zalecenia dla Claude

| Priorytet | Problem / dowód | Zachowanie | Zależność | Kryterium odbioru |
|---|---|---|---|---|
| P0 | Standard i wewnętrzna mają różny LT: NL+5 kontra NL+16 | Wymiar jest właściwością wariantu profilu | Wybrana rodzina i wariant | Test dla tej samej NL daje rozdzielne LT: 516 i 505 przy NL500; pomiar korpusu potwierdza właściwy zakres każdego rysunku |
| P0 | Dno, plecy i wewnętrzny front mają trzy różne wzory | Każda część zachowuje osobną bazę i SKU | Rzeczywiste LW, NL, grubość płyty, wersja 18/19 | Dla LW564/NL500: dno 489×474, plecy 477×H, panel frontowy 527; żadna szerokość nie jest podstawiana innej części |
| P0 przed CNC | Front ma minima i pionowe rozstawy, nie pełny zweryfikowany drill map | Oznaczyć mapę otworów jako częściową; zatrzymać CNC przy brakującej osi/średnicy/głębokości/tolerancji | Kontrola rysunku i kod łącznika | H84/H116 pokazują 2 pozycje, H167/H199 po 4; bez kompletnych współrzędnych 3D/rysunek nie emituje gotowych wierceń |
| P0 przed CNC | Dno ma zależność L1 od NL | Zachować tabelę jako wymiar wariantowy, nie liniową interpolację | Dokładne NL i mapa współrzędnych | Granice NL300→350 zmieniają L1 z 0 na 95; wartości dla NL spoza tabeli nie są zgadywane |
| P1 | Wariant z relingiem i push-open ma dodatkowe części/ograniczenia | Odrębne BOM, geometria i oznaczenie konfiguracji | SKU relingu/synchronizatora i stron 1–3 | Zmiana push-open↔domyk aktualizuje BOM i ostrzeżenia; brak katalogowej zgodności blokuje automatyczny dobór |

Przykład wymiarów powyżej zakłada LW564 jako wejściowe światło po uwzględnieniu boków; H pleców zależy od wybranej wysokości. Przykład nie zatwierdza wierceń ani wyceny. Kryteria są briefem dla implementacji Claude, nie działającymi testami aplikacji.

## Punkt wznowienia

Baza origin/main na wejściu 270ecf8, bez nowych commitów Claude. Ta rewizja dodaje ręcznie zweryfikowany odczyt wymiarów Amix Elite Box wewnętrznej, ale nie komplet produkcyjnego drill-map. Następnie pozyskać/odczytać rysunek mocowań GTV Axis Pro i Modern Box z rozdzieleniem wariantów, po czym wrócić do pełnych otworów Blum. Nie zmieniono aplikacji, cen ani umów.

## Uzupełnienie 2026-10-10: identyfikacja zakupowa mocowań frontu

W bieżących publicznych kartach producenta AMIX dla mocowań frontu wewnętrznego Elite Box producent publikuje wysokość i EAN. Wartości widoczne podczas weryfikacji 2026-10-10:

| Wysokość z karty | EAN pokazany przez AMIX | Strona producenta | Co pozostaje niepotwierdzone |
|---:|---|---|---|
| H84 | `5904208179924` | [AMIX, mocowanie H84](https://amix.pl/pl/elite-box/2286-elite-mocowanie-frontu-do-szuflady-wew-h-84-mm) | brak producentowego indeksu artykułu; powiązanie EAN z wybranym kolorem na selektorze |
| H116 | `5904208179870` | [AMIX, mocowanie H116](https://amix.pl/en/elite-box/2287-elite-mocowanie-frontu-do-szuflady-wewnetrznej-h-116-mm) | brak producentowego indeksu artykułu; powiązanie EAN z wybranym kolorem na selektorze |
| H167 | `5904208179894` | [AMIX, mocowanie H167](https://amix.pl/en/elite-box/2288-elite-mocowanie-frontu-do-szuflady-wew-h-167-mm) | brak producentowego indeksu artykułu; powiązanie EAN z wybranym kolorem na selektorze |
| H199 | `5904208179917` | [AMIX, mocowanie H199](https://amix.pl/en/elite-box/2289-elite-mocowanie-frontu-do-szuflady-wew-h-199-mm) | brak producentowego indeksu artykułu; powiązanie EAN z wybranym kolorem na selektorze |

Karty AMIX pokazują wybór koloru obok jednego widocznego pola EAN. Publiczny widok nie wyjaśnia, czy ten EAN jest przypisany do wariantu domyślnego, czy zmienia się po wyborze koloru; dlatego nie przypisuję go do białego/antracytowego wariantu bez sprawdzenia konkretnej opcji zamówienia lub etykiety towaru. Bezpośrednia karta H84 została otwarta z odnośnika produktu na liście AMIX i publikuje EAN `5904208179924`.

Zewnętrzna karta detalisty dla produktu opisanego jako H199 pokazuje jednocześnie symbol `ELITE-167/ANTR-1` ([strona detalisty](https://www.wyposazeniemebli.pl/Mocowanie-H-199mm-frontu-wewnetrznego-ELITE-BOX-Antracyt-p7043)); jest to konflikt opisu i symbolu sprzedawcy, nie korekta danych producenta. Nie używać symbolu sprzedawcy jako potwierdzonego indeksu AMIX.

**Rekomendacja dla Claude — P1, część zakupowa BOM:** rozdzielić numer pozycji z rysunku (14–17), wysokość, EAN z konkretnej karty, producentowy SKU (jeśli producent go publikuje), kolor oraz status potwierdzenia zamawianego wariantu. W modelu nie wymuszać jednego pola `sku`: EAN nie zastępuje indeksu ani potwierdzenia koloru. Utrzymać oddzielne identyfikatory wysokościowe; nie mapować h199 do symbolu `167` z karty detalisty.

**Zależności:** exact kolor zamawianego mocowania, potwierdzenie EAN na stronie zamówienia/etykiecie opakowania i ustalenie, czy AMIX udostępnia osobny indeks artykułu. **Kryteria odbioru:** (1) H84/H116/H167/H199 zachowują cztery różne EAN-y przypisane do źródłowych kart i ich rewizji; (2) zmiana wysokości/koloru nie dziedziczy identyfikatora innego wariantu; (3) niekompletny kolor lub SKU blokuje zakupowy BOM jako pozycję zamówieniową, ale nie zmienia geometrii ani nie zwalnia CNC; (4) rozbieżny kod sprzedawcy pozostaje konfliktem źródła, dopóki producent lub etykieta towaru go nie rozstrzygnie. Te dane dotyczą identyfikacji części do zakupu, nie pełnej listy zestawu ani mapy wierceń.
