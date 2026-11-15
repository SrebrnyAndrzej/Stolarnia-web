# OVH — panstolarz.pro

Status: pakiet przygotowany, nie zainstalowany na OVH. Wymaga VPS/serwera z Linux, Node.js 24, systemd i Caddy. Zwykły hosting WWW nie gwarantuje tych możliwości. Nie kupiono usługi ani nie zmieniono DNS.

## Potwierdzone publicznie 01.11.2026

- NS: dns200.anycast.me, ns200.anycast.me (OVH).
- A domeny: 87.98.236.253. To aktualna obserwacja DNS, nie potwierdzony adres nowego serwera.
- Przed zmianami spisać A/AAAA/CNAME, MX i TXT oraz istniejące strony/usługi na serwerze. Zachować konfigurację poczty.

## Zakres pierwszego przełączenia

Przenieść Express i statyczny frontend na OVH. Zachować istniejący Supabase jako źródło danych i Auth do czasu osobno zweryfikowanego eksportu, odtworzenia i migracji logowania. Nie uruchamiać pustej lokalnej bazy jako zamiennika firmy. `preflight.mjs` zatrzymuje start usługi bez wymaganej konfiguracji. Sprawdzenie obecności klucza nie potwierdza uprawnień ani migracji.

## Instalacja po uzyskaniu SSH

1. Sprawdzić system, wolny dysk/RAM, dostępne porty 80/443/3210, działające usługi, właścicieli katalogów i konfigurację domen. Nie nadpisywać istniejącej aplikacji ani globalnego Caddyfile.
2. Utworzyć osobnego użytkownika systemowego `panstolarz`, katalog `/srv/pan-stolarz/releases`, trwały `/var/lib/pan-stolarz`. Port aplikacji 3210 pozostaje wewnętrzny; firewall nie udostępnia go publicznie.
3. Zbudować konkretny commit: `npm ci`, `npm run typecheck`, testy, `npm run build`. Przenieść release (bez .env, data/, .git, QA i sekretów). W release: dist/, docs/materialy/katalog-dekorow-PL.json, docs/materialy/egger-warianty-program-dostaw-PL.json, docs/materialy/obrazy/, docs/okucia/produkty/katalog.json, docs/okucia/produkty/obrazy/, src/export/assets/, package.json, package-lock.json, deploy/ovh/. Zainstalować zależności `npm ci --omit=dev`. Sprawdzić zgodność architektury środowiska i modułów.
4. Konfigurację wpisać bezpośrednio do chronionego `/etc/pan-stolarz/app.env` według przykładu. Nie przesyłać jej w czacie. Ustawić origin `https://panstolarz.pro`; zweryfikować również konfigurację URL-i i przekierowań Supabase Auth oraz poczty.
5. Utworzyć `current` jako symlink do sprawdzonego release, zainstalować usługę systemd. Kod i zależności tylko do odczytu dla konta usługi. Pliki tymczasowe obsługuje PrivateTmp, trwałe /var/lib/pan-stolarz; eksporty i uploady przejrzeć przed dopuszczeniem zapisów.
6. Zbadać `/healthz`, stronę, katalog, logotypy, kalkulator i PDF. Przed publicznym loginem wymagane HTTPS. Dostęp wewnętrzny do testów przez tunel SSH, bez otwierania portu aplikacji światu. Konfigurację Caddy sprawdzić przez `caddy validate`; dostosować do istniejącego serwera.
7. Po testach: zmienić tylko wymagane rekordy WWW na potwierdzony adres serwera, sprawdzić AAAA (nie może kierować na stary serwer), certyfikat oraz przekierowania. Obecny Caddyfile obejmuje domenę główną; www dodać dopiero po sprawdzeniu jego DNS i oczekiwanego przekierowania.
8. Testy końcowe: formularz zapytania, prawdziwe konta właściciela i dwóch pracowników, odmowy dostępu, sesje, zapis zadania i historia, projekty/2D/3D, wydania/PDF, logotypy, dekory i eksport szkicu. Nie oznaczać funkcji bez skonfigurowanej bazy jako gotowych.

## Dane i wycofanie

Przed migracją bazy wykonać backup SQL i plików, próbne odtworzenie, porównanie rekordów i cen, mapowanie UUID kont oraz plan sesji. Zadania wymagają osobnej migracji SQL znajdującej się w repo. Bez potwierdzenia nie inicjalizować nowej bazy ani kont demonstracyjnych w danych firmy.

Zachować poprzedni release i rekordy DNS. Przed rollbackiem zatrzymać zapisy nowego środowiska, ustalić źródło prawdy i ewentualne zmiany schematu. Sam powrót DNS nie cofa danych. Przy wspólnej bazie unikać równoczesnego używania starszych endpointów z innymi regułami biznesowymi. Dla końcowego przeniesienia całej infrastruktury potrzebny jest osobno Supabase self-host albo wymiana Auth/PostgREST; sam systemd nie migruje tych usług.
