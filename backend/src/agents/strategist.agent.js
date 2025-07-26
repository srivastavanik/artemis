import llamaIndexService from '../services/llamaindex.service.js';
import supabaseService from '../services/supabase.service.js';
import { logger } from '../utils/logger.js';

class StrategistAgent {
  constructor() {
    this.name = 'strategist';
  }

  /**
   * Design campaign strategy for prospects
   */
  async designCampaignStrategy(prospects, campaignGoals = {}) {
    const startTime = Date.now();
    
    try {
      logger.info('Strategist agent designing campaign', { 
        prospectCount: prospects.length,
        goals: campaignGoals 
      });
      
      // Analyze prospect group characteristics
      const groupAnalysis = await this.analyzeProspectGroup(prospects);
      
      // Determine campaign approach
      const approach = this.determineCampaignApproach(groupAnalysis, campaignGoals);
      
      // Design channel strategy
      const channelStrategy = this.designChannelStrategy(groupAnalysis, approach);
      
      // Create message sequences
      const messageSequences = await this.createMessageSequences(
        groupAnalysis,
        approach,
        channelStrategy
      );
      
      // Define personalization rules
      const personalizationRules = this.definePersonalizationRules(groupAnalysis);
      
      // Set up A/B testing
      const abTestConfig = this.createABTestConfiguration(approach);
      
      // Compile complete strategy
      const strategy = {
        name: campaignGoals.name || 'AI-Designed Campaign',
        description: campaignGoals.description || approach.description,
        approach,
        channels: channelStrategy.channels,
        sequenceTiming: channelStrategy.timing,
        messageSequences,
        personalizationRules,
        abTestConfig,
        expectedOutcomes: this.projectOutcomes(prospects.length, approach),
        metadata: {
          prospectCount: prospects.length,
          createdBy: this.name,
          groupCharacteristics: groupAnalysis
        }
      };
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'design_campaign',
        input: { prospectCount: prospects.length, goals: campaignGoals },
        output: { 
          channels: strategy.channels.length,
          sequences: Object.keys(messageSequences).length 
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return strategy;
    } catch (error) {
      logger.error('Strategist agent campaign design failed', { 
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'design_campaign',
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Optimize existing campaign
   */
  async optimizeCampaign(campaignId, performanceData) {
    const startTime = Date.now();
    
    try {
      logger.info('Strategist agent optimizing campaign', { campaignId });
      
      // Analyze current performance
      const analysis = await this.analyzeCampaignPerformance(
        campaignId, 
        performanceData
      );
      
      // Identify optimization opportunities
      const opportunities = this.identifyOptimizationOpportunities(analysis);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        opportunities,
        analysis
      );
      
      // Create revised strategy elements
      const revisions = this.createStrategyRevisions(recommendations);
      
      // Log activity
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'optimize_campaign',
        campaignId,
        output: { 
          opportunities: opportunities.length,
          recommendations: recommendations.length 
        },
        duration: Date.now() - startTime,
        status: 'success'
      });
      
      return {
        analysis,
        opportunities,
        recommendations,
        revisions
      };
    } catch (error) {
      logger.error('Strategist agent optimization failed', { 
        campaignId,
        error: error.message 
      });
      
      await supabaseService.logAgentActivity({
        agentName: this.name,
        operation: 'optimize_campaign',
        campaignId,
        error: error.message,
        duration: Date.now() - startTime,
        status: 'failure'
      });
      
      throw error;
    }
  }

  /**
   * Analyze prospect group characteristics
   */
  async analyzeProspectGroup(prospects) {
    const analysis = {
      size: prospects.length,
      industries: {},
      jobTitles: {},
      seniorityLevels: {},
      companySizes: {},
      locations: {},
      commonTraits: [],
      segments: []
    };
    
    // Aggregate characteristics
    for (const prospect of prospects) {
      // Industry distribution
      const industry = prospect.company_industry || 'Unknown';
      analysis.industries[industry] = (analysis.industries[industry] || 0) + 1;
      
      // Job title patterns
      const title = this.normalizeJobTitle(prospect.job_title);
      analysis.jobTitles[title] = (analysis.jobTitles[title] || 0) + 1;
      
      // Seniority levels
      const seniority = this.determineSeniority(prospect.job_title);
      analysis.seniorityLevels[seniority] = 
        (analysis.seniorityLevels[seniority] || 0) + 1;
      
      // Company sizes
      const size = prospect.company_size || 'Unknown';
      analysis.companySizes[size] = (analysis.companySizes[size] || 0) + 1;
      
      // Locations
      const location = prospect.location || 'Unknown';
      analysis.locations[location] = (analysis.locations[location] || 0) + 1;
    }
    
    // Identify common traits
    analysis.commonTraits = this.identifyCommonTraits(analysis);
    
    // Create segments
    analysis.segments = this.createProspectSegments(prospects, analysis);
    
    return analysis;
  }

  /**
   * Determine campaign approach based on analysis
   */
  determineCampaignApproach(groupAnalysis, campaignGoals) {
    const approach = {
      type: 'multi-touch',
      style: 'consultative',
      tone: 'professional',
      urgency: 'medium',
      description: ''
    };
    
    // Adjust based on seniority distribution
    const seniorityKeys = Object.keys(groupAnalysis.seniorityLevels);
    if (seniorityKeys.includes('executive') || seniorityKeys.includes('c-level')) {
      approach.style = 'executive';
      approach.tone = 'concise';
      approach.urgency = 'low';
      approach.description = 'Executive-focused approach with concise, value-driven messaging';
    } else if (seniorityKeys.includes('manager')) {
      approach.style = 'solution-oriented';
      approach.tone = 'conversational';
      approach.description = 'Solution-focused approach for mid-level decision makers';
    } else {
      approach.style = 'educational';
      approach.tone = 'friendly';
      approach.description = 'Educational approach for individual contributors';
    }
    
    // Adjust based on campaign goals
    if (campaignGoals.urgency === 'high') {
      approach.urgency = 'high';
      approach.type = 'accelerated';
    }
    
    if (campaignGoals.focus === 'awareness') {
      approach.style = 'educational';
    } else if (campaignGoals.focus === 'conversion') {
      approach.style = 'direct';
      approach.urgency = 'high';
    }
    
    return approach;
  }

  /**
   * Design channel strategy
   */
  designChannelStrategy(groupAnalysis, approach) {
    const strategy = {
      channels: [],
      timing: {},
      rationale: {}
    };
    
    // Always include email as baseline
    strategy.channels.push('email');
    strategy.timing.email = {
      initialDelay: 0,
      betweenTouches: [3, 5, 7, 14] // days
    };
    strategy.rationale.email = 'Universal channel with highest reach';
    
    // Add LinkedIn for B2B
    if (groupAnalysis.seniorityLevels.executive || 
        groupAnalysis.seniorityLevels.manager) {
      strategy.channels.push('linkedin');
      strategy.timing.linkedin = {
        connectionRequest: 0,
        firstMessage: 2, // days after connection
        followUp: 7
      };
      strategy.rationale.linkedin = 'Professional network for B2B engagement';
    }
    
    // Add calendar for high-value prospects
    if (approach.style === 'executive' || approach.urgency === 'high') {
      strategy.channels.push('calendar');
      strategy.timing.calendar = {
        offerAfterEngagement: true,
        directBookingThreshold: 0.8 // score threshold
      };
      strategy.rationale.calendar = 'Direct booking for qualified prospects';
    }
    
    return strategy;
  }

  /**
   * Create message sequences
   */
  async createMessageSequences(groupAnalysis, approach, channelStrategy) {
    const sequences = {};
    
    // Email sequence
    if (channelStrategy.channels.includes('email')) {
      sequences.email = await this.createEmailSequence(groupAnalysis, approach);
    }
    
    // LinkedIn sequence
    if (channelStrategy.channels.includes('linkedin')) {
      sequences.linkedin = await this.createLinkedInSequence(groupAnalysis, approach);
    }
    
    // Calendar messaging
    if (channelStrategy.channels.includes('calendar')) {
      sequences.calendar = this.createCalendarMessaging(approach);
    }
    
    return sequences;
  }

  /**
   * Create email sequence
   */
  async createEmailSequence(groupAnalysis, approach) {
    const sequence = [];
    
    // Initial email
    sequence.push({
      position: 1,
      subject: this.generateSubjectLine(approach, 'initial'),
      bodyTemplate: `Hi {{first_name}},

${this.getOpeningLine(approach, groupAnalysis)}

${this.getValueProposition(approach)}

${this.getCallToAction(approach, 'soft')}

Best regards,
{{sender_name}}`,
      waitDays: 0,
      abTest: {
        enabled: true,
        variants: ['value_focused', 'pain_focused']
      }
    });
    
    // Follow-up 1
    sequence.push({
      position: 2,
      subject: this.generateSubjectLine(approach, 'followup1'),
      bodyTemplate: `Hi {{first_name}},

${this.getFollowUpOpening(1)}

${this.getCaseStudyReference(groupAnalysis)}

${this.getCallToAction(approach, 'medium')}

Best,
{{sender_name}}`,
      waitDays: 3
    });
    
    // Follow-up 2
    sequence.push({
      position: 3,
      subject: this.generateSubjectLine(approach, 'followup2'),
      bodyTemplate: `{{first_name}},

${this.getFollowUpOpening(2)}

${this.getUrgencyMessage(approach)}

${this.getCallToAction(approach, 'direct')}

{{sender_name}}`,
      waitDays: 5
    });
    
    // Final touch
    sequence.push({
      position: 4,
      subject: this.generateSubjectLine(approach, 'final'),
      bodyTemplate: `Hi {{first_name}},

${this.getBreakupMessage()}

${this.getCallToAction(approach, 'final')}

Thanks,
{{sender_name}}`,
      waitDays: 7
    });
    
    return sequence;
  }

  /**
   * Create LinkedIn sequence
   */
  async createLinkedInSequence(groupAnalysis, approach) {
    const sequence = [];
    
    // Connection request
    sequence.push({
      type: 'connection_request',
      note: `Hi {{first_name}}, I noticed your work at {{company_name}} and ${this.getConnectionReason(groupAnalysis)}. Would love to connect and share insights about {{industry}}.`,
      waitDays: 0
    });
    
    // First message
    sequence.push({
      type: 'message',
      content: `Hi {{first_name}},

Thanks for connecting! ${this.getLinkedInOpening(approach)}

${this.getShortValueProp(approach)}

Would you be open to a brief conversation?

Best,
{{sender_name}}`,
      waitDays: 2
    });
    
    // Follow-up
    sequence.push({
      type: 'message',
      content: `{{first_name}}, ${this.getLinkedInFollowUp(approach)}

{{sender_name}}`,
      waitDays: 5
    });
    
    return sequence;
  }

  /**
   * Define personalization rules
   */
  definePersonalizationRules(groupAnalysis) {
    const rules = {
      dynamicFields: [
        'first_name',
        'company_name',
        'job_title',
        'industry',
        'recent_news',
        'pain_point',
        'competitor'
      ],
      conditionalContent: [],
      personalizationDepth: 'medium'
    };
    
    // Industry-specific rules
    Object.keys(groupAnalysis.industries).forEach(industry => {
      rules.conditionalContent.push({
        condition: `industry === '${industry}'`,
        insertions: {
          industry_challenge: this.getIndustryChallenge(industry),
          industry_trend: this.getIndustryTrend(industry)
        }
      });
    });
    
    // Seniority-specific rules
    Object.keys(groupAnalysis.seniorityLevels).forEach(level => {
      rules.conditionalContent.push({
        condition: `seniority === '${level}'`,
        adjustments: {
          tone: this.getToneForSeniority(level),
          length: this.getLengthForSeniority(level),
          focus: this.getFocusForSeniority(level)
        }
      });
    });
    
    // Company size rules
    rules.conditionalContent.push({
      condition: 'company_size === "enterprise"',
      insertions: {
        scalability_message: 'scale across your global organization',
        compliance_message: 'meet enterprise security and compliance requirements'
      }
    });
    
    return rules;
  }

  /**
   * Create A/B test configuration
   */
  createABTestConfiguration(approach) {
    const config = {
      enabled: true,
      testElements: [],
      distribution: 'even', // 50/50 split
      successMetrics: ['open_rate', 'click_rate', 'reply_rate']
    };
    
    // Subject line testing
    config.testElements.push({
      element: 'subject_line',
      variants: {
        A: { style: 'question', example: 'Quick question about {{company_name}}?' },
        B: { style: 'value', example: 'Reduce {{pain_point}} by 40%' }
      }
    });
    
    // Opening line testing
    config.testElements.push({
      element: 'opening_line',
      variants: {
        A: { style: 'personal', focus: 'recent_activity' },
        B: { style: 'direct', focus: 'business_value' }
      }
    });
    
    // CTA testing
    config.testElements.push({
      element: 'call_to_action',
      variants: {
        A: { style: 'soft', text: 'Would you be open to learning more?' },
        B: { style: 'direct', text: 'Can we schedule 15 minutes this week?' }
      }
    });
    
    return config;
  }

  /**
   * Helper methods
   */
  normalizeJobTitle(title) {
    if (!title) return 'Unknown';
    
    const normalized = title.toLowerCase();
    
    if (normalized.includes('ceo') || normalized.includes('chief executive')) {
      return 'CEO';
    } else if (normalized.includes('vp') || normalized.includes('vice president')) {
      return 'VP';
    } else if (normalized.includes('director')) {
      return 'Director';
    } else if (normalized.includes('manager')) {
      return 'Manager';
    } else if (normalized.includes('lead')) {
      return 'Lead';
    }
    
    return 'Individual Contributor';
  }

  determineSeniority(title) {
    if (!title) return 'unknown';
    
    const normalized = title.toLowerCase();
    
    if (normalized.includes('chief') || normalized.includes('ceo') || 
        normalized.includes('cto') || normalized.includes('cfo')) {
      return 'c-level';
    } else if (normalized.includes('vp') || normalized.includes('vice president')) {
      return 'executive';
    } else if (normalized.includes('director')) {
      return 'director';
    } else if (normalized.includes('manager')) {
      return 'manager';
    }
    
    return 'individual';
  }

  identifyCommonTraits(analysis) {
    const traits = [];
    
    // Find dominant characteristics (>50% of group)
    const threshold = analysis.size * 0.5;
    
    Object.entries(analysis.industries).forEach(([industry, count]) => {
      if (count > threshold) {
        traits.push({ type: 'industry', value: industry, percentage: count / analysis.size });
      }
    });
    
    Object.entries(analysis.seniorityLevels).forEach(([level, count]) => {
      if (count > threshold) {
        traits.push({ type: 'seniority', value: level, percentage: count / analysis.size });
      }
    });
    
    return traits;
  }

  createProspectSegments(prospects, analysis) {
    // Simple segmentation by seniority and company size
    const segments = [];
    
    const seniorityGroups = {
      'executive': ['c-level', 'executive'],
      'management': ['director', 'manager'],
      'individual': ['individual', 'unknown']
    };
    
    Object.entries(seniorityGroups).forEach(([segmentName, levels]) => {
      const segmentProspects = prospects.filter(p => 
        levels.includes(this.determineSeniority(p.job_title))
      );
      
      if (segmentProspects.length > 0) {
        segments.push({
          name: segmentName,
          size: segmentProspects.length,
          characteristics: {
            avgCompanySize: this.calculateAvgCompanySize(segmentProspects),
            topIndustries: this.getTopIndustries(segmentProspects)
          }
        });
      }
    });
    
    return segments;
  }

  generateSubjectLine(approach, stage) {
    const templates = {
      initial: {
        executive: 'Quick question for {{first_name}}',
        'solution-oriented': 'Solving {{pain_point}} at {{company_name}}',
        educational: '{{industry}} insights for {{company_name}}'
      },
      followup1: {
        executive: 'Following up - {{company_name}}',
        'solution-oriented': 'Case study: {{similar_company}} results',
        educational: 'New approach to {{challenge}}'
      },
      followup2: {
        executive: '{{first_name}} - brief update',
        'solution-oriented': 'ROI calculator for {{company_name}}',
        educational: 'Limited spots remaining'
      },
      final: {
        executive: 'Final check-in',
        'solution-oriented': 'Should I close your file?',
        educational: 'Last chance for {{benefit}}'
      }
    };
    
    return templates[stage]?.[approach.style] || 'Following up';
  }

  getOpeningLine(approach, groupAnalysis) {
    const commonIndustry = Object.keys(groupAnalysis.industries)[0];
    
    const openings = {
      executive: `I noticed {{company_name}}'s recent {{recent_achievement}} and wanted to reach out.`,
      'solution-oriented': `Many ${commonIndustry} companies struggle with {{pain_point}}, and I believe we can help.`,
      educational: `I've been following trends in ${commonIndustry} and noticed an opportunity for {{company_name}}.`
    };
    
    return openings[approach.style] || openings['solution-oriented'];
  }

  getValueProposition(approach) {
    const props = {
      executive: `We help companies like yours achieve {{key_metric}} improvement in {{timeframe}}, with minimal disruption to operations.`,
      'solution-oriented': `Our solution has helped similar companies reduce {{pain_point}} by {{percentage}}% while improving {{secondary_benefit}}.`,
      educational: `I'd love to share insights on how leading companies are approaching {{challenge}} and seeing remarkable results.`
    };
    
    return props[approach.style] || props['solution-oriented'];
  }

  getCallToAction(approach, strength) {
    const ctas = {
      soft: {
        executive: `Worth a brief conversation?`,
        'solution-oriented': `Would you be interested in learning more?`,
        educational: `Can I share some relevant examples?`
      },
      medium: {
        executive: `Do you have 15 minutes this week?`,
        'solution-oriented': `Can we schedule a quick call to discuss?`,
        educational: `Are you available for a brief demo?`
      },
      direct: {
        executive: `I have time Thursday or Friday - which works better?`,
        'solution-oriented': `Let's schedule 20 minutes: [calendar link]`,
        educational: `Book a time that works for you: [calendar link]`
      },
      final: {
        executive: `If not, I'll close your file.`,
        'solution-oriented': `Should I assume this isn't a priority?`,
        educational: `Is this something you'd like to revisit later?`
      }
    };
    
    return ctas[strength]?.[approach.style] || ctas[strength]?.['solution-oriented'];
  }

  projectOutcomes(prospectCount, approach) {
    // Conservative estimates based on approach
    const benchmarks = {
      executive: {
        openRate: 0.35,
        clickRate: 0.08,
        replyRate: 0.05,
        meetingRate: 0.02
      },
      'solution-oriented': {
        openRate: 0.25,
        clickRate: 0.10,
        replyRate: 0.08,
        meetingRate: 0.03
      },
      educational: {
        openRate: 0.20,
        clickRate: 0.12,
        replyRate: 0.06,
        meetingRate: 0.02
      }
    };
    
    const rates = benchmarks[approach.style] || benchmarks['solution-oriented'];
    
    return {
      expectedOpens: Math.round(prospectCount * rates.openRate),
      expectedClicks: Math.round(prospectCount * rates.clickRate),
      expectedReplies: Math.round(prospectCount * rates.replyRate),
      expectedMeetings: Math.round(prospectCount * rates.meetingRate),
      timeframe: '30 days'
    };
  }

  // Additional helper methods would go here...
  getConnectionReason(groupAnalysis) {
    return "was impressed by your expertise";
  }

  getLinkedInOpening(approach) {
    return "I've been following your company's progress";
  }

  getShortValueProp(approach) {
    return "We help companies like yours improve efficiency by 30%.";
  }

  getLinkedInFollowUp(approach) {
    return "just wanted to follow up on my previous message";
  }

  getFollowUpOpening(number) {
    return `I wanted to follow up on my previous email`;
  }

  getCaseStudyReference(groupAnalysis) {
    return "We recently helped a similar company achieve impressive results.";
  }

  getUrgencyMessage(approach) {
    return "I have limited availability this month.";
  }

  getBreakupMessage() {
    return "I haven't heard back, so I'll assume this isn't a priority right now.";
  }

  getIndustryChallenge(industry) {
    return "market competition";
  }

  getIndustryTrend(industry) {
    return "digital transformation";
  }

  getToneForSeniority(level) {
    return level === 'c-level' ? 'concise' : 'conversational';
  }

  getLengthForSeniority(level) {
    return level === 'c-level' ? 'short' : 'medium';
  }

  getFocusForSeniority(level) {
    return level === 'c-level' ? 'strategic' : 'tactical';
  }

  calculateAvgCompanySize(prospects) {
    return "medium";
  }

  getTopIndustries(prospects) {
    return ["Technology", "Finance"];
  }

  createCalendarMessaging(approach) {
    return {
      inviteTitle: "Quick chat about {{company_name}}'s goals",
      inviteDescription: "Looking forward to discussing how we can help.",
      duration: 30
    };
  }

  analyzeCampaignPerformance(campaignId, performanceData) {
    return {
      strengths: [],
      weaknesses: [],
      trends: []
    };
  }

  identifyOptimizationOpportunities(analysis) {
    return [];
  }

  generateOptimizationRecommendations(opportunities, analysis) {
    return [];
  }

  createStrategyRevisions(recommendations) {
    return {};
  }
}

export default new StrategistAgent();
