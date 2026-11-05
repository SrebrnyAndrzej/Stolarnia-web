-- Operational tasks only; no changes to engine JSON, quotations or invoices.
create table public.pan_stolarz_tasks (
 id uuid primary key default gen_random_uuid(),
 project_id text not null,
 assignee_id uuid not null references public.pan_stolarz_members(user_id),
 title text not null check (length(title) between 2 and 160),
 status text not null default 'todo' check (status in ('todo','working','paused','done')),
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index on public.pan_stolarz_tasks(assignee_id,created_at desc);
create table public.pan_stolarz_task_events (
 id bigint generated always as identity primary key,
 task_id uuid not null references public.pan_stolarz_tasks(id),
 actor_id uuid not null references public.pan_stolarz_members(user_id),
 status text not null,
 version integer not null,
 created_at timestamptz not null default now()
);
alter table public.pan_stolarz_tasks enable row level security;
alter table public.pan_stolarz_task_events enable row level security;
revoke all on public.pan_stolarz_tasks,public.pan_stolarz_task_events from anon,authenticated;
grant select on public.pan_stolarz_tasks,public.pan_stolarz_task_events to service_role;

-- Only the authenticated server can supply actor_id. Re-check current membership
-- inside the transaction, locking against concurrent revocation/assignment edits.
create function public.pan_stolarz_task_command(actor uuid, task uuid, expected_version integer,
 next_status text, project text default null, assignee uuid default null, task_title text default null, operation_id uuid default null)
returns public.pan_stolarz_tasks language plpgsql security definer set search_path = public as $$
declare m public.pan_stolarz_members; a public.pan_stolarz_members; t public.pan_stolarz_tasks;
begin
 select * into m from public.pan_stolarz_members where user_id=actor for share;
 if not found or not m.active or m.role not in ('owner','employee') then raise exception 'task_forbidden'; end if;
 if task is null then
  if m.role <> 'owner' then raise exception 'task_forbidden'; end if;
  select * into a from public.pan_stolarz_members where user_id=assignee for share;
  if not found or not a.active or a.role <> 'employee' or not project=any(a.project_ids) then raise exception 'task_assignee'; end if;
  if operation_id is null then raise exception 'task_status'; end if;
  insert into public.pan_stolarz_tasks(id,project_id,assignee_id,title) values(operation_id,project,assignee,task_title) on conflict (id) do nothing returning * into t;
  if not found then
   select * into t from public.pan_stolarz_tasks where id=operation_id;
   if t.project_id<>project or t.assignee_id<>assignee or t.title<>task_title then raise exception 'task_conflict'; end if;
   return t;
  end if;
 else
  select * into t from public.pan_stolarz_tasks where id=task for update;
  if not found then raise exception 'task_forbidden'; end if;
  if m.role <> 'owner' and (t.assignee_id <> actor or not t.project_id=any(m.project_ids)) then raise exception 'task_forbidden'; end if;
  if t.version <> expected_version then raise exception 'task_conflict'; end if;
  if next_status not in ('todo','working','paused','done') or next_status is null then raise exception 'task_status'; end if;
  if t.status=next_status then return t; end if;
  if not ((t.status='todo' and next_status='working') or (t.status='working' and next_status in ('paused','done')) or (t.status='paused' and next_status='working') or (m.role='owner' and t.status='done' and next_status='todo')) then raise exception 'task_transition'; end if;
  update public.pan_stolarz_tasks set status=next_status,version=version+1,updated_at=now() where id=task returning * into t;
 end if;
 insert into public.pan_stolarz_task_events(task_id,actor_id,status,version) values(t.id,actor,t.status,t.version);
 return t;
end $$;
revoke all on function public.pan_stolarz_task_command(uuid,uuid,integer,text,text,uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.pan_stolarz_task_command(uuid,uuid,integer,text,text,uuid,text,uuid) to service_role;
