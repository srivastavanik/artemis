# URGENT: Fix Vercel Environment Variables

## The Problem
Your `VITE_API_URL` in Vercel has `/api` at the end, but the frontend code now adds `/api` automatically, causing double `/api/api/` URLs.

## Required Changes in Vercel Dashboard

### 1. Update VITE_API_URL ❌ → ✅
```
CURRENT (WRONG): https://artemis-e8tw.onrender.com/api
CORRECT:         https://artemis-e8tw.onrender.com
```

### 2. Add Missing Variable
You're missing the WebSocket URL:
```
VITE_WS_URL = wss://artemis-e8tw.onrender.com
```

### 3. Update Supabase Credentials
Your Vercel has different Supabase project than local:
- Vercel: `olwfzerxgfuvvrontwjd`
- Local: `jqxgpcvdpbhzrqosmdob`

Make sure you're using the correct Supabase project!

## Steps to Fix:

1. Go to: https://vercel.com/dashboard
2. Select your ARTEMIS project
3. Go to Settings → Environment Variables
4. Update `VITE_API_URL` to remove `/api`
5. Add `VITE_WS_URL`
6. Save changes
7. Redeploy by pushing any commit or clicking "Redeploy"

## Correct Environment Variables:

```
VITE_API_URL = https://artemis-e8tw.onrender.com
VITE_WS_URL = wss://artemis-e8tw.onrender.com
VITE_SUPABASE_URL = [Use your actual Supabase project URL]
VITE_SUPABASE_ANON_KEY = [Use your actual Supabase anon key]
VITE_GOOGLE_CLIENT_ID = 551925643035-mmvg6elj2587g9pcrbmc0k45vq88k921.apps.googleusercontent.com
VITE_ENV = production
