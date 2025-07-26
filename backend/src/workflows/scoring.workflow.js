const { Workflow } = require('@mastra/core');
const { SupabaseService } = require('../services/supabase.service');
const { LlamaIndexService } = require('../services/llamaindex.service');
const { AnalystAgent } = require('../agents/analyst.agent');
const logger = require('../utils/logger');

/**
 * Scoring Workflow - Evaluates and scores prospects
 */
class ScoringWorkflow extends Workflow {
  constructor() {
    super('scoring-workflow');
    this.supabase = new SupabaseService();
    this.llamaIndex = new LlamaIndexService();
    this.analyst = new AnalystAgent();
  }

  async execute(context) {
    const { prospectId, enrichmentData } = context;
    
    try {
      logger.info(`Starting scoring workflow for prospect ${prospectId}`);
      
      // Step 1: Retrieve prospect data
      const prospect = await this.supabase.getProspect(prospectId);
      if (!prospect) {
        throw new Error(`Prospect ${prospectId} not found`);
      }

      // Step 2: Analyze engagement signals
      const engagementAnalysis = await this.analyzeEngagementSignals(prospect, enrichmentData);
      
      // Step 3: Calculate fit score using AI
      const fitAnalysis = await this.analyst.analyzeProspect({
        prospect,
        enrichmentData,
        engagementSignals: engagementAnalysis
      });
      
      // Step 4: Generate actionable insights
      const insights = await this.generateInsights({
        prospect,
        enrichmentData,
        engagementAnalysis,
        fitAnalysis
      });
      
      // Step 5: Calculate composite scores
      const scores = this.calculateScores({
        engagementAnalysis,
        fitAnalysis,
        insights
      });
      
      // Step 6: Store scoring results
      await this.storeScores(prospectId, {
        ...scores,
        insights,
        lastScoredAt: new Date().toISOString()
      });
      
      // Step 7: Update prospect status based on score
      await this.updateProspectStatus(prospectId, scores);
      
      logger.info(`Scoring workflow completed for prospect ${prospectId}`, { scores });
      
      return {
        prospectId,
        scores,
        insights,
        recommendation: this.getRecommendation(scores)
      };
      
    } catch (error) {
      logger.error('Scoring workflow failed:', error);
      throw error;
    }
  }

  async analyzeEngagementSignals(prospect, enrichmentData) {
    const signals = {
      websiteActivity: 0,
      socialActivity: 0,
      contentEngagement: 0,
      competitorMentions: 0,
      buyingSignals: 0
    };
    
    // Analyze website activity
    if (enrichmentData.webData) {
      signals.websiteActivity = this.scoreWebsiteActivity(enrichmentData.webData);
    }
    
    // Analyze social media presence
    if (enrichmentData.socialProfiles) {
      signals.socialActivity = this.scoreSocialActivity(enrichmentData.socialProfiles);
    }
    
    // Check for content engagement
    if (enrichmentData.contentInteractions) {
      signals.contentEngagement = this.scoreContentEngagement(enrichmentData.contentInteractions);
    }
    
    // Look for competitor mentions
    if (enrichmentData.mentions) {
      signals.competitorMentions = this.scoreCompetitorMentions(enrichmentData.mentions);
    }
    
    // Identify buying signals
    if (enrichmentData.technographics || enrichmentData.jobPostings) {
      signals.buyingSignals = this.scoreBuyingSignals({
        tech: enrichmentData.technographics,
        jobs: enrichmentData.jobPostings
      });
    }
    
    return signals;
  }

  scoreWebsiteActivity(webData) {
    let score = 0;
    
    // Recent website updates
    if (webData.lastUpdated) {
      const daysSinceUpdate = this.daysSince(webData.lastUpdated);
      if (daysSinceUpdate < 30) score += 30;
      else if (daysSinceUpdate < 90) score += 20;
      else if (daysSinceUpdate < 180) score += 10;
    }
    
    // Technology adoption
    if (webData.technologies) {
      const relevantTech = ['React', 'Node.js', 'AI', 'ML', 'Cloud', 'SaaS'];
      const techMatches = webData.technologies.filter(tech => 
        relevantTech.some(rt => tech.toLowerCase().includes(rt.toLowerCase()))
      );
      score += Math.min(techMatches.length * 10, 40);
    }
    
    // Growth indicators
    if (webData.traffic && webData.traffic.growth > 0) {
      score += Math.min(webData.traffic.growth * 2, 30);
    }
    
    return Math.min(score, 100);
  }

  scoreSocialActivity(socialProfiles) {
    let score = 0;
    
    // LinkedIn activity
    if (socialProfiles.linkedin) {
      const { posts, engagement, followers } = socialProfiles.linkedin;
      if (posts && posts.recent > 5) score += 20;
      if (engagement && engagement.rate > 0.05) score += 20;
      if (followers && followers > 1000) score += 10;
    }
    
    // Twitter activity
    if (socialProfiles.twitter) {
      const { tweetsPerWeek, engagement } = socialProfiles.twitter;
      if (tweetsPerWeek > 3) score += 15;
      if (engagement && engagement.replies > 10) score += 15;
    }
    
    // Industry engagement
    if (socialProfiles.industryGroups) {
      score += Math.min(socialProfiles.industryGroups.length * 5, 20);
    }
    
    return Math.min(score, 100);
  }

  scoreContentEngagement(interactions) {
    let score = 0;
    
    interactions.forEach(interaction => {
      switch (interaction.type) {
        case 'webinar_attendance':
          score += 25;
          break;
        case 'whitepaper_download':
          score += 20;
          break;
        case 'demo_request':
          score += 40;
          break;
        case 'pricing_page_visit':
          score += 30;
          break;
        case 'blog_read':
          score += 5;
          break;
        case 'email_open':
          score += 3;
          break;
        case 'email_click':
          score += 8;
          break;
      }
    });
    
    return Math.min(score, 100);
  }

  scoreCompetitorMentions(mentions) {
    let score = 0;
    const competitors = ['Salesforce', 'HubSpot', 'Outreach', 'SalesLoft'];
    
    mentions.forEach(mention => {
      // Check if they mention competitors
      const hasCompetitor = competitors.some(comp => 
        mention.text.toLowerCase().includes(comp.toLowerCase())
      );
      
      if (hasCompetitor) {
        // Positive context (looking for alternatives)
        if (mention.sentiment === 'negative' || mention.context.includes('alternative')) {
          score += 25;
        }
        // Neutral context (comparing options)
        else if (mention.sentiment === 'neutral') {
          score += 15;
        }
        // Currently using competitor
        else {
          score += 10;
        }
      }
    });
    
    return Math.min(score, 100);
  }

  scoreBuyingSignals(data) {
    let score = 0;
    
    // Technology gaps
    if (data.tech) {
      const missingTech = ['CRM', 'Sales Intelligence', 'Marketing Automation', 'AI'];
      const gaps = missingTech.filter(tech => 
        !data.tech.some(t => t.category === tech)
      );
      score += gaps.length * 15;
    }
    
    // Hiring for relevant roles
    if (data.jobs) {
      const relevantRoles = ['Sales', 'Business Development', 'Revenue', 'Growth'];
      const relevantJobs = data.jobs.filter(job => 
        relevantRoles.some(role => job.title.includes(role))
      );
      score += Math.min(relevantJobs.length * 20, 40);
    }
    
    return Math.min(score, 100);
  }

  async generateInsights(data) {
    const { prospect, enrichmentData, engagementAnalysis, fitAnalysis } = data;
    
    const insights = [];
    
    // High-level fit insights
    if (fitAnalysis.score > 80) {
      insights.push({
        type: 'high_fit',
        priority: 'high',
        message: `Strong alignment with ideal customer profile. ${fitAnalysis.reasoning}`,
        action: 'Prioritize for immediate outreach'
      });
    }
    
    // Engagement insights
    if (engagementAnalysis.websiteActivity > 70) {
      insights.push({
        type: 'active_research',
        priority: 'high',
        message: 'Recent website updates and technology adoption indicate active growth phase',
        action: 'Highlight innovation and scalability benefits'
      });
    }
    
    if (engagementAnalysis.buyingSignals > 60) {
      insights.push({
        type: 'buying_intent',
        priority: 'high',
        message: 'Strong buying signals detected through hiring patterns and tech gaps',
        action: 'Focus on ROI and implementation timeline'
      });
    }
    
    // Competitive insights
    if (engagementAnalysis.competitorMentions > 50) {
      insights.push({
        type: 'competitor_consideration',
        priority: 'medium',
        message: 'Actively evaluating competitor solutions',
        action: 'Emphasize differentiation and unique value props'
      });
    }
    
    // Timing insights
    const bestOutreachTime = this.determineBestOutreachTime(enrichmentData);
    insights.push({
      type: 'timing',
      priority: 'medium',
      message: `Best outreach window: ${bestOutreachTime}`,
      action: 'Schedule personalized campaign accordingly'
    });
    
    return insights;
  }

  calculateScores(data) {
    const { engagementAnalysis, fitAnalysis, insights } = data;
    
    // Calculate weighted engagement score
    const engagementScore = (
      engagementAnalysis.websiteActivity * 0.2 +
      engagementAnalysis.socialActivity * 0.15 +
      engagementAnalysis.contentEngagement * 0.25 +
      engagementAnalysis.competitorMentions * 0.15 +
      engagementAnalysis.buyingSignals * 0.25
    );
    
    // Combine with fit score
    const overallScore = (fitAnalysis.score * 0.4) + (engagementScore * 0.6);
    
    // Calculate urgency based on signals
    const urgencyScore = this.calculateUrgency({
      buyingSignals: engagementAnalysis.buyingSignals,
      competitorMentions: engagementAnalysis.competitorMentions,
      insights
    });
    
    return {
      overall: Math.round(overallScore),
      fit: fitAnalysis.score,
      engagement: Math.round(engagementScore),
      urgency: urgencyScore,
      components: engagementAnalysis
    };
  }

  calculateUrgency(data) {
    let urgency = 50; // Base urgency
    
    // High buying signals increase urgency
    if (data.buyingSignals > 70) urgency += 30;
    else if (data.buyingSignals > 50) urgency += 20;
    
    // Competitor evaluation increases urgency
    if (data.competitorMentions > 60) urgency += 20;
    
    // High-priority insights increase urgency
    const highPriorityCount = data.insights.filter(i => i.priority === 'high').length;
    urgency += highPriorityCount * 10;
    
    return Math.min(urgency, 100);
  }

  async storeScores(prospectId, scoreData) {
    // Update engagement_scores table
    await this.supabase.updateEngagementScore(prospectId, scoreData);
    
    // Log scoring event
    await this.supabase.createAgentLog({
      agent_type: 'analyst',
      action: 'scoring_completed',
      prospect_id: prospectId,
      details: scoreData,
      created_at: new Date().toISOString()
    });
  }

  async updateProspectStatus(prospectId, scores) {
    let status = 'qualified';
    let priority = 'medium';
    
    if (scores.overall >= 80) {
      status = 'hot';
      priority = 'high';
    } else if (scores.overall >= 60) {
      status = 'warm';
      priority = scores.urgency > 70 ? 'high' : 'medium';
    } else if (scores.overall >= 40) {
      status = 'qualified';
      priority = 'medium';
    } else {
      status = 'cold';
      priority = 'low';
    }
    
    await this.supabase.updateProspect(prospectId, {
      lead_score: scores.overall,
      priority,
      status
    });
  }

  getRecommendation(scores) {
    if (scores.overall >= 80 && scores.urgency >= 80) {
      return {
        action: 'immediate_outreach',
        strategy: 'executive_engagement',
        message: 'High-value prospect with strong buying signals. Prioritize for executive outreach.',
        channels: ['email', 'linkedin', 'phone']
      };
    } else if (scores.overall >= 70) {
      return {
        action: 'personalized_campaign',
        strategy: 'value_demonstration',
        message: 'Strong fit with good engagement. Build personalized nurture campaign.',
        channels: ['email', 'linkedin']
      };
    } else if (scores.overall >= 50) {
      return {
        action: 'nurture_sequence',
        strategy: 'education_first',
        message: 'Qualified prospect requiring education. Start with content-driven approach.',
        channels: ['email', 'content']
      };
    } else {
      return {
        action: 'monitor',
        strategy: 'passive_tracking',
        message: 'Low current fit. Monitor for signal changes.',
        channels: ['automated']
      };
    }
  }

  determineBestOutreachTime(enrichmentData) {
    // Analyze patterns to determine best time
    const timezone = enrichmentData.company?.timezone || 'America/New_York';
    const industry = enrichmentData.company?.industry;
    
    // Industry-specific patterns
    const industryPatterns = {
      'technology': 'Tuesday-Thursday, 10-11 AM or 2-3 PM',
      'finance': 'Tuesday-Wednesday, 9-10 AM',
      'healthcare': 'Wednesday-Thursday, 2-4 PM',
      'retail': 'Tuesday-Thursday, 11 AM-1 PM',
      'default': 'Tuesday-Thursday, 10-11 AM'
    };
    
    return industryPatterns[industry?.toLowerCase()] || industryPatterns.default;
  }

  daysSince(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

module.exports = { ScoringWorkflow };
