-- Create linkedin_jobs table
create table if not exists linkedin_jobs (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  company text not null,
  location text not null,
  url text not null,
  description text not null,
  level text[] default array[]::text[],
  embedding vector(1536),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table linkedin_jobs enable row level security;

-- Allow service role full access
create policy "Service role can manage linkedin_jobs"
  on linkedin_jobs
  using (true);

-- Create index for similarity search
create index if not exists linkedin_jobs_embedding_idx 
on linkedin_jobs 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
