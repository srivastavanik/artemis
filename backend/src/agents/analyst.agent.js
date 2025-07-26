import llamaIndexService from '../services/llamaindex.service.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

class AnalystAgent {
  constructor() {
    this.name = 'analyst';
  }

  /**
   * Analyze prospect and generate insights
   */
  async analyzeProspect(prospectId) {
    const startTime = Date.now();
    
    try {
      logger.info('Analyst agent starting prospect analysis', { prospectId });
      
      // Get prospect data
      const prospect = await supabaseService.getProspectById(prospectId);
      if (!prospect) throw new Error('Prospect not found');
      
      // Get enrichment data
      const enrichmentData = await supabaseService.getEnrichmentData(prospectId);
      if (!enrichmentData || enrichmentData.length === 0) {
        throw new Error('No enrichment data available for analysis');
      }
      
      // Transform data for analysis
      const analysisData = this.prepareAnalysisData(prospect, enrichmentData);
      
      // Generate insights using LlamaIndex
      const insights = await llamaIndexService.analyzeProspect(analysisData);
      
      // Score the prospect
      const scores = await this.scoreProspect(analysisData, insights);
      
      // Generate personalization strategy
      const personalizationStrategy = await this.generatePersonalizationStrategy(
        prospect,
        insights
      );
      
      // Store analysis results
      await this.storeAnalysisResults(prospectId, {
        insights,
        scores,
        personalizationStrategy
      });
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'analyze_prospect',
        prospectId,
        output: {
          insightTypes: Object.keys(insights),
          overallScore: scores.overall?.score
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return {
        insights,
        scores,
        personalizationStrategy
      };
    } catch (error) {
      logger.error('Analyst agent analysis failed', { 
        prospectId, 
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'analyze_prospect',
        prospectId,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Analyze campaign performance
   */
  async analyzeCampaignPerformance(campaignId) {
    const startTime = Date.now();
    
    try {
      logger.info('Analyst agent analyzing campaign', { campaignId });
      
      // Get campaign analytics
      const analytics = await supabaseService.getCampaignAnalytics(campaignId);
      
      // Analyze patterns
      const patterns = await this.identifyCampaignPatterns(campaignId);
      
      // Generate recommendations
      const recommendations = await this.generateCampaignRecommendations(
        analytics,
        patterns
      );
      
      // Calculate ROI metrics
      const roi = this.calculateROI(analytics);
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'analyze_campaign',
        campaignId,
        output: {
          metrics: analytics,
          patterns: patterns.length,
          recommendations: recommendations.length
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return {
        analytics,
        patterns,
        recommendations,
        roi
      };
    } catch (error) {
      logger.error('Analyst agent campaign analysis failed', { 
        campaignId, 
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'analyze_campaign',
        campaignId,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Prepare data for analysis
   */
  prepareAnalysisData(prospect, enrichmentData) {
    const prepared = {
      id: prospect.id,
      firstName: prospect.first_name,
      lastName: prospect.last_name,
      email: prospect.email,
      jobTitle: prospect.job_title,
      companyName: prospect.company_name,
      linkedinUrl: prospect.linkedin_url,
      location: prospect.location,
      timezone: prospect.timezone
    };
    
    // Merge enrichment data
    for (const enrichment of enrichmentData) {
      if (enrichment.source === 'brightdata' && enrichment.data) {
        prepared.identity = enrichment.data.identity;
        prepared.professional = enrichment.data.professional;
        prepared.social = enrichment.data.social;
        prepared.behavioral = enrichment.data.behavioral;
        prepared.companyContext = enrichment.data.companyContext;
      } else if (enrichment.source === 'company' && enrichment.data) {
        prepared.companyDetails = enrichment.data;
      } else if (enrichment.source === 'buyingSignals' && enrichment.data) {
        prepared.buyingSignals = enrichment.data;
      }
    }
    
    return prepared;
  }

  /**
   * Score prospect across multiple dimensions
   */
  async scoreProspect(analysisData, insights) {
    try {
      // Get enrichment data for scoring
      const enrichmentData = {
        recentActivity: analysisData.social?.recentPosts || [],
        companySignals: analysisData.buyingSignals || [],
        companyMetrics: analysisData.companyDetails?.metrics || {}
      };
      
      // Generate scores using LlamaIndex
      const scores = await llamaIndexService.scoreProspect(
        analysisData,
        enrichmentData
      );
      
      // Store scores in database
      await supabaseService.updateEngagementScores(
        analysisData.id,
        scores
      );
      
      return scores;
    } catch (error) {
      logger.error('Prospect scoring failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate personalization strategy
   */
  async generatePersonalizationStrategy(prospect, insights) {
    try {
      const strategy = await llamaIndexService.generatePersonalizationStrategy(
        prospect,
        insights
      );
      
      // Enhance with specific recommendations
      strategy.channelStrategy = this.determineChannelStrategy(insights);
      strategy.timingStrategy = this.determineTimingStrategy(insights);
      strategy.contentThemes = this.identifyContentThemes(insights);
      strategy.riskFactors = this.identifyRiskFactors(insights);
      
      return strategy;
    } catch (error) {
      logger.error('Personalization strategy generation failed', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Store analysis results
   */
  async storeAnalysisResults(prospectId, results) {
    try {
      // Store insights as enrichment data
      await supabaseService.storeEnrichmentData(
        prospectId,
        'analysis_insights',
        results.insights
      );
      
      // Store personalization strategy
      await supabaseService.storeEnrichmentData(
        prospectId,
        'personalization_strategy',
        results.personalizationStrategy
      );
      
      // Scores are already stored by scoreProspect method
      
      logger.info('Analysis results stored', { prospectId });
    } catch (error) {
      logger.error('Failed to store analysis results', { 
        prospectId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Identify campaign patterns
   */
  async identifyCampaignPatterns(campaignId) {
    try {
      // This would analyze interaction patterns, response times, etc.
      // For now, return sample patterns
      return [
        {
          type: 'response_time',
          pattern: 'Best responses within 24-48 hours of send',
          confidence: 0.85
        },
        {
          type: 'channel_preference',
          pattern: 'LinkedIn messages have 2x higher response rate',
          confidence: 0.75
        },
        {
          type: 'content_performance',
          pattern: 'Personalized pain point mentions increase engagement by 40%',
          confidence: 0.9
        }
      ];
    } catch (error) {
      logger.error('Pattern identification failed', { error: error.message });
      return [];
    }
  }

  /**
   * Generate campaign recommendations
   */
  async generateCampaignRecommendations(analytics, patterns) {
    const recommendations = [];
    
    // Low open rate recommendation
    if (analytics.rates?.open < 20) {
      recommendations.push({
        type: 'subject_line',
        priority: 'high',
        recommendation: 'Improve subject lines with personalization and urgency',
        expectedImpact: '+10-15% open rate'
      });
    }
    
    // Low click rate recommendation
    if (analytics.rates?.click < 5) {
      recommendations.push({
        type: 'content',
        priority: 'high',
        recommendation: 'Add clear CTAs and value propositions',
        expectedImpact: '+5-8% click rate'
      });
    }
    
    // Channel optimization
    patterns.forEach(pattern => {
      if (pattern.type === 'channel_preference' && pattern.confidence > 0.7) {
        recommendations.push({
          type: 'channel',
          priority: 'medium',
          recommendation: pattern.pattern,
          expectedImpact: 'Improved response rates'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Calculate ROI metrics
   */
  calculateROI(analytics) {
    const roi = {
      prospectsReached: analytics.totalProspects,
      engagementRate: 0,
      qualifiedLeads: 0,
      costPerEngagement: 0,
      estimatedValue: 0
    };
    
    if (analytics.messages.sent > 0) {
      roi.engagementRate = 
        ((analytics.messages.opened + analytics.messages.clicked + analytics.messages.replied) / 
        (analytics.messages.sent * 3)) * 100;
    }
    
    // Assume 10% of replies become qualified leads
    roi.qualifiedLeads = Math.round(analytics.messages.replied * 0.1);
    
    // Rough cost estimates
    const costPerMessage = 0.10; // $0.10 per message
    const totalCost = analytics.messages.total * costPerMessage;
    
    if (analytics.messages.replied > 0) {
      roi.costPerEngagement = totalCost / analytics.messages.replied;
    }
    
    // Estimate value based on qualified leads
    const avgDealSize = 50000; // $50k average deal
    const closeRate = 0.2; // 20% close rate
    roi.estimatedValue = roi.qualifiedLeads * avgDealSize * closeRate;
    
    return roi;
  }

  /**
   * Determine optimal channel strategy
   */
  determineChannelStrategy(insights) {
    const strategy = {
      primary: 'email',
      secondary: [],
      reasoning: ''
    };
    
    // Analyze communication preferences
    const commPref = insights.communicationStyle?.preference;
    
    if (commPref === 'linkedin') {
      strategy.primary = 'linkedin';
      strategy.secondary = ['email'];
      strategy.reasoning = 'High LinkedIn activity detected';
    } else if (insights.behavioral?.bestTimeToContact?.avoidTimes?.includes('email')) {
      strategy.primary = 'linkedin';
      strategy.secondary = ['calendar'];
      strategy.reasoning = 'Email fatigue detected, alternative channels recommended';
    }
    
    // Add calendar for high-intent prospects
    if (insights.buyingSignals?.strength > 0.7) {
      strategy.secondary.push('calendar');
      strategy.reasoning += '. High intent suggests direct meeting request viable';
    }
    
    return strategy;
  }

  /**
   * Determine optimal timing strategy
   */
  determineTimingStrategy(insights) {
    const behavioral = insights.behavioral || {};
    const bestTime = behavioral.bestTimeToContact || {};
    
    return {
      bestDays: bestTime.bestDays || ['Tuesday', 'Wednesday', 'Thursday'],
      bestHours: bestTime.bestHours || ['9AM-11AM', '2PM-4PM'],
      timezone: bestTime.timezone || 'America/New_York',
      avoidTimes: bestTime.avoidTimes || ['Monday morning', 'Friday afternoon'],
      sequenceTiming: {
        initialDelay: 0,
        followUp1: 3, // days
        followUp2: 7,
        followUp3: 14
      }
    };
  }

  /**
   * Identify content themes
   */
  identifyContentThemes(insights) {
    const themes = [];
    
    // Based on pain points
    if (insights.painPoints?.length > 0) {
      insights.painPoints.forEach(painPoint => {
        themes.push({
          type: 'pain_point',
          topic: painPoint.description,
          priority: painPoint.severity || 'medium',
          messagingAngle: `Solution for ${painPoint.description}`
        });
      });
    }
    
    // Based on interests
    if (insights.behavioral?.interests?.length > 0) {
      insights.behavioral.interests.slice(0, 3).forEach(interest => {
        themes.push({
          type: 'interest',
          topic: interest,
          priority: 'low',
          messagingAngle: `Insights on ${interest}`
        });
      });
    }
    
    // Based on company context
    if (insights.companyContext?.recentNews?.length > 0) {
      themes.push({
        type: 'company_event',
        topic: insights.companyContext.recentNews[0],
        priority: 'high',
        messagingAngle: 'Congratulations or support for recent developments'
      });
    }
    
    return themes;
  }

  /**
   * Identify risk factors
   */
  identifyRiskFactors(insights) {
    const risks = [];
    
    // Low engagement probability
    if (insights.psychologicalProfile?.personalityType === 'analytical') {
      risks.push({
        factor: 'analytical_personality',
        impact: 'May require more data and proof points',
        mitigation: 'Include case studies and ROI data'
      });
    }
    
    // Timing risks
    if (insights.buyingSignals?.timeframe === 'long_term') {
      risks.push({
        factor: 'long_sales_cycle',
        impact: 'May not be ready for immediate engagement',
        mitigation: 'Focus on education and relationship building'
      });
    }
    
    // Competition
    if (insights.companyContext?.technologies?.includes('competitor_product')) {
      risks.push({
        factor: 'existing_solution',
        impact: 'Already using competitive solution',
        mitigation: 'Focus on differentiation and switching benefits'
      });
    }
    
    return risks;
  }

  /**
   * Batch analyze multiple prospects
   */
  async batchAnalyzeProspects(prospectIds) {
    const results = [];
    const batchSize = 5; // Process 5 at a time
    
    for (let i = 0; i < prospectIds.length; i += batchSize) {
      const batch = prospectIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (prospectId) => {
        try {
          const result = await this.analyzeProspect(prospectId);
          return { prospectId, status: 'success', result };
        } catch (error) {
          logger.error('Batch analysis failed for prospect', {
            prospectId,
            error: error.message
          });
          return { prospectId, status: 'failed', error: error.message };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches to avoid overwhelming the API
      if (i + batchSize < prospectIds.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }
}

export default new AnalystAgent();
