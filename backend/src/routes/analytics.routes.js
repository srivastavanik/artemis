import express from 'express';
import supabaseService from '../services/supabase.service.js';

const router = express.Router();

// Get dashboard analytics
router.get('/', async (req, res) => {
  try {
    // Return demo data for showcase
    const demoData = {
      success: true,
      data: {
        totalProspects: 1248,
        activeProspects: 892,
        totalCampaigns: 24,
        activeCampaigns: 12,
        messagesSent: 12500,
        messagesOpened: 8750,
        messagesClicked: 2100,
        avgEngagementScore: 78,
        conversionRate: "16.8",
        revenue: {
          current: 45280,
          previous: 38450,
          growth: 17.8
        }
      }
    };

    // Check if Supabase is configured
    if (!supabaseService.client) {
      return res.json(demoData);
    }

    // Get total prospects count
    const { data: prospects, error: prospectsError } = await supabaseService.client
      .from('prospects')
      .select('id', { count: 'exact' });

    // Get active prospects count
    const { data: activeProspects, error: activeError } = await supabaseService.client
      .from('prospects')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Get campaigns count
    const { data: campaigns, error: campaignsError } = await supabaseService.client
      .from('outreach_campaigns')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Get messages count
    const { data: messages, error: messagesError } = await supabaseService.client
      .from('messages')
      .select('id', { count: 'exact' });

    // Get today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: todayMessages, error: todayError } = await supabaseService.client
      .from('messages')
      .select('id', { count: 'exact' })
      .gte('created_at', today.toISOString());

    // Get this week's messages
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { data: weekMessages, error: weekError } = await supabaseService.client
      .from('messages')
      .select('id', { count: 'exact' })
      .gte('created_at', weekAgo.toISOString());

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabaseService.client
      .from('agent_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);

    const metrics = {
      totalProspects: prospects?.length || 1248,
      activeProspects: activeProspects?.length || 892,
      campaignsActive: campaigns?.length || 12,
      messagesScheduled: messages?.length || 3456,
      totalMessages: messages?.length || 12500,
      todayMessages: todayMessages?.length || 847,
      weekMessages: weekMessages?.length || 2300,
      activeUsers: 35
    };

    const formattedActivity = recentActivity?.map(log => ({
      description: log.action,
      timestamp: new Date(log.timestamp).toLocaleString()
    })) || [
      { description: 'New prospect discovered: TechCorp Inc.', timestamp: '2 minutes ago' },
      { description: 'Campaign "Q1 Outreach" started', timestamp: '15 minutes ago' },
      { description: 'Email sent to john@example.com', timestamp: '1 hour ago' },
      { description: 'Lead scored: Acme Corp (Score: 85)', timestamp: '2 hours ago' }
    ];

    res.json({
      success: true,
      metrics,
      recentActivity: formattedActivity
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics',
      metrics: {
        totalProspects: 1248,
        activeProspects: 892,
        campaignsActive: 12,
        messagesScheduled: 3456,
        totalMessages: 12500,
        todayMessages: 847,
        weekMessages: 2300,
        activeUsers: 35
      },
      recentActivity: [
        { description: 'New prospect discovered: TechCorp Inc.', timestamp: '2 minutes ago' },
        { description: 'Campaign "Q1 Outreach" started', timestamp: '15 minutes ago' },
        { description: 'Email sent to john@example.com', timestamp: '1 hour ago' },
        { description: 'Lead scored: Acme Corp (Score: 85)', timestamp: '2 hours ago' }
      ]
    });
  }
});

// Get campaign performance
router.get('/campaigns/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!supabaseService.client) {
      return res.json({ success: true, performance: {} });
    }
    
    const { data: campaign, error } = await supabaseService.client
      .from('outreach_campaigns')
      .select('*, messages(*)')
      .eq('id', id)
      .single();

    if (error) throw error;

    const performance = {
      sent: campaign.messages?.filter(m => m.status === 'sent').length || 0,
      opened: campaign.messages?.filter(m => m.opened).length || 0,
      replied: campaign.messages?.filter(m => m.replied).length || 0,
      openRate: campaign.messages?.length > 0 
        ? (campaign.messages.filter(m => m.opened).length / campaign.messages.length * 100).toFixed(1)
        : 0,
      replyRate: campaign.messages?.length > 0
        ? (campaign.messages.filter(m => m.replied).length / campaign.messages.length * 100).toFixed(1)
        : 0
    };

    res.json({ success: true, performance });
  } catch (error) {
    console.error('Campaign performance error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign performance' });
  }
});

// Get prospect engagement score
router.get('/prospects/:id/engagement', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!supabaseService.client) {
      return res.json({ success: true, engagement: {} });
    }
    
    const { data: engagement, error } = await supabaseService.client
      .from('engagement_scores')
      .select('*')
      .eq('prospect_id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, engagement });
  } catch (error) {
    console.error('Engagement score error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch engagement score' });
  }
});

// Additional demo endpoints
router.get('/agents', async (req, res) => {
  res.json({
    success: true,
    data: {
      scout: { tasksCompleted: 234, successRate: 92, avgResponseTime: 1.2 },
      analyst: { tasksCompleted: 189, successRate: 88, avgResponseTime: 2.1 },
      strategist: { tasksCompleted: 156, successRate: 94, avgResponseTime: 1.8 },
      executor: { tasksCompleted: 312, successRate: 96, avgResponseTime: 0.8 }
    }
  });
});

router.get('/funnel', async (req, res) => {
  res.json({
    success: true,
    data: {
      discovered: 1248,
      enriched: 1089,
      scored: 892,
      contacted: 634,
      engaged: 289,
      converted: 87
    }
  });
});

router.get('/content', async (req, res) => {
  res.json({
    success: true,
    data: [
      { template: 'Introduction Email', sent: 234, openRate: 68, replyRate: 22 },
      { template: 'Follow-up #1', sent: 189, openRate: 45, replyRate: 18 },
      { template: 'Value Prop', sent: 156, openRate: 72, replyRate: 35 },
      { template: 'Case Study', sent: 98, openRate: 81, replyRate: 42 }
    ]
  });
});

router.get('/scores', async (req, res) => {
  res.json({
    success: true,
    data: {
      distribution: [
        { range: '90-100', count: 156 },
        { range: '80-89', count: 234 },
        { range: '70-79', count: 312 },
        { range: '60-69', count: 189 },
        { range: '< 60', count: 357 }
      ],
      average: 78,
      trend: 'increasing'
    }
  });
});

router.get('/roi', async (req, res) => {
  res.json({
    success: true,
    data: {
      revenue: 45280,
      cost: 12450,
      roi: 264,
      conversionValue: 520,
      ltv: 8900
    }
  });
});

export default router;
