-- Add PDF URL field to job_snapshots table
alter table job_snapshots
add column pdf_url text;

-- Add index for faster lookups
create index job_snapshots_pdf_url_idx on job_snapshots(pdf_url);
