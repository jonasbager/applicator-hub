-- Drop and recreate function to get current user ID from header
drop function if exists get_auth_user_id() cascade;
create or replace function get_auth_user_id()
returns text
language plpgsql
security definer
as $$
declare
    header_value text;
begin
    -- Get the user ID from the request header
    begin
        header_value := current_setting('request.header.x-user-id', true);
        raise notice 'x-user-id header value: %', header_value;
        
        if header_value is null or header_value = '' then
            raise notice 'No user ID found in header';
            return null;
        end if;
        
        raise notice 'Using user ID from header: %', header_value;
        return header_value;
    exception when others then
        raise notice 'Error getting user ID from header: %', sqlerrm;
        return null;
    end;
end;
$$;

-- Update existing policies to use the new function
do $$ 
begin
  -- Update job_preferences policies
  execute (
    select string_agg(
      format('alter policy %I on job_preferences using (get_auth_user_id() = user_id)', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'job_preferences'
  );
  
  -- Update resumes policies
  execute (
    select string_agg(
      format('alter policy %I on resumes using (get_auth_user_id() = user_id)', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'resumes'
  );
  
  -- Update storage.objects policies
  execute (
    select string_agg(
      format('alter policy %I on storage.objects using (bucket_id = ''resumes'' and get_auth_user_id() = (storage.foldername(name))[1])', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'objects' and schemaname = 'storage'
  );
end $$;
