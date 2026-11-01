# Odczyt konta OVH przed migracją

Źródło: zalogowany OVH Manager przez TinyFish; odczyt 01.11.2026. Nie wykonano zmian usług, zamówień, DNS ani haseł.

## Usługi

- Hosting aktywny: **Pro**, `panstoa.cluster131.hosting.ovh.net`, cluster131, region eu-west-gra, PHP 8.2.
- SFTP dostępne; SSH użytkownika hostingowego wyłączone. Włączenie tego SSH nie daje środowiska systemd/root ani gwarancji obsługi stałego Node.js.
- W panelu nie znaleziono VPS-ów ani serwerów dedykowanych.
- Ten pakiet nie jest celem przygotowanej instalacji Express + Node 24. Do uruchomienia całej aplikacji na OVH potrzebne jest odpowiednie środowisko serwerowe.

## WWW i poczta

- A domeny głównej i www: `87.98.236.253`.
- AAAA domeny głównej i www: `2001:41d0:301:5::31`.
- MX: `mx1.mail.ovh.net` priorytet 1, `mx2.mail.ovh.net` priorytet 5. Zachować pocztę.
- SPF wskazuje `include:mx.ovh.com -all`; nie zmieniać przy przenoszeniu WWW.
- `ftp` wskazuje CNAME domeny głównej: przełączenie A domeny zmieni też adres tego aliasu. Przed przełączeniem ustalić, czy jest używany do starego hostingu, i w razie potrzeby zachować właściwy cel.
- Istnieją wpisy TXT przekierowania/welcome — sprawdzić ich rolę przed przełączeniem.
- Publiczny resolver potwierdził NS: `dns200.anycast.me` i `ns200.anycast.me`. Raport automatu miał literówkę `s200`; nie kopiować jej do konfiguracji.
- Widoczne TTL 0 w panelu oznacza ustawienie do wyjaśnienia/dziedziczenie, nie natychmiastową propagację; publiczny resolver zwrócił 3600 s.

Przed zmianami wykonać pełny eksport strefy przez OVH i zachować go prywatnie. Ten dokument nie zastępuje pełnego eksportu DNS.

## Dalszy krok

Przygotować wycenę VPS 4 vCPU / 8 GB RAM, Linux, rozliczenie miesięczne bez wieloletniego zobowiązania. To rekomendacja startowa, nie wynik pomiaru obciążenia. Cena, dostępność regionu i okres rozliczeń muszą pochodzić z konkretnej konfiguracji. Nie kupiono serwera. Nie anulować istniejącego hostingu: zależności poczty, kopie i rozliczenia wymagają osobnego sprawdzenia.
