import axios from 'axios';
import { config } from '../../config/index.js';
import { logger } from '../utils/logger.js';

class ArcadeService {
  constructor() {
    this.apiKey = config.arcade.apiKey;
    this.baseUrl = config.arcade.baseUrl;
    this.campaignStates = new Map();
    this.webhookHandlers = new Map();
  }

  /**
   * Create multi-channel campaign
   */
  async createCampaign(campaign, prospects) {
    try {
      const automationFlow = this.buildAutomationFlow(campaign, prospects);
      
      const response = await this.makeRequest('/automations/create', {
        name: campaign.name,
        description: campaign.description,
        flow: automationFlow,
        settings: {
          timezone_aware: true,
          respect_business_hours: true,
          pause_on_weekends: campaign.pauseOnWeekends || false,
          max_daily_sends: campaign.maxDailySends || 50,
          enable_webhooks: true,
          webhook_url: `${process.env.API_URL}/webhooks/arcade`
        }
      });

      const automationId = response.data.automation_id;
      
      // Store campaign state
      this.campaignStates.set(automationId, {
        campaignId: campaign.id,
        prospects: prospects.map(p => p.id),
        currentSteps: {},
        startedAt: new Date()
      });

      return {
        automationId,
        status: 'active',
        prospectCount: prospects.length
      };
    } catch (error) {
      logger.error('Arcade campaign creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send personalized email
   */
  async sendEmail(prospect, message, options = {}) {
    try {
      const emailData = {
        to: prospect.email,
        subject: this.personalizeContent(message.subject, prospect),
        body: this.personalizeContent(message.content, prospect),
        from: options.from || 'sales@company.com',
        reply_to: options.replyTo || 'sales@company.com',
        tracking: {
          opens: true,
          clicks: true,
          replies: true
        },
        metadata: {
          prospect_id: prospect.id,
          message_id: message.id,
          campaign_id: message.campaignId
        }
      };

      // Add calendar invite if specified
      if (options.includeCalendarInvite) {
        emailData.attachments = [{
          type: 'calendar_invite',
          data: this.createCalendarInvite(prospect, options.meetingDetails)
        }];
      }

      const response = await this.makeRequest('/email/send', emailData);

      return {
        messageId: response.data.message_id,
        status: 'sent',
        scheduledFor: options.scheduledFor || new Date()
      };
    } catch (error) {
      logger.error('Arcade email send failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send LinkedIn message
   */
  async sendLinkedInMessage(prospect, message) {
    try {
      // First, ensure connection exists
      const connectionStatus = await this.checkLinkedInConnection(prospect.linkedinUrl);
      
      if (!connectionStatus.connected) {
        await this.sendLinkedInConnectionRequest(prospect);
        
        // Schedule message for after connection is accepted
        return this.scheduleLinkedInMessage(prospect, message, { 
          delayDays: 2 
        });
      }

      const response = await this.makeRequest('/linkedin/message', {
        profile_url: prospect.linkedinUrl,
        message: this.personalizeContent(message.content, prospect),
        metadata: {
          prospect_id: prospect.id,
          message_id: message.id
        }
      });

      return {
        messageId: response.data.message_id,
        status: 'sent',
        platform: 'linkedin'
      };
    } catch (error) {
      logger.error('Arcade LinkedIn message failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send LinkedIn connection request
   */
  async sendLinkedInConnectionRequest(prospect, note = null) {
    try {
      const defaultNote = `Hi ${prospect.firstName}, I came across your profile and was impressed by your work at ${prospect.companyName}. Would love to connect and share insights about ${prospect.industry || 'your industry'}.`;
      
      const response = await this.makeRequest('/linkedin/connect', {
        profile_url: prospect.linkedinUrl,
        note: note || this.personalizeContent(defaultNote, prospect),
        metadata: {
          prospect_id: prospect.id
        }
      });

      return {
        requestId: response.data.request_id,
        status: 'pending'
      };
    } catch (error) {
      logger.error('Arcade LinkedIn connection request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Schedule calendar invite
   */
  async scheduleCalendarInvite(prospect, meetingDetails) {
    try {
      const calendarData = {
        title: this.personalizeContent(meetingDetails.title, prospect),
        description: this.personalizeContent(meetingDetails.description, prospect),
        attendees: [
          {
            email: prospect.email,
            name: `${prospect.firstName} ${prospect.lastName}`,
            required: true
          }
        ],
        start_time: meetingDetails.startTime,
        end_time: meetingDetails.endTime,
        timezone: prospect.timezone || 'America/New_York',
        location: meetingDetails.location || 'Virtual (link to be provided)',
        reminder_minutes: [15, 60],
        metadata: {
          prospect_id: prospect.id,
          campaign_id: meetingDetails.campaignId
        }
      };

      const response = await this.makeRequest('/calendar/create', calendarData);

      return {
        inviteId: response.data.invite_id,
        status: 'scheduled',
        meetingLink: response.data.meeting_link
      };
    } catch (error) {
      logger.error('Arcade calendar invite failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Build automation flow
   */
  buildAutomationFlow(campaign, prospects) {
    const flow = {
      triggers: [{
        type: 'manual',
        prospect_list: prospects.map(p => ({
          id: p.id,
          email: p.email,
          linkedin: p.linkedinUrl,
          data: p
        }))
      }],
      
      steps: this.buildCampaignSteps(campaign),
      
      conditions: this.buildCampaignConditions(campaign),
      
      exit_conditions: [
        {
          type: 'positive_reply',
          action: 'mark_as_qualified'
        },
        {
          type: 'unsubscribe',
          action: 'remove_from_campaign'
        },
        {
          type: 'hard_bounce',
          action: 'mark_invalid_email'
        }
      ]
    };

    return flow;
  }

  /**
   * Build campaign steps
   */
  buildCampaignSteps(campaign) {
    const steps = [];
    
    // Initial touch - LinkedIn connection if available
    if (campaign.channels.includes('linkedin')) {
      steps.push({
        id: 'linkedin_connect',
        type: 'linkedin_connection',
        wait_for_acceptance: true,
        timeout_days: 7,
        note_template: campaign.linkedinConnectionNote
      });
    }

    // Email sequence
    if (campaign.channels.includes('email')) {
      campaign.emailSequence?.forEach((email, index) => {
        steps.push({
          id: `email_${index + 1}`,
          type: 'email',
          subject_template: email.subject,
          body_template: email.body,
          wait_after: email.waitDays || 3,
          skip_if: ['replied', 'meeting_booked'],
          a_b_test: email.abTest || null
        });
      });
    }

    // LinkedIn follow-up
    if (campaign.channels.includes('linkedin') && campaign.linkedinFollowUp) {
      steps.push({
        id: 'linkedin_message',
        type: 'linkedin_message',
        message_template: campaign.linkedinFollowUp,
        wait_after: 5,
        skip_if: ['replied', 'meeting_booked'],
        require_connection: true
      });
    }

    // Calendar invite for engaged prospects
    if (campaign.channels.includes('calendar')) {
      steps.push({
        id: 'calendar_invite',
        type: 'calendar_invite',
        trigger_condition: 'high_engagement',
        meeting_duration: 30,
        availability_check: true,
        title_template: campaign.meetingTitle || "Quick chat about {{company_name}}'s goals"
      });
    }

    return steps;
  }

  /**
   * Build campaign conditions
   */
  buildCampaignConditions(campaign) {
    return [
      {
        id: 'business_hours',
        type: 'time_window',
        timezone: 'prospect_timezone',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        hours: {
          start: '09:00',
          end: '17:00'
        }
      },
      {
        id: 'engagement_threshold',
        type: 'engagement_score',
        operator: 'greater_than',
        value: 0.6,
        action: 'accelerate_sequence'
      },
      {
        id: 'no_recent_activity',
        type: 'last_activity',
        operator: 'older_than',
        days: 14,
        action: 'pause_campaign'
      }
    ];
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event) {
    try {
      const handler = this.webhookHandlers.get(event.type) || this.defaultWebhookHandler;
      const result = await handler.call(this, event);
      
      // Update campaign state
      if (event.automation_id && this.campaignStates.has(event.automation_id)) {
        const state = this.campaignStates.get(event.automation_id);
        
        if (event.prospect_id) {
          state.currentSteps[event.prospect_id] = event.current_step;
        }
        
        this.campaignStates.set(event.automation_id, state);
      }
      
      return result;
    } catch (error) {
      logger.error('Webhook handling failed', { error: error.message, event });
      throw error;
    }
  }

  /**
   * Register webhook handlers
   */
  registerWebhookHandlers() {
    this.webhookHandlers.set('email_opened', this.handleEmailOpened);
    this.webhookHandlers.set('link_clicked', this.handleLinkClicked);
    this.webhookHandlers.set('email_replied', this.handleEmailReplied);
    this.webhookHandlers.set('linkedin_accepted', this.handleLinkedInAccepted);
    this.webhookHandlers.set('meeting_booked', this.handleMeetingBooked);
    this.webhookHandlers.set('unsubscribed', this.handleUnsubscribed);
  }

  /**
   * Handle email opened event
   */
  async handleEmailOpened(event) {
    logger.info('Email opened', { 
      prospectId: event.prospect_id, 
      messageId: event.message_id 
    });
    
    // Record interaction
    return {
      type: 'email_open',
      timestamp: new Date(),
      metadata: event
    };
  }

  /**
   * Handle link clicked event
   */
  async handleLinkClicked(event) {
    logger.info('Link clicked', { 
      prospectId: event.prospect_id, 
      link: event.clicked_link 
    });
    
    // High engagement signal - might trigger acceleration
    return {
      type: 'link_click',
      engagement_boost: 0.2,
      timestamp: new Date(),
      metadata: event
    };
  }

  /**
   * Handle email replied event
   */
  async handleEmailReplied(event) {
    logger.info('Email replied', { 
      prospectId: event.prospect_id,
      sentiment: event.sentiment_analysis 
    });
    
    // Positive reply - mark as qualified lead
    if (event.sentiment_analysis?.score > 0.6) {
      return {
        type: 'positive_reply',
        action: 'qualify_lead',
        timestamp: new Date(),
        metadata: event
      };
    }
    
    return {
      type: 'reply',
      timestamp: new Date(),
      metadata: event
    };
  }

  /**
   * Check LinkedIn connection status
   */
  async checkLinkedInConnection(linkedinUrl) {
    try {
      const response = await this.makeRequest('/linkedin/connection/status', {
        profile_url: linkedinUrl
      });
      
      return {
        connected: response.data.connected,
        connectionDate: response.data.connection_date
      };
    } catch (error) {
      logger.error('LinkedIn connection check failed', { error: error.message });
      return { connected: false };
    }
  }

  /**
   * Schedule LinkedIn message
   */
  async scheduleLinkedInMessage(prospect, message, options) {
    try {
      const scheduledTime = new Date();
      scheduledTime.setDate(scheduledTime.getDate() + (options.delayDays || 2));
      
      const response = await this.makeRequest('/linkedin/message/schedule', {
        profile_url: prospect.linkedinUrl,
        message: this.personalizeContent(message.content, prospect),
        scheduled_for: scheduledTime.toISOString(),
        wait_for_connection: true,
        metadata: {
          prospect_id: prospect.id,
          message_id: message.id
        }
      });
      
      return {
        messageId: response.data.message_id,
        status: 'scheduled',
        scheduledFor: scheduledTime,
        platform: 'linkedin'
      };
    } catch (error) {
      logger.error('LinkedIn message scheduling failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create calendar invite data
   */
  createCalendarInvite(prospect, meetingDetails) {
    return {
      summary: this.personalizeContent(meetingDetails.title, prospect),
      description: this.personalizeContent(meetingDetails.description, prospect),
      start: meetingDetails.startTime,
      end: meetingDetails.endTime,
      attendees: [prospect.email],
      location: meetingDetails.location || 'Virtual',
      reminder: {
        method: 'email',
        minutes: 15
      }
    };
  }

  /**
   * Personalize content with prospect data
   */
  personalizeContent(template, prospect) {
    if (!template) return '';
    
    return template
      .replace(/{{first_name}}/g, prospect.firstName || '')
      .replace(/{{last_name}}/g, prospect.lastName || '')
      .replace(/{{company_name}}/g, prospect.companyName || '')
      .replace(/{{job_title}}/g, prospect.jobTitle || '')
      .replace(/{{industry}}/g, prospect.industry || '')
      .replace(/{{location}}/g, prospect.location || '')
      .replace(/{{company_size}}/g, prospect.companySize || '')
      .replace(/{{pain_point}}/g, prospect.primaryPainPoint || '')
      .replace(/{{value_prop}}/g, prospect.relevantValueProp || '');
  }

  /**
   * Default webhook handler
   */
  async defaultWebhookHandler(event) {
    logger.info('Unhandled webhook event', { type: event.type, event });
    return { handled: false };
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(automationId) {
    try {
      const response = await this.makeRequest('/automations/stats', {
        automation_id: automationId
      });
      
      return {
        sent: response.data.emails_sent || 0,
        opened: response.data.emails_opened || 0,
        clicked: response.data.links_clicked || 0,
        replied: response.data.emails_replied || 0,
        linkedinConnected: response.data.linkedin_connected || 0,
        meetingsBooked: response.data.meetings_booked || 0,
        openRate: response.data.open_rate || 0,
        clickRate: response.data.click_rate || 0,
        replyRate: response.data.reply_rate || 0
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(automationId) {
    try {
      const response = await this.makeRequest('/automations/pause', {
        automation_id: automationId
      });
      
      return { status: 'paused' };
    } catch (error) {
      logger.error('Failed to pause campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(automationId) {
    try {
      const response = await this.makeRequest('/automations/resume', {
        automation_id: automationId
      });
      
      return { status: 'active' };
    } catch (error) {
      logger.error('Failed to resume campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Make HTTP request to Arcade API
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
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      logger.error('Arcade API error', { 
        endpoint, 
        error: error.message,
        status: error.response?.status 
      });
      throw new Error(`Arcade API error: ${error.message}`);
    }
  }
}

export default new ArcadeService();
