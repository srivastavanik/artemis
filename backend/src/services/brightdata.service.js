import axios from 'axios';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class BrightDataService {
  constructor() {
    this.apiKey = config.brightData.apiKey;
    this.baseUrl = config.brightData.baseUrl;
    this.datasets = {
      people: 'people_dataset',
      companies: 'companies_dataset',
      linkedin: 'linkedin_profiles'
    };
  }

  /**
   * Search for person data using BrightData's Data Collector API
   */
  async searchPerson({ name, company, email, linkedinUrl }) {
    try {
      // BrightData uses Data Collector API for people search
      const searchParams = {
        auth: {
          api_token: this.apiKey
        },
        input: {
          search_terms: []
        }
      };

      // Build search query
      if (name) searchParams.input.search_terms.push({ type: 'name', value: name });
      if (company) searchParams.input.search_terms.push({ type: 'company', value: company });
      if (email) searchParams.input.search_terms.push({ type: 'email', value: email });
      if (linkedinUrl) searchParams.input.search_terms.push({ type: 'linkedin_url', value: linkedinUrl });

      const response = await this.makeRequest('/datasets/people/search', searchParams);

      if (response.data && response.data.results) {
        return response.data.results.map(result => this.transformPersonData(result));
      }

      return [];
    } catch (error) {
      logger.error('BrightData person search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Scrape company data from website
   */
  async scrapeCompanyWebsite(websiteUrl) {
    try {
      const scrapeParams = {
        auth: {
          api_token: this.apiKey
        },
        input: {
          url: websiteUrl,
          data_points: [
            'company_name',
            'industry',
            'employee_count',
            'founded_year',
            'headquarters',
            'description',
            'technologies',
            'social_links',
            'key_people',
            'contact_info'
          ]
        }
      };

      const response = await this.makeRequest('/scraper/company', scrapeParams);
      
      return this.transformCompanyData(response.data);
    } catch (error) {
      logger.error('BrightData company scraping failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Scrape LinkedIn profile data
   */
  async scrapeLinkedInProfile(linkedinUrl) {
    try {
      const scrapeParams = {
        auth: {
          api_token: this.apiKey
        },
        input: {
          url: linkedinUrl,
          data_points: [
            'full_name',
            'current_position',
            'company',
            'location',
            'about',
            'experience',
            'education',
            'skills',
            'languages',
            'recent_activity'
          ]
        }
      };

      const response = await this.makeRequest('/scraper/linkedin', scrapeParams);
      
      return this.transformLinkedInData(response.data);
    } catch (error) {
      logger.error('BrightData LinkedIn scraping failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Bulk enrich multiple prospects
   */
  async bulkEnrichProspects(prospects) {
    try {
      const enrichmentRequests = prospects.map(prospect => ({
        id: prospect.id,
        search_params: {
          name: `${prospect.firstName} ${prospect.lastName}`,
          company: prospect.companyName,
          email: prospect.email
        }
      }));

      const response = await this.makeRequest('/bulk/enrich', {
        auth: {
          api_token: this.apiKey
        },
        requests: enrichmentRequests
      });

      return response.data.results;
    } catch (error) {
      logger.error('BrightData bulk enrichment failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Monitor data changes via webhook
   */
  async setupWebhook(callbackUrl, events = ['profile_update', 'company_update']) {
    try {
      const response = await this.makeRequest('/webhooks/create', {
        auth: {
          api_token: this.apiKey
        },
        callback_url: callbackUrl,
        events: events
      });

      return {
        webhookId: response.data.webhook_id,
        status: 'active'
      };
    } catch (error) {
      logger.error('BrightData webhook setup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get real-time company signals
   */
  async getCompanySignals(companyDomain) {
    try {
      const response = await this.makeRequest('/signals/company', {
        auth: {
          api_token: this.apiKey
        },
        domain: companyDomain,
        signal_types: [
          'funding_rounds',
          'leadership_changes',
          'product_launches',
          'hiring_trends',
          'tech_stack_changes',
          'news_mentions'
        ]
      });

      return response.data.signals || [];
    } catch (error) {
      logger.error('BrightData company signals failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Search for similar companies
   */
  async findSimilarCompanies(companyDomain, limit = 10) {
    try {
      const response = await this.makeRequest('/companies/similar', {
        auth: {
          api_token: this.apiKey
        },
        domain: companyDomain,
        limit: limit,
        include_fields: [
          'domain',
          'name',
          'industry',
          'employee_count',
          'revenue_range',
          'technologies'
        ]
      });

      return response.data.companies || [];
    } catch (error) {
      logger.error('BrightData similar companies search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Transform person data from BrightData format
   */
  transformPersonData(rawData) {
    return {
      fullName: rawData.full_name || `${rawData.first_name || ''} ${rawData.last_name || ''}`.trim(),
      firstName: rawData.first_name,
      lastName: rawData.last_name,
      email: rawData.email,
      phone: rawData.phone,
      jobTitle: rawData.job_title,
      company: rawData.company_name,
      companyDomain: rawData.company_domain,
      linkedinUrl: rawData.linkedin_url,
      location: rawData.location,
      seniority: rawData.seniority_level,
      department: rawData.department,
      professionalSummary: rawData.bio || rawData.summary,
      skills: rawData.skills || [],
      experience: this.transformExperience(rawData.experience || []),
      education: this.transformEducation(rawData.education || []),
      socialProfiles: rawData.social_profiles || {},
      lastUpdated: new Date(rawData.last_updated || Date.now())
    };
  }

  /**
   * Transform company data from BrightData format
   */
  transformCompanyData(rawData) {
    return {
      name: rawData.company_name,
      domain: rawData.domain,
      industry: rawData.industry,
      subIndustry: rawData.sub_industry,
      employeeCount: rawData.employee_count,
      employeeRange: rawData.employee_range,
      foundedYear: rawData.founded_year,
      headquarters: {
        city: rawData.hq_city,
        state: rawData.hq_state,
        country: rawData.hq_country,
        address: rawData.hq_address
      },
      description: rawData.description,
      revenue: rawData.revenue_range,
      funding: {
        totalRaised: rawData.total_funding,
        lastRound: rawData.last_funding_round,
        investors: rawData.investors || []
      },
      technologies: rawData.tech_stack || [],
      socialLinks: {
        linkedin: rawData.linkedin_url,
        twitter: rawData.twitter_url,
        facebook: rawData.facebook_url
      },
      keyPeople: rawData.leadership || [],
      recentNews: rawData.recent_news || []
    };
  }

  /**
   * Transform LinkedIn data
   */
  transformLinkedInData(rawData) {
    return {
      profile: {
        name: rawData.full_name,
        headline: rawData.headline,
        location: rawData.location,
        about: rawData.about,
        currentPosition: rawData.current_position
      },
      experience: rawData.experience || [],
      education: rawData.education || [],
      skills: rawData.skills || [],
      languages: rawData.languages || [],
      recentActivity: {
        posts: rawData.recent_posts || [],
        articles: rawData.recent_articles || [],
        lastActive: rawData.last_activity_date
      }
    };
  }

  /**
   * Transform experience data
   */
  transformExperience(experienceList) {
    return experienceList.map(exp => ({
      title: exp.title,
      company: exp.company_name,
      duration: exp.duration,
      startDate: exp.start_date,
      endDate: exp.end_date,
      description: exp.description,
      location: exp.location
    }));
  }

  /**
   * Transform education data
   */
  transformEducation(educationList) {
    return educationList.map(edu => ({
      institution: edu.school_name,
      degree: edu.degree,
      fieldOfStudy: edu.field_of_study,
      startYear: edu.start_year,
      endYear: edu.end_year
    }));
  }

  /**
   * Make HTTP request to BrightData API with retry logic
   */
  async makeRequest(endpoint, data, method = 'POST', retries = 3) {
    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await axios({
          method,
          url: `${this.baseUrl}${endpoint}`,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          data,
          timeout: 30000
        });

        return response.data;
      } catch (error) {
        lastError = error;
        logger.error('BrightData API error', { 
          endpoint, 
          attempt: attempt + 1,
          error: error.message,
          status: error.response?.status,
          data: error.response?.data 
        });

        // Handle specific BrightData error codes
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your BrightData credentials.');
        }
        
        // Retry on rate limit or server errors
        if (error.response?.status === 429 || error.response?.status >= 500) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          logger.info(`Retrying BrightData request in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // Don't retry on other client errors
        break;
      }
    }
    
    // If we've exhausted retries
    if (lastError.response?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    throw new Error(`BrightData API error: ${lastError.message}`);
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature, payload) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }
}

export default new BrightDataService();
