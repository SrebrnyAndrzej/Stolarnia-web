# Wycena: podstawa narzutu, docelowa marża i koszt rzeczywisty zlecenia

Data: 06.10.2026. Autor: Codex. Baza: `8d39dcdd06c40b09de742c034d8898414b4ccd75f` (`origin/main`). Zakres: wymagania i kryteria dla Claude, bez zmian logiki wyceny, ustawień, cen ani umów. Nie jest to porada księgowa/podatkowa ani decyzja o przyjętej polityce cenowej firmy.

## Problem i dowody w repozytorium

- `src/core/pricing.ts` liczy kolejno `kosztBazowy`, zapas procentowy, narzut procentowy od kosztu powiększonego o zapas, a następnie `marza = baza * marzaProcent / 100`; dopiero suma tworzy cenę netto. Ustawienie domyślne to `narzutProcent: 10`, `zapasKosztowyProcent: 5`, `marzaProcent: 25`.
- UI etykietuje parametr jako „Marża [%]” (`web/src/views/Settings.tsx`), a wynik jako „Marża” (`web/src/views/Quote.tsx`). Matematycznie procent jest naliczany od bazy kosztowej, czyli zachowuje się jak narzut (markup) na koszt, a nie jako procent ceny sprzedaży.
- `Projekt.cenaUzgodnionaBrutto` jest oddzielona od wyceny bieżącej, a testy chronią ją przed zmianą kosztów. To zachowanie trzeba zachować.
- Brief magazynowy już proponuje odrębne zapisy zakupu, ruchu i rzeczywistego zużycia. W repo nie znaleziono jeszcze historii faktycznych kosztów przypisanych do zamkniętego projektu ani godzin rzeczywistych. To wynik statycznego przeglądu wskazanych modułów; nie sprawdzono księgowości poza aplikacją.

## Potwierdzone rozróżnienie pojęć

ACCA opisuje narzut jako kwotę/procent dodawany do kosztu, natomiast target costing odwraca kalkulację: od ceny docelowej odejmuje się wymagany zysk, by otrzymać dopuszczalny koszt. ACCA zwraca też uwagę, że cost-plus nie uwzględnia automatycznie gotowości klienta do zapłaty ani zachowania konkurencji. Źródła: [ACCA, Pricing 2: Practical aspects](https://www.accaglobal.com/gb/en/student/exam-support-resources/fundamentals-exams-study-resources/f5/technical-articles/pricing-2.html), [ACCA, Target costing and life-cycle costing](https://www.accaglobal.com/uk/en/student/exam-support-resources/fundamentals-exams-study-resources/f5/technical-articles/target-lifestyle.html).

**Przykład matematyczny — nie rekomendowana cena:** przy bazie po zapasie i narzucie 11 550 zł oraz obecnym parametrze 25%, kod dodaje 2 887,50 zł i otrzymuje cenę netto 14 437,50 zł. Dodatkowa kwota to dokładnie 20% tej ceny netto. Gdyby intencją była marża kalkulacyjna stanowiąca 25% ceny netto, cena wyniosłaby `11 550 / (1 − 0,25) = 15 400 zł`. Rozbieżność wynika z mianownika procentu, nie z podatku VAT.

## Zalecane zachowanie

**P1 — przed rozszerzaniem cenników i raportów właściciela.** Właściciel powinien najpierw wybrać znaczenie ustawienia:

1. **Narzut od bazy kosztowej:** cena = baza × (1 + procent). UI nazywa pole „Narzut na koszt [%]” i wyświetla podstawę procentu.
2. **Docelowa marża kalkulacyjna w cenie netto:** cena = baza / (1 − procent), dla 0–<100%. UI wyjaśnia, że to procent kalkulowanej ceny netto przed VAT, względem jawnie pokazanej bazy kosztowej. Nie sugerować, że jest to księgowy zysk netto lub pełna rentowność firmy, jeśli koszty okresowe i inne pozycje nie są ujęte w bazie.

Nie zmieniać po cichu znaczenia istniejącego `marzaProcent`, jego wartości ani zapisanych cen. Migracja wymaga nowej nazwy/wariantu ustawienia i podglądu skutku dla kilku przykładowych kosztów; istniejąca wartość 25% nie pozwala wywnioskować intencji właściciela. `cenaUzgodnionaBrutto`, zapisane oferty/umowy oraz historyczne umowy pozostają niezmienione.

**Oddzielić prognozę od wyniku po wykonaniu:** kalkulacja przed produkcją jest estymatą. Po zamknięciu zlecenia raport może porównać bazowy snapshot wyceny z udokumentowanymi faktycznymi zakupami/zużyciem, roboczogodzinami, montażem, transportem, poprawkami i odpadem. Każda rzeczywista pozycja ma źródło i stan potwierdzenia. Brak zapisu oznacza **nieznane**, nie zero; częściowo potwierdzony koszt ma pokazywać kompletność i pozostałe braki. Odchylenia pokazywać osobno jako zmianę ceny zakupu, ilości/zużycia i czasu, ale nie przypisywać winy pracownikowi automatycznie.

Raport wyniku powinien rozróżniać: cenę zaakceptowaną netto/brutto i VAT, bazę szacunkową, planowany narzut/zysk kalkulacyjny oraz koszty rzeczywiste do tej pory/na zamknięciu. Księgowe rozpoznanie przychodu, kosztów, VAT lub wyniku podatkowego pozostaje poza zakresem; wartości z raportu projektu nie stają się automatycznie księgowymi zapisami.

## Priorytet, zależności i niepewności

- **P1:** ustalić semantykę ustawienia `marzaProcent`, bo obecna nazwa i mianownik pozwalają właścicielowi błędnie odczytać docelowy udział procentowy. Potem — koszt plan/actual projektu.
- **P0 zależności dla kosztu rzeczywistego:** auth/ACL, audyt autora i źródła, migawka wyceny/wydania, chronione artefakty handlowe, wersjonowanie payloadu i backup/restore. Część magazynowa zależy też od ustalenia jednostek, zakupów, ruchów oraz tego, kto potwierdza czas i zużycie.
- **Nieustalone przez źródła lub kod:** czy właściciel rozumie 25% jako narzut czy docelową marżę; jakie koszty pośrednie są wkalkulowane w bazę lub `narzutProcent`; czy firma chce analizować koszty po każdym projekcie; jaka polityka rozlicza poprawki i reklamacje. Wymaga decyzji właściciela/księgowości, nie zgadywania przez aplikację.
- ACCA jest źródłem edukacji rachunkowości zarządczej; nie określa prawidłowej polityki cenowej tej stolarni ani polskiego rozliczenia księgowego.

## Mierzalne kryteria odbioru

1. Ustawienia i ekran wyceny nazywają procent zgodnie z mianownikiem i pokazują kwotę bazową, do której jest stosowany.
2. Test na bazie 11 550 zł, parametrze 25% i bez ceny minimalnej potwierdza: narzut daje 14 437,50 zł netto, a docelowa marża kalkulacyjna daje 15 400 zł netto. VAT jest liczony dopiero po cenie netto i nie zmienia jej mianownika.
3. Wartości graniczne 0%, ujemne, >=100% dla target-margin oraz cena minimalna nie tworzą dzielenia przez zero, ceny ujemnej ani cichego fallbacku; UI zwraca walidację/wyjaśnienie.
4. Test migracji ustawień zachowuje bieżącą wartość jako ten sam historyczny rodzaj parametru do czasu jawnego wyboru właściciela; migracja nie przelicza zapisanych ofert, umów ani `cenaUzgodnionaBrutto`.
5. Test historycznej umowy zachowuje uzgodnioną cenę **29 227,60 zł brutto**; nowa semantyka kalkulacji nie zmienia zapisanej kwoty ani dokumentu.
6. Raport dla projektu pokazuje osobno prognozę i actual, status potwierdzenia każdego kosztu, źródło i rewizję; bez rzeczywistego zapisu stan kosztu wyświetla „brak danych”, a nie 0 zł.
7. Po zmianie bieżącego cennika istniejący snapshot wyceny pozostaje odtwarzalny. Różnice actual/plan rozkładają się co najmniej na cenę zakupu, ilość zużytą i godziny; każda korekta pozostawia historię.
8. Pracownik bez uprawnienia finansowego nie może zobaczyć raportu marży ani przez UI, API, MCP, eksport, ani bezpośredni identyfikator.

## Punkt wznowienia

Świeży fetch nadal wskazywał `origin/main=8d39dcdd06c40b09de742c034d8898414b4ccd75`; brak nowych commitów od poprzedniej kontroli, a status publiczności repozytorium pozostał `public`. Ten brief dotyczy semantyki kosztu i cen, nie modyfikuje danych ani polityki sklepu. Następnie sprawdzić decyzję właściciela w sprawie nazwy/podstawy procentu oraz zmiany w magazynie i kosztach rzeczywistych; do tej pory zachować obecne ceny i umowy.
