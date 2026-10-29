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

## Typography
Font systemowy zgodny z resztą aplikacji. Wartości wymiarów używają `.num` (cyfry tabelaryczne). Wszystkie wymiary opisujemy w mm; dno: szerokość × głębokość, plecy: szerokość × wysokość.

## Layout
Pola zawijają się na wąskim ekranie. Tabela wyników korzysta z istniejącego `.t-wrap`. Wysokości prowadnic pokazujemy jako listę od dołu, z jawnym punktem bazowym i rozróżnieniem krawędzi prowadnicy od osi wkrętów.

## Elevation & Depth
Karty dziedziczą wspólny cień `--shadow`.

## Shapes
Panele używają `--radius`; nie dodajemy nowej geometrii kontrolek.

## Components
Właściciele UI: pola `.field/.input`, tabele `.t/.t-wrap`, przełączniki `.seg`, komunikaty `.alert`, panele `.card` w globalnym CSS. Natywne selecty celowo pozostają obsługiwane przez system operacyjny. Kalkulator ma lokalny stan, nie zapisuje ani nie zmienia projektów. Żądania są anulowane po zmianie danych; wyniki ukrywane podczas przeliczania i po błędzie. Ponowienie nie usuwa wpisanych danych.

## Do's and Don'ts
Wynik warsztatowego rozstawu nie jest automatycznym zatwierdzeniem CNC. Zachować statusy profili i odwołania do źródeł. Nie zaokrąglać rozstawu frontów do rastra 32 i nie utożsamiać go z osiami wierceń projektu.
