import arcadeService from '../services/arcade.service.js';
import supabaseService from '../services/supabase.service.js';
import llamaIndexService from '../services/llamaindex.service.js';
import { logger } from '../utils/logger.js';

class ExecutorAgent {
  constructor() {
    this.name = 'executor';
    this.activeCampaigns = new Map();
  }

  /**
   * Execute campaign for prospects
   */
  async executeCampaign(campaign, prospects) {
    const startTime = Date.now();
    
    try {
      logger.info('Executor agent starting campaign', { 
        campaignId: campaign.id,
        prospectCount: prospects.length 
      });
      
      // Create campaign in Arcade
      const automationResult = await arcadeService.createCampaign(
        campaign,
        prospects
      );
      
      // Store campaign-prospect assignments
      await supabaseService.assignProspectsToCampaign(
        campaign.id,
        prospects.map(p => p.id)
      );
      
      // Generate and schedule initial messages
      const messages = await this.generateInitialMessages(
        campaign,
        prospects
      );
      
      // Schedule messages in batches
      const scheduledMessages = await this.scheduleMessages(
        messages,
        campaign
      );
      
      // Set up monitoring
      this.activeCampaigns.set(campaign.id, {
        automationId: automationResult.automationId,
        startedAt: new Date(),
        prospectCount: prospects.length,
        status: 'active'
      });
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'execute_campaign',
        campaignId: campaign.id,
        output: {
          automationId: automationResult.automationId,
          messagesScheduled: scheduledMessages.length
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return {
        campaignId: campaign.id,
        automationId: automationResult.automationId,
        status: 'executing',
        messagesScheduled: scheduledMessages.length,
        expectedCompletion: this.calculateExpectedCompletion(campaign)
      };
    } catch (error) {
      logger.error('Executor agent campaign execution failed', { 
        campaignId: campaign.id,
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'execute_campaign',
        campaignId: campaign.id,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Handle prospect engagement
   */
  async handleEngagement(prospectId, engagementData) {
    const startTime = Date.now();
    
    try {
      logger.info('Executor agent handling engagement', { 
        prospectId,
        type: engagementData.type 
      });
      
      // Record interaction
      const interaction = await supabaseService.recordInteraction({
        prospectId,
        messageId: engagementData.messageId,
        type: engagementData.type,
        channel: engagementData.channel,
        data: engagementData.data,
        sentiment: engagementData.sentiment
      });
      
      // Update message status if needed
      if (engagementData.messageId) {
        await this.updateMessageStatus(
          engagementData.messageId,
          engagementData.type
        );
      }
      
      // Determine next action
      const nextAction = await this.determineNextAction(
        prospectId,
        engagementData
      );
      
      // Execute next action
      if (nextAction) {
        await this.executeNextAction(prospectId, nextAction);
      }
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'handle_engagement',
        prospectId,
        output: {
          interactionType: engagementData.type,
          nextAction: nextAction?.type || 'none'
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return {
        interaction,
        nextAction
      };
    } catch (error) {
      logger.error('Executor agent engagement handling failed', { 
        prospectId,
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'handle_engagement',
        prospectId,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Monitor campaign progress
   */
  async monitorCampaignProgress(campaignId) {
    try {
      logger.info('Executor agent monitoring campaign', { campaignId });
      
      const campaignState = this.activeCampaigns.get(campaignId);
      if (!campaignState) {
        throw new Error('Campaign not found in active campaigns');
      }
      
      // Get campaign stats from Arcade
      const stats = await arcadeService.getCampaignStats(
        campaignState.automationId
      );
      
      // Get detailed analytics from database
      const analytics = await supabaseService.getCampaignAnalytics(campaignId);
      
      // Check for issues
      const issues = this.identifyCampaignIssues(stats, analytics);
      
      // Generate progress report
      const progressReport = {
        campaignId,
        status: campaignState.status,
        startedAt: campaignState.startedAt,
        runtime: Date.now() - campaignState.startedAt.getTime(),
        stats,
        analytics,
        issues,
        recommendations: this.generateProgressRecommendations(stats, issues)
      };
      
      return progressReport;
    } catch (error) {
      logger.error('Campaign monitoring failed', { 
        campaignId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Pause campaign execution
   */
  async pauseCampaign(campaignId) {
    try {
      logger.info('Executor agent pausing campaign', { campaignId });
      
      const campaignState = this.activeCampaigns.get(campaignId);
      if (!campaignState) {
        throw new Error('Campaign not found');
      }
      
      // Pause in Arcade
      await arcadeService.pauseCampaign(campaignState.automationId);
      
      // Update local state
      campaignState.status = 'paused';
      campaignState.pausedAt = new Date();
      
      // Update database
      await supabaseService.client
        .from('outreach_campaigns')
        .update({ status: 'paused' })
        .eq('id', campaignId);
      
      return { status: 'paused' };
    } catch (error) {
      logger.error('Campaign pause failed', { 
        campaignId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Resume campaign execution
   */
  async resumeCampaign(campaignId) {
    try {
      logger.info('Executor agent resuming campaign', { campaignId });
      
      const campaignState = this.activeCampaigns.get(campaignId);
      if (!campaignState) {
        throw new Error('Campaign not found');
      }
      
      // Resume in Arcade
      await arcadeService.resumeCampaign(campaignState.automationId);
      
      // Update local state
      campaignState.status = 'active';
      delete campaignState.pausedAt;
      
      // Update database
      await supabaseService.client
        .from('outreach_campaigns')
        .update({ status: 'active' })
        .eq('id', campaignId);
      
      return { status: 'resumed' };
    } catch (error) {
      logger.error('Campaign resume failed', { 
        campaignId,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Generate initial messages for prospects
   */
  async generateInitialMessages(campaign, prospects) {
    const messages = [];
    
    for (const prospect of prospects) {
      try {
        // Get personalization data
        const personalizationData = await this.getPersonalizationData(
          prospect,
          campaign
        );
        
        // Generate message for each channel
        for (const channel of campaign.channels) {
          const sequence = campaign.messageSequences[channel];
          if (!sequence || sequence.length === 0) continue;
          
          const firstMessage = sequence[0];
          
          // Generate personalized content
          const personalizedContent = await this.personalizeMessage(
            firstMessage,
            prospect,
            personalizationData
          );
          
          messages.push({
            prospectId: prospect.id,
            campaignId: campaign.id,
            channel,
            subject: personalizedContent.subject,
            content: personalizedContent.content,
            scheduledFor: this.calculateScheduledTime(
              firstMessage.waitDays,
              prospect.timezone
            ),
            personalizationData,
            sequencePosition: 1
          });
        }
      } catch (error) {
        logger.error('Failed to generate messages for prospect', {
          prospectId: prospect.id,
          error: error.message
        });
      }
    }
    
    return messages;
  }

  /**
   * Get personalization data for prospect
   */
  async getPersonalizationData(prospect, campaign) {
    // Get enrichment data
    const enrichmentData = await supabaseService.getEnrichmentData(prospect.id);
    
    // Extract key personalization fields
    const personalization = {
      first_name: prospect.first_name,
      last_name: prospect.last_name,
      company_name: prospect.company_name,
      job_title: prospect.job_title,
      industry: prospect.industry || 'your industry',
      location: prospect.location,
      sender_name: campaign.senderName || 'Your Sales Team'
    };
    
    // Add enrichment-based personalization
    for (const enrichment of enrichmentData) {
      if (enrichment.source === 'brightdata' && enrichment.data) {
        const data = enrichment.data;
        
        // Recent achievement
        if (data.companyContext?.recentNews?.length > 0) {
          personalization.recent_achievement = data.companyContext.recentNews[0];
        }
        
        // Pain points
        if (data.behavioral?.interests?.length > 0) {
          personalization.pain_point = this.inferPainPoint(data.behavioral.interests);
        }
        
        // Technologies
        if (data.companyContext?.technologies?.length > 0) {
          personalization.current_tech = data.companyContext.technologies[0];
        }
      }
      
      if (enrichment.source === 'analysis_insights' && enrichment.data) {
        // Use AI-generated insights
        if (enrichment.data.painPoints?.length > 0) {
          personalization.pain_point = enrichment.data.painPoints[0].description;
        }
      }
      
      if (enrichment.source === 'personalization_strategy' && enrichment.data) {
        // Use personalization strategy
        personalization.value_prop = enrichment.data.keyMessages?.[0];
      }
    }
    
    // Add defaults for missing fields
    personalization.pain_point = personalization.pain_point || 'operational efficiency';
    personalization.recent_achievement = personalization.recent_achievement || 'continued growth';
    personalization.challenge = personalization.challenge || 'scaling operations';
    personalization.benefit = personalization.benefit || 'improved efficiency';
    personalization.key_metric = personalization.key_metric || '30%';
    personalization.timeframe = personalization.timeframe || '90 days';
    personalization.percentage = personalization.percentage || '40';
    personalization.secondary_benefit = personalization.secondary_benefit || 'team productivity';
    personalization.similar_company = personalization.similar_company || 'a leading company';
    
    return personalization;
  }

  /**
   * Personalize message content
   */
  async personalizeMessage(messageTemplate, prospect, personalizationData) {
    let subject = messageTemplate.subject || '';
    let content = messageTemplate.bodyTemplate || messageTemplate.content || '';
    
    // Apply personalization
    subject = arcadeService.personalizeContent(subject, personalizationData);
    content = arcadeService.personalizeContent(content, personalizationData);
    
    // AI enhancement for deeper personalization
    if (messageTemplate.abTest?.enabled) {
      // Apply A/B test variant
      const variant = Math.random() < 0.5 ? 'A' : 'B';
      if (variant === 'B' && messageTemplate.abTest.variants.includes('pain_focused')) {
        // Adjust content to be more pain-focused
        content = await this.adjustContentFocus(content, 'pain', personalizationData);
      }
    }
    
    return { subject, content };
  }

  /**
   * Schedule messages
   */
  async scheduleMessages(messages, campaign) {
    const scheduled = [];
    const batchSize = 10; // Schedule in batches
    
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (message) => {
        try {
          // Store message in database
          const dbMessage = await supabaseService.createMessage(message);
          
          // Schedule with Arcade based on channel
          let result;
          if (message.channel === 'email') {
            result = await arcadeService.sendEmail(
              { 
                id: message.prospectId,
                email: await this.getProspectEmail(message.prospectId),
                ...message.personalizationData 
              },
              {
                id: dbMessage.id,
                subject: message.subject,
                content: message.content,
                campaignId: message.campaignId
              },
              {
                scheduledFor: message.scheduledFor
              }
            );
          } else if (message.channel === 'linkedin') {
            const prospect = await supabaseService.getProspectById(message.prospectId);
            result = await arcadeService.sendLinkedInMessage(
              prospect,
              {
                id: dbMessage.id,
                content: message.content
              }
            );
          }
          
          scheduled.push({
            messageId: dbMessage.id,
            status: 'scheduled',
            channel: message.channel
          });
          
          return result;
        } catch (error) {
          logger.error('Failed to schedule message', {
            prospectId: message.prospectId,
            channel: message.channel,
            error: error.message
          });
          return null;
        }
      });
      
      await Promise.all(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    return scheduled;
  }

  /**
   * Update message status
   */
  async updateMessageStatus(messageId, engagementType) {
    const statusMap = {
      'email_open': 'opened',
      'link_click': 'clicked',
      'email_reply': 'replied',
      'positive_reply': 'replied',
      'email_bounce': 'bounced'
    };
    
    const status = statusMap[engagementType];
    if (status) {
      await supabaseService.updateMessageStatus(messageId, status);
    }
  }

  /**
   * Determine next action based on engagement
   */
  async determineNextAction(prospectId, engagementData) {
    // High-value engagements trigger immediate actions
    if (engagementData.type === 'positive_reply' || 
        engagementData.type === 'meeting_request') {
      return {
        type: 'notify_sales',
        priority: 'high',
        data: {
          prospectId,
          engagement: engagementData,
          suggestedAction: 'Immediate follow-up recommended'
        }
      };
    }
    
    // Link clicks suggest interest
    if (engagementData.type === 'link_click') {
      return {
        type: 'accelerate_sequence',
        data: {
          prospectId,
          reason: 'High engagement detected'
        }
      };
    }
    
    // Multiple opens without clicks might need different content
    if (engagementData.type === 'email_open' && engagementData.openCount > 3) {
      return {
        type: 'adjust_messaging',
        data: {
          prospectId,
          recommendation: 'Consider more direct CTA'
        }
      };
    }
    
    return null;
  }

  /**
   * Execute next action
   */
  async executeNextAction(prospectId, action) {
    switch (action.type) {
      case 'notify_sales':
        // In a real system, this would notify the sales team
        logger.info('Sales notification triggered', {
          prospectId,
          priority: action.priority
        });
        break;
        
      case 'accelerate_sequence':
        // Reduce wait time for next message
        logger.info('Accelerating sequence for prospect', { prospectId });
        break;
        
      case 'adjust_messaging':
        // Flag for message adjustment
        logger.info('Messaging adjustment recommended', { 
          prospectId,
          recommendation: action.data.recommendation 
        });
        break;
    }
  }

  /**
   * Calculate scheduled time
   */
  calculateScheduledTime(waitDays, timezone) {
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + waitDays);
    
    // Adjust for business hours in prospect's timezone
    // For now, schedule for 10 AM in their timezone
    scheduled.setHours(10, 0, 0, 0);
    
    return scheduled;
  }

  /**
   * Calculate expected campaign completion
   */
  calculateExpectedCompletion(campaign) {
    let maxDays = 0;
    
    // Find the longest sequence
    Object.values(campaign.messageSequences).forEach(sequence => {
      const sequenceDays = sequence.reduce((total, message) => 
        total + (message.waitDays || 0), 0
      );
      maxDays = Math.max(maxDays, sequenceDays);
    });
    
    const completion = new Date();
    completion.setDate(completion.getDate() + maxDays);
    
    return completion;
  }

  /**
   * Identify campaign issues
   */
  identifyCampaignIssues(stats, analytics) {
    const issues = [];
    
    // Low delivery rate
    if (stats.sent > 0 && (stats.delivered / stats.sent) < 0.95) {
      issues.push({
        type: 'delivery',
        severity: 'high',
        description: 'Low email delivery rate detected',
        recommendation: 'Check email validation and sender reputation'
      });
    }
    
    // Low open rate
    if (stats.delivered > 20 && stats.openRate < 0.15) {
      issues.push({
        type: 'engagement',
        severity: 'medium',
        description: 'Below average open rates',
        recommendation: 'Review subject lines and sender name'
      });
    }
    
    // Low click rate
    if (stats.opened > 20 && stats.clickRate < 0.02) {
      issues.push({
        type: 'content',
        severity: 'medium',
        description: 'Low click-through rates',
        recommendation: 'Improve CTAs and value proposition'
      });
    }
    
    return issues;
  }

  /**
   * Generate progress recommendations
   */
  generateProgressRecommendations(stats, issues) {
    const recommendations = [];
    
    // Based on stats
    if (stats.replyRate > 0.1) {
      recommendations.push({
        type: 'positive',
        message: 'High reply rate - consider expanding similar messaging'
      });
    }
    
    // Based on issues
    issues.forEach(issue => {
      if (issue.recommendation) {
        recommendations.push({
          type: 'improvement',
          priority: issue.severity,
          message: issue.recommendation
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Helper methods
   */
  async getProspectEmail(prospectId) {
    const prospect = await supabaseService.getProspectById(prospectId);
    return prospect.email;
  }

  inferPainPoint(interests) {
    // Simple inference based on interests
    if (interests.includes('efficiency')) return 'operational inefficiency';
    if (interests.includes('growth')) return 'scaling challenges';
    if (interests.includes('automation')) return 'manual processes';
    return 'business optimization';
  }

  async adjustContentFocus(content, focus, personalizationData) {
    // This would use AI to adjust content focus
    // For now, return original content
    return content;
  }

  /**
   * Handle webhook from Arcade
   */
  async handleWebhook(event) {
    try {
      const result = await arcadeService.handleWebhook(event);
      
      // Process based on event type
      if (event.type === 'email_replied' || event.type === 'positive_reply') {
        await this.handleEngagement(event.prospect_id, {
          type: event.type,
          messageId: event.message_id,
          channel: 'email',
          data: event,
          sentiment: event.sentiment_analysis
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Webhook handling failed', { error: error.message, event });
      throw error;
    }
  }
}

export default new ExecutorAgent();
