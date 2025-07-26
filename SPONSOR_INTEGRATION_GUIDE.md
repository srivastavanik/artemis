# ARTEMIS - Sponsor Integration Implementation Guide

This guide provides step-by-step instructions to fully activate all sponsor integrations for production use.

## Prerequisites

Ensure all environment variables in `.env` are properly configured with valid API keys:
- BRIGHTDATA_API_KEY
- LLAMAINDEX_API_KEY  
- ARCADE_API_KEY
- OPENAI_API_KEY
- PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME
- MASTRA_API_KEY (or falls back to OPENAI_API_KEY)
- MASTRA_WEBHOOK_SECRET
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY

## 1. Database Schema Updates

Run the new migration to add missing tables:

```bash
# Connect to your Supabase database and run:
psql $DATABASE_URL < database/migrations/005_add_missing_tables.sql
```

This adds:
- workspace_invitations
- audit_logs  
- prospects_quarantine
- prospects_staging

## 2. BrightData Integration

### Configuration Complete ✅
- API credentials: Uses `BRIGHTDATA_API_KEY`
- Base URL: https://api.brightdata.com/v2
- Retry logic: Exponential backoff (1s, 2s, 4s) on 429/5xx errors
- Rate limiting: Automatic with configurable retries

### Usage in Code:
```javascript
// In Scout agent after BrightData enrichment
const enrichedData = await brightDataService.searchPerson(prospectInfo);
const prospect = await supabaseService.createProspect(enrichedData, workspaceId);
await supabaseService.storeEnrichmentData(prospect.id, 'brightdata', enrichedData, workspaceId);
```

### Webhook Setup:
```javascript
// One-time setup
const webhook = await brightDataService.setupWebhook(
  'https://your-domain.com/api/webhooks/brightdata',
  ['profile_update', 'company_update']
);
```

## 3. LlamaIndex + Pinecone Integration

### Initialization (Run Once):
```javascript
// In server startup or setup script
import llamaIndexService from './services/llamaindex.service.js';
await llamaIndexService.initializeIndex();
```

### Usage for Scoring:
```javascript
// In Analyst agent
const insights = await llamaIndexService.analyzeProspect(prospectData);
const scores = await llamaIndexService.scoreProspect(prospectData, enrichmentData);
await supabaseService.updateEngagementScores(prospect.id, scores);
```

### Personalization:
```javascript
// In Strategist agent
const strategy = await llamaIndexService.generatePersonalizationStrategy(prospect, insights);
const emailContent = await llamaIndexService.generateEmailContent(prospect, campaign, context);
```

## 4. Mastra Workflow Integration

### Install Package ✅
```bash
cd backend && npm install @mastra/core
```

### Initialize Mastra:
```javascript
// Add to server.js
import { Mastra } from '@mastra/core';
import enrichmentWorkflow from './workflows/enrichment.workflow.js';

const mastra = new Mastra({
  apiKey: config.mastra.apiKey,
  workflows: [enrichmentWorkflow]
});

// Make available globally
app.locals.mastra = mastra;
```

### Trigger Enrichment:
```javascript
// After creating prospect
const enrichmentResult = await app.locals.mastra.runWorkflow('enrichment', {
  prospectId: prospect.id,
  prospectData: prospect
});

await supabaseService.storeEnrichmentData(
  prospect.id, 
  'mastra', 
  enrichmentResult,
  workspaceId
);
```

## 5. Arcade Campaign Orchestration

### Gmail OAuth Setup:

1. Create OAuth consent screen in Google Cloud Console
2. Add authorized redirect URI: `https://your-domain.com/api/auth/google/callback`
3. Enable Gmail API

### Update Auth Service:
```javascript
// In auth.service.js - implement Gmail OAuth
async authorizeGmail(userId, code) {
  const oauth2Client = new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
  
  const { tokens } = await oauth2Client.getToken(code);
  
  // Store refresh token in user metadata
  await this.supabase
    .from('users')
    .update({ 
      metadata: { 
        ...user.metadata,
        gmail_refresh_token: tokens.refresh_token 
      }
    })
    .eq('id', userId);
    
  return tokens;
}
```

### Send Campaign Email:
```javascript
// In Executor agent
const user = await authService.getUserById(campaign.created_by);
const gmailToken = user.metadata?.gmail_refresh_token;

if (!gmailToken) {
  throw new Error('Gmail not authorized. Please connect Gmail account.');
}

const result = await arcadeService.sendEmail({
  to: prospect.email,
  subject: message.subject,
  content: message.content,
  from: user.email,
  gmailToken: gmailToken
});
```

## 6. Webhook Endpoints Implementation

Create webhook routes to handle provider callbacks:

```javascript
// backend/src/routes/webhooks.routes.js

// BrightData webhook
router.post('/brightdata', async (req, res) => {
  const signature = req.headers['x-brightdata-signature'];
  if (!brightDataService.validateWebhookSignature(signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook data
  const { prospect_id, event_type, data } = req.body;
  await supabaseService.storeEnrichmentData(
    prospect_id,
    'brightdata_webhook',
    data,
    req.user.workspace_id
  );
  
  res.json({ success: true });
});

// Arcade webhook  
router.post('/arcade', async (req, res) => {
  const { message_id, event, timestamp } = req.body;
  
  await supabaseService.updateMessageStatus(message_id, event, {
    timestamp,
    metadata: req.body
  });
  
  res.json({ success: true });
});

// Mastra webhook
router.post('/mastra', async (req, res) => {
  const signature = req.headers['x-mastra-signature'];
  const expectedSig = crypto
    .createHmac('sha256', config.mastra.webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature !== expectedSig) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process Mastra webhook
  const { workflow_id, result, prospect_id } = req.body;
  await supabaseService.storeEnrichmentData(
    prospect_id,
    'mastra_workflow',
    result,
    req.user.workspace_id
  );
  
  res.json({ success: true });
});
```

## 7. Production Deployment Checklist

### Environment Configuration:
- [ ] All API keys are valid and have sufficient quota
- [ ] Webhook URLs are configured in each service dashboard
- [ ] CORS is configured for your frontend domain
- [ ] Rate limiting is configured appropriately

### Service Initialization:
- [ ] Pinecone index created (run once)
- [ ] Mastra workflows registered
- [ ] Gmail OAuth configured
- [ ] Webhook endpoints deployed and accessible

### Database:
- [ ] All migrations applied
- [ ] Indexes created for performance
- [ ] Row-level security policies configured

### Monitoring:
- [ ] Error tracking configured (Sentry, etc.)
- [ ] API usage monitoring for each service
- [ ] Alerts for rate limit warnings
- [ ] Database query performance monitoring

## 8. Testing Integration

### Test BrightData:
```javascript
const testProspect = await brightDataService.searchPerson({
  name: 'John Doe',
  company: 'Acme Corp'
});
console.log('BrightData result:', testProspect);
```

### Test LlamaIndex:
```javascript
await llamaIndexService.initializeIndex();
const scores = await llamaIndexService.scoreProspect(
  { id: 'test', name: 'Test User' },
  { company: 'Test Co' }
);
console.log('Scores:', scores);
```

### Test Arcade:
```javascript
const testEmail = await arcadeService.sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  content: 'Test email',
  gmailToken: 'user_gmail_token'
});
console.log('Email sent:', testEmail);
```

## 9. Common Issues & Solutions

### BrightData 429 Errors:
- Implemented automatic retry with exponential backoff
- Consider upgrading plan if hitting limits frequently

### LlamaIndex/OpenAI Rate Limits:
- Use gpt-3.5-turbo for scoring (higher limits)
- Use gpt-4-turbo-preview only for critical generation
- Implement request queuing for bulk operations

### Pinecone Index Not Found:
- Run `await llamaIndexService.initializeIndex()` once
- Verify PINECONE_INDEX_NAME matches exactly

### Gmail Auth Issues:
- Ensure OAuth consent screen is in production
- Verify redirect URI matches exactly
- Check if refresh token is stored properly

### Webhook Signature Failures:
- Ensure webhook secrets match exactly
- Use raw body for signature validation (not parsed JSON)
- Check for trailing slashes in URLs

## 10. Workspace Support

All service methods now require workspace_id:

```javascript
// Always pass workspace_id from authenticated user
const workspaceId = req.user.workspace_id;

await supabaseService.createProspect(data, workspaceId);
await supabaseService.searchProspects(filters, workspaceId);
await supabaseService.createCampaign(campaign, workspaceId);
```

## Summary

With these implementations:
1. ✅ BrightData provides real-time prospect enrichment with retry logic
2. ✅ LlamaIndex enables AI-powered scoring and personalization
3. ✅ Mastra orchestrates complex enrichment workflows
4. ✅ Arcade handles multi-channel campaign execution
5. ✅ All data is properly stored in Supabase with workspace isolation
6. ✅ Webhooks keep data synchronized across services

The system is now ready for production use with all sponsor integrations fully activated.
