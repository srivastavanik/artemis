-- Safe Data Pipeline Tables Migration
-- This migration safely creates staging and quarantine tables only if they don't exist

-- First, ensure uuid-ossp extension is enabled (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create prospects_staging table for raw data ingestion (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'prospects_staging') THEN
        
        CREATE TABLE public.prospects_staging (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            raw_data JSONB NOT NULL,
            source TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'quarantined', 'error')),
            processing_log TEXT[] DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            processed_at TIMESTAMP WITH TIME ZONE,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX idx_staging_status ON public.prospects_staging(status);
        CREATE INDEX idx_staging_created ON public.prospects_staging(created_at);
        CREATE INDEX idx_staging_source ON public.prospects_staging(source);

        -- Add comment
        COMMENT ON TABLE public.prospects_staging IS 'Temporary staging area for incoming prospect data before validation and processing';
        
        RAISE NOTICE 'Created table prospects_staging';
    ELSE
        RAISE NOTICE 'Table prospects_staging already exists - skipping';
    END IF;
END $$;

-- Create prospects_quarantine table for invalid data (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'prospects_quarantine') THEN
        
        CREATE TABLE public.prospects_quarantine (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            staged_data JSONB NOT NULL,
            reason_for_quarantine TEXT[] NOT NULL,
            source TEXT NOT NULL,
            validation_errors JSONB,
            quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            reviewed_at TIMESTAMP WITH TIME ZONE,
            reviewed_by UUID REFERENCES public.users(id),
            review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'fixed'))
        );

        -- Create indexes
        CREATE INDEX idx_quarantine_status ON public.prospects_quarantine(review_status);
        CREATE INDEX idx_quarantine_date ON public.prospects_quarantine(quarantined_at);

        -- Add comment
        COMMENT ON TABLE public.prospects_quarantine IS 'Storage for prospect data that failed validation, awaiting manual review';
        
        RAISE NOTICE 'Created table prospects_quarantine';
    ELSE
        RAISE NOTICE 'Table prospects_quarantine already exists - skipping';
    END IF;
END $$;

-- Create or replace the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger to staging table (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger 
                   WHERE tgname = 'update_staging_updated_at') THEN
        CREATE TRIGGER update_staging_updated_at 
        BEFORE UPDATE ON public.prospects_staging
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
        
        RAISE NOTICE 'Created trigger update_staging_updated_at';
    ELSE
        RAISE NOTICE 'Trigger update_staging_updated_at already exists - skipping';
    END IF;
END $$;

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.prospects_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prospects_quarantine ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Service role can do everything on prospects_staging" ON public.prospects_staging;
DROP POLICY IF EXISTS "Authenticated users can view staging records" ON public.prospects_staging;
DROP POLICY IF EXISTS "Service role can do everything on prospects_quarantine" ON public.prospects_quarantine;
DROP POLICY IF EXISTS "Authenticated users can view and update quarantine records" ON public.prospects_quarantine;

-- Create new policies
CREATE POLICY "Service role can do everything on prospects_staging"
ON public.prospects_staging
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view staging records"
ON public.prospects_staging
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Service role can do everything on prospects_quarantine"
ON public.prospects_quarantine
FOR ALL
TO service_role
USING (true);

CREATE POLICY "Authenticated users can view and update quarantine records"
ON public.prospects_quarantine
FOR ALL
TO authenticated
USING (true);

-- Grant permissions (safe to run multiple times)
GRANT ALL ON public.prospects_staging TO authenticated;
GRANT ALL ON public.prospects_quarantine TO authenticated;
GRANT ALL ON public.prospects_staging TO service_role;
GRANT ALL ON public.prospects_quarantine TO service_role;

-- Final status message
DO $$
BEGIN
    RAISE NOTICE 'Data pipeline tables migration completed successfully';
END $$;
