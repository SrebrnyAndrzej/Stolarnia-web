# Biurko — wariant i zalecenia wymiarowe

Research i wdrożenie: 2 listopada 2026.

## Źródła pierwotne

- DGUV Information 215-410, tabela 10: https://publikationen.dguv.de/widgets/pdf/download/article/409 — stała wysokość do pracy siedzącej 740 ± 20 mm, głębokość 800 mm, typowa szerokość powierzchni pracy 1600 mm; 1200 mm dla ograniczonego wyposażenia i ilości dokumentów. Regulacja wysokości preferowana względem jednego stałego wymiaru dla różnych osób.
- WorkSafe Queensland: https://www.worksafe.qld.gov.au/safety-and-prevention/hazards/hazardous-manual-tasks/working-with-computers/setting-up-your-workstation — głębokość 800 mm pomaga ustawić monitor i zapewnić przestrzeń na nogi; ustawienie stanowiska wymaga dopasowania do osoby.
- HSE: https://www.hse.gov.uk/Msd/dse/good-posture.htm — położenie klawiatury względem łokci i dopasowanie stanowiska zamiast jednej uniwersalnej wysokości.

Wykorzystujemy zalecenia jako punkt startowy, nie deklarujemy zgodności z PN-EN/DIN EN ani z obowiązującymi przepisami konkretnego miejsca pracy. Nie kupowano licencjonowanego tekstu normy. Wymiar zewnętrzny blatu nie potwierdza ergonomii całego stanowiska, stateczności czy nośności konstrukcji.

## Wariant

Układ startowy Biurko ustawia szerokość 1600, głębokość 800 i wysokość górnej powierzchni 740 mm. Dodatkowy przycisk daje wersję 1200 × 800 × 740 mm. Grubość konstrukcyjna 28 mm jest założeniem projektu, nie wymaganiem ergonomicznej normy. Wszystkie gabaryty są potem edytowalne. Przywróć sugerowany układ zachowuje własne gabaryty; przyciski wymiarów ponownie stosują punkt startowy, z możliwością Cofnij.

Geometria: pełny blat nad dwoma bokami podporowymi, bez dna szafki i pełnych pleców, oraz tylna poprzeczka jako edytowalna sugestia. Poziom blatu wymaga prostokątnego obrysu. Wysokość boków wynosi wysokość biurka minus grubość blatu. Światło między bokami i wysokość pod blatem są pokazane w interfejsie. Zmiana gabarytów aktualizuje elementy, zachowując ID. Powrót do innego wariantu normalizuje płaszczyznę płyty górnej, zamiast pozostawiać dane skosu na poziomym blacie.

Pełne plecy i zmiana obrysu są wyłączone w interfejsie biurka; serwer odrzuca niezgodny wariant. Materiały, obrzeża, kopie, zapis i ochrona szkicu działają jak w pozostałych meblach. Dobór połączeń i sprawdzenie konstrukcji pozostają częścią opracowania technologii. Nie dodano mechanizmu regulacji wysokości ani jego deklarowanej nośności.

Testy obejmują gabaryty startowe, położenie pełnego blatu, brak dna, zachowanie ID, zmianę wysokości, przejście biurko/korpus, schemat zapisu oraz zapis i otwarcie w przeglądarce z atrapą API.
