import axios from 'axios';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class LlamaIndexService {
  constructor() {
    this.apiKey = config.llamaIndex.apiKey;
    this.baseUrl = config.llamaIndex.baseUrl;
    this.documentCache = new Map();
    this.embeddingCache = new Map();
  }

  /**
   * Analyze prospect data to generate insights
   */
  async analyzeProspect(prospectData) {
    try {
      // Create multiple document representations
      const documents = this.createProspectDocuments(prospectData);
      
      // Store documents for semantic search
      const docIds = await this.indexDocuments(documents);
      
      // Run multiple analysis queries
      const [
        psychologicalProfile,
        buyingSignals,
        communicationStyle,
        painPoints,
        decisionFactors
      ] = await Promise.all([
        this.generatePsychologicalProfile(docIds, prospectData),
        this.detectBuyingSignals(docIds, prospectData),
        this.analyzeCommunicationStyle(docIds, prospectData),
        this.identifyPainPoints(docIds, prospectData),
        this.analyzeDecisionFactors(docIds, prospectData)
      ]);

      return {
        psychologicalProfile,
        buyingSignals,
        communicationStyle,
        painPoints,
        decisionFactors,
        overallInsights: await this.synthesizeInsights({
          psychologicalProfile,
          buyingSignals,
          communicationStyle,
          painPoints,
          decisionFactors
        })
      };
    } catch (error) {
      logger.error('LlamaIndex prospect analysis failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate personalization strategies
   */
  async generatePersonalizationStrategy(prospect, insights) {
    try {
      const prompt = this.buildPersonalizationPrompt(prospect, insights);
      
      const response = await this.makeRequest('/generate', {
        prompt,
        model: 'gpt-4',
        temperature: 0.7,
        max_tokens: 1000,
        system_prompt: `You are an expert B2B sales strategist specializing in 
          personalized outreach. Generate specific, actionable personalization 
          strategies based on the prospect's profile and behavioral data.`
      });

      const strategy = this.parsePersonalizationResponse(response.data);
      
      return {
        ...strategy,
        confidence: this.calculateStrategyConfidence(strategy, insights)
      };
    } catch (error) {
      logger.error('LlamaIndex personalization generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Score prospect across multiple dimensions
   */
  async scoreProspect(prospectData, enrichmentData) {
    try {
      const scoringPrompts = {
        intent: this.buildIntentScoringPrompt(prospectData, enrichmentData),
        readiness: this.buildReadinessScoringPrompt(prospectData, enrichmentData),
        budget: this.buildBudgetScoringPrompt(prospectData, enrichmentData),
        timing: this.buildTimingScoringPrompt(prospectData, enrichmentData),
        personalization: this.buildPersonalizationDepthPrompt(prospectData, enrichmentData)
      };

      const scores = {};
      
      for (const [dimension, prompt] of Object.entries(scoringPrompts)) {
        const response = await this.makeRequest('/generate', {
          prompt,
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
          max_tokens: 200,
          system_prompt: `You are an AI scoring system. Analyze the provided data and 
            return a score between 0 and 1, along with a brief explanation. 
            Format: SCORE: [0.XX] REASON: [explanation]`
        });

        scores[dimension] = this.parseScoreResponse(response.data);
      }

      // Calculate weighted overall score
      scores.overall = this.calculateOverallScore(scores);
      
      return scores;
    } catch (error) {
      logger.error('LlamaIndex prospect scoring failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate email content
   */
  async generateEmailContent(prospect, campaign, context) {
    try {
      const prompt = this.buildEmailGenerationPrompt(prospect, campaign, context);
      
      const response = await this.makeRequest('/generate', {
        prompt,
        model: 'gpt-4',
        temperature: 0.8,
        max_tokens: 800,
        system_prompt: `You are an expert B2B sales copywriter. Generate highly 
          personalized, compelling email content that feels authentic and addresses 
          the prospect's specific needs and context.`
      });

      const email = this.parseEmailResponse(response.data);
      
      // Validate and refine
      const refined = await this.refineEmailContent(email, prospect);
      
      return refined;
    } catch (error) {
      logger.error('LlamaIndex email generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create document representations of prospect data
   */
  createProspectDocuments(prospectData) {
    const documents = [];
    
    // Professional background document
    documents.push({
      id: `${prospectData.id}_professional`,
      content: this.createProfessionalNarrative(prospectData),
      metadata: { type: 'professional', prospectId: prospectData.id }
    });

    // Social activity document
    if (prospectData.social?.recentPosts?.length > 0) {
      documents.push({
        id: `${prospectData.id}_social`,
        content: this.createSocialNarrative(prospectData.social),
        metadata: { type: 'social', prospectId: prospectData.id }
      });
    }

    // Company context document
    documents.push({
      id: `${prospectData.id}_company`,
      content: this.createCompanyNarrative(prospectData.companyContext),
      metadata: { type: 'company', prospectId: prospectData.id }
    });

    // Behavioral patterns document
    documents.push({
      id: `${prospectData.id}_behavioral`,
      content: this.createBehavioralNarrative(prospectData.behavioral),
      metadata: { type: 'behavioral', prospectId: prospectData.id }
    });

    return documents;
  }

  /**
   * Index documents for semantic search
   */
  async indexDocuments(documents) {
    const docIds = [];
    
    for (const doc of documents) {
      try {
        const response = await this.makeRequest('/index', {
          document: doc,
          index_name: 'prospects',
          embedding_model: 'text-embedding-ada-002'
        });
        
        docIds.push(response.data.document_id);
        this.documentCache.set(doc.id, doc);
      } catch (error) {
        logger.error('Document indexing failed', { docId: doc.id, error: error.message });
      }
    }
    
    return docIds;
  }

  /**
   * Generate psychological profile
   */
  async generatePsychologicalProfile(docIds, prospectData) {
    const query = `Based on the professional background, social activity, and behavioral 
      patterns, what psychological profile emerges? Consider personality type, motivations, 
      decision-making style, risk tolerance, and communication preferences.`;
    
    const response = await this.semanticSearch(docIds, query);
    
    return {
      personalityType: this.inferPersonalityType(response),
      motivations: this.extractMotivations(response),
      decisionStyle: this.inferDecisionStyle(response),
      riskTolerance: this.assessRiskTolerance(response),
      communicationPreferences: this.identifyCommunicationPreferences(response),
      confidence: response.confidence || 0.75
    };
  }

  /**
   * Detect buying signals
   */
  async detectBuyingSignals(docIds, prospectData) {
    const query = `Identify any buying signals, purchase intent indicators, or signs 
      that this person might be in-market for solutions. Look for pain points, 
      growth indicators, technology mentions, or organizational changes.`;
    
    const response = await this.semanticSearch(docIds, query);
    
    return {
      signals: this.extractBuyingSignals(response),
      strength: this.calculateSignalStrength(response),
      timeframe: this.estimatePurchaseTimeframe(response)
    };
  }

  /**
   * Analyze communication style
   */
  async analyzeCommunicationStyle(docIds, prospectData) {
    const query = `Analyze the writing style, tone, formality level, and communication 
      patterns. How does this person prefer to communicate? What resonates with them?`;
    
    const response = await this.semanticSearch(docIds, query);
    
    return {
      style: this.categorizeWritingStyle(response),
      tone: this.identifyPreferredTone(response),
      formality: this.assessFormalityLevel(response),
      length: this.determineOptimalLength(response),
      topics: this.identifyEngagingTopics(response)
    };
  }

  /**
   * Build personalization prompt
   */
  buildPersonalizationPrompt(prospect, insights) {
    return `
      Prospect Profile:
      - Name: ${prospect.firstName} ${prospect.lastName}
      - Title: ${prospect.jobTitle}
      - Company: ${prospect.companyName}
      - Industry: ${prospect.industry}
      
      Psychological Profile:
      ${JSON.stringify(insights.psychologicalProfile, null, 2)}
      
      Communication Style:
      ${JSON.stringify(insights.communicationStyle, null, 2)}
      
      Pain Points:
      ${JSON.stringify(insights.painPoints, null, 2)}
      
      Generate a comprehensive personalization strategy including:
      1. Key messaging themes
      2. Conversation starters
      3. Value propositions to emphasize
      4. Topics to avoid
      5. Optimal outreach sequence
      6. Channel recommendations
    `;
  }

  /**
   * Build scoring prompts
   */
  buildIntentScoringPrompt(prospectData, enrichmentData) {
    return `
      Analyze the following prospect data to determine their intent to purchase:
      
      Recent Activity:
      ${JSON.stringify(enrichmentData.recentActivity || [], null, 2)}
      
      Company Signals:
      ${JSON.stringify(enrichmentData.companySignals || [], null, 2)}
      
      Social Engagement:
      ${JSON.stringify(prospectData.social || {}, null, 2)}
      
      Score their purchase intent from 0 (no intent) to 1 (high intent).
    `;
  }

  /**
   * Parse score response
   */
  parseScoreResponse(response) {
    const scoreMatch = response.match(/SCORE:\s*([\d.]+)/);
    const reasonMatch = response.match(/REASON:\s*(.+)/);
    
    return {
      score: scoreMatch ? parseFloat(scoreMatch[1]) : 0.5,
      reason: reasonMatch ? reasonMatch[1].trim() : 'Unable to determine',
      raw: response
    };
  }

  /**
   * Calculate overall score
   */
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
    
    for (const [dimension, weight] of Object.entries(weights)) {
      if (scores[dimension]?.score !== undefined) {
        weightedSum += scores[dimension].score * weight;
        totalWeight += weight;
      }
    }
    
    return {
      score: totalWeight > 0 ? weightedSum / totalWeight : 0.5,
      components: weights
    };
  }

  /**
   * Create narrative descriptions
   */
  createProfessionalNarrative(prospectData) {
    const { professional } = prospectData;
    return `
      ${prospectData.firstName} ${prospectData.lastName} currently serves as 
      ${professional.currentTitle} at ${professional.currentCompany}. 
      They have been in this role for ${professional.yearsInRole || 'an unknown number of'} years.
      Their department is ${professional.department || 'unspecified'} with a 
      ${professional.seniority || 'unspecified'} seniority level.
      
      Previous experience includes: ${professional.previousRoles.map(role => 
        `${role.title} at ${role.company}`).join(', ') || 'no documented previous roles'}.
      
      Key skills: ${professional.skills.join(', ') || 'not specified'}.
      
      Education: ${professional.education.map(edu => 
        `${edu.degree} from ${edu.institution}`).join(', ') || 'not specified'}.
    `;
  }

  /**
   * Semantic search across documents
   */
  async semanticSearch(docIds, query) {
    try {
      const response = await this.makeRequest('/search', {
        index_name: 'prospects',
        query,
        document_ids: docIds,
        top_k: 5,
        include_metadata: true
      });
      
      return response.data;
    } catch (error) {
      logger.error('Semantic search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Make HTTP request to LlamaIndex
   */
  async makeRequest(endpoint, data) {
    try {
      const response = await axios({
        method: 'POST',
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        data,
        timeout: 60000 // 60 seconds for AI operations
      });

      return response.data;
    } catch (error) {
      logger.error('LlamaIndex API error', { 
        endpoint, 
        error: error.message,
        status: error.response?.status 
      });
      throw new Error(`LlamaIndex API error: ${error.message}`);
    }
  }

  /**
   * Helper methods for parsing and categorizing responses
   */
  inferPersonalityType(response) {
    // Implement logic to categorize personality type from response
    const indicators = {
      analytical: ['data', 'metrics', 'analysis', 'research'],
      driver: ['results', 'goals', 'achievement', 'performance'],
      expressive: ['creative', 'innovative', 'vision', 'passion'],
      amiable: ['team', 'collaboration', 'support', 'relationship']
    };
    
    // Simplified implementation - would be more sophisticated in production
    return 'analytical'; // placeholder
  }

  extractMotivations(response) {
    // Extract key motivations from the analysis
    return [
      'Professional growth',
      'Team success',
      'Innovation',
      'Efficiency gains'
    ];
  }

  calculateSignalStrength(response) {
    // Calculate overall strength of buying signals
    const signalCount = response.results?.length || 0;
    const avgConfidence = response.results?.reduce((sum, r) => 
      sum + (r.confidence || 0), 0) / Math.max(signalCount, 1);
    
    return Math.min(signalCount * 0.2 * avgConfidence, 1);
  }
}

export default new LlamaIndexService();
