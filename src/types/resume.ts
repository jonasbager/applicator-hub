export interface Resume {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  created_at: string;
  updated_at: string;
}

export interface JobPreferences {
  id?: string; // Optional since we let Supabase generate it
  user_id: string;
  level: string[];
  roles: string[];
  locations: string[];
  skills: string[];
  created_at: string;
  updated_at: string;
}
