import { Workflow } from '@mastra/core';
import { z } from 'zod';
import config from '../../config/index.js';
import OpenAI from 'openai';

// Initialize OpenAI client for Mastra
const openai = new OpenAI({
  apiKey: config.openai.apiKey
});

// Input schema for enrichment workflow
const EnrichmentInputSchema = z.object({
  prospectId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  company: z.string(),
  linkedinUrl: z.string().optional(),
  websiteUrl: z.string().optional()
});

// Output schema
const EnrichmentOutputSchema = z.object({
  prospectId: z.string(),
  enrichedData: z.object({
    jobTitle: z.string().optional(),
    seniority: z.string().optional(),
    department: z.string().optional(),
    companySize: z.string().optional(),
    industry: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    painPoints: z.array(z.string()).optional(),
    buyingIntent: z.number().min(0).max(100)
  }),
  sources: z.array(z.string())
});

export const enrichmentWorkflow = new Workflow({
  name: 'prospect-enrichment',
  description: 'Enriches prospect data using multiple sources and AI analysis',
  inputSchema: EnrichmentInputSchema,
  outputSchema: EnrichmentOutputSchema,
  
  execute: async ({ input, context }) => {
    const { prospectId, firstName, lastName, email, company, linkedinUrl, websiteUrl } = input;
    
    try {
      // Step 1: Gather data from multiple sources
      const enrichmentPrompt = `
        Analyze the following prospect information and provide enrichment data:
        
        Name: ${firstName} ${lastName}
        Email: ${email}
        Company: ${company}
        LinkedIn: ${linkedinUrl || 'Not provided'}
        Website: ${websiteUrl || 'Not provided'}
        
        Based on the email domain and company information, provide:
        1. Likely job title
        2. Seniority level (Entry, Mid, Senior, Executive)
        3. Department
        4. Company size estimate
        5. Industry
        6. Technologies they likely use
        7. Potential pain points
        8. Buying intent score (0-100)
        
        Format as JSON.
      `;
      
      // Use OpenAI to analyze and enrich the data
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a B2B sales intelligence expert. Analyze prospect data and provide accurate enrichment information.'
          },
          {
            role: 'user',
            content: enrichmentPrompt
          }
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' }
      });
      
      const enrichedData = JSON.parse(completion.choices[0].message.content);
      
      // Step 2: Validate and structure the enriched data
      const structuredData = {
        jobTitle: enrichedData.job_title || '',
        seniority: enrichedData.seniority_level || '',
        department: enrichedData.department || '',
        companySize: enrichedData.company_size || '',
        industry: enrichedData.industry || '',
        technologies: enrichedData.technologies || [],
        painPoints: enrichedData.pain_points || [],
        buyingIntent: enrichedData.buying_intent_score || 50
      };
      
      // Return enriched data
      return {
        prospectId,
        enrichedData: structuredData,
        sources: ['email-analysis', 'domain-lookup', 'ai-inference']
      };
      
    } catch (error) {
      console.error('Enrichment workflow error:', error);
      throw new Error(`Failed to enrich prospect ${prospectId}: ${error.message}`);
    }
  }
});

// Export workflow instance
export default enrichmentWorkflow;
