import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';
import { SUPABASE_CONFIG } from './config.js';

if (!SUPABASE_CONFIG.URL || SUPABASE_CONFIG.URL === 'TU_SUPABASE_URL') {
    console.error("Supabase config is missing! Check js/config.js or GitHub Secrets.");
}

export const supabase = createClient(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.KEY);
