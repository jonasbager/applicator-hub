-- Add missing columns to job_preferences
alter table job_preferences
  add column if not exists education text[] default array[]::text[],
  add column if not exists industries text[] default array[]::text[],
  add column if not exists languages text[] default array[]::text[],
  add column if not exists years_of_experience integer;

-- Update existing rows to have default values
update job_preferences
set
  education = array[]::text[],
  industries = array[]::text[],
  languages = array[]::text[],
  years_of_experience = 0
where
  education is null
  or industries is null
  or languages is null
  or years_of_experience is null;
