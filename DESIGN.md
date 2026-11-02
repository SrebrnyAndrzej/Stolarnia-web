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

HomeIntro.tsx odtwarza dostarczony film kuchni Darii v4 samoczynnie, bez dźwięku, w tempie 0,75× i bez zapętlenia. Hero ma naturalną wysokość, bez sticky i wielokrotności ekranu przeznaczonej na scroll. Tekst ujawnia się z czasem filmu, CTA pozostają dostępne od początku. Po końcu filmu następuje płynne przewinięcie do kolejnej sekcji, o ile użytkownik sam nie nawigował i nie ma fokusu w hero. Ukrycie karty lub opuszczenie hero wstrzymuje film. Pause/resume i replay są dostępne. Reduced-motion/saveData oraz awaria zachowują statyczny, czytelny wariant. Blokada autoplay daje przycisk odtworzenia i pełną treść. Dotychczasowy helper home-motion.ts dokumentuje poprzedni wariant i nie jest już używany przez hero.

## Składanie szafki i rendery projektów

`v2/Landing.tsx` zawiera sekcję filmu dostarczonego przez użytkownika: ręczne odtwarzanie, brak autoplay, preload none i poster. Galeria renderów czeka na materiały Claude; bez pustych miejsc. Prototyp ProjectMedia i pipeline offline zostały wycofane.

Struktura strony: hero → dwa wejścia klienta → konstrukcja szafki → oferta → proces → FAQ → formularz. Dwa wejścia to kreator bez konta oraz opis własnego pomysłu. FAQ używa natywnych details/summary, działających z klawiatury. Zachowujemy istniejącą paletę, font i rytm sekcji; nie dodajemy nowej identyfikacji.

Research przyszłego kierunku komunikacji oraz roboczy brief do pracy z Claude: docs/branding/. Propozycja Manrope i nowe przykłady copy nie zostały globalnie wdrożone.

> Aktualizacja 31.10.2026: film hero zastąpiony dostarczoną wersją Kuchnia-Darii-animacja-v2.mp4 (14 s). Sterowanie i wygładzanie scrolla pozostają bez zmian. Rendery i nową animację składania przygotowuje Claude. Wcześniejsze prototypy Codex wycofano z publikowanej strony i zachowano w lokalnym archiwum; poniższe wzmianki o ich wdrożeniu są historyczne. Codex odpowiada za układ i treści.

## Pulpity ról — 31.10.2026
`Workspace.tsx` pokazuje kontekst roli nad wspólną przestrzenią projektu. Właściciel: aktywne projekty, produkcja, gotowe do montażu i przejścia do zapytań oraz przydziału dostępu. Pracownik: przypisane projekty, ich etapy i kalkulator szuflad; bez żądań finansowych i uprawnień edycji. Liczniki wynikają wyłącznie z listy zwróconej dla konta; podczas odczytu pokazują wielokropek, przy błędzie kreskę, nigdy fikcyjne zero. Wspólna lista, 2D/3D i inspektor zachowują kontrakt odczytu. Demonstracja nadal ma dane syntetyczne i nie loguje użytkownika.

## Dokumentacja w przestrzeni projektu
Przycisk „Dokumentacja techniczna” obok nagłówka projektu otwiera sekcję w naturalnym przepływie, bez modala. ProjectDocuments.tsx używa istniejących tokenów, przycisków, pól i Feedback. Natywne selecty są wyborem platformowym. Dwie akcje prowadzą do PDF technicznego i skróconego montażowego; link do druku pojawia się dopiero po pobraniu dokumentu. Na telefonie akcje układają się pionowo. Klient nie otrzymuje dokumentacji warsztatowej. Nie projektujemy nowego szablonu rysunków: zachowujemy istniejący generator wektorowy, skalę, mm i oznaczenia rewizji.

## Usprawnienia codziennej pracy — 31.10.2026
Demonstracja ma jawny przełącznik trzech ról, oddzielony od prawdziwego logowania. Lista projektów zachowuje wyszukiwanie, etap i wybór w adresie; filtry obejmują wszystkie/w trakcie/produkcja/montaż/zakończone. Puste wyniki mają akcję przywrócenia listy, a licznik pokazuje zakres bieżącej listy. Wybrana szafka ma w inspektorze własne gabaryty i liczbę elementów modelu. Zmiana ściany usuwa poprzedni wybór szafki.

Właściciel wyszukuje w załadowanej liście najnowszych 100 zapytań i filtruje rodzaj. Nie jest to wyszukiwanie całej historii w bazie. Natywny select korzysta z geometrii systemowej; pole search ma dostępny przycisk czyszczenia i zwraca fokus. Dokumentacja używa polskich etykiet diagnostyki i jawnej akcji odświeżenia. Zachowano logo, paletę, typografię oraz spokojne tempo hero.

Renderer 3D w przestrzeni projektów jest importowany dynamicznie po wybraniu widoku 3D. Rzut, dokumentacja i dane projektu pozostają dostępne niezależnie od pobrania renderera. Suspense rezerwuje obszar podglądu i pokazuje polski status ładowania; istniejący CanvasBoundary pozostawia alternatywę 2D po awarii.

Aktualizacja tempa hero: maksymalnie 1 sekunda filmu na sekundę czasu (wcześniej 4), łagodniejsze dochodzenie do kadru 0,45 s. Zakres hero 560 svh desktop / 400 svh telefon. Natywne przewijanie, pauza i ograniczenie ruchu pozostają dostępne.

## Aktualny tryb hero — samoczynne odtwarzanie
Na nowe zlecenie użytkownika film v4 odtwarza się sam, bez powiązania currentTime ze scrollem. Tempo 0,75×, bez dźwięku i zapętlenia. Po zakończeniu następuje płynne przewinięcie do następnej sekcji. Hero ma naturalną wysokość zamiast długiego obszaru scrolla; tekst ujawnia się z czasem filmu. Pauza/wznowienie i ponowne odtworzenie są dostępne. Po ręcznej nawigacji, przy fokusie w hero, ukrytej karcie lub reduced-motion nie wymuszamy przejścia. Reduced-motion/saveData nie pobiera filmu bez opt-in; odrzucenie autoplay pokazuje przycisk uruchomienia. Ta decyzja zastępuje wcześniejszy tryb przewijania i jego parametry.

## Publiczna strona — materiały Mateusza z 1.11.2026
Aktualizacja opiera się na TRESCI-STRONA-GLOWNA.md, strategii treści i założeniach PS-WWW-001. Publiczne kopie danych nie obejmują ulicy, roboczych budżetów ani informacji weryfikacyjnych. Właściciel treści usług/procesu/FAQ: `v2/landing-content.ts`; Landing.tsx pozostaje właścicielem układu, formularza i hero. Brak danych oraz decyzji reprezentuje PENDING_CONTENT z null, bez publicznych placeholderów.

W publicznej witrynie `.ps-public` obowiązuje książkowa paleta z briefu: granat #1C2B30, tekst #111317, drugi tekst #435058, linia #717780, podpis #848C8E, limonka #A5B859, ciepły #BFB7B6, papier #F1F2EE i biel #FFFFFF. Wartości są zadeklarowane w styles.css jako tokeny lokalne i mapowane na istniejące role CSS; nie nadpisują tokenów paneli. Podpis #848C8E nie jest wymuszany na treści, jeśli osłabiłby kontrast. Limonka używa ciemnej etykiety.

Typografia publiczna: lokalne IBM Plex Sans 400/600 i IBM Plex Mono 400/600 dla telefonu, znaczników i osi procesu. Font-face i unicode-range w brand-fonts.css, pliki oraz licencje w public/fonts. Panele zachowują dotychczasowy font. Nagłówek publiczny jest sticky; kotwice sekcji mają scroll-margin, a telefon pozostaje dostępny na małym ekranie. Nie dodano nowej domeny, śledzenia ani fontów hostowanych zewnętrznie.

## Uzupełnienie całej gotowej treści — 1.11.2026
Na polecenie użytkownika dodano 4 usługi, 4 pozycje paska dowodów, galerię 2 istniejących wizualizacji, 3 wyróżniki z działającymi przejściami, materiały/okucia i komplet 10 pytań FAQ. Galeria zastępuje osobny blok składania; zachowuje ten sam film oraz dodaje kadr kuchni z linkiem do animacji. Wyróżnik dokumentacji otwiera publiczny syntetyczny przykład PDF z oznaczeniem nieprodukcyjnym. Ceny opisano dla zatwierdzonego zakresu, bez zmiany umów i aktualizacji zapisanych kwot. Nie podano nieznanych terminów, cen pomiaru ani okresów gwarancji. Opinie, nieznane dane firmy i brakujące dokumenty prawne nie są zastępowane fikcyjną treścią.

## Zadania warsztatu — 01.11.2026
`Tasks.tsx` korzysta z istniejącego układu `ps-owner-page`, przycisków, pól i `Feedback`; bez nowej palety. Natywne selecty projektu/pracownika akceptują popup systemowy. Tworzenie pozostaje na liście, po potwierdzeniu czyści tytuł i zachowuje wybrany projekt/pracownika. Status zapisu w live region, błąd pozostaje przy formularzu, wpisany tytuł nie znika przy błędzie. Lista jawnie ograniczona do 100 najnowszych, odświeżana ręcznie lub po zapisie. Pracownik nie dostaje formularza przydziału. Demo nie udaje trwałego zapisu. Przejścia stanów i uprawnienia definiuje migracja `202611010001_workshop_tasks.sql`; szczegóły zakresu w `docs/PLAN-praca-stolarni.md`.

## Katalog dekorów i marki
Publiczny `DecorCatalog.tsx` i wybór w kreatorze współdzielą `DecorPicker`. Natywny select producenta, wyszukiwanie lokalne z czyszczeniem, po 24 wyniki i przycisk kolejnych. `Feedback` oraz style paneli pozostają wspólne. Katalog jest dostępny bez konta, zawiera tylko publiczne nazwy, kody i zdjęcia. Karuzela `BrandCarousel` ma ręczne przyciski, natywny scroll, focus i brak autoplay; reduced-motion wyłącza płynne przewijanie. Wybór dekoru zapisuje referencję i próbkę w szkicu, nie udaje tekstury PBR ani zatwierdzenia materiału do produkcji. Ponowny wybór koloru poglądowego usuwa wcześniejszy dekor.

## Kreator mebla (2026-11-02)
Kreator w panelu właściciela i pracownika dziedziczy tokeny `web/src/v2/styles.css`; `furniture.css` odpowiada za układ biblioteka / rysunek / inspektor. Geometryczny rysunek płyt jest wyróżnikiem narzędzia. Brak zmian globalnej identyfikacji. Na telefonie biblioteka, rysunek i inspektor układają się pionowo. Pola liczbowe zapewniają alternatywę dla przeciągania.

## Szkice zamówień Mussi (2026-11-02)
Purchasing korzysta z istniejących tokenów i powłoki ps-owner-page. Lista szkiców i edytor pozycji są obok siebie na komputerze i kolejno na telefonie. Używa wspólnych request, useResource, Feedback oraz useDraftGuard. Zamówienie ma wyłącznie status szkicu; nie pokazujemy pozornych cen ani przyjęcia przez hurtownię. Wspólna modalna ochrona szkiców ma styl ps-draft-dialog w styles.css.

## Karta części — 2026-11-02
Inspektor kreatora rozszerza istniejące natywne pola i selecty o materiał, dekor, lokalną płaszczyznę, usłojenie i krawędzie U0/U1/V0/V1. Schemat osi jest oznaczeniem, nie obietnicą rozkroju. Karta części w disclosure używa tokenów panelu, pokazuje braki i przechodzi do wybranego elementu. Eksport JSON zapisanej wersji jest akcją drugorzędną; stan niezatwierdzony pozostaje jawny. Źródło domenowe: docs/KARTA-KONSTRUKCJI.md.

Doprecyzowanie układu karty części: formularz materiałów znajduje się w szerokiej kolumnie roboczej, a inspektor wymiarów ma przycisk przejścia z ustawieniem fokusu na pierwszym polu. Na telefonie pola układają się w jedną kolumnę.

## Standard konstrukcji — 2026-11-02
ConstructionStandard używa istniejącego fieldset, fc-fields, natywnych selectów i tokenów w szerokiej kolumnie roboczej. Dwie jawne akcje uzupełnienia/zastąpienia opisów, wspólne Cofnij. FurnitureParts jest tabelą w przewijanym poziomo disclosure, bez nowej palety. Źródło: docs/STANDARDY-KONSTRUKCJI.md.

## Systemy szuflad w kreatorze — 2026-11-02
FurnitureDrawers korzysta z fc-fields, fieldsetów i natywnych selectów oraz tabel w fc-cut-table. Każdy front ma osobny system i granice komory. Źródła, braki oraz stan szkicu są czytelne; lista funkcji okuć nie wygląda jak przyjęte zamówienie. Bez nowych tokenów. Źródło: docs/SYSTEMY-SZUFLAD-KREATOR.md.
