# Uwaga klienta i intuicyjny kreator Pan Stolarz

Research i przejście po lokalnej wersji, 15.11.2026. Cel: klient rozumie ofertę, projektuje własną kuchnię i poznaje orientacyjną cenę. To podstawy do przebudowy, nie zmierzona mapa spojrzeń ani dowód wzrostu konwersji.

## Co wynika z badań

1. **Nie istnieje jeden uniwersalny układ hot spotów.** Sposób skanowania zależy od zadania, treści i układu. F-pattern nie jest instrukcją ustawienia każdego formularza. Dla nas ważniejsze są aktualny projekt i kolejna decyzja niż geometria litery F. [NN/g: wyjaśnienie F-pattern](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/).
2. **Nagłówki mają prowadzić do potrzebnej informacji.** Wyraźne, konkretne śródtytuły wspierają szybkie skanowanie. U nas: Wymiary pomieszczenia, Wybrana szafka, Twoja wstępna wycena; krótkie opisy zamiast akapitów przed narzędziem. [NN/g: layer-cake scanning](https://www.nngroup.com/articles/layer-cake-pattern-scanning/).
3. **Wielkość, kontrast i bliskość ustalają hierarchię.** Dominować powinien element najważniejszy dla zadania. U nas: podgląd w projektowaniu, cena i zakres w podsumowaniu, jedna wyraźna akcja następnego kroku. Powiązane pola i ich zatwierdzenie blisko siebie. To zastosowanie do naszego produktu, nie wynik badania naszej strony. [NN/g: zasady projektowania wizualnego](https://www.nngroup.com/articles/principles-visual-design/).
4. **Ujawniać szczegóły stopniowo.** Najpierw podstawowe decyzje, później zaawansowane ustawienia. U nas układ/wymiary → propozycja → poprawki → cena. Parametry stref i przyłączy rozwijane; cena, jednostki, błąd i główna akcja pozostają jawne. [NN/g: progressive disclosure](https://www.nngroup.com/articles/progressive-disclosure/).
5. **Przycisk ma mówić, co się wydarzy.** Wygląd, odpowiedni rozmiar i konkretna etykieta pomagają rozpoznać akcję. U nas Ułóż całą kuchnię, Zastosuj do szafki, Pobierz PDF. Nie dodajemy równej wagi kilku konkurującym akcjom. [Baymard: button design](https://baymard.com/blog/button-design).
6. **Ruch przyciąga uwagę, więc potrzebuje celu.** Film kuchni może budować zainteresowanie; nie powinien być warunkiem dotarcia do narzędzia albo utrudniać wykonania zadania. W kreatorze brak dekoracyjnych animacji konkurujących z projektem. Istniejące pauza i reduced-motion pozostają. [NN/g: animation for attention](https://www.nngroup.com/articles/animation-usability/).
7. **Stały pasek nie może zasłaniać obsługi.** Kontrolka z fokusem nie może być całkowicie schowana przez treść strony. U nas dolny pasek ma rezerwę miejsca, safe-area, scroll-margin i kontrolę na małym ekranie. Zasięg kciuka jest inną kwestią niż skupienie wzroku. [W3C: Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum).

## Projektowana hierarchia uwagi

To hipoteza projektowa do sprawdzenia, bez fikcyjnej heatmapy i procentów.

| Miejsce | Co klient powinien najpierw zauważyć | Główna akcja | Informacje pomocnicze |
| --- | --- | --- | --- |
| Strona główna, pierwszy ekran | Efekt kuchni i jasna korzyść | Wejście do projektowania z orientacyjną ceną | Kontakt, obszar działania, droga dla gotowego projektu |
| Pomieszczenie | Układ i wymiary z jednostką | Ułóż całą kuchnię | Ręczny start, ustawienia AGD/zlewu |
| Projektowanie | Własna kuchnia i wybrana szafka | Zastosuj zmianę; potem podsumowanie | Katalog, strefy, zaawansowane parametry |
| Podsumowanie | Cena wstępna, zakres i wyłączenia | Pobierz PDF | Zmiana materiałów, kontakt, powrót do projektu |
| Zapytanie | Kontynuacja własnego projektu | Wyślij zapytanie po wpisaniu danych | Informacja, że nie jest zamówieniem |

## Co już zmieniono lokalnie w kreatorze

- Domyślne cm z możliwością mm i pamięcią wyboru; błędne pole wskazywane zamiast zaznaczania wszystkich.
- Główna akcja proponowanej kuchni bezpośrednio po pomiarach, wyraźnie opisany ręczny start.
- Podgląd przed katalogiem na telefonie, krótszy nagłówek w edycji, strefy rozwijane pod rysunkiem.
- Stały pasek dalszego kroku i pobrania PDF; ta sama obsługa PDF w karcie i pasku, bez drugiego silnika wyceny.
- Jawne Zastosuj/Anuluj dla zmiany szafki. Oczekująca edycja nie dostaje starej kwoty ani PDF i nie znika przy wyborze innej szafki.

## Następne prace wynikające z obserwacji

1. **Strona główna:** na zrzucie `15-strona-glowna-przed.png` render, duży nagłówek i zielone Umów pomiar dominują, a kreator jest drobnym linkiem w menu. Przy naszym celu warto przetestować główne wejście Zaprojektuj kuchnię i poznaj cenę, zachowując telefon jako alternatywę. Materiał wizualny i identyfikacja marki są dobrą podstawą; nie ma powodu wymieniać ich bez potrzeby.
2. **Zmiana typu szafki w miejscu — wdrożona lokalnie 15.11:** dolne szafki do przechowywania przełączają Drzwi i półki / Szuflady w tym samym formularzu, bez usuwania i ponownego dodawania. Zachowane gabaryty, położenie, przerwy i osłony; jawne zastosowanie, anulowanie i cofanie. Nie rozszerzamy tej zamiany na AGD ani pozostałe typy zabudowy.
3. **Spójniejsze miary i nazwy klienta:** pokój jest w cm, edytor szafki pozostaje techniczny w mm. Zbadać cm także w uproszczonej edycji, zachowując mm dla pracowników i produkcji.
4. **Pojemność rzędu:** obok wolnego miejsca dolnej zabudowy pokazać osobno wiszące; wyjaśniać brak miejsca przed nieudaną próbą dodania.
5. **Walidacja z ludźmi:** dać nowym osobom zadanie zaprojektowania prostej kuchni, zmiany jednej szafki i znalezienia ceny. Obserwować zatrzymania, cofnięcia i błędne kliknięcia. Nie utożsamiać kliknięć z pomiarem wzroku. W tym etapie nie dodano śledzenia użytkowników ani zewnętrznych skryptów analitycznych.

## Granice dowodów

Audyt to obserwacja rzeczywistego lokalnego interfejsu w przeglądarce oraz testy, nie badanie okulograficzne. Nie sprawdzono fizycznej klawiatury telefonu, wszystkich modeli urządzeń ani pełnej zgodności WCAG. Nie wysłano prawdziwego zapytania. Stawki wyceny pozostają modelowe. Raport z etapami i bieżącymi zrzutami: `outputs/audyt-klienta-2026-11-15/AUDYT.md` w katalogu roboczym projektu.
