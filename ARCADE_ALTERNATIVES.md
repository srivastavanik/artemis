# ARTEMIS - Arcade Integration Alternatives

## The Issue: Arcade Free Plan Limitations

On Arcade's free plan, you're stuck in a demo environment with:
- Static OAuth providers that can't be edited
- Shared demo engine configuration
- No ability to use your own Google OAuth credentials

## Solution Options

### Option 1: Direct Gmail Integration (Recommended) ✅

Instead of using Arcade's complex setup, implement direct Gmail integration using Google's APIs:

```javascript
// backend/src/services/gmail.service.js
import { google } from 'googleapis';
import config from '../../config/index.js';
import { logger } from '../utils/logger.js';

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      `${config.backend.url}/api/auth/google/callback`
    );
  }

  async sendEmail(userRefreshToken, emailData) {
    try {
      // Set credentials
      this.oauth2Client.setCredentials({
        refresh_token: userRefreshToken
      });

      // Create Gmail client
      const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      // Compose email
      const message = this.createMessage(emailData);

      // Send email
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      return {
        success: true,
        messageId: result.data.id,
        threadId: result.data.threadId
      };
    } catch (error) {
      logger.error('Gmail send error:', error);
      throw error;
    }
  }

  createMessage({ to, subject, body, from }) {
    const message = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      '',
      body
    ].join('\n');

    // Base64 encode
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  getAuthUrl(state) {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.send'],
      state: state,
      prompt: 'consent'
    });
  }

  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }
}

export default new GmailService();
```

### Option 2: Use Nodemailer with OAuth2 ✅

Simpler alternative using Nodemailer:

```javascript
// backend/src/services/email.service.js
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import config from '../../config/index.js';

class EmailService {
  async createTransporter(refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const accessToken = await oauth2Client.getAccessToken();

    return nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: email,
        clientId: config.google.clientId,
        clientSecret: config.google.clientSecret,
        refreshToken: refreshToken,
        accessToken: accessToken.token
      }
    });
  }

  async sendEmail(refreshToken, emailData) {
    const transporter = await this.createTransporter(refreshToken);
    
    const mailOptions = {
      from: emailData.from,
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      text: emailData.text
    };

    return await transporter.sendMail(mailOptions);
  }
}

export default new EmailService();
```

### Option 3: Self-Host Arcade Engine (Complex) ⚠️

If you really want to use Arcade, you need to self-host:

1. **Install Arcade Engine CLI:**
```bash
npm install -g @arcade/engine-cli
```

2. **Create engine.yaml:**
```yaml
version: "1.0"
id: artemis-engine
name: ARTEMIS Email Engine

auth:
  providers:
    - id: google-oauth
      type: oauth
      provider: google
      client_id: ${GOOGLE_CLIENT_ID}
      client_secret: ${GOOGLE_CLIENT_SECRET}
      scopes:
        - https://www.googleapis.com/auth/gmail.send
      redirect_uri: ${GOOGLE_REDIRECT_URI}

workers:
  - id: artemis-email
    type: http
    url: http://localhost:8002
    secret: ${WORKER_SECRET}
```

3. **Run with Docker:**
```dockerfile
# arcade-engine/Dockerfile
FROM arcade/engine:latest
COPY engine.yaml /etc/arcade/engine.yaml
ENV GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
ENV GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
EXPOSE 8080
```

4. **Docker Compose:**
```yaml
# docker-compose.arcade.yml
version: '3.8'
services:
  arcade-engine:
    build: ./arcade-engine
    ports:
      - "8080:8080"
    environment:
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - WORKER_SECRET=${WORKER_SECRET}
```

### Option 4: Use Alternative Email Services ✅

Consider these simpler alternatives:

1. **SendGrid** - Easy API, generous free tier
2. **Mailgun** - Developer-friendly, good deliverability
3. **Amazon SES** - Cost-effective at scale
4. **Postmark** - Great for transactional emails

Example with SendGrid:
```javascript
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: 'recipient@example.com',
  from: 'verified@sender.com',
  subject: 'Hello from ARTEMIS',
  text: 'Email content',
  html: '<strong>Email content</strong>',
};

await sgMail.send(msg);
```

## Recommended Approach

For ARTEMIS, I recommend **Option 1 (Direct Gmail Integration)** because:
- ✅ No additional services needed
- ✅ Works with free Google Cloud account
- ✅ Direct control over email sending
- ✅ No Arcade subscription required
- ✅ Simpler deployment

## Implementation Steps

1. **Update backend services:**
   - Replace arcade.service.js with gmail.service.js
   - Update executor.agent.js to use new service

2. **Update auth flow:**
   - Add Google OAuth routes
   - Store refresh tokens in user metadata

3. **Update frontend:**
   - Add "Connect Gmail" button in Settings
   - Handle OAuth callback

4. **Test thoroughly:**
   - OAuth flow
   - Email sending
   - Token refresh

Would you like me to implement the direct Gmail integration for you?
