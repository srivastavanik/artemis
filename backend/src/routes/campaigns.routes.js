import express from 'express';
import { z } from 'zod';
import strategistAgent from '../agents/strategist.agent.js';
import executorAgent from '../agents/executor.agent.js';
import analystAgent from '../agents/analyst.agent.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const createCampaignSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  prospectIds: z.array(z.string()).min(1),
  goals: z.object({
    urgency: z.enum(['low', 'medium', 'high']).optional(),
    focus: z.enum(['awareness', 'engagement', 'conversion']).optional()
  }).optional()
});

const executeCampaignSchema = z.object({
  campaignId: z.string(),
  autoStart: z.boolean().optional()
});

/**
 * Get all campaigns
 * GET /api/campaigns
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    
    // Check if Supabase is configured
    if (!supabaseService.client) {
      // Return demo data when Supabase is not configured
      return res.json({
        success: true,
        data: [
          {
            id: '1',
            name: 'Q1 Enterprise Outreach',
            description: 'Target enterprise accounts with personalized campaigns',
            channels: ['email', 'linkedin'],
            status: 'active',
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            prospects_count: 45,
            messages_sent: 234,
            open_rate: 68,
            reply_rate: 22
          },
          {
            id: '2',
            name: 'Product Launch Campaign',
            description: 'Announce new features to existing prospects',
            channels: ['email'],
            status: 'draft',
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            prospects_count: 128,
            messages_sent: 0,
            open_rate: 0,
            reply_rate: 0
          },
          {
            id: '3',
            name: 'Re-engagement Series',
            description: 'Win back cold prospects with new value prop',
            channels: ['email', 'linkedin'],
            status: 'completed',
            created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            prospects_count: 67,
            messages_sent: 189,
            open_rate: 45,
            reply_rate: 18
          },
          {
            id: '4',
            name: 'Summer Special Promotion',
            description: 'Limited time offer for qualified leads',
            channels: ['email'],
            status: 'active',
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            prospects_count: 89,
            messages_sent: 156,
            open_rate: 72,
            reply_rate: 35
          }
        ],
        pagination: {
          total: 4,
          limit,
          offset
        }
      });
    }
    
    let query = supabaseService.client
      .from('outreach_campaigns')
      .select('*, campaign_assignments(count)', { count: 'exact' });
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: campaigns, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    // Transform data to include prospects_count
    const transformedCampaigns = campaigns.map(campaign => ({
      ...campaign,
      prospects_count: campaign.campaign_assignments?.[0]?.count || 0,
      campaign_assignments: undefined
    }));
    
    res.json({
      success: true,
      data: transformedCampaigns,
      pagination: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Failed to fetch campaigns', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
});

/**
 * Get campaign by ID
 * GET /api/campaigns/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Get campaign with prospects
    const { data: campaign, error } = await supabaseService.client
      .from('outreach_campaigns')
      .select(`
        *,
        prospects:campaign_prospects(
          prospect:prospects(*)
        )
      `)
      .eq('id', campaignId)
      .single();
    
    if (error || !campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    // Get campaign analytics
    const analytics = await supabaseService.getCampaignAnalytics(campaignId);
    
    res.json({
      success: true,
      data: {
        ...campaign,
        analytics
      }
    });
  } catch (error) {
    logger.error('Failed to fetch campaign', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign'
    });
  }
});

/**
 * Create new campaign
 * POST /api/campaigns
 */
router.post('/', async (req, res) => {
  try {
    const campaignData = createCampaignSchema.parse(req.body);
    
    // Get prospects
    const prospects = await Promise.all(
      campaignData.prospectIds.map(id => 
        supabaseService.getProspectById(id)
      )
    );
    
    // Filter out null prospects
    const validProspects = prospects.filter(p => p !== null);
    
    if (validProspects.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid prospects found'
      });
    }
    
    // Design campaign strategy using Strategist agent
    const strategy = await strategistAgent.designCampaignStrategy(
      validProspects,
      campaignData.goals
    );
    
    // Store campaign
    const campaign = await supabaseService.createCampaign({
      name: campaignData.name,
      description: campaignData.description,
      strategy,
      status: 'draft'
    });
    
    res.status(201).json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    logger.error('Campaign creation failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * Execute campaign
 * POST /api/campaigns/execute
 */
router.post('/execute', async (req, res) => {
  try {
    const { campaignId, autoStart = false } = executeCampaignSchema.parse(req.body);
    
    // Get campaign
    const { data: campaign, error } = await supabaseService.client
      .from('outreach_campaigns')
      .select(`
        *,
        prospects:campaign_prospects(
          prospect:prospects(*)
        )
      `)
      .eq('id', campaignId)
      .single();
    
    if (error || !campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }
    
    if (campaign.status === 'active') {
      return res.status(400).json({
        success: false,
        error: 'Campaign is already active'
      });
    }
    
    // Extract prospects from the joined data
    const prospects = campaign.prospects.map(cp => cp.prospect);
    
    // Execute campaign using Executor agent
    const executionResult = await executorAgent.executeCampaign(
      campaign,
      prospects
    );
    
    // Update campaign status
    await supabaseService.client
      .from('outreach_campaigns')
      .update({ 
        status: 'active',
        started_at: new Date().toISOString()
      })
      .eq('id', campaignId);
    
    res.json({
      success: true,
      data: executionResult,
      message: 'Campaign execution started'
    });
  } catch (error) {
    logger.error('Campaign execution failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Campaign execution failed'
    });
  }
});

/**
 * Get campaign progress
 * GET /api/campaigns/:id/progress
 */
router.get('/:id/progress', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const progress = await executorAgent.monitorCampaignProgress(campaignId);
    
    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Failed to fetch campaign progress', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch campaign progress'
    });
  }
});

/**
 * Pause campaign
 * POST /api/campaigns/:id/pause
 */
router.post('/:id/pause', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const result = await executorAgent.pauseCampaign(campaignId);
    
    res.json({
      success: true,
      data: result,
      message: 'Campaign paused successfully'
    });
  } catch (error) {
    logger.error('Failed to pause campaign', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to pause campaign'
    });
  }
});

/**
 * Resume campaign
 * POST /api/campaigns/:id/resume
 */
router.post('/:id/resume', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const result = await executorAgent.resumeCampaign(campaignId);
    
    res.json({
      success: true,
      data: result,
      message: 'Campaign resumed successfully'
    });
  } catch (error) {
    logger.error('Failed to resume campaign', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to resume campaign'
    });
  }
});

/**
 * Analyze campaign performance
 * POST /api/campaigns/:id/analyze
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    const analysis = await analystAgent.analyzeCampaignPerformance(campaignId);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Campaign analyzed successfully'
    });
  } catch (error) {
    logger.error('Campaign analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Analysis failed'
    });
  }
});

/**
 * Optimize campaign
 * POST /api/campaigns/:id/optimize
 */
router.post('/:id/optimize', async (req, res) => {
  try {
    const campaignId = req.params.id;
    
    // Get campaign performance data
    const analytics = await supabaseService.getCampaignAnalytics(campaignId);
    
    // Optimize using Strategist agent
    const optimization = await strategistAgent.optimizeCampaign(
      campaignId,
      analytics
    );
    
    res.json({
      success: true,
      data: optimization,
      message: 'Campaign optimization complete'
    });
  } catch (error) {
    logger.error('Campaign optimization failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Optimization failed'
    });
  }
});

/**
 * Get campaign messages
 * GET /api/campaigns/:id/messages
 */
router.get('/:id/messages', async (req, res) => {
  try {
    const campaignId = req.params.id;
    const { status, limit = 50, offset = 0 } = req.query;
    
    let query = supabaseService.client
      .from('messages')
      .select(`
        *,
        prospect:prospects(*)
      `, { count: 'exact' })
      .eq('campaign_id', campaignId);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data: messages, error, count } = await query
      .order('scheduled_for', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    res.json({
      success: true,
      data: messages,
      pagination: {
        total: count,
        limit,
        offset
      }
    });
  } catch (error) {
    logger.error('Failed to fetch campaign messages', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch messages'
    });
  }
});

export default router;
