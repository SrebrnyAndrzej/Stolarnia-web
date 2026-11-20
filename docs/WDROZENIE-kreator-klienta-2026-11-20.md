# Kreator klienta — wydanie po researchu 20.11.2026

## Zmiana zachowania

- Katalog pokazuje szafki, które można rzeczywiście dodać. Podgląd dostępności i zatwierdzenie korzystają z tej samej funkcji oraz istniejących reguł geometrii. Pusty wynik wskazuje możliwość zmiany istniejącej szafki lub miejsca dodawania.
- Na komputerze podgląd jest po lewej, katalog/inspektor po prawej. Krótszy nagłówek oraz wysokość podglądu uwzględniają dolny pasek. Inspektor przewija się lokalnie; dodatkowe narzędzia pozostają poniżej i mają zwykły scroll strony. Na telefonie edytor jest przed dodatkowymi narzędziami. Panel nie nakłada się na formularze poniżej.
- Wyposażenie można wybrać wizualnie: drzwi i półki, trzy równe szuflady, sztućce i garnki, dwie wysokie szuflady. Wybór uzupełnia istniejący formularz; dopiero Zastosuj zapisuje zmianę. Gabaryty, pozycja i ID pozostają zachowane, działa Anuluj i Cofnij. Nazwa zestawu nie oznacza dołączonego organizera.
- Widok 3D ma Pokaż całość, a początkowy kadr uwzględnia wszystkie części. Zmiana kamery nie zapisuje nowej rewizji szkicu ani nie zmienia ceny.
- Rzut zawiera schematyczne AGD/zlew i opcjonalny podkład. Przejście między ciągami równoległymi wynika z rzeczywistych obrysów buildera, w tym blatów i osłon.
- Publiczna wycena i PDF wskazują domyślny standard AMIX/Häfele/AXILO. Koszt zawiasów i prowadników jest jawnie modelową rezerwą, a nie ceną konkretnego SKU. Zachowano istniejący odczyt starszych szkiców Blum. Brak zmiany zapisanych ofert, bazy lub uprawnień.

## Weryfikacja

- TypeScript backend/frontend i build Vite.
- Regresje obliczeń wyceny, wstawiania w luki i rzeczywistego przejścia.
- Testy macierzy uprawnień i braku wycieku danych, z odczytem PDF przez lokalny pypdf.
- Zestaw browser tests kitchen-*.spec.ts: komputer, telefon, geometria, niezastosowane zmiany, anulowanie/cofanie, porównanie wariantów, import plików, PDF i błędy API. Ostateczny wynik zapisany w lokalnym raporcie wydania.
- Statyczny audyt premium: brak błędów i nierozstrzygniętych kontraktów. To nie zastępuje pełnego audytu dostępności.

## Zakres publikacji

Wydanie wyodrębniono z działającej gałęzi d7b0bc0 do osobnej kopii roboczej. Nie dołączono równoległych, niezatwierdzonych zmian szczegółowego doboru okuć i technologii. Nie obejmuje jeszcze zapisu klienta do chmury, udostępniania publicznych szkiców linkiem, pełnych paczek zapytań z oryginałami, dowolnych wielokątów pokoju lub symulacji konkretnego AGD. Integracja Mussi pozostaje robocza, bez rzeczywistych zamówień.
