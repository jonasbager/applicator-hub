import { Handler } from '@netlify/functions';
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
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
    console.log('Function started');
    
    if (!event.body) {
      throw new Error('Missing request body');
    }

    const { url, jobId, userId } = JSON.parse(event.body);
    console.log('Parsed parameters:', { url, jobId, userId });
    
    if (!url || !jobId || !userId) {
      throw new Error('Missing required parameters');
    }

    console.log('Getting chromium path...');
    const executablePath = await chromium.executablePath();
    console.log('Chromium path:', executablePath);

    console.log('Launching browser with config...');
    const config = {
      args: [
        ...chromium.args,
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote',
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    };
    console.log('Browser config:', config);

    const browser = await puppeteer.launch(config);
    console.log('Browser launched successfully');
    const page = await browser.newPage();

    // Set viewport size
    await page.setViewport({ width: 1200, height: 800 });

    console.log('Setting up page...');
    // Navigate to URL and wait for content to load
    try {
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 20000 // 20 seconds timeout
      });
      console.log('Page loaded successfully');
    } catch (pageError) {
      console.error('Error loading page:', pageError);
      throw pageError;
    }

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

    console.log('Generated PDF, size:', pdf.length);
    await browser.close();
    console.log('Browser closed');

    console.log('Uploading to Supabase Storage...');
    // Upload PDF to Supabase Storage
    const filename = `${jobId}.pdf`;
    const storagePath = `jobs/${userId}/${filename}`;

    const { error: uploadError } = await supabase.storage
      .from('job-snapshots')
      .upload(storagePath, pdf, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }
    console.log('PDF uploaded successfully');

    console.log('Getting public URL...');
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

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }
    console.log('Database updated successfully');

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
