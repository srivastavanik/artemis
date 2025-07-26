import express from 'express';
import brightDataService from '../services/brightdata.service.js';
import llamaIndexService from '../services/llamaindex.service.js';
import arcadeService from '../services/arcade.service.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Test all service integrations
 */
router.get('/integrations', async (req, res) => {
  const results = {
    brightdata: { status: 'unknown', message: '' },
    llamaindex: { status: 'unknown', message: '' },
    arcade: { status: 'unknown', message: '' },
    supabase: { status: 'unknown', message: '' }
  };

  // Test BrightData
  try {
    const testSearch = await brightDataService.searchPerson({
      name: 'John Doe',
      company: 'Example Corp'
    });
    results.brightdata.status = 'connected';
    results.brightdata.message = 'BrightData API is accessible';
  } catch (error) {
    results.brightdata.status = 'error';
    results.brightdata.message = error.message;
  }

  // Test LlamaIndex
  try {
    const testAnalysis = await llamaIndexService.analyzeProspect({
      firstName: 'John',
      lastName: 'Doe',
      jobTitle: 'CEO',
      companyName: 'Example Corp'
    });
    results.llamaindex.status = 'connected';
    results.llamaindex.message = 'LlamaIndex API is accessible';
  } catch (error) {
    results.llamaindex.status = 'error';
    results.llamaindex.message = error.message;
  }

  // Test Arcade
  try {
    // Just check if the service is initialized
    const testPersonalization = arcadeService.personalizeContent(
      'Hello {{first_name}}',
      { first_name: 'John' }
    );
    results.arcade.status = testPersonalization === 'Hello John' ? 'connected' : 'error';
    results.arcade.message = results.arcade.status === 'connected' 
      ? 'Arcade service is functional' 
      : 'Personalization failed';
  } catch (error) {
    results.arcade.status = 'error';
    results.arcade.message = error.message;
  }

  // Test Supabase
  try {
    // Simple query to test connection
    const { error } = await supabaseService.client
      .from('prospects')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    results.supabase.status = 'connected';
    results.supabase.message = 'Supabase database is accessible';
  } catch (error) {
    results.supabase.status = 'error';
    results.supabase.message = error.message;
  }

  // Overall status
  const allConnected = Object.values(results).every(r => r.status === 'connected');
  
  res.json({
    success: allConnected,
    timestamp: new Date().toISOString(),
    integrations: results,
    recommendation: allConnected 
      ? 'All integrations are working correctly' 
      : 'Some integrations need configuration. Please check your .env file.'
  });
});

/**
 * Test the complete flow with a demo prospect
 */
router.post('/demo-flow', async (req, res) => {
  try {
    logger.info('Running demo flow test');
    
    // Step 1: Create a demo prospect
    const demoProspect = await supabaseService.createProspect({
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      jobTitle: 'VP Sales',
      companyName: 'Demo Corp',
      companyDomain: 'democorp.com',
      source: 'demo'
    });
    
    // Step 2: Enrich the prospect (simulate)
    const enrichmentData = {
      professional: {
        currentTitle: 'VP Sales',
        currentCompany: 'Demo Corp',
        experience: '10+ years in enterprise sales'
      },
      behavioral: {
        interests: ['sales automation', 'AI technology', 'efficiency']
      }
    };
    
    await supabaseService.storeEnrichmentData(
      demoProspect.id,
      'demo',
      enrichmentData
    );
    
    // Step 3: Score the prospect
    const scores = {
      overall: { score: 85, confidence: 0.9 },
      fit: { score: 90, confidence: 0.85 },
      intent: { score: 80, confidence: 0.8 },
      timing: { score: 85, confidence: 0.75 }
    };
    
    await supabaseService.updateEngagementScores(demoProspect.id, scores);
    
    // Step 4: Create a campaign
    const demoCampaign = await supabaseService.createCampaign({
      name: 'Demo Campaign',
      type: 'email',
      status: 'draft',
      settings: {
        sender_name: 'ARTEMIS Team',
        sender_email: 'demo@artemis.ai',
        daily_limit: 50
      },
      created_by: 'demo'
    });
    
    // Step 5: Create a message
    const demoMessage = await supabaseService.createMessage({
      prospectId: demoProspect.id,
      campaignId: demoCampaign.id,
      channel: 'email',
      subject: 'Demo: Revolutionize Your Sales Process',
      content: 'Hi Demo,\n\nThis is a test message from ARTEMIS.',
      status: 'draft'
    });
    
    res.json({
      success: true,
      message: 'Demo flow completed successfully',
      results: {
        prospect: demoProspect,
        enrichment: enrichmentData,
        scores,
        campaign: demoCampaign,
        message: demoMessage
      }
    });
  } catch (error) {
    logger.error('Demo flow failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Clean up demo data
 */
router.delete('/demo-cleanup', async (req, res) => {
  try {
    // Delete demo prospects
    await supabaseService.client
      .from('prospects')
      .delete()
      .eq('source', 'demo');
    
    // Delete demo campaigns
    await supabaseService.client
      .from('outreach_campaigns')
      .delete()
      .eq('created_by', 'demo');
    
    res.json({
      success: true,
      message: 'Demo data cleaned up successfully'
    });
  } catch (error) {
    logger.error('Demo cleanup failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
