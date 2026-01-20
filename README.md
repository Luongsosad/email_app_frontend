# Email App Frontend

A modern, responsive web client for the Email App, built with React, Vite, and Tailwind CSS.

## 🚀 Features

*   **Gmail-like Interface**: Familiar layout with Sidebar, Email List, and Detail View.
*   **Authentication**: Seamless Google Login via backend proxy.
*   **Kanban Board**: Organize emails into tasks with drag-and-drop.
*   **Rich Text Editor**: Compose emails with formatting.
*   **Dark Mode**: Fully supported UI theming.

## 🛠️ Setup Guide

### Prerequisites
*   Node.js (v18 or later)
*   The Backend server running on port 3000.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <your-repo-url>
    cd email_app_frontend
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Configuration**:
    Create a `.env` file in the root directory:
    ```env
    VITE_API_BASE_URL=http://localhost:3000/api
    ```

4.  **Start the Development Server**:
    ```bash
    npm run dev
    ```
    The app will run at `http://localhost:5173`.

## 📡 API Integration

The frontend communicates with the backend via REST API. It relies on **HTTP-Only Cookies** set by the backend for authentication.

*   **Base URL**: `http://localhost:3000/api`
*   **Auth Flow**:
    1.  User clicks "Login with Google".
    2.  Redirects to backend `/api/auth/google/authorize`.
    3.  After success, backend redirects to frontend with session cookies set.
    4.  Frontend fetches user info via `/api/auth/me`.

## 🔐 Token Storage & Security

### Why no `localStorage`?
We consciously avoid storing Access Tokens in `localStorage` or `sessionStorage` to prevent **XSS (Cross-Site Scripting)** attacks. If a malicious script runs on the page, it cannot read the tokens because they are stored in **HTTP-Only cookies**, which are inaccessible to JavaScript.

### Handling Expiration
The frontend uses an **Axios Interceptor** to handle `401 Unauthorized` responses.
1.  If a request fails with 401.
2.  The interceptor attempts to refresh the token via `/api/auth/refresh`.
3.  If successful, it retries the original request.
4.  If it fails, it redirects the user to the Login page.

## 📦 Build & Deploy

To build the application for production:

```bash
npm run build
```

This generates static files in the `dist` folder, which can be deployed to Vercel, Netlify, or any static host.
