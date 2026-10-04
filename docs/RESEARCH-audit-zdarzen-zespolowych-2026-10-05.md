# Zdarzenia audytowe i historia zmian przed pracą zespołową

Data: 2026-10-05
Baza kodu: `85385cb18e9242f3b0bcaea0c1a6b7d6b6bf3a79`
Zakres: przegląd statyczny modelu i serwisu; bez wdrażania kont, bez produkcyjnych zapisów.

## Luka potwierdzona w kodzie

Model `Projekt` ma `rewizja`, `zmieniono` i `historiaStatusow`, ale wpis historii statusu zawiera tylko status i datę (`src/core/types.ts`, `src/service.ts:351`). Nie ma autora/aktora w zdarzeniu ani osobnego dziennika działań. W dostępnych modelach i serwisie nie znaleziono kontekstu uwierzytelnionego użytkownika.

Co więcej, `zmienProjekt()` wybiera ścieżkę `edytujTemat()` gdy równocześnie nie zmieniono nazwy ani ogólnych notatek (`src/service.ts:345`). Wtedy zmienia `zmieniono`, lecz nie zwiększa `rewizja`; `edytuj()` zwiększa rewizję (`src/service.ts:758–775`). Zmiany samej ceny uzgodnionej, klienta, statusu lub terminu montażu mogą więc pozostać niewidoczne dla numeru rewizji konstrukcyjnej. Rewizja konstrukcji nadal jest użyteczna dla produkcyjnej migawki, ale nie jest kompletnym audytem biznesowym.

**Skutek dla zespołu:** przy kontach pracowników nie da się wiarygodnie odpowiedzieć, kto zmienił cenę/status/termin, utworzył lub pobrał umowę, usunął projekt albo wydał produkcję. Znacznik `zmieniono` ani rewizja projektu nie identyfikują aktora i nie pokazują rodzaju czynności.

## Wymagane rozdzielenie

1. Zachować `rewizja` jako numer konkretnego stanu konstrukcji/dokumentacji. Nie zwiększać jej automatycznie dla każdego odczytu ani zdarzenia administracyjnego; jawnie określić, które pola wpływają na produkcyjną migawkę.
2. Dodać osobny dziennik zdarzeń aplikacyjnych z tożsamością pobraną z zweryfikowanej sesji po stronie serwera (nigdy z dowolnego pola body). Zdarzenie co najmniej: `eventId`, `workshopId`, `actorId`, `action`, `resourceType`, `resourceId`, czas serwerowy UTC, wynik, `requestId`, oraz bezpieczne podsumowanie zmienionych pól.
3. Zapisywać zdarzenie razem ze zmianą w tej samej transakcji lub niezawodnym outboxie. Nie może wystąpić zaakceptowana zmiana bez odpowiadającego zdarzenia. Zwykła rola aplikacji nie powinna móc aktualizować ani usuwać istniejących wpisów dziennika.
4. Rozróżnić biznesowy ślad audytowy (np. zmiana ceny, klient, termin, umowa, wydanie, usunięcie, eksport, uprawnienia) od logów technicznych/security (logowanie, odmowa dostępu, błąd, request ID). Mają różne odbiorców, szczegółowość i okresy przechowywania.
5. Zmiany identyfikować po nazwach pól i poprzednim/nowym stanie tylko tam, gdzie zatwierdzona klasyfikacja danych pozwala na przechowywanie wartości. Domyślnie nie kopiować do logu adresu, telefonu, treści umowy, notatek, tokenów ani kluczy. Dla wartości handlowych (cena) właściciel zatwierdza potrzebny poziom szczegółowości.
6. Dziennik audytowy udostępniać tylko upoważnionym rolom; odczyt i eksport dziennika sam również logować. Ustalić retencję wspólnie z polityką prywatności; nie wymyślać terminu w implementacji.

Zdarzenia domenowe do pokrycia: edycja danych klienta i projektu; status/termin/cena; tworzenie/odczyt/pobranie umowy i PDF; wydanie/ponowne wygenerowanie dokumentacji; zmiana katalogu/ceny materiału lub okucia; eksport CSV/CAD/PDF; usunięcie/archiwizacja; zaproszenie, zmiana roli, zawieszenie i cofnięcie dostępu. Logowanie udanych i nieudanych operacji dostępu należy do odrębnego kanału technicznego.

## Priorytet, zależności i kryteria odbioru

**P1 — przed włączeniem edycji przez wielu pracowników.** Zależności: zweryfikowana autoryzacja i członkostwo (P0 w notatce bezpieczeństwa), podział ról, zatwierdzona klasyfikacja pól i retencja, transakcyjny model zapisu.

- Dwie sesje z różnymi aktorami zmieniają status, cenę lub termin: każdy zatwierdzony zapis ma właściwego aktora i request ID; odrzucony konflikt nie udaje udanej zmiany.
- Zmiana statusu/CRM i zmiana geometrii dają odrębne typy zdarzeń; zmiana biznesowa nie fałszuje rewizji konstrukcji, a wydanie produkcyjne nadal jednoznacznie wskazuje stan konstrukcyjny.
- Dla zmian ceny, statusu, umowy, wydania, eksportu i usunięcia widoczny jest czas, aktor, zasób, czynność i wynik; zakres wartości przechowywanych w audycie odpowiada zatwierdzonej klasyfikacji.
- Wymuszona awaria zapisu zdarzenia powoduje rollback operacji biznesowej albo niezawodne dostarczenie przez outbox; test potwierdza brak „cichej” zmiany bez śladu.
- Zwykły użytkownik nie może edytować/usunąć wpisu audytu ani czytać historii innego warsztatu; aktor i warsztat pochodzą z weryfikowanego serwera.
- Testy potwierdzają brak w logach PII, treści dokumentów, tokenów i kluczy; test eksportu audytu sprawdza autoryzację i własny wpis audytowy.

## Źródła

- OWASP Logging Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html — aplikacja ma kontekst użytkownika/czynności; wskazuje „when, where, who and what”, audyt dodania/zmiany/usunięcia/eksportu, minimalizację danych w logach, kontrolę dostępu i ochronę integralności.
- Wymagania wersji konstrukcji i wydań: `docs/WYTYCZNE.md`, `docs/RESEARCH-silnik-mebli-i-konta.md`.
- Otwarte ryzyka autoryzacji, prywatności i retencji: notatki `docs/SECURITY-API-publiczna-przed-kontami-2026-10-04.md` oraz `docs/RESEARCH-prywatnosc-retencja-dokumentow-2026-10-04.md`.

Nie zmieniono logiki ani umów. Wdrożenie audytu pozostaje zadaniem implementacyjnym Claude po P0 autoryzacji.
