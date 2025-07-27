import { Router } from 'express';
import pipelineWorker from '../services/pipeline.worker.js';
import enrichmentWorker from '../services/enrichment.worker.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/pipeline/stats
 * Get pipeline statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const pipelineStats = await pipelineWorker.getPipelineStats();
    const enrichmentStats = await enrichmentWorker.getEnrichmentStats();
    
    res.json({
      success: true,
      data: {
        pipeline: pipelineStats,
        enrichment: enrichmentStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get pipeline stats', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve pipeline statistics'
    });
  }
});

/**
 * POST /api/pipeline/process
 * Manually trigger pipeline processing
 */
router.post('/process', async (req, res) => {
  try {
    const { batchSize = 50 } = req.body;
    
    logger.info('Manual pipeline processing triggered', { batchSize });
    
    const results = await pipelineWorker.processStagingTable(batchSize);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Manual pipeline processing failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/enrich
 * Manually trigger enrichment
 */
router.post('/enrich', async (req, res) => {
  try {
    const { prospectIds } = req.body;
    
    let results;
    
    if (prospectIds && Array.isArray(prospectIds)) {
      // Enrich specific prospects
      logger.info('Manual enrichment triggered for specific prospects', {
        count: prospectIds.length
      });
      results = await enrichmentWorker.enrichProspectsBatch(prospectIds);
    } else {
      // Run scheduled enrichment
      logger.info('Manual scheduled enrichment triggered');
      results = await enrichmentWorker.runScheduledEnrichment();
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    logger.error('Manual enrichment failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/pipeline/quarantine/review
 * Process quarantined records marked as approved
 */
router.post('/quarantine/review', async (req, res) => {
  try {
    const { limit = 10 } = req.body;
    
    logger.info('Manual quarantine review triggered', { limit });
    
    const results = await pipelineWorker.processQuarantinedRecords(limit);
    
    res.json({
      success: true,
      data: {
        processed: results.length,
        records: results
      }
    });
  } catch (error) {
    logger.error('Manual quarantine review failed', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/pipeline/health
 * Check pipeline health
 */
router.get('/health', async (req, res) => {
  try {
    const enrichmentHealth = await enrichmentWorker.checkEnrichmentHealth();
    const pipelineStats = await pipelineWorker.getPipelineStats();
    
    // Determine overall health
    const stagingBacklog = pipelineStats?.staging?.pending || 0;
    const quarantineBacklog = pipelineStats?.quarantine?.pending || 0;
    const errorRate = pipelineStats?.staging?.total 
      ? (pipelineStats.staging.error / pipelineStats.staging.total * 100)
      : 0;
    
    const isHealthy = enrichmentHealth.healthy && 
                     stagingBacklog < 1000 && 
                     errorRate < 10;
    
    res.json({
      success: true,
      data: {
        healthy: isHealthy,
        enrichment: enrichmentHealth,
        pipeline: {
          stagingBacklog,
          quarantineBacklog,
          errorRate: errorRate.toFixed(2) + '%'
        },
        recommendations: getHealthRecommendations(
          enrichmentHealth,
          stagingBacklog,
          quarantineBacklog,
          errorRate
        )
      }
    });
  } catch (error) {
    logger.error('Failed to check pipeline health', { error: error.message });
    res.status(500).json({
      success: false,
      error: 'Failed to check pipeline health'
    });
  }
});

/**
 * Helper function to generate health recommendations
 */
function getHealthRecommendations(enrichmentHealth, stagingBacklog, quarantineBacklog, errorRate) {
  const recommendations = [];
  
  if (!enrichmentHealth.healthy) {
    recommendations.push({
      type: 'warning',
      message: 'Enrichment service is not healthy. Check API credentials and rate limits.'
    });
  }
  
  if (stagingBacklog > 500) {
    recommendations.push({
      type: 'warning',
      message: `High staging backlog (${stagingBacklog} records). Consider increasing processing frequency.`
    });
  }
  
  if (quarantineBacklog > 100) {
    recommendations.push({
      type: 'info',
      message: `${quarantineBacklog} records awaiting manual review in quarantine.`
    });
  }
  
  if (errorRate > 5) {
    recommendations.push({
      type: 'warning',
      message: `High error rate (${errorRate.toFixed(2)}%). Review error logs for common issues.`
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'All systems operating normally.'
    });
  }
  
  return recommendations;
}

export default router;
