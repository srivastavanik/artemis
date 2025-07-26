import { createClient } from '@supabase/supabase-js';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class SupabaseService {
  constructor() {
    // Initialize with null client if credentials are missing
    const url = config.supabase.url;
    const key = config.supabase.serviceKey || config.supabase.anonKey;
    
    if (!url || url === 'your_supabase_url_here' || !key || key === 'your_supabase_anon_key_here') {
      logger.warn('Supabase credentials not configured. Running in demo mode.');
      this.client = null;
    } else {
      this.client = createClient(
        url,
        key,
        {
          auth: {
            autoRefreshToken: true,
            persistSession: false
          }
        }
      );
    }
  }

  /**
   * Create a new prospect
   */
  async createProspect(prospectData) {
    try {
      if (!this.client) {
        // Demo mode - return mock data
        return {
          id: Date.now().toString(),
          ...prospectData,
          discovered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        };
      }

      const { data, error } = await this.client
        .from('prospects')
        .insert({
          email: prospectData.email,
          first_name: prospectData.firstName,
          last_name: prospectData.lastName,
          job_title: prospectData.jobTitle,
          company_name: prospectData.companyName,
          company_domain: prospectData.companyDomain,
          linkedin_url: prospectData.linkedinUrl,
          phone: prospectData.phone,
          location: prospectData.location,
          timezone: prospectData.timezone,
          source: prospectData.source || 'manual',
          discovered_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create prospect', { error: error.message });
      throw error;
    }
  }

  /**
   * Get prospect by ID
   */
  async getProspectById(id) {
    try {
      if (!this.client) {
        // Demo mode - return mock data
        return {
          id,
          email: 'demo@example.com',
          first_name: 'Demo',
          last_name: 'User',
          company_name: 'Demo Company',
          company_domain: 'demo.com',
          discovered_at: new Date().toISOString()
        };
      }

      const { data, error } = await this.client
        .from('prospects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get prospect', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Search prospects
   */
  async searchProspects(filters = {}) {
    try {
      if (!this.client) {
        // Demo mode - return empty result
        return {
          data: [],
          total: 0,
          limit: filters.limit || 50,
          offset: filters.offset || 0
        };
      }

      let query = this.client.from('prospects').select('*');

      // Apply filters
      if (filters.email) {
        query = query.ilike('email', `%${filters.email}%`);
      }
      if (filters.company) {
        query = query.ilike('company_name', `%${filters.company}%`);
      }
      if (filters.name) {
        query = query.or(`first_name.ilike.%${filters.name}%,last_name.ilike.%${filters.name}%`);
      }
      if (filters.minScore) {
        // Join with latest scores
        query = query
          .select(`
            *,
            engagement_scores!inner(
              overall_score,
              calculated_at
            )
          `)
          .gte('engagement_scores.overall_score', filters.minScore)
          .order('engagement_scores.calculated_at', { ascending: false });
      }

      // Pagination
      const limit = filters.limit || 50;
      const offset = filters.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data,
        total: count,
        limit,
        offset
      };
    } catch (error) {
      logger.error('Failed to search prospects', { filters, error: error.message });
      throw error;
    }
  }

  /**
   * Store enrichment data
   */
  async storeEnrichmentData(prospectId, source, enrichmentData) {
    try {
      const { data, error } = await this.client
        .from('enrichment_data')
        .insert({
          prospect_id: prospectId,
          source,
          data: enrichmentData,
          expires_at: this.calculateExpirationDate(source)
        })
        .select()
        .single();

      if (error) throw error;

      // Update prospect's last enriched timestamp
      await this.client
        .from('prospects')
        .update({ last_enriched_at: new Date().toISOString() })
        .eq('id', prospectId);

      return data;
    } catch (error) {
      logger.error('Failed to store enrichment data', { 
        prospectId, 
        source, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get enrichment data for prospect
   */
  async getEnrichmentData(prospectId, source = null) {
    try {
      let query = this.client
        .from('enrichment_data')
        .select('*')
        .eq('prospect_id', prospectId)
        .or('expires_at.is.null,expires_at.gt.now()');

      if (source) {
        query = query.eq('source', source);
      }

      const { data, error } = await query.order('fetched_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to get enrichment data', { 
        prospectId, 
        source, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Update engagement scores
   */
  async updateEngagementScores(prospectId, scores) {
    try {
      // Calculate weighted overall score
      const overallScore = this.calculateOverallScore(scores);

      const { data, error } = await this.client
        .from('engagement_scores')
        .insert({
          prospect_id: prospectId,
          intent_score: scores.intent?.score,
          readiness_score: scores.readiness?.score,
          budget_likelihood: scores.budget?.score,
          timing_score: scores.timing?.score,
          personalization_depth: scores.personalization?.score,
          overall_score: overallScore,
          scoring_metadata: {
            reasons: {
              intent: scores.intent?.reason,
              readiness: scores.readiness?.reason,
              budget: scores.budget?.reason,
              timing: scores.timing?.reason,
              personalization: scores.personalization?.reason
            },
            calculated_at: new Date().toISOString(),
            formula_version: '1.0'
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update engagement scores', { 
        prospectId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Get latest scores for prospect
   */
  async getLatestScores(prospectId) {
    try {
      const { data, error } = await this.client
        .from('engagement_scores')
        .select('*')
        .eq('prospect_id', prospectId)
        .order('calculated_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data;
    } catch (error) {
      logger.error('Failed to get latest scores', { 
        prospectId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create outreach campaign
   */
  async createCampaign(campaignData) {
    try {
      const { data, error } = await this.client
        .from('outreach_campaigns')
        .insert({
          name: campaignData.name,
          description: campaignData.description,
          strategy: campaignData.strategy,
          channels: campaignData.channels || ['email'],
          sequence_timing: campaignData.sequenceTiming,
          personalization_rules: campaignData.personalizationRules,
          a_b_test_config: campaignData.abTestConfig,
          status: 'draft',
          created_by: campaignData.userId
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Assign prospects to campaign
   */
  async assignProspectsToCampaign(campaignId, prospectIds) {
    try {
      const assignments = prospectIds.map(prospectId => ({
        campaign_id: campaignId,
        prospect_id: prospectId,
        status: 'active'
      }));

      const { data, error } = await this.client
        .from('campaign_assignments')
        .insert(assignments)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to assign prospects to campaign', { 
        campaignId, 
        prospectCount: prospectIds.length,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Create message
   */
  async createMessage(messageData) {
    try {
      const { data, error } = await this.client
        .from('messages')
        .insert({
          campaign_id: messageData.campaignId,
          prospect_id: messageData.prospectId,
          channel: messageData.channel,
          subject: messageData.subject,
          content: messageData.content,
          personalization_data: messageData.personalizationData,
          scheduled_for: messageData.scheduledFor,
          automation_id: messageData.automationId,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to create message', { error: error.message });
      throw error;
    }
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add timestamp fields based on status
      const timestampMap = {
        'sent': 'sent_at',
        'delivered': 'delivered_at',
        'opened': 'opened_at',
        'clicked': 'clicked_at',
        'replied': 'replied_at'
      };

      if (timestampMap[status]) {
        updateData[timestampMap[status]] = new Date().toISOString();
      }

      // Add bounce type if bounced
      if (status === 'bounced' && additionalData.bounceType) {
        updateData.bounce_type = additionalData.bounceType;
      }

      const { data, error } = await this.client
        .from('messages')
        .update(updateData)
        .eq('id', messageId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to update message status', { 
        messageId, 
        status, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Record interaction
   */
  async recordInteraction(interactionData) {
    try {
      const { data, error } = await this.client
        .from('interactions')
        .insert({
          prospect_id: interactionData.prospectId,
          message_id: interactionData.messageId,
          type: interactionData.type,
          channel: interactionData.channel,
          data: interactionData.data,
          sentiment: interactionData.sentiment,
          intent_signals: interactionData.intentSignals,
          occurred_at: interactionData.occurredAt || new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to record interaction', { error: error.message });
      throw error;
    }
  }

  /**
   * Log agent activity
   */
  async logAgentActivity(logData) {
    try {
      const { data, error } = await this.client
        .from('agent_logs')
        .insert({
          agent_name: logData.agentName,
          operation: logData.operation,
          prospect_id: logData.prospectId,
          campaign_id: logData.campaignId,
          input_data: logData.input,
          output_data: logData.output,
          error_data: logData.error,
          duration_ms: logData.duration,
          status: logData.status
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      logger.error('Failed to log agent activity', { error: error.message });
      // Don't throw - logging shouldn't break the flow
      return null;
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId) {
    try {
      // Get campaign details
      const { data: campaign } = await this.client
        .from('outreach_campaigns')
        .select('*, campaign_assignments(count)')
        .eq('id', campaignId)
        .single();

      // Get message statistics
      const { data: messageStats } = await this.client
        .from('messages')
        .select('status')
        .eq('campaign_id', campaignId);

      // Calculate metrics
      const stats = {
        totalProspects: campaign.campaign_assignments[0]?.count || 0,
        messages: {
          total: messageStats?.length || 0,
          sent: messageStats?.filter(m => m.status === 'sent').length || 0,
          delivered: messageStats?.filter(m => m.status === 'delivered').length || 0,
          opened: messageStats?.filter(m => m.status === 'opened').length || 0,
          clicked: messageStats?.filter(m => m.status === 'clicked').length || 0,
          replied: messageStats?.filter(m => m.status === 'replied').length || 0
        }
      };

      // Calculate rates
      if (stats.messages.sent > 0) {
        stats.rates = {
          delivery: (stats.messages.delivered / stats.messages.sent) * 100,
          open: (stats.messages.opened / stats.messages.delivered) * 100,
          click: (stats.messages.clicked / stats.messages.opened) * 100,
          reply: (stats.messages.replied / stats.messages.sent) * 100
        };
      }

      return stats;
    } catch (error) {
      logger.error('Failed to get campaign analytics', { 
        campaignId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Real-time subscriptions
   */
  subscribeToProspectChanges(prospectId, callback) {
    return this.client
      .from('prospects')
      .on('UPDATE', (payload) => {
        if (payload.new.id === prospectId) {
          callback(payload.new);
        }
      })
      .subscribe();
  }

  subscribeToCampaignUpdates(campaignId, callback) {
    return this.client
      .from('messages')
      .on('*', (payload) => {
        if (payload.new?.campaign_id === campaignId) {
          callback({
            event: payload.eventType,
            message: payload.new
          });
        }
      })
      .subscribe();
  }

  /**
   * Helper methods
   */
  calculateExpirationDate(source) {
    const expirationDays = {
      'brightdata': 1,
      'linkedin': 7,
      'twitter': 3,
      'company': 30,
      'social': 3
    };
    
    const days = expirationDays[source] || 7;
    const expiration = new Date();
    expiration.setDate(expiration.getDate() + days);
    return expiration.toISOString();
  }

  calculateOverallScore(scores) {
    const weights = {
      intent: 0.3,
      readiness: 0.25,
      budget: 0.2,
      timing: 0.15,
      personalization: 0.1
    };

    let weightedSum = 0;
    let totalWeight = 0;

    Object.entries(weights).forEach(([key, weight]) => {
      if (scores[key]?.score !== undefined) {
        weightedSum += scores[key].score * weight;
        totalWeight += weight;
      }
    });

    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : 0.5;
  }
}

export default new SupabaseService();
