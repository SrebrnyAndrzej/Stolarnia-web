---
version: alpha
colors:
  background: "#f7f8f7"
  panel: "#ffffff"
  text: "#1c2b30"
  primary: "#1c2b30"
typography:
  body:
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
rounded:
  DEFAULT: "10px"
---

## Overview
Pan Stolarz 2.0: strona klienta i panel właściciela/pracownika. Użytkownik wybrał wariant 2 z oryginalnym brandingiem marki. Kontekst zatwierdzonego kierunku: grafitowa nawigacja, zielone zaznaczenia, jasny obszar projektu, lista po lewej i szczegóły po prawej. Dotychczasowy kalkulator i projektant zachowują logikę, dostają wspólne tokeny marki. UI po polsku; PLN, milimetry i Europe/Warsaw.

## Colors
Marka pochodzi z oryginalnego `src/export/assets/pan-stolarz.png`: #1C2B30, #A5B859, #435058. W v2 źródłem nadpisania tokenów jest `web/src/v2/styles.css`, importowany po bazowym arkuszu. Oryginalny asset jest używany bezpośrednio jako logo; wygenerowana wizualizacja kuchni to jawnie oznaczona inspiracja, nie zdjęcie realizacji. Paleta v2 nadpisuje stary brązowy akcent. Na zieleni tekst grafitowy; główne przyciski grafitowe z białą etykietą. V2 obecnie ma jasne powierzchnie zgodne z wybranym obrazem; starszy automatyczny motyw ciemny nie jest aktywny w nowej warstwie.
Źródłem tokenów jest `web/src/styles.css`, selektor `:root` i wariant ciemny `prefers-color-scheme`. Powyższe wartości dokumentują tryb jasny, nie stanowią osobnego generatora kolorów. Kalkulator używa wspólnych klas paneli, pól i tabel; scrollbar korzysta z istniejących tokenów linii i panelu.

Na tle `--accent-soft` drobny tekst wybranych przycisków, etykiet i głównej nawigacji używa `--text`, nie `--accent` (jasny wariant accent/soft ma kontrast 4,02:1). Wybrany stan nadal wskazuje tło, obrys i `aria-pressed`/`aria-current`.

## Typography
Font systemowy zgodny z resztą aplikacji. Wartości wymiarów używają `.num` (cyfry tabelaryczne). Wszystkie wymiary opisujemy w mm; dno: szerokość × głębokość, plecy: szerokość × wysokość.

## Layout
V2: desktop — nawigacja 182 px, lista projektów 244 px, płynny podgląd i inspektor 292 px. Poniżej 1200 px inspektor przechodzi pod podgląd; poniżej 800 px lista jest poziomym przewijanym zbiorem i nawigacja rozwija się przyciskiem. Każdy region ma min-width:0 i własny kontrakt przewijania. Ilustracja poglądowa w demonstracji jest oddzielona od rzeczywistej geometrii silnika (3D, rzut i elewacja). Dane demonstracyjne są syntetyczne.
Kalkulator jest osobnym narzędziem w głównym menu pod `#/szuflady`. Na komputerze: formularz do 410 px i karta wyników obok; poniżej 860 px jeden naturalnie przewijany ciąg formularz → wyniki. Nie używa szerokiej tabeli. Źródłem miar pozostaje serwis, UI wyświetla wybrany system, nie kopiuje wzorów okuć.

Podstawowe pola liczbowe mają minimum 52 px wysokości (54 px na telefonie), tekst od 18 px. Przyciski wariantów minimum 44 px. Sekcje 1/2 odpowiadają rzeczywistej kolejności: korpus i szuflada → front i zaczepy. Wymiary cięcia to dwie karty; wiercenia pokazujemy na schemacie tylnej strony frontu i dużymi liczbami od krawędzi. Brak pozycji nie staje się schematycznym „gotowym” otworem. Wysokości prowadnic pokazujemy jako listę od dołu z jawnym punktem bazowym, odróżniając krawędź prowadnicy od osi wkrętów.

## Elevation & Depth
Karty dziedziczą wspólny cień `--shadow`.

## Shapes
Panele używają `--radius`; nie dodajemy nowej geometrii kontrolek.

## Components
Nowy shell `v2/App.tsx` i współdzielony `v2/api.ts`/`useResource.ts`: prywatne dane bez cache, anulowanie nieaktualnych odczytów, timeout, role serwerowe. Chronione zakładki i techniczny DTO opisane w UX-CONTRACT.md. Autoryzacja w src/server/access.ts; interfejs nie może zastąpić kontroli serwerowej. Trzy role mają osobne zakresy odpowiedzi. Nie publikować przed uruchomieniem kont/migracji i sprawdzeniem prawdziwych sesji.
Właściciele UI: pola `.field/.input`, komunikaty `.alert`, panele `.card` w globalnym CSS. `.drawer-*` jest wariantem warsztatowym tych elementów: większy dotykowy rozmiar i wynik bez tabeli; nie zmienia kontrolek katalogu ani projektanta. Natywne selecty celowo pozostają obsługiwane przez system operacyjny.

`web/src/views/szuflady/model.ts` jest właścicielem formularza, mapowania parametrów i walidacji wejść UI; `useKalkulator.ts` obsługuje odczyt REST i anulowanie żądań. Formularz nie zmienia zapisanych projektów. Wersjonowana pamięć `stolarnia.kalkulator-szuflad.v1` w localStorage zachowuje wyłącznie parametry narzędzia na urządzeniu. Typy i wartości enum są sprawdzane przy odtwarzaniu. Brak pamięci nie blokuje obliczeń.

Front zewnętrzny i wewnętrzny zachowują osobne szerokości, wysokości i pierwsze otwory. Przełączanie nie przenosi tych wymiarów między frontami. Żądania są anulowane po zmianie danych; wynik jest widoczny wyłącznie dla bieżących parametrów i ukrywany podczas przeliczania oraz po błędzie. Ponowienie nie usuwa danych. Przycisk „Pokaż rozkrój i wiercenia” kieruje fokus na pierwsze błędne pole albo do wyników. Kopiowanie zawiera punkty pomiaru oraz status kolizji.

`RysunekFrontu.tsx` jest wyłącznie rendererem pozycji z API. Numerowane otwory odpowiadają liście wysokości, dolna krawędź ma grubszą linię. Schemat ma dostępny opis tekstowy. Kolizja usuwa schemat i pozycje z ekranu; brak danych nie jest oznaczany jako sprawdzony prześwit. Dodatkowe założenia i źródła są rozwijane przez natywne details.

## Do's and Don'ts
Wynik warsztatowego rozstawu nie jest automatycznym zatwierdzeniem CNC. Zachować statusy profili i odwołania do źródeł. Nie zaokrąglać rozstawu frontów do rastra 32 i nie utożsamiać go z osiami wierceń projektu.

## Kreator kuchni klienta

`#/kreator-kuchni` to publiczny, trzyetapowy wariant istniejącego języka Pan Stolarz. Wykorzystuje te same tokeny i logo: jasna plansza, grafitowe kontrole, zielone wybrane stany. Wyróżnikiem jest rzeczywisty rysunek kuchni z wymiarami, a nie fotografia przypisywana każdemu układowi. Typografia tytułów pozostaje bezszeryfowa, liczby mają tabelaryczne cyfry. Nie wprowadzamy nowej palety.

Właściciel widoku i zapisu szkicu: `v2/planner/KitchenPlanner.tsx`. Adapter `planner/model.ts` korzysta z istniejącego katalogu, domyślnej konfiguracji, buildera i rendererów; nie definiuje technologii ani wyceny. Układ prosty/L/U, pozycje w kolejności szafek osobno dla dolnych i wiszących; L rezerwuje pusty narożnik 650 mm na ścianie B. Wskazanie szafki na rysunku ma alternatywę w postaci listy i przycisków. Natywne selecty i picker plików są świadomie obsługiwane przez system operacyjny.

Szkic bez danych kontaktowych jest automatycznie zapisywany na urządzeniu pod `pan-stolarz.kuchnia.v1`, z walidacją wersji i katalogu podczas odczytu/importu. Błąd pamięci nie blokuje edycji; użytkownik może pobrać JSON. Zmiana w drugiej karcie wstrzymuje zapis i wymaga wyboru wersji. Reset wymaga potwierdzenia w natywnym dialogu; zwykłe usunięcie szafki jest odwracalne przyciskiem Cofnij. Przekazanie do zapytania przenosi opis w sessionStorage; potwierdzenie wysłania następuje dopiero po odpowiedzi serwera. JSON jest szkicem klienta, nie formatem importu produkcyjnego.

Układ U: trzy ściany A/B/C z niezależnymi długościami. Puste strefy narożników 650 mm na początku B i C; geometria ścian z istniejącego renderera (łańcuch 90°). Zmiana na mniejszy układ jest blokowana, dopóki na usuwanej ścianie są szafki. Starsze szkice bez długości C otrzymują domyślne 3600 mm; zapis wersji 1 pozostaje czytelny.

## Animacja otwierająca

Strona główna używa dostarczonego przez użytkownika filmu kuchni Darii, nie generowanej fotografii w hero. `v2/HomeIntro.tsx` jest właścicielem powiązania scrolla z czasem filmu. Film wypełnia całą powierzchnię hero jako tło (cover), z ciemną nakładką i tekstem HTML nad nim. Kadrowanie zależy od ekranu. Biała typografia i zielony akcent utrzymują czytelność. Nagłówek i opis ujawniają się ze scrollem, a CTA są zawsze widoczne. Normalny scroll i statyczne CTA są zawsze dostępne. Poster i podgląd statyczny dla reduced-motion, oszczędzania danych i awarii; widoczny przycisk pauzy/wznowienia. Brak autoplay i audio. Drugi materiał nie jest jeszcze dostępny i nie tworzy pustej sekcji. Szczegóły: docs/ANIMACJE-STRONA-GLOWNA.md.
