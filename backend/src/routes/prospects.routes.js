import express from 'express';
import { z } from 'zod';
import scoutAgent from '../agents/scout.agent.js';
import analystAgent from '../agents/analyst.agent.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Validation schemas
const searchProspectsSchema = z.object({
  company: z.string().optional(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  linkedinUrl: z.string().url().optional(),
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  minScore: z.number().min(0).max(1).optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional()
});

const createProspectSchema = z.object({
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  jobTitle: z.string().optional(),
  companyName: z.string().optional(),
  companyDomain: z.string().optional(),
  linkedinUrl: z.string().url().optional(),
  phone: z.string().optional(),
  location: z.string().optional()
});

/**
 * Search prospects
 * GET /api/prospects
 */
router.get('/', async (req, res) => {
  try {
    // Demo data for showcase
    const demoProspects = [
      {
        id: '1',
        name: 'Sarah Chen',
        email: 'sarah.chen@techcorp.com',
        title: 'VP of Sales',
        company: 'TechCorp Solutions',
        industry: 'Software',
        location: 'San Francisco, CA',
        engagement_score: 92,
        intent: 'High',
        status: 'active',
        linkedin_url: 'https://linkedin.com/in/sarahchen',
        created_at: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Michael Rodriguez',
        email: 'm.rodriguez@growthd.com',
        title: 'Head of Revenue',
        company: 'Growth Dynamics',
        industry: 'SaaS',
        location: 'Austin, TX',
        engagement_score: 88,
        intent: 'Medium',
        status: 'active',
        linkedin_url: 'https://linkedin.com/in/mrodriguez',
        created_at: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Emily Watson',
        email: 'emily.w@innovlabs.io',
        title: 'Sales Director',
        company: 'Innovation Labs',
        industry: 'AI/ML',
        location: 'New York, NY',
        engagement_score: 95,
        intent: 'High',
        status: 'active',
        linkedin_url: 'https://linkedin.com/in/emilywatson',
        created_at: new Date().toISOString()
      },
      {
        id: '4',
        name: 'David Kim',
        email: 'dkim@dataflow.com',
        title: 'Chief Revenue Officer',
        company: 'DataFlow Systems',
        industry: 'Data Analytics',
        location: 'Seattle, WA',
        engagement_score: 78,
        intent: 'Medium',
        status: 'active',
        linkedin_url: 'https://linkedin.com/in/davidkim',
        created_at: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Lisa Thompson',
        email: 'lisa.t@cloudnet.co',
        title: 'VP Sales Operations',
        company: 'CloudNet Solutions',
        industry: 'Cloud Infrastructure',
        location: 'Denver, CO',
        engagement_score: 85,
        intent: 'High',
        status: 'active',
        linkedin_url: 'https://linkedin.com/in/lisathompson',
        created_at: new Date().toISOString()
      }
    ];
    
    // Check if Supabase is configured
    if (!supabaseService.client) {
      return res.json({
        success: true,
        data: demoProspects,
        pagination: {
          total: demoProspects.length,
          limit: 10,
          offset: 0
        }
      });
    }
    
    const query = searchProspectsSchema.parse(req.query);
    const results = await supabaseService.searchProspects(query);
    
    res.json({
      success: true,
      data: results.data || demoProspects,
      pagination: {
        total: results.total || demoProspects.length,
        limit: results.limit || 10,
        offset: results.offset || 0
      }
    });
  } catch (error) {
    logger.error('Prospect search failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * Get prospect by ID
 * GET /api/prospects/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const prospect = await supabaseService.getProspectById(req.params.id);
    
    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: 'Prospect not found'
      });
    }
    
    // Get enrichment data
    const enrichmentData = await supabaseService.getEnrichmentData(prospect.id);
    
    // Get latest scores
    const scores = await supabaseService.getLatestScores(prospect.id);
    
    res.json({
      success: true,
      data: {
        ...prospect,
        enrichmentData,
        scores
      }
    });
  } catch (error) {
    logger.error('Prospect fetch failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch prospect'
    });
  }
});

/**
 * Create new prospect
 * POST /api/prospects
 */
router.post('/', async (req, res) => {
  try {
    const prospectData = createProspectSchema.parse(req.body);
    const prospect = await supabaseService.createProspect(prospectData);
    
    res.status(201).json({
      success: true,
      data: prospect
    });
  } catch (error) {
    logger.error('Prospect creation failed', { error: error.message });
    res.status(400).json({
      success: false,
      error: error instanceof z.ZodError ? error.errors : error.message
    });
  }
});

/**
 * Discover prospects using Scout agent
 * POST /api/prospects/discover
 */
router.post('/discover', async (req, res) => {
  try {
    const searchCriteria = req.body;
    
    // Start discovery process
    const prospects = await scoutAgent.discoverProspects(searchCriteria);
    
    res.json({
      success: true,
      data: prospects,
      message: `Discovered ${prospects.length} prospects`
    });
  } catch (error) {
    logger.error('Prospect discovery failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Discovery process failed'
    });
  }
});

/**
 * Enrich prospect
 * POST /api/prospects/:id/enrich
 */
router.post('/:id/enrich', async (req, res) => {
  try {
    const prospectId = req.params.id;
    
    // Check if prospect exists
    const prospect = await supabaseService.getProspectById(prospectId);
    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: 'Prospect not found'
      });
    }
    
    // Enrich using Scout agent
    const enrichmentData = await scoutAgent.enrichProspect(prospectId);
    
    res.json({
      success: true,
      data: enrichmentData,
      message: 'Prospect enriched successfully'
    });
  } catch (error) {
    logger.error('Prospect enrichment failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Enrichment process failed'
    });
  }
});

/**
 * Analyze prospect
 * POST /api/prospects/:id/analyze
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const prospectId = req.params.id;
    
    // Check if prospect exists
    const prospect = await supabaseService.getProspectById(prospectId);
    if (!prospect) {
      return res.status(404).json({
        success: false,
        error: 'Prospect not found'
      });
    }
    
    // Analyze using Analyst agent
    const analysis = await analystAgent.analyzeProspect(prospectId);
    
    res.json({
      success: true,
      data: analysis,
      message: 'Prospect analyzed successfully'
    });
  } catch (error) {
    logger.error('Prospect analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Analysis process failed'
    });
  }
});

/**
 * Batch analyze prospects
 * POST /api/prospects/analyze/batch
 */
router.post('/analyze/batch', async (req, res) => {
  try {
    const { prospectIds } = req.body;
    
    if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid prospect IDs'
      });
    }
    
    // Start batch analysis
    const results = await analystAgent.batchAnalyzeProspects(prospectIds);
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    });
  } catch (error) {
    logger.error('Batch analysis failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Batch analysis failed'
    });
  }
});

/**
 * Get prospect engagement history
 * GET /api/prospects/:id/interactions
 */
router.get('/:id/interactions', async (req, res) => {
  try {
    const prospectId = req.params.id;
    
    const { data: interactions } = await supabaseService.client
      .from('interactions')
      .select('*')
      .eq('prospect_id', prospectId)
      .order('occurred_at', { ascending: false });
    
    res.json({
      success: true,
      data: interactions
    });
  } catch (error) {
    logger.error('Failed to fetch interactions', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch interactions'
    });
  }
});

export default router;
