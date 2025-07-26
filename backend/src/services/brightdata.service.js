import axios from 'axios';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class BrightDataService {
  constructor() {
    this.apiKey = config.brightData.apiKey;
    this.baseUrl = config.brightData.baseUrl;
    this.cache = new Map();
    this.retryAttempts = 3;
    this.retryDelay = 1000;
  }

  /**
   * Search for a person across multiple data sources
   */
  async searchPerson({ name, company, email, linkedinUrl }) {
    const cacheKey = `person:${name}:${company}:${email}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expires > Date.now()) {
        logger.debug('BrightData cache hit', { cacheKey });
        return cached.data;
      }
    }

    try {
      const searchQuery = this.buildSearchQuery({ name, company, email, linkedinUrl });
      
      const response = await this.makeRequest('/search/person', {
        query: searchQuery,
        sources: ['linkedin', 'twitter', 'github', 'news', 'company_websites'],
        depth: 'comprehensive',
        include_social_profiles: true,
        include_recent_activity: true,
        include_company_info: true
      });

      const enrichedData = this.processPersonData(response.data);
      
      // Cache for 24 hours
      this.cache.set(cacheKey, {
        data: enrichedData,
        expires: Date.now() + 24 * 60 * 60 * 1000
      });

      return enrichedData;
    } catch (error) {
      logger.error('BrightData person search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Monitor a prospect for trigger events
   */
  async setupMonitoring(prospectId, triggers) {
    try {
      const response = await this.makeRequest('/monitor/create', {
        entity_id: prospectId,
        entity_type: 'person',
        triggers: triggers || [
          'job_change',
          'company_funding',
          'technology_adoption',
          'social_activity_spike',
          'company_news',
          'competitor_mention'
        ],
        webhook_url: `${process.env.API_URL}/webhooks/brightdata/trigger`,
        frequency: 'real_time'
      });

      return response.data;
    } catch (error) {
      logger.error('BrightData monitoring setup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get company information
   */
  async getCompanyInfo(domain) {
    const cacheKey = `company:${domain}`;
    
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expires > Date.now()) {
        return cached.data;
      }
    }

    try {
      const response = await this.makeRequest('/company/info', {
        domain,
        include_technologies: true,
        include_funding: true,
        include_employees: true,
        include_news: true,
        include_competitors: true
      });

      const companyData = this.processCompanyData(response.data);
      
      // Cache for 7 days
      this.cache.set(cacheKey, {
        data: companyData,
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000
      });

      return companyData;
    } catch (error) {
      logger.error('BrightData company info failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Search for buying signals
   */
  async findBuyingSignals(company) {
    try {
      const response = await this.makeRequest('/signals/buying', {
        company,
        signal_types: [
          'job_postings',
          'technology_mentions',
          'competitor_switching',
          'pain_point_mentions',
          'budget_indicators',
          'growth_indicators'
        ],
        time_range: '30d',
        confidence_threshold: 0.7
      });

      return this.processBuyingSignals(response.data);
    } catch (error) {
      logger.error('BrightData buying signals search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Build search query from available parameters
   */
  buildSearchQuery({ name, company, email, linkedinUrl }) {
    const parts = [];
    
    if (name) parts.push(`name:"${name}"`);
    if (company) parts.push(`company:"${company}"`);
    if (email) parts.push(`email:"${email}"`);
    if (linkedinUrl) parts.push(`linkedin:"${linkedinUrl}"`);
    
    return parts.join(' AND ');
  }

  /**
   * Process raw person data into structured format
   */
  processPersonData(rawData) {
    return {
      identity: {
        fullName: rawData.full_name,
        firstName: rawData.first_name,
        lastName: rawData.last_name,
        email: rawData.primary_email,
        alternativeEmails: rawData.alternative_emails || [],
        phone: rawData.phone_numbers?.[0],
        location: rawData.location,
        timezone: rawData.timezone
      },
      professional: {
        currentTitle: rawData.current_position?.title,
        currentCompany: rawData.current_position?.company,
        department: rawData.current_position?.department,
        seniority: rawData.seniority_level,
        yearsInRole: rawData.years_in_current_role,
        previousRoles: rawData.work_history || [],
        skills: rawData.skills || [],
        education: rawData.education || []
      },
      social: {
        linkedinUrl: rawData.linkedin_url,
        linkedinConnections: rawData.linkedin_connections,
        twitterHandle: rawData.twitter_handle,
        twitterFollowers: rawData.twitter_followers,
        githubUsername: rawData.github_username,
        recentPosts: rawData.recent_social_posts || [],
        engagementRate: rawData.social_engagement_rate
      },
      behavioral: {
        communicationPreference: this.inferCommunicationPreference(rawData),
        bestTimeToContact: this.inferBestContactTime(rawData),
        interests: rawData.detected_interests || [],
        personalityTraits: rawData.personality_indicators || [],
        writingStyle: rawData.writing_style_analysis
      },
      companyContext: {
        companySize: rawData.company_info?.size,
        industry: rawData.company_info?.industry,
        companyGrowthRate: rawData.company_info?.growth_rate,
        recentNews: rawData.company_info?.recent_news || [],
        technologies: rawData.company_info?.tech_stack || []
      },
      metadata: {
        lastUpdated: new Date().toISOString(),
        dataCompleteness: this.calculateDataCompleteness(rawData),
        confidenceScore: rawData.confidence_score || 0.8
      }
    };
  }

  /**
   * Process company data
   */
  processCompanyData(rawData) {
    return {
      basics: {
        name: rawData.name,
        domain: rawData.domain,
        description: rawData.description,
        industry: rawData.industry,
        subIndustry: rawData.sub_industry,
        founded: rawData.founded_year,
        headquarters: rawData.headquarters,
        website: rawData.website
      },
      metrics: {
        employeeCount: rawData.employee_count,
        employeeGrowthRate: rawData.employee_growth_rate,
        estimatedRevenue: rawData.estimated_revenue,
        fundingTotal: rawData.total_funding,
        lastFundingRound: rawData.last_funding_round,
        valuation: rawData.valuation
      },
      technology: {
        techStack: rawData.technologies || [],
        recentAdoptions: rawData.recent_tech_adoptions || [],
        cloudProviders: rawData.cloud_providers || [],
        securityTools: rawData.security_tools || [],
        marketingTools: rawData.marketing_tools || []
      },
      market: {
        competitors: rawData.competitors || [],
        marketPosition: rawData.market_position,
        keyDifferentiators: rawData.differentiators || [],
        targetMarket: rawData.target_market,
        customerBase: rawData.customer_segments || []
      },
      signals: {
        recentNews: rawData.recent_news || [],
        jobPostings: rawData.open_positions || [],
        executiveChanges: rawData.leadership_changes || [],
        productLaunches: rawData.recent_products || [],
        partnerships: rawData.recent_partnerships || []
      }
    };
  }

  /**
   * Process buying signals
   */
  processBuyingSignals(rawSignals) {
    return rawSignals.map(signal => ({
      type: signal.signal_type,
      strength: signal.confidence_score,
      source: signal.source,
      timestamp: signal.detected_at,
      description: signal.description,
      relatedData: signal.supporting_data,
      suggestedAction: this.getSuggestedAction(signal)
    })).sort((a, b) => b.strength - a.strength);
  }

  /**
   * Infer communication preferences from data
   */
  inferCommunicationPreference(data) {
    const preferences = [];
    
    if (data.email_response_rate > 0.7) preferences.push('email');
    if (data.linkedin_activity_level === 'high') preferences.push('linkedin');
    if (data.twitter_activity_level === 'high') preferences.push('twitter');
    if (data.calendar_availability?.length > 0) preferences.push('calendar');
    
    return preferences[0] || 'email';
  }

  /**
   * Infer best time to contact
   */
  inferBestContactTime(data) {
    // Analyze social media posting times, email response times, etc.
    const activityPatterns = data.activity_patterns || {};
    const timezone = data.timezone || 'America/New_York';
    
    return {
      timezone,
      bestDays: activityPatterns.most_active_days || ['Tuesday', 'Wednesday', 'Thursday'],
      bestHours: activityPatterns.most_active_hours || ['9AM-11AM', '2PM-4PM'],
      avoidTimes: activityPatterns.inactive_periods || ['Friday afternoon', 'Monday morning']
    };
  }

  /**
   * Calculate data completeness score
   */
  calculateDataCompleteness(data) {
    const fields = [
      'full_name', 'email', 'current_position', 'linkedin_url',
      'company_info', 'work_history', 'skills', 'recent_activity'
    ];
    
    const filledFields = fields.filter(field => data[field] && 
      (Array.isArray(data[field]) ? data[field].length > 0 : true)
    );
    
    return filledFields.length / fields.length;
  }

  /**
   * Get suggested action based on signal
   */
  getSuggestedAction(signal) {
    const actionMap = {
      'job_posting': 'Reach out with solution for mentioned role requirements',
      'technology_mention': 'Highlight integration capabilities with mentioned tech',
      'competitor_switching': 'Emphasize differentiators and switching incentives',
      'pain_point_mention': 'Lead with solution to specific pain point',
      'budget_indicator': 'Include ROI calculations and pricing options',
      'growth_indicator': 'Focus on scalability and growth support'
    };
    
    return actionMap[signal.signal_type] || 'Personalized outreach recommended';
  }

  /**
   * Make HTTP request with retry logic
   */
  async makeRequest(endpoint, data, attempt = 1) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data,
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      if (attempt < this.retryAttempts && error.response?.status >= 500) {
        logger.warn(`BrightData request failed, retrying...`, { 
          attempt, 
          error: error.message 
        });
        
        await new Promise(resolve => 
          setTimeout(resolve, this.retryDelay * Math.pow(2, attempt - 1))
        );
        
        return this.makeRequest(endpoint, data, attempt + 1);
      }
      
      throw new Error(`BrightData API error: ${error.message}`);
    }
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('BrightData cache cleared');
  }
}

export default new BrightDataService();
