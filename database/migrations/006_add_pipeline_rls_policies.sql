-- Add RLS policies for pipeline tables
-- This migration adds Row Level Security policies to allow service role access

-- Policies for prospects_staging table
CREATE POLICY "Service role can do everything on prospects_staging"
ON prospects_staging
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view staging records"
ON prospects_staging
FOR SELECT
TO authenticated
USING (true);

-- Policies for prospects_quarantine table
CREATE POLICY "Service role can do everything on prospects_quarantine"
ON prospects_quarantine
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view and update quarantine records"
ON prospects_quarantine
FOR ALL
TO authenticated
USING (true);
