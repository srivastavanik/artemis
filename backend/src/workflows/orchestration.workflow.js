import { Workflow } from '@mastra/core';
import { z } from 'zod';
import enrichmentWorkflow from './enrichment.workflow.js';
import scoringWorkflow from './scoring.workflow.js';
import config from '../../config/index.js';

// Input schema for orchestration workflow
const OrchestrationInputSchema = z.object({
  prospects: z.array(z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    company: z.string(),
    linkedinUrl: z.string().optional(),
    websiteUrl: z.string().optional()
  })),
  campaignId: z.string(),
  campaignType: z.enum(['email', 'sms', 'multi'])
});

// Output schema
const OrchestrationOutputSchema = z.object({
  processedCount: z.number(),
  enrichedCount: z.number(),
  scoredCount: z.number(),
  qualifiedCount: z.number(),
  results: z.array(z.object({
    prospectId: z.string(),
    status: z.enum(['enriched', 'scored', 'qualified', 'failed']),
    score: z.number().optional(),
    error: z.string().optional()
  }))
});

export const orchestrationWorkflow = new Workflow({
  name: 'master-orchestration',
  description: 'Orchestrates the entire prospect processing pipeline',
  inputSchema: OrchestrationInputSchema,
  outputSchema: OrchestrationOutputSchema,
  
  execute: async ({ input, context }) => {
    const { prospects, campaignId, campaignType } = input;
    const results = [];
    let enrichedCount = 0;
    let scoredCount = 0;
    let qualifiedCount = 0;
    
    // Process each prospect through the pipeline
    for (const prospect of prospects) {
      try {
        // Step 1: Enrich the prospect
        const enrichmentResult = await enrichmentWorkflow.execute({
          input: {
            prospectId: prospect.id,
            firstName: prospect.firstName,
            lastName: prospect.lastName,
            email: prospect.email,
            company: prospect.company,
            linkedinUrl: prospect.linkedinUrl,
            websiteUrl: prospect.websiteUrl
          }
        });
        
        enrichedCount++;
        
        // Step 2: Score the enriched prospect
        const scoringResult = await scoringWorkflow.execute({
          input: {
            prospectId: prospect.id,
            enrichedData: enrichmentResult.enrichedData,
            interactions: [] // Could fetch from database
          }
        });
        
        scoredCount++;
        
        // Step 3: Check if prospect is qualified (score > 70)
        const overallScore = scoringResult.scores.overallScore;
        const isQualified = overallScore >= 70;
        
        if (isQualified) {
          qualifiedCount++;
        }
        
        // Add result
        results.push({
          prospectId: prospect.id,
          status: isQualified ? 'qualified' : 'scored',
          score: overallScore
        });
        
      } catch (error) {
        console.error(`Failed to process prospect ${prospect.id}:`, error);
        results.push({
          prospectId: prospect.id,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Return orchestration results
    return {
      processedCount: prospects.length,
      enrichedCount,
      scoredCount,
      qualifiedCount,
      results
    };
  }
});

// Export workflow instance
export default orchestrationWorkflow;
