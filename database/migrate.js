import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // Get migration file from command line argument
    const migrationFile = process.argv[2];
    
    if (!migrationFile) {
      console.log('Usage: node migrate.js <migration-file>');
      console.log('Example: node migrate.js 005_data_pipeline_tables.sql');
      
      // List available migrations
      console.log('\nAvailable migrations:');
      const migrationsPath = join(__dirname, 'migrations');
      console.log('- 001_initial_schema.sql');
      console.log('- 002_auth_tables.sql');
      console.log('- 003_add_workspaces.sql');
      console.log('- 004_add_auth_support.sql');
      console.log('- 005_data_pipeline_tables.sql');
      process.exit(0);
    }

    const sqlPath = join(__dirname, 'migrations', migrationFile);
    console.log(`Running migration: ${migrationFile}`);
    
    // Read SQL file
    const sql = readFileSync(sqlPath, 'utf8');
    
    // Execute SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      // If the RPC function doesn't exist, try direct execution
      console.log('Note: exec_sql RPC not found, tables may need to be created directly in Supabase Dashboard');
      console.log('\nSQL to execute:');
      console.log('================');
      console.log(sql);
      console.log('================');
      console.log('\nPlease copy and run this SQL in your Supabase SQL Editor.');
    } else {
      console.log(`Migration ${migrationFile} completed successfully!`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations if called with 'all'
async function runAllMigrations() {
  const migrations = [
    '001_initial_schema.sql',
    '002_auth_tables.sql',
    '003_add_workspaces.sql',
    '004_add_auth_support.sql',
    '005_data_pipeline_tables.sql'
  ];
  
  for (const migration of migrations) {
    process.argv[2] = migration;
    await runMigration();
  }
}

if (process.argv[2] === 'all') {
  runAllMigrations();
} else {
  runMigration();
}
