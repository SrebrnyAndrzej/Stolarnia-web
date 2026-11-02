-- Profil dostępu pracownika (decyzje Mateusza 2026-11-01). Addytywna: istniejące wiersze dostają wartość domyślną,
-- żadne dane nie są przepisywane, role owner/employee/client bez zmian.
--   sprzedaz  — projekt, konstrukcja, szybki projekt, wycena i oferta (ceny ofertowe); bez kosztów zakupu i marży;
--   produkcja — wydania i pakiet P, uwagi, status Produkcja → Gotowe do montażu; bez cen, umów i kontaktu klienta;
--   montaz    — wydania i pakiet M (z adresem i kontaktem), uwagi, status Gotowe do montażu → Zakończony; bez cen i umów.
-- Uprawnienia egzekwuje serwer (src/server/uprawnienia.ts); kolumna nie ma znaczenia dla wierszy właściciela.
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
