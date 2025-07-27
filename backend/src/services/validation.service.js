import { z } from 'zod';
import { logger } from '../utils/logger.js';

class ValidationService {
  constructor() {
    // Define the prospect schema with all validation rules
    this.prospectSchema = z.object({
      email: z.string().email('Invalid email format'),
      first_name: z.string().min(1, 'First name is required'),
      last_name: z.string().min(1, 'Last name is required'),
      job_title: z.string().optional(),
      company_name: z.string().optional(),
      company_domain: z.string().optional(),
      linkedin_url: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      timezone: z.string().optional(),
      source: z.string().optional(),
      discovered_at: z.string().optional(),
      enrichment_data: z.any().optional()
    });
    
    // Common free email providers to check against
    this.freeEmailProviders = [
      'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com',
      'icloud.com', 'mail.com', 'protonmail.com', 'yandex.com', 'gmx.com',
      'live.com', 'msn.com', 'me.com', 'fastmail.com', 'tutanota.com',
      'zoho.com', 'mail.ru', 'qq.com', '163.com', '126.com'
    ];
  }
  
  /**
   * Main validation function
   */
  validateRecord(normalizedData) {
    const errors = [];
    const warnings = [];
    
    try {
      // Basic schema validation
      this.prospectSchema.parse(normalizedData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push(`${err.path.join('.')}: ${err.message}`);
        });
      }
    }
    
    // Additional business rule validations
    
    // Validate LinkedIn URL format
    if (normalizedData.linkedin_url) {
      const linkedinValidation = this.validateLinkedinUrl(normalizedData.linkedin_url);
      if (!linkedinValidation.isValid) {
        errors.push(`linkedin_url: ${linkedinValidation.error}`);
      }
    }
    
    // Validate business email
    if (normalizedData.email) {
      const emailValidation = this.validateBusinessEmail(normalizedData.email);
      if (!emailValidation.isValid) {
        warnings.push(`email: ${emailValidation.warning}`);
      }
    }
    
    // Validate phone number
    if (normalizedData.phone) {
      const phoneValidation = this.validatePhoneNumber(normalizedData.phone);
      if (!phoneValidation.isValid) {
        errors.push(`phone: ${phoneValidation.error}`);
      }
    }
    
    // Validate company domain
    if (normalizedData.company_domain) {
      const domainValidation = this.validateCompanyDomain(normalizedData.company_domain);
      if (!domainValidation.isValid) {
        errors.push(`company_domain: ${domainValidation.error}`);
      }
    }
    
    // Check data completeness
    const completenessScore = this.calculateCompletenessScore(normalizedData);
    if (completenessScore < 0.5) {
      warnings.push(`Low data completeness score: ${(completenessScore * 100).toFixed(0)}%`);
    }
    
    // Validate job title relevance
    if (normalizedData.job_title) {
      const titleRelevance = this.validateJobTitleRelevance(normalizedData.job_title);
      if (!titleRelevance.isRelevant) {
        warnings.push(`job_title: ${titleRelevance.warning}`);
      }
    }
    
    // Cross-field validation
    const crossFieldErrors = this.validateCrossFields(normalizedData);
    errors.push(...crossFieldErrors);
    
    const isValid = errors.length === 0;
    
    logger.debug('Validation completed', {
      isValid,
      errorCount: errors.length,
      warningCount: warnings.length,
      completenessScore
    });
    
    return {
      isValid,
      errors,
      warnings,
      completenessScore,
      metadata: {
        validatedAt: new Date().toISOString(),
        validationVersion: '1.0'
      }
    };
  }
  
  /**
   * Validate LinkedIn URL format
   */
  validateLinkedinUrl(url) {
    if (!url) {
      return { isValid: true };
    }
    
    // Valid LinkedIn URL patterns
    const validPatterns = [
      /^https?:\/\/(www\.)?linkedin\.com\/in\/[a-zA-Z0-9-]+\/?$/,
      /^https?:\/\/(www\.)?linkedin\.com\/pub\/[a-zA-Z0-9-]+\/?$/,
      /^https?:\/\/(www\.)?linkedin\.com\/profile\/view\?id=[a-zA-Z0-9-]+$/
    ];
    
    const isValid = validPatterns.some(pattern => pattern.test(url));
    
    return {
      isValid,
      error: isValid ? null : 'Invalid LinkedIn URL format'
    };
  }
  
  /**
   * Validate business email (not from free providers)
   */
  validateBusinessEmail(email) {
    if (!email) {
      return { isValid: true };
    }
    
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) {
      return {
        isValid: false,
        warning: 'Invalid email format'
      };
    }
    
    const isFreeProvider = this.freeEmailProviders.includes(domain);
    
    return {
      isValid: !isFreeProvider,
      warning: isFreeProvider ? 'Using free email provider - business email preferred' : null
    };
  }
  
  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone) {
    if (!phone) {
      return { isValid: true };
    }
    
    // Basic phone validation - should have at least 10 digits
    const digitsOnly = phone.replace(/\D/g, '');
    
    if (digitsOnly.length < 10) {
      return {
        isValid: false,
        error: 'Phone number must have at least 10 digits'
      };
    }
    
    if (digitsOnly.length > 15) {
      return {
        isValid: false,
        error: 'Phone number seems too long'
      };
    }
    
    return { isValid: true };
  }
  
  /**
   * Validate company domain format
   */
  validateCompanyDomain(domain) {
    if (!domain) {
      return { isValid: true };
    }
    
    // Basic domain validation
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
    const urlPattern = /^https?:\/\/([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}/;
    
    // Remove protocol if present
    let cleanDomain = domain;
    if (urlPattern.test(domain)) {
      cleanDomain = domain.replace(/^https?:\/\//, '');
    }
    
    const isValid = domainPattern.test(cleanDomain);
    
    return {
      isValid,
      error: isValid ? null : 'Invalid domain format'
    };
  }
  
  /**
   * Calculate data completeness score
   */
  calculateCompletenessScore(normalizedData) {
    const fields = {
      // Required fields (higher weight)
      email: 2,
      first_name: 2,
      last_name: 2,
      
      // Important fields (medium weight)
      job_title: 1.5,
      company_name: 1.5,
      linkedin_url: 1.5,
      
      // Nice-to-have fields (lower weight)
      phone: 1,
      location: 1,
      company_domain: 1,
      timezone: 0.5
    };
    
    let totalWeight = 0;
    let filledWeight = 0;
    
    for (const [field, weight] of Object.entries(fields)) {
      totalWeight += weight;
      if (normalizedData[field] && normalizedData[field].toString().trim() !== '') {
        filledWeight += weight;
      }
    }
    
    return filledWeight / totalWeight;
  }
  
  /**
   * Validate job title relevance for B2B sales
   */
  validateJobTitleRelevance(jobTitle) {
    if (!jobTitle) {
      return { isRelevant: true };
    }
    
    const titleLower = jobTitle.toLowerCase();
    
    // High-value titles
    const highValueKeywords = [
      'ceo', 'cto', 'cfo', 'cmo', 'coo', 'cro',
      'founder', 'co-founder', 'owner', 'president',
      'vp', 'vice president', 'director', 'head of',
      'manager', 'lead', 'senior', 'principal'
    ];
    
    // Low-value titles
    const lowValueKeywords = [
      'intern', 'assistant', 'junior', 'trainee',
      'student', 'contractor', 'freelance'
    ];
    
    const hasHighValue = highValueKeywords.some(keyword => titleLower.includes(keyword));
    const hasLowValue = lowValueKeywords.some(keyword => titleLower.includes(keyword));
    
    if (hasLowValue && !hasHighValue) {
      return {
        isRelevant: false,
        warning: 'Job title suggests junior role - may not be decision maker'
      };
    }
    
    return { isRelevant: true };
  }
  
  /**
   * Cross-field validation
   */
  validateCrossFields(normalizedData) {
    const errors = [];
    
    // If we have company_domain, email domain should match
    if (normalizedData.company_domain && normalizedData.email) {
      const emailDomain = normalizedData.email.split('@')[1];
      const companyDomain = normalizedData.company_domain
        .replace(/^https?:\/\//, '')
        .replace(/^www\./, '');
      
      if (emailDomain && !emailDomain.includes(companyDomain) && !companyDomain.includes(emailDomain)) {
        const isFreeEmail = this.freeEmailProviders.includes(emailDomain);
        if (!isFreeEmail) {
          errors.push(`Email domain (${emailDomain}) doesn't match company domain (${companyDomain})`);
        }
      }
    }
    
    // If we have LinkedIn URL, name should be present
    if (normalizedData.linkedin_url && (!normalizedData.first_name || !normalizedData.last_name)) {
      errors.push('LinkedIn URL provided but name is missing');
    }
    
    // If job_title exists, company_name should exist
    if (normalizedData.job_title && !normalizedData.company_name) {
      errors.push('Job title provided but company name is missing');
    }
    
    return errors;
  }
  
  /**
   * Validate a batch of records
   */
  validateBatch(records) {
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };
    
    for (const record of records) {
      const validation = this.validateRecord(record);
      
      if (validation.isValid) {
        results.valid.push({
          record,
          validation
        });
        
        if (validation.warnings.length > 0) {
          results.warnings.push({
            record,
            warnings: validation.warnings
          });
        }
      } else {
        results.invalid.push({
          record,
          validation
        });
      }
    }
    
    logger.info('Batch validation completed', {
      total: records.length,
      valid: results.valid.length,
      invalid: results.invalid.length,
      withWarnings: results.warnings.length
    });
    
    return results;
  }
}

export default new ValidationService();
