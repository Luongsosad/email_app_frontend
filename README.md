# Email App Frontend

Professional Email Management System with Gmail Integration - Frontend Application

## 🌐 Deployed URLs

- **Frontend**: [https://mailbox-pro.vercel.app](https://mailbox-pro.vercel.app)
- **Backend API**: [https://email-app-backend-ecru.vercel.app](https://email-app-backend-ecru.vercel.app)
- **API Documentation**: [https://email-app-backend-ecru.vercel.app/api/docs](https://email-app-backend-ecru.vercel.app/api/docs)

## 🚀 Features

- ✅ **Gmail Integration** - Full Gmail API integration via Google OAuth 2.0
- ✅ **Real Gmail Folders** - Inbox, Sent, Drafts, Spam, Trash, Starred, Important, Unread, Chat
- ✅ **Email Management** - Read, compose, reply, forward, star, archive, delete emails
- ✅ **Advanced Search** - Search emails with Gmail query syntax
- ✅ **Pagination** - Navigate through email pages with Gmail's pageToken
- ✅ **File Attachments** - Upload and download email attachments (25MB limit)
- ✅ **Rich HTML Content** - Sanitized HTML email rendering with DOMPurify
- ✅ **Context Menu** - Right-click actions for emails
- ✅ **Toast Notifications** - User feedback for all actions
- ✅ **Auto Token Refresh** - Automatic access token refresh on 401 errors
- ✅ **Responsive Design** - Gmail-inspired UI with dark mode support

## 🛠️ Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Radix UI** - Component Primitives

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running (locally or deployed)
- Google Cloud Project with Gmail API enabled

## 🔧 Local Setup & Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd email_app_frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
## 🚀 Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port)

### Production Build

Build for production:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Deploy to production
vercel --prod
```
## 🔐 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Gmail API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### Step 2: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application"
4. Configure:
   - **Name**: Email App
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://mailbox-pro.vercel.app` (for production)
   - **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/google/callback` (backend local)
     - `https://email-app-backend-ecru.vercel.app/api/auth/google/callback` (backend production)

5. Save and copy:
   - **Client ID**
   - **Client Secret**

### Step 3: Configure Backend

Add to backend `.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

### Step 4: OAuth Consent Screen

1. Go to "OAuth consent screen"
2. Choose "External" (for testing) or "Internal" (for organization)
3. Fill required information:
   - App name: "Email App"
   - User support email: your email
   - Developer contact: your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.send`
   - `https://www.googleapis.com/auth/gmail.modify`
## 🔐 Authentication & Token Management

### OAuth Flow

1. User clicks "Login with Google"
2. Frontend redirects to backend OAuth authorize endpoint
3. Backend redirects to Google OAuth consent screen
4. User grants permissions
5. Google redirects to backend callback with authorization code
6. Backend exchanges code for access & refresh tokens
7. Backend stores tokens in database
8. Backend redirects to frontend with success
9. Frontend fetches user data and mailboxes

### Token Storage & Security

#### Access Token (15 minutes expiry)
- **Storage**: HTTP-only cookies
- **Security**: 
  - Cannot be accessed by JavaScript (prevents XSS attacks)
  - Secure flag in production (HTTPS only)
  - SameSite=Lax (CSRF protection)
  - Short expiry time limits damage from token theft

#### Refresh Token (7 days expiry)
- **Storage**: HTTP-only cookies
- **Security**:
  - Longer expiry but cannot be accessed by JavaScript
  - Used only to refresh access tokens
  - Revoked on logout

#### Why HTTP-only Cookies?

✅ **Better than localStorage/sessionStorage**:
- Immune to XSS attacks (JavaScript cannot read)
- Automatically sent with requests
- Secure flag ensures HTTPS transmission
- SameSite prevents CSRF

❌ **localStorage/sessionStorage vulnerabilities**:
- Accessible by any JavaScript code
- Vulnerable to XSS attacks
- Can be stolen by malicious scripts
- No built-in security features

### Token Expiry Simulation (Demo)

For demonstration purposes, access token expiry is set to **15 minutes**:

```typescript
// Backend: src/modules/auth/auth.service.ts
const accessTokenExpires = new Date();
accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + 15);
```

```javascript
// Frontend: src/lib/api/api-config.js
const accessTokenExpires = new Date();
accessTokenExpires.setMinutes(accessTokenExpires.getMinutes() + 15);
## 🎨 Features Implemented

### Email Management
- ✅ Gmail folder navigation (Inbox, Sent, Drafts, Spam, Trash, Starred, Important, Unread, Chat)
- ✅ Email list with unread count badges
- ✅ Email detail viewer with HTML rendering
- ✅ Compose email with attachments (25MB limit)
- ✅ Reply and forward emails
- ✅ Star/unstar emails
- ✅ Mark as read/unread
- ✅ Archive emails
- ✅ Move to spam
- ✅ Delete emails with confirmation
- ✅ Context menu (right-click actions)

### Search & Pagination
- ✅ Gmail query syntax search
- ✅ Debounced search (500ms)
- ✅ Previous/Next page navigation
- ✅ Gmail pageToken pagination

### UI/UX
- ✅ Gmail-inspired interface
- ✅ Dark mode support
- ✅ Toast notifications for all actions
- ✅ Loading states
- ✅ Error handling
- ✅ Responsive design
- ✅ Minimize/Maximize compose window

### Security
- ✅ HTTP-only cookie storage
- ✅ Auto token refresh
- ✅ CORS protection
- ✅ HTML sanitization (DOMPurify)
- ✅ XSS prevention

## 🧪 Testing

### Test Accounts

You can use any Gmail account for testing. The app will:
1. Request Gmail API permissions
2. Access your real Gmail data
3. Allow full email management

**Note**: This is a real Gmail integration, not a test/sandbox environment.

### Test Features

1. **Search**: Try Gmail queries like:
   - `from:example@gmail.com`
   - `subject:important`
   - `has:attachment`

2. **Token Expiry**: 
   - Wait 15 minutes after login
   - Perform any action
   - Token auto-refresh should happen seamlessly

3. **Attachments**:
   - Try uploading files < 25MB
   - Download attachments from received emails

## 🐛 Troubleshooting

### "Gmail not connected" error
- Click "Login with Google" again
- Grant all requested permissions
- Check if Google OAuth credentials are correct

### Attachments not downloading
- Check browser console for errors
- Verify attachment API endpoint is accessible
- Ensure attachment size is within limits

### Token refresh not working
- Check if refresh token cookie exists
- Verify backend refresh endpoint is working
- Check CORS configuration

### Emails not loading
- Verify Gmail API is enabled in Google Cloud
- Check if API quotas are exceeded
- Ensure OAuth scopes include Gmail access

## 📝 Development Notes

- **Token expiry**: 15 minutes (configurable)
- **Attachment limit**: 25MB per file, 25MB total
- **Search debounce**: 500ms
- **Pagination**: 20 emails per page
- **Cookie expiry**: Matches token expiry times

## 🔜 Future Enhancements

- [ ] Email drafts auto-save
- [ ] Rich text editor (WYSIWYG)
- [ ] Email threading/conversations
- [ ] Custom labels and tags
- [ ] Email filters and rules
- [ ] Multiple account support
- [ ] Offline mode
- [ ] Progressive Web App (PWA)

## 📄 License

Private - All rights reserved

## 👨‍💻 Contributors

- **Luongsosad** - Frontend Development
- **notDuyLam** - Backend Development transmission over secure connection
   - Secure cookie flag enabled

2. **CORS Configuration**
   - Only allowed origins can access API
   - Credentials included in requests

3. **Token Rotation**
   - Access tokens expire frequently (15 min)
   - Refresh tokens expire after 7 days
   - Tokens revoked on logout

4. **Gmail API Security**
   - OAuth 2.0 authorization
   - Limited scopes (only Gmail access)
   - Tokens stored encrypted in database
   - No password storage

- `GET /api/auth/google/authorize` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - OAuth callback handler
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens

### Gmail API Endpoints

- `GET /api/emails/mailboxes` - Get all Gmail labels/folders
- `GET /api/emails/list/:labelId` - List emails in folder (with search & pagination)
- `GET /api/emails/:id` - Get email detail
- `POST /api/emails/send` - Send email with attachments
- `POST /api/emails/:id/reply` - Reply to email
- `POST /api/emails/:id/forward` - Forward email
- `PATCH /api/emails/:id/star` - Toggle star
- `PATCH /api/emails/:id/read` - Mark as read
- `PATCH /api/emails/:id/unread` - Mark as unread
- `POST /api/emails/:id/spam` - Move to spam
- `POST /api/emails/:id/archive` - Archive email
- `DELETE /api/emails/:id` - Delete email
- `GET /api/emails/:emailId/attachments/:attachmentId` - Download attachment
The frontend connects to the backend API running on `http://localhost:3000/api`

### Authentication Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/google` - Google OAuth login (Not implemented)

### Email Endpoints

- `GET /api/mailboxes` - Get all mailboxes
- `GET /api/mailboxes/:id/emails` - Get emails from mailbox
- `POST /api/emails/send` - Send email
- `PATCH /api/emails/:id` - Update email
- `DELETE /api/emails/:id` - Delete email

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/              # Authentication components
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   └── ForgotPasswordPage.jsx
│   ├── dashboard/         # Dashboard components
│   │   ├── DashboardPage.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MailList.jsx
│   │   ├── MailViewer.jsx
│   │   ├── ComposeModal.jsx
│   │   ├── ReplyModal.jsx
│   │   ├── ForwardModal.jsx
│   │   └── SettingsPage.jsx
│   └── ui/               # Reusable UI components
│       └── ConfirmModal.jsx
├── lib/                  # Utilities and configurations
│   ├── api-config.js     # API configuration
│   ├── api-service.js    # API service layer
│   ├── constants.js      # App constants
│   ├── types.js          # Type definitions
│   └── utils.js          # Helper functions
├── hooks/                # Custom React hooks
├── styles/               # Global styles
├── App.jsx               # Main app component
└── main.jsx              # Entry point
```

## 🔐 Authentication Flow

1. User enters credentials in Login/Signup page
2. Frontend sends request to backend API
3. Backend validates and returns JWT tokens
4. Tokens are stored in localStorage
5. Authenticated requests include Bearer token in headers
6. On logout, tokens are cleared from localStorage

## 🎨 Theming

The app supports light and dark modes using CSS variables. Theme colors can be customized in `src/index.css`

## 🐛 Troubleshooting

### Backend Connection Issues

If you see "Network Error" or "Failed to fetch":

1. Make sure backend is running on port 3000
2. Check CORS settings in backend
3. Verify API_BASE_URL in .env file

### Port Already in Use

If port 3030 is already in use, change it in `vite.config.js`:

```javascript
server: {
  port: 3031, // Change to any available port
  open: true,
}
```

## 📝 Development Notes

- Minimum password length: 6 characters (matches backend validation)
- Email validation uses regex pattern
- All API calls include error handling
- Protected routes redirect to login if not authenticated
- Tokens are automatically included in API requests

## 🔜 Upcoming Features

- [ ] Google OAuth integration
- [ ] Real-time email notifications
- [ ] Email drafts auto-save
- [ ] Rich text editor for email composition
- [ ] Email attachments upload/download
- [ ] Email threading/conversations
- [ ] Email labels and tags
- [ ] Advanced search filters
- [ ] Dark mode toggle

## 📄 License

Private - All rights reserved

## 👨‍💻 Author

Email App Team
