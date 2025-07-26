# 🚀 ARTEMIS Launch Guide - Complete Version

## 🎯 Overview

ARTEMIS is now a fully-featured AI-powered sales intelligence platform with:
- Complete authentication system (Supabase Auth)
- Multi-tenant workspace support
- Real-time WebSocket updates
- AI-powered prospect enrichment and scoring
- Automated campaign management
- Beautiful dark-themed UI with glass morphism effects
- Docker support for production deployment

## 📋 Prerequisites

1. **API Keys** (all in your .env file):
   - ✅ BrightData API credentials
   - ✅ LlamaIndex API key
   - ✅ Arcade API key
   - ✅ Mastra API key
   - ✅ Supabase URL and keys

2. **System Requirements**:
   - Node.js 18+ and npm
   - PostgreSQL (via Supabase)
   - Docker (for containerized deployment)

## 🏃‍♂️ Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd artemis

# Copy environment file
cp .env.example .env
# Edit .env with your API keys

# Run setup script
./scripts/setup.sh
```

### 2. Database Setup

The database migrations will be automatically applied by Supabase. The schema includes:
- User authentication tables
- Multi-tenant workspaces
- Prospects and enrichment data
- Campaigns and messaging
- Real-time interaction tracking

### 3. Start the Application

```bash
# Development mode
./scripts/start.sh

# Or manually:
cd backend && npm run dev
cd frontend && npm run dev
```

### 4. Create Your First Account

1. Navigate to http://localhost:5173
2. Click "Get Started" or go to `/auth/signup`
3. Sign up with email or Google OAuth
4. Complete the onboarding:
   - Create your workspace
   - Set up your profile
5. You're in! 🎉


## 🔐 Authentication Flow

### Email/Password Authentication
1. User signs up at `/auth/signup`
2. Email verification (if enabled in Supabase)
3. Onboarding flow for new users
4. Workspace creation
5. Access to main app

### Google OAuth
1. Click "Sign in with Google"
2. Authorize with Google
3. Callback to `/auth/callback`
4. Auto-create user profile
5. Onboarding if new user

### Session Management
- JWT tokens stored securely
- Auto-refresh on API calls
- Persistent sessions
- Secure logout

## 🏗️ Application Architecture

```
artemis/
├── frontend/          # React + Vite + Tailwind
│   ├── src/
│   │   ├── pages/     # All page components
│   │   │   ├── auth/  # Login, Signup, Onboarding
│   │   │   └── ...    # Dashboard, Prospects, etc.
│   │   ├── components/# Reusable components
│   │   ├── services/  # API services
│   │   ├── contexts/  # Auth context
│   │   └── App.jsx    # Main app with routing
│   └── ...
├── backend/           # Express + Node.js
│   ├── src/
│   │   ├── routes/    # API endpoints
│   │   ├── services/  # External integrations
│   │   ├── agents/    # AI agents
│   │   ├── workflows/ # Mastra workflows
│   │   └── middleware/# Auth, rate limiting
│   └── ...
├── database/          # PostgreSQL schemas
│   ├── migrations/    # Database structure
│   └── seeds/        # Demo data
└── scripts/          # Automation scripts
```

## 🎨 Key Features

### 1. **AI-Powered Prospect Discovery**
- BrightData integration for web scraping
- Automatic enrichment with company data
- Decision maker identification
- Technology stack detection

### 2. **Intelligent Scoring**
- Fit score based on ICP match
- Intent signals from behavior
- Engagement tracking
- Predictive analytics

### 3. **Multi-Channel Campaigns**
- Email and LinkedIn outreach
- AI-generated personalization
- A/B testing capabilities
- Automated follow-ups

### 4. **Real-Time Analytics**
- Live activity feed
- Campaign performance metrics
- Conversion tracking
- ROI dashboard

### 5. **Team Collaboration**
- Multi-user workspaces
- Role-based permissions
- Shared campaigns
- Activity notifications

## 🚢 Production Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables for Production

```env
# Production settings
NODE_ENV=production
VITE_ENV=production

# Use production URLs
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Secure your keys
SUPABASE_SERVICE_KEY=your-production-key
# ... other production keys
```

### Deployment Checklist

- [ ] Set all production environment variables
- [ ] Enable Supabase Row Level Security (RLS)
- [ ] Configure custom domain
- [ ] Set up SSL certificates
- [ ] Configure backup strategy
- [ ] Set up monitoring (logs, metrics)
- [ ] Configure rate limiting
- [ ] Test OAuth redirect URLs
- [ ] Set up error tracking (Sentry)

## 🔧 Troubleshooting

### Common Issues

1. **"Cannot connect to database"**
   - Check Supabase URL and keys
   - Ensure database is accessible
   - Check network/firewall settings

2. **"Authentication failed"**
   - Verify JWT secret matches
   - Check token expiration
   - Clear browser localStorage

3. **"WebSocket connection failed"**
   - Ensure backend is running
   - Check CORS settings
   - Verify WebSocket port (3001)

4. **"OAuth redirect error"**
   - Update redirect URLs in Supabase
   - Check CLIENT_URL in backend
   - Ensure proper protocol (http/https)

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check specific services
curl http://localhost:3001/api/health
curl http://localhost:3001/api/test/brightdata
```

## 📱 Using the Application

### First Steps
1. **Add Prospects**: Use the Prospects page to search and add companies
2. **View Enrichment**: Click on prospects to see enriched data
3. **Create Campaign**: Build your first outreach campaign
4. **Monitor Activity**: Watch the real-time activity feed
5. **Analyze Results**: Check analytics for performance

### Power User Tips
- Use filters to segment prospects
- Create templates for consistent messaging
- Set up webhooks for CRM integration
- Export data for further analysis
- Use the API for custom integrations

## 🔗 API Documentation

### Authentication Endpoints
- `POST /api/auth/signup` - Create account
- `POST /api/auth/signin` - Login
- `POST /api/auth/signout` - Logout
- `GET /api/auth/me` - Current user

### Core Endpoints
- `GET/POST /api/prospects` - Manage prospects
- `GET/POST /api/campaigns` - Campaign operations
- `GET /api/analytics` - Metrics and insights
- `WS /` - WebSocket for real-time updates

### Integration Webhooks
- `/api/webhooks/arcade` - Arcade AI callbacks
- `/api/webhooks/campaign` - Campaign events

## 🎉 You're Ready!

Your ARTEMIS platform is now fully operational with:
- ✅ Complete authentication system
- ✅ Real-time data synchronization
- ✅ AI-powered intelligence
- ✅ Beautiful, responsive UI
- ✅ Production-ready architecture

### Next Steps
1. Customize the platform for your needs
2. Integrate with your existing tools
3. Train the AI on your specific use cases
4. Scale to your team

### Support & Documentation
- Check `/docs` for detailed API docs
- Review code comments for implementation details
- Submit issues for bugs or features
- Join our community for best practices

---

**Happy Selling with ARTEMIS! 🚀✨**

*The future of sales intelligence is here - powered by AI, driven by data, designed for growth.*
