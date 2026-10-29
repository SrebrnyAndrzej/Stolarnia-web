---
version: alpha
colors:
  background: "#f6f3ee"
  panel: "#ffffff"
  text: "#221e19"
  primary: "#9a6531"
typography:
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
rounded:
  DEFAULT: "10px"
---

## Overview
Polski warsztat stolarski: narzędzie do wymiarowania i przygotowania dokumentacji, z naciskiem na czytelność jednostek i punktów pomiaru. Zachowujemy istniejącą identyfikację aplikacji, bez przebudowy pozostałych widoków.

## Colors
Źródłem tokenów jest `web/src/styles.css`, selektor `:root` i wariant ciemny `prefers-color-scheme`. Powyższe wartości dokumentują tryb jasny, nie stanowią osobnego generatora kolorów. Kalkulator używa wspólnych klas paneli, pól i tabel; scrollbar korzysta z istniejących tokenów linii i panelu.

Na tle `--accent-soft` drobny tekst wybranych przycisków, etykiet i głównej nawigacji używa `--text`, nie `--accent` (jasny wariant accent/soft ma kontrast 4,02:1). Wybrany stan nadal wskazuje tło, obrys i `aria-pressed`/`aria-current`.

## Typography
Font systemowy zgodny z resztą aplikacji. Wartości wymiarów używają `.num` (cyfry tabelaryczne). Wszystkie wymiary opisujemy w mm; dno: szerokość × głębokość, plecy: szerokość × wysokość.

## Layout
Kalkulator jest osobnym narzędziem w głównym menu pod `#/szuflady`. Na komputerze: formularz do 410 px i karta wyników obok; poniżej 860 px jeden naturalnie przewijany ciąg formularz → wyniki. Nie używa szerokiej tabeli. Źródłem miar pozostaje serwis, UI wyświetla wybrany system, nie kopiuje wzorów okuć.

Podstawowe pola liczbowe mają minimum 52 px wysokości (54 px na telefonie), tekst od 18 px. Przyciski wariantów minimum 44 px. Sekcje 1/2 odpowiadają rzeczywistej kolejności: korpus i szuflada → front i zaczepy. Wymiary cięcia to dwie karty; wiercenia pokazujemy na schemacie tylnej strony frontu i dużymi liczbami od krawędzi. Brak pozycji nie staje się schematycznym „gotowym” otworem. Wysokości prowadnic pokazujemy jako listę od dołu z jawnym punktem bazowym, odróżniając krawędź prowadnicy od osi wkrętów.

## Elevation & Depth
Karty dziedziczą wspólny cień `--shadow`.

## Shapes
Panele używają `--radius`; nie dodajemy nowej geometrii kontrolek.

## Components
Właściciele UI: pola `.field/.input`, komunikaty `.alert`, panele `.card` w globalnym CSS. `.drawer-*` jest wariantem warsztatowym tych elementów: większy dotykowy rozmiar i wynik bez tabeli; nie zmienia kontrolek katalogu ani projektanta. Natywne selecty celowo pozostają obsługiwane przez system operacyjny.

`web/src/views/szuflady/model.ts` jest właścicielem formularza, mapowania parametrów i walidacji wejść UI; `useKalkulator.ts` obsługuje odczyt REST i anulowanie żądań. Formularz nie zmienia zapisanych projektów. Wersjonowana pamięć `stolarnia.kalkulator-szuflad.v1` w localStorage zachowuje wyłącznie parametry narzędzia na urządzeniu. Typy i wartości enum są sprawdzane przy odtwarzaniu. Brak pamięci nie blokuje obliczeń.

Front zewnętrzny i wewnętrzny zachowują osobne szerokości, wysokości i pierwsze otwory. Przełączanie nie przenosi tych wymiarów między frontami. Żądania są anulowane po zmianie danych; wynik jest widoczny wyłącznie dla bieżących parametrów i ukrywany podczas przeliczania oraz po błędzie. Ponowienie nie usuwa danych. Przycisk „Pokaż rozkrój i wiercenia” kieruje fokus na pierwsze błędne pole albo do wyników. Kopiowanie zawiera punkty pomiaru oraz status kolizji.

`RysunekFrontu.tsx` jest wyłącznie rendererem pozycji z API. Numerowane otwory odpowiadają liście wysokości, dolna krawędź ma grubszą linię. Schemat ma dostępny opis tekstowy. Kolizja usuwa schemat i pozycje z ekranu; brak danych nie jest oznaczany jako sprawdzony prześwit. Dodatkowe założenia i źródła są rozwijane przez natywne details.

## Do's and Don'ts
Wynik warsztatowego rozstawu nie jest automatycznym zatwierdzeniem CNC. Zachować statusy profili i odwołania do źródeł. Nie zaokrąglać rozstawu frontów do rastra 32 i nie utożsamiać go z osiami wierceń projektu.
