import supabaseService from './supabase.service.js';
import normalizationService from './normalization.service.js';
import validationService from './validation.service.js';
import deduplicationService from './deduplication.service.js';
import { logger } from '../utils/logger.js';

class PipelineWorker {
  constructor() {
    this.batchSize = 50;
    this.processing = false;
  }
  
  /**
   * Process staging table - main ETL function
   */
  async processStagingTable(batchSize = this.batchSize) {
    // Prevent concurrent processing
    if (this.processing) {
      logger.warn('Pipeline worker is already processing');
      return;
    }
    
    this.processing = true;
    const startTime = Date.now();
    
    try {
      logger.info('Pipeline worker starting', { batchSize });
      
      // Fetch pending records with row locking
      const pendingRecords = await this.fetchAndLockPendingRecords(batchSize);
      
      if (pendingRecords.length === 0) {
        logger.debug('No pending records to process');
        return {
          processed: 0,
          successful: 0,
          quarantined: 0,
          failed: 0
        };
      }
      
      logger.info('Processing batch', { 
        count: pendingRecords.length,
        firstId: pendingRecords[0].id,
        lastId: pendingRecords[pendingRecords.length - 1].id
      });
      
      const results = {
        processed: 0,
        successful: 0,
        quarantined: 0,
        failed: 0,
        details: []
      };
      
      // Process each record
      for (const stagingRecord of pendingRecords) {
        const recordResult = await this.processSingleRecord(stagingRecord);
        
        results.processed++;
        if (recordResult.status === 'success') {
          results.successful++;
        } else if (recordResult.status === 'quarantined') {
          results.quarantined++;
        } else {
          results.failed++;
        }
        
        results.details.push(recordResult);
      }
      
      const duration = Date.now() - startTime;
      
      logger.info('Pipeline batch completed', {
        ...results,
        duration,
        recordsPerSecond: (results.processed / (duration / 1000)).toFixed(2)
      });
      
      return results;
    } catch (error) {
      logger.error('Pipeline worker error', { error: error.message });
      throw error;
    } finally {
      this.processing = false;
    }
  }
  
  /**
   * Fetch and lock pending records
   */
  async fetchAndLockPendingRecords(batchSize) {
    try {
      // In a production system, we'd use SELECT FOR UPDATE to lock rows
      // For now, we'll just fetch pending records
      const records = await supabaseService.getPendingStagingRecords(batchSize);
      
      // Mark them as being processed to prevent race conditions
      const recordIds = records.map(r => r.id);
      if (recordIds.length > 0) {
        await this.updateStagingStatuses(recordIds, 'processing');
      }
      
      return records;
    } catch (error) {
      logger.error('Failed to fetch pending records', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Process a single staging record
   */
  async processSingleRecord(stagingRecord) {
    const recordLog = [];
    const recordId = stagingRecord.id;
    
    try {
      recordLog.push(`Starting processing for staging ID: ${recordId}`);
      
      // Step 1: Transform & Normalize
      logger.debug('Normalizing record', { stagingId: recordId });
      const normalized = normalizationService.normalizeRecord(stagingRecord.raw_data);
      recordLog.push('✓ Normalization completed');
      
      // Step 2: Validate
      logger.debug('Validating record', { stagingId: recordId });
      const validation = validationService.validateRecord(normalized);
      recordLog.push(`✓ Validation completed - Score: ${(validation.completenessScore * 100).toFixed(0)}%`);
      
      // Step 3: Handle invalid data
      if (!validation.isValid) {
        logger.warn('Record failed validation', {
          stagingId: recordId,
          errors: validation.errors
        });
        
        await this.quarantineRecord(
          stagingRecord,
          validation.errors,
          validation
        );
        
        recordLog.push('✗ Quarantined due to validation errors');
        
        return {
          stagingId: recordId,
          status: 'quarantined',
          log: recordLog,
          validation
        };
      }
      
      // Step 4: Deduplicate & Merge
      logger.debug('Deduplicating record', { stagingId: recordId });
      const deduplicationResult = await deduplicationService.findAndMergeProspect(normalized);
      recordLog.push(`✓ Deduplication completed - Action: ${deduplicationResult.action}`);
      
      // Step 5: Load (Insert or Update)
      let prospectId;
      if (deduplicationResult.action === 'insert') {
        // Create new prospect
        const newProspect = await supabaseService.createProspect(
          this.transformToApiFormat(deduplicationResult.prospect)
        );
        prospectId = newProspect.id;
        recordLog.push(`✓ New prospect created - ID: ${prospectId}`);
      } else {
        // Update existing prospect
        prospectId = deduplicationResult.metadata.existingId;
        await this.updateProspect(prospectId, deduplicationResult.prospect);
        recordLog.push(`✓ Existing prospect updated - ID: ${prospectId}`);
      }
      
      // Step 6: Store enrichment data if present
      if (normalized.enrichment_data) {
        await supabaseService.storeEnrichmentData(
          prospectId,
          stagingRecord.source,
          normalized.enrichment_data
        );
        recordLog.push('✓ Enrichment data stored');
      }
      
      // Step 7: Mark staging record as processed
      await supabaseService.updateStagingStatus(
        recordId,
        'processed',
        recordLog
      );
      
      return {
        stagingId: recordId,
        prospectId,
        status: 'success',
        action: deduplicationResult.action,
        log: recordLog,
        validation,
        deduplication: deduplicationResult.metadata
      };
      
    } catch (error) {
      logger.error('Failed to process staging record', {
        stagingId: recordId,
        error: error.message
      });
      
      recordLog.push(`✗ Error: ${error.message}`);
      
      // Mark as error
      await supabaseService.updateStagingStatus(
        recordId,
        'error',
        recordLog
      );
      
      return {
        stagingId: recordId,
        status: 'error',
        error: error.message,
        log: recordLog
      };
    }
  }
  
  /**
   * Quarantine a record
   */
  async quarantineRecord(stagingRecord, errors, validation) {
    try {
      await supabaseService.createQuarantineRecord(
        stagingRecord.raw_data,
        errors,
        stagingRecord.source,
        {
          validation,
          stagingId: stagingRecord.id,
          quarantinedAt: new Date().toISOString()
        }
      );
      
      await supabaseService.updateStagingStatus(
        stagingRecord.id,
        'quarantined',
        [`Quarantined due to validation errors: ${errors.join(', ')}`]
      );
      
      logger.info('Record quarantined', {
        stagingId: stagingRecord.id,
        errorCount: errors.length
      });
    } catch (error) {
      logger.error('Failed to quarantine record', {
        stagingId: stagingRecord.id,
        error: error.message
      });
    }
  }
  
  /**
   * Update existing prospect
   */
  async updateProspect(prospectId, prospectData) {
    try {
      if (!supabaseService.client) {
        return;
      }
      
      // Remove fields that shouldn't be updated
      const { id, created_at, ...updateData } = prospectData;
      
      const { error } = await supabaseService.client
        .from('prospects')
        .update(updateData)
        .eq('id', prospectId);
      
      if (error) throw error;
      
      logger.debug('Prospect updated', { prospectId });
    } catch (error) {
      logger.error('Failed to update prospect', {
        prospectId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Transform from snake_case to camelCase for API
   */
  transformToApiFormat(prospect) {
    return {
      email: prospect.email,
      firstName: prospect.first_name,
      lastName: prospect.last_name,
      jobTitle: prospect.job_title,
      companyName: prospect.company_name,
      companyDomain: prospect.company_domain,
      linkedinUrl: prospect.linkedin_url,
      phone: prospect.phone,
      location: prospect.location,
      timezone: prospect.timezone,
      source: prospect.source
    };
  }
  
  /**
   * Update multiple staging records' status
   */
  async updateStagingStatuses(recordIds, status) {
    try {
      if (!supabaseService.client || recordIds.length === 0) {
        return;
      }
      
      const { error } = await supabaseService.client
        .from('prospects_staging')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', recordIds);
      
      if (error) throw error;
    } catch (error) {
      logger.error('Failed to update staging statuses', {
        recordIds,
        status,
        error: error.message
      });
    }
  }
  
  /**
   * Process quarantined records (for manual review)
   */
  async processQuarantinedRecords(limit = 10) {
    try {
      if (!supabaseService.client) {
        return [];
      }
      
      // Get quarantined records marked as 'approved' by reviewer
      const { data: approvedRecords, error } = await supabaseService.client
        .from('prospects_quarantine')
        .select('*')
        .eq('review_status', 'approved')
        .limit(limit);
      
      if (error) throw error;
      
      const results = [];
      
      for (const record of approvedRecords || []) {
        try {
          // Re-insert into staging for processing
          const stagingRecord = await supabaseService.createStagingRecord(
            record.staged_data,
            `${record.source}_reprocessed`
          );
          
          // Mark quarantine record as fixed
          await supabaseService.client
            .from('prospects_quarantine')
            .update({ review_status: 'fixed' })
            .eq('id', record.id);
          
          results.push({
            quarantineId: record.id,
            newStagingId: stagingRecord.id,
            status: 'reprocessed'
          });
        } catch (error) {
          logger.error('Failed to reprocess quarantined record', {
            quarantineId: record.id,
            error: error.message
          });
        }
      }
      
      return results;
    } catch (error) {
      logger.error('Failed to process quarantined records', {
        error: error.message
      });
      return [];
    }
  }
  
  /**
   * Get pipeline statistics
   */
  async getPipelineStats() {
    try {
      if (!supabaseService.client) {
        return null;
      }
      
      const { data: stagingStats, error: stagingError } = await supabaseService.client
        .from('prospects_staging')
        .select('status')
        .select();
      
      if (stagingError) throw stagingError;
      
      const { data: quarantineStats, error: quarantineError } = await supabaseService.client
        .from('prospects_quarantine')
        .select('review_status')
        .select();
      
      if (quarantineError) throw quarantineError;
      
      // Calculate stats
      const stats = {
        staging: {
          total: stagingStats?.length || 0,
          pending: stagingStats?.filter(s => s.status === 'pending').length || 0,
          processing: stagingStats?.filter(s => s.status === 'processing').length || 0,
          processed: stagingStats?.filter(s => s.status === 'processed').length || 0,
          quarantined: stagingStats?.filter(s => s.status === 'quarantined').length || 0,
          error: stagingStats?.filter(s => s.status === 'error').length || 0
        },
        quarantine: {
          total: quarantineStats?.length || 0,
          pending: quarantineStats?.filter(q => q.review_status === 'pending').length || 0,
          approved: quarantineStats?.filter(q => q.review_status === 'approved').length || 0,
          rejected: quarantineStats?.filter(q => q.review_status === 'rejected').length || 0,
          fixed: quarantineStats?.filter(q => q.review_status === 'fixed').length || 0
        }
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get pipeline stats', { error: error.message });
      return null;
    }
  }
}

export default new PipelineWorker();
