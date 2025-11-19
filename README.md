# Email App Frontend

Professional Email Management System - Frontend Application

## 🚀 Features

- ✅ User Authentication (Login/Register)
- ✅ Email Management (Inbox, Sent, Drafts, Spam, Trash, Archive)
- ✅ Compose, Reply, Forward emails
- ✅ Email Search and Filtering
- ✅ Settings and Preferences
- 🔄 Google OAuth Login (Coming Soon)
- 🔄 Real-time Email Updates (Coming Soon)

## 🛠️ Tech Stack

- **React 18** - UI Library
- **Vite** - Build Tool
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Radix UI** - Component Primitives

## 📋 Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 3000

## 🔧 Installation

1. Clone the repository
```bash
cd Mail/email_app_frontend
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

## 🚀 Running the Application

### Development Mode

Start the development server on port 3030:

```bash
npm run dev
```

The application will be available at `http://localhost:3030`

### Production Build

Build for production:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## 🔌 API Integration

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
