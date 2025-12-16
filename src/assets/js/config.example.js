// Supabase Configuration Template
// Copy this file to config.js and fill in your actual values

// Step 1: Get your Supabase project credentials
// Go to: https://app.supabase.com/project/YOUR_PROJECT/settings/api

// Step 2: Copy your Project URL
// Example: https://abcdefghijklmnop.supabase.co
const SUPABASE_PROJECT_ID = 'your-project-id-here'; // The part before .supabase.co
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;

// Step 3: Copy your anon/public key
// This is safe to use in client-side code
const SUPABASE_ANON_KEY = 'your-anon-key-here'; // Starts with 'eyJ...'

// API Base URL (don't change this unless you modified the backend route)
const API_URL = `${SUPABASE_URL}/functions/v1/make-server-c4e14817`;

// Storage keys for localStorage (don't change these)
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'nr12_access_token',
  USER_DATA: 'nr12_user_data'
};

// Example of filled values (REPLACE WITH YOUR ACTUAL VALUES):
/*
const SUPABASE_PROJECT_ID = 'abcdefghijklmnop';
const SUPABASE_URL = 'https://abcdefghijklmnop.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYyMzg4MjY2MCwiZXhwIjoxOTM5NDU4NjYwfQ.example_signature';
*/
