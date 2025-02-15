import { Handler } from '@netlify/functions';
import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  // Handle CORS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers
    };
  }

  try {
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url, jobId, userId } = JSON.parse(event.body);
    if (!url || !jobId || !userId) {
      throw new Error('Missing required parameters');
    }

    // Launch browser
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 1200, height: 800 });

    // Navigate to URL and wait for content to load
    await page.goto(url, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    await browser.close();

    // Upload PDF to Supabase Storage
    const filename = `${jobId}.pdf`;
    const storagePath = `jobs/${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('job-snapshots')
      .upload(storagePath, pdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('job-snapshots')
      .getPublicUrl(storagePath);

    // Update job_snapshots table with PDF URL
    const { error: updateError } = await supabase
      .from('job_snapshots')
      .update({ pdf_url: publicUrl })
      .eq('job_id', jobId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ pdf_url: publicUrl })
    };

  } catch (error) {
    console.error('Error generating PDF:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};
