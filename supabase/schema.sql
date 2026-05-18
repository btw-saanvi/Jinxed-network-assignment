create table generations (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  model text not null default 'fal-ai/flux/schnell',
  image_url text,
  status text not null default 'pending',
  settings jsonb default '{}',
  tweak_of uuid references generations(id),
  created_at timestamptz default now()
);

create index on generations(created_at desc);
create index on generations(status);

-- Enable Row-Level Security (RLS)
alter table generations enable row level security;

-- Allow anonymous inserts so images can be generated and saved
create policy "Allow public insert"
on generations
for insert
to anon
with check (true);

-- Allow anonymous reads so users can view the gallery
create policy "Allow public select"
on generations
for select
to anon
using (true);

-- Allow anonymous deletes so users can delete their generations from the gallery
create policy "Allow public delete"
on generations
for delete
to anon
using (true);

