# ARTEMIS Deployment Guide

## Overview

This guide covers deploying ARTEMIS with:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Supabase (already configured)

## Frontend Deployment (Vercel)

### 1. Prepare Frontend for Production

Create `vercel.json` in the frontend directory:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 2. Environment Variables for Vercel

Add these in Vercel dashboard:

```
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_ENV=production
```

### 3. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# In frontend directory
cd frontend
vercel

# Follow prompts, select:
# - Link to existing project or create new
# - ./frontend as root directory
# - Build command: npm run build
# - Output directory: dist
```

## Backend Deployment (Render)

### 1. Prepare Backend for Production

Create `render.yaml` in root directory:

```yaml
services:
  - type: web
    name: artemis-backend
    env: node
    plan: starter
    buildCommand: cd backend && npm install
    startCommand: cd backend && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: DATABASE_URL
        fromDatabase:
          name: artemis-db
          property: connectionString
```

### 2. Environment Variables for Render

Add these in Render dashboard:

```
NODE_ENV=production
PORT=3001

# Supabase
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key

# JWT Secret
JWT_SECRET=generate-a-secure-random-string

# Frontend URL (for CORS)
FRONTEND_URL=https://your-vercel-app.vercel.app

# API Keys (if you have them)
BRIGHTDATA_API_KEY=your-brightdata-api-key
LLAMAINDEX_API_KEY=your-llamaindex-api-key
ARCADE_API_KEY=your-arcade-api-key
MASTRA_API_KEY=your-mastra-api-key

# OAuth
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
GOOGLE_REDIRECT_URI=https://your-render-backend.onrender.com/api/auth/google/callback
```

### 3. Deploy to Render

1. Push your code to GitHub
2. Connect GitHub repo to Render
3. Select "New Web Service"
4. Choose your repo and branch
5. Use these settings:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
6. Add environment variables
7. Deploy

## Google OAuth Setup

### 1. Create OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials → Create Credentials → OAuth 2.0 Client ID
5. Application type: Web application
6. Add authorized redirect URIs:

```
# For local development
http://localhost:3001/api/auth/google/callback
http://localhost:5173/auth/callback

# For production
https://your-render-backend.onrender.com/api/auth/google/callback
https://your-vercel-app.vercel.app/auth/callback
```

### 2. Update Environment Variables

Frontend (.env):
```
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

Backend (.env):
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Complete Environment Variables List

### Frontend (Vercel)

```env
VITE_API_URL=https://your-render-backend.onrender.com
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxx
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
VITE_ENV=production
```

### Backend (Render)

```env
NODE_ENV=production
PORT=3001

# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx

# Security
JWT_SECRET=xxxxx

# Frontend
FRONTEND_URL=https://your-vercel-app.vercel.app

# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://your-render-backend.onrender.com/api/auth/google/callback

# API Keys (optional - add as you obtain them)
BRIGHTDATA_API_KEY=xxxxx
LLAMAINDEX_API_KEY=xxxxx
ARCADE_API_KEY=xxxxx
MASTRA_API_KEY=xxxxx
```

## Post-Deployment Checklist

1. **Update CORS settings** in backend to allow your Vercel domain
2. **Update redirect URIs** in Google OAuth settings
3. **Test authentication flow** (signup, login, Google OAuth)
4. **Monitor logs** in both Vercel and Render dashboards
5. **Set up custom domains** if needed

## Troubleshooting

### Frontend Issues
- Clear browser cache and cookies
- Check browser console for errors
- Verify API_URL is correct in env vars
- Check Network tab for failed requests

### Backend Issues
- Check Render logs for errors
- Verify all env vars are set
- Ensure database migrations ran
- Check CORS configuration

### Auth Issues
- Verify Google OAuth redirect URIs
- Check JWT_SECRET is same in all environments
- Ensure Supabase keys are correct
- Review auth middleware logs

## Production Optimizations

1. **Enable caching** in Vercel
2. **Set up monitoring** (e.g., Sentry, LogRocket)
3. **Configure rate limiting** properly
4. **Enable SSL** (automatic on both platforms)
5. **Set up database backups** in Supabase
