-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can insert their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can update their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON public.resumes;
DROP POLICY IF EXISTS "Users can view their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own resumes" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own resumes" ON storage.objects;

-- Create new policies using the same pattern as jobs table
CREATE POLICY "Users can view their own resumes" ON public.resumes
    FOR SELECT USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can insert their own resumes" ON public.resumes
    FOR INSERT WITH CHECK (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can update their own resumes" ON public.resumes
    FOR UPDATE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can delete their own resumes" ON public.resumes
    FOR DELETE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

-- Storage policies with the same pattern
CREATE POLICY "Users can view their own resumes" ON storage.objects
    FOR SELECT USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN bucket_id = 'resumes' AND get_auth_user_id() = (storage.foldername(name))[1] THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can upload their own resumes" ON storage.objects
    FOR INSERT WITH CHECK (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN bucket_id = 'resumes' 
                AND get_auth_user_id() = (storage.foldername(name))[1]
                AND (storage.extension(name) = 'pdf' OR storage.extension(name) = 'doc' OR storage.extension(name) = 'docx')
                THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can update their own resumes" ON storage.objects
    FOR UPDATE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN bucket_id = 'resumes' AND get_auth_user_id() = (storage.foldername(name))[1] THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can delete their own resumes" ON storage.objects
    FOR DELETE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN bucket_id = 'resumes' AND get_auth_user_id() = (storage.foldername(name))[1] THEN true
            ELSE false
        END
    );
