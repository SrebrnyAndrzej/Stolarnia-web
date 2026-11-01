# Workflow warsztatu: właściciel, produkcja, montaż (v1, 1.11.2026)

Cel: jedna ścieżka zlecenia od pomiaru do odbioru. Każda rola widzi w panelu tylko swój etap i dostaje dokumenty w jednym schemacie.

Stan wdrożenia oznaczam przy każdej części:
- ✅ zrobione;
- ◻ plan;
- ❓ decyzja Mateusza.

## 1. Przepływ zlecenia

| Etap (status) | Kto | Co robi | Wejście → wyjście | Dokument |
|---|---|---|---|---|
| Szkic | Właściciel | pomiar, projekt, wizualizacja 3D | wymiary → projekt w aplikacji | — |
| Wycena | Właściciel | oferta, uzgodnienie ceny, umowa | projekt → cena uzgodniona, umowa | oferta, umowa |
| Zaakceptowany | Właściciel | **wydaje rewizję do produkcji** (zamrożenie) | projekt → wydanie nr N | — |
| W zamówieniu | Właściciel | zamawia płyty i okucia według rozkroju | wydanie → zamówienia | rozkrój, CSV formatek |
| Produkcja | Produkcja | rozkrój → okleinowanie → wiercenie → składanie | wydanie → gotowe korpusy i fronty | **pakiet produkcyjny P** |
| Gotowe do montażu | Montaż | pakowanie, transport, montaż, odbiór | gotowe elementy → zamontowana zabudowa | **pakiet montażowy M** |
| Zakończony | Właściciel | zamyka uwagi z protokołu, prosi o opinię | protokół → zamknięte zlecenie | protokół K |

Zasady:
1. **Produkcja i montaż pracują wyłącznie na wydaniu**, nigdy na bieżącym projekcie. Zmiana projektu po wydaniu wymaga nowego wydania. Panel ostrzega, jeśli wydania nie ma.
2. **Każdy problem to osobna uwaga** („Zgłoś uwagę / brak”), z podpisem roli i numerem mebla. Nie trzeba go szukać w rozmowach.
3. **Status zmienia osoba, która kończy etap:**
   - produkcja: „Gotowe do montażu”;
   - montaż: „Montaż zakończony” po podpisanym protokole;
   - pozostałe statusy: właściciel.

## 2. Panele ról (zakładka „Warsztat”) ✅

| Rola | Widzi | Może |
|---|---|---|
| Właściciel | wszystkie etapy, liczbę zleceń, następny krok i kto go robi, terminy montażu, liczbę otwartych uwag | przejść do projektu (wycena, wydania, umowy) |
| Produkcja | zlecenia „Zaakceptowany / W zamówieniu / Produkcja”, ostatnie wydanie, braki danych | pobrać pakiet P i karty szafek S, zgłosić uwagę, oznaczyć „Gotowe do montażu” |
| Montaż | zlecenia „Gotowe do montażu”, termin | pobrać pakiet M, zgłosić uwagę, oznaczyć „Montaż zakończony” |

**Ważne:** wybór roli porządkuje ekran, ale **nie jest zabezpieczeniem**. Aplikacja nie ma jeszcze kont, więc każdy z dostępem do adresu widzi wszystko, także ceny w zakładkach projektu. Prawdziwe konta i uprawnienia to etap 3 (sekcja 5).

## 3. Jeden schemat dokumentów ✅

Oba pakiety powstają z tej samej konstrukcji i tego samego wydania, w tym samym układzie strony:
- **lewy górny róg:** kod strony, np. `S-03`. Ten sam kod znaczy to samo w każdym pakiecie;
- **tytuł strony:** co jest na stronie; pod nim jedno zdanie, jak to czytać;
- **prawy górny róg:** projekt, numer wydania, rewizja, data, jednostki (mm) i stan: „GOTOWA DO PRODUKCJI” albo „DOKUMENT ROBOCZY”;
- **stopka:** nazwa pakietu (PRODUKCYJNY lub MONTAŻOWY), wersja generatora, numer strony.
- **numery mebli** są wspólne dla rzutu, elewacji, kart szafek, kolejności montażu i protokołu.

| Kod | Sekcja | Pakiet P | Pakiet M |
|---|---|---|---|
| T | strona tytułowa, stan pakietu, diagnostyka / lista „przed wyjazdem” | ✓ | ✓ |
| R | rzut z góry z numerami mebli | ✓ | ✓ |
| E | elewacje ścian (w M dodatkowo wysokość spodu każdego mebla nad podłogą) | ✓ | ✓ |
| I | indeks części | ✓ | |
| S | karta szafki: widoki, formatki, okucia, operacje | ✓ | |
| C | rysunek wykonawczy części z tabelą operacji | ✓ | |
| M | kolejność montażu na każdej ścianie (etap, pozycja od lewej, spód nad podłogą, okucia, ☐), okucia do zabrania | | ✓ |
| Z | karta złożenia szafki: rysunek rozstrzelony korpusu z etykietami formatek, kroki z ☐ (połączenia i liczba konfirmatów, plecy, przekątna kontrolna, podpórki, osie prowadnic, zawiasy, okucia, fronty), uwagi z konstrukcji | | ✓ |
| K | protokół odbioru: kontrola każdego mebla, lista usterek (kto, termin), podpisy | | ✓ |

Gdzie pobrać:
- **pakiet P:** `/api/projekty/:id/wydania/:wid/dokumentacja.pdf`;
- **pakiet M:** `/api/projekty/:id/wydania/:wid/montaz.pdf`;
- **wersja z bieżącej rewizji (tylko podgląd):** `/api/projekty/:id/montaz.pdf`.

Dane klienta (adres, telefon) są tylko w pakiecie M, na stronie tytułowej, z dopiskiem, żeby wydruk wrócił do biura. Pakiet P nie ma adresu, telefonu ani cen (na stronie tytułowej jest tylko nazwa klienta).

Etapy montażu w M:
1. dolne i słupki;
2. blat;
3. wiszące;
4. fronty;
5. wykończenie.

Kolejność na ścianie jest liczona od lewego końca ściany. Jeśli narożnik jest po prawej, instrukcja mówi, żeby zacząć od narożnika.

## 4. Czego jeszcze brakuje (jawnie)

- **Karta złożenia szafki (Z)** ✅ od 1.11.2026. Czego nie ma w konstrukcji, karta mówi wprost (na czerwono): sposób mocowania pleców nakładanych, zawieszki do ściany, wysokości prowadnic bez zatwierdzonego profilu. Przekątna to wartość nominalna z wymiarów; dopuszczalna różnica przekątnych 2 mm (Mateusz, 1.11.2026).
- **Okucia montażowe do ściany** (zawieszki, listwa montażowa, kołki): nie ma ich w konstrukcji. Lista M pokazuje tylko okucia z mebli i mówi to wprost.
- **Kierunek montażu od narożnika:** silnik nie zapisuje, gdzie jest narożnik. Dziś jest tylko reguła tekstowa.
- **Stare rysunki montażowe** (`scripts/rysunki-montazowe.ts` z ręcznego JSON, np. Natalia) nie korzystają jeszcze ze schematu. Do przeniesienia, gdy konstrukcja tych projektów będzie w silniku.
- **Protokół** jest papierowy (druk, podpis). Wersja w aplikacji (pozycje usterek, zdjęcia, powiązanie z wydaniem) jest opisana w `RESEARCH-odbior-montaz-reklamacje-2026-10-06.md`.

## 5. Plan dalszych etapów

| Etap | Zakres | Zależność |
|---|---|---|
| 2 ◻ | Karta pracy produkcji: stanowiska (rozkrój, okleinowanie, wiercenie, składanie, kontrola), postęp ilościowy, blokady, etykiety z QR na formatki (`RESEARCH-karta-podrozy…`) | ❓ stanowiska i drukarka etykiet — warsztat z pracownikami |
| 3 ◻ | Konta i uprawnienia: właściciel / produkcja / montaż; serwer odcina ceny, umowy i dane klienta według roli; pracownik widzi tylko przypisane zlecenia (`RESEARCH-macierz-autoryzacji-tras…`) | ❓ zgoda na migrację Supabase (produkcja) |
| 4 ◻ | Protokół i usterki w aplikacji: pozycje z numerem mebla, zdjęcia, osoba odpowiedzialna, termin; podgląd z telefonu montażysty | etap 3 (dane klienta i zdjęcia wymagają kont) |
| 5 ◻ | Przydział zleceń i kalendarz montaży | etap 3 |

## 6. Decyzje Mateusza

1. ✅ Produkcja zmienia status na „Gotowe do montażu”, montaż na „Zakończony” (Mateusz, 1.11.2026).
2. ✅ Montażysta nie widzi cen ani umowy (Mateusz, 1.11.2026) — do wymuszenia w etapie 3 (konta).
3. ✅ Ekipa: 2 montażystów — to oni dostają dokumentację (Mateusz, 1.11.2026). Pakiet M ma pola na obu: ekipa na stronie T, „złożył / sprawdził” na każdej karcie Z, dwa podpisy montażystów w protokole K. ❓ Czy korpusy składają w warsztacie, czy na miejscu; stanowiska produkcji i etykiety — do ustalenia.
4. ❓ Czy pakiet M ma być też w wersji na telefon (to samo w HTML)?
5. ❓ Kiedy wprowadzamy konta (wymaga migracji bazy na Supabase).
