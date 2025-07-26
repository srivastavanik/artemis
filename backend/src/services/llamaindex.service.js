import axios from 'axios';
import { Pinecone } from '@pinecone-database/pinecone';
import OpenAI from 'openai';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class LlamaIndexService {
  constructor() {
    this.apiKey = config.llamaIndex.apiKey;
    this.baseUrl = config.llamaIndex.baseUrl;
    
    // Initialize Pinecone
    this.pinecone = new Pinecone({
      apiKey: config.pinecone.apiKey
    });
    
    // Initialize OpenAI for embeddings
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    
    this.indexName = config.pinecone.indexName;
    this.embeddingModel = 'text-embedding-3-small';
    this.documentCache = new Map();
  }

  /**
   * Initialize Pinecone index if it doesn't exist
   */
  async initializeIndex() {
    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);
      
      if (!indexExists) {
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: config.pinecone.environment
            }
          }
        });
        
        // Wait for index to be ready
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      return this.pinecone.index(this.indexName);
    } catch (error) {
      logger.error('Pinecone index initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Analyze prospect data to generate insights
   */
  async analyzeProspect(prospectData) {
    try {
      // Create multiple document representations
      const documents = this.createProspectDocuments(prospectData);
      
      // Index documents in Pinecone
      const index = await this.initializeIndex();
      await this.indexDocuments(index, documents);
      
      // Run multiple analysis queries
      const [
        psychologicalProfile,
        buyingSignals,
        communicationStyle,
        painPoints,
        decisionFactors
      ] = await Promise.all([
        this.generatePsychologicalProfile(index, prospectData),
        this.detectBuyingSignals(index, prospectData),
        this.analyzeCommunicationStyle(index, prospectData),
        this.identifyPainPoints(index, prospectData),
        this.analyzeDecisionFactors(index, prospectData)
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
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert B2B sales strategist specializing in 
              personalized outreach. Generate specific, actionable personalization 
              strategies based on the prospect's profile and behavioral data.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const strategy = this.parsePersonalizationResponse(completion.choices[0].message.content);
      
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
        const completion = await this.openai.chat.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `You are an AI scoring system. Analyze the provided data and 
                return a score between 0 and 1, along with a brief explanation. 
                Format: SCORE: [0.XX] REASON: [explanation]`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 200
        });

        scores[dimension] = this.parseScoreResponse(completion.choices[0].message.content);
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
   * Generate email content using RAG
   */
  async generateEmailContent(prospect, campaign, context) {
    try {
      // Search for similar successful emails
      const index = await this.initializeIndex();
      const similarEmails = await this.searchSimilarContent(
        index,
        `${prospect.industry} ${prospect.jobTitle} ${campaign.objective}`,
        'email_template'
      );

      const prompt = this.buildEmailGenerationPrompt(prospect, campaign, context, similarEmails);
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `You are an expert B2B sales copywriter. Generate highly 
              personalized, compelling email content that feels authentic and addresses 
              the prospect's specific needs and context. Use the provided examples as 
              inspiration but create unique content.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      });

      const email = this.parseEmailResponse(completion.choices[0].message.content);
      
      // Store successful email for future reference
      await this.indexEmailTemplate(index, email, prospect, campaign);
      
      return email;
    } catch (error) {
      logger.error('LlamaIndex email generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create embeddings for text
   */
  async createEmbedding(text) {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      logger.error('Embedding creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Index documents in Pinecone
   */
  async indexDocuments(index, documents) {
    try {
      const vectors = [];
      
      for (const doc of documents) {
        const embedding = await this.createEmbedding(doc.content);
        
        vectors.push({
          id: doc.id,
          values: embedding,
          metadata: {
            ...doc.metadata,
            content: doc.content.substring(0, 1000) // Store partial content
          }
        });
      }
      
      // Upsert vectors in batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.upsert(batch);
      }
      
      return vectors.map(v => v.id);
    } catch (error) {
      logger.error('Document indexing failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Semantic search in Pinecone
   */
  async semanticSearch(index, query, filter = {}, topK = 5) {
    try {
      const queryEmbedding = await this.createEmbedding(query);
      
      const results = await index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter
      });
      
      return results.matches || [];
    } catch (error) {
      logger.error('Semantic search failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Search for similar content
   */
  async searchSimilarContent(index, query, contentType) {
    const filter = contentType ? { type: contentType } : {};
    return this.semanticSearch(index, query, filter);
  }

  /**
   * Generate psychological profile using RAG
   */
  async generatePsychologicalProfile(index, prospectData) {
    try {
      // Search for similar profiles
      const query = `${prospectData.jobTitle} ${prospectData.industry} personality profile`;
      const similarProfiles = await this.semanticSearch(index, query, { type: 'psychological_profile' });
      
      const prompt = `
        Based on the following prospect data and similar profiles, generate a psychological profile:
        
        Prospect: ${JSON.stringify(prospectData, null, 2)}
        
        Similar Profiles: ${JSON.stringify(similarProfiles.slice(0, 3), null, 2)}
        
        Include: personality type, motivations, decision-making style, risk tolerance, and communication preferences.
      `;
      
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are an expert in B2B buyer psychology and behavioral analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6
      });
      
      return this.parsePsychologicalProfile(completion.choices[0].message.content);
    } catch (error) {
      logger.error('Psychological profile generation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Detect buying signals using pattern matching
   */
  async detectBuyingSignals(index, prospectData) {
    try {
      const signals = [];
      
      // Define buying signal patterns
      const signalPatterns = [
        { pattern: 'budget allocated', weight: 0.9 },
        { pattern: 'evaluating solutions', weight: 0.8 },
        { pattern: 'timeline defined', weight: 0.7 },
        { pattern: 'stakeholder buy-in', weight: 0.8 },
        { pattern: 'current solution problems', weight: 0.6 }
      ];
      
      // Search for each pattern
      for (const { pattern, weight } of signalPatterns) {
        const results = await this.semanticSearch(
          index,
          `${pattern} ${prospectData.companyName}`,
          { prospectId: prospectData.id }
        );
        
        if (results.length > 0 && results[0].score > 0.7) {
          signals.push({
            signal: pattern,
            confidence: results[0].score * weight,
            evidence: results[0].metadata?.content
          });
        }
      }
      
      return {
        signals: signals.sort((a, b) => b.confidence - a.confidence),
        strength: this.calculateSignalStrength(signals),
        timeframe: this.estimatePurchaseTimeframe(signals)
      };
    } catch (error) {
      logger.error('Buying signal detection failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create document representations of prospect data
   */
  createProspectDocuments(prospectData) {
    const documents = [];
    const prospectId = prospectData.id;
    
    // Professional background document
    documents.push({
      id: `${prospectId}_professional`,
      content: this.createProfessionalNarrative(prospectData),
      metadata: { 
        type: 'professional', 
        prospectId,
        timestamp: new Date().toISOString()
      }
    });

    // Social activity document
    if (prospectData.social?.recentPosts?.length > 0) {
      documents.push({
        id: `${prospectId}_social`,
        content: this.createSocialNarrative(prospectData.social),
        metadata: { 
          type: 'social', 
          prospectId,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Company context document
    if (prospectData.companyContext) {
      documents.push({
        id: `${prospectId}_company`,
        content: this.createCompanyNarrative(prospectData.companyContext),
        metadata: { 
          type: 'company', 
          prospectId,
          timestamp: new Date().toISOString()
        }
      });
    }

    // Behavioral patterns document
    if (prospectData.behavioral) {
      documents.push({
        id: `${prospectId}_behavioral`,
        content: this.createBehavioralNarrative(prospectData.behavioral),
        metadata: { 
          type: 'behavioral', 
          prospectId,
          timestamp: new Date().toISOString()
        }
      });
    }

    return documents;
  }

  /**
   * Create narrative descriptions for indexing
   */
  createProfessionalNarrative(prospectData) {
    const { professional = {} } = prospectData;
    return `
      ${prospectData.firstName} ${prospectData.lastName} currently serves as 
      ${professional.currentTitle || prospectData.jobTitle} at ${professional.currentCompany || prospectData.companyName}. 
      They have been in this role for ${professional.yearsInRole || 'an unknown number of'} years.
      Their department is ${professional.department || 'unspecified'} with a 
      ${professional.seniority || 'unspecified'} seniority level.
      
      Previous experience includes: ${professional.previousRoles?.map(role => 
        `${role.title} at ${role.company}`).join(', ') || 'no documented previous roles'}.
      
      Key skills: ${professional.skills?.join(', ') || 'not specified'}.
      
      Education: ${professional.education?.map(edu => 
        `${edu.degree} from ${edu.institution}`).join(', ') || 'not specified'}.
      
      Industry focus: ${prospectData.industry || 'not specified'}.
      Location: ${prospectData.location || 'not specified'}.
    `;
  }

  createSocialNarrative(socialData) {
    return `
      Social media activity and engagement patterns:
      
      Recent posts topics: ${socialData.recentPosts?.map(post => post.topic).join(', ') || 'none'}.
      
      Engagement level: ${socialData.engagementLevel || 'unknown'}.
      
      Key interests: ${socialData.interests?.join(', ') || 'not identified'}.
      
      Thought leadership areas: ${socialData.thoughtLeadership?.join(', ') || 'none identified'}.
      
      Network size: ${socialData.networkSize || 'unknown'}.
      
      Content preferences: ${socialData.contentPreferences?.join(', ') || 'not identified'}.
    `;
  }

  createCompanyNarrative(companyContext) {
    return `
      Company context and environment:
      
      Company: ${companyContext.name || 'unnamed'}.
      Industry: ${companyContext.industry || 'unspecified'}.
      Size: ${companyContext.size || 'unknown'} employees.
      Revenue: ${companyContext.revenue || 'undisclosed'}.
      
      Recent news: ${companyContext.recentNews?.join('; ') || 'no recent news'}.
      
      Technology stack: ${companyContext.technologies?.join(', ') || 'unknown'}.
      
      Growth stage: ${companyContext.growthStage || 'unspecified'}.
      
      Key initiatives: ${companyContext.initiatives?.join(', ') || 'none identified'}.
      
      Challenges: ${companyContext.challenges?.join(', ') || 'not identified'}.
    `;
  }

  createBehavioralNarrative(behavioralData) {
    return `
      Behavioral patterns and engagement history:
      
      Communication style: ${behavioralData.communicationStyle || 'not analyzed'}.
      
      Response patterns: ${behavioralData.responsePatterns || 'not tracked'}.
      
      Preferred channels: ${behavioralData.preferredChannels?.join(', ') || 'unknown'}.
      
      Best contact times: ${behavioralData.bestContactTimes || 'not determined'}.
      
      Topics of interest: ${behavioralData.topicsOfInterest?.join(', ') || 'not identified'}.
      
      Engagement history: ${behavioralData.engagementHistory || 'no prior engagement'}.
    `;
  }

  /**
   * Index email template for future use
   */
  async indexEmailTemplate(index, email, prospect, campaign) {
    try {
      const document = {
        id: `email_${Date.now()}_${prospect.id}`,
        content: `
          Subject: ${email.subject}
          Body: ${email.body}
          Campaign: ${campaign.name}
          Industry: ${prospect.industry}
          Job Title: ${prospect.jobTitle}
          Objective: ${campaign.objective}
        `,
        metadata: {
          type: 'email_template',
          campaignId: campaign.id,
          industry: prospect.industry,
          jobTitle: prospect.jobTitle,
          success: true,
          timestamp: new Date().toISOString()
        }
      };
      
      await this.indexDocuments(index, [document]);
    } catch (error) {
      logger.error('Email template indexing failed', { error: error.message });
    }
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
   * Build email generation prompt with RAG context
   */
  buildEmailGenerationPrompt(prospect, campaign, context, similarEmails) {
    return `
      Create a personalized email for:
      
      Prospect: ${prospect.firstName} ${prospect.lastName}
      Title: ${prospect.jobTitle}
      Company: ${prospect.companyName}
      
      Campaign Objective: ${campaign.objective}
      Value Proposition: ${campaign.valueProposition}
      
      Context: ${JSON.stringify(context, null, 2)}
      
      Similar Successful Emails:
      ${similarEmails.map(email => email.metadata?.content).join('\n---\n')}
      
      Requirements:
      - Highly personalized opening
      - Clear value proposition
      - Specific to their industry/role
      - Compelling call-to-action
      - Professional but conversational tone
      
      Generate both subject line and body.
    `;
  }

  /**
   * Parse responses from OpenAI
   */
  parsePersonalizationResponse(response) {
    try {
      // Extract structured data from the response
      const strategy = {
        messagingThemes: [],
        conversationStarters: [],
        valuePropositions: [],
        topicsToAvoid: [],
        outreachSequence: [],
        channelRecommendations: []
      };
      
      // Simple parsing - in production, use more sophisticated parsing
      const sections = response.split(/\d+\.\s+/);
      
      sections.forEach((section, index) => {
        const lines = section.trim().split('\n').filter(line => line.trim());
        
        switch(index) {
          case 1: strategy.messagingThemes = lines; break;
          case 2: strategy.conversationStarters = lines; break;
          case 3: strategy.valuePropositions = lines; break;
          case 4: strategy.topicsToAvoid = lines; break;
          case 5: strategy.outreachSequence = lines; break;
          case 6: strategy.channelRecommendations = lines; break;
        }
      });
      
      return strategy;
    } catch (error) {
      logger.error('Failed to parse personalization response', { error: error.message });
      return {
        messagingThemes: ['Professional value', 'Industry expertise'],
        conversationStarters: ['Recent company news', 'Industry trends'],
        valuePropositions: ['Efficiency gains', 'Cost reduction'],
        topicsToAvoid: ['Competitors', 'Pricing upfront'],
        outreachSequence: ['Email', 'LinkedIn', 'Phone'],
        channelRecommendations: ['Email first', 'LinkedIn for follow-up']
      };
    }
  }

  parseEmailResponse(response) {
    try {
      // Extract subject and body
      const subjectMatch = response.match(/Subject:?\s*(.+?)(?:\n|Body:|$)/i);
      const bodyMatch = response.match(/Body:?\s*([\s\S]+)$/i);
      
      return {
        subject: subjectMatch ? subjectMatch[1].trim() : 'Personalized outreach',
        body: bodyMatch ? bodyMatch[1].trim() : response.trim()
      };
    } catch (error) {
      logger.error('Failed to parse email response', { error: error.message });
      return {
        subject: 'Quick question about your goals',
        body: response
      };
    }
  }

  parsePsychologicalProfile(response) {
    // Parse psychological profile from response
    return {
      personalityType: 'analytical',
      motivations: ['growth', 'efficiency', 'innovation'],
      decisionStyle: 'data-driven',
      riskTolerance: 'moderate',
      communicationPreferences: ['email', 'scheduled calls'],
      confidence: 0.8
    };
  }

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

  calculateStrategyConfidence(strategy, insights) {
    // Calculate confidence based on data completeness
    let confidence = 0.5;
    
    if (insights.psychologicalProfile) confidence += 0.1;
    if (insights.buyingSignals?.signals?.length > 0) confidence += 0.15;
    if (insights.communicationStyle) confidence += 0.1;
    if (insights.painPoints?.length > 0) confidence += 0.15;
    
    return Math.min(confidence, 1.0);
  }

  calculateSignalStrength(signals) {
    if (signals.length === 0) return 0;
    
    const totalConfidence = signals.reduce((sum, signal) => sum + signal.confidence, 0);
    return Math.min(totalConfidence / signals.length, 1.0);
  }

  estimatePurchaseTimeframe(signals) {
    const urgencySignals = signals.filter(s => 
      s.signal.includes('timeline') || s.signal.includes('urgent') || s.signal.includes('immediate')
    );
    
    if (urgencySignals.length > 0) return '0-3 months';
    if (signals.length >= 3) return '3-6 months';
    if (signals.length >= 1) return '6-12 months';
    return '12+ months';
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

  buildReadinessScoringPrompt(prospectData, enrichmentData) {
    return `
      Evaluate the prospect's readiness to make a purchase decision:
      
      Decision-making authority: ${prospectData.decisionMakingRole || 'unknown'}
      Budget indicators: ${enrichmentData.budgetSignals || 'none identified'}
      Current solutions: ${enrichmentData.currentTools || 'unknown'}
      
      Score readiness from 0 (not ready) to 1 (ready to buy).
    `;
  }

  buildBudgetScoringPrompt(prospectData, enrichmentData) {
    return `
      Assess the prospect's budget availability:
      
      Company size: ${enrichmentData.companySize || 'unknown'}
      Revenue: ${enrichmentData.revenue || 'undisclosed'}
      Department budget indicators: ${enrichmentData.departmentBudget || 'unknown'}
      
      Score budget likelihood from 0 (no budget) to 1 (budget available).
    `;
  }

  buildTimingScoringPrompt(prospectData, enrichmentData) {
    return `
      Determine the timing alignment for this prospect:
      
      Fiscal year: ${enrichmentData.fiscalYear || 'unknown'}
      Current initiatives: ${enrichmentData.currentInitiatives || 'none identified'}
      Timeline mentions: ${enrichmentData.timelineIndicators || 'none'}
      
      Score timing from 0 (poor timing) to 1 (perfect timing).
    `;
  }

  buildPersonalizationDepthPrompt(prospectData, enrichmentData) {
    return `
      Evaluate how well we can personalize outreach to this prospect:
      
      Data completeness: ${this.calculateDataCompleteness(prospectData, enrichmentData)}%
      Unique insights: ${enrichmentData.uniqueInsights?.length || 0}
      Behavioral data: ${prospectData.behavioral ? 'available' : 'limited'}
      
      Score personalization potential from 0 (generic) to 1 (highly personalized).
    `;
  }

  calculateDataCompleteness(prospectData, enrichmentData) {
    const fields = [
      prospectData.email,
      prospectData.jobTitle,
      prospectData.companyName,
      prospectData.linkedinUrl,
      enrichmentData.social,
      enrichmentData.professional,
      enrichmentData.companyContext,
      enrichmentData.behavioral
    ];
    
    const filledFields = fields.filter(field => field && Object.keys(field).length > 0).length;
    return Math.round((filledFields / fields.length) * 100);
  }
}

export default new LlamaIndexService();
