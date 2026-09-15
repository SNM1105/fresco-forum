-- Run this once in Supabase SQL Editor for an existing project.
alter table profiles
  add column if not exists avatar_position text not null default '50% 50%',
  add column if not exists banner_position text not null default '50% 50%';
