# ARTEMIS Backend Deployment Fixes

## Issues Fixed

### 1. CORS Configuration
- **Problem**: Frontend at `https://artemis-murex.vercel.app` was getting CORS errors
- **Solution**: Backend already includes the correct frontend URL in allowed origins

### 2. Authentication Database Mapping
- **Problem**: Auth service was using wrong field names causing 500 errors on signup
- **Fixed in `backend/src/services/auth.service.js`**:
  - Changed `id` to `auth_id` when creating/querying users
  - Added both `name` and `full_name` fields for compatibility
  - Fixed sign-in, sign-up, OAuth, and magic link methods

### 3. WebSocket/Socket.io CORS
- **Problem**: Socket.io connections were being blocked by CORS
- **Solution**: The backend CORS config already handles this correctly

### 4. Environment Variables
- **Frontend**: Update environment variables in Vercel dashboard:
  ```
  VITE_API_URL=https://artemis-e8tw.onrender.com
  VITE_WS_URL=wss://artemis-e8tw.onrender.com
  VITE_SUPABASE_URL=https://jqxgpcvdpbhzrqosmdob.supabase.co
  VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeGdwY3ZkcGJoenJxb3NtZG9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyMzUzNDYsImV4cCI6MjA1MjgxMTM0Nn0.VhzKjmrlCLJh0-nLXakoJ4yWiKhOlkTxMhq8dFEGOkE
  ```

### 5. Database Schema Alignment
The backend now correctly maps to the Supabase schema:
- `users` table uses `auth_id` for Supabase Auth integration
- All foreign key relationships preserved
- Workspace and role fields properly handled

## Deployment URLs
- **Frontend**: https://artemis-murex.vercel.app
- **Backend**: https://artemis-e8tw.onrender.com

## Next Steps
1. Update Vercel environment variables (go to Vercel dashboard → Settings → Environment Variables)
2. Wait for backend deployment to complete on Render
3. Test signup/login functionality
4. Verify WebSocket connections work properly

## Testing Checklist
- [ ] Sign up with email/password works
- [ ] Sign in works
- [ ] Google OAuth redirects properly
- [ ] WebSocket connections establish without CORS errors
- [ ] Protected routes work after authentication
