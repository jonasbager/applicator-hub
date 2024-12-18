import { supabase } from './supabase';
import { Job, DateValue } from '../types/job';

export interface JobDetails {
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  deadline?: DateValue;
  start_date?: DateValue;
}

// Use backend server in development, Netlify function in production
const SCRAPE_URL = import.meta.env.DEV 
  ? 'http://localhost:3001/api/scrape-job'
  : '/.netlify/functions/scrape-job';

export async function scrapeJobDetails(url: string): Promise<JobDetails> {
  try {
    console.log('Scraping job details for URL:', url);

    const response = await fetch(SCRAPE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Log the full error response for debugging
      console.error('Scraping error response:', data);
      
      // Extract error details from the response
      const errorMessage = data.details || data.error || response.statusText;
      throw new Error(`Failed to fetch job details: ${errorMessage}`);
    }

    // Validate the response
    const jobDetails = data as JobDetails;
    const requiredFields = ['position', 'company', 'description', 'keywords', 'url'];
    for (const field of requiredFields) {
      if (!(field in jobDetails)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Ensure deadline and start_date are properly handled
    return {
      ...jobDetails,
      deadline: jobDetails.deadline || null,
      start_date: jobDetails.start_date || null,
    };
  } catch (error) {
    console.error('Error scraping job:', error);
    
    // Enhanced error logging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    } else {
      console.error('Unknown error type:', error);
      throw new Error('An unexpected error occurred while scraping the job details');
    }
  }
}

export async function saveJob(jobDetails: JobDetails) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          user_id: session.user.id,
          position: jobDetails.position,
          company: jobDetails.company,
          description: jobDetails.description,
          keywords: jobDetails.keywords,
          url: jobDetails.url,
          deadline: jobDetails.deadline || null,
          start_date: jobDetails.start_date || null,
          status: 'Not Started',
          notes: [],
          application_draft_url: '',
        },
      ])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error saving job:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to save job');
    }
  }
}

export async function updateJobStatus(jobId: string, status: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ status })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job status:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to update job status');
    }
  }
}

export async function updateJobDeadline(jobId: string, deadline: DateValue) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ deadline })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job deadline:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to update job deadline');
    }
  }
}

export async function updateJobStartDate(jobId: string, start_date: DateValue) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ start_date })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job start date:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to update job start date');
    }
  }
}

export async function updateJobNotes(jobId: string, notes: string[]) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ notes })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job notes:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to update job notes');
    }
  }
}

export async function updateJobApplicationUrl(jobId: string, applicationUrl: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ application_draft_url: applicationUrl })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error updating job application URL:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to update job application URL');
    }
  }
}

export async function deleteJob(jobId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId)
      .eq('user_id', session.user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting job:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to delete job');
    }
  }
}

export async function getJobs() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', session.user.id)
      .is('archived', false)  // Only show non-archived jobs
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to fetch jobs');
    }
  }
}

export async function getArchivedJobs() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('archived', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching archived jobs:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to fetch archived jobs');
    }
  }
}

export async function archiveJob(jobId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ archived: true })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error archiving job:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to archive job');
    }
  }
}

export async function restoreJob(jobId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No active session');
    }

    const { data, error } = await supabase
      .from('jobs')
      .update({ archived: false })
      .eq('id', jobId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error restoring job:', error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Failed to restore job');
    }
  }
}
