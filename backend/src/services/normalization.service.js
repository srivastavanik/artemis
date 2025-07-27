import { logger } from '../utils/logger.js';

class NormalizationService {
  /**
   * Main normalization function
   */
  normalizeRecord(rawData) {
    try {
      // First convert keys from camelCase to snake_case
      let normalized = this.normalizeKeys(rawData);
      
      // Apply field-specific normalizations
      if (normalized.job_title) {
        normalized.job_title = this.normalizeJobTitle(normalized.job_title);
      }
      
      if (normalized.company_name) {
        normalized.company_name = this.normalizeCompanyName(normalized.company_name);
      }
      
      if (normalized.location) {
        normalized.location = this.normalizeLocation(normalized.location);
        // Extract timezone from location if not provided
        if (!normalized.timezone) {
          normalized.timezone = this.extractTimezone(normalized.location);
        }
      }
      
      if (normalized.phone) {
        normalized.phone = this.normalizePhoneNumber(normalized.phone);
      }
      
      if (normalized.email) {
        normalized.email = this.normalizeEmail(normalized.email);
      }
      
      if (normalized.linkedin_url) {
        normalized.linkedin_url = this.normalizeLinkedInUrl(normalized.linkedin_url);
      }
      
      // Ensure consistent date formatting
      normalized.discovered_at = normalized.discovered_at || new Date().toISOString();
      
      logger.debug('Record normalized', { 
        original: rawData,
        normalized 
      });
      
      return normalized;
    } catch (error) {
      logger.error('Normalization failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Convert camelCase keys to snake_case
   */
  normalizeKeys(obj) {
    const normalized = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = this.camelToSnake(key);
      
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        normalized[snakeKey] = this.normalizeKeys(value);
      } else {
        normalized[snakeKey] = value;
      }
    }
    
    return normalized;
  }
  
  /**
   * Convert camelCase to snake_case
   */
  camelToSnake(str) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  /**
   * Normalize job titles
   */
  normalizeJobTitle(title) {
    if (!title) return title;
    
    // Common variations mapping
    const titleMappings = {
      // VP variations
      'vp sales': 'VP of Sales',
      'vice president sales': 'VP of Sales',
      'vice president of sales': 'VP of Sales',
      'sales vp': 'VP of Sales',
      'svp sales': 'SVP of Sales',
      'senior vice president sales': 'SVP of Sales',
      
      // Director variations
      'sales director': 'Director of Sales',
      'director sales': 'Director of Sales',
      'dir. sales': 'Director of Sales',
      
      // C-Suite variations
      'chief executive officer': 'CEO',
      'chief technology officer': 'CTO',
      'chief marketing officer': 'CMO',
      'chief financial officer': 'CFO',
      'chief operating officer': 'COO',
      'chief revenue officer': 'CRO',
      
      // Head variations
      'head of sales': 'Head of Sales',
      'sales head': 'Head of Sales',
      'head of growth': 'Head of Growth',
      'growth head': 'Head of Growth',
      
      // Manager variations
      'sales mgr': 'Sales Manager',
      'sales mgr.': 'Sales Manager',
      'sr. sales manager': 'Senior Sales Manager',
      'sr sales manager': 'Senior Sales Manager'
    };
    
    // Normalize to lowercase for comparison
    const normalized = title.trim().toLowerCase();
    
    // Check if we have a direct mapping
    if (titleMappings[normalized]) {
      return titleMappings[normalized];
    }
    
    // Otherwise, apply standard formatting
    return title
      .trim()
      .split(' ')
      .map(word => {
        // Keep certain words lowercase
        const lowercaseWords = ['of', 'and', 'the', 'in', 'for'];
        if (lowercaseWords.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitalize first letter of each word
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }
  
  /**
   * Normalize company names
   */
  normalizeCompanyName(name) {
    if (!name) return name;
    
    // Remove common suffixes
    const suffixesToRemove = [
      ', Inc.',
      ' Inc.',
      ', LLC',
      ' LLC',
      ', Ltd.',
      ' Ltd.',
      ', Limited',
      ' Limited',
      ', Corp.',
      ' Corp.',
      ', Corporation',
      ' Corporation',
      ', Co.',
      ' Co.',
      ', P.C.',
      ' P.C.',
      ', PLC',
      ' PLC',
      ', LLP',
      ' LLP'
    ];
    
    let normalized = name.trim();
    
    // Remove suffixes
    for (const suffix of suffixesToRemove) {
      if (normalized.endsWith(suffix)) {
        normalized = normalized.slice(0, -suffix.length).trim();
        break;
      }
    }
    
    // Handle special cases
    const specialCases = {
      'microsoft': 'Microsoft',
      'google': 'Google',
      'apple': 'Apple',
      'amazon': 'Amazon',
      'facebook': 'Meta',
      'meta platforms': 'Meta',
      'salesforce.com': 'Salesforce',
      'oracle corporation': 'Oracle'
    };
    
    const lowerNormalized = normalized.toLowerCase();
    if (specialCases[lowerNormalized]) {
      return specialCases[lowerNormalized];
    }
    
    return normalized;
  }
  
  /**
   * Normalize location
   */
  normalizeLocation(location) {
    if (!location) return location;
    
    // Location format mappings
    const locationMappings = {
      // US Cities
      'sf': 'San Francisco, CA, USA',
      'san francisco': 'San Francisco, CA, USA',
      'san francisco, ca': 'San Francisco, CA, USA',
      'san francisco, california': 'San Francisco, CA, USA',
      'nyc': 'New York, NY, USA',
      'new york': 'New York, NY, USA',
      'new york city': 'New York, NY, USA',
      'la': 'Los Angeles, CA, USA',
      'los angeles': 'Los Angeles, CA, USA',
      'chicago': 'Chicago, IL, USA',
      'boston': 'Boston, MA, USA',
      'seattle': 'Seattle, WA, USA',
      'austin': 'Austin, TX, USA',
      'denver': 'Denver, CO, USA',
      
      // International Cities
      'london': 'London, UK',
      'london, uk': 'London, UK',
      'london, england': 'London, UK',
      'paris': 'Paris, France',
      'berlin': 'Berlin, Germany',
      'toronto': 'Toronto, ON, Canada',
      'vancouver': 'Vancouver, BC, Canada',
      'sydney': 'Sydney, NSW, Australia',
      'melbourne': 'Melbourne, VIC, Australia',
      'singapore': 'Singapore',
      'tokyo': 'Tokyo, Japan',
      'bangalore': 'Bangalore, India',
      'bengaluru': 'Bangalore, India'
    };
    
    const normalized = location.trim().toLowerCase();
    
    if (locationMappings[normalized]) {
      return locationMappings[normalized];
    }
    
    // If not in mappings, ensure proper capitalization
    return location
      .trim()
      .split(',')
      .map(part => part.trim())
      .map(part => {
        // Handle state abbreviations
        if (part.length === 2 && /^[A-Z]{2}$/i.test(part)) {
          return part.toUpperCase();
        }
        // Handle country codes
        if (['usa', 'uk', 'ca'].includes(part.toLowerCase())) {
          return part.toUpperCase();
        }
        // Otherwise capitalize words
        return part
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      })
      .join(', ');
  }
  
  /**
   * Extract timezone from location
   */
  extractTimezone(location) {
    if (!location) return null;
    
    const timezoneMap = {
      // US Timezones
      'san francisco': 'America/Los_Angeles',
      'los angeles': 'America/Los_Angeles',
      'seattle': 'America/Los_Angeles',
      'portland': 'America/Los_Angeles',
      'denver': 'America/Denver',
      'phoenix': 'America/Phoenix',
      'chicago': 'America/Chicago',
      'dallas': 'America/Chicago',
      'houston': 'America/Chicago',
      'austin': 'America/Chicago',
      'new york': 'America/New_York',
      'boston': 'America/New_York',
      'miami': 'America/New_York',
      'atlanta': 'America/New_York',
      
      // International
      'london': 'Europe/London',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'amsterdam': 'Europe/Amsterdam',
      'toronto': 'America/Toronto',
      'vancouver': 'America/Vancouver',
      'sydney': 'Australia/Sydney',
      'melbourne': 'Australia/Melbourne',
      'singapore': 'Asia/Singapore',
      'tokyo': 'Asia/Tokyo',
      'bangalore': 'Asia/Kolkata',
      'mumbai': 'Asia/Kolkata'
    };
    
    const locationLower = location.toLowerCase();
    
    for (const [city, timezone] of Object.entries(timezoneMap)) {
      if (locationLower.includes(city)) {
        return timezone;
      }
    }
    
    // Default to UTC if unknown
    return 'UTC';
  }
  
  /**
   * Normalize phone numbers
   */
  normalizePhoneNumber(phone) {
    if (!phone) return phone;
    
    // Remove all non-numeric characters
    let digits = phone.replace(/\D/g, '');
    
    // Handle US numbers
    if (digits.length === 10) {
      return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    }
    
    // Handle US numbers with country code
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    }
    
    // Handle international numbers with +
    if (phone.startsWith('+')) {
      return phone.trim();
    }
    
    // Return cleaned version if we can't format
    return digits;
  }
  
  /**
   * Normalize email addresses
   */
  normalizeEmail(email) {
    if (!email) return email;
    
    // Convert to lowercase and trim
    return email.toLowerCase().trim();
  }
  
  /**
   * Normalize LinkedIn URLs
   */
  normalizeLinkedInUrl(url) {
    if (!url) return url;
    
    // Extract the profile ID from various LinkedIn URL formats
    const patterns = [
      /linkedin\.com\/in\/([a-zA-Z0-9-]+)/,
      /linkedin\.com\/pub\/([a-zA-Z0-9-]+)/,
      /linkedin\.com\/profile\/view\?id=([a-zA-Z0-9-]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return `https://www.linkedin.com/in/${match[1]}`;
      }
    }
    
    // If already in correct format, ensure https
    if (url.includes('linkedin.com')) {
      return url.replace('http://', 'https://');
    }
    
    return url;
  }
}

export default new NormalizationService();
