-- Add service role bypass for resumes table
create policy "Service role can access all resumes"
on resumes for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- Add service role bypass for storage
create policy "Service role can access all resume files"
on storage.objects for all
using (
  bucket_id = 'resumes' and
  auth.role() = 'service_role'
);
