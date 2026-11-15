-- Single Pan Stolarz workshop. No migration of the existing project JSON or prices.
create table if not exists public.pan_stolarz_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'employee', 'client')),
  display_name text not null default '',
  active boolean not null default true,
  project_ids text[] not null default '{}'
);
alter table public.pan_stolarz_members enable row level security;
revoke all on public.pan_stolarz_members from anon, authenticated;
grant select, insert, update, delete on public.pan_stolarz_members to service_role;

create table if not exists public.pan_stolarz_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  kind text not null check (kind in ('kuchnia','szafa','inne')),
  city text not null,
  description text not null,
  status text not null default 'nowe'
);
alter table public.pan_stolarz_requests enable row level security;
revoke all on public.pan_stolarz_requests from anon, authenticated;
grant select, insert on public.pan_stolarz_requests to service_role;

create table if not exists public.pan_stolarz_request_limits (
  bucket text primary key,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);
alter table public.pan_stolarz_request_limits enable row level security;
revoke all on public.pan_stolarz_request_limits from anon, authenticated;
grant select, insert, update, delete on public.pan_stolarz_request_limits to service_role;
create index if not exists pan_stolarz_limits_window on public.pan_stolarz_request_limits(window_start);

-- Atomic, shared across Vercel instances. The bucket is a server-side HMAC,
-- never the visitor's raw IP. Retrying the same submission does not duplicate it.
create or replace function public.pan_stolarz_submit_request(payload jsonb, bucket_key text, submission_id uuid)
returns uuid language plpgsql security invoker set search_path = public, pg_temp as $$
declare used integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(bucket_key, 0));
  if exists(select 1 from public.pan_stolarz_requests where id = submission_id) then
    return submission_id;
  end if;
  delete from public.pan_stolarz_request_limits where window_start < now() - interval '2 days';
  insert into public.pan_stolarz_request_limits as limits(bucket, window_start, request_count)
    values(bucket_key, now(), 1)
    on conflict(bucket) do update set
      request_count = case when limits.window_start < now() - interval '1 hour' then 1 else limits.request_count + 1 end,
      window_start = case when limits.window_start < now() - interval '1 hour' then now() else limits.window_start end
    returning request_count into used;
  if used > 6 then raise exception 'request_limit_exceeded'; end if;
  insert into public.pan_stolarz_requests(id,name,email,kind,city,description)
    values(submission_id,payload->>'name',payload->>'email',payload->>'kind',payload->>'city',payload->>'description');
  return submission_id;
end;
$$;
revoke all on function public.pan_stolarz_submit_request(jsonb,text,uuid) from public,anon,authenticated;
grant execute on function public.pan_stolarz_submit_request(jsonb,text,uuid) to service_role;
