import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../lib/supabase';
import { JobPreferences, Resume } from '../types/resume';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { useToast } from '../components/ui/use-toast';
import { Upload as FileUpload, X, Plus, Loader2, FileText, Download, Trash2 } from 'lucide-react';
import { AppSidebar } from '../components/AppSidebar';
import { getUserId } from '../lib/user-id';

type PreferenceField = 'level' | 'roles' | 'locations' | 'skills';

const emptyPreferences: Omit<JobPreferences, 'id'> = {
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
  const navigate = useNavigate();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [newLevel, setNewLevel] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [file, setFile] = useState<File | null>(null);
  type ProcessingStatus = 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  const [status, setStatus] = useState<ProcessingStatus>('idle');

  const statusColors = {
    idle: 'bg-gray-100 text-gray-700',
    uploading: 'bg-blue-100 text-blue-700',
    processing: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
    error: 'bg-red-100 text-red-700'
  };

  const statusText = {
    idle: 'Ready',
    uploading: 'Uploading...',
    processing: 'Processing...',
    completed: 'Completed',
    error: 'Error'
  };
  const [dragActive, setDragActive] = useState(false);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(true);

  useEffect(() => {
    if (user) {
      loadPreferences();
      loadResumes();
    }
  }, [user]);

  const loadResumes = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', getUserId(user.id))
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResumes(data || []);
    } catch (error) {
      console.error('Error loading resumes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load resumes'
      });
    } finally {
      setLoadingResumes(false);
    }
  };

  const loadPreferences = async () => {
    if (!user) {
      console.warn('No user available for loading preferences');
      return;
    }

    const currentUserId = getUserId(user.id);
    console.log('Loading preferences for user:', currentUserId);

    try {
      console.log('Fetching preferences from Supabase...');
      
      // Try to get existing preferences
      const { data: existingPrefs, error: selectError } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', getUserId(user.id))
        .maybeSingle();

      if (selectError) {
        console.error('Error fetching preferences:', selectError);
        if (selectError.code !== 'PGRST116') throw selectError;
      }

      if (existingPrefs) {
        console.log('Found existing preferences:', existingPrefs);
        setPreferences({
          ...existingPrefs,
          level: existingPrefs.level || [],
          roles: existingPrefs.roles || [],
          locations: existingPrefs.locations || [],
          skills: existingPrefs.skills || []
        });
        return;
      }

      console.log('Creating new preferences for user:', getUserId(user.id));
      
      // Create empty preferences if none exist
      const newPrefs = {
        ...emptyPreferences,
        user_id: getUserId(user.id)
      };

      console.log('Creating new preferences with user_id:', currentUserId);
      const { data: inserted, error: insertError } = await supabase
        .from('job_preferences')
        .insert(newPrefs)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating preferences:', insertError);
        throw insertError;
      }

      if (!inserted) {
        console.error('No preferences returned after insert');
        throw new Error('Failed to create preferences');
      }
      
      console.log('Successfully created preferences:', inserted);
      setPreferences(inserted);
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
      e.target.value = '';
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      console.warn('No file or user available for upload');
      return;
    }
    setStatus('uploading');

    try {
      const userId = getUserId(user.id);
      console.log('Uploading resume for user:', userId);
      
      // First create the resume record
      console.log('Creating resume record...');
      const { data: resume, error: dbError } = await supabase
        .from('resumes')
        .insert({
          user_id: userId,
          file_path: `${userId}/${Date.now()}-${file.name}`,
          file_name: file.name
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error creating resume record:', dbError);
        throw dbError;
      }
      if (!resume) {
        console.error('No resume record returned after insert');
        throw new Error('Failed to create resume record');
      }

      console.log('Successfully created resume record:', resume);

      // Then upload the file
      console.log('Uploading file to storage...');
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(resume.file_path, file, {
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Clean up the record if upload fails
        console.log('Cleaning up failed resume record...');
        await supabase
          .from('resumes')
          .delete()
          .eq('id', resume.id);
        throw uploadError;
      }

      // Analyze the resume
      console.log('Analyzing resume...');
      setStatus('processing');
      const analyzeUrl = '/.netlify/functions/analyze-resume';
      
      console.log('Calling analyze-resume function at:', analyzeUrl);
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId: resume.id,
          userId: userId
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Resume analysis failed:', error);
        throw new Error(error.details || 'Failed to analyze resume');
      }

      const analysis = await response.json();
      console.log('Resume analysis completed:', analysis);
      
      // Navigate to recommended jobs page
      navigate('/recommended-jobs');

      setStatus('completed');
      toast({
        title: 'Success',
        description: 'Resume uploaded and analyzed successfully'
      });

      setFile(null);
      loadResumes(); // Refresh the list
      loadPreferences(); // Refresh preferences with AI-generated data

      // Reset status after a delay
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setStatus('error');
      console.error('Error uploading resume:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload resume'
      });

      // Reset status after a delay
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const handleDownload = async (resume: Resume) => {
    try {
      const { data, error } = await supabase.storage
        .from('resumes')
        .download(resume.file_path);

      if (error) throw error;

      // Create a download link
      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.file_name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading resume:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to download resume'
      });
    }
  };

  const handleDelete = async (resume: Resume) => {
    try {
      // First delete the file
      const { error: storageError } = await supabase.storage
        .from('resumes')
        .remove([resume.file_path]);

      if (storageError) throw storageError;

      // Then delete the record
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', resume.id);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'Resume deleted successfully'
      });

      loadResumes(); // Refresh the list
    } catch (error) {
      console.error('Error deleting resume:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to delete resume'
      });
    }
  };

  const addPreference = async (field: PreferenceField, value: string) => {
    if (!value.trim() || !user || !preferences) return;

    try {
      const newPrefs = {
        ...preferences,
        [field]: [...(preferences[field] || []), value.trim()]
      };

      const { error } = await supabase
        .from('job_preferences')
        .update(newPrefs)
        .eq('user_id', getUserId(user.id));

      if (error) throw error;

      setPreferences(newPrefs);

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
    if (!user || !preferences) return;

    try {
      const newPrefs = {
        ...preferences,
        [field]: (preferences[field] || []).filter((item: string) => item !== value)
      };

      const { error } = await supabase
        .from('job_preferences')
        .update(newPrefs)
        .eq('user_id', getUserId(user.id));

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
                {file ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm ${statusColors[status]}`}>
                        {statusText[status]}
                      </div>
                      <Button
                        onClick={handleUpload}
                        disabled={status !== 'idle'}
                        className="w-full sm:w-auto ml-auto"
                      >
                        {status !== 'idle' ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            {statusText[status]}
                          </>
                        ) : (
                          <>
                            <FileUpload className="h-4 w-4 mr-2" />
                            Upload Resume
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    className={`
                      border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                      ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
                      hover:border-blue-500 hover:bg-blue-50 transition-colors
                    `}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('resume-upload')?.click()}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <FileUpload className="h-10 w-10 text-gray-400 mb-2" />
                      <p className="text-lg font-medium">Upload your resume</p>
                      <p className="text-sm text-gray-500">
                        Drag and drop your resume here, or click to select
                      </p>
                      <Input
                        type="file"
                        accept={ALLOWED_FILE_TYPES.map(type => type.ext).join(',')}
                        onChange={handleFileChange}
                        className="hidden"
                        id="resume-upload"
                      />
                      <p className="text-xs text-gray-400 mt-2">
                        Supported formats: PDF, DOCX
                      </p>
                    </div>
                  </div>
                )}

                {/* Existing Resumes */}
                {loadingResumes ? (
                  <div className="flex items-center justify-center mt-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : resumes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Your Resumes</h3>
                    <div className="space-y-2">
                      {resumes.map((resume) => (
                        <div
                          key={resume.id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-gray-400" />
                            <span className="text-sm font-medium">{resume.file_name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownload(resume)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(resume)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    {preferences?.level?.map((level: string) => (
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
                    {preferences?.roles?.map((role: string) => (
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
                    {preferences?.locations?.map((location: string) => (
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
                    {preferences?.skills?.map((skill: string) => (
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
