import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req: Request) => {
  console.log('Request received:', req.method);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling CORS preflight request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.error('Invalid method:', req.method);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: corsHeaders,
      });
    }

    // Get the request body
    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      if (!text) {
        throw new Error('Empty request body');
      }
      body = JSON.parse(text);
      console.log('Parsed request body:', body);
    } catch (error) {
      console.error('Error parsing request body:', error);
      return new Response(JSON.stringify({ 
        error: 'Invalid JSON in request body',
        details: error.message,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    const { url } = body;
    if (!url) {
      console.error('URL is missing from request body');
      return new Response(JSON.stringify({ 
        error: 'URL is required',
        body: body,
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // For testing, return a mock response
    console.log('Returning mock response for URL:', url);
    const mockResponse = {
      title: "Software Engineer",
      company: "Test Company",
      location: "Remote",
      description: "This is a test job description",
      url: url
    };

    console.log('Mock response:', mockResponse);
    return new Response(JSON.stringify(mockResponse), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'An unexpected error occurred while processing the request',
      stack: error.stack,
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
