import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../lib/supabase';
import { JobPreferences } from '../types/resume';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { Upload as FileUpload, X, Plus, Loader2 } from 'lucide-react';
import { AppSidebar } from '../components/AppSidebar';

type PreferenceField = 'level' | 'roles' | 'locations' | 'skills';

const emptyPreferences: JobPreferences = {
  id: '',
  user_id: '',
  level: [],
  roles: [],
  locations: [],
  skills: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const ALLOWED_FILE_TYPES = [
  { ext: '.pdf', type: 'application/pdf' },
  { ext: '.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }
];

export default function Profile() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<JobPreferences>(emptyPreferences);
  const [newLevel, setNewLevel] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    if (user) {
      loadPreferences();
    }
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setPreferences({
          ...data,
          level: data.level || [],
          roles: data.roles || [],
          locations: data.locations || [],
          skills: data.skills || []
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load preferences'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateFile(file)) {
        setFile(file);
      }
    }
  };

  const validateFile = (file: File) => {
    const isValidType = ALLOWED_FILE_TYPES.some(
      type => file.type === type.type
    );

    if (!isValidType) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a PDF or DOCX file'
      });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setFile(file);
      }
      // Reset the input value so the same file can be selected again
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);

    try {
      // First create the resume record
      const { data: resume, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_path: `${user.id}/${Date.now()}.${file.name.split('.').pop()}`,
          file_name: file.name
        })
        .select()
        .single();

      if (dbError) throw dbError;
      if (!resume) throw new Error('Failed to create resume record');

      // Then upload the file
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(resume.file_path, file, {
          upsert: false
        });

      if (uploadError) {
        // Clean up the record if upload fails
        await supabase
          .from('resumes')
          .delete()
          .eq('id', resume.id);
        throw uploadError;
      }

      toast({
        title: 'Success',
        description: 'Resume uploaded successfully'
      });

      setFile(null);
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload resume'
      });
    } finally {
      setUploading(false);
    }
  };

  const addPreference = async (field: PreferenceField, value: string) => {
    if (!value.trim() || !user) return;

    try {
      const newPrefs = {
        ...preferences,
        user_id: user.id,
        [field]: [...(preferences[field] || []), value.trim()]
      };

      const { error } = await supabase
        .from('job_preferences')
        .upsert(newPrefs);

      if (error) throw error;

      setPreferences(newPrefs);

      // Clear input
      switch (field) {
        case 'level':
          setNewLevel('');
          break;
        case 'roles':
          setNewRole('');
          break;
        case 'locations':
          setNewLocation('');
          break;
        case 'skills':
          setNewSkill('');
          break;
      }

      toast({
        title: 'Success',
        description: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update preferences'
      });
    }
  };

  const removePreference = async (field: PreferenceField, value: string) => {
    if (!user) return;

    try {
      const newPrefs = {
        ...preferences,
        [field]: (preferences[field] || []).filter((item: string) => item !== value)
      };

      const { error } = await supabase
        .from('job_preferences')
        .upsert(newPrefs);

      if (error) throw error;

      setPreferences(newPrefs);

      toast({
        title: 'Success',
        description: 'Preferences updated successfully'
      });
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update preferences'
      });
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onAddClick={() => {}} hasJobs={true} />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              {/* Resume Upload */}
              <Card className="p-6 mb-8">
                <h2 className="text-lg font-semibold mb-4">Resume</h2>
                <div 
                  className={`
                    border-2 border-dashed rounded-lg p-8 mb-4 text-center
                    ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}
                    ${file ? 'bg-secondary/50' : ''}
                  `}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <div className="flex flex-col items-center gap-2">
                    <FileUpload className="h-10 w-10 text-muted-foreground mb-2" />
                    {file ? (
                      <>
                        <p className="text-sm text-muted-foreground">Selected file:</p>
                        <p className="font-medium">{file.name}</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop your resume here, or click to select
                        </p>
                        <Input
                          type="file"
                          accept={ALLOWED_FILE_TYPES.map(type => type.ext).join(',')}
                          onChange={handleFileChange}
                          className="hidden"
                          id="resume-upload"
                        />
                        <label
                          htmlFor="resume-upload"
                          className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 transition-colors"
                        >
                          Select File
                        </label>
                        <p className="text-xs text-muted-foreground mt-2">
                          Supported formats: PDF, DOCX
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {file && (
                  <div className="flex justify-end">
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full sm:w-auto"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <FileUpload className="h-4 w-4 mr-2" />
                          Upload Resume
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>

              {/* Job Preferences */}
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-6">Job Preferences</h2>

                {/* Experience Level */}
                <div className="mb-6">
                  <Label className="mb-2 block">Experience Level</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferences.level?.map((level: string) => (
                      <Badge key={level} variant="secondary" className="gap-1">
                        {level}
                        <button
                          onClick={() => removePreference('level', level)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newLevel}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLevel(e.target.value)}
                      placeholder="Add level (e.g., Entry, Mid, Senior)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => addPreference('level', newLevel)}
                      disabled={!newLevel.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Roles */}
                <div className="mb-6">
                  <Label className="mb-2 block">Roles</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferences.roles?.map((role: string) => (
                      <Badge key={role} variant="secondary" className="gap-1">
                        {role}
                        <button
                          onClick={() => removePreference('roles', role)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newRole}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRole(e.target.value)}
                      placeholder="Add role (e.g., Frontend Developer)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => addPreference('roles', newRole)}
                      disabled={!newRole.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Locations */}
                <div className="mb-6">
                  <Label className="mb-2 block">Locations</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferences.locations?.map((location: string) => (
                      <Badge key={location} variant="secondary" className="gap-1">
                        {location}
                        <button
                          onClick={() => removePreference('locations', location)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newLocation}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewLocation(e.target.value)}
                      placeholder="Add location (e.g., Remote, Copenhagen)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => addPreference('locations', newLocation)}
                      disabled={!newLocation.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <Label className="mb-2 block">Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {preferences.skills?.map((skill: string) => (
                      <Badge key={skill} variant="secondary" className="gap-1">
                        {skill}
                        <button
                          onClick={() => removePreference('skills', skill)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSkill(e.target.value)}
                      placeholder="Add skill (e.g., React, TypeScript)"
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      onClick={() => addPreference('skills', newSkill)}
                      disabled={!newSkill.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
