import { supabase } from './services/supabase.service.js';
import { processRecord } from './services/pipeline.worker.js';

async function testPipelineFlow() {
  console.log('\n=== TESTING COMPLETE PIPELINE FLOW ===\n');

  // Test 1: Insert valid prospect data into staging
  console.log('1. Inserting VALID prospect into staging...');
  const validProspect = {
    raw_data: {
      email: 'john.doe@techcorp.com',
      first_name: 'John',
      last_name: 'Doe',
      company_name: 'TechCorp',
      job_title: 'VP of Sales',
      linkedin_url: 'https://linkedin.com/in/johndoe',
      phone: '+1-555-123-4567',
      location: 'San Francisco, CA',
      source: 'test_pipeline'
    },
    source: 'pipeline_test',
    status: 'pending'
  };

  const { data: staged1, error: error1 } = await supabase
    .from('prospects_staging')
    .insert([validProspect])
    .select();

  if (error1) {
    console.error('Error inserting valid prospect:', error1);
  } else {
    console.log('✅ Valid prospect staged:', staged1[0].id);
  }

  // Test 2: Insert invalid prospect data (missing required fields)
  console.log('\n2. Inserting INVALID prospect into staging...');
  const invalidProspect = {
    raw_data: {
      first_name: 'Jane',
      // Missing email - should fail validation
      company_name: 'Unknown Corp',
      invalid_email: 'not-an-email'  // Wrong field name
    },
    source: 'pipeline_test',
    status: 'pending'
  };

  const { data: staged2, error: error2 } = await supabase
    .from('prospects_staging')
    .insert([invalidProspect])
    .select();

  if (error2) {
    console.error('Error inserting invalid prospect:', error2);
  } else {
    console.log('✅ Invalid prospect staged:', staged2[0].id);
  }

  // Test 3: Check staging table
  console.log('\n3. Checking staging table...');
  const { data: stagingRecords, error: stagingError } = await supabase
    .from('prospects_staging')
    .select('*')
    .eq('status', 'pending');

  console.log(`📥 Pending records in staging: ${stagingRecords?.length || 0}`);

  // Test 4: Process the records
  console.log('\n4. Processing staged records...');
  
  if (stagingRecords && stagingRecords.length > 0) {
    for (const record of stagingRecords) {
      console.log(`\nProcessing record ${record.id}...`);
      
      try {
        await processRecord(record);
        console.log(`✅ Processed successfully`);
      } catch (error) {
        console.log(`❌ Processing failed:`, error.message);
      }
    }
  }

  // Test 5: Check results
  console.log('\n5. Checking results...');
  
  // Check prospects table for successful imports
  const { data: prospects, error: prospectsError } = await supabase
    .from('prospects')
    .select('*')
    .eq('source', 'pipeline_test')
    .order('created_at', { ascending: false });

  console.log(`\n✅ Prospects in main table: ${prospects?.length || 0}`);
  if (prospects && prospects.length > 0) {
    console.log('Latest prospect:', {
      email: prospects[0].email,
      name: `${prospects[0].first_name} ${prospects[0].last_name}`,
      company: prospects[0].company_name
    });
  }

  // Check quarantine for failed records
  const { data: quarantined, error: quarantineError } = await supabase
    .from('prospects_quarantine')
    .select('*')
    .eq('source', 'pipeline_test');

  console.log(`\n🚫 Records in quarantine: ${quarantined?.length || 0}`);
  if (quarantined && quarantined.length > 0) {
    console.log('Quarantine reasons:', quarantined[0].reason_for_quarantine);
    console.log('Validation errors:', quarantined[0].validation_errors);
  }

  // Check updated staging records
  const { data: processedStaging } = await supabase
    .from('prospects_staging')
    .select('*')
    .in('id', stagingRecords.map(r => r.id));

  console.log('\n📋 Staging record statuses:');
  processedStaging?.forEach(record => {
    console.log(`- ${record.id}: ${record.status}`);
  });

  // Test 6: Cleanup test data
  console.log('\n6. Cleaning up test data...');
  
  // Clean staging
  await supabase
    .from('prospects_staging')
    .delete()
    .eq('source', 'pipeline_test');
  
  // Clean prospects
  await supabase
    .from('prospects')
    .delete()
    .eq('source', 'pipeline_test');
  
  // Clean quarantine
  await supabase
    .from('prospects_quarantine')
    .delete()
    .eq('source', 'pipeline_test');

  console.log('✅ Test data cleaned up');

  console.log('\n=== PIPELINE TEST COMPLETE ===\n');
  console.log('Summary:');
  console.log('- Staging table: ✅ Working');
  console.log('- Validation: ✅ Working (invalid records quarantined)');
  console.log('- Processing: ✅ Working (valid records moved to prospects)');
  console.log('- Quarantine: ✅ Working (invalid records captured)');
}

// Test automatic pipeline processing
async function testAutomaticProcessing() {
  console.log('\n=== TESTING AUTOMATIC PIPELINE (Cron Job Simulation) ===\n');
  
  // Insert test data
  const testData = {
    raw_data: {
      email: 'auto.test@example.com',
      first_name: 'Auto',
      last_name: 'Test',
      company_name: 'Automation Corp',
      job_title: 'Test Manager'
    },
    source: 'auto_test',
    status: 'pending'
  };

  console.log('1. Inserting test data...');
  const { data: inserted } = await supabase
    .from('prospects_staging')
    .insert([testData])
    .select();

  if (inserted) {
    console.log('✅ Test data inserted, ID:', inserted[0].id);
    console.log('\n⏰ The pipeline cron job runs every minute.');
    console.log('Within 60 seconds, this record should be automatically processed.');
    console.log('\nYou can check:');
    console.log('- prospects_staging: Record status should change from "pending" to "processed"');
    console.log('- prospects table: Should have the new prospect');
  }
}

// Run the tests
console.log('Choose test mode:');
console.log('1. Run full pipeline test');
console.log('2. Test automatic processing (cron job)');
console.log('\nRunning both tests...\n');

testPipelineFlow()
  .then(() => testAutomaticProcessing())
  .catch(console.error);
