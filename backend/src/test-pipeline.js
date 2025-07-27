import supabaseService from './services/supabase.service.js';
import { logger } from './utils/logger.js';

async function testPipelineFunctionality() {
  console.log('\n=== ARTEMIS PIPELINE FUNCTIONALITY TEST ===\n');

  const results = {
    database: {},
    pipeline: {},
    features: {}
  };

  // Test 1: Database connectivity
  console.log('1. Testing Database Connectivity...');
  try {
    const { data, error } = await supabaseService.client
      .from('prospects')
      .select('count');
    
    if (error) throw error;
    results.database.connected = true;
    results.database.prospectCount = data?.[0]?.count || 0;
    console.log('✅ Database connected successfully');
  } catch (error) {
    results.database.connected = false;
    results.database.error = error.message;
    console.log('❌ Database connection failed:', error.message);
  }

  // Test 2: Check if pipeline tables exist
  console.log('\n2. Checking Pipeline Tables...');
  const tables = ['prospects_staging', 'prospects_quarantine'];
  
  for (const table of tables) {
    try {
      const { count, error } = await supabaseService.client
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      results.database[`${table}_exists`] = true;
      results.database[`${table}_count`] = count || 0;
      console.log(`✅ Table ${table} exists (${count || 0} records)`);
    } catch (error) {
      results.database[`${table}_exists`] = false;
      results.database[`${table}_error`] = error.message;
      console.log(`❌ Table ${table} error:`, error.message);
    }
  }

  // Test 3: Test staging record creation
  console.log('\n3. Testing Staging Record Creation...');
  try {
    const testData = {
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      company: 'Test Company'
    };

    const stagingRecord = await supabaseService.createStagingRecord(
      testData,
      'test_pipeline'
    );

    if (stagingRecord.id) {
      results.pipeline.createStaging = true;
      results.pipeline.stagingId = stagingRecord.id;
      console.log('✅ Staging record created:', stagingRecord.id);
    }
  } catch (error) {
    results.pipeline.createStaging = false;
    results.pipeline.createStagingError = error.message;
    console.log('❌ Failed to create staging record:', error.message);
  }

  // Test 4: Test retrieving pending records
  console.log('\n4. Testing Pending Records Retrieval...');
  try {
    const pendingRecords = await supabaseService.getPendingStagingRecords(10);
    results.pipeline.getPending = true;
    results.pipeline.pendingCount = pendingRecords.length;
    console.log(`✅ Retrieved ${pendingRecords.length} pending records`);
  } catch (error) {
    results.pipeline.getPending = false;
    results.pipeline.getPendingError = error.message;
    console.log('❌ Failed to get pending records:', error.message);
  }

  // Test 5: Check enrichment tables
  console.log('\n5. Checking Enrichment Tables...');
  try {
    const { count, error } = await supabaseService.client
      .from('enrichment_data')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    results.features.enrichmentTableExists = true;
    results.features.enrichmentCount = count || 0;
    console.log(`✅ Enrichment table exists (${count || 0} records)`);
  } catch (error) {
    results.features.enrichmentTableExists = false;
    results.features.enrichmentError = error.message;
    console.log('❌ Enrichment table error:', error.message);
  }

  // Test 6: Check authentication
  console.log('\n6. Checking Authentication Setup...');
  try {
    const { count, error } = await supabaseService.client
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    results.features.authSetup = true;
    results.features.userCount = count || 0;
    console.log(`✅ Auth tables exist (${count || 0} users)`);
  } catch (error) {
    results.features.authSetup = false;
    results.features.authError = error.message;
    console.log('❌ Auth table error:', error.message);
  }

  // Summary
  console.log('\n=== SUMMARY ===\n');
  console.log('Missing Functionality:');
  
  const issues = [];
  
  if (!results.database.connected) {
    issues.push('- Database connection failed');
  }
  
  if (!results.database.prospects_staging_exists) {
    issues.push('- prospects_staging table missing or inaccessible');
  }
  
  if (!results.database.prospects_quarantine_exists) {
    issues.push('- prospects_quarantine table missing or inaccessible');
  }
  
  if (!results.pipeline.createStaging) {
    issues.push('- Cannot create staging records');
  }
  
  if (!results.pipeline.getPending) {
    issues.push('- Cannot retrieve pending records');
  }
  
  if (!results.features.enrichmentTableExists) {
    issues.push('- Enrichment data table missing');
  }
  
  if (!results.features.authSetup) {
    issues.push('- Authentication tables missing');
  }
  
  if (issues.length === 0) {
    console.log('✅ All core functionality is available!');
  } else {
    issues.forEach(issue => console.log(issue));
  }

  console.log('\n=== DETAILED RESULTS ===');
  console.log(JSON.stringify(results, null, 2));

  process.exit(0);
}

// Run the test
testPipelineFunctionality().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
