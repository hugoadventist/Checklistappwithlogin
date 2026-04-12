import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { setCookie, getCookie } from 'npm:hono/cookie';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';
import { NR12_TEMPLATE } from './nr12-template.ts';

const app = new Hono();

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}));
app.use('*', logger(console.log));

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Initialize storage bucket
const BUCKET_NAME = 'make-c4e14817-checklist-photos';

async function initStorage() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
  
  if (!bucketExists) {
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
      public: false,
      fileSizeLimit: 5242880 // 5MB
    });
    if (error) console.log(`Error creating bucket: ${error.message}`);
  }
}

initStorage();

// Helper function to get user from access token
async function getUser(request: Request) {
  const authHeader = request.headers.get('Authorization');
  console.log('Auth header:', authHeader);
  
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
    console.log('No access token provided in Authorization header or cookies');
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
}

// Auth Session endpoints
app.post('/make-server-c4e14817/auth-session', async (c) => {
  try {
    const { access_token } = await c.req.json();
    setCookie(c, 'nr12_access_token', access_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 3600, // 1 hour match typical JWT
      path: '/'
    });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

app.get('/make-server-c4e14817/validate-session', async (c) => {
  try {
    const token = getCookie(c, 'nr12_access_token');
    if (!token) {
      return c.json({ valid: false }, 401);
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return c.json({ valid: false }, 401);
    }
    
    return c.json({ valid: true, user });
  } catch (err: any) {
    return c.json({ valid: false, error: err.message }, 500);
  }
});

// Auth routes
app.post('/make-server-c4e14817/signup', async (c) => {
  try {
    const { email, password, name, isFirstAdmin } = await c.req.json();
    
    // Generate unique user code
    const userCode = `USR${Date.now().toString().slice(-8)}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Check if this is the first user (make them admin)
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
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
    // Store user info in KV store for easy querying
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email: data.user.email,
      name,
      user_code: userCode,
      role,
      profile_picture: null,
      createdAt: new Date().toISOString()
    });
    
    return c.json({ user: data.user });
  } catch (error) {
    console.log(`Signup error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Checklist routes
app.get('/make-server-c4e14817/checklists', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const checklists = await kv.getByPrefix(`checklist:${user.id}:`);
    return c.json({ checklists });
  } catch (error) {
    console.log(`Error fetching checklists: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-c4e14817/checklists', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const { title } = await c.req.json();
    const checklistId = crypto.randomUUID();
    
    // Create checklist with NR-12 template
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
    return c.json({ checklist });
  } catch (error) {
    console.log(`Error creating checklist: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-c4e14817/checklists/:id', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const checklistId = c.req.param('id');
    const updates = await c.req.json();
    
    const existing = await kv.get(`checklist:${user.id}:${checklistId}`);
    if (!existing) {
      return c.json({ error: 'Checklist not found' }, 404);
    }
    
    const updated = { ...existing, ...updates };
    await kv.set(`checklist:${user.id}:${checklistId}`, updated);
    return c.json({ checklist: updated });
  } catch (error) {
    console.log(`Error updating checklist: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.delete('/make-server-c4e14817/checklists/:id', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const checklistId = c.req.param('id');
    await kv.del(`checklist:${user.id}:${checklistId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting checklist: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Photo upload route
app.post('/make-server-c4e14817/photos/upload', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
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
      return c.json({ error: uploadError.message }, 500);
    }
    
    // Create signed URL valid for 1 year
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);
    
    return c.json({ photoUrl: urlData?.signedUrl, path: fileName });
  } catch (error) {
    console.log(`Photo upload error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// Export report route
app.get('/make-server-c4e14817/checklists/:id/export', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const checklistId = c.req.param('id');
    const checklist = await kv.get(`checklist:${user.id}:${checklistId}`);
    
    if (!checklist) {
      return c.json({ error: 'Checklist not found' }, 404);
    }
    
    // Generate HTML report
    const completedCount = checklist.items.filter((item: any) => item.completed).length;
    const totalCount = checklist.items.length;
    
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
    
    html += `
</body>
</html>
`;
    
    return c.html(html);
  } catch (error) {
    console.log(`Export error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

// User Management routes
app.get('/make-server-c4e14817/users', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Get current user's role
    const currentUserData = await kv.get(`user:${user.id}`);
    const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
    
    // Only Administrators and Managers can list users
    if (currentRole !== 'Administrator' && currentRole !== 'Manager') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    const users = await kv.getByPrefix('user:');
    return c.json({ users });
  } catch (error) {
    console.log(`Error fetching users: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.get('/make-server-c4e14817/users/me', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    let userData = await kv.get(`user:${user.id}`);
    
    // If no data in KV store, create from user metadata
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
    
    return c.json({ user: userData });
  } catch (error) {
    console.log(`Error fetching user profile: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-c4e14817/users/:id', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const targetUserId = c.req.param('id');
    const { name, email } = await c.req.json();
    
    // Users can only edit their own profile, unless they're admin
    const currentUserData = await kv.get(`user:${user.id}`);
    const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
    
    if (user.id !== targetUserId && currentRole !== 'Administrator') {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    const userData = await kv.get(`user:${targetUserId}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    // Update user data
    const updatedData = {
      ...userData,
      name: name || userData.name,
      email: email || userData.email
    };
    
    await kv.set(`user:${targetUserId}`, updatedData);
    
    // Update auth user metadata
    await supabase.auth.admin.updateUserById(targetUserId, {
      email: email || userData.email,
      user_metadata: {
        ...userData,
        name: name || userData.name
      }
    });
    
    return c.json({ user: updatedData });
  } catch (error) {
    console.log(`Error updating user: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.put('/make-server-c4e14817/users/:id/role', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    // Only Administrators can change roles
    const currentUserData = await kv.get(`user:${user.id}`);
    const currentRole = currentUserData?.role || user.user_metadata?.role || 'Employee';
    
    if (currentRole !== 'Administrator') {
      return c.json({ error: 'Only administrators can change user roles' }, 403);
    }
    
    const targetUserId = c.req.param('id');
    const { role } = await c.req.json();
    
    if (!['Administrator', 'Manager', 'Employee'].includes(role)) {
      return c.json({ error: 'Invalid role' }, 400);
    }
    
    const userData = await kv.get(`user:${targetUserId}`);
    if (!userData) {
      return c.json({ error: 'User not found' }, 404);
    }
    
    const updatedData = { ...userData, role };
    await kv.set(`user:${targetUserId}`, updatedData);
    
    // Update auth user metadata
    await supabase.auth.admin.updateUserById(targetUserId, {
      user_metadata: { ...userData, role }
    });
    
    return c.json({ user: updatedData });
  } catch (error) {
    console.log(`Error updating user role: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

app.post('/make-server-c4e14817/users/:id/profile-picture', async (c) => {
  try {
    const { user, error } = await getUser(c.req.raw);
    if (error || !user) {
      return c.json({ error: error || 'Unauthorized' }, 401);
    }
    
    const targetUserId = c.req.param('id');
    
    // Users can only change their own profile picture
    if (user.id !== targetUserId) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ error: 'No file provided' }, 400);
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
      return c.json({ error: uploadError.message }, 500);
    }
    
    // Create signed URL valid for 1 year
    const { data: urlData } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(fileName, 31536000);
    
    // Update user data
    const userData = await kv.get(`user:${user.id}`);
    const updatedData = {
      ...userData,
      profile_picture: urlData?.signedUrl
    };
    
    await kv.set(`user:${user.id}`, updatedData);
    
    // Update auth user metadata
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { ...updatedData }
    });
    
    return c.json({ profile_picture: urlData?.signedUrl });
  } catch (error) {
    console.log(`Profile picture upload error: ${error.message}`);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);