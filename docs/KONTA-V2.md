# Konta v2 i profile dostępu — instrukcja dla Mateusza

Stan: 2026-11-02, gałąź `v2-integracja` (lokalnie, bez push i bez deployu). Nic z poniższego nie zostało uruchomione na Supabase — uruchamiasz sam.

## Co robi kod

- Logowanie bez zmian: ciasteczko httpOnly, tabela `pan_stolarz_members` (role `owner` / `employee`).
- Nowa kolumna `access_profile` pracownika: `sprzedaz`, `produkcja` albo `montaz`. Funkcja (`job_role`) jest tylko opisem.
- Serwer egzekwuje uprawnienia w `src/server/uprawnienia.ts`: macierz tras (trasa bez reguły = 403), dostęp do projektu i filtr pól odpowiedzi.

| Profil | Może | Nie widzi / nie może |
|---|---|---|
| Właściciel | wszystko (także MCP, konta, cenniki, wydania, umowy) | — |
| Sprzedaż i projekt | wszystkie projekty, konstrukcja, szybki projekt, wycena (ceny ofertowe, cena uzgodniona), oferta PDF, szkice, umowy (odczyt), podgląd dokumentacji | kosztów zakupu, marży, narzutu, cen jednostkowych, cenaNetto/rabatu materiałów i okuć, kwot w opisach, stawek; zapisu umów, cenników, ustawień, wydań, kont, MCP; cenę uzgodnioną i status zmienia tylko w Szkic/Wycena |
| Produkcja | przydzielone projekty: wydania, pakiet P (PDF bez danych klienta), uwagi, status Produkcja → Gotowe do montażu, kalkulator szuflad, zadania | cen, umów, nazwy/telefonu/adresu/e-maila klienta, notatek CRM, wyceny, konstrukcji, pakietu M |
| Montaż | przydzielone projekty: wydania, pakiet M (z adresem i kontaktem), uwagi, status Gotowe do montażu → Zakończony, zadania | cen, umów, notatek CRM, wyceny, konstrukcji, pakietu P |

Pracownik bez profilu (np. przed migracją) dostaje najwęższy profil: produkcja. Konta właściciela nie da się zmienić przez API (aktualizacja dotyczy tylko wierszy `role = 'employee'`, własnego konta nie zmienisz) — ostatni właściciel jest chroniony.

## Kolejność

1. Migracje wcześniejsze, jeśli jeszcze nie są na bazie: `202610310001_pan_stolarz_access.sql`, `202611010001_workshop_tasks.sql`, `202611010002_staff_accounts.sql`.
2. Migracja `202611010003_access_profile.sql` (poniżej).
3. Wiersz właściciela (poniżej).
4. Dopiero potem deploy kodu. (Kod działa też przed krokiem 2 — pracownicy dostają wtedy profil produkcja — ale lista pracowników u właściciela wymaga kolumny.)

## SQL do Supabase SQL Editor (projekt `ybzriunkihgbriytinij`)

### Migracja 0003 (addytywna, można uruchomić ponownie)

```sql
alter table public.pan_stolarz_members add column if not exists access_profile text not null default 'sprzedaz';
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'pan_stolarz_members_access_profile_check'
      and conrelid = 'public.pan_stolarz_members'::regclass
  ) then
    alter table public.pan_stolarz_members
      add constraint pan_stolarz_members_access_profile_check
      check (access_profile in ('sprzedaz', 'produkcja', 'montaz'));
  end if;
end $$;
```

Uwaga: istniejący pracownicy dostaną `sprzedaz` (wartość domyślna). Jeśli masz już konta montażystów, ustaw im profil w panelu „Pracownicy” albo:
`update public.pan_stolarz_members set access_profile = 'montaz' where user_id = '<uuid>' and role = 'employee';`

### Wiersz właściciela

Konto `17d4e507-db92-4a51-b311-f850587d2489` musi już istnieć w Authentication → Users (inaczej klucz obcy odrzuci wstawienie).

```sql
insert into public.pan_stolarz_members (user_id, role, display_name, active, project_ids, job_role)
values ('17d4e507-db92-4a51-b311-f850587d2489', 'owner', 'Mateusz', true, '{}', 'Właściciel')
on conflict (user_id) do update
  set role = 'owner', active = true;
```

Kolumny i wartości z migracji: `role` ∈ (`owner`, `employee`, `client`), `display_name` text, `active` boolean, `project_ids` text[], `job_role` 1–80 znaków (migracja 0002), `access_profile` (0003, dla właściciela bez znaczenia).

### Sprawdzenie

```sql
select user_id, role, active, display_name, job_role, access_profile, project_ids
from public.pan_stolarz_members order by role, display_name;
```

## Zespół (decyzja 2026-11-01)

Dwóch montażystów: po utworzeniu kont w „Pracownicy” wybierz profil „Montaż” i zaznacz projekty, które mają widzieć.
