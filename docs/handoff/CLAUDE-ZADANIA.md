# Zadania dla Claude — Pan Stolarz 2.0

Status: przygotowane do podjęcia, nie wysłano do aplikacji Claude. Codex nie ma w tej sesji połączenia z Claude Desktop/Code.

## Start

Przeczytaj `CLAUDE.md`, `docs/STATUS-PAN-STOLARZ.md` i `docs/branding/BRIEF-dla-Claude-jezyk-wizualny-v1.md`. Pobierz aktualną gałąź `feat/pan-stolarz-v2`. Pracuj na osobnej gałęzi od jej aktualnego HEAD, aby nie nadpisywać pracy Codexa. Przekaż wyniki przez PR lub pliki w repo. Nie wdrażaj produkcji.

## C1 — język komunikacji z klientem

Przygotuj `docs/branding/COPY-CLAUDE-v1.md`: finalne propozycje hero, ścieżek startowych, oferty, procesu, FAQ i formularza. Ton bezpośredni na Ty, spokojny, konkretny. Czytaj bieżący `web/src/v2/Landing.tsx`, ale nie edytuj go równolegle z Codexem. Dla każdej sekcji podaj tekst i cel klienta. Dodaj słownik 10 preferowanych sformułowań oraz listę fraz do unikania. Bez wymyślonych terminów, cen, opinii, realizacji, lat doświadczenia i gwarancji. Nie sugeruj działającego natychmiastowego kosztorysu ani przesyłania załączników. Odbiór: treść pasuje do realnych możliwości UI i prowadzi do jednego z dwóch wejść: kreator albo opis pomysłu.

## C2 — rendery z istniejących projektów

Przygotuj 3 zestawy: całość → detal → zastosowanie. Korzystaj wyłącznie z dostępnych projektów i ich rzeczywistej geometrii. Usuń nazwy klientów, adresy i dane finansowe z materiałów. Nie przedstawiaj renderów jako zdjęć realizacji. Dołącz manifest: neutralna nazwa, źródło projektu w prywatnej dokumentacji, proporcje, alt, podpis, rozdzielczość i rozmiar. WebP/JPG, wersja szeroka 1600–1920 px i mobilna. Bez galerii z pustymi polami. Odbiór: zgodność geometrii, czytelny detal, opis zastosowania bez niepotwierdzonych twierdzeń. Codex osadzi pliki w stronie.

## C3 — kontrola animacji dostarczonych przez użytkownika

Filmy kuchni Darii v2 (14 s) i składania szafki (12 s) są już osadzone. Oceń kadrowanie na telefonie i czy kolejność składania pokazuje konstrukcję jasno. Jeżeli potrzebna korekta, dostarcz nową wersję i krótki changelog. Nie twórz zamiennika bez potrzeby. Kuchnia pozostaje tłem hero ze scrollem; szafka obecnie odtwarzana ręcznie.

## Granice odpowiedzialności

Codex: układ, integracja UI, dostępność i testy. Claude: copy do przeglądu, rendery, animacje oraz wcześniej uzgodniony silnik. W tym pakiecie nie zmieniaj silnika, katalogów ani finansów. Pracownik ma dostęp do projektów technicznych i kalkulatora szuflad, bez wycen i finansów. Konta i zapytania wymagają konfiguracji serwera przed uruchomieniem dla klientów.

## Raport zwrotny

Podaj: ukończone zadania C1/C2/C3, ścieżki plików, commit/PR, wykonane sprawdzenia i otwarte kwestie. Nie oznaczaj zadania jako wysłanego lub ukończonego wyłącznie na podstawie tego briefu.
