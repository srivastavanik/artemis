# ARTEMIS Launch Guide

## 🚀 What We've Built

ARTEMIS is now a fully-integrated AI-powered sales intelligence platform with:

### Backend Services
- **Multi-Agent System**: Scout (discovery), Analyst (scoring), Strategist (campaigns), Executor (automation)
- **Sponsor Integrations**: 
  - BrightData for web scraping and prospect data
  - LlamaIndex for AI analysis and insights
  - Arcade for multi-channel campaign execution
  - Mastra for workflow orchestration
- **Real-time Features**: WebSocket support for live updates
- **Complete API**: RESTful endpoints for prospects, campaigns, and analytics
- **Security**: JWT authentication, rate limiting, and secure webhook handling

### Frontend Application
- **Dark Theme UI**: Glass morphism design with purple accents
- **Interactive Dashboard**: Real-time metrics and activity feeds
- **Prospect Management**: Search, enrich, and analyze prospects
- **Campaign Builder**: Create and execute multi-channel campaigns
- **Analytics**: Comprehensive insights and ROI tracking
- **Live Demo**: Interactive demonstration of ARTEMIS capabilities

### Infrastructure
- **Docker Support**: Containerized deployment
- **Database**: PostgreSQL schema via Supabase
- **Monitoring**: Comprehensive logging and error tracking
- **Scalability**: Stateless design with horizontal scaling support

## 📋 Prerequisites

1. **Node.js** 18+ and npm
2. **Docker** and Docker Compose (for production)
3. **API Keys** for:
   - Supabase (database)
   - BrightData (web scraping)
   - LlamaIndex (AI analysis)
   - OpenAI (for LlamaIndex)
   - Mastra (workflow orchestration)

## 🛠️ Quick Start

### 1. Clone and Setup
```bash
cd artemis
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and add your API keys:
```bash
cp .env.example .env
# Edit .env with your actual API keys
```

### 3. Setup Database
Create a Supabase project and run the migration:
```bash
# Copy contents of database/migrations/001_initial_schema.sql
# Run in Supabase SQL editor
```

### 4. Start Development
```bash
# Terminal 1 - Start backend
npm run dev:backend

# Terminal 2 - Start frontend
npm run dev:frontend
```

### 5. Verify Integrations
Visit http://localhost:3001/api/test/integrations to verify all services are connected.

### 6. Access Application
Open http://localhost:5173 in your browser.

## 🧪 Testing the System

### 1. Test Integration Status
```bash
curl http://localhost:3001/api/test/integrations
```

### 2. Run Demo Flow
```bash
curl -X POST http://localhost:3001/api/test/demo-flow
```

### 3. Test Prospect Discovery
```bash
curl -X POST http://localhost:3001/api/prospects/discover \
  -H "Content-Type: application/json" \
  -d '{"company": "salesforce.com", "targetTitles": ["VP Sales"]}'
```

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

### Manual Deployment
```bash
# Build frontend
cd frontend && npm run build

# Start production server
NODE_ENV=production npm start
```

## 📊 Key Features to Try

### 1. Prospect Discovery
- Search for prospects by company, role, or industry
- Automatic enrichment with BrightData
- AI-powered scoring and insights

### 2. Campaign Creation
- Design multi-channel campaigns (Email, LinkedIn)
- AI-generated personalized messages
- A/B testing and optimization

### 3. Real-time Analytics
- Live dashboard with key metrics
- Agent performance tracking
- ROI and conversion analysis

### 4. Live Demo Mode
- Interactive walkthrough at `/demo`
- Sample data and workflows
- No API keys required for demo

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify Supabase URL and key in .env
   - Check if tables are created

2. **API Integration Errors**
   - Verify all API keys are correct
   - Check rate limits aren't exceeded
   - Use test endpoints to diagnose

3. **Frontend Not Loading**
   - Ensure backend is running on port 3001
   - Check browser console for errors
   - Verify CORS settings

### Debug Mode
Enable detailed logging:
```bash
DEBUG=* npm run dev:backend
```

## 📱 Webhook Configuration

### BrightData Webhooks
Configure callback URL: `https://your-domain.com/api/webhooks/brightdata`

### Arcade Webhooks  
Configure callback URL: `https://your-domain.com/api/webhooks/arcade`

### Google OAuth (for Gmail)
Add redirect URI: `https://your-domain.com/api/webhooks/google/callback`

## 🎯 Next Steps

1. **Configure Live Data**
   - Add real API keys
   - Set up webhook endpoints
   - Configure OAuth for Gmail

2. **Customize for Your Business**
   - Update email templates
   - Adjust scoring algorithms
   - Add custom workflows

3. **Scale Operations**
   - Deploy to cloud (AWS/GCP/Azure)
   - Set up monitoring (Datadog/New Relic)
   - Configure auto-scaling

## 📞 Support

- **Documentation**: See `/docs` folder
- **API Reference**: Visit `/api` endpoint
- **Test Suite**: Run `npm test`

## 🎉 You're Ready!

ARTEMIS is now fully operational. Start by:
1. Creating your first prospect list
2. Running an enrichment campaign
3. Launching your first outreach sequence

Welcome to the future of AI-powered sales intelligence! 🚀
