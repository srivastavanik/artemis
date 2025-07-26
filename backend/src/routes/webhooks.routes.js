import express from 'express';
import arcadeService from '../services/arcade.service.js';
import brightDataService from '../services/brightdata.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Handle Arcade webhooks
 */
router.post('/arcade', async (req, res) => {
  try {
    const signature = req.headers['x-arcade-signature'];
    const event = {
      type: req.body.event_type,
      campaignId: req.body.campaign_id,
      prospectId: req.body.prospect_id,
      messageId: req.body.message_id,
      signature,
      payload: req.body,
      ...req.body
    };

    const result = await arcadeService.handleWebhook(event);
    
    res.json({ success: true, result });
  } catch (error) {
    logger.error('Arcade webhook processing failed', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * Handle BrightData webhooks
 */
router.post('/brightdata', async (req, res) => {
  try {
    const signature = req.headers['x-brightdata-signature'];
    
    // Validate signature
    if (!brightDataService.validateWebhookSignature(signature, req.body)) {
      throw new Error('Invalid webhook signature');
    }

    const { event_type, data } = req.body;
    
    // Handle different event types
    switch (event_type) {
      case 'profile_update':
        await handleProfileUpdate(data);
        break;
      case 'company_update':
        await handleCompanyUpdate(data);
        break;
      case 'scraping_complete':
        await handleScrapingComplete(data);
        break;
      default:
        logger.warn('Unknown BrightData webhook event', { event_type });
    }
    
    res.json({ success: true });
  } catch (error) {
    logger.error('BrightData webhook processing failed', { error: error.message });
    res.status(400).json({ error: error.message });
  }
});

/**
 * Handle Google OAuth callback
 */
router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    if (!code) {
      throw new Error('No authorization code provided');
    }
    
    // Exchange code for tokens
    const { OAuth2Client } = await import('google-auth-library');
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Store refresh token securely (in production, encrypt this)
    // For now, we'll store it in the session
    req.session = req.session || {};
    req.session.googleTokens = tokens;
    
    // Initialize Arcade email transporter with the refresh token
    if (tokens.refresh_token) {
      await arcadeService.initializeEmailTransporter(tokens.refresh_token);
    }
    
    // Redirect to success page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?auth=success`);
  } catch (error) {
    logger.error('Google OAuth callback failed', { error: error.message });
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/settings?auth=failed&error=${encodeURIComponent(error.message)}`);
  }
});

/**
 * Helper functions for BrightData webhook handling
 */
async function handleProfileUpdate(data) {
  try {
    const { prospect_id, updated_fields } = data;
    
    // Update prospect in database
    const { default: supabaseService } = await import('../services/supabase.service.js');
    
    await supabaseService.client
      .from('enrichment_data')
      .update({
        professional: updated_fields.professional || {},
        social: updated_fields.social || {},
        behavioral: updated_fields.behavioral || {},
        last_updated: new Date().toISOString()
      })
      .eq('prospect_id', prospect_id);
      
    logger.info('Profile updated via webhook', { prospect_id });
  } catch (error) {
    logger.error('Profile update webhook handler failed', { error: error.message });
  }
}

async function handleCompanyUpdate(data) {
  try {
    const { company_domain, signals } = data;
    
    // Find prospects from this company
    const { default: supabaseService } = await import('../services/supabase.service.js');
    
    const { data: prospects } = await supabaseService.client
      .from('prospects')
      .select('id')
      .eq('company_domain', company_domain);
      
    // Update enrichment data for all prospects from this company
    if (prospects && prospects.length > 0) {
      const prospectIds = prospects.map(p => p.id);
      
      await supabaseService.client
        .from('enrichment_data')
        .update({
          company_signals: signals,
          last_updated: new Date().toISOString()
        })
        .in('prospect_id', prospectIds);
        
      logger.info('Company signals updated', { company_domain, affected_prospects: prospectIds.length });
    }
  } catch (error) {
    logger.error('Company update webhook handler failed', { error: error.message });
  }
}

async function handleScrapingComplete(data) {
  try {
    const { request_id, results, status } = data;
    
    if (status === 'success' && results) {
      // Process the scraping results
      logger.info('Scraping completed', { request_id, result_count: results.length });
      
      // You can trigger additional processing here
      // For example, run the enrichment workflow for the scraped data
    } else {
      logger.error('Scraping failed', { request_id, status });
    }
  } catch (error) {
    logger.error('Scraping complete webhook handler failed', { error: error.message });
  }
}

export default router;
