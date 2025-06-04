// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mosujjmlfwemaaanhrcm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vc3Vqam1sZndlbWFhYW5ocmNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNzI4MTksImV4cCI6MjA2Mzc0ODgxOX0.vegUrqTj6ou1PKf6Jq6xehaFMuya1j9XKPRJbF2WZj4';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);