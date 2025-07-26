# ARTEMIS - AI-Powered Sales Intelligence Platform

## 🚀 Project Overview

ARTEMIS is a complete, production-ready AI-powered sales intelligence platform that combines:
- Multi-agent AI architecture for prospect discovery and engagement
- Real-time data enrichment and scoring
- Automated multi-channel outreach campaigns
- Beautiful dark-themed UI with glass morphism effects

## 🏗️ Architecture

### Backend (Node.js + Express)
- **AI Agents**: Scout, Analyst, Strategist, Executor
- **Sponsor APIs**: BrightData, LlamaIndex, Arcade, Mastra
- **Database**: PostgreSQL via Supabase
- **Auth**: JWT + Google OAuth
- **Real-time**: WebSocket support

### Frontend (React + Vite)
- **UI**: Tailwind CSS with glass morphism
- **State**: React Context API
- **Auth**: Supabase Auth
- **Real-time**: WebSocket integration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account (free tier works)
- Google OAuth credentials (optional)

### Local Development

1. **Clone and Install**
```bash
# Install dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

2. **Environment Setup**

Create `.env` files in both frontend and backend directories based on `.env.example` files.

Key variables needed:
- Supabase credentials (URL, anon key, service key)
- JWT secret
- Google OAuth credentials (optional)
- Sponsor API keys (optional - platform works without them)

3. **Database Setup**
```bash
# Run migrations (update with your Supabase credentials)
npm run db:migrate
```

4. **Start Development**
```bash
# From root directory
npm run dev

# Or start separately:
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

5. **Access the App**
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

## 🌟 Features Implemented

### ✅ Complete Features

1. **Multi-Agent System**
   - Scout: Discovers and enriches prospects
   - Analyst: Scores and provides insights
   - Strategist: Designs campaign strategies
   - Executor: Orchestrates campaigns

2. **API Integrations**
   - BrightData: Web scraping and data discovery
   - LlamaIndex: AI analysis and insights
   - Arcade: Multi-channel campaign execution
   - Mastra: Workflow orchestration

3. **Authentication & Authorization**
   - Email/password authentication
   - Magic link authentication
   - Google OAuth
   - JWT-based sessions
   - Protected routes

4. **User Interface**
   - Landing page with product showcase
   - Dashboard with real-time metrics
   - Prospect management (search, filter, enrich)
   - Campaign builder with AI assistance
   - Analytics and reporting
   - Settings and team management

5. **Real-time Features**
   - WebSocket integration
   - Live activity feed
   - Real-time prospect updates
   - Campaign status tracking

6. **Database Schema**
   - Complete PostgreSQL schema
   - User management with workspaces
   - Prospect lifecycle tracking
   - Campaign and interaction history
   - Agent activity logs

## 📦 Deployment

### Option 1: Docker (Recommended for Teams)
```bash
docker-compose up
```

### Option 2: Cloud Deployment
- **Frontend**: Deploy to Vercel
- **Backend**: Deploy to Render
- **Database**: Use existing Supabase

See `DEPLOYMENT_GUIDE.md` for detailed instructions.

## 🔑 Getting API Keys

### Required (Platform works without these, but with limited features)
1. **Supabase** (Free)
   - Sign up at supabase.com
   - Create a new project
   - Get URL and keys from Settings > API

### Optional (For full functionality)
1. **BrightData** - Web scraping
2. **LlamaIndex** - AI analysis
3. **Arcade** - Campaign execution
4. **Mastra** - Workflow automation
5. **Google OAuth** - Social login

## 📱 Using ARTEMIS

### First Time Setup
1. Visit the landing page
2. Click "Get Started" to sign up
3. Complete onboarding (company info, goals)
4. You'll be redirected to the dashboard

### Core Workflows

**1. Prospect Discovery**
- Go to Prospects page
- Use AI search to find ideal customers
- View enriched prospect data
- Score and prioritize prospects

**2. Campaign Creation**
- Navigate to Campaigns
- Click "New Campaign"
- Select prospects
- AI generates personalized messages
- Review and launch

**3. Analytics**
- Monitor campaign performance
- Track engagement metrics
- View AI insights
- Export reports

## 🛠️ Development Notes

### Code Structure
```
artemis/
├── frontend/           # React + Vite app
│   ├── src/
│   │   ├── pages/     # Route pages
│   │   ├── components/# Reusable components
│   │   ├── services/  # API services
│   │   └── contexts/  # React contexts
├── backend/           # Node.js + Express API
│   ├── src/
│   │   ├── agents/    # AI agents
│   │   ├── services/  # External APIs
│   │   ├── routes/    # API endpoints
│   │   └── workflows/ # Mastra workflows
├── database/          # SQL migrations
└── scripts/          # Utility scripts
```

### Key Technologies
- **Frontend**: React, Vite, Tailwind CSS, Heroicons
- **Backend**: Node.js, Express, Supabase
- **AI**: Custom agents with LlamaIndex integration
- **Database**: PostgreSQL (via Supabase)
- **Auth**: Supabase Auth + JWT
- **Real-time**: WebSockets

## 🎯 Next Steps

### Immediate Priorities
1. Add your API keys to `.env` files
2. Set up Google OAuth (optional)
3. Run the platform locally
4. Create your first campaign

### Future Enhancements
1. Add more data enrichment sources
2. Implement advanced AI models
3. Add email/SMS delivery
4. Build Chrome extension
5. Create mobile app

## 🤝 Support

### Documentation
- `LAUNCH_GUIDE.md` - Detailed setup instructions
- `DEPLOYMENT_GUIDE.md` - Production deployment
- `INTEGRATION_NOTES.md` - API integration details

### Common Issues
1. **Auth not working**: Check Supabase keys and JWT secret
2. **APIs failing**: Verify API keys in `.env`
3. **Database errors**: Run migrations, check connection
4. **CORS issues**: Update allowed origins in backend

## 🎉 Conclusion

ARTEMIS is now ready to revolutionize your sales process with AI-powered intelligence. The platform is fully functional even without all sponsor APIs - you can start with just Supabase (free) and add integrations as needed.

Happy selling! 🚀
