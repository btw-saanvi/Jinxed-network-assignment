-- ============================================================
-- CRITICAL FIX: Add missing UPDATE policy so generation status
-- can be updated from 'pending' -> 'done'/'failed' by the API.
-- Without this policy, Supabase RLS silently blocks all updates
-- and every generation stays stuck as 'pending' forever.
-- ============================================================

create policy "Allow public update"
on generations
for update
to anon
using (true)
with check (true);

-- ============================================================
-- Create a public storage bucket for generated images.
-- This allows storing actual image files instead of huge
-- base64 data URLs in the database text column.
-- ============================================================

insert into storage.buckets (id, name, public)
values ('generated-images', 'generated-images', true)
on conflict (id) do nothing;

-- Allow anonymous uploads to the bucket
create policy "Allow public upload"
on storage.objects
for insert
to anon
with check (bucket_id = 'generated-images');

-- Allow public reads from the bucket
create policy "Allow public read"
on storage.objects
for select
to anon
using (bucket_id = 'generated-images');

-- Allow anonymous deletes from the bucket
create policy "Allow public delete"
on storage.objects
for delete
to anon
using (bucket_id = 'generated-images');
