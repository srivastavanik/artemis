-- Data Pipeline Tables Migration
-- This migration creates staging and quarantine tables for the data pipeline

-- Create prospects_staging table for raw data ingestion
CREATE TABLE prospects_staging (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    raw_data JSONB NOT NULL,
    source TEXT NOT NULL, -- 'ai_discovery', 'manual_creation', 'csv_import', etc.
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'quarantined', 'error')),
    processing_log TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prospects_quarantine table for invalid data
CREATE TABLE prospects_quarantine (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    staged_data JSONB NOT NULL,
    reason_for_quarantine TEXT[] NOT NULL,
    source TEXT NOT NULL,
    validation_errors JSONB,
    quarantined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID REFERENCES users(id),
    review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'fixed'))
);

-- Create indexes for performance
CREATE INDEX idx_staging_status ON prospects_staging(status);
CREATE INDEX idx_staging_created ON prospects_staging(created_at);
CREATE INDEX idx_staging_source ON prospects_staging(source);
CREATE INDEX idx_quarantine_status ON prospects_quarantine(review_status);
CREATE INDEX idx_quarantine_date ON prospects_quarantine(quarantined_at);

-- Add updated_at trigger to staging table
CREATE TRIGGER update_staging_updated_at BEFORE UPDATE ON prospects_staging
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE prospects_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects_quarantine ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON prospects_staging TO authenticated;
GRANT ALL ON prospects_quarantine TO authenticated;
