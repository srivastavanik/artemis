-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  workspace_id UUID, -- Will add foreign key constraint after workspaces table is created
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  google_connected BOOLEAN DEFAULT FALSE,
  arcade_connected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces table for multi-tenancy
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  api_keys JSONB DEFAULT '{}', -- Encrypted storage for API keys
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Now add the foreign key constraint for workspace_id in users
ALTER TABLE users 
ADD CONSTRAINT users_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Workspace invitations
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted BOOLEAN DEFAULT FALSE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking user actions
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Users can view their workspace
CREATE POLICY "Users can view their workspace" ON workspaces
  FOR SELECT USING (
    id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

-- Workspace owners can update their workspace
CREATE POLICY "Workspace owners can update" ON workspaces
  FOR UPDATE USING (owner_id = auth.uid());

-- Users can view invitations for their email
CREATE POLICY "Users can view their invitations" ON workspace_invitations
  FOR SELECT USING (email = auth.email());

-- Workspace members can view audit logs
CREATE POLICY "Workspace members can view audit logs" ON audit_logs
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Update all existing tables to include workspace_id for multi-tenancy
-- Check if workspace_id column exists before adding
DO $$ 
BEGIN
  -- prospects table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prospects' AND column_name = 'workspace_id') THEN
    ALTER TABLE prospects ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_prospects_workspace_id ON prospects(workspace_id);
  END IF;

  -- enrichment_data table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrichment_data' AND column_name = 'workspace_id') THEN
    ALTER TABLE enrichment_data ADD COLUMN workspace_id UUID;
    -- Get workspace_id from related prospect
    UPDATE enrichment_data ed SET workspace_id = p.workspace_id 
    FROM prospects p WHERE ed.prospect_id = p.id;
    -- Add constraint after update
    ALTER TABLE enrichment_data ADD CONSTRAINT enrichment_data_workspace_id_fkey 
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_enrichment_data_workspace_id ON enrichment_data(workspace_id);
  END IF;

  -- engagement_scores table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'engagement_scores' AND column_name = 'workspace_id') THEN
    ALTER TABLE engagement_scores ADD COLUMN workspace_id UUID;
    -- Get workspace_id from related prospect
    UPDATE engagement_scores es SET workspace_id = p.workspace_id 
    FROM prospects p WHERE es.prospect_id = p.id;
    -- Add constraint after update
    ALTER TABLE engagement_scores ADD CONSTRAINT engagement_scores_workspace_id_fkey 
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_engagement_scores_workspace_id ON engagement_scores(workspace_id);
  END IF;

  -- outreach_campaigns table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'outreach_campaigns' AND column_name = 'workspace_id') THEN
    ALTER TABLE outreach_campaigns ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_outreach_campaigns_workspace_id ON outreach_campaigns(workspace_id);
  END IF;

  -- messages table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'workspace_id') THEN
    ALTER TABLE messages ADD COLUMN workspace_id UUID;
    -- Get workspace_id from related campaign
    UPDATE messages m SET workspace_id = c.workspace_id 
    FROM outreach_campaigns c WHERE m.campaign_id = c.id;
    -- Add constraint after update
    ALTER TABLE messages ADD CONSTRAINT messages_workspace_id_fkey 
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_messages_workspace_id ON messages(workspace_id);
  END IF;

  -- interactions table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'workspace_id') THEN
    ALTER TABLE interactions ADD COLUMN workspace_id UUID;
    -- Get workspace_id from related prospect
    UPDATE interactions i SET workspace_id = p.workspace_id 
    FROM prospects p WHERE i.prospect_id = p.id;
    -- Add constraint after update
    ALTER TABLE interactions ADD CONSTRAINT interactions_workspace_id_fkey 
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_interactions_workspace_id ON interactions(workspace_id);
  END IF;

  -- agent_logs table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'agent_logs' AND column_name = 'workspace_id') THEN
    ALTER TABLE agent_logs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_agent_logs_workspace_id ON agent_logs(workspace_id);
  END IF;
END $$;
