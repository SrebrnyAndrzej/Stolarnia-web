# Pan Stolarz 2.0 — porównanie projektu z implementacją

## Dowody

- Source visual truth: `qa/reference-v2.png` (wybrana makieta w brandingu Pan Stolarz).
- Implementation: `qa/owner-desktop.png`; lokalny Chromium, 1488×1056 CSS px, deviceScaleFactor=1.
- Wspólne zestawienie: `qa/visual-comparison.png`, 2976×1100 px. Obrazy zestawiono w jednym dokumencie i obejrzano razem. Źródło ma 1490×1056 px, zostało proporcjonalnie dopasowane do pola 1488×1056; implementacja jest 1:1.
- Stan: podgląd właściciela, dane przykładowe, wizualizacja inspiracyjna. Prawdziwy zalogowany widok właściciela ma osobno testowane przyciski ofert i projektanta. Makieta nie jest dowodem działania sesji.
- Mobile: `qa/client-mobile.png`, viewport 390×844; brak przepełnienia dokumentu potwierdzony testem przeglądarkowym.

## Kontrole

- Typografia: font systemowy z polskimi znakami, czytelne kwoty i jednostki; źródło i implementacja mają zbliżony język bezszeryfowy. Implementacja jest miejscami bardziej kompaktowa niż makieta.
- Układ: zachowano grafitową nawigację, listę projektów, duży obszar podglądu i prawy inspektor. Dodatkowy pasek demonstracyjny i osobny wybór widoku przesuwają treść względem makiety.
- Kolory: użyto rzeczywistych kolorów logo #1C2B30 i #A5B859, jasnych powierzchni i grafitowego tekstu.
- Obrazy: oryginalny PNG logo, bez odtwarzania znaku; wygenerowana wizualizacja wnętrza odpowiada kierunkowi, ma jawny status poglądowy. Rysunek techniczny pochodzi z istniejącego renderera i nie udaje fotograficznej elewacji z makiety.
- Treści: zamiast fikcyjnych istniejących klientów są syntetyczne projekty. Demonstracja nie udaje generowania ofert ani zapisu. Prawdziwe wyceny i przejścia są dostępne właścicielowi po skonfigurowaniu kont.
- Interakcje: sześć testów Chromium i axe opisanych w QA-REPORT.md. W testowanych stanach sprawdzono błędy konsoli i podstawowe stany formularza, wyszukiwania oraz odmowy dostępu.

## Historia korekt

1. P2: nagłówek strony klienta przekraczał ekran telefonu. Przywrócono poprawne łamanie; ponowne zrzuty i test szerokości 390 px bez przepełnienia dokumentu.
2. P2: szczegółowy selektor zmniejszał kwotę w inspektorze. Dodano właścicielski wariant typografii kwoty i ponownie obejrzano zrzut.
3. P2: obraz miał dodatkową wysokość wynikającą z zachowania elementu inline. Ustawiono display:block. Zwiększono pola dotykowe kompaktowych kontrolek do 44 px.
4. Testy ujawniły koszt inicjalizacji 3D przed pierwszym pokazaniem rzeczywistego projektu. Domyślnym widokiem danych technicznych jest teraz 2D; 3D uruchamia użytkownik. To jawna różnica funkcjonalna względem wizualizacji marketingowej.

## Pozostałe różnice do kolejnej iteracji

- P2: kompaktowe rozmiary tekstu, pionowe proporcje głównego obszaru i widoczność elewacji w pierwszym ekranie nadal odbiegają od wybranej makiety. Zestawienie dokumentuje tę różnicę; nie deklarujemy zgodności pikselowej.
- P2: źródło przedstawia bogatszą prezentację konkretnego projektu niż renderer dostępny obecnie z silnika. Dalsza poprawa podglądu powinna korzystać z rzeczywistej geometrii i zapisanych wizualizacji projektu, zamiast przypisywać tę samą fotografię różnym meblom.
- Brak sprawdzenia na fizycznym telefonie i prawdziwych kontach. Konta/migracja wymagają odrębnego uruchomienia według docs/PAN-STOLARZ-2.0.md.

final result: blocked

Status dotyczy pełnego odbioru wizualnego i nie unieważnia zaliczonych testów kodu. Ta gałąź jest konkretną wersją roboczą do przeglądu, nie ukończoną publikacją strony 2.0.
