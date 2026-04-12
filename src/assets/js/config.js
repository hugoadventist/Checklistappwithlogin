// Supabase Configuration
// IMPORTANT: Update these values with your actual Supabase project credentials
const SUPABASE_PROJECT_ID = 'hqsphkdwkncmsxqrhmly'; // Replace with your project ID
const SUPABASE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co`;
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with your anon key

// API Base URL
const API_URL = `${SUPABASE_URL}/functions/v1/make-server-c4e14817`;

// Storage keys
const STORAGE_KEYS = {
  // ACCESS_TOKEN is deprecated in favor of HttpOnly cookies
  USER_DATA: 'nr12_user_data'
};
