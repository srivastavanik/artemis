-- Migration: Add missing columns and constraints (idempotent)
-- This migration only adds what's missing without recreating existing tables

-- Add missing columns to existing tables if they don't exist

-- Add accepted_at column to workspace_invitations if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'workspace_invitations' 
                  AND column_name = 'accepted_at') THEN
        ALTER TABLE workspace_invitations ADD COLUMN accepted_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add updated_at column to workspace_invitations if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'workspace_invitations' 
                  AND column_name = 'updated_at') THEN
        ALTER TABLE workspace_invitations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add event_type column to audit_logs if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'audit_logs' 
                  AND column_name = 'event_type') THEN
        ALTER TABLE audit_logs ADD COLUMN event_type VARCHAR(100);
        -- Migrate existing data
        UPDATE audit_logs SET event_type = action WHERE event_type IS NULL;
    END IF;
END $$;

-- Add event_data column to audit_logs if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_schema = 'public' 
                  AND table_name = 'audit_logs' 
                  AND column_name = 'event_data') THEN
        ALTER TABLE audit_logs ADD COLUMN event_data JSONB;
        -- Migrate existing data
        UPDATE audit_logs SET event_data = details WHERE event_data IS NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_token ON workspace_invitations(token);
CREATE INDEX IF NOT EXISTS idx_workspace_invitations_email ON workspace_invitations(email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace_event ON audit_logs(workspace_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_prospects_quarantine_source ON prospects_quarantine(source);
CREATE INDEX IF NOT EXISTS idx_prospects_staging_status ON prospects_staging(status);
CREATE INDEX IF NOT EXISTS idx_prospects_staging_source ON prospects_staging(source);

-- Add update triggers for updated_at columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_workspace_invitations_updated_at') THEN
        CREATE TRIGGER update_workspace_invitations_updated_at 
        BEFORE UPDATE ON workspace_invitations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Note: The prospects_quarantine and prospects_staging tables exist but with different structures
-- than originally planned. They are functional as-is, so we're not modifying them.
