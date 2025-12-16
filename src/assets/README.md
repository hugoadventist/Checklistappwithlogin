# NR-12 Checklist System - Static Files

This folder contains the static HTML files for the NR-12 Checklist System, built with Bootstrap 5 and vanilla JavaScript.

## Files Structure

```
/assets/
├── index.html              # Login page
├── signup.html             # User registration page
├── dashboard.html          # Checklist dashboard
├── checklist.html          # Individual checklist detail view
├── profile.html            # User profile management
├── user-management.html    # Admin user management
├── js/
│   ├── config.js          # Configuration and API settings
│   └── auth.js            # Authentication utilities
└── README.md              # This file
```

## Setup Instructions

### 1. Configure Supabase Credentials

Edit `/assets/js/config.js` and update the following values with your Supabase project credentials:

```javascript
const SUPABASE_PROJECT_ID = 'your-project-id'; // Replace with your actual project ID
const SUPABASE_ANON_KEY = 'your-anon-key';     // Replace with your actual anon key
```

You can find these values in your Supabase project dashboard under Settings > API.

### 2. Deploy the Backend

Make sure the backend server is deployed and running. The backend should be accessible at:
```
https://your-project-id.supabase.co/functions/v1/make-server-c4e14817
```

### 3. Serve the Static Files

You can serve these static files using any web server. Here are some options:

#### Option A: Python HTTP Server
```bash
cd assets
python -m http.server 8000
```
Then open: http://localhost:8000

#### Option B: Node.js http-server
```bash
npm install -g http-server
cd assets
http-server -p 8000
```
Then open: http://localhost:8000

#### Option C: Deploy to Static Hosting
Upload the entire `/assets` folder to any static hosting service:
- GitHub Pages
- Netlify
- Vercel
- AWS S3 + CloudFront
- Azure Static Web Apps
- Firebase Hosting

### 4. First User Setup

When you first access the application:
1. Click "Create Account" on the login page
2. Fill in the registration form
3. The first user to register will automatically become an Administrator
4. Subsequent users will be created as Employees by default

## Features

### Authentication
- User registration with auto-generated user codes
- Secure login with email and password
- Three-tier role system (Administrator, Manager, Employee)
- Session management with localStorage

### Checklist Management
- Create and manage NR-12 checklists
- 8 chapters with 29+ items based on NR-12 standard
- Four item statuses: Pending, Compliant, Non-Compliant, N/A
- Color-coded status indicators
- Progress tracking per chapter and overall

### Item Features
- Status marking (Compliant/Non-Compliant/N/A)
- Observations and markings text field
- Photo upload for each item
- Mandatory item validation
- Auto-save functionality

### User Management (Admin/Manager only)
- View all users
- Edit user information
- Change user roles (Administrator only)
- Profile picture management

### Profile Management
- Update personal information
- Upload profile picture
- View user code and role
- Change email and name

### Report Export
- Generate detailed HTML reports
- Include all items with statuses
- Show attached photos
- Print-friendly format

## Technologies Used

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **CSS Framework**: Bootstrap 5.3.0
- **Icons**: Bootstrap Icons 1.10.0
- **Backend**: Supabase Edge Functions (Hono.js)
- **Database**: Supabase PostgreSQL (Key-Value Store)
- **File Storage**: Supabase Storage
- **Authentication**: Supabase Auth

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security Notes

1. **HTTPS Required**: For production, serve over HTTPS only
2. **API Keys**: Never commit real API keys to version control
3. **CORS**: The backend is configured with open CORS for development
4. **Access Tokens**: Stored in localStorage (consider more secure options for production)
5. **File Upload**: Limited to 5MB per file

## Troubleshooting

### Login Not Working
- Check if config.js has correct Supabase credentials
- Verify backend is deployed and accessible
- Check browser console for errors

### Photos Not Uploading
- Ensure Supabase Storage bucket is created
- Check file size (max 5MB)
- Verify access token is valid

### Auto-save Not Working
- Check network tab for failed requests
- Ensure backend PUT endpoint is working
- Check browser console for JavaScript errors

### Users Can't See Management Page
- Only Administrators and Managers have access
- Check user role in profile page
- Verify role-based access control in backend

## Customization

### Changing Colors
Edit the CSS in each HTML file's `<style>` section. Main colors:
- Primary: `#667eea` (indigo)
- Success: `#4caf50` (green)
- Danger: `#f44336` (red)
- Warning: `#ffc107` (yellow)

### Adding New Chapters
Edit the NR-12 template in `/supabase/functions/server/nr12-template.ts`

### Modifying Status Options
Update status buttons in `checklist.html` and corresponding logic in `renderItem()` function

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify all configuration settings
3. Ensure backend is properly deployed
4. Check Supabase project logs

## License

This project is part of the NR-12 Checklist System. All rights reserved.
