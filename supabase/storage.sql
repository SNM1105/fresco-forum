-- ============================================================
-- FRESCO FORUM — STORAGE BUCKETS
-- Run after policies.sql. Enforces file size/type limits at the
-- bucket level (belt) in addition to client-side checks (suspenders).
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'post-media',
  'post-media',
  true,                              -- public read, so images render without signed URLs
  26214400,                          -- 25 MB
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-media', 'profile-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: post-media/{auth.uid()}/{postId}-{filename}
-- profile-media/{auth.uid()}/avatars/{file}
-- profile-media/{auth.uid()}/banners/{file}
-- so a user can only write inside their own folder, moderators
-- can remove anything.

create policy "anyone can view post media"
  on storage.objects for select
  using (bucket_id = 'post-media');

create policy "users upload media into their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'post-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "owners or moderators delete post media"
  on storage.objects for delete
  using (
    bucket_id = 'post-media'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_moderator(auth.uid())
    )
  );

create policy "anyone can view profile media"
  on storage.objects for select
  using (bucket_id = 'profile-media');

create policy "users manage their own profile media"
  on storage.objects for all
  using (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "anyone can view avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "users manage their own avatar"
  on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

