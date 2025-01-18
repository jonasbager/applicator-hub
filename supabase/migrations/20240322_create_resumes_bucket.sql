-- Create storage bucket for resumes if it doesn't exist
insert into storage.buckets (id, name, public)
select 'resumes', 'resumes', false
where not exists (
  select 1 from storage.buckets where id = 'resumes'
);

-- Enable RLS on the bucket
create policy "Users can view their own resumes"
  on storage.objects for select
  using (
    case 
      when get_auth_user_id() is null then false
      when bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1] then true
      else false
    end
  );

create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    case 
      when get_auth_user_id() is null then false
      when bucket_id = 'resumes' 
        and get_auth_user_id() = (storage.foldername(name))[1]
        and (storage.extension(name) = 'pdf' or storage.extension(name) = 'doc' or storage.extension(name) = 'docx')
        then true
      else false
    end
  );

create policy "Users can update their own resumes"
  on storage.objects for update
  using (
    case 
      when get_auth_user_id() is null then false
      when bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1] then true
      else false
    end
  );

create policy "Users can delete their own resumes"
  on storage.objects for delete
  using (
    case 
      when get_auth_user_id() is null then false
      when bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1] then true
      else false
    end
  );
