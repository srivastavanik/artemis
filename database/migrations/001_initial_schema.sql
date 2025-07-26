-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Prospects table - central entity for all prospect information
CREATE TABLE prospects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    job_title VARCHAR(200),
    company_name VARCHAR(200),
    company_domain VARCHAR(255),
    linkedin_url VARCHAR(500),
    phone VARCHAR(50),
    location VARCHAR(200),
    timezone VARCHAR(50),
    source VARCHAR(100), -- How the prospect was discovered
    discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_enriched_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrichment data table - stores unstructured data from various sources
CREATE TABLE enrichment_data (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    source VARCHAR(100) NOT NULL, -- brightdata, linkedin, twitter, etc.
    data JSONB NOT NULL, -- Flexible storage for any data structure
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- When this data should be refreshed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Engagement scores table - tracks how prospect scores change over time
CREATE TABLE engagement_scores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    intent_score DECIMAL(3,2) CHECK (intent_score >= 0 AND intent_score <= 1),
    readiness_score DECIMAL(3,2) CHECK (readiness_score >= 0 AND readiness_score <= 1),
    budget_likelihood DECIMAL(3,2) CHECK (budget_likelihood >= 0 AND budget_likelihood <= 1),
    timing_score DECIMAL(3,2) CHECK (timing_score >= 0 AND timing_score <= 1),
    personalization_depth DECIMAL(3,2) CHECK (personalization_depth >= 0 AND personalization_depth <= 1),
    overall_score DECIMAL(3,2) CHECK (overall_score >= 0 AND overall_score <= 1),
    scoring_metadata JSONB, -- Explanation of scores
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Outreach campaigns table - stores complete campaign strategies
CREATE TABLE outreach_campaigns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    strategy JSONB NOT NULL, -- Complete campaign strategy as JSON
    channels JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of channels: email, linkedin, etc.
    sequence_timing JSONB, -- Timing between touches
    personalization_rules JSONB, -- Rules for personalization
    a_b_test_config JSONB, -- A/B testing configuration
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, completed
    created_by UUID, -- User who created the campaign
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Messages table - tracks every piece of communication
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    channel VARCHAR(50) NOT NULL, -- email, linkedin, calendar, etc.
    subject VARCHAR(500),
    content TEXT NOT NULL,
    personalization_data JSONB, -- Data used for personalization
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    opened_at TIMESTAMP WITH TIME ZONE,
    clicked_at TIMESTAMP WITH TIME ZONE,
    replied_at TIMESTAMP WITH TIME ZONE,
    bounce_type VARCHAR(50), -- hard, soft, null
    automation_id VARCHAR(255), -- Arcade automation ID
    status VARCHAR(50) DEFAULT 'draft', -- draft, scheduled, sent, delivered, opened, clicked, replied, bounced
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Interactions table - captures how prospects respond
CREATE TABLE interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL, -- email_open, link_click, reply, meeting_booked, etc.
    channel VARCHAR(50) NOT NULL,
    data JSONB, -- Additional interaction data
    sentiment VARCHAR(50), -- positive, neutral, negative
    intent_signals JSONB, -- Detected buying signals
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Agent logs table - debugging and performance metrics
CREATE TABLE agent_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    agent_name VARCHAR(50) NOT NULL, -- scout, analyst, strategist, executor
    operation VARCHAR(100) NOT NULL,
    prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE SET NULL,
    input_data JSONB,
    output_data JSONB,
    error_data JSONB,
    duration_ms INTEGER,
    status VARCHAR(50) NOT NULL, -- success, failure, partial
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table for authentication
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(200),
    role VARCHAR(50) DEFAULT 'user', -- user, admin
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign assignments - which prospects are in which campaigns
CREATE TABLE campaign_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
    prospect_id UUID NOT NULL REFERENCES prospects(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active', -- active, completed, removed
    current_step INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(campaign_id, prospect_id)
);

-- Create indexes for performance
CREATE INDEX idx_prospects_email ON prospects(email);
CREATE INDEX idx_prospects_company ON prospects(company_name);
CREATE INDEX idx_prospects_discovered ON prospects(discovered_at);
CREATE INDEX idx_enrichment_prospect ON enrichment_data(prospect_id);
CREATE INDEX idx_enrichment_source ON enrichment_data(source);
CREATE INDEX idx_scores_prospect ON engagement_scores(prospect_id);
CREATE INDEX idx_scores_calculated ON engagement_scores(calculated_at);
CREATE INDEX idx_messages_prospect ON messages(prospect_id);
CREATE INDEX idx_messages_campaign ON messages(campaign_id);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_scheduled ON messages(scheduled_for);
CREATE INDEX idx_interactions_prospect ON interactions(prospect_id);
CREATE INDEX idx_interactions_type ON interactions(type);
CREATE INDEX idx_agent_logs_agent ON agent_logs(agent_name);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_prospects_updated_at BEFORE UPDATE ON prospects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON outreach_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrichment_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_assignments ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
