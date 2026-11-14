# Przekazanie do Codex Desktop — Comodino

Data: 03.11.2026. Repo: SrebrnyAndrzej/Stolarnia-web. Gałąź: feat/pan-stolarz-v2.

Użytkownik poprosił o sprawdzenie Comodino i przekazanie wyników do Codex Desktop.
Pełny raport: [RESEARCH-comodino-2026-11-03.md](../RESEARCH-comodino-2026-11-03.md).

## Kontekst projektu

Pan Stolarz: kreator klienta oraz panel właściciela i pracowników Bartka/Kacpra. Pracownik bez wycen i finansów. Faktury poza zakresem. Silnik src/core prowadzi Claude; Codex odpowiada za UI, adaptery i research. Zachować uzgodnione ceny i istniejące dane.

## Wnioski i następny zakres do rozważenia

1. Jeden projekt, prosty widok klienta i pełne opracowanie warsztatowe; przekazanie do produkcji wymaga zatwierdzonego wydania.
2. Kalkulator frontów: rozważyć nierówne podziały, proporcje i blokowanie wybranego wymiaru, bez tworzenia drugiej geometrii w UI.
3. Checklista montażu dla pracownika powiązana z konkretnym wydaniem i numerami części.
4. Wspólny pakiet kilku projektów oraz optymalizacja pozostałości dopiero po specyfikacji silnika.

Są to rekomendacje, nie potwierdzenie wdrożenia funkcji Comodino. Zbadano publiczne materiały i ekran kreatora, nie dokładność obliczeń, CNC czy kontrakt API.

## Granica synchronizacji

Ten pakiet przekazuje raport i kontekst, nie historię rozmowy. W środowisku chmurowym pozostają niezacommitowane zmiany warsztatu i kalkulatora frontów; nie zakładać, że zostały przesłane razem z tym dokumentem ani że produkcja została zaktualizowana. Bieżący kod i stan wdrożeń trzeba sprawdzić przed kontynuacją.
