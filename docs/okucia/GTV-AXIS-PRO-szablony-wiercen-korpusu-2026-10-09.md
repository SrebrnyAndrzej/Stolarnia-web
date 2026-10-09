# GTV Axis Pro — dwa szablony montażowe i różne układy otworów

Sprawdzenie źródeł producenta: 09.10.2026. Zakres: dobór przyrządu do ręcznego znakowania pozycji prowadnic w korpusie na podstawie układu frontów. Nie opisuje wierceń skrzynki szuflady ani programu CNC.

## Fakty z materiałów GTV

GTV udostępnia dwa różne przyrządy:

| Przyrząd | Zakres jawnie podany przez GTV | Zestawy frontów i serie otworów podane przez GTV |
|---|---|---|
| `PB-SZABLON-AXIS-MB` | Instrukcja producenta dotyczy Axis Pro i Modern Box; produktowa strona EN wymienia także Modern Box Pro | `2×284 + 140 mm` → serie `1, 3, 5`; `5×140 mm` → serie `1, 2, 3, 4, 5` |
| `PB-SZABLON-AXIS-MBPRO` | Strona produktu GTV deklaruje Axis Pro i Modern Box Pro | `2×284 + 140 mm` → `1, 3, 6`; `5×140 mm` → `1, 2, 3, 5, 6`; `1×284 + 3×140 mm` → `1, 3, 5, 6`; `2×356 mm` → `1, 4` |

Źródła: oficjalna [instrukcja PB-SZABLON-AXIS-MB (PDF)](https://api2.gtv.com.pl/pimcore/assets/attachments/instrukcja/PB-SZABLON-AXIS-MB%20Szablon%20monta%C5%BCowy%20do%20szuflad%20-%20instrukcja_1.pdf), produkt GTV [PB-SZABLON-AXIS-MB](https://gtv.com.pl/en/produkt/PB-SZABLON-AXIS-MB/), produkt [PB-SZABLON-AXIS-MBPRO](https://gtv.com.pl/produkt/PB-SZABLON-AXIS-MBPRO/), oraz bieżąca karta GTV [Axis Pro 18 mm, PB-AXISPRO18-KPL500C1](https://gtv.com.pl/produkt/PB-AXISPRO18-KPL500C1/) wymieniająca `PB-SZABLON-AXIS-MB` jako pomoc montażową.

Instrukcja podstawowego MB przedstawia szablon o długości 720 mm i opisuje położenia zależne od długości prowadnicy, m.in. 128 mm dla L=300/350, 192 mm dla L=400 i 224 mm dla L=450/500/550. Zawiera przypis `NF` jako nałożenie frontu na bok 16 mm. Są to elementy instrukcji użycia przyrządu i układu frontów; same wartości nie stanowią pełnej karty wierceń, tolerancji ani postprocesora CNC.

## Problem i proponowane zachowanie

**Problem:** dwa przyrządy o podobnej nazwie mają różne serie otworów dla dwóch tych samych układów frontów. Nazwa Axis Pro nie wybiera przyrządu, serii ani sposobu ustawienia. Dodatkowo produkt Axis Pro 18 mm wskazuje przyrząd podstawowy, ale oznaczenie 18 mm dotyczy szuflady/płyty, a nie potwierdzenia wymiarów ustawienia przyrządu dla dowolnej nakładki frontu.

**Zalecenie:** przechowywać `templateSku`, dokładny układ frontów, nominalną długość prowadnicy i wariant nałożenia jako oddzielne wejścia do instrukcji montażowej. Dla brakującej kombinacji pokazywać „nieustalone” zamiast dobierać przyrząd po podobieństwie nazwy. Jeżeli firma chce generować własne współrzędne wierceń, oprzeć je na zweryfikowanym rysunku i własnej próbie; nie przepisywać mechanicznie numerów serii z przyrządu do CNC.

**Priorytet:** P1 dla konfiguratora i instrukcji montażu; P0 przed wydaniem layoutu korpusu lub wierceń, jeśli aplikacja obecnie utożsamia oba przyrządy albo generuje pozycje z numerów serii.

**Zależności:** dokładny kod przyrządu, SKU/tryb prowadnicy, długość NL, układ i wysokości frontów, nałożenie/położenie frontu oraz potwierdzenie czy używany przyrząd jest faktycznie MB czy MBPRO.

**Mierzalne kryteria odbioru:** testy rozróżniają oba SKU; dla `2×284+140` wynik serii podstawowej to `1,3,5`, a MBPRO `1,3,6`; dla `5×140` podstawowy to `1–5`, a MBPRO `1,2,3,5,6`. Brak SKU przyrządu lub nierozpoznany układ nie zwraca wzoru. Test eksportu potwierdza, że same serie szablonu nie otrzymują statusu operacji CNC z Ø/głębokością/tolerancją.

## Niezgodność zakresu między kartą i instrukcją — wymaga potwierdzenia

Strona produktu GTV dla `PB-SZABLON-AXIS-MB` w języku EN deklaruje kompatybilność z Axis Pro, Modern Box Pro i Modern Box. Otwarta instrukcja producenta nosi tytuł „Szablon do szuflad Axis Pro i Modern Box” i pokazuje serie tylko dla Axis Pro oraz Modern Box. Równocześnie osobna karta `PB-SZABLON-AXIS-MBPRO` podaje własne, odmienne serie dla układów frontów. Są to rozbieżne deklaracje zakresu, a nie dowód, że warianty MB i MBPRO można zastępować.

Karta produktu Axis Pro 18 mm (`PB-AXISPRO18-KPL500C1`) wymienia jako pomoc `PB-SZABLON-AXIS-MB`, ale nie zawiera wymiarowego potwierdzenia dla nakładania frontu, dokładnego profilu 18 mm ani wiercenia CNC. **Nie łączyć** tego SKU przyrządu z listą serii MBPRO tylko dlatego, że produktowa strona podstawowego szablonu wspomina Modern Box Pro. Kryterium przed wdrożeniem reguły: GTV potwierdza pisemnie, której rewizji przyrządu dotyczy instrukcja oraz czy MB-profil produktu obejmuje MBPRO; do tego czasu niekompletne przecięcia pozostają `unknown`.

## Granice dowodu

Różne serie są podane na aktualnych stronach produktów GTV, a wymiary podstawowego przyrządu w jego instrukcji PDF. Nie sprawdzono fizycznych egzemplarzy przyrządów, warunków zgodności Basic/MBPRO z każdym SKU szuflady, ani rzeczywistej bazy i tolerancji na konkretnych korpusach. Deklaracja Modern Box Pro na karcie `MB` nie została uzgodniona z zakresem instrukcji ani odrębną kartą `MBPRO`. Tekst instrukcji wspomina fronty/nałożenie 16 mm; nie należy automatycznie stosować tego ustawienia do każdej grubości lub konstrukcji frontu. Zapis nie zatwierdza wierceń seryjnych.

## Punkt wznowienia

Na świeżym `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3` nie było nowych commitów Claude. Ta nota uzupełnia otwarty temat GTV o producentowskie, różne mapowania dwóch przyrządów, nie domyka profilu CNC Axis Pro 18 mm. Następnie pozyskać i zweryfikować właściwą instrukcję cięcia/wierceń dla dokładnego SKU 18 mm albo potwierdzić osobno mocowanie pleców GTV; przed wydaniem danych obróbkowych wykonać próbę z tym samym szablonem, frontem, NL i korpusem, które zapisano w projekcie.
