import { Handler } from '@netlify/functions';

export const handler: Handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  // List all environment variables (without showing their values)
  const envVars = {
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    // Add first few characters of each value for verification
    SUPABASE_URL_PREFIX: process.env.SUPABASE_URL?.substring(0, 10),
    SUPABASE_KEY_PREFIX: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 5),
    OPENAI_KEY_PREFIX: process.env.OPENAI_API_KEY?.substring(0, 5),
  };

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Environment variables status',
      variables: envVars,
      nodeEnv: process.env.NODE_ENV,
      functionName: process.env.FUNCTION_NAME,
    }, null, 2),
  };
};
