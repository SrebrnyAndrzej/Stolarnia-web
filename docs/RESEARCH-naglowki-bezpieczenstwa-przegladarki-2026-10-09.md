# Nagłówki bezpieczeństwa przeglądarki i wdrożenie CSP

Data: 2026-10-09  
Baza statycznego przeglądu: `origin/main` `8230275ad6dea52109f581c793bdd8d6f08684d3`  
Zakres: polityka odpowiedzi dla aplikacji Vite/React i Express/Vercel. Nie sprawdzano domeny produkcyjnej, odpowiedzi z Vercel, ustawień panelu ani zachowania przeglądarki na produkcji.

## Problem i obserwacje w repozytorium

Stolarnia przechowuje dane klientów, oferty/umowy i projekty produkcyjne. `vercel.json` definiuje build, rewrites i funkcję, ale nie ma repozytoryjnej sekcji `headers`. W `src/server/app.ts` nie znaleziono ogólnego middleware ustawiającego nagłówki bezpieczeństwa; znalezione jawne ustawienia dotyczą głównie wybranych odpowiedzi PDF. To dowodzi jedynie braku konfiguracji w śledzonym kodzie. Właścicielskie ustawienia Vercel, zewnętrzny proxy i nagłówki domeny mogą dodać własne reguły — pozostają niezweryfikowane.

`web/index.html` zawiera favicon jako `data:image/svg+xml`; pozostała strona ładuje skrypt aplikacji jako moduł. W źródłach web nie znaleziono jawnych zewnętrznych originów dla fetch/WebSocket, ale obecne biblioteki, build, inline style React, render 3D i przyszłe integracje trzeba przetestować przed egzekwowaniem CSP. Nie proponować jednej „gotowej” polityki CSP bez inwentaryzacji runtime.

## Dlaczego warto

CSP może ograniczyć skutki części błędów XSS i injection, a `frame-ancestors` chroni interaktywny panel przed osadzeniem i clickjackingiem. `X-Content-Type-Options: nosniff` zmniejsza ryzyko interpretacji treści pod innym MIME type. Jawne `Referrer-Policy` ujednolica przekazywanie informacji referer. Te nagłówki są dodatkowymi warstwami ochrony; nie zastępują kodowania wyjścia, poprawnej autoryzacji ani bezpiecznej obsługi danych.

## Rekomendacje dla Claude

**P1 — inventory i nagłówki bazowe:** sprawdzić nagłówki rzeczywiście dostarczane dla HTML, assetów, `/api`, `/mcp`, PDF/CSV, odpowiedzi błędów i redirectów. Dodać wersjonowaną politykę w `vercel.json` albo middleware, po ustaleniu właściwego miejsca dla wszystkich odpowiedzi. Rozważyć co najmniej `X-Content-Type-Options: nosniff`, jawny `Referrer-Policy` oraz blokadę framingu interfejsu (`Content-Security-Policy: frame-ancestors 'none'` lub uzasadniona lista). Nie dodawać przestarzałego `X-XSS-Protection`; OWASP odradza tę ochronę.

**P1 — CSP w trybie obserwacji:** opracować politykę z najmniejszym zbiorem faktycznych źródeł (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src`, `font-src`, `object-src`, `base-uri`, `form-action`, `frame-ancestors`). Uwzględnić `data:` tylko dla konkretnych typów/zasobów, które rzeczywiście go wymagają; obecny favicon potrzebuje rozważenia `img-src data:`. Nie dopuszczać `unsafe-eval` ani ogólnego `unsafe-inline` dla skryptów jako szybkiej naprawy. Jeśli inline style lub skrypty są konieczne, używać ograniczonych hashy/nonces albo usunąć źródło zależności po weryfikacji.

Rozpocząć od `Content-Security-Policy-Report-Only` na środowisku testowym lub krótkim canary, przejść pełny workflow (logowanie, wyszukiwanie i edycja projektu, 2D/3D, katalogi/obrazy, umowa/oferta PDF, CSV, wydanie produkcyjne), usunąć przyczyny naruszeń i dopiero wtedy egzekwować politykę. Ustalić bezpieczny odbiór raportów i ograniczenie wolumenu; raporty CSP mogą zawierać URL/path, więc nie przesyłać ani nie logować identyfikatorów projektu, query stringów, danych klienta czy tokenów bez konieczności. `Report-Only` samo niczego nie blokuje i nie jest gotową ochroną.

HSTS ustawiać dopiero po potwierdzeniu, że wszystkie domeny/subdomeny objęte dyrektywą są stale dostępne wyłącznie przez HTTPS. `Permissions-Policy` dobrać do realnych funkcji; nie blokować funkcji wymaganych przez przyszłe narzędzia pomiarowe bez testu.

## Mierzalne testy odbioru

1. Test wdrożeniowy sprawdza nagłówki dla `GET /`, wersjonowanego JS/CSS, trasy API, MCP, prywatnego PDF/CSV, błędu i nieistniejącej trasy; raport wskazuje oczekiwaną politykę dla każdej rodziny odpowiedzi. Wdrożenie Vercel testowane osobno, bo lokalny Express nie emuluje całej dystrybucji statycznych plików.
2. W środowisku testowym CSP Report-Only przejść wszystkie krytyczne przepływy dla Chrome/Edge i Firefox; zero niewyjaśnionych naruszeń `script-src`, `connect-src`, `img-src` i `style-src`. Udokumentować zatwierdzone wyjątki z właścicielem, zasobem i powodem.
3. Po włączeniu wymuszonej CSP UI ładuje projekt, renderuje sceny 2D/3D i materiały, zapisuje zmiany oraz tworzy i pobiera PDF/CSV; brak błędów CSP w konsoli i w kontrolowanym raporcie.
4. Test framingu potwierdza, że strona aplikacji nie renderuje się w obcej ramce. Test błędów i assetów potwierdza brak nieoczekiwanych MIME sniffing oraz brak osłabienia cache dla danych prywatnych.
5. Raporty naruszeń nie zawierają identyfikatorów klienta/projektu, danych z formularzy, query stringów ani nagłówków uwierzytelnienia; endpoint raportujący ma limit częstotliwości/rozmiaru lub jest realizowany przez kontrolowany dostawczy collector.

## Priorytet, zależności i status

**P1:** inwentaryzacja rzeczywistych nagłówków i CSP Report-Only. Zależności: lista zewnętrznych zasobów produkcyjnych, decyzja o osadzaniu aplikacji w iframe, przegląd pełnego workflow 3D/PDF.

**P1 przed rolloutem CSP enforce:** naprawić naruszenia i zatwierdzić wyjątki; uruchomić integracyjne testy przeglądarkowe i nagłówków na deploy preview.

**Miernik:** 100% odpowiedzi interfejsu/API objętych określoną polityką; wszystkie kluczowe przepływy działają pod egzekwowaną CSP; brak nieuzasadnionych wyjątków `unsafe-*`; brak wrażliwych danych w raportach. Nie jest to dowód auth ani ochrony endpointów.

## Ograniczenia

Nie wykonywano żądań do produkcji ani nie odczytywano konfiguracji Vercel. Nie stwierdzam, że produkcyjne odpowiedzi faktycznie nie mają tych nagłówków. Brak nagłówków nie tworzy sam z siebie exploita i CSP nie naprawia błędów aplikacji.

## Źródła

- Vercel `vercel.json` — wersjonowana konfiguracja zawiera właściwość `headers`: https://vercel.com/docs/project-configuration/vercel-json
- OWASP Content Security Policy Cheat Sheet — dostarczanie CSP nagłówkiem, report-only, ograniczenia inline i `frame-ancestors`: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
- MDN `Content-Security-Policy-Report-Only` — bezegzekucyjna obserwacja naruszeń i konfiguracja reportingu: https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only
- OWASP HTTP Headers Cheat Sheet — `nosniff`, Referrer Policy, CSP, cache: https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html

## Pliki sprawdzone

- `vercel.json` — bez repozytoryjnej konfiguracji `headers`.
- `src/server/app.ts` — wybrane nagłówki PDF, bez wspólnego middleware security headers.
- `web/index.html`, `web/src` — obecny HTML, favicon data SVG i widoczne wywołania sieciowe.
