# ARTEMIS - Arcade & Pinecone Setup Guide

## 1. Arcade Setup

### You DON'T Need a Worker
Based on your screenshots, you don't need to create a worker. Workers are for advanced Arcade features. ARTEMIS uses Arcade's API directly for email sending.

### Gmail OAuth Configuration

1. **In Arcade Dashboard:**
   - Go to OAuth Providers
   - Click on "arcade-google" 
   - Click "Manage"
   - You'll need your Google OAuth credentials (see below)

2. **In Google Cloud Console:**
   - Go to https://console.cloud.google.com
   - Create new project or select existing
   - Enable Gmail API:
     - Go to "APIs & Services" > "Library"
     - Search for "Gmail API"
     - Click Enable
   - Create OAuth 2.0 Credentials:
     - Go to "APIs & Services" > "Credentials"
     - Click "Create Credentials" > "OAuth client ID"
     - Application type: Web application
     - Name: "ARTEMIS Gmail Integration"
     - Authorized redirect URIs: 
       - Add: `https://api.arcade.software/oauth/google/callback`
       - Add: `http://localhost:5173/auth/google/callback` (for local testing)
     - Copy the Client ID and Client Secret

3. **Configure in Arcade:**
   - Enter your Google Client ID
   - Enter your Google Client Secret
   - Save the configuration

## 2. Pinecone Setup

### Get Pinecone Credentials

1. **Sign up at Pinecone:**
   - Go to https://www.pinecone.io
   - Create a free account
   - Create a new project

2. **Get your credentials:**
   - In Pinecone dashboard, go to "API Keys"
   - Copy your API key
   - Note your environment (e.g., `us-east-1`, `eu-west-1`)

3. **Add to your `.env` file:**
   ```env
   # Pinecone Configuration
   PINECONE_API_KEY=your_api_key_here
   PINECONE_ENVIRONMENT=us-east-1
   PINECONE_INDEX_NAME=artemis-prospects
   ```

### Initialize Pinecone Index

Run this command ONCE after setting up your environment variables:

```bash
cd backend
npm run setup
```

This will:
- Create the Pinecone index named `artemis-prospects`
- Configure it with the correct dimensions for OpenAI embeddings
- Set up the index for prospect data storage

## 3. Complete Environment Setup

Your `.env` should have all these configured:

```env
# Arcade
ARCADE_API_KEY=your_arcade_api_key

# Google OAuth (for Arcade)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=artemis-prospects

# OpenAI (required for LlamaIndex)
OPENAI_API_KEY=your_openai_api_key

# LlamaIndex
LLAMAINDEX_API_KEY=your_llamaindex_api_key

# BrightData
BRIGHTDATA_API_KEY=your_brightdata_api_key

# Mastra
MASTRA_API_KEY=your_mastra_api_key
MASTRA_WEBHOOK_SECRET=generate_a_random_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## 4. Testing the Setup

### Test Pinecone:
```bash
cd backend
node -e "
import llamaIndexService from './src/services/llamaindex.service.js';
llamaIndexService.initializeIndex()
  .then(() => console.log('✅ Pinecone connected successfully'))
  .catch(err => console.error('❌ Pinecone error:', err));
"
```

### Test Arcade:
Check if your API key works by visiting the Arcade dashboard and looking at your API usage.

## 5. User Authentication Flow for Gmail

When a user wants to connect their Gmail:

1. **In your app's Settings page:**
   - User clicks "Connect Gmail"
   - Redirect to: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/gmail.send&access_type=offline&prompt=consent`

2. **After user authorizes:**
   - Google redirects back with authorization code
   - Exchange code for refresh token
   - Store refresh token in user's metadata

3. **Using Gmail in campaigns:**
   - Arcade will use the stored refresh token
   - Automatically handles token refresh

## 6. Common Issues

### Pinecone Errors:
- "Index not found" - Run `npm run setup` from backend directory
- "Invalid API key" - Check your PINECONE_API_KEY in .env
- "Wrong dimensions" - Make sure you're using OpenAI embeddings

### Arcade/Gmail Errors:
- "Invalid client" - Check Google OAuth credentials
- "Access denied" - User needs to authorize Gmail access
- "Insufficient scope" - Make sure to request gmail.send scope

### Next Steps:
1. Run the migration: `psql $DATABASE_URL < database/migrations/005_add_missing_tables.sql`
2. Initialize Pinecone: `cd backend && npm run setup`
3. Configure Gmail OAuth in Google Cloud Console
4. Update Arcade OAuth provider with Google credentials
5. Start your services: `npm run dev`

## Need Help?
- Arcade docs: https://docs.arcade.software
- Pinecone docs: https://docs.pinecone.io
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
