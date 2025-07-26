import { Workflow } from '@mastra/core';
import scoutAgent from '../agents/scout.agent.js';
import analystAgent from '../agents/analyst.agent.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

class EnrichmentWorkflow extends Workflow {
  constructor() {
    super('enrichment-workflow');
    this.name = 'Prospect Enrichment Workflow';
    this.description = 'Orchestrates comprehensive prospect enrichment across multiple data sources';
  }

  /**
   * Main enrichment workflow
   */
  async run(prospectId, options = {}) {
    const startTime = Date.now();
    const workflowId = `enrich-${prospectId}-${Date.now()}`;
    
    logger.info('Starting enrichment workflow', {
      workflowId,
      prospectId,
      options
    });

    try {
      // Step 1: Get prospect data
      const prospect = await this.getProspect(prospectId);
      if (!prospect) {
        throw new Error('Prospect not found');
      }

      // Step 2: Determine enrichment strategy
      const strategy = await this.determineStrategy(prospect, options);
      
      // Step 3: Execute parallel enrichment
      const enrichmentResults = await this.executeParallelEnrichment(
        prospect,
        strategy
      );

      // Step 4: Analyze enriched data
      const analysis = await this.analyzeEnrichedData(
        prospectId,
        enrichmentResults
      );

      // Step 5: Update prospect records
      await this.updateProspectRecords(
        prospectId,
        enrichmentResults,
        analysis
      );

      // Step 6: Calculate new scores
      const scores = await this.calculateScores(prospectId);

      const duration = Date.now() - startTime;
      
      logger.info('Enrichment workflow completed', {
        workflowId,
        prospectId,
        duration
      });

      return {
        success: true,
        workflowId,
        prospectId,
        enrichmentResults,
        analysis,
        scores,
        duration
      };

    } catch (error) {
      logger.error('Enrichment workflow failed', {
        workflowId,
        prospectId,
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Get prospect data
   */
  async getProspect(prospectId) {
    return await supabaseService.getProspectById(prospectId);
  }

  /**
   * Determine enrichment strategy based on available data
   */
  async determineStrategy(prospect, options) {
    const strategy = {
      sources: [],
      priorities: {},
      depth: options.depth || 'comprehensive'
    };

    // If we have email, prioritize finding social profiles
    if (prospect.email) {
      strategy.sources.push('social_profiles');
      strategy.priorities.social_profiles = 1;
    }

    // If we have LinkedIn, prioritize finding contact info
    if (prospect.linkedin_url) {
      strategy.sources.push('contact_info');
      strategy.priorities.contact_info = 1;
    }

    // If we have company, add company research
    if (prospect.company_name || prospect.company_domain) {
      strategy.sources.push('company_info');
      strategy.priorities.company_info = 2;
    }

    // Always include web presence and activity
    strategy.sources.push('web_presence', 'recent_activity');
    strategy.priorities.web_presence = 3;
    strategy.priorities.recent_activity = 3;

    // Add trigger events if comprehensive
    if (strategy.depth === 'comprehensive') {
      strategy.sources.push('trigger_events', 'technology_stack');
      strategy.priorities.trigger_events = 4;
      strategy.priorities.technology_stack = 4;
    }

    return strategy;
  }

  /**
   * Execute parallel enrichment across multiple sources
   */
  async executeParallelEnrichment(prospect, strategy) {
    const enrichmentTasks = strategy.sources.map(source => {
      return this.enrichFromSource(prospect, source);
    });

    // Execute all enrichment tasks in parallel
    const results = await Promise.allSettled(enrichmentTasks);

    // Process results
    const enrichmentData = {};
    results.forEach((result, index) => {
      const source = strategy.sources[index];
      if (result.status === 'fulfilled') {
        enrichmentData[source] = result.value;
      } else {
        logger.warn('Enrichment source failed', {
          source,
          error: result.reason.message
        });
        enrichmentData[source] = null;
      }
    });

    return enrichmentData;
  }

  /**
   * Enrich from specific source
   */
  async enrichFromSource(prospect, source) {
    switch (source) {
      case 'social_profiles':
        return await scoutAgent.findSocialProfiles(prospect);
      
      case 'contact_info':
        return await scoutAgent.findContactInfo(prospect);
      
      case 'company_info':
        return await scoutAgent.researchCompany(prospect);
      
      case 'web_presence':
        return await scoutAgent.findWebPresence(prospect);
      
      case 'recent_activity':
        return await scoutAgent.findRecentActivity(prospect);
      
      case 'trigger_events':
        return await scoutAgent.findTriggerEvents(prospect);
      
      case 'technology_stack':
        return await scoutAgent.findTechnologyStack(prospect);
      
      default:
        throw new Error(`Unknown enrichment source: ${source}`);
    }
  }

  /**
   * Analyze enriched data for insights
   */
  async analyzeEnrichedData(prospectId, enrichmentData) {
    // Prepare data for analysis
    const analysisData = {
      prospectId,
      enrichmentData,
      timestamp: new Date().toISOString()
    };

    // Get comprehensive analysis
    const analysis = await analystAgent.analyzeEnrichmentData(analysisData);

    return analysis;
  }

  /**
   * Update prospect records with enriched data
   */
  async updateProspectRecords(prospectId, enrichmentData, analysis) {
    // Store raw enrichment data
    await supabaseService.storeEnrichmentData(prospectId, enrichmentData);

    // Update prospect profile with key fields
    const profileUpdates = this.extractProfileUpdates(enrichmentData);
    if (Object.keys(profileUpdates).length > 0) {
      await supabaseService.updateProspect(prospectId, profileUpdates);
    }

    // Store analysis insights
    if (analysis.insights) {
      await supabaseService.storeInsights(prospectId, analysis.insights);
    }
  }

  /**
   * Extract profile updates from enrichment data
   */
  extractProfileUpdates(enrichmentData) {
    const updates = {};

    // Extract contact info updates
    if (enrichmentData.contact_info) {
      if (enrichmentData.contact_info.email && !updates.email) {
        updates.email = enrichmentData.contact_info.email;
      }
      if (enrichmentData.contact_info.phone && !updates.phone) {
        updates.phone = enrichmentData.contact_info.phone;
      }
      if (enrichmentData.contact_info.location) {
        updates.location = enrichmentData.contact_info.location;
      }
    }

    // Extract social profile updates
    if (enrichmentData.social_profiles) {
      if (enrichmentData.social_profiles.linkedin && !updates.linkedin_url) {
        updates.linkedin_url = enrichmentData.social_profiles.linkedin;
      }
      if (enrichmentData.social_profiles.twitter) {
        updates.twitter_url = enrichmentData.social_profiles.twitter;
      }
    }

    // Extract company updates
    if (enrichmentData.company_info) {
      if (enrichmentData.company_info.name && !updates.company_name) {
        updates.company_name = enrichmentData.company_info.name;
      }
      if (enrichmentData.company_info.domain && !updates.company_domain) {
        updates.company_domain = enrichmentData.company_info.domain;
      }
      if (enrichmentData.company_info.industry) {
        updates.industry = enrichmentData.company_info.industry;
      }
    }

    return updates;
  }

  /**
   * Calculate new scores based on enriched data
   */
  async calculateScores(prospectId) {
    return await analystAgent.analyzeProspect(prospectId);
  }

  /**
   * Cache management for enrichment data
   */
  async getCachedEnrichment(prospectId, source) {
    const cacheKey = `enrichment:${prospectId}:${source}`;
    const cached = await supabaseService.getCache(cacheKey);
    
    if (cached && this.isCacheFresh(cached)) {
      return cached.data;
    }
    
    return null;
  }

  async setCachedEnrichment(prospectId, source, data) {
    const cacheKey = `enrichment:${prospectId}:${source}`;
    const ttl = this.getCacheTTL(source);
    
    await supabaseService.setCache(cacheKey, data, ttl);
  }

  isCacheFresh(cached) {
    const now = Date.now();
    const age = now - new Date(cached.timestamp).getTime();
    return age < cached.ttl;
  }

  getCacheTTL(source) {
    const ttlMap = {
      social_profiles: 7 * 24 * 60 * 60 * 1000, // 7 days
      contact_info: 30 * 24 * 60 * 60 * 1000, // 30 days
      company_info: 7 * 24 * 60 * 60 * 1000, // 7 days
      web_presence: 24 * 60 * 60 * 1000, // 1 day
      recent_activity: 6 * 60 * 60 * 1000, // 6 hours
      trigger_events: 12 * 60 * 60 * 1000, // 12 hours
      technology_stack: 14 * 24 * 60 * 60 * 1000 // 14 days
    };
    
    return ttlMap[source] || 24 * 60 * 60 * 1000; // Default 1 day
  }
}

export default new EnrichmentWorkflow();
