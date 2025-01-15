export interface Resume {
  id: string;
  user_id: string;
  file_path: string;
  file_name: string;
  content?: string;
  parsed_data?: {
    skills: string[];
    experience: {
      title: string;
      company: string;
      duration: string;
      description: string;
    }[];
    education: {
      degree: string;
      school: string;
      year: string;
    }[];
  };
  created_at: string;
  updated_at: string;
}

export interface JobPreferences {
  id: string;
  user_id: string;
  level: string[];
  roles: string[];
  locations: string[];
  skills: string[];
  min_salary?: number;
  max_salary?: number;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

// Utility types for forms
export interface ResumeFormData {
  file: File;
}

export interface JobPreferencesFormData {
  level: string[];
  roles: string[];
  locations: string[];
  skills: string[];
  min_salary?: number;
  max_salary?: number;
}
