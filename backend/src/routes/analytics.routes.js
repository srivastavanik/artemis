import express from 'express';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * Get overall analytics
 * GET /api/analytics
 */
router.get('/', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    // Get prospects created
    const { count: prospectsCreated } = await supabaseService.client
      .from('prospects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());
    
    // Get campaigns created
    const { count: campaignsCreated } = await supabaseService.client
      .from('outreach_campaigns')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString());
    
    // Get messages sent
    const { count: messagesSent } = await supabaseService.client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', startDate.toISOString());
    
    // Get interactions
    const { data: interactions } = await supabaseService.client
      .from('interactions')
      .select('type')
      .gte('occurred_at', startDate.toISOString());
    
    // Calculate engagement metrics
    const engagementMetrics = interactions.reduce((acc, interaction) => {
      acc[interaction.type] = (acc[interaction.type] || 0) + 1;
      return acc;
    }, {});
    
    // Get top performing campaigns
    const { data: topCampaigns } = await supabaseService.client
      .from('outreach_campaigns')
      .select(`
        id,
        name,
        messages:messages(count),
        interactions:messages(
          interactions:interactions(count)
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5);
    
    res.json({
      success: true,
      data: {
        overview: {
          prospectsCreated,
          campaignsCreated,
          messagesSent,
          totalEngagements: interactions.length
        },
        engagementMetrics,
        topCampaigns,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  }
});

/**
 * Get agent performance analytics
 * GET /api/analytics/agents
 */
router.get('/agents', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));
    
    // Get agent activities
    const { data: agentActivities } = await supabaseService.client
      .from('agent_logs')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });
    
    // Aggregate by agent
    const agentPerformance = agentActivities.reduce((acc, log) => {
      const agent = log.agent_name;
      if (!acc[agent]) {
        acc[agent] = {
          operations: {},
          successCount: 0,
          failureCount: 0,
          totalDuration: 0,
          operationCount: 0
        };
      }
      
      // Count operations
      acc[agent].operations[log.operation] = 
        (acc[agent].operations[log.operation] || 0) + 1;
      
      // Count success/failure
      if (log.status === 'success') {
        acc[agent].successCount++;
      } else {
        acc[agent].failureCount++;
      }
      
      // Sum duration
      if (log.metadata?.duration) {
        acc[agent].totalDuration += log.metadata.duration;
      }
      
      acc[agent].operationCount++;
      
      return acc;
    }, {});
    
    // Calculate averages
    Object.keys(agentPerformance).forEach(agent => {
      const perf = agentPerformance[agent];
      perf.avgDuration = perf.operationCount > 0 
        ? perf.totalDuration / perf.operationCount 
        : 0;
      perf.successRate = perf.operationCount > 0
        ? (perf.successCount / perf.operationCount) * 100
        : 0;
    });
    
    res.json({
      success: true,
      data: {
        agentPerformance,
        totalOperations: agentActivities.length,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch agent analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agent analytics'
    });
  }
});

/**
 * Get engagement funnel analytics
 * GET /api/analytics/funnel
 */
router.get('/funnel', async (req, res) => {
  try {
    const { campaignId, timeframe = '30d' } = req.query;
    
    let messageQuery = supabaseService.client
      .from('messages')
      .select('*');
    
    if (campaignId) {
      messageQuery = messageQuery.eq('campaign_id', campaignId);
    }
    
    const { data: messages } = await messageQuery;
    
    // Calculate funnel metrics
    const funnel = {
      sent: messages.length,
      delivered: messages.filter(m => m.status !== 'bounced').length,
      opened: messages.filter(m => ['opened', 'clicked', 'replied'].includes(m.status)).length,
      clicked: messages.filter(m => ['clicked', 'replied'].includes(m.status)).length,
      replied: messages.filter(m => m.status === 'replied').length
    };
    
    // Calculate conversion rates
    const conversionRates = {
      deliveryRate: funnel.sent > 0 ? (funnel.delivered / funnel.sent) * 100 : 0,
      openRate: funnel.delivered > 0 ? (funnel.opened / funnel.delivered) * 100 : 0,
      clickRate: funnel.opened > 0 ? (funnel.clicked / funnel.opened) * 100 : 0,
      replyRate: funnel.clicked > 0 ? (funnel.replied / funnel.clicked) * 100 : 0
    };
    
    res.json({
      success: true,
      data: {
        funnel,
        conversionRates,
        campaignId
      }
    });
  } catch (error) {
    logger.error('Failed to fetch funnel analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch funnel analytics'
    });
  }
});

/**
 * Get best performing content
 * GET /api/analytics/content
 */
router.get('/content', async (req, res) => {
  try {
    // Get messages with high engagement
    const { data: highEngagementMessages } = await supabaseService.client
      .from('messages')
      .select(`
        *,
        interactions:interactions(count)
      `)
      .in('status', ['clicked', 'replied'])
      .order('interactions_count', { ascending: false })
      .limit(10);
    
    // Analyze patterns in high-performing messages
    const contentPatterns = {
      subjectLines: [],
      contentThemes: [],
      personalizationUsage: {},
      messageLength: {
        short: 0,  // < 50 words
        medium: 0, // 50-150 words
        long: 0    // > 150 words
      }
    };
    
    highEngagementMessages.forEach(message => {
      // Analyze subject lines
      if (message.subject) {
        contentPatterns.subjectLines.push({
          subject: message.subject,
          status: message.status,
          engagementCount: message.interactions?.length || 0
        });
      }
      
      // Analyze content length
      const wordCount = message.content?.split(' ').length || 0;
      if (wordCount < 50) contentPatterns.messageLength.short++;
      else if (wordCount <= 150) contentPatterns.messageLength.medium++;
      else contentPatterns.messageLength.long++;
    });
    
    res.json({
      success: true,
      data: {
        topPerformingMessages: highEngagementMessages.slice(0, 5),
        contentPatterns,
        analysisCount: highEngagementMessages.length
      }
    });
  } catch (error) {
    logger.error('Failed to fetch content analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch content analytics'
    });
  }
});

/**
 * Get prospect score distribution
 * GET /api/analytics/scores
 */
router.get('/scores', async (req, res) => {
  try {
    // Get latest scores for all prospects
    const { data: scores } = await supabaseService.client
      .from('engagement_scores')
      .select(`
        *,
        prospect:prospects(
          first_name,
          last_name,
          company_name
        )
      `)
      .order('calculated_at', { ascending: false });
    
    // Get unique latest scores per prospect
    const latestScores = {};
    scores.forEach(score => {
      if (!latestScores[score.prospect_id] || 
          new Date(score.calculated_at) > new Date(latestScores[score.prospect_id].calculated_at)) {
        latestScores[score.prospect_id] = score;
      }
    });
    
    // Calculate distribution
    const distribution = {
      veryHigh: [], // > 0.8
      high: [],     // 0.6 - 0.8
      medium: [],   // 0.4 - 0.6
      low: [],      // 0.2 - 0.4
      veryLow: []   // < 0.2
    };
    
    Object.values(latestScores).forEach(score => {
      const overallScore = score.overall_score?.score || 0;
      const entry = {
        prospectId: score.prospect_id,
        prospect: score.prospect,
        score: overallScore,
        scores: {
          intent: score.intent_score?.score || 0,
          fit: score.fit_score?.score || 0,
          engagement: score.engagement_score?.score || 0,
          timing: score.timing_score?.score || 0
        }
      };
      
      if (overallScore > 0.8) distribution.veryHigh.push(entry);
      else if (overallScore > 0.6) distribution.high.push(entry);
      else if (overallScore > 0.4) distribution.medium.push(entry);
      else if (overallScore > 0.2) distribution.low.push(entry);
      else distribution.veryLow.push(entry);
    });
    
    // Sort each category by score
    Object.keys(distribution).forEach(key => {
      distribution[key].sort((a, b) => b.score - a.score);
    });
    
    res.json({
      success: true,
      data: {
        distribution,
        summary: {
          total: Object.values(latestScores).length,
          veryHigh: distribution.veryHigh.length,
          high: distribution.high.length,
          medium: distribution.medium.length,
          low: distribution.low.length,
          veryLow: distribution.veryLow.length
        },
        topProspects: [
          ...distribution.veryHigh.slice(0, 5),
          ...distribution.high.slice(0, 5)
        ]
      }
    });
  } catch (error) {
    logger.error('Failed to fetch score analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch score analytics'
    });
  }
});

/**
 * Get ROI analytics
 * GET /api/analytics/roi
 */
router.get('/roi', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(timeframe));
    
    // Get all campaigns in timeframe
    const { data: campaigns } = await supabaseService.client
      .from('outreach_campaigns')
      .select(`
        *,
        messages:messages(count),
        interactions:messages(
          interactions:interactions(*)
        )
      `)
      .gte('created_at', startDate.toISOString());
    
    // Calculate ROI metrics
    let totalMessages = 0;
    let totalReplies = 0;
    let totalMeetings = 0;
    let estimatedPipeline = 0;
    
    campaigns.forEach(campaign => {
      totalMessages += campaign.messages?.length || 0;
      
      // Count interactions
      campaign.interactions?.forEach(message => {
        message.interactions?.forEach(interaction => {
          if (interaction.type === 'email_reply' || interaction.type === 'positive_reply') {
            totalReplies++;
          }
          if (interaction.type === 'meeting_scheduled') {
            totalMeetings++;
          }
        });
      });
    });
    
    // Calculate costs (rough estimates)
    const costs = {
      messageCost: totalMessages * 0.10, // $0.10 per message
      platformCost: 500, // Monthly platform cost
      totalCost: (totalMessages * 0.10) + 500
    };
    
    // Calculate returns (rough estimates)
    const returns = {
      qualifiedLeads: Math.round(totalReplies * 0.1), // 10% of replies
      opportunities: Math.round(totalMeetings * 0.5), // 50% of meetings
      estimatedValue: totalMeetings * 0.5 * 50000 * 0.2, // meetings * opp rate * avg deal * close rate
      roi: ((totalMeetings * 0.5 * 50000 * 0.2) - costs.totalCost) / costs.totalCost * 100
    };
    
    res.json({
      success: true,
      data: {
        activity: {
          campaigns: campaigns.length,
          messages: totalMessages,
          replies: totalReplies,
          meetings: totalMeetings
        },
        costs,
        returns,
        timeframe,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        }
      }
    });
  } catch (error) {
    logger.error('Failed to fetch ROI analytics', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to fetch ROI analytics'
    });
  }
});

export default router;
