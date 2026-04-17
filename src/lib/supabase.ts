import { createClient } from '@supabase/supabase-js';
import {
  PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  PUBLIC_SUPABASE_URL,
} from './publicConfig';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabasePublishableKey = PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);
export const SUPABASE_CONFIG_ERROR =
  'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to enable auth and chat.';

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey,
);
