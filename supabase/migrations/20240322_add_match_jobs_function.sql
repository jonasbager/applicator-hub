-- Create function to match jobs based on resume embedding
create or replace function match_jobs(query_embedding vector(1536),
                                   match_threshold float,
                                   match_count int)
returns table (
  id uuid,
  title text,
  company text,
  location text,
  url text,
  description text,
  level text[],
  created_at timestamptz,
  updated_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    j.id,
    j.title,
    j.company,
    j.location,
    j.url,
    j.description,
    j.level,
    j.created_at,
    j.updated_at,
    1 - (j.embedding <=> query_embedding) as similarity
  from linkedin_jobs j
  where 1 - (j.embedding <=> query_embedding) > match_threshold
  order by j.embedding <=> query_embedding
  limit match_count;
end;
$$;
