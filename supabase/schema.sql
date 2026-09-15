-- ============================================================
-- FRESCO FORUM — CORE SCHEMA
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- before policies.sql and functions.sql.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- SCHOOL DOMAINS — source of truth for auto-verification.
-- Add rows here rather than hardcoding domains in app code.
-- ------------------------------------------------------------
create table school_domains (
  domain text primary key,          -- e.g. 'concordia.ca'
  school_name text not null         -- e.g. 'Concordia University'
);

insert into school_domains (domain, school_name) values
  ('concordia.ca', 'Concordia University'),
  ('mail.concordia.ca', 'Concordia University'),
  ('mcgill.ca', 'McGill University'),
  ('umontreal.ca', 'Université de Montréal'),
  ('dawsoncollege.qc.ca', 'Dawson College');

-- ------------------------------------------------------------
-- PROFILES — one row per auth.users row, created by trigger
-- (see functions.sql: handle_new_user).
-- ------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  avatar_position text not null default '50% 50%',
  avatar_scale integer not null default 100,
  banner_url text,
  banner_position text not null default '50% 50%',
  bio text,
  school text,
  program text,
  account_type text not null default 'student'
    check (account_type in ('student', 'organization', 'moderator', 'admin')),
  school_verified boolean not null default false,
  reputation integer not null default 0,
  is_banned boolean not null default false,
  is_muted_until timestamptz,
  ban_reason text,
  created_at timestamptz not null default now()
);

create index profiles_account_type_idx on profiles (account_type);

-- Organization-only extra fields (galleries, clubs, schools, businesses).
create table organization_details (
  profile_id uuid primary key references profiles (id) on delete cascade,
  org_name text not null,
  org_type text not null check (org_type in ('gallery', 'club', 'school', 'business')),
  website_url text,
  verified boolean not null default false,
  subscription_status text not null default 'inactive'
    check (subscription_status in ('inactive', 'active', 'past_due', 'canceled'))
);

-- ------------------------------------------------------------
-- CATEGORIES — seeded, not user-created. requires_approval drives
-- the "posts held for review" flow (politics, by default).
-- ------------------------------------------------------------
create table categories (
  key text primary key,
  label text not null,
  category_group text not null check (category_group in ('art', 'politics', 'life')),
  requires_approval boolean not null default false,
  sort_order integer not null default 0
);

insert into categories (key, label, category_group, requires_approval, sort_order) values
  ('film', 'Film', 'art', false, 1),
  ('visual-arts', 'Visual Arts', 'art', false, 2),
  ('photography', 'Photography', 'art', false, 3),
  ('music', 'Music', 'art', false, 4),
  ('design', 'Design', 'art', false, 5),
  ('literature', 'Literature', 'art', false, 6),
  ('performance', 'Performance', 'art', false, 7),
  ('canadian', 'Canadian Politics', 'politics', true, 8),
  ('international', 'International Politics', 'politics', true, 9),
  ('campus', 'Campus Politics', 'politics', true, 10),
  ('social-issues', 'Social Issues', 'politics', true, 11),
  ('general', 'General Discussion', 'life', false, 12);

-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------
create table posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles (id) on delete cascade,
  category_key text not null references categories (key),
  title text not null check (char_length(title) between 3 and 200),
  body text check (char_length(body) <= 10000),
  image_path text,        -- Storage object path in the `post-media` bucket
  image_width integer,
  image_height integer,
  is_sponsored boolean not null default false,
  status text not null default 'published'
    check (status in ('published', 'pending_review', 'removed')),
  vote_score integer not null default 0,
  comment_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index posts_category_idx on posts (category_key);
create index posts_status_idx on posts (status);
create index posts_created_at_idx on posts (created_at desc);
create index posts_vote_score_idx on posts (vote_score desc);

-- ------------------------------------------------------------
-- COMMENTS — self-referencing for threaded replies.
-- ------------------------------------------------------------
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  parent_id uuid references comments (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  status text not null default 'published' check (status in ('published', 'removed')),
  vote_score integer not null default 0,
  created_at timestamptz not null default now()
);

create index comments_post_idx on comments (post_id);
create index comments_parent_idx on comments (parent_id);

-- ------------------------------------------------------------
-- VOTES — one row per (user, target). value flips between -1/+1;
-- deleting the row means "un-voted". Triggers keep score columns
-- on posts/comments in sync (see functions.sql).
-- ------------------------------------------------------------
create table votes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create index votes_target_idx on votes (target_type, target_id);

-- ------------------------------------------------------------
-- REPORTS — student-facing "Report" button lands here.
-- ------------------------------------------------------------
create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now()
);

create index reports_status_idx on reports (status);

-- ------------------------------------------------------------
-- MOD ACTIONS — every enforcement action a mod takes is logged
-- here, and reason is required at the DB level (not just the UI),
-- per "mods must give a reason and proof".
-- ------------------------------------------------------------
create table mod_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references profiles (id),
  action text not null check (
    action in ('delete_post', 'delete_comment', 'approve_post', 'ban_user', 'suspend_user', 'mute_user', 'unban_user')
  ),
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  reason text not null check (char_length(reason) >= 10),
  evidence_url text,
  created_at timestamptz not null default now()
);

create index mod_actions_target_idx on mod_actions (target_type, target_id);
