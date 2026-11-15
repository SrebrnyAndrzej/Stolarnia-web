# Obecny hosting Pro + Supabase

Aktualna decyzja użytkownika: nie kupować VPS, użyć istniejącego hostingu Pro na panstolarz.pro. Wycena VPS anulowana. Pliki `deploy/ovh` dotyczą odłożonego wariantu VPS; nie instalować systemd/Caddy na hostingu współdzielonym.

Frontend Vite jest statyczny. Dekory, logotypy, animacje, pliki przykładowe i kreator mogą być publikowane z `dist/web`. Katalog dekorów generowany jest przed buildem do `/catalog/decors.json`, aby nie wymagał funkcji Node ani połączenia z bazą firmy. Nie kopiować `.env`, `.git`, `data/` ani sekretów na publiczny hosting.

Samo wysłanie `dist/web` nie uruchamia API: sesje, zapytania, zadania, kalkulator i generowanie PDF nadal używają endpointów Express. Na pierwsze przełączenie zachować istniejące API Vercel oraz Supabase; integracja same-origin/proxy wymaga osobnej konfiguracji i testów cookies, origin, błędów i dokumentacji. Nie publikować formularza udającego poprawny zapis, jeśli API jest niedostępne. Pełne odejście od Vercela wymaga przeniesienia tych endpointów np. do Supabase Edge Functions lub odpowiednika na obecnym hostingu; nie oznacza przeniesienia samej bazy.

Przed uploadem ustalić dokładny webroot, aktywne SSL, uprawnienia i wykonać backup obecnych plików. Wysyłać do nowego katalogu wydania, przetestować, dopiero potem zmienić przypisanie witryny. DNS WWW i rekordy poczty pozostawić w obecnym stanie, jeśli domena nadal korzysta z tego hostingu. Nie podmieniać `www` bez backupu.

Dostęp do Managera nie jest automatycznie dostępem do SFTP/SSH. Host wskazany przez użytkownika: `ssh.cluster131.hosting.ovh.net`. Host, login i fingerprint zweryfikować dla konkretnej usługi. Nie resetować hasła ani nie ujawniać go w czacie.

## Odczyt istniejącego konta

Zalogowany Manager potwierdził: użytkownik `panstoa`, katalog domowy `/homez.1659/panstoa`, witryna `Website-www` w `./www`; domena główna i www mają aktywne SSL. SFTP: `sftp.cluster131.hosting.ovh.net:22`. SSH: `ssh.cluster131.hosting.ovh.net`, tryb konta „Tylko SFTP”. Brak potrzeby zmiany DNS. Próba połączenia TCP z hostem SSH z tego środowiska zakończyła się odmową — nie potwierdza to błędnego hasła, bo uwierzytelnienie nie rozpoczęło się.

Panel zawiera przycisk „Wygeneruj klucz SSH”, ale nie zweryfikowano, czy pozwala on importować klucz dla logowania przychodzącego; nie traktować samej nazwy przycisku jako potwierdzenia. Nie wygenerowano ani nie pobrano kluczy i nie zmieniono haseł. Do publikacji wciąż potrzebny dostęp do plików, odrębny od sesji WWW OVH.

## Wariant wdrożenia przez Git

OVH dokumentuje integrację `Moje strony → ... → Połącz Git`. Repozytorium projektu jest publiczne, więc gałąź z gotowym buildem można pobrać przez HTTPS bez hasła SFTP. Wymaganie pustego katalogu trzeba sprawdzić przed powiązaniem; nie wymuszać nadpisania istniejącego www. Źródła aplikacji nie są pakietem statycznym — do hostingu przygotowywana jest osobna gałąź wydania.

`node scripts/paczka-ovh-pro.mjs` po buildzie tworzy `dist/ovh-pro`: frontend, `.htaccess` i `api-proxy.php`. Most PHP ma stały upstream `https://backend.panstolarz.pro`, nie przekazuje dowolnych nagłówków odpowiedzi i nie podąża za redirectami. Przekazuje sesję i origin do istniejącego API, ogranicza rozmiar żądania, zachowuje weryfikację TLS. Brak API pokazuje 503, nie pozorny sukces. Serwer wymaga rozszerzenia PHP cURL.

W Vercelu dodano `api.panstolarz.pro` do gałęzi `feat/pan-stolarz-v2` i ustawiono dla niej `PAN_STOLARZ_ORIGIN=https://panstolarz.pro`. Na chwilę tego wpisu rekord DNS API nie został jeszcze dodany. Zalecany CNAME zwrócony przez Vercel: `51b83f3d15d2beba.vercel-dns-017.com.`. Sprawdzić ponownie przed zmianą. Nie zmieniać A/AAAA domeny głównej ani MX. Chroniona produkcyjna baza i konfiguracja logowania Supabase pozostają osobnym warunkiem uruchomienia kont.

### Potwierdzona alternatywa bez SFTP

Dokładne sprawdzenie panelu potwierdziło, że FTP Explorer/Net2FTP jest wycofany. W sekcji FTP nie potwierdzono importu klucza do logowania przychodzącego. Oddzielna integracja Git w „Moje strony” jest dostępna; wymaga pustego katalogu. Nie czyścić istniejącego `www`. Docelowy testowy katalog to `panstolarz-v2`, a podgląd `podglad.panstolarz.pro`, po jego utworzeniu w panelu.

Publiczne repozytorium `https://github.com/SrebrnyAndrzej/Stolarnia-web.git`, osobna gałąź `deploy/ovh-pro`, zawiera gotowy statyczny build i most PHP. Nie dodawać do niej sekretów ani kodu/konfiguracji bazy. Na tej gałęzi wyłączono zbędne deploye Vercel. Nie zapisujemy automatycznie wygenerowanych tokenów webhooków w dokumentacji ani w repo.


### Odczyt uruchomionego zaplecza

Utworzono dodatkową produkcyjną domenę backend.panstolarz.pro z certyfikatem TLS. Potwierdzono HTTP 200 dla katalogu systemów szuflad i obliczenia LW=564/NL=550. `/api/v2/config` zwraca `authReady:false` — to istniejący brak konfiguracji Auth, nie dowód uruchomionych kont. Nie zmieniano bazy ani migracji danych. Domena api.panstolarz.pro pozostała powiązana z preview i nie jest używana przez finalny most PHP.

Podgląd OVH odpowiada pod https://podglad.panstolarz.pro, katalog panstolarz-v2. Przed zmianą domeny głównej sprawdzić, czy OVH pobrał najnowszy commit gałęzi deploy/ovh-pro, w szczególności most PHP z backend.panstolarz.pro. Samo HTTP 200 index.html nie dowodzi poprawnego API.
