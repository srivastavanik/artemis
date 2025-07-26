import { Workflow } from '@mastra/core';
import { z } from 'zod';
import config from '../../config/index.js';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Input schema for scoring workflow
const ScoringInputSchema = z.object({
  prospectId: z.string(),
  enrichedData: z.object({
    jobTitle: z.string(),
    seniority: z.string(),
    department: z.string(),
    companySize: z.string(),
    industry: z.string(),
    technologies: z.array(z.string()),
    painPoints: z.array(z.string()),
    buyingIntent: z.number()
  }),
  interactions: z.array(z.object({
    type: z.string(),
    timestamp: z.string(),
    engagement: z.string()
  })).optional()
});

// Output schema
const ScoringOutputSchema = z.object({
  prospectId: z.string(),
  scores: z.object({
    fitScore: z.number().min(0).max(100),
    engagementScore: z.number().min(0).max(100),
    timingScore: z.number().min(0).max(100),
    overallScore: z.number().min(0).max(100)
  }),
  insights: z.array(z.string()),
  recommendedActions: z.array(z.string())
});

export const scoringWorkflow = new Workflow({
  name: 'prospect-scoring',
  description: 'Scores prospects based on fit, engagement, and timing signals',
  inputSchema: ScoringInputSchema,
  outputSchema: ScoringOutputSchema,
  
  execute: async ({ input, context }) => {
    const { prospectId, enrichedData, interactions = [] } = input;
    
    try {
      // Prepare scoring prompt
      const scoringPrompt = `
        Analyze this prospect and provide detailed scoring:
        
        Prospect Profile:
        - Title: ${enrichedData.jobTitle}
        - Seniority: ${enrichedData.seniority}
        - Department: ${enrichedData.department}
        - Company Size: ${enrichedData.companySize}
        - Industry: ${enrichedData.industry}
        - Technologies: ${enrichedData.technologies.join(', ')}
        - Pain Points: ${enrichedData.painPoints.join(', ')}
        - Initial Intent: ${enrichedData.buyingIntent}
        
        Recent Interactions: ${interactions.length}
        ${interactions.map(i => `- ${i.type}: ${i.engagement} (${i.timestamp})`).join('\n')}
        
        Provide scores (0-100) for:
        1. Fit Score - How well they match our ideal customer profile
        2. Engagement Score - Their level of interest and interaction
        3. Timing Score - Likelihood to buy in next 90 days
        4. Overall Score - Weighted combination
        
        Also provide:
        - Key insights about this prospect
        - Recommended next actions
        
        Format as JSON.
      `;
      
      // Use OpenAI to score the prospect
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a sales intelligence AI that scores B2B prospects accurately based on multiple factors.'
          },
          {
            role: 'user',
            content: scoringPrompt
          }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      });
      
      const scoringResult = JSON.parse(completion.choices[0].message.content);
      
      // Structure the scoring output
      return {
        prospectId,
        scores: {
          fitScore: scoringResult.fit_score || 70,
          engagementScore: scoringResult.engagement_score || 60,
          timingScore: scoringResult.timing_score || 50,
          overallScore: scoringResult.overall_score || 65
        },
        insights: scoringResult.insights || [
          'Strong fit based on company size and industry',
          'Technologies align with our solution'
        ],
        recommendedActions: scoringResult.recommended_actions || [
          'Send personalized outreach focusing on pain points',
          'Schedule follow-up in 2 weeks'
        ]
      };
      
    } catch (error) {
      console.error('Scoring workflow error:', error);
      throw new Error(`Failed to score prospect ${prospectId}: ${error.message}`);
    }
  }
});

// Export workflow instance
export default scoringWorkflow;
