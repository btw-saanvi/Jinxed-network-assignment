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
