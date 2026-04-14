const fs = require('fs');
let code = fs.readFileSync('src/supabase/functions/server/index.tsx', 'utf8');
code = code.replace(
  /app\.use\('\*',\s*cors\(\{\s*origin:\s*\(origin\)\s*=>\s*origin\s*\|\|\s*'\*',\s*credentials:\s*true,\s*\}\)\);/s,
  `app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'x-client-info', 'apikey'],
}));`
);
fs.writeFileSync('src/supabase/functions/server/index.tsx', code);
