-- Staff accounts (owner creates employees). Additive only: no data rewrite, no role changes.
-- Functions describe a staff member's work; they do not grant owner permissions.
alter table public.pan_stolarz_members add column if not exists job_role text not null default 'Pracownik'
  check (char_length(job_role) between 1 and 80);
-- Idempotency key of the owner's "create employee" operation (retry returns the same account).
alter table public.pan_stolarz_members add column if not exists creation_id uuid;
create unique index if not exists pan_stolarz_members_creation_id on public.pan_stolarz_members(creation_id) where creation_id is not null;
