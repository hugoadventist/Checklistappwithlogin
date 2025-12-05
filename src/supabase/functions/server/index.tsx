import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
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
  const accessToken = request.headers.get('Authorization')?.split(' ')[1];
  if (!accessToken) {
    return { user: null, error: 'No access token provided' };
  }
  
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }
  
  return { user, error: null };
}

// Auth routes
app.post('/make-server-c4e14817/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });
    
    if (error) {
      console.log(`Signup error: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }
    
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
    const checklist = {
      id: checklistId,
      userId: user.id,
      title,
      items: [],
      createdAt: new Date().toISOString()
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

Deno.serve(app.fetch);
