# Deployment Guide - NR-12 Checklist Static Files

This guide will help you deploy the static HTML files to various hosting platforms.

## Prerequisites

1. ✅ Backend deployed to Supabase Edge Functions
2. ✅ Supabase project credentials (Project ID and Anon Key)
3. ✅ Configuration file updated (js/config.js)

## Quick Start

### 1. Configure Your Application

```bash
cd assets/js
cp config.example.js config.js
```

Edit `config.js` and add your Supabase credentials:
```javascript
const SUPABASE_PROJECT_ID = 'your-actual-project-id';
const SUPABASE_ANON_KEY = 'your-actual-anon-key';
```

### 2. Test Locally

```bash
# Using Python 3
python -m http.server 8000

# OR using Node.js
npx http-server -p 8000
```

Visit: http://localhost:8000

## Deployment Options

### Option 1: GitHub Pages

1. Create a new repository on GitHub
2. Push the `/assets` folder contents to the repository
3. Go to Settings > Pages
4. Select branch and folder
5. Save and wait for deployment
6. Access at: https://username.github.io/repository-name/

**GitHub Pages Configuration:**
- Source: Deploy from branch
- Branch: main (or master)
- Folder: / (root) or /docs if you moved files there
- Custom domain: Optional

### Option 2: Netlify

**Method A: Drag & Drop**
1. Go to https://app.netlify.com
2. Drag the `/assets` folder to the deployment area
3. Wait for deployment
4. Access your site at the provided URL

**Method B: Git Integration**
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Netlify
3. Build settings:
   - Build command: (leave empty)
   - Publish directory: `assets`
4. Deploy

**Netlify Configuration (netlify.toml):**
```toml
[build]
  publish = "assets"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to `/assets` folder
3. Run: `vercel`
4. Follow prompts
5. For subsequent deploys: `vercel --prod`

**Vercel Configuration (vercel.json):**
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### Option 4: AWS S3 + CloudFront

1. Create S3 bucket
2. Enable static website hosting
3. Upload all files from `/assets`
4. Set bucket policy for public read
5. Create CloudFront distribution
6. Point to S3 bucket

**S3 Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Option 5: Firebase Hosting

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init hosting`
4. Select project
5. Set public directory: `assets`
6. Configure as SPA: No
7. Deploy: `firebase deploy --only hosting`

**Firebase Configuration (firebase.json):**
```json
{
  "hosting": {
    "public": "assets",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
```

### Option 6: Azure Static Web Apps

1. Go to Azure Portal
2. Create "Static Web App"
3. Connect to GitHub repository
4. Set app location: `/assets`
5. Build location: (leave empty)
6. Output location: (leave empty)
7. Deploy

### Option 7: Traditional Web Hosting (cPanel, etc.)

1. Access your hosting control panel
2. Go to File Manager
3. Navigate to `public_html` or `www`
4. Upload all files from `/assets` folder
5. Ensure index.html is in the root
6. Set proper file permissions (644 for files, 755 for directories)

## Post-Deployment Checklist

After deploying, verify the following:

- [ ] Can access the login page
- [ ] Can create a new account
- [ ] Can login with created account
- [ ] Can create a new checklist
- [ ] Can view checklist details
- [ ] Can update item status
- [ ] Can upload photos
- [ ] Can export reports
- [ ] Can access profile page
- [ ] Can access user management (as admin)

## Common Issues

### Issue: "Network Error" on Login
**Solution:** Check if config.js has correct Supabase credentials

### Issue: CORS Errors
**Solution:** Verify backend CORS settings allow your domain

### Issue: 404 on Page Refresh
**Solution:** Configure your hosting to redirect all routes to index.html (SPA mode)

### Issue: Images Not Loading
**Solution:** Check Supabase Storage bucket permissions and signed URL expiration

### Issue: Authentication Not Persisting
**Solution:** Ensure localStorage is not blocked by browser privacy settings

## Custom Domain Setup

### For Netlify:
1. Go to Domain settings
2. Add custom domain
3. Configure DNS:
   - Type: A Record
   - Name: @ (or subdomain)
   - Value: Netlify's IP (provided)

### For Vercel:
1. Go to Settings > Domains
2. Add your domain
3. Update DNS records as instructed
4. Wait for verification

### For GitHub Pages:
1. Add CNAME file with your domain
2. Update DNS:
   - Type: CNAME
   - Name: www (or @)
   - Value: username.github.io

## SSL/HTTPS

All modern hosting platforms provide free SSL certificates automatically:
- Netlify: Automatic (Let's Encrypt)
- Vercel: Automatic
- GitHub Pages: Automatic for github.io domains
- Firebase: Automatic
- Azure: Automatic

For custom domains, SSL is typically auto-provisioned within minutes to hours.

## Performance Optimization

### 1. Enable Compression
Most platforms enable gzip/brotli automatically.

### 2. Add Caching Headers
Example for Netlify (_headers file):
```
/*
  Cache-Control: public, max-age=3600
/*.html
  Cache-Control: no-cache
```

### 3. CDN
All recommended platforms include CDN by default:
- Netlify: Built-in CDN
- Vercel: Edge Network
- Cloudflare Pages: Global CDN
- AWS CloudFront: Manual setup

## Monitoring

### Setup Monitoring Tools:
1. **Google Analytics**: Add tracking code to each HTML file
2. **Sentry**: Add error tracking for JavaScript errors
3. **Uptime Monitoring**: Use UptimeRobot or Pingdom

## Backup

Always keep backups:
1. Git repository (recommended)
2. Download from hosting provider periodically
3. Export from browser devtools if needed

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all configuration values
3. Test backend endpoints separately
4. Check hosting provider documentation
5. Review deployment logs

## Security Best Practices

1. ✅ Always use HTTPS in production
2. ✅ Never commit real API keys to public repositories
3. ✅ Use environment variables for sensitive data when possible
4. ✅ Regularly update dependencies and frameworks
5. ✅ Enable security headers on your hosting platform
6. ✅ Implement Content Security Policy (CSP)

Example CSP header:
```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://*.supabase.co;
```

## Updates and Maintenance

To update your deployed application:
1. Make changes to files locally
2. Test thoroughly
3. Commit to git (if using git deployment)
4. Push changes or re-upload files
5. Verify deployment
6. Clear browser cache if needed

---

**Need Help?** Check the main README.md for troubleshooting tips.
