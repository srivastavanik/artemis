import dotenv from 'dotenv';
import supabaseService from './services/supabase.service.js';

dotenv.config({ path: '../.env' });

const supabase = supabaseService.client;

async function testPipeline() {
  console.log('\n=== TESTING ARTEMIS PIPELINE ===\n');

  // Test 1: Insert test data into staging
  console.log('1. Inserting test data into staging table...');
  
  const testProspects = [
    {
      raw_data: {
        email: 'test.user@example.com',
        first_name: 'Test',
        last_name: 'User',
        company_name: 'Example Corp',
        job_title: 'Director of Sales'
      },
      source: 'pipeline_test',
      status: 'pending'
    },
    {
      raw_data: {
        // This one is missing email - should be quarantined
        first_name: 'Invalid',
        last_name: 'Record',
        company_name: 'No Email Inc'
      },
      source: 'pipeline_test',
      status: 'pending'
    }
  ];

  try {
    const { data: inserted, error } = await supabase
      .from('prospects_staging')
      .insert(testProspects)
      .select();

    if (error) {
      console.error('Error:', error);
      return;
    }

    console.log(`✅ Inserted ${inserted.length} records into staging`);
    inserted.forEach(record => {
      console.log(`   - ID: ${record.id} (${record.raw_data.first_name || 'Unknown'})`);
    });

    // Test 2: Check staging table
    console.log('\n2. Checking staging table contents...');
    const { data: staging, error: stagingError } = await supabase
      .from('prospects_staging')
      .select('*')
      .eq('source', 'pipeline_test');

    console.log(`📥 Records in staging: ${staging?.length || 0}`);
    
    // Test 3: Show how pipeline will process
    console.log('\n3. Pipeline Processing Info:');
    console.log('   🔄 The pipeline runs automatically every minute');
    console.log('   📊 Valid records → prospects table');
    console.log('   🚫 Invalid records → prospects_quarantine table');
    
    console.log('\n4. Manual Check Instructions:');
    console.log('   Go to Supabase Table Editor and check:');
    console.log('   - prospects_staging: Should show 2 records with status "pending"');
    console.log('   - Wait 60 seconds for automatic processing');
    console.log('   - prospects: Should have the valid record');
    console.log('   - prospects_quarantine: Should have the invalid record');

    // Test 4: Show current table counts
    console.log('\n5. Current Table Status:');
    
    const { count: prospectCount } = await supabase
      .from('prospects')
      .select('*', { count: 'exact', head: true });
    
    const { count: quarantineCount } = await supabase
      .from('prospects_quarantine')
      .select('*', { count: 'exact', head: true });

    console.log(`   - Total prospects: ${prospectCount || 0}`);
    console.log(`   - Total quarantined: ${quarantineCount || 0}`);

    console.log('\n✅ Test data inserted successfully!');
    console.log('⏰ The pipeline will process these records within 60 seconds.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPipeline();
