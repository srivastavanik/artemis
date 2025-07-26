# ARTEMIS: AI-Powered Sales Intelligence Platform

ARTEMIS is a sophisticated sales intelligence platform that leverages AI agents to automate prospect discovery, enrichment, scoring, and personalized outreach campaigns. Built with modern technologies and featuring a sleek dark-themed UI with glass morphism effects.

![ARTEMIS Platform](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🚀 Features

### AI-Powered Multi-Agent System
- **Scout Agent**: Discovers and identifies high-value prospects using BrightData
- **Analyst Agent**: Scores prospects and generates insights using LlamaIndex
- **Strategist Agent**: Designs personalized campaign strategies
- **Executor Agent**: Orchestrates multi-channel outreach via Arcade

### Core Capabilities
- 🔍 **Intelligent Prospect Discovery**: Web scraping and data mining
- 💎 **Deep Enrichment**: Company, social, and intent data gathering
- 📊 **Smart Scoring**: AI-driven engagement and fit scoring
- 📧 **Personalized Campaigns**: Multi-channel outreach automation
- 📈 **Real-time Analytics**: Campaign performance and ROI tracking
- 🔄 **Workflow Automation**: Mastra-powered orchestration

### Technical Features
- Real-time updates via WebSocket
- JWT-based authentication
- Rate limiting and security middleware
- RESTful API with comprehensive endpoints
- Docker support for easy deployment
- Responsive dark-themed UI

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **PostgreSQL** via Supabase
- **Mastra** for workflow orchestration
- **Socket.io** for real-time updates
- **JWT** for authentication

### Frontend
- **React** with Vite
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Glass morphism** design system
- **Chart.js** for analytics

### AI & Integrations
- **BrightData** for web scraping
- **LlamaIndex** for AI analysis
- **Arcade** for campaign execution
- **Supabase** for database and auth

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (via Supabase)
- API keys for:
  - BrightData
  - LlamaIndex
  - Arcade
  - Supabase
  - Mastra

## 🔧 Installation

### Quick Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/artemis.git
cd artemis
```

2. Run the setup script:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your API keys
```

### Manual Setup

1. Install dependencies:
```bash
# Root dependencies
npm install

# Backend dependencies
cd backend && npm install && cd ..

# Frontend dependencies
cd frontend && npm install && cd ..
```

2. Set up the database:
```sql
-- Run the migration in your Supabase project
-- Copy contents from database/migrations/001_initial_schema.sql
```

3. Configure environment variables in `.env`

## 🚀 Running the Application

### Development Mode

Start both frontend and backend:
```bash
npm run dev
```

Or run separately:
```bash
# Backend only (port 3001)
npm run dev:backend

# Frontend only (port 5173)
npm run dev:frontend
```

### Production Mode

Using Docker:
```bash
# Build and start containers
npm run docker:up

# Stop containers
npm run docker:down
```

Manual production build:
```bash
# Build frontend
cd frontend && npm run build

# Start production server
NODE_ENV=production npm start
```

## 📊 Database Setup

### Seed Demo Data

Generate sample data for testing:
```bash
npm run seed

# Or clean and seed
npm run seed:clean
```

### Database Schema

The platform uses the following main tables:
- `prospects`: Lead information and status
- `enrichment_data`: Company and social data
- `engagement_scores`: AI-calculated scores
- `outreach_campaigns`: Campaign definitions
- `messages`: Sent messages and status
- `interactions`: Prospect engagement tracking
- `agent_logs`: AI agent activity logs

## � API Endpoints

### Prospects
- `GET /api/prospects` - List all prospects
- `POST /api/prospects` - Create new prospect
- `POST /api/prospects/discover` - AI-powered discovery
- `POST /api/prospects/:id/enrich` - Enrich prospect data
- `POST /api/prospects/:id/analyze` - Analyze and score

### Campaigns
- `GET /api/campaigns` - List campaigns
- `POST /api/campaigns` - Create campaign
- `POST /api/campaigns/execute` - Execute campaign

### Analytics
- `GET /api/analytics` - Dashboard metrics
- `GET /api/analytics/agents` - Agent performance
- `GET /api/analytics/funnel` - Conversion funnel
- `GET /api/analytics/content` - Content performance
- `GET /api/analytics/roi` - ROI metrics

## 🎨 UI Components

The frontend features a modern dark theme with glass morphism effects:

- **Dashboard**: Real-time metrics and activity feed
- **Prospects**: Table view with filters and detail modal
- **Campaigns**: Campaign builder and management
- **Analytics**: Interactive charts and reports
- **Settings**: Configuration and preferences

## � Security

- JWT-based authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- Environment variable management
- CORS configuration
- SQL injection prevention via Supabase

## 🧪 Testing

Run tests:
```bash
# All tests
npm test

# Backend tests
npm run test:backend

# Frontend tests
npm run test:frontend
```

## � Deployment

### Using Docker

1. Build images:
```bash
docker-compose build
```

2. Run containers:
```bash
docker-compose up -d
```

### Manual Deployment

1. Build frontend:
```bash
cd frontend && npm run build
```

2. Set production environment:
```bash
export NODE_ENV=production
```

3. Start server:
```bash
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## � License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with sponsor APIs from BrightData, LlamaIndex, Arcade, and Mastra
- UI inspired by modern glass morphism design trends
- Multi-agent architecture based on best practices in AI orchestration

## � Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/artemis/issues)
- Documentation: [View docs](https://artemis-docs.example.com)
- Email: support@artemis.example.com

---

Built with ❤️ by the ARTEMIS team
