-- Fix the workspace creation trigger that's causing foreign key violations
-- The issue is that the BEFORE INSERT trigger tries to create a workspace
-- referencing a user that doesn't exist yet

-- First, drop the problematic trigger
DROP TRIGGER IF EXISTS create_workspace_on_user_insert ON users;

-- Drop the function
DROP FUNCTION IF EXISTS create_user_workspace();

-- Create a new function that runs AFTER user creation
CREATE OR REPLACE FUNCTION create_user_workspace_after()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- Only create workspace if user doesn't have one
  IF NEW.workspace_id IS NULL AND NEW.role != 'user' THEN
    -- Create workspace
    INSERT INTO workspaces (name, slug, owner_id)
    VALUES (
      COALESCE(NEW.name, NEW.email, 'My Workspace'),
      'workspace-' || LOWER(REPLACE(gen_random_uuid()::TEXT, '-', '')),
      NEW.id
    )
    RETURNING id INTO new_workspace_id;
    
    -- Update the user with their workspace
    UPDATE users 
    SET workspace_id = new_workspace_id, 
        role = CASE WHEN role = 'user' THEN 'owner' ELSE role END
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create AFTER INSERT trigger instead of BEFORE
CREATE TRIGGER create_workspace_after_user_insert
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_workspace_after();

-- Also ensure we don't auto-create workspaces for basic 'user' role
-- Workspaces should only be created during onboarding or when explicitly requested
