-- ============================================================
-- FRESCO FORUM — FUNCTIONS & TRIGGERS
-- Run after schema.sql, before policies.sql.
-- ============================================================

-- ------------------------------------------------------------
-- is_moderator(uid) — small helper reused across RLS policies.
-- security definer so it can read profiles even where a caller's
-- own RLS wouldn't otherwise let them see another user's row.
-- ------------------------------------------------------------
create or replace function is_moderator(check_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = check_id and account_type in ('moderator', 'admin')
  );
$$;

-- ------------------------------------------------------------
-- handle_new_user — fires on auth.users insert. Creates the
-- matching profiles row, and auto-verifies + fills in `school`
-- when the signup email domain matches school_domains.
-- Username defaults from the email local-part; the app should
-- prompt the user to pick a real one on first login if it's taken.
-- ------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_domain text;
  matched_school text;
  base_username text;
  final_username text;
  suffix int := 0;
begin
  email_domain := split_part(new.email, '@', 2);

  select school_name into matched_school
  from school_domains
  where domain = email_domain
  limit 1;

  base_username := coalesce(
    nullif(regexp_replace(new.raw_user_meta_data->>'username', '[^a-zA-Z0-9_]', '', 'g'), ''),
    regexp_replace(split_part(new.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g')
  );
  final_username := base_username;

  while exists (select 1 from profiles where username = final_username) loop
    suffix := suffix + 1;
    final_username := base_username || suffix::text;
  end loop;

  insert into profiles (id, username, school, school_verified)
  values (new.id, final_username, matched_school, matched_school is not null);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ------------------------------------------------------------
-- sync_vote_score — keeps posts.vote_score / comments.vote_score
-- in step with the votes table on insert/update/delete, and bumps
-- the voter's own reputation contribution is intentionally NOT
-- automatic here — reputation changes go through recompute below
-- so a single bad actor mass-downvoting can be audited/reversed.
-- ------------------------------------------------------------
create or replace function sync_vote_score()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  delta integer;
  affected_type text;
  affected_id uuid;
begin
  if tg_op = 'INSERT' then
    delta := new.value;
    affected_type := new.target_type;
    affected_id := new.target_id;
  elsif tg_op = 'DELETE' then
    delta := -old.value;
    affected_type := old.target_type;
    affected_id := old.target_id;
  elsif tg_op = 'UPDATE' then
    delta := new.value - old.value;
    affected_type := new.target_type;
    affected_id := new.target_id;
  end if;

  if affected_type = 'post' then
    update posts set vote_score = vote_score + delta where id = affected_id;
  else
    update comments set vote_score = vote_score + delta where id = affected_id;
  end if;

  return null;
end;
$$;

drop trigger if exists on_vote_change on votes;
create trigger on_vote_change
  after insert or update or delete on votes
  for each row execute function sync_vote_score();

-- ------------------------------------------------------------
-- sync_comment_count — keeps posts.comment_count accurate.
-- ------------------------------------------------------------
create or replace function sync_comment_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists on_comment_change on comments;
create trigger on_comment_change
  after insert or delete on comments
  for each row execute function sync_comment_count();

-- ------------------------------------------------------------
-- set_post_status_on_insert — routes posts in requires_approval
-- categories to pending_review automatically, so this can't be
-- bypassed by a client sending status: 'published' directly.
-- ------------------------------------------------------------
create or replace function set_post_status_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  needs_review boolean;
begin
  select requires_approval into needs_review
  from categories where key = new.category_key;

  if needs_review then
    new.status := 'pending_review';
  else
    new.status := 'published';
  end if;

  return new;
end;
$$;

drop trigger if exists before_post_insert on posts;
create trigger before_post_insert
  before insert on posts
  for each row execute function set_post_status_on_insert();
