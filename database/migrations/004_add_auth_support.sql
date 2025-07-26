-- Migration to add Supabase Auth support to existing database
-- This works with your existing table structure

-- First ensure we have the uuid extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Modify existing users table to support Supabase Auth
-- First, let's make the password_hash optional since Supabase Auth will handle it
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Add new columns for auth integration
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS arcade_connected BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL,
  settings JSONB DEFAULT '{}',
  api_keys JSONB DEFAULT '{}',
  subscription_tier TEXT DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE workspaces 
ADD CONSTRAINT workspaces_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE users 
ADD CONSTRAINT users_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL;

-- Add workspace_id to all business tables
ALTER TABLE prospects ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE enrichment_data ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE engagement_scores ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE outreach_campaigns ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE interactions ADD COLUMN IF NOT EXISTS workspace_id UUID;
ALTER TABLE agent_logs ADD COLUMN IF NOT EXISTS workspace_id UUID;

-- Add foreign key constraints for workspace_id
ALTER TABLE prospects 
ADD CONSTRAINT prospects_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE enrichment_data 
ADD CONSTRAINT enrichment_data_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE engagement_scores 
ADD CONSTRAINT engagement_scores_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE outreach_campaigns 
ADD CONSTRAINT outreach_campaigns_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE messages 
ADD CONSTRAINT messages_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE interactions 
ADD CONSTRAINT interactions_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE agent_logs 
ADD CONSTRAINT agent_logs_workspace_id_fkey 
FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create workspace invitations table
CREATE TABLE IF NOT EXISTS workspace_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted BOOLEAN DEFAULT FALSE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Update the role constraint to include new roles
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('owner', 'admin', 'member', 'user'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_workspace_id ON users(workspace_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_id ON audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_prospects_workspace_id ON prospects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_data_workspace_id ON enrichment_data(workspace_id);
CREATE INDEX IF NOT EXISTS idx_engagement_scores_workspace_id ON engagement_scores(workspace_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_workspace_id ON outreach_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_messages_workspace_id ON messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_interactions_workspace_id ON interactions(workspace_id);
CREATE INDEX IF NOT EXISTS idx_agent_logs_workspace_id ON agent_logs(workspace_id);

-- Create a function to auto-create workspace for new users
CREATE OR REPLACE FUNCTION create_user_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Only create workspace if user doesn't have one
  IF NEW.workspace_id IS NULL THEN
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (
      COALESCE(NEW.name, NEW.email, 'My Workspace'),
      'workspace-' || LOWER(REPLACE(uuid_generate_v4()::TEXT, '-', '')),
      NEW.id
    )
    RETURNING id INTO new_workspace_id;
    
    -- Update the user with their workspace
    NEW.workspace_id := new_workspace_id;
    NEW.role := 'owner';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto workspace creation
DROP TRIGGER IF EXISTS create_workspace_on_user_insert ON users;
CREATE TRIGGER create_workspace_on_user_insert
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_workspace();

-- Create workspaces for any existing users
DO $$
DECLARE
  user_record RECORD;
  new_workspace_id UUID;
BEGIN
  FOR user_record IN SELECT id, email, name FROM users WHERE workspace_id IS NULL
  LOOP
    -- Create a workspace for each user
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (
      COALESCE(user_record.name, user_record.email, 'Workspace'),
      'workspace-' || LOWER(REPLACE(uuid_generate_v4()::TEXT, '-', '')),
      user_record.id
    )
    RETURNING id INTO new_workspace_id;
    
    -- Update the user with their workspace
    UPDATE users SET workspace_id = new_workspace_id, role = 'owner' WHERE id = user_record.id;
  END LOOP;
END $$;

-- Note: To fully integrate with Supabase Auth, you'll need to:
-- 1. Link existing users to Supabase Auth users via the auth_id field
-- 2. Enable Row Level Security (RLS) through Supabase dashboard
-- 3. Update your application to use Supabase Auth for authentication
