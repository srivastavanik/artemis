import brightDataService from '../services/brightdata.service.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

class ScoutAgent {
  constructor() {
    this.name = 'scout';
  }

  /**
   * Discover prospects based on search criteria
   */
  async discoverProspects(searchCriteria) {
    const startTime = Date.now();
    
    try {
      logger.info('Scout agent starting prospect discovery', { searchCriteria });
      
      const results = [];
      
      // Search by company if provided
      if (searchCriteria.company) {
        const companyProspects = await this.searchByCompany(searchCriteria);
        results.push(...companyProspects);
      }
      
      // Search by individual criteria
      if (searchCriteria.name || searchCriteria.email || searchCriteria.linkedinUrl) {
        const individualProspect = await this.searchIndividual(searchCriteria);
        if (individualProspect) results.push(individualProspect);
      }
      
      // Search by job title and industry
      if (searchCriteria.jobTitle || searchCriteria.industry) {
        const roleProspects = await this.searchByRole(searchCriteria);
        results.push(...roleProspects);
      }
      
      // Remove duplicates
      const uniqueProspects = this.deduplicateProspects(results);
      
      // Save to database
      const savedProspects = await this.saveProspects(uniqueProspects);
      
      // Set up monitoring for high-value prospects
      await this.setupMonitoring(savedProspects);
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'discover_prospects',
        input: searchCriteria,
        output: { count: savedProspects.length },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return savedProspects;
    } catch (error) {
      logger.error('Scout agent discovery failed', { error: error.message });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'discover_prospects',
        input: searchCriteria,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Enrich existing prospect with additional data
   */
  async enrichProspect(prospectId) {
    const startTime = Date.now();
    
    try {
      logger.info('Scout agent enriching prospect', { prospectId });
      
      // Get current prospect data
      const prospect = await supabaseService.getProspectById(prospectId);
      if (!prospect) throw new Error('Prospect not found');
      
      // Check if enrichment is needed
      const existingEnrichment = await supabaseService.getEnrichmentData(prospectId);
      if (this.isEnrichmentFresh(existingEnrichment)) {
        logger.info('Prospect enrichment is fresh, skipping', { prospectId });
        return existingEnrichment;
      }
      
      // Gather enrichment data from multiple sources
      const enrichmentData = await this.gatherEnrichmentData(prospect);
      
      // Store enrichment data
      const stored = await this.storeEnrichmentData(prospectId, enrichmentData);
      
      // Update prospect with any new primary data
      await this.updateProspectPrimaryData(prospectId, enrichmentData);
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'enrich_prospect',
        prospectId,
        output: { sources: Object.keys(enrichmentData) },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return enrichmentData;
    } catch (error) {
      logger.error('Scout agent enrichment failed', { 
        prospectId, 
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'enrich_prospect',
        prospectId,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Monitor prospects for trigger events
   */
  async monitorTriggerEvents() {
    try {
      logger.info('Scout agent checking for trigger events');
      
      // Get all prospects with active monitoring
      const prospects = await supabaseService.searchProspects({
        hasMonitoring: true
      });
      
      const events = [];
      
      for (const prospect of prospects.data) {
        try {
          const triggerEvents = await this.checkProspectTriggers(prospect);
          if (triggerEvents.length > 0) {
            events.push({
              prospectId: prospect.id,
              events: triggerEvents
            });
          }
        } catch (error) {
          logger.error('Failed to check triggers for prospect', {
            prospectId: prospect.id,
            error: error.message
          });
        }
      }
      
      // Process trigger events
      if (events.length > 0) {
        await this.processTriggerEvents(events);
      }
      
      return events;
    } catch (error) {
      logger.error('Scout agent monitoring failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Search by company
   */
  async searchByCompany(criteria) {
    try {
      // Get company information first
      const companyDomain = criteria.companyDomain || criteria.company;
      const companyInfo = await brightDataService.scrapeCompanyWebsite(
        companyDomain.includes('http') ? companyDomain : `https://${companyDomain}`
      );
      
      // Find key decision makers
      const searchParams = {
        company: companyInfo.basics.name,
        titles: criteria.targetTitles || [
          'VP Sales', 'Head of Sales', 'Sales Director',
          'VP Marketing', 'CMO', 'Head of Growth',
          'CEO', 'COO', 'Founder'
        ]
      };
      
      const prospects = [];
      
      for (const title of searchParams.titles) {
        try {
          const results = await brightDataService.searchPerson({
            company: searchParams.company,
            jobTitle: title
          });
          
          if (results && results.length > 0) {
            results.forEach(person => {
              prospects.push({
                ...this.transformBrightDataPerson(person),
                companyInfo
              });
            });
          }
        } catch (error) {
          logger.warn('Failed to find person with title', { 
            company: searchParams.company, 
            title 
          });
        }
      }
      
      return prospects;
    } catch (error) {
      logger.error('Company search failed', { error: error.message });
      return [];
    }
  }

  /**
   * Search for individual prospect
   */
  async searchIndividual(criteria) {
    try {
      const searchResult = await brightDataService.searchPerson({
        name: criteria.name,
        email: criteria.email,
        company: criteria.company,
        linkedinUrl: criteria.linkedinUrl
      });
      
      if (!searchResult) return null;
      
      return this.transformBrightDataPerson(searchResult);
    } catch (error) {
      logger.error('Individual search failed', { error: error.message });
      return null;
    }
  }

  /**
   * Search by role/industry
   */
  async searchByRole(criteria) {
    try {
      // This would typically integrate with more sophisticated search
      // For now, we'll implement basic role-based discovery
      const prospects = [];
      
      // Search for specific job titles in target industries
      if (criteria.jobTitle && criteria.industry) {
        const results = await brightDataService.searchPerson({
          jobTitle: criteria.jobTitle,
          industry: criteria.industry
        });
        
        if (results) {
          prospects.push(this.transformBrightDataPerson(results));
        }
      }
      
      return prospects;
    } catch (error) {
      logger.error('Role search failed', { error: error.message });
      return [];
    }
  }

  /**
   * Transform BrightData person to our prospect format
   */
  transformBrightDataPerson(brightDataPerson) {
    return {
      email: brightDataPerson.email,
      firstName: brightDataPerson.firstName,
      lastName: brightDataPerson.lastName,
      jobTitle: brightDataPerson.jobTitle,
      companyName: brightDataPerson.company,
      companyDomain: brightDataPerson.companyDomain,
      linkedinUrl: brightDataPerson.linkedinUrl,
      phone: brightDataPerson.phone,
      location: brightDataPerson.location,
      timezone: brightDataPerson.location, // Convert location to timezone later
      source: 'brightdata',
      enrichmentData: brightDataPerson
    };
  }

  /**
   * Deduplicate prospects
   */
  deduplicateProspects(prospects) {
    const seen = new Set();
    return prospects.filter(prospect => {
      const key = prospect.email || prospect.linkedinUrl;
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Save prospects to database
   */
  async saveProspects(prospects) {
    const saved = [];
    
    for (const prospect of prospects) {
      try {
        // Write to staging table for pipeline processing
        const stagingRecord = await supabaseService.createStagingRecord(
          prospect,
          'ai_discovery'
        );
        
        logger.info('Prospect added to staging', {
          stagingId: stagingRecord.id,
          email: prospect.email,
          source: 'ai_discovery'
        });
        
        saved.push({
          stagingId: stagingRecord.id,
          ...prospect
        });
      } catch (error) {
        logger.error('Failed to save prospect to staging', { 
          prospect, 
          error: error.message 
        });
      }
    }
    
    return saved;
  }

  /**
   * Set up monitoring for prospects
   */
  async setupMonitoring(prospects) {
    for (const prospect of prospects) {
      try {
        // Only monitor high-value prospects
        if (this.isHighValueProspect(prospect)) {
          const callbackUrl = `${process.env.API_URL || 'http://localhost:3001'}/api/webhooks/brightdata`;
          await brightDataService.setupWebhook(callbackUrl, [
            'profile_update',
            'company_update'
          ]);
          
          logger.info('Monitoring setup for prospect', { 
            prospectId: prospect.id 
          });
        }
      } catch (error) {
        logger.error('Failed to setup monitoring', { 
          prospectId: prospect.id,
          error: error.message 
        });
      }
    }
  }

  /**
   * Check if enrichment data is fresh
   */
  isEnrichmentFresh(enrichmentData) {
    if (!enrichmentData || enrichmentData.length === 0) return false;
    
    // Check if we have recent data from key sources
    const requiredSources = ['brightdata'];
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    for (const source of requiredSources) {
      const sourceData = enrichmentData.find(e => e.source === source);
      if (!sourceData) return false;
      
      const age = Date.now() - new Date(sourceData.fetched_at).getTime();
      if (age > maxAge) return false;
    }
    
    return true;
  }

  /**
   * Gather enrichment data from multiple sources
   */
  async gatherEnrichmentData(prospect) {
    const enrichmentData = {};
    
    // BrightData enrichment
    try {
      const brightData = await brightDataService.searchPerson({
        name: `${prospect.first_name} ${prospect.last_name}`,
        email: prospect.email,
        company: prospect.company_name,
        linkedinUrl: prospect.linkedin_url
      });
      
      if (brightData) {
        enrichmentData.brightdata = brightData;
      }
    } catch (error) {
      logger.error('BrightData enrichment failed', { error: error.message });
    }
    
    // Company enrichment
    if (prospect.company_domain) {
      try {
        const companyUrl = prospect.company_domain.includes('http') 
          ? prospect.company_domain 
          : `https://${prospect.company_domain}`;
        const companyData = await brightDataService.scrapeCompanyWebsite(companyUrl);
        
        if (companyData) {
          enrichmentData.company = companyData;
        }
      } catch (error) {
        logger.error('Company enrichment failed', { error: error.message });
      }
    }
    
    // Buying signals  
    if (prospect.company_domain) {
      try {
        const signals = await brightDataService.getCompanySignals(
          prospect.company_domain
        );
        
        if (signals && signals.length > 0) {
          enrichmentData.buyingSignals = signals;
        }
      } catch (error) {
        logger.error('Buying signals search failed', { error: error.message });
      }
    }
    
    return enrichmentData;
  }

  /**
   * Store enrichment data
   */
  async storeEnrichmentData(prospectId, enrichmentData) {
    const stored = [];
    
    for (const [source, data] of Object.entries(enrichmentData)) {
      try {
        const result = await supabaseService.storeEnrichmentData(
          prospectId,
          source,
          data
        );
        stored.push(result);
      } catch (error) {
        logger.error('Failed to store enrichment data', {
          prospectId,
          source,
          error: error.message
        });
      }
    }
    
    return stored;
  }

  /**
   * Update prospect with new primary data
   */
  async updateProspectPrimaryData(prospectId, enrichmentData) {
    // Extract primary data from enrichment
    const updates = {};
    
    if (enrichmentData.brightdata) {
      const bd = enrichmentData.brightdata;
      
      if (!updates.phone && bd.phone) {
        updates.phone = bd.phone;
      }
      if (!updates.timezone && bd.timezone) {
        updates.timezone = bd.timezone;
      }
      if (!updates.location && bd.location) {
        updates.location = bd.location;
      }
    }
    
    if (Object.keys(updates).length > 0) {
      // Would update prospect record here
      logger.info('Updated prospect primary data', { prospectId, updates });
    }
  }

  /**
   * Check if prospect is high-value
   */
  isHighValueProspect(prospect) {
    // Simple heuristic - can be made more sophisticated
    const highValueTitles = ['CEO', 'CTO', 'VP', 'Director', 'Head of'];
    const highValueCompanySizes = ['enterprise', 'large'];
    
    const hasHighValueTitle = highValueTitles.some(title => 
      prospect.job_title?.toLowerCase().includes(title.toLowerCase())
    );
    
    return hasHighValueTitle;
  }

  /**
   * Check prospect for trigger events
   */
  async checkProspectTriggers(prospect) {
    // This would integrate with BrightData's monitoring API
    // For now, return empty array
    return [];
  }

  /**
   * Process trigger events
   */
  async processTriggerEvents(events) {
    for (const { prospectId, events: triggerEvents } of events) {
      for (const event of triggerEvents) {
        try {
          await supabaseService.recordInteraction({
            prospectId,
            type: `trigger_${event.type}`,
            channel: 'monitoring',
            data: event,
            occurredAt: event.timestamp
          });
          
          logger.info('Recorded trigger event', { prospectId, event });
        } catch (error) {
          logger.error('Failed to record trigger event', {
            prospectId,
            event,
            error: error.message
          });
        }
      }
    }
  }
}

export default new ScoutAgent();
