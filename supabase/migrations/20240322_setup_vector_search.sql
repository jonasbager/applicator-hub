-- Enable the vector extension if it's not already enabled
create extension if not exists vector;

-- Add embedding column to linkedin_jobs if it doesn't exist
alter table linkedin_jobs 
add column if not exists embedding vector(1536);

-- Create an index for faster similarity searches
create index if not exists linkedin_jobs_embedding_idx 
on linkedin_jobs 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
