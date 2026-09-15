# Fresco Forum Codebase Analysis

## 1. POST COMPONENT & DISPLAY (PostCard.js)

### Current Implementation

**File**: [components/PostCard.js](components/PostCard.js)

**How it displays posts:**

- Renders a single post card with voting controls (upvote/downvote), category label, title, body preview (3 lines max), and author info
- Features:
  - Vote UI with current user's vote state (arrow highlights in sienna for upvote, lapis for downvote)
  - Vote score displayed in monospace font
  - Category label with visual distinction (sienna bar for art posts)
  - "AWAITING REVIEW" badge for pending_review status
  - Post title as link to `/post/${post.id}` (NOT YET IMPLEMENTED)
  - Body text limited to 3 lines with `line-clamp-3`
  - Image preview if post has `image_path`
  - Author profile link with avatar, display name, school
  - Comment count and report button

### Data Structure Passed to PostCard

```javascript
post = {
  id,
  title,
  body,
  image_path,
  status,
  vote_score,
  comment_count,
  created_at,
  categories: { key, label, category_group },
  profiles: { username, display_name, avatar_url, school },
};
currentUserVote = 0 | 1 | -1;
```

---

## 2. DATABASE SCHEMA

### POSTS Table

```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY default gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category_key text NOT NULL REFERENCES categories(key),
  title text NOT NULL (3-200 chars),
  body text (0-10000 chars),
  image_path text,           -- Storage path in 'post-media' bucket
  image_width integer,
  image_height integer,
  is_sponsored boolean DEFAULT false,
  status text DEFAULT 'published'  -- 'published' | 'pending_review' | 'removed'
  vote_score integer DEFAULT 0,
  comment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Indexes**: category_key, status, created_at (desc), vote_score (desc)

### COMMENTS Table

```sql
CREATE TABLE comments (
  id uuid PRIMARY KEY default gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,  -- For threading
  body text NOT NULL (1-5000 chars),
  status text DEFAULT 'published'  -- 'published' | 'removed'
  vote_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
```

**Indexes**: post_id, parent_id

### VOTES Table

```sql
CREATE TABLE votes (
  id uuid PRIMARY KEY default gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL  -- 'post' | 'comment'
  target_id uuid NOT NULL,
  value smallint NOT NULL    -- -1 or 1 only
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)  -- One vote per user per target
);
```

**Trigger**: `sync_vote_score()` automatically updates posts.vote_score and comments.vote_score

### REPORTS Table

```sql
CREATE TABLE reports (
  id uuid PRIMARY KEY default gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type text NOT NULL  -- 'post' | 'comment' | 'user'
  target_id uuid NOT NULL,
  reason text NOT NULL (3-1000 chars),
  status text DEFAULT 'open'  -- 'open' | 'resolved' | 'dismissed'
  created_at timestamptz DEFAULT now()
);
```

**Index**: status

### MOD_ACTIONS Table

```sql
CREATE TABLE mod_actions (
  id uuid PRIMARY KEY default gen_random_uuid(),
  moderator_id uuid NOT NULL REFERENCES profiles(id),
  action text NOT NULL       -- 'delete_post' | 'delete_comment' | 'approve_post' | 'ban_user' | 'suspend_user' | 'mute_user' | 'unban_user'
  target_type text NOT NULL  -- 'post' | 'comment' | 'user'
  target_id uuid NOT NULL,
  reason text NOT NULL (10+ chars),
  evidence_url text,
  created_at timestamptz DEFAULT now()
);
```

**Index**: target_type, target_id

---

## 3. ROUTES & PAGES

### Post-Related Pages

| Route                 | File                                                                             | Status         | Notes                                                                                   |
| --------------------- | -------------------------------------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `/feed`               | [app/(main)/feed/page.js](<app/(main)/feed/page.js>)                             | ✅ IMPLEMENTED | Displays list of published posts with sort (new/popular/discussed) & category filtering |
| `/explore`            | [app/(main)/explore/page.js](<app/(main)/explore/page.js>)                       | ✅ IMPLEMENTED | Search & art grid showcase                                                              |
| `/profile/[username]` | [app/(main)/profile/[username]/page.js](<app/(main)/profile/[username]/page.js>) | ✅ IMPLEMENTED | Shows user's published posts                                                            |
| `/post/[id]`          | **MISSING**                                                                      | ❌ STUB        | Links exist in PostCard.js, explore/page.js but no page component                       |
| `/create`             | [app/(main)/create/page.js](<app/(main)/create/page.js>)                         | ✅ IMPLEMENTED | Create post form                                                                        |
| `/admin`              | [app/admin/page.js](app/admin/page.js)                                           | ✅ IMPLEMENTED | Moderation queue (pending posts + open reports)                                         |

### Auth Pages

| Route            | Status         | Notes                                         |
| ---------------- | -------------- | --------------------------------------------- |
| `/login`         | ✅ Implemented | Email/password with school-email verification |
| `/auth/callback` | ✅ Implemented | OAuth redirect handler                        |
| `/signup`        | ✅ Implemented | Registration                                  |

---

## 4. POST ACTIONS (lib/actions/posts.js)

### Currently Implemented

#### `createPost(formData)`

- **File**: [lib/actions/posts.js](lib/actions/posts.js)
- **Validates**: title (3-200 chars), category required
- **File upload**: Supports JPG/PNG/WebP/MP4, max 25MB
- **Auto-approval logic**: Triggered by `set_post_status_on_insert()` DB trigger
  - Categories with `requires_approval = true` → `status = 'pending_review'`
  - Others → `status = 'published'`
- **Prevents client bypass**: Status NOT sent from client; DB trigger decides
- **Note**: Image dimension check is CLIENT-SIDE only; server-side probe noted as TODO

#### `castVote({ targetType, targetId, value, path })`

- **File**: [lib/actions/votes.js](lib/actions/votes.js)
- **Parameters**:
  - `targetType`: 'post' | 'comment'
  - `value`: 1 (upvote) | -1 (downvote) | 0 (remove vote)
- **Mechanism**: Upserts to votes table; unique constraint prevents duplicates
- **Score sync**: DB trigger `sync_vote_score()` keeps posts.vote_score in sync
- **Revalidation**: Revalidates the given path for ISR

#### `fileReport({ targetType, targetId, reason })`

- **File**: [lib/actions/reports.js](lib/actions/reports.js)
- **Creates**: Row in `reports` table with `status = 'open'`
- **Validates**: Reason 3+ chars
- **Status**: ✅ FULLY WORKING

### Missing Functions

- ❌ `deletePost()` — No user-initiated delete
- ❌ `editPost()` — No edit capability
- ❌ Reputation calculation — Schema exists but no actual updates
- ❌ Comment create/edit/delete — Schema ready, no action functions

---

## 5. DETAILED POST VIEW PAGE

### Current Status: ❌ NOT IMPLEMENTED (STUBBED)

**Evidence**:

- PostCard.js links to `/post/${post.id}` (line 55)
- Explore page links to `/post/${p.id}` (appears in search results)
- No directory `app/(main)/post/[id]/` or catch-all route exists
- These links currently lead to 404

**What would be needed**:

1. Create `app/(main)/post/[id]/page.js`
2. Fetch post by ID + full comment thread
3. Fetch current user's vote on this post
4. Display comments with reply threading
5. Comment form (if stubbed)

---

## 6. VOTING, REPORTING & OTHER ACTIONS

### ✅ FULLY WORKING

| Feature              | Files                                                  | How it Works                                                                                             |
| -------------------- | ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| **Voting**           | `lib/actions/votes.js`, `components/PostCard.js`       | Click arrows → castVote() action → votes upsert → DB trigger updates score → UI optimistic update        |
| **Reporting Posts**  | `lib/actions/reports.js`, `components/PostCard.js`     | "Report" button → prompt for reason → fileReport() → row in reports table                                |
| **Create Post**      | `lib/actions/posts.js`, `components/CreatePostForm.js` | Form → validation (client + server) → upload to Storage → insert to posts table → trigger decides status |
| **Approval/Removal** | `lib/actions/moderation.js`, `components/ModQueue.js`  | Admin only; approve_post or delete_post with required 10+ char reason → logged to mod_actions            |

### ❌ STUBBED / NOT FULLY WORKING

| Feature                 | Status                      | Gap                                                    |
| ----------------------- | --------------------------- | ------------------------------------------------------ |
| **Comments**            | Schema complete, RLS exists | No UI; no createComment/deleteComment actions          |
| **Comment voting**      | Schema complete             | No UI or actions                                       |
| **Delete posts** (user) | Schema supports via trigger | No action or UI                                        |
| **Edit posts**          | Schema doesn't support      | Would need `updated_at` + soft-delete strategy         |
| **Ban enforcement**     | `profiles.is_banned` exists | No login-time check; banned users can still access     |
| **Comment approval**    | Not in schema               | Could be added if political comments need pre-approval |

---

## 7. FULLY WORKING FEATURES (END-TO-END)

✅ **Authentication**

- Email/password signup & login
- Email/password auth via Supabase Auth
- Automatic school verification by email domain
- Session management with Supabase SSR

✅ **Post Creation**

- Title + body + optional image/video
- Category selection with approval routing
- File validation (size, type, dimensions)
- Supabase Storage integration for media
- DB trigger enforces approval requirement for political posts

✅ **Voting**

- Upvote/downvote posts (comments schema ready but UI missing)
- Real-time score sync via DB trigger
- Vote UI state matches user's current vote
- Upsert logic prevents duplicate votes

✅ **Feed & Discovery**

- Feed with sort (new/popular/most discussed)
- Category filtering
- Explore page with art grid + search (ilike)
- Profile pages showing user's posts & stats

✅ **Reporting**

- Report post with custom reason
- Reports table tracks status (open/resolved/dismissed)
- Visible in admin queue

✅ **Moderation**

- Approve pending posts
- Delete posts (logical, via status = 'removed')
- Every action logged to mod_actions with required reason
- Moderator access controlled by account_type in profiles

✅ **Organization** (Partial)

- Schema for org accounts exists
- Account type = 'organization' supported
- No signup UI or org-specific features yet

---

## 8. STUBBED / NEEDS BUILDING

❌ **Post Detail Page** (`/post/[id]`)

- Route doesn't exist
- Would display full post + comment thread
- Would need comment form and comment display

❌ **Comments**

- Schema & RLS complete
- **Missing**:
  - `lib/actions/comments.js` (create, delete, edit)
  - Comment thread UI component
  - Comment voting UI

❌ **Post Deletion** (User-initiated)

- No action function
- No UI button

❌ **Post Editing**

- Schema doesn't support (no updated_at, no versioning)
- Would need schema change if this is a priority

❌ **User Ban Enforcement**

- `profiles.is_banned` set by mod
- No login-time check
- Banned users still see the app

❌ **Comment Approval** (for political comments)

- Not in schema
- Could be added if needed

❌ **Image Dimension Validation** (Server-side)

- Client-side check exists
- Comments in `lib/actions/posts.js` note where sharp/probe-image-size probe should go

❌ **Full-Text Search**

- Current search is `ilike` (fine for MVP)
- Schema notes to add tsvector + GIN index for scale

❌ **Reputation System**

- Schema has reputation field on profiles
- Currently just displays post/comment vote counts
- No formula, no scheduled calculation

❌ **Organization Features**

- Signup/verification flow not implemented
- Organization-specific post settings not wired

❌ **User Tutorial**

- No onboarding flow
- No tutorial tooltips

---

## 9. IMPLEMENTATION SUMMARY BY FILE

### Core Post Functionality

- **[components/PostCard.js](components/PostCard.js)** — Post display & voting/report UI
- **[lib/actions/posts.js](lib/actions/posts.js)** — Create post, auto-approval logic
- **[lib/actions/votes.js](lib/actions/votes.js)** — Vote casting for posts & comments
- **[lib/actions/reports.js](lib/actions/reports.js)** — Report filing
- **[lib/actions/moderation.js](lib/actions/moderation.js)** — Post approval/deletion by mods

### Pages

- **[app/(main)/feed/page.js](<app/(main)/feed/page.js>)** — Main feed with sorting & filtering
- **[app/(main)/explore/page.js](<app/(main)/explore/page.js>)** — Search & art gallery
- **[app/(main)/create/page.js](<app/(main)/create/page.js>)** — Post creation (uses CreatePostForm)
- **[app/(main)/profile/[username]/page.js](<app/(main)/profile/[username]/page.js>)** — User profile & posts
- **[app/admin/page.js](app/admin/page.js)** — Mod dashboard (uses ModQueue)

### Components

- **[components/CreatePostForm.js](components/CreatePostForm.js)** — Post form with file upload
- **[components/ModQueue.js](components/ModQueue.js)** — Pending posts & reports UI
- **[components/ui.js](components/ui.js)** — Reusable UI (Avatar, CategoryLabel, etc.)

### Database

- **[supabase/schema.sql](supabase/schema.sql)** — Tables: posts, comments, votes, reports, mod_actions, etc.
- **[supabase/functions.sql](supabase/functions.sql)** — Triggers: sync_vote_score, sync_comment_count, set_post_status_on_insert
- **[supabase/policies.sql](supabase/policies.sql)** — RLS for posts, votes, comments, reports

---

## 10. DATABASE TRIGGER LOGIC

### `set_post_status_on_insert()`

- Fires when post is inserted
- Checks if `categories.requires_approval = true` for the post's category
- If yes → sets status = 'pending_review' (political categories)
- If no → sets status = 'published' (art, life categories)
- **Purpose**: Prevents client from bypassing approval requirement

### `sync_vote_score()`

- Fires on INSERT/UPDATE/DELETE on votes table
- Calculates delta based on operation
- Updates target table (posts or comments) with new vote_score
- **Purpose**: Keeps denormalized vote_score in sync with votes table

### `sync_comment_count()`

- Fires on INSERT/DELETE on comments table
- Increments/decrements posts.comment_count
- **Purpose**: Keeps comment count on posts accurate for sorting

### `handle_new_user()`

- Fires on new auth.users insert
- Creates matching profiles row
- Auto-fills school if email domain matches school_domains
- Generates unique username from email local-part
- **Purpose**: One-step account creation with auto-verification

---

## 11. NEXT STEPS FOR BUILDING

### Priority 1: Post Detail Page

1. Create `app/(main)/post/[id]/page.js`
2. Fetch post by ID with full author/category info
3. Fetch first 20 comments with parent-child threading
4. Fetch current user's vote on post
5. Display: Post → Comment thread (if exists) → Comment form (stubbed)

### Priority 2: Comments Feature

1. Create `lib/actions/comments.js` with:
   - `createComment({ postId, parentId, body })`
   - `deleteComment({ commentId })`
   - `editComment()` if needed
2. Create comment component with thread rendering
3. Add vote UI for comments
4. Add report UI for comments

### Priority 3: Post Management

1. Add `deletePost()` action with user ownership check
2. Add delete button to PostCard (if post.author_id === current user)
3. Implement soft-delete or hard-delete strategy
4. Add edit post if desired (needs schema change)

### Priority 4: User Tutorials

1. Detect first-time users (posts.length === 0)
2. Show onboarding tooltips for key features
3. Optional: Add "Take a tour" modal

### Priority 5: Ban Enforcement

1. Add check in `middleware.js` to redirect banned users to `/banned`
2. Create `/banned` page with suspension info
3. Refresh check at login to catch real-time bans

---

## Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TailwindCSS
- **Backend**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password with school-email verification)
- **Storage**: Supabase Storage (for post media)
- **UI Library**: lucide-react (icons)

---

## Notes

- **No comments in production yet**, despite schema being complete — this is the highest-priority feature to build for a forum
- **Voting works end-to-end** — excellent foundation for reputation/gamification
- **Approval system is robust** — prevents client bypass via DB triggers
- **File upload** is production-ready with client + server validation
- **Moderation is audit-logged** — every action has a reason and timestamp
- **Search is MVP-grade** (ilike) — fine for current scale but will need tsvector before going big
- **RLS is set up correctly** — users can only vote once per target, can only edit/delete their own content (if those features are added)
