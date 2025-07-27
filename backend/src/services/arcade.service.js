import axios from 'axios';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class ArcadeService {
  constructor() {
    this.apiKey = config.arcade.apiKey;
    this.baseUrl = config.arcade.baseUrl || 'https://api.arcade.software/v1';
    this.campaignStates = new Map();
    this.webhookHandlers = new Map();
    
    // Initialize webhook handlers
    this.registerWebhookHandlers();
    
    // Validate API key
    if (!this.apiKey) {
      logger.warn('Arcade API key not configured');
    }
  }

  /**
   * Test Arcade API connection
   */
  async testConnection() {
    try {
      const response = await this.makeRequest('/account/info', null, 'GET');
      logger.info('Arcade API connected successfully', {
        account: response.account,
        plan: response.plan
      });
      return {
        connected: true,
        account: response.account,
        plan: response.plan
      };
    } catch (error) {
      logger.error('Arcade API connection test failed', { error: error.message });
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Create multi-channel campaign using Arcade API
   */
  async createCampaign(campaign, prospects) {
    try {
      const automationFlow = this.buildAutomationFlow(campaign, prospects);
      
      const response = await this.makeRequest('/campaigns/create', {
        name: campaign.name,
        description: campaign.description,
        flow: automationFlow,
        prospects: prospects.map(p => ({
          id: p.id,
          email: p.email,
          firstName: p.firstName,
          lastName: p.lastName,
          company: p.companyName,
          linkedinUrl: p.linkedinUrl,
          customFields: {
            jobTitle: p.jobTitle,
            industry: p.industry,
            location: p.location
          }
        })),
        settings: {
          timezoneAware: true,
          respectBusinessHours: true,
          businessHours: {
            start: '09:00',
            end: '17:00',
            timezone: 'America/New_York'
          },
          pauseOnWeekends: campaign.pauseOnWeekends || false,
          maxDailySends: campaign.maxDailySends || 50,
          enableWebhooks: true,
          webhookUrl: `${process.env.API_URL}/api/webhooks/arcade`,
          trackingPixel: true,
          trackLinks: true
        }
      });

      const campaignId = response.id;
      
      // Store campaign state
      this.campaignStates.set(campaignId, {
        campaignId: campaign.id,
        arcadeCampaignId: campaignId,
        prospects: prospects.map(p => p.id),
        currentSteps: {},
        startedAt: new Date(),
        status: 'active'
      });

      return {
        campaignId,
        status: 'active',
        prospectCount: prospects.length,
        estimatedCompletionDate: response.estimatedCompletionDate
      };
    } catch (error) {
      logger.error('Arcade campaign creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send personalized email using Arcade API
   */
  async sendEmail(prospect, message, options = {}) {
    try {
      const personalizedMessage = {
        subject: this.personalizeContent(message.subject, prospect),
        body: this.personalizeContent(message.content, prospect)
      };

      // Prepare email data for Arcade API
      const emailData = {
        to: prospect.email,
        from: options.from || 'nicksrivwork@gmail.com',
        replyTo: options.replyTo || 'nicksrivwork@gmail.com',
        subject: personalizedMessage.subject,
        body: personalizedMessage.body,
        html: this.formatEmailHtml(personalizedMessage.body, prospect, message),
        prospectId: prospect.id,
        messageId: message.id,
        campaignId: message.campaignId,
        trackOpens: options.trackOpens !== false,
        trackClicks: options.trackClicks !== false,
        metadata: {
          firstName: prospect.firstName,
          lastName: prospect.lastName,
          company: prospect.companyName,
          jobTitle: prospect.jobTitle
        }
      };

      // Schedule if specified
      if (options.scheduledFor) {
        emailData.scheduledFor = options.scheduledFor;
      }

      // Add calendar invite if specified
      if (options.includeCalendarInvite) {
        emailData.calendarInvite = {
          enabled: true,
          meetingDetails: options.meetingDetails
        };
      }

      // Send via Arcade API
      const response = await this.makeRequest('/emails/send', emailData);

      return {
        messageId: response.id,
        status: response.status,
        scheduledFor: response.scheduledFor || new Date(),
        trackingId: response.trackingId
      };
    } catch (error) {
      logger.error('Email send failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send LinkedIn message via Arcade API
   */
  async sendLinkedInMessage(prospect, message) {
    try {
      // Check connection status via Arcade
      const connectionStatus = await this.checkLinkedInConnection(prospect.linkedinUrl);
      
      if (!connectionStatus.connected) {
        // Send connection request first
        await this.sendLinkedInConnectionRequest(prospect);
        
        // Schedule message for after connection is accepted
        return this.scheduleLinkedInMessage(prospect, message, { 
          delayDays: 2 
        });
      }

      // Send message via Arcade API
      const response = await this.makeRequest('/linkedin/messages/send', {
        profileUrl: prospect.linkedinUrl,
        message: this.personalizeContent(message.content, prospect),
        prospectId: prospect.id,
        messageId: message.id,
        trackingEnabled: true
      });

      return {
        messageId: response.messageId,
        status: 'sent',
        platform: 'linkedin',
        sentAt: new Date()
      };
    } catch (error) {
      logger.error('LinkedIn message send failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Send LinkedIn connection request via Arcade API
   */
  async sendLinkedInConnectionRequest(prospect, note = null) {
    try {
      const defaultNote = `Hi ${prospect.firstName}, I came across your profile and was impressed by your work at ${prospect.companyName}. Would love to connect and share insights about ${prospect.industry || 'your industry'}.`;
      
      const response = await this.makeRequest('/linkedin/connections/send', {
        profileUrl: prospect.linkedinUrl,
        note: note || this.personalizeContent(defaultNote, prospect),
        prospectId: prospect.id
      });

      return {
        requestId: response.requestId,
        status: 'pending',
        sentAt: new Date()
      };
    } catch (error) {
      logger.error('LinkedIn connection request failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Schedule calendar invite using Arcade API
   */
  async scheduleCalendarInvite(prospect, meetingDetails) {
    try {
      const calendarData = {
        title: this.personalizeContent(meetingDetails.title, prospect),
        description: this.personalizeContent(meetingDetails.description, prospect),
        startTime: meetingDetails.startTime,
        endTime: meetingDetails.endTime,
        timezone: prospect.timezone || 'America/New_York',
        attendee: {
          email: prospect.email,
          name: `${prospect.firstName} ${prospect.lastName}`
        },
        location: meetingDetails.location || 'Virtual Meeting',
        includeConferenceLink: true,
        reminders: [
          { type: 'email', minutes: 24 * 60 }, // 1 day before
          { type: 'email', minutes: 15 }
        ],
        prospectId: prospect.id,
        metadata: {
          company: prospect.companyName,
          jobTitle: prospect.jobTitle
        }
      };

      // Send calendar invite via Arcade API
      const response = await this.makeRequest('/calendar/invite', calendarData);

      return {
        inviteId: response.id,
        status: 'scheduled',
        meetingLink: response.conferenceLink,
        htmlLink: response.inviteLink,
        trackingId: response.trackingId
      };
    } catch (error) {
      logger.error('Calendar invite creation failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Build automation flow for Arcade
   */
  buildAutomationFlow(campaign, prospects) {
    const flow = {
      name: campaign.name,
      triggers: [{
        type: 'manual',
        prospectList: prospects.map(p => p.id)
      }],
      
      steps: this.buildCampaignSteps(campaign),
      
      conditions: this.buildCampaignConditions(campaign),
      
      exitConditions: [
        {
          type: 'positive_reply',
          action: 'mark_qualified',
          notifyTeam: true
        },
        {
          type: 'unsubscribe',
          action: 'remove_from_campaign'
        },
        {
          type: 'hard_bounce',
          action: 'mark_invalid_email'
        },
        {
          type: 'meeting_booked',
          action: 'mark_converted',
          notifyTeam: true
        }
      ],
      
      analytics: {
        trackOpens: true,
        trackClicks: true,
        trackReplies: true,
        sentimentAnalysis: true
      }
    };

    return flow;
  }

  /**
   * Build campaign steps for Arcade
   */
  buildCampaignSteps(campaign) {
    const steps = [];
    
    // Initial touch - LinkedIn connection if available
    if (campaign.channels.includes('linkedin')) {
      steps.push({
        id: 'linkedin_connect',
        type: 'linkedin_connection',
        waitForAcceptance: true,
        timeoutDays: 7,
        noteTemplate: campaign.linkedinConnectionNote,
        conditions: {
          hasLinkedIn: true
        }
      });
    }

    // Email sequence
    if (campaign.channels.includes('email')) {
      campaign.emailSequence?.forEach((email, index) => {
        steps.push({
          id: `email_${index + 1}`,
          type: 'email',
          subjectTemplate: email.subject,
          bodyTemplate: email.body,
          waitDays: email.waitDays || 3,
          skipConditions: ['replied', 'meeting_booked', 'unsubscribed'],
          abTest: email.abTest || null,
          sendWindow: {
            startHour: 9,
            endHour: 17,
            timezone: 'prospect_timezone'
          }
        });
      });
    }

    // LinkedIn follow-up
    if (campaign.channels.includes('linkedin') && campaign.linkedinFollowUp) {
      steps.push({
        id: 'linkedin_message',
        type: 'linkedin_message',
        messageTemplate: campaign.linkedinFollowUp,
        waitDays: 5,
        skipConditions: ['replied', 'meeting_booked'],
        requireConnection: true
      });
    }

    // Calendar invite for engaged prospects
    if (campaign.channels.includes('calendar')) {
      steps.push({
        id: 'calendar_invite',
        type: 'calendar_invite',
        triggerCondition: {
          type: 'engagement_score',
          operator: 'greater_than',
          value: 0.7
        },
        meetingDuration: 30,
        availabilityCheck: true,
        titleTemplate: campaign.meetingTitle || "Quick chat about {{company_name}}'s goals",
        descriptionTemplate: campaign.meetingDescription
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
        action: 'pause_prospect'
      },
      {
        id: 'reply_sentiment',
        type: 'sentiment_analysis',
        operator: 'equals',
        value: 'negative',
        action: 'notify_team'
      }
    ];
  }

  /**
   * Check LinkedIn connection status
   */
  async checkLinkedInConnection(linkedinUrl) {
    try {
      const response = await this.makeRequest('/linkedin/connections/status', {
        profileUrl: linkedinUrl
      });
      
      return {
        connected: response.connected,
        connectionDate: response.connectionDate,
        connectionType: response.connectionType
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
      
      const response = await this.makeRequest('/linkedin/messages/schedule', {
        profileUrl: prospect.linkedinUrl,
        message: this.personalizeContent(message.content, prospect),
        scheduledFor: scheduledTime.toISOString(),
        waitForConnection: true,
        prospectId: prospect.id,
        messageId: message.id
      });
      
      return {
        messageId: response.messageId,
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
   * Handle webhook events from Arcade
   */
  async handleWebhook(event) {
    try {
      // Validate webhook signature
      if (!this.validateWebhookSignature(event.signature, event.payload)) {
        throw new Error('Invalid webhook signature');
      }

      const handler = this.webhookHandlers.get(event.type) || this.defaultWebhookHandler;
      const result = await handler.call(this, event);
      
      // Update campaign state
      if (event.campaignId && this.campaignStates.has(event.campaignId)) {
        const state = this.campaignStates.get(event.campaignId);
        
        if (event.prospectId) {
          state.currentSteps[event.prospectId] = event.currentStep;
          state.lastActivity = new Date();
        }
        
        this.campaignStates.set(event.campaignId, state);
      }
      
      // Store interaction in database
      await this.storeInteraction(event);
      
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
    this.webhookHandlers.set('linkedin_message_sent', this.handleLinkedInMessageSent);
    this.webhookHandlers.set('meeting_booked', this.handleMeetingBooked);
    this.webhookHandlers.set('unsubscribed', this.handleUnsubscribed);
    this.webhookHandlers.set('bounced', this.handleBounced);
  }

  /**
   * Webhook handlers
   */
  async handleEmailOpened(event) {
    logger.info('Email opened', { 
      prospectId: event.prospectId, 
      messageId: event.messageId,
      openCount: event.openCount
    });
    
    return {
      type: 'email_open',
      timestamp: new Date(),
      engagementIncrease: 0.1,
      metadata: event
    };
  }

  async handleLinkClicked(event) {
    logger.info('Link clicked', { 
      prospectId: event.prospectId, 
      link: event.clickedLink,
      clickCount: event.clickCount
    });
    
    return {
      type: 'link_click',
      engagementIncrease: 0.2,
      timestamp: new Date(),
      metadata: event
    };
  }

  async handleEmailReplied(event) {
    logger.info('Email replied', { 
      prospectId: event.prospectId,
      sentiment: event.sentimentAnalysis,
      replyText: event.replyPreview
    });
    
    // Positive reply - mark as qualified lead
    if (event.sentimentAnalysis?.score > 0.6) {
      return {
        type: 'positive_reply',
        action: 'qualify_lead',
        engagementIncrease: 0.5,
        timestamp: new Date(),
        metadata: event
      };
    }
    
    return {
      type: 'reply',
      engagementIncrease: 0.3,
      timestamp: new Date(),
      metadata: event
    };
  }

  /**
   * Format email HTML with tracking
   */
  formatEmailHtml(content, prospect, message) {
    const template = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .content { line-height: 1.6; color: #333; }
            .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
            a { color: #007bff; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="content">
              ${content.replace(/\n/g, '<br>')}
            </div>
            <div class="signature">
              <p>Best regards,<br>
              The Artemis Team</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Replace links with trackable versions
    return template.replace(
      /<a\s+href="([^"]+)"/g,
      (match, url) => `<a href="${this.getTrackableLink(url, prospect.id, message.id)}"`
    );
  }

  /**
   * Get tracking pixel HTML
   */
  getTrackingPixel(prospectId, messageId) {
    const trackingUrl = `${this.baseUrl}/tracking/pixel?p=${prospectId}&m=${messageId}`;
    return `<img src="${trackingUrl}" width="1" height="1" style="display:none;" alt="">`;
  }

  /**
   * Get trackable link
   */
  getTrackableLink(originalUrl, prospectId, messageId) {
    const encoded = Buffer.from(originalUrl).toString('base64');
    return `${this.baseUrl}/tracking/click?u=${encoded}&p=${prospectId}&m=${messageId}`;
  }

  /**
   * Create calendar invite data
   */
  createCalendarInvite(prospect, meetingDetails) {
    const start = new Date(meetingDetails.startTime);
    const end = new Date(meetingDetails.endTime);
    
    return {
      filename: 'invite.ics',
      method: 'REQUEST',
      content: {
        start,
        end,
        summary: this.personalizeContent(meetingDetails.title, prospect),
        description: this.personalizeContent(meetingDetails.description, prospect),
        location: meetingDetails.location || 'Virtual Meeting',
        organizer: {
          name: 'Artemis Sales Team',
          email: 'sales@company.com'
        },
        attendees: [{
          name: `${prospect.firstName} ${prospect.lastName}`,
          email: prospect.email,
          rsvp: true
        }]
      }
    };
  }

  /**
   * Personalize content with prospect data
   */
  personalizeContent(template, prospect) {
    if (!template) return '';
    
    return template
      .replace(/{{first_name}}/gi, prospect.firstName || '')
      .replace(/{{last_name}}/gi, prospect.lastName || '')
      .replace(/{{company_name}}/gi, prospect.companyName || '')
      .replace(/{{job_title}}/gi, prospect.jobTitle || '')
      .replace(/{{industry}}/gi, prospect.industry || '')
      .replace(/{{location}}/gi, prospect.location || '')
      .replace(/{{company_size}}/gi, prospect.companySize || '')
      .replace(/{{pain_point}}/gi, prospect.primaryPainPoint || '')
      .replace(/{{value_prop}}/gi, prospect.relevantValueProp || '')
      .replace(/{{custom\.([\w]+)}}/gi, (match, field) => prospect.customFields?.[field] || '');
  }

  /**
   * Log email sent to Arcade
   */
  async logEmailSent(prospectId, messageId, emailMessageId) {
    try {
      await this.makeRequest('/analytics/log', {
        type: 'email_sent',
        prospectId,
        messageId,
        emailMessageId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log email sent', { error: error.message });
    }
  }

  /**
   * Log calendar invite
   */
  async logCalendarInvite(prospectId, eventId, meetingLink) {
    try {
      await this.makeRequest('/analytics/log', {
        type: 'calendar_invite_sent',
        prospectId,
        eventId,
        meetingLink,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Failed to log calendar invite', { error: error.message });
    }
  }

  /**
   * Store interaction in database
   */
  async storeInteraction(event) {
    try {
      const { supabase } = await import('./supabase.service.js');
      
      await supabase.default.client
        .from('interactions')
        .insert({
          prospect_id: event.prospectId,
          type: event.type,
          channel: event.channel || 'email',
          message_id: event.messageId,
          campaign_id: event.campaignId,
          details: event,
          occurred_at: new Date().toISOString()
        });
    } catch (error) {
      logger.error('Failed to store interaction', { error: error.message });
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId) {
    try {
      const response = await this.makeRequest(`/campaigns/${campaignId}/stats`, null, 'GET');
      
      return {
        sent: response.emailsSent || 0,
        opened: response.emailsOpened || 0,
        clicked: response.linksClicked || 0,
        replied: response.emailsReplied || 0,
        linkedinConnected: response.linkedinConnected || 0,
        meetingsBooked: response.meetingsBooked || 0,
        unsubscribed: response.unsubscribed || 0,
        bounced: response.bounced || 0,
        openRate: response.openRate || 0,
        clickRate: response.clickRate || 0,
        replyRate: response.replyRate || 0,
        conversionRate: response.conversionRate || 0,
        engagementScore: response.engagementScore || 0
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId) {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/pause`, null, 'POST');
      
      if (this.campaignStates.has(campaignId)) {
        const state = this.campaignStates.get(campaignId);
        state.status = 'paused';
        this.campaignStates.set(campaignId, state);
      }
      
      return { status: 'paused' };
    } catch (error) {
      logger.error('Failed to pause campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId) {
    try {
      await this.makeRequest(`/campaigns/${campaignId}/resume`, null, 'POST');
      
      if (this.campaignStates.has(campaignId)) {
        const state = this.campaignStates.get(campaignId);
        state.status = 'active';
        this.campaignStates.set(campaignId, state);
      }
      
      return { status: 'active' };
    } catch (error) {
      logger.error('Failed to resume campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Default webhook handler
   */
  async defaultWebhookHandler(event) {
    logger.info('Unhandled webhook event', { type: event.type, event });
    return { handled: false };
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(signature, payload) {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.apiKey)
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return signature === expectedSignature;
  }

  /**
   * Make HTTP request to Arcade API
   */
  async makeRequest(endpoint, data, method = 'POST') {
    try {
      const response = await axios({
        method,
        url: `${this.baseUrl}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'X-API-Version': '2024-01'
        },
        data,
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      logger.error('Arcade API error', { 
        endpoint, 
        error: error.message,
        status: error.response?.status,
        data: error.response?.data 
      });
      
      // Handle specific error codes
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Arcade credentials.');
      }
      if (error.response?.status === 402) {
        throw new Error('Payment required. Please check your Arcade subscription.');
      }
      
      throw new Error(`Arcade API error: ${error.message}`);
    }
  }
}

export default new ArcadeService();
