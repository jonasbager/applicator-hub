-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding columns
alter table recommended_jobs
add column if not exists embedding vector(1536);

alter table resumes
add column if not exists embedding vector(1536);

-- Create indexes for vector similarity search
create index if not exists recommended_jobs_embedding_idx 
on recommended_jobs 
using ivfflat (embedding vector_cosine_ops);

create index if not exists resumes_embedding_idx 
on resumes 
using ivfflat (embedding vector_cosine_ops);

-- Function to match jobs with resume
create or replace function match_jobs (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  company text,
  location text,
  description text,
  url text,
  level text[],
  keywords text[],
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    rj.id,
    rj.title,
    rj.company,
    rj.location,
    rj.description,
    rj.url,
    rj.level,
    rj.keywords,
    1 - (rj.embedding <=> query_embedding) as similarity
  from recommended_jobs rj
  where 1 - (rj.embedding <=> query_embedding) > match_threshold
  order by rj.embedding <=> query_embedding
  limit match_count;
end;
$$;
