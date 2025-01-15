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

export default function Profile() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences>({
    id: '',
    user_id: '',
    level: [],
    roles: [],
    locations: [],
    skills: [],
    created_at: '',
    updated_at: ''
  });
  const [newLevel, setNewLevel] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [file, setFile] = useState<File | null>(null);

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
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;
    setLoading(true);

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Create resume record
      const { error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: user.id,
          file_path: filePath,
          file_name: file.name
        });

      if (dbError) throw dbError;

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
        description: 'Failed to upload resume'
      });
    } finally {
      setLoading(false);
    }
  };

  const addPreference = async (field: PreferenceField, value: string) => {
    if (!value.trim() || !user) return;

    try {
      const newPrefs = {
        ...preferences,
        [field]: [...preferences[field], value.trim()]
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
        [field]: preferences[field].filter((item: string) => item !== value)
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

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onAddClick={() => {}} hasJobs={true} />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Profile Settings</h1>

          {/* Resume Upload */}
          <Card className="p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">Resume</h2>
            <div className="flex items-center gap-4">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={handleUpload}
                disabled={!file || loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <FileUpload className="h-4 w-4 mr-2" />
                )}
                Upload
              </Button>
            </div>
          </Card>

          {/* Job Preferences */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-6">Job Preferences</h2>

            {/* Experience Level */}
            <div className="mb-6">
              <Label className="mb-2 block">Experience Level</Label>
              <div className="flex flex-wrap gap-2 mb-3">
                {preferences.level.map((level: string) => (
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
                {preferences.roles.map((role: string) => (
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
                {preferences.locations.map((location: string) => (
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
                {preferences.skills.map((skill: string) => (
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
        </div>
      </main>
    </div>
  );
}
