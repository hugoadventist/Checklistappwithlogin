import { corsHeaders } from 'https://esm.sh/@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from '../_shared/kv_store.ts';
import { NR12_TEMPLATE } from '../_shared/nr12-template.ts';

console.log(`Function "api-server" up and running!`);

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize storage bucket
const BUCKET_NAME = 'make-c4e14817-checklist-photos';

async function initStorage() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 5242880 // 5MB
      });
      if (error) console.log(`Error creating bucket: ${error.message}`);
    }
  } catch (error) {
    console.log(`Storage initialization error: ${error.message}`);
  }
}

initStorage();

// Helper function to get user from access token
async function getUser(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    let accessToken = authHeader?.split(' ')[1];
    
    if (!accessToken) {
      // Check cookies for access token
      const cookieHeader = request.headers.get('Cookie');
      if (cookieHeader) {
        const match = cookieHeader.match(/nr12_access_token=([^;]+)/);
        if (match) {
          accessToken = match[1];
          console.log('Access token found in cookies');
        }
      }
    }

    if (!accessToken) {
      console.log('No access token provided');
      return { user: null, error: 'No access token provided' };
    }
    
    console.log('Attempting to verify user with access token');
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error) {
      console.log('Auth error:', error.message);
      return { user: null, error: error.message };
    }
    
    if (!user) {
      console.log('No user found for access token');
      return { user: null, error: 'Invalid token' };
    }
    
    console.log('User authenticated:', user.id);
    return { user, error: null };
  } catch (error: any) {
    console.log('Error in getUser:', error.message);
    return { user: null, error: error.message };
  }
}

// Helper to set cookie in response headers
function setCookieHeader(name: string, value: string, maxAge: number = 3600) {
  return `${name}=${value}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

// Parse URL and method for routing
function parseRequest(req: Request) {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;
  
  // Extract path segments after /api-server/
  const pathSegments = path.split('/').filter(Boolean);
  const apiIndex = pathSegments.indexOf('api-server');
  const routePath = `/${pathSegments.slice(apiIndex + 1).join('/')}`;
  
  return { path: routePath, method, url };
}

// Main request handler
Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { path, method } = parseRequest(req);
  
  try {
    console.log(`${method} ${path}`);

    // ============ AUTH SESSION ENDPOINTS ============
    
    // POST /api-server/auth-session
    if (method === 'POST' && path === '/auth-session') {
      try {
        const { access_token } = await req.json();
        const setCookieHeader = `nr12_access_token=${access_token}; Path=/; Max-Age=3600; HttpOnly; Secure; SameSite=Lax`;
        
        return new Response(
          JSON.stringify({ success: true }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Set-Cookie': setCookieHeader },
            status: 200,
          }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ error: error.message }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          }
        );
      }
    }

    // GET /api-server/validate-session
    if (method === 'GET' && path === '/validate-session') {
      try {
        const cookieHeader = req.headers.get('Cookie');
        let token: string | null = null;
        
        if (cookieHeader) {
          const match = cookieHeader.match(/nr12_access_token=([^;]+)/);
          token = match?.[1] || null;
        }
        
        if (!token) {
          return new Response(
            JSON.stringify({ valid: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          return new Response(
            JSON.stringify({ valid: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        return new Response(
          JSON.stringify({ valid: true, user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        return new Response(
          JSON.stringify({ valid: false, error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============ SIGNUP ENDPOINT ============
    
    // POST /api-server/signup
    if (method === 'POST' && path === '/signup') {
      try {
        const { email, password, name, isFirstAdmin } = await req.json();
        
        const userCode = `USR${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        
        let role = 'Employee';
        if (isFirstAdmin) {
          const existingUsers = await kv.getByPrefix('user:');
          if (existingUsers.length === 0) {
            role = 'Administrator';
          }
        }
        
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password,
          user_metadata: { 
            name,
            user_code: userCode,
            role,
            profile_picture: null
          },
          email_confirm: true
        });
        
        if (error) {
          console.log(`Signup error: ${error.message}`);
          return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        await kv.set(`user:${data.user.id}`, {
          id: data.user.id,
          email: data.user.email,
          name,
          user_code: userCode,
          role,
          profile_picture: null,
          createdAt: new Date().toISOString()
        });
        
        return new Response(
          JSON.stringify({ user: data.user }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Signup error: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============ CHECKLISTS ENDPOINTS ============
    
    // GET /api-server/checklists
    if (method === 'GET' && path === '/checklists') {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const checklists = await kv.getByPrefix(`checklist:${user.id}:`);
        return new Response(
          JSON.stringify({ checklists }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error fetching checklists: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // POST /api-server/checklists
    if (method === 'POST' && path === '/checklists') {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const { title } = await req.json();
        const checklistId = crypto.randomUUID();
        
        const checklist = {
          id: checklistId,
          userId: user.id,
          title,
          chapters: NR12_TEMPLATE.map(chapter => ({
            ...chapter,
            items: chapter.items.map(item => ({
              ...item,
              id: `${checklistId}-${item.id}`
            }))
          })),
          createdAt: new Date().toISOString(),
          lastSaved: new Date().toISOString()
        };
        
        await kv.set(`checklist:${user.id}:${checklistId}`, checklist);
        return new Response(
          JSON.stringify({ checklist }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error creating checklist: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // PUT /api-server/checklists/:id
    if (method === 'PUT' && path.startsWith('/checklists/')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const checklistId = path.split('/')[2];
        const updates = await req.json();
        
        const existing = await kv.get(`checklist:${user.id}:${checklistId}`);
        if (!existing) {
          return new Response(
            JSON.stringify({ error: 'Checklist not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const updated = { ...existing, ...updates };
        await kv.set(`checklist:${user.id}:${checklistId}`, updated);
        return new Response(
          JSON.stringify({ checklist: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error updating checklist: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // DELETE /api-server/checklists/:id
    if (method === 'DELETE' && path.startsWith('/checklists/')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const checklistId = path.split('/')[2];
        await kv.del(`checklist:${user.id}:${checklistId}`);
        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error deleting checklist: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============ PHOTOS ENDPOINT ============
    
    // POST /api-server/photos/upload
    if (method === 'POST' && path === '/photos/upload') {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file provided' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { data, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, fileBuffer, {
            contentType: file.type
          });
        
        if (uploadError) {
          console.log(`Photo upload error: ${uploadError.message}`);
          return new Response(
            JSON.stringify({ error: uploadError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(fileName, 31536000);
        
        return new Response(
          JSON.stringify({ photoUrl: urlData?.signedUrl, path: fileName }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Photo upload error: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============ EXPORT ENDPOINT ============
    
    // GET /api-server/checklists/:id/export
    if (method === 'GET' && path.includes('/export')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const checklistId = path.split('/')[2];
        const checklist = await kv.get(`checklist:${user.id}:${checklistId}`);
        
        if (!checklist) {
          return new Response(
            JSON.stringify({ error: 'Checklist not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const completedCount = checklist.items?.filter((item: any) => item.completed).length || 0;
        const totalCount = checklist.items?.length || 0;
        
        let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Checklist Report - ${checklist.title}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #333; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
    .meta { color: #666; margin-bottom: 30px; }
    .summary { background: #F3F4F6; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .item { border: 1px solid #E5E7EB; padding: 15px; margin-bottom: 15px; border-radius: 8px; }
    .item.completed { background: #F0FDF4; }
    .item-text { font-size: 16px; margin-bottom: 10px; }
    .item-status { font-weight: bold; color: #059669; }
    .item-status.pending { color: #DC2626; }
    .photo { max-width: 100%; margin-top: 10px; border-radius: 4px; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>${checklist.title}</h1>
  <div class="meta">
    <p>Generated: ${new Date().toLocaleString()}</p>
    <p>Created: ${new Date(checklist.createdAt).toLocaleString()}</p>
  </div>
  <div class="summary">
    <h2>Summary</h2>
    <p>Progress: ${completedCount} of ${totalCount} items completed (${totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%)</p>
  </div>
  <h2>Items</h2>
`;
        
        if (checklist.items && Array.isArray(checklist.items)) {
          for (const item of checklist.items) {
            const status = item.completed ? 'Completed' : 'Pending';
            const statusClass = item.completed ? '' : 'pending';
            
            html += `
  <div class="item ${item.completed ? 'completed' : ''}">
    <div class="item-text">${item.text}</div>
    <div class="item-status ${statusClass}">${status}</div>
`;
            
            if (item.photoUrl) {
              html += `    <img class="photo" src="${item.photoUrl}" alt="Item photo" />\n`;
            }
            
            html += `  </div>\n`;
          }
        }
        
        html += `
</body>
</html>
`;
        
        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
          status: 200
        });
      } catch (error: any) {
        console.log(`Export error: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // ============ USER MANAGEMENT ENDPOINTS ============
    
    // GET /api-server/users
    if (method === 'GET' && path === '/users') {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const currentUserData = await kv.get(`user:${user.id}`);
        const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
        
        if (currentRole !== 'Administrator' && currentRole !== 'Manager') {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        
        const users = await kv.getByPrefix('user:');
        return new Response(
          JSON.stringify({ users }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error fetching users: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // GET /api-server/users/me
    if (method === 'GET' && path === '/users/me') {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        let userData = await kv.get(`user:${user.id}`);
        
        if (!userData) {
          userData = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name,
            user_code: user.user_metadata?.user_code,
            role: user.user_metadata?.role || 'Employee',
            profile_picture: user.user_metadata?.profile_picture,
            createdAt: user.created_at
          };
          await kv.set(`user:${user.id}`, userData);
        }
        
        return new Response(
          JSON.stringify({ user: userData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error fetching user profile: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // PUT /api-server/users/:id
    if (method === 'PUT' && path.startsWith('/users/') && !path.includes('/role') && !path.includes('/profile-picture')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const targetUserId = path.split('/')[2];
        const { name, email } = await req.json();
        
        const currentUserData = await kv.get(`user:${user.id}`);
        const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
        
        if (user.id !== targetUserId && currentRole !== 'Administrator') {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        
        const userData = await kv.get(`user:${targetUserId}`);
        if (!userData) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const updatedData = {
          ...userData,
          name: name || userData.name,
          email: email || userData.email
        };
        
        await kv.set(`user:${targetUserId}`, updatedData);
        
        await supabase.auth.admin.updateUserById(targetUserId, {
          email: email || userData.email,
          user_metadata: {
            ...userData,
            name: name || userData.name
          }
        });
        
        return new Response(
          JSON.stringify({ user: updatedData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error updating user: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // PUT /api-server/users/:id/role
    if (method === 'PUT' && path.includes('/role')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const currentUserData = await kv.get(`user:${user.id}`);
        const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
        
        if (currentRole !== 'Administrator') {
          return new Response(
            JSON.stringify({ error: 'Only administrators can change user roles' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        
        const targetUserId = path.split('/')[2];
        const { role } = await req.json();
        
        if (!['Administrator', 'Manager', 'Employee'].includes(role)) {
          return new Response(
            JSON.stringify({ error: 'Invalid role' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const userData = await kv.get(`user:${targetUserId}`);
        if (!userData) {
          return new Response(
            JSON.stringify({ error: 'User not found' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
          );
        }
        
        const updatedData = { ...userData, role };
        await kv.set(`user:${targetUserId}`, updatedData);
        
        await supabase.auth.admin.updateUserById(targetUserId, {
          user_metadata: { ...userData, role }
        });
        
        return new Response(
          JSON.stringify({ user: updatedData }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Error updating user role: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // POST /api-server/users/:id/profile-picture
    if (method === 'POST' && path.includes('/profile-picture')) {
      try {
        const { user, error } = await getUser(req);
        if (error || !user) {
          return new Response(
            JSON.stringify({ error: error || 'Unauthorized' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
          );
        }
        
        const targetUserId = path.split('/')[2];
        
        if (user.id !== targetUserId) {
          return new Response(
            JSON.stringify({ error: 'Insufficient permissions' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
          );
        }
        
        const formData = await req.formData();
        const file = formData.get('file') as File;
        
        if (!file) {
          return new Response(
            JSON.stringify({ error: 'No file provided' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }
        
        const fileExt = file.name.split('.').pop();
        const fileName = `profile-pictures/${user.id}/${crypto.randomUUID()}.${fileExt}`;
        const fileBuffer = await file.arrayBuffer();
        
        const { data, error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, fileBuffer, {
            contentType: file.type,
            upsert: true
          });
        
        if (uploadError) {
          console.log(`Profile picture upload error: ${uploadError.message}`);
          return new Response(
            JSON.stringify({ error: uploadError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }
        
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .createSignedUrl(fileName, 31536000);
        
        const userData = await kv.get(`user:${user.id}`);
        const updatedData = {
          ...userData,
          profile_picture: urlData?.signedUrl
        };
        
        await kv.set(`user:${user.id}`, updatedData);
        
        await supabase.auth.admin.updateUserById(user.id, {
          user_metadata: { ...updatedData }
        });
        
        return new Response(
          JSON.stringify({ profile_picture: urlData?.signedUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } catch (error: any) {
        console.log(`Profile picture upload error: ${error.message}`);
        return new Response(
          JSON.stringify({ error: error.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
    }

    // 404 - Route not found
    return new Response(
      JSON.stringify({ error: 'Route not found' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
    );
  } catch (error: any) {
    console.error('Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
