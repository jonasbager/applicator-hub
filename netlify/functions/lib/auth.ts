import { createClient } from '@supabase/supabase-js';
import type { HandlerEvent } from '@netlify/functions';

// A service-role client is fine for token verification: `auth.getUser(jwt)`
// validates whatever token is passed, independent of the client's own key.
const authClient = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

/**
 * Returns the verified Supabase user id from the request's Bearer token, or
 * null if the token is missing/invalid. Callers must reject (401) on null —
 * never trust a user id taken from the request body.
 */
export async function getVerifiedUserId(event: HandlerEvent): Promise<string | null> {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
  if (!token) return null;

  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}
