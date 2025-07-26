# ARTEMIS - AI-Powered Sales Intelligence Platform

ARTEMIS is a comprehensive AI-powered sales intelligence platform that combines prospect discovery, enrichment, scoring, and multi-channel outreach orchestration using cutting-edge AI agents and sponsor APIs.

## Features

### Multi-Agent Architecture
- **Scout Agent**: Discovers and enriches prospect data using BrightData
- **Analyst Agent**: Scores prospects using LlamaIndex insights
- **Strategist Agent**: Designs personalized campaigns
- **Executor Agent**: Orchestrates multi-channel outreach via Arcade

### Core Capabilities
- **Intelligent Prospect Discovery**: Find and qualify prospects automatically
- **AI-Powered Enrichment**: Gather comprehensive data from multiple sources
- **Smart Scoring**: Multi-factor scoring based on fit, engagement, and timing
- **Campaign Automation**: Create and execute personalized outreach campaigns
- **Real-time Analytics**: Track performance and optimize strategies

### Sponsor Integrations
- **BrightData**: Web scraping and data discovery
- **LlamaIndex**: AI-powered analysis and personalization
- **Arcade**: Multi-channel campaign execution
- **Mastra**: Workflow orchestration with AI
- **Supabase**: Real-time database and authentication

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (via Supabase)
- OpenAI GPT-4 for AI agents
- Mastra for workflow orchestration
- Redis for caching (optional)
- WebSocket for real-time updates

### Frontend
- React + Vite
- Tailwind CSS with dark theme
- Glass morphism UI design
- Axios for API calls
- React Router for navigation

## Installation

### Prerequisites
- Node.js 18+
- PostgreSQL (or Supabase account)
- API Keys for:
  - OpenAI
  - BrightData
  - LlamaIndex
  - Arcade
  - Supabase

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd artemis
```

2. **Install dependencies**
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. **Run database migrations**
```bash
cd database
psql $DATABASE_URL < migrations/001_initial_schema.sql
```

5. **Start the development servers**

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

## Quick Start

1. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

2. **Initial Setup**
   - Navigate to Settings
   - Configure your API keys
   - Set preferences

3. **Find Prospects**
   - Go to Prospects page
   - Use the search functionality
   - Import or manually add prospects

4. **Enrich & Score**
   - Select prospects to enrich
   - AI agents will gather data and calculate scores

5. **Create Campaigns**
   - Navigate to Campaigns
   - Design personalized outreach
   - Launch multi-channel campaigns

## Project Structure

```
artemis/
├── backend/
│   ├── src/
│   │   ├── agents/         # AI agent implementations
│   │   ├── routes/         # API endpoints
│   │   ├── services/       # External service integrations
│   │   ├── workflows/      # Mastra workflows
│   │   ├── middleware/     # Auth, rate limiting, etc.
│   │   └── server.js       # Express server
│   └── config/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── App.jsx         # Main app component
│   └── public/
├── database/
│   ├── migrations/         # SQL migrations
│   └── seeds/              # Demo data
├── docker-compose.yml      # Docker configuration
└── README.md
```

## API Endpoints

### Prospects
- `GET /api/prospects` - List prospects with filtering
- `POST /api/prospects` - Create new prospect
- `POST /api/prospects/:id/enrich` - Enrich prospect data
- `GET /api/prospects/:id` - Get prospect details

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/:id/launch` - Launch campaign
- `GET /api/campaigns/:id/stats` - Campaign statistics

### Analytics
- `GET /api/analytics` - Overall analytics
- `GET /api/analytics/dashboard` - Dashboard metrics

## Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Security

- JWT authentication for API access
- Rate limiting on all endpoints
- Environment variable encryption
- Secure WebSocket connections
- Input validation and sanitization

## Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test
```

## Database Schema

The platform uses the following main tables:
- `prospects` - Prospect information
- `enrichment_data` - Enriched data from various sources
- `engagement_scores` - AI-calculated scores
- `outreach_campaigns` - Campaign definitions
- `messages` - Outreach messages
- `interactions` - Prospect interactions
- `agent_logs` - AI agent activity logs

## Production Deployment

1. Set production environment variables
2. Build the frontend: `npm run build`
3. Use PM2 or similar for backend process management
4. Configure Nginx for reverse proxy
5. Set up SSL certificates
6. Enable monitoring and logging

## License

This project is proprietary software.

## Support

For issues or questions, please contact the development team.

---

Built with AI-powered development
