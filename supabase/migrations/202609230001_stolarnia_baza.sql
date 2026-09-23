-- Magazyn używany przez src/store/store.ts. Bez danych ani kluczy konkretnego konta.
begin;

create table if not exists public.stolarnia_baza (
  id text primary key,
  dane jsonb not null check (jsonb_typeof(dane) = 'object'),
  wersja integer not null default 1 check (wersja > 0),
  zmieniono timestamptz not null default now()
);

alter table public.stolarnia_baza enable row level security;

-- Aplikacja korzysta z bazy wyłącznie przez backend Vercel.
-- Brak publicznych polityk SELECT/INSERT/UPDATE/DELETE.
revoke all on table public.stolarnia_baza from anon, authenticated;
grant select, insert, update on table public.stolarnia_baza to service_role;

comment on table public.stolarnia_baza is
  'Prywatna baza Stolarni. Dostęp tylko z backendu; wersja chroni przed równoległym nadpisaniem.';

commit;
