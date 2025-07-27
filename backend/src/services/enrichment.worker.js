import supabaseService from './supabase.service.js';
import scoutAgent from '../agents/scout.agent.js';
import { logger } from '../utils/logger.js';

class EnrichmentWorker {
  constructor() {
    this.batchSize = 10; // Process 10 prospects at a time
    this.rateLimitDelay = 2000; // 2 seconds between API calls
    this.processing = false;
  }
  
  /**
   * Run scheduled enrichment
   */
  async runScheduledEnrichment() {
    if (this.processing) {
      logger.warn('Enrichment worker is already processing');
      return;
    }
    
    this.processing = true;
    const startTime = Date.now();
    
    try {
      logger.info('Scheduled enrichment starting');
      
      // Get prospects that need enrichment
      const prospectsToEnrich = await this.getProspectsForEnrichment();
      
      if (prospectsToEnrich.length === 0) {
        logger.info('No prospects need enrichment');
        return {
          total: 0,
          successful: 0,
          failed: 0
        };
      }
      
      logger.info('Found prospects for enrichment', {
        count: prospectsToEnrich.length
      });
      
      const results = {
        total: prospectsToEnrich.length,
        successful: 0,
        failed: 0,
        details: []
      };
      
      // Process in batches with rate limiting
      for (let i = 0; i < prospectsToEnrich.length; i += this.batchSize) {
        const batch = prospectsToEnrich.slice(i, i + this.batchSize);
        
        logger.info('Processing enrichment batch', {
          batchNumber: Math.floor(i / this.batchSize) + 1,
          batchSize: batch.length
        });
        
        for (const prospect of batch) {
          const enrichResult = await this.enrichSingleProspect(prospect);
          
          if (enrichResult.success) {
            results.successful++;
          } else {
            results.failed++;
          }
          
          results.details.push(enrichResult);
          
          // Rate limiting delay
          if (i < prospectsToEnrich.length - 1) {
            await this.delay(this.rateLimitDelay);
          }
        }
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('Scheduled enrichment completed', {
        ...results,
        duration,
        durationMinutes: (duration / 60000).toFixed(2)
      });
      
      return results;
    } catch (error) {
      logger.error('Scheduled enrichment failed', { error: error.message });
      throw error;
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Get prospects that need enrichment
   */
  async getProspectsForEnrichment() {
    try {
      if (!supabaseService.client) {
        return [];
      }
      
      // Query for prospects that need enrichment
      // Criteria: never enriched OR enriched more than 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data, error } = await supabaseService.client
        .from('prospects')
        .select('id, email, first_name, last_name, company_name, last_enriched_at')
        .or(`last_enriched_at.is.null,last_enriched_at.lt.${sevenDaysAgo.toISOString()}`)
        .order('last_enriched_at', { ascending: true, nullsFirst: true })
        .limit(100); // Limit to prevent overwhelming the system
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      logger.error('Failed to get prospects for enrichment', {
        error: error.message
      });
      return [];
    }
  }
  
  /**
   * Enrich a single prospect
   */
  async enrichSingleProspect(prospect) {
    const startTime = Date.now();
    
    try {
      logger.debug('Enriching prospect', {
        prospectId: prospect.id,
        email: prospect.email
      });
      
      // Use Scout agent to enrich
      const enrichmentData = await scoutAgent.enrichProspect(prospect.id);
      
      const duration = Date.now() - startTime;
      
      logger.info('Prospect enriched successfully', {
        prospectId: prospect.id,
        duration,
        sourcesEnriched: Object.keys(enrichmentData || {}).length
      });
      
      return {
        prospectId: prospect.id,
        success: true,
        duration,
        sourcesEnriched: Object.keys(enrichmentData || {})
      };
    } catch (error) {
      logger.error('Failed to enrich prospect', {
        prospectId: prospect.id,
        error: error.message
      });
      
      return {
        prospectId: prospect.id,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Check enrichment health
   */
  async checkEnrichmentHealth() {
    try {
      if (!supabaseService.client) {
        return { healthy: false, reason: 'No database connection' };
      }
      
      // Get enrichment statistics
      const { data: recentEnrichments, error } = await supabaseService.client
        .from('enrichment_data')
        .select('source, fetched_at')
        .gte('fetched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('fetched_at', { ascending: false });
      
      if (error) throw error;
      
      // Check if enrichments are happening
      const enrichmentsBySource = {};
      for (const enrichment of recentEnrichments || []) {
        enrichmentsBySource[enrichment.source] = 
          (enrichmentsBySource[enrichment.source] || 0) + 1;
      }
      
      const totalRecent = recentEnrichments?.length || 0;
      
      return {
        healthy: totalRecent > 0,
        statistics: {
          last24Hours: totalRecent,
          bySource: enrichmentsBySource
        }
      };
    } catch (error) {
      logger.error('Failed to check enrichment health', {
        error: error.message
      });
      
      return {
        healthy: false,
        error: error.message
      };
    }
  }
  
  /**
   * Get enrichment statistics
   */
  async getEnrichmentStats() {
    try {
      if (!supabaseService.client) {
        return null;
      }
      
      // Get total prospects
      const { count: totalProspects } = await supabaseService.client
        .from('prospects')
        .select('id', { count: 'exact', head: true });
      
      // Get enriched prospects
      const { count: enrichedProspects } = await supabaseService.client
        .from('prospects')
        .select('id', { count: 'exact', head: true })
        .not('last_enriched_at', 'is', null);
      
      // Get prospects needing enrichment
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: needsEnrichment } = await supabaseService.client
        .from('prospects')
        .select('id', { count: 'exact', head: true })
        .or(`last_enriched_at.is.null,last_enriched_at.lt.${sevenDaysAgo.toISOString()}`);
      
      // Get enrichment data statistics
      const { data: enrichmentSources } = await supabaseService.client
        .from('enrichment_data')
        .select('source');
      
      const sourceCount = {};
      for (const record of enrichmentSources || []) {
        sourceCount[record.source] = (sourceCount[record.source] || 0) + 1;
      }
      
      return {
        prospects: {
          total: totalProspects || 0,
          enriched: enrichedProspects || 0,
          needsEnrichment: needsEnrichment || 0,
          enrichmentRate: totalProspects 
            ? ((enrichedProspects || 0) / totalProspects * 100).toFixed(1) + '%'
            : '0%'
        },
        enrichmentData: {
          totalRecords: enrichmentSources?.length || 0,
          bySource: sourceCount
        }
      };
    } catch (error) {
      logger.error('Failed to get enrichment stats', {
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Manually trigger enrichment for specific prospects
   */
  async enrichProspectsBatch(prospectIds) {
    if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
      throw new Error('Invalid prospect IDs');
    }
    
    const results = {
      total: prospectIds.length,
      successful: 0,
      failed: 0,
      details: []
    };
    
    for (const prospectId of prospectIds) {
      try {
        // Get prospect details
        const prospect = await supabaseService.getProspectById(prospectId);
        if (!prospect) {
          results.failed++;
          results.details.push({
            prospectId,
            success: false,
            error: 'Prospect not found'
          });
          continue;
        }
        
        // Enrich
        const enrichResult = await this.enrichSingleProspect(prospect);
        
        if (enrichResult.success) {
          results.successful++;
        } else {
          results.failed++;
        }
        
        results.details.push(enrichResult);
        
        // Rate limiting
        await this.delay(this.rateLimitDelay);
      } catch (error) {
        logger.error('Failed to enrich prospect in batch', {
          prospectId,
          error: error.message
        });
        
        results.failed++;
        results.details.push({
          prospectId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new EnrichmentWorker();
