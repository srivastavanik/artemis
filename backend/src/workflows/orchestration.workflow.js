const { Workflow } = require('@mastra/core');
const { EnrichmentWorkflow } = require('./enrichment.workflow');
const { ScoringWorkflow } = require('./scoring.workflow');
const { ExecutorAgent } = require('../agents/executor.agent');
const { StrategistAgent } = require('../agents/strategist.agent');
const { SupabaseService } = require('../services/supabase.service');
const logger = require('../utils/logger');

/**
 * Master Orchestration Workflow - Coordinates all workflows and agents
 */
class OrchestrationWorkflow extends Workflow {
  constructor() {
    super('orchestration-workflow');
    this.enrichmentWorkflow = new EnrichmentWorkflow();
    this.scoringWorkflow = new ScoringWorkflow();
    this.executor = new ExecutorAgent();
    this.strategist = new StrategistAgent();
    this.supabase = new SupabaseService();
  }

  async execute(context) {
    const { action, data } = context;
    
    try {
      logger.info(`Starting orchestration workflow: ${action}`, { data });
      
      switch (action) {
        case 'process_new_prospect':
          return await this.processNewProspect(data);
          
        case 'update_prospect':
          return await this.updateProspect(data);
          
        case 'launch_campaign':
          return await this.launchCampaign(data);
          
        case 'bulk_process':
          return await this.bulkProcessProspects(data);
          
        case 'monitor_campaigns':
          return await this.monitorCampaigns(data);
          
        case 'optimize_performance':
          return await this.optimizePerformance(data);
          
        default:
          throw new Error(`Unknown orchestration action: ${action}`);
      }
    } catch (error) {
      logger.error('Orchestration workflow failed:', error);
      throw error;
    }
  }

  async processNewProspect(data) {
    const { prospect } = data;
    const results = {
      prospectId: prospect.id,
      stages: {},
      success: true
    };
    
    try {
      // Stage 1: Enrichment
      logger.info(`Stage 1: Enriching prospect ${prospect.id}`);
      const enrichmentResult = await this.enrichmentWorkflow.execute({
        prospect,
        sources: ['brightdata', 'linkedin', 'web']
      });
      results.stages.enrichment = enrichmentResult;
      
      // Stage 2: Scoring
      logger.info(`Stage 2: Scoring prospect ${prospect.id}`);
      const scoringResult = await this.scoringWorkflow.execute({
        prospectId: prospect.id,
        enrichmentData: enrichmentResult.enrichedData
      });
      results.stages.scoring = scoringResult;
      
      // Stage 3: Strategy Development
      if (scoringResult.scores.overall >= 50) {
        logger.info(`Stage 3: Developing strategy for prospect ${prospect.id}`);
        const strategyResult = await this.developStrategy({
          prospect,
          enrichmentData: enrichmentResult.enrichedData,
          scores: scoringResult.scores,
          insights: scoringResult.insights
        });
        results.stages.strategy = strategyResult;
        
        // Stage 4: Auto-launch campaign for high-score prospects
        if (scoringResult.scores.overall >= 80 && scoringResult.scores.urgency >= 70) {
          logger.info(`Stage 4: Auto-launching campaign for high-value prospect ${prospect.id}`);
          const campaignResult = await this.autoLaunchCampaign({
            prospect,
            strategy: strategyResult,
            priority: 'high'
          });
          results.stages.campaign = campaignResult;
        }
      }
      
      // Update prospect processing status
      await this.updateProcessingStatus(prospect.id, results);
      
      return results;
      
    } catch (error) {
      results.success = false;
      results.error = error.message;
      await this.handleProcessingError(prospect.id, error);
      throw error;
    }
  }

  async updateProspect(data) {
    const { prospectId, changes } = data;
    
    // Re-run relevant workflows based on what changed
    const workflows = [];
    
    if (changes.includes('company') || changes.includes('contact')) {
      workflows.push(this.enrichmentWorkflow.execute({
        prospect: await this.supabase.getProspect(prospectId),
        sources: ['brightdata', 'web']
      }));
    }
    
    if (changes.includes('enrichment') || changes.includes('signals')) {
      const enrichmentData = await this.supabase.getEnrichmentData(prospectId);
      workflows.push(this.scoringWorkflow.execute({
        prospectId,
        enrichmentData
      }));
    }
    
    const results = await Promise.all(workflows);
    
    // Re-evaluate campaign strategy if scores changed significantly
    const latestScores = await this.supabase.getEngagementScore(prospectId);
    if (latestScores && this.hasSignificantScoreChange(latestScores)) {
      await this.reevaluateCampaignStrategy(prospectId);
    }
    
    return { prospectId, updates: results };
  }

  async launchCampaign(data) {
    const { campaignId, prospectIds, strategy, schedule } = data;
    
    try {
      // Validate campaign data
      const campaign = await this.supabase.getCampaign(campaignId);
      if (!campaign) {
        throw new Error(`Campaign ${campaignId} not found`);
      }
      
      // Process each prospect in the campaign
      const results = await Promise.all(
        prospectIds.map(async (prospectId) => {
          const prospect = await this.supabase.getProspect(prospectId);
          const enrichmentData = await this.supabase.getEnrichmentData(prospectId);
          const scores = await this.supabase.getEngagementScore(prospectId);
          
          // Generate personalized content
          const personalizedContent = await this.strategist.personalizeContent({
            template: campaign.template,
            prospect,
            enrichmentData,
            scores
          });
          
          // Schedule messages through executor
          const executionResult = await this.executor.executeCampaign({
            campaignId,
            prospectId,
            content: personalizedContent,
            channels: strategy.channels,
            schedule
          });
          
          return {
            prospectId,
            status: 'scheduled',
            messages: executionResult.messages
          };
        })
      );
      
      // Update campaign status
      await this.supabase.updateCampaign(campaignId, {
        status: 'active',
        launched_at: new Date().toISOString()
      });
      
      return {
        campaignId,
        prospectsProcessed: results.length,
        results
      };
      
    } catch (error) {
      logger.error(`Failed to launch campaign ${campaignId}:`, error);
      throw error;
    }
  }

  async bulkProcessProspects(data) {
    const { prospectIds, parallel = 5 } = data;
    const results = [];
    
    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < prospectIds.length; i += parallel) {
      const batch = prospectIds.slice(i, i + parallel);
      
      const batchResults = await Promise.allSettled(
        batch.map(async (prospectId) => {
          const prospect = await this.supabase.getProspect(prospectId);
          return this.processNewProspect({ prospect });
        })
      );
      
      results.push(...batchResults);
      
      // Add delay between batches
      if (i + parallel < prospectIds.length) {
        await this.delay(2000); // 2 second delay
      }
    }
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    logger.info(`Bulk processing completed: ${successful} successful, ${failed} failed`);
    
    return {
      total: prospectIds.length,
      successful,
      failed,
      results
    };
  }

  async monitorCampaigns(data) {
    const activeCampaigns = await this.supabase.getActiveCampaigns();
    const monitoringResults = [];
    
    for (const campaign of activeCampaigns) {
      try {
        // Get campaign metrics
        const metrics = await this.getCampaignMetrics(campaign.id);
        
        // Check for optimization opportunities
        const optimizations = await this.identifyOptimizations(campaign, metrics);
        
        // Apply automatic optimizations
        if (optimizations.length > 0) {
          await this.applyOptimizations(campaign.id, optimizations);
        }
        
        // Check for completion
        if (this.isCampaignComplete(campaign, metrics)) {
          await this.completeCampaign(campaign.id, metrics);
        }
        
        monitoringResults.push({
          campaignId: campaign.id,
          status: 'monitored',
          metrics,
          optimizations
        });
        
      } catch (error) {
        logger.error(`Failed to monitor campaign ${campaign.id}:`, error);
        monitoringResults.push({
          campaignId: campaign.id,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return {
      campaignsMonitored: activeCampaigns.length,
      results: monitoringResults
    };
  }

  async optimizePerformance(data) {
    const { timeframe = '7d' } = data;
    
    // Analyze overall system performance
    const performanceMetrics = await this.analyzeSystemPerformance(timeframe);
    
    // Identify bottlenecks and optimization opportunities
    const optimizations = {
      workflows: [],
      agents: [],
      campaigns: []
    };
    
    // Workflow optimizations
    if (performanceMetrics.workflows.avgProcessingTime > 30000) { // 30 seconds
      optimizations.workflows.push({
        type: 'reduce_enrichment_sources',
        reason: 'High processing time',
        action: 'Limit to essential data sources'
      });
    }
    
    // Agent optimizations
    if (performanceMetrics.agents.errorRate > 0.1) { // 10% error rate
      optimizations.agents.push({
        type: 'improve_error_handling',
        reason: 'High error rate',
        action: 'Add retry logic and fallbacks'
      });
    }
    
    // Campaign optimizations
    if (performanceMetrics.campaigns.avgResponseRate < 0.05) { // 5% response rate
      optimizations.campaigns.push({
        type: 'improve_personalization',
        reason: 'Low response rate',
        action: 'Enhance content personalization algorithms'
      });
    }
    
    // Apply optimizations
    await this.applySystemOptimizations(optimizations);
    
    return {
      performanceMetrics,
      optimizations,
      applied: true
    };
  }

  async developStrategy(data) {
    const { prospect, enrichmentData, scores, insights } = data;
    
    // Use strategist agent to develop comprehensive strategy
    const strategy = await this.strategist.developStrategy({
      prospect,
      enrichmentData,
      scores,
      insights
    });
    
    // Enhance strategy with additional context
    strategy.timing = this.determineOptimalTiming(scores, insights);
    strategy.channels = this.selectOptimalChannels(prospect, enrichmentData);
    strategy.messaging = await this.craftMessaging(prospect, insights, strategy);
    
    // Store strategy for future reference
    await this.supabase.createStrategy({
      prospect_id: prospect.id,
      strategy,
      created_at: new Date().toISOString()
    });
    
    return strategy;
  }

  async autoLaunchCampaign(data) {
    const { prospect, strategy, priority } = data;
    
    // Create automated campaign
    const campaign = await this.supabase.createCampaign({
      name: `Auto-campaign for ${prospect.company_name}`,
      type: 'automated',
      status: 'scheduled',
      target_audience: { prospects: [prospect.id] },
      strategy,
      priority,
      created_at: new Date().toISOString()
    });
    
    // Launch immediately for high-priority prospects
    if (priority === 'high') {
      await this.launchCampaign({
        campaignId: campaign.id,
        prospectIds: [prospect.id],
        strategy,
        schedule: { immediate: true }
      });
    }
    
    return campaign;
  }

  async getCampaignMetrics(campaignId) {
    const messages = await this.supabase.getCampaignMessages(campaignId);
    const interactions = await this.supabase.getCampaignInteractions(campaignId);
    
    const metrics = {
      sent: messages.filter(m => m.status === 'sent').length,
      delivered: messages.filter(m => m.status === 'delivered').length,
      opened: interactions.filter(i => i.type === 'opened').length,
      clicked: interactions.filter(i => i.type === 'clicked').length,
      replied: interactions.filter(i => i.type === 'replied').length,
      converted: interactions.filter(i => i.type === 'converted').length
    };
    
    metrics.deliveryRate = metrics.sent > 0 ? metrics.delivered / metrics.sent : 0;
    metrics.openRate = metrics.delivered > 0 ? metrics.opened / metrics.delivered : 0;
    metrics.clickRate = metrics.opened > 0 ? metrics.clicked / metrics.opened : 0;
    metrics.replyRate = metrics.delivered > 0 ? metrics.replied / metrics.delivered : 0;
    metrics.conversionRate = metrics.delivered > 0 ? metrics.converted / metrics.delivered : 0;
    
    return metrics;
  }

  async identifyOptimizations(campaign, metrics) {
    const optimizations = [];
    
    // Low delivery rate - check email validity
    if (metrics.deliveryRate < 0.9) {
      optimizations.push({
        type: 'verify_emails',
        reason: 'Low delivery rate',
        action: 'Verify and clean email list'
      });
    }
    
    // Low open rate - optimize subject lines
    if (metrics.openRate < 0.15) {
      optimizations.push({
        type: 'optimize_subject',
        reason: 'Low open rate',
        action: 'A/B test subject lines'
      });
    }
    
    // Low click rate - improve content
    if (metrics.clickRate < 0.02) {
      optimizations.push({
        type: 'improve_content',
        reason: 'Low click rate',
        action: 'Enhance value proposition and CTAs'
      });
    }
    
    return optimizations;
  }

  async applyOptimizations(campaignId, optimizations) {
    for (const optimization of optimizations) {
      switch (optimization.type) {
        case 'verify_emails':
          await this.verifyEmailsForCampaign(campaignId);
          break;
        case 'optimize_subject':
          await this.createSubjectLineVariants(campaignId);
          break;
        case 'improve_content':
          await this.enhanceCampaignContent(campaignId);
          break;
      }
    }
  }

  isCampaignComplete(campaign, metrics) {
    // Check if campaign has reached its goals or time limit
    const daysSinceLaunch = this.daysSince(campaign.launched_at);
    const hasReachedTimeLimit = daysSinceLaunch > 30;
    const hasReachedGoals = metrics.conversionRate >= (campaign.goals?.targetConversionRate || 0.05);
    const allMessagesSent = metrics.sent >= campaign.target_audience.prospects.length;
    
    return hasReachedTimeLimit || (hasReachedGoals && allMessagesSent);
  }

  async completeCampaign(campaignId, finalMetrics) {
    await this.supabase.updateCampaign(campaignId, {
      status: 'completed',
      completed_at: new Date().toISOString(),
      final_metrics: finalMetrics
    });
    
    // Generate campaign report
    await this.generateCampaignReport(campaignId, finalMetrics);
  }

  hasSignificantScoreChange(scores) {
    // Define threshold for significant change
    const threshold = 15;
    const previousScores = scores.previous || {};
    
    return Math.abs(scores.overall - (previousScores.overall || 0)) > threshold;
  }

  async reevaluateCampaignStrategy(prospectId) {
    // Re-run strategy development for active campaigns
    const activeCampaigns = await this.supabase.getProspectActiveCampaigns(prospectId);
    
    for (const campaign of activeCampaigns) {
      const newStrategy = await this.developStrategy({
        prospect: await this.supabase.getProspect(prospectId),
        enrichmentData: await this.supabase.getEnrichmentData(prospectId),
        scores: await this.supabase.getEngagementScore(prospectId),
        insights: [] // Would fetch latest insights
      });
      
      // Update campaign with new strategy
      await this.supabase.updateCampaignStrategy(campaign.id, newStrategy);
    }
  }

  determineOptimalTiming(scores, insights) {
    const timing = {
      immediate: scores.urgency > 80,
      bestDays: ['Tuesday', 'Wednesday', 'Thursday'],
      bestHours: [10, 11, 14, 15], // 10-11 AM, 2-3 PM
      frequency: scores.overall > 70 ? 'aggressive' : 'moderate'
    };
    
    // Adjust based on insights
    insights.forEach(insight => {
      if (insight.type === 'timing') {
        // Parse and apply timing recommendations from insights
      }
    });
    
    return timing;
  }

  selectOptimalChannels(prospect, enrichmentData) {
    const channels = [];
    
    // Email is always primary
    if (prospect.email) {
      channels.push({
        type: 'email',
        priority: 1,
        address: prospect.email
      });
    }
    
    // LinkedIn if available
    if (enrichmentData.socialProfiles?.linkedin) {
      channels.push({
        type: 'linkedin',
        priority: 2,
        profile: enrichmentData.socialProfiles.linkedin.url
      });
    }
    
    // Phone for high-value prospects
    if (prospect.phone && prospect.lead_score > 80) {
      channels.push({
        type: 'phone',
        priority: 3,
        number: prospect.phone
      });
    }
    
    return channels;
  }

  async craftMessaging(prospect, insights, strategy) {
    // Base messaging framework
    const messaging = {
      tone: strategy.approach === 'executive' ? 'professional' : 'conversational',
      length: strategy.approach === 'executive' ? 'concise' : 'detailed',
      focus: [],
      painPoints: [],
      valueProps: []
    };
    
    // Extract key messaging points from insights
    insights.forEach(insight => {
      switch (insight.type) {
        case 'buying_intent':
          messaging.focus.push('roi');
          messaging.painPoints.push('efficiency');
          break;
        case 'competitor_consideration':
          messaging.focus.push('differentiation');
          messaging.valueProps.push('unique_features');
          break;
        case 'high_fit':
          messaging.focus.push('partnership');
          messaging.valueProps.push('strategic_alignment');
          break;
      }
    });
    
    return messaging;
  }

  async updateProcessingStatus(prospectId, results) {
    await this.supabase.updateProspect(prospectId, {
      processing_status: 'completed',
      last_processed: new Date().toISOString(),
      processing_results: results
    });
  }

  async handleProcessingError(prospectId, error) {
    await this.supabase.updateProspect(prospectId, {
      processing_status: 'error',
      processing_error: error.message,
      last_processed: new Date().toISOString()
    });
    
    // Log error for monitoring
    await this.supabase.createAgentLog({
      agent_type: 'orchestrator',
      action: 'processing_error',
      prospect_id: prospectId,
      details: { error: error.message, stack: error.stack },
      created_at: new Date().toISOString()
    });
  }

  async analyzeSystemPerformance(timeframe) {
    // This would query actual metrics from the database
    // Placeholder implementation
    return {
      workflows: {
        avgProcessingTime: 25000,
        successRate: 0.92,
        throughput: 100
      },
      agents: {
        avgResponseTime: 2000,
        errorRate: 0.05,
        utilization: 0.75
      },
      campaigns: {
        avgResponseRate: 0.08,
        avgConversionRate: 0.03,
        activeCount: 25
      }
    };
  }

  async applySystemOptimizations(optimizations) {
    // Apply each optimization
    // This would implement actual optimization logic
    logger.info('Applying system optimizations:', optimizations);
  }

  async generateCampaignReport(campaignId, metrics) {
    // Generate comprehensive campaign report
    const report = {
      campaignId,
      metrics,
      insights: await this.generateCampaignInsights(campaignId, metrics),
      recommendations: await this.generateCampaignRecommendations(metrics),
      generated_at: new Date().toISOString()
    };
    
    // Store report
    await this.supabase.createCampaignReport(report);
    
    return report;
  }

  async generateCampaignInsights(campaignId, metrics) {
    const insights = [];
    
    if (metrics.openRate > 0.25) {
      insights.push('Strong subject line performance');
    }
    if (metrics.clickRate > 0.05) {
      insights.push('Engaging content that drives action');
    }
    if (metrics.replyRate > 0.1) {
      insights.push('Message resonates with audience');
    }
    
    return insights;
  }

  async generateCampaignRecommendations(metrics) {
    const recommendations = [];
    
    if (metrics.openRate < 0.15) {
      recommendations.push('Test more compelling subject lines');
    }
    if (metrics.clickRate < 0.02) {
      recommendations.push('Strengthen call-to-action');
    }
    if (metrics.conversionRate < 0.01) {
      recommendations.push('Review targeting criteria');
    }
    
    return recommendations;
  }

  daysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = { OrchestrationWorkflow };
