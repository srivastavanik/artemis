import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });

async function testDatabaseAccess() {
  console.log('\n=== TESTING SUPABASE DATABASE ACCESS ===\n');

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;

  console.log('Supabase URL:', url);
  console.log('Service Key:', serviceKey ? 'Present' : 'Missing');

  const supabase = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  });

  // Test 1: List all tables
  console.log('\n1. Listing all accessible tables:');
  try {
    const { data: tables, error } = await supabase.rpc('get_tables', {});
    
    if (error) {
      // Try alternative method
      const { data, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_schema')
        .eq('table_schema', 'public');
      
      if (tableError) {
        console.log('Cannot list tables directly. Tables may exist but require specific queries.');
      } else {
        console.log('Tables in public schema:', data);
      }
    } else {
      console.log('Tables:', tables);
    }
  } catch (e) {
    console.log('Error listing tables:', e.message);
  }

  // Test 2: Direct query to prospects_staging
  console.log('\n2. Testing direct access to prospects_staging:');
  try {
    const { data, error, status, statusText } = await supabase
      .from('prospects_staging')
      .select('*')
      .limit(1);
    
    console.log('Status:', status, statusText);
    console.log('Error:', error);
    console.log('Data:', data);
    
    if (error) {
      console.log('Error details:', JSON.stringify(error, null, 2));
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }

  // Test 3: Try to insert a record
  console.log('\n3. Testing insert into prospects_staging:');
  try {
    const testData = {
      raw_data: { test: true, timestamp: new Date().toISOString() },
      source: 'test_script',
      status: 'pending'
    };

    const { data, error, status } = await supabase
      .from('prospects_staging')
      .insert([testData])
      .select();
    
    console.log('Insert status:', status);
    
    if (error) {
      console.log('Insert error:', JSON.stringify(error, null, 2));
    } else {
      console.log('Inserted successfully:', data);
      
      // Clean up test data
      if (data && data[0]) {
        await supabase
          .from('prospects_staging')
          .delete()
          .eq('id', data[0].id);
        console.log('Cleaned up test data');
      }
    }
  } catch (e) {
    console.log('Insert exception:', e.message);
  }

  // Test 4: Check RLS policies
  console.log('\n4. Checking RLS policies:');
  try {
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .or('tablename.eq.prospects_staging,tablename.eq.prospects_quarantine');
    
    if (error) {
      console.log('Cannot query policies directly');
    } else {
      console.log('RLS Policies:', policies);
    }
  } catch (e) {
    console.log('Policy check error:', e.message);
  }

  // Test 5: Test with different schema
  console.log('\n5. Testing without schema specification:');
  const supabaseNoSchema = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { data, error } = await supabaseNoSchema
      .from('prospects_staging')
      .select('count');
    
    if (error) {
      console.log('Error without schema:', error.message);
    } else {
      console.log('Success without schema specification');
    }
  } catch (e) {
    console.log('Exception:', e.message);
  }

  console.log('\n=== END OF DATABASE TEST ===\n');
}

testDatabaseAccess().catch(console.error);
