-- Apply this migration in the Supabase SQL editor.
-- Profile uploads use: profile-media/{auth.uid()}/avatars/{file}
-- and profile-media/{auth.uid()}/banners/{file}.

drop policy if exists "anyone can view profile media" on storage.objects;
drop policy if exists "users manage their own profile media" on storage.objects;

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
