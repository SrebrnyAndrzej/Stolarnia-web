# Workflow i przekazanie pracy Claude

Koordynator obecnego etapu: Codex. Cel bieżący: podłączenie zebranych katalogów w działającej aplikacji. Zmiany i weryfikacja są w STAN_PRAC.md. Nie nadpisywać istniejących cen ani projektów przy imporcie.

## Zadanie przygotowane dla GitHub Copilot

Status: NIE URUCHOMIONE. GitHub CLI i przeglądarka nie są zalogowane. SSH pozwala wysyłać commity, ale nie tworzy sesji Copilot. Poproszono użytkownika o lokalne gh auth login; bez hasła/tokenu w rozmowie. Nie raportować tego zadania jako delegowanego, dopóki GitHub nie zwróci identyfikatora zadania lub PR.

Po zalogowaniu zlecić Copilotowi na main osobny PR: uzgodnienie katalogu Kronospan/Kronosfera PL. Zakres plików: nowe docs/materialy/kronospan-warianty-PL.json, docs/materialy/kronospan-uzgodnienie.md oraz skrypt pozyskania danych. Nie zmieniać UI, serwisu ani katalogu startowego.

Brief: porównaj 236 obecnych dekorów z oficjalną ofertą Kronosfera 2026 (PDF w docs/materialy/pdf), szczególnie Home, SKIN, FOCUS i płyty surowe. Oddziel innych producentów, w tym KAINDL. Zapisz potwierdzone powiązania dekor–struktura–produkt–grubość–format, źródło URL, plik i stronę PDF, datę. Nie twórz iloczynu wariantów. Braki oznacz jawnie. Przygotuj raport różnic i testy poprawności/liczebności. Nie zatwierdzaj automatycznie danych do produkcji. Uwzględnij istniejące docs/materialy/README.md i CLAUDE.md.

Codex po otrzymaniu PR: przegląd źródeł i próbek wymiarowych, testy, dopiero potem integracja. Claude po powrocie: zacząć od STAN_PRAC.md i tego pliku; nie zakładać, że Copilot działa, ani że 644 pozycje wyczerpują całą ofertę PL. Czas resetu Claude nie jest dostępny w tym środowisku.
