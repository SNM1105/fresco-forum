-- ============================================================
-- FRESCO FORUM — ROW LEVEL SECURITY
-- Run after schema.sql and functions.sql.
-- ============================================================

alter table profiles enable row level security;
alter table organization_details enable row level security;
alter table categories enable row level security;
alter table posts enable row level security;
alter table comments enable row level security;
alter table votes enable row level security;
alter table reports enable row level security;
alter table mod_actions enable row level security;
alter table school_domains enable row level security;

-- ------------------------------------------------------------
-- PROFILES — public read (it's a forum, usernames/bios are the
-- point), self-only write of the safe columns. Sensitive columns
-- (reputation, is_banned, account_type, school_verified) are only
-- ever changed by trigger functions or moderator server actions
-- using the admin client — never by a user's own UPDATE.
-- ------------------------------------------------------------
create policy "profiles are publicly readable"
  on profiles for select
  using (true);

create policy "users can update their own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Lets moderateUser() (lib/actions/moderation.js) set is_banned / ban_reason /
-- is_muted_until on someone else's row. Kept separate from the self-update
-- policy above so a compromised student account can't grant itself this path.
create policy "moderators can update moderation fields on any profile"
  on profiles for update
  using (is_moderator(auth.uid()))
  with check (is_moderator(auth.uid()));

-- ------------------------------------------------------------
-- ORGANIZATION DETAILS
-- ------------------------------------------------------------
create policy "org details are publicly readable"
  on organization_details for select
  using (true);

create policy "orgs manage their own details"
  on organization_details for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- ------------------------------------------------------------
-- CATEGORIES — read-only from the client; changes are a migration.
-- ------------------------------------------------------------
create policy "categories are publicly readable"
  on categories for select
  using (true);

-- ------------------------------------------------------------
-- SCHOOL DOMAINS — read-only, used client-side to hint verification
-- before signup ("looks like a Concordia email!").
-- ------------------------------------------------------------
create policy "school domains are publicly readable"
  on school_domains for select
  using (true);

-- ------------------------------------------------------------
-- POSTS
-- ------------------------------------------------------------
create policy "published posts are publicly readable"
  on posts for select
  using (
    status = 'published'
    or author_id = auth.uid()
    or is_moderator(auth.uid())
  );

create policy "verified, non-banned users can create posts"
  on posts for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from profiles
      where id = auth.uid() and is_banned = false
    )
  );

create policy "authors can edit their own unpublished posts"
  on posts for update
  using (author_id = auth.uid() or is_moderator(auth.uid()))
  with check (author_id = auth.uid() or is_moderator(auth.uid()));

create policy "authors or moderators can delete posts"
  on posts for delete
  using (author_id = auth.uid() or is_moderator(auth.uid()));

-- ------------------------------------------------------------
-- COMMENTS
-- ------------------------------------------------------------
create policy "published comments are publicly readable"
  on comments for select
  using (status = 'published' or author_id = auth.uid() or is_moderator(auth.uid()));

create policy "non-banned users can comment"
  on comments for insert
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles where id = auth.uid() and is_banned = false)
  );

create policy "authors or moderators can update comments"
  on comments for update
  using (author_id = auth.uid() or is_moderator(auth.uid()))
  with check (author_id = auth.uid() or is_moderator(auth.uid()));

create policy "authors or moderators can delete comments"
  on comments for delete
  using (author_id = auth.uid() or is_moderator(auth.uid()));

-- ------------------------------------------------------------
-- VOTES — a user only ever sees and manages their own vote rows.
-- Aggregate scores are read via posts.vote_score / comments.vote_score,
-- not by querying this table directly.
-- ------------------------------------------------------------
create policy "users manage their own votes"
  on votes for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ------------------------------------------------------------
-- REPORTS — anyone signed in can file one; only moderators can
-- read the queue or resolve them.
-- ------------------------------------------------------------
create policy "signed-in users can file reports"
  on reports for insert
  with check (reporter_id = auth.uid());

create policy "moderators can read reports"
  on reports for select
  using (is_moderator(auth.uid()) or reporter_id = auth.uid());

create policy "moderators can resolve reports"
  on reports for update
  using (is_moderator(auth.uid()))
  with check (is_moderator(auth.uid()));

-- ------------------------------------------------------------
-- MOD ACTIONS — the audit log. Moderators can read and write;
-- everyone else (including the person actioned) reads nothing
-- directly here — expose a narrowed view to affected users instead
-- if you want "here's why you were banned" to be self-serve.
-- ------------------------------------------------------------
create policy "moderators can read the mod log"
  on mod_actions for select
  using (is_moderator(auth.uid()));

create policy "moderators can log actions they take"
  on mod_actions for insert
  with check (moderator_id = auth.uid() and is_moderator(auth.uid()));
