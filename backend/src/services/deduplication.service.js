import supabaseService from './supabase.service.js';
import { logger } from '../utils/logger.js';

class DeduplicationService {
  /**
   * Find and merge prospect
   */
  async findAndMergeProspect(normalizedProspect) {
    try {
      // Find existing prospect by email (primary identifier)
      const existing = await this.findExistingProspect(normalizedProspect);
      
      if (!existing) {
        // No duplicate found - new prospect
        logger.debug('No duplicate found, creating new prospect', {
          email: normalizedProspect.email
        });
        
        return {
          prospect: normalizedProspect,
          action: 'insert',
          metadata: {
            mergePerformed: false,
            duplicateFound: false
          }
        };
      }
      
      // Duplicate found - merge the records
      logger.info('Duplicate prospect found, merging', {
        existingId: existing.id,
        email: normalizedProspect.email
      });
      
      const merged = await this.mergeProspectData(existing, normalizedProspect);
      
      return {
        prospect: merged,
        action: 'update',
        metadata: {
          mergePerformed: true,
          duplicateFound: true,
          existingId: existing.id,
          fieldsUpdated: this.getUpdatedFields(existing, merged)
        }
      };
    } catch (error) {
      logger.error('Deduplication failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Find existing prospect
   */
  async findExistingProspect(normalizedProspect) {
    try {
      // Primary check: by email
      if (normalizedProspect.email) {
        const byEmail = await supabaseService.searchProspects({
          email: normalizedProspect.email
        });
        
        if (byEmail.data && byEmail.data.length > 0) {
          return byEmail.data[0];
        }
      }
      
      // Secondary check: by LinkedIn URL
      if (normalizedProspect.linkedin_url) {
        const byLinkedIn = await this.findByLinkedInUrl(normalizedProspect.linkedin_url);
        if (byLinkedIn) {
          return byLinkedIn;
        }
      }
      
      // Tertiary check: by name + company (fuzzy match)
      if (normalizedProspect.first_name && 
          normalizedProspect.last_name && 
          normalizedProspect.company_name) {
        const byNameCompany = await this.findByNameAndCompany(
          normalizedProspect.first_name,
          normalizedProspect.last_name,
          normalizedProspect.company_name
        );
        if (byNameCompany) {
          return byNameCompany;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding existing prospect', { error: error.message });
      return null;
    }
  }
  
  /**
   * Find by LinkedIn URL
   */
  async findByLinkedInUrl(linkedinUrl) {
    try {
      if (!supabaseService.client) {
        return null;
      }
      
      const { data, error } = await supabaseService.client
        .from('prospects')
        .select('*')
        .eq('linkedin_url', linkedinUrl)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      return data;
    } catch (error) {
      logger.error('Error finding by LinkedIn URL', { error: error.message });
      return null;
    }
  }
  
  /**
   * Find by name and company
   */
  async findByNameAndCompany(firstName, lastName, companyName) {
    try {
      if (!supabaseService.client) {
        return null;
      }
      
      // Normalize for comparison
      const normalizedFirst = firstName.toLowerCase().trim();
      const normalizedLast = lastName.toLowerCase().trim();
      const normalizedCompany = companyName.toLowerCase().trim();
      
      const { data, error } = await supabaseService.client
        .from('prospects')
        .select('*')
        .ilike('first_name', `%${normalizedFirst}%`)
        .ilike('last_name', `%${normalizedLast}%`)
        .ilike('company_name', `%${normalizedCompany}%`);
      
      if (error) throw error;
      
      // If we get multiple matches, try to find the best match
      if (data && data.length > 0) {
        // Exact match preferred
        const exactMatch = data.find(p => 
          p.first_name.toLowerCase() === normalizedFirst &&
          p.last_name.toLowerCase() === normalizedLast &&
          p.company_name.toLowerCase() === normalizedCompany
        );
        
        if (exactMatch) return exactMatch;
        
        // Otherwise return the first match
        return data[0];
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding by name and company', { error: error.message });
      return null;
    }
  }
  
  /**
   * Merge prospect data
   */
  async mergeProspectData(existing, newData) {
    const merged = { ...existing };
    
    // Merge rules:
    // 1. Keep existing id and created_at
    // 2. Update empty/null fields with new data
    // 3. Always update certain fields with new data
    // 4. Combine enrichment data
    
    // Fields to always update with new data (if provided)
    const alwaysUpdateFields = [
      'job_title',        // Job titles can change
      'phone',            // Phone numbers can change
      'location',         // People move
      'timezone',         // Based on location
      'last_enriched_at', // Track latest enrichment
      'updated_at'        // Always update timestamp
    ];
    
    // Fields to only update if currently empty
    const updateIfEmptyFields = [
      'first_name',
      'last_name',
      'email',
      'company_name',
      'company_domain',
      'linkedin_url'
    ];
    
    // Update fields based on rules
    for (const field of alwaysUpdateFields) {
      if (newData[field] !== undefined) {
        merged[field] = newData[field];
      }
    }
    
    for (const field of updateIfEmptyFields) {
      if (!merged[field] && newData[field]) {
        merged[field] = newData[field];
      }
    }
    
    // Handle special cases
    
    // Source tracking - append if different
    if (newData.source && merged.source !== newData.source) {
      merged.source = `${merged.source},${newData.source}`;
    }
    
    // Company domain - prefer the one with protocol removed
    if (newData.company_domain && !merged.company_domain) {
      merged.company_domain = newData.company_domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');
    }
    
    // Enrichment data merging
    if (newData.enrichment_data) {
      merged.enrichment_data = this.mergeEnrichmentData(
        merged.enrichment_data,
        newData.enrichment_data
      );
    }
    
    // Update timestamp
    merged.updated_at = new Date().toISOString();
    
    // Log merge details
    logger.debug('Prospect data merged', {
      existingId: existing.id,
      fieldsUpdated: this.getUpdatedFields(existing, merged)
    });
    
    return merged;
  }
  
  /**
   * Merge enrichment data
   */
  mergeEnrichmentData(existingData, newData) {
    if (!existingData) return newData;
    if (!newData) return existingData;
    
    // If both are objects, deep merge
    if (typeof existingData === 'object' && typeof newData === 'object') {
      const merged = { ...existingData };
      
      for (const [key, value] of Object.entries(newData)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            merged[key] = this.mergeEnrichmentData(merged[key], value);
          } else {
            merged[key] = value;
          }
        }
      }
      
      return merged;
    }
    
    // Otherwise, new data takes precedence
    return newData;
  }
  
  /**
   * Get list of fields that were updated
   */
  getUpdatedFields(original, merged) {
    const updated = [];
    
    for (const [key, value] of Object.entries(merged)) {
      if (original[key] !== value) {
        updated.push({
          field: key,
          oldValue: original[key],
          newValue: value
        });
      }
    }
    
    return updated;
  }
  
  /**
   * Batch deduplication
   */
  async batchDeduplicate(prospects) {
    const results = {
      toInsert: [],
      toUpdate: [],
      duplicates: []
    };
    
    // First, check for duplicates within the batch itself
    const batchDeduplicated = this.deduplicateWithinBatch(prospects);
    
    // Then check against database
    for (const prospect of batchDeduplicated) {
      try {
        const result = await this.findAndMergeProspect(prospect);
        
        if (result.action === 'insert') {
          results.toInsert.push(result.prospect);
        } else if (result.action === 'update') {
          results.toUpdate.push({
            id: result.metadata.existingId,
            data: result.prospect
          });
          results.duplicates.push({
            original: prospect,
            merged: result.prospect,
            metadata: result.metadata
          });
        }
      } catch (error) {
        logger.error('Failed to process prospect in batch', {
          prospect,
          error: error.message
        });
      }
    }
    
    logger.info('Batch deduplication completed', {
      total: prospects.length,
      toInsert: results.toInsert.length,
      toUpdate: results.toUpdate.length,
      duplicatesFound: results.duplicates.length
    });
    
    return results;
  }
  
  /**
   * Deduplicate within batch
   */
  deduplicateWithinBatch(prospects) {
    const seen = new Map();
    const deduplicated = [];
    
    for (const prospect of prospects) {
      // Use email as primary key
      const key = prospect.email || prospect.linkedin_url || 
                  `${prospect.first_name}-${prospect.last_name}-${prospect.company_name}`;
      
      if (!seen.has(key)) {
        seen.set(key, prospect);
        deduplicated.push(prospect);
      } else {
        // Merge with existing in batch
        const existing = seen.get(key);
        const merged = this.mergeProspectData(existing, prospect);
        seen.set(key, merged);
        
        // Update in deduplicated array
        const index = deduplicated.findIndex(p => 
          (p.email === existing.email) || 
          (p.linkedin_url === existing.linkedin_url)
        );
        if (index !== -1) {
          deduplicated[index] = merged;
        }
      }
    }
    
    return deduplicated;
  }
  
  /**
   * Check if two prospects are likely the same person
   */
  isSamePerson(prospect1, prospect2) {
    // Email match
    if (prospect1.email && prospect2.email) {
      return prospect1.email.toLowerCase() === prospect2.email.toLowerCase();
    }
    
    // LinkedIn match
    if (prospect1.linkedin_url && prospect2.linkedin_url) {
      return prospect1.linkedin_url === prospect2.linkedin_url;
    }
    
    // Name + Company match
    if (prospect1.first_name && prospect1.last_name && 
        prospect2.first_name && prospect2.last_name &&
        prospect1.company_name && prospect2.company_name) {
      
      const name1 = `${prospect1.first_name} ${prospect1.last_name}`.toLowerCase();
      const name2 = `${prospect2.first_name} ${prospect2.last_name}`.toLowerCase();
      const company1 = prospect1.company_name.toLowerCase();
      const company2 = prospect2.company_name.toLowerCase();
      
      // Fuzzy match for names (could use string similarity library)
      const nameMatch = name1 === name2 || this.fuzzyMatch(name1, name2, 0.8);
      const companyMatch = company1 === company2 || this.fuzzyMatch(company1, company2, 0.8);
      
      return nameMatch && companyMatch;
    }
    
    return false;
  }
  
  /**
   * Simple fuzzy match implementation
   */
  fuzzyMatch(str1, str2, threshold = 0.8) {
    // Simple implementation - in production, use a proper string similarity library
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.getEditDistance(longer, shorter);
    const similarity = (longer.length - editDistance) / longer.length;
    
    return similarity >= threshold;
  }
  
  /**
   * Calculate edit distance between two strings
   */
  getEditDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export default new DeduplicationService();
