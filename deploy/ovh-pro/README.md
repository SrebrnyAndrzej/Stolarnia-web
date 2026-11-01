# Obecny hosting Pro + Supabase

Aktualna decyzja użytkownika: nie kupować VPS, użyć istniejącego hostingu Pro na panstolarz.pro. Wycena VPS anulowana. Pliki `deploy/ovh` dotyczą odłożonego wariantu VPS; nie instalować systemd/Caddy na hostingu współdzielonym.

Frontend Vite jest statyczny. Dekory, logotypy, animacje, pliki przykładowe i kreator mogą być publikowane z `dist/web`. Katalog dekorów generowany jest przed buildem do `/catalog/decors.json`, aby nie wymagał funkcji Node ani połączenia z bazą firmy. Nie kopiować `.env`, `.git`, `data/` ani sekretów na publiczny hosting.

Samo wysłanie `dist/web` nie uruchamia API: sesje, zapytania, zadania, kalkulator i generowanie PDF nadal używają endpointów Express. Na pierwsze przełączenie zachować istniejące API Vercel oraz Supabase; integracja same-origin/proxy wymaga osobnej konfiguracji i testów cookies, origin, błędów i dokumentacji. Nie publikować formularza udającego poprawny zapis, jeśli API jest niedostępne. Pełne odejście od Vercela wymaga przeniesienia tych endpointów np. do Supabase Edge Functions lub odpowiednika na obecnym hostingu; nie oznacza przeniesienia samej bazy.

Przed uploadem ustalić dokładny webroot, aktywne SSL, uprawnienia i wykonać backup obecnych plików. Wysyłać do nowego katalogu wydania, przetestować, dopiero potem zmienić przypisanie witryny. DNS WWW i rekordy poczty pozostawić w obecnym stanie, jeśli domena nadal korzysta z tego hostingu. Nie podmieniać `www` bez backupu.

Dostęp do Managera nie jest automatycznie dostępem do SFTP/SSH. Host wskazany przez użytkownika: `ssh.cluster131.hosting.ovh.net`. Host, login i fingerprint zweryfikować dla konkretnej usługi. Nie resetować hasła ani nie ujawniać go w czacie.

## Odczyt istniejącego konta

Zalogowany Manager potwierdził: użytkownik `panstoa`, katalog domowy `/homez.1659/panstoa`, witryna `Website-www` w `./www`; domena główna i www mają aktywne SSL. SFTP: `sftp.cluster131.hosting.ovh.net:22`. SSH: `ssh.cluster131.hosting.ovh.net`, tryb konta „Tylko SFTP”. Brak potrzeby zmiany DNS. Próba połączenia TCP z hostem SSH z tego środowiska zakończyła się odmową — nie potwierdza to błędnego hasła, bo uwierzytelnienie nie rozpoczęło się.

Panel zawiera przycisk „Wygeneruj klucz SSH”, ale nie zweryfikowano, czy pozwala on importować klucz dla logowania przychodzącego; nie traktować samej nazwy przycisku jako potwierdzenia. Nie wygenerowano ani nie pobrano kluczy i nie zmieniono haseł. Do publikacji wciąż potrzebny dostęp do plików, odrębny od sesji WWW OVH.
