/**
 * Date utility functions for consistent date handling across backend
 * Converts between ISO strings, timestamps, and MySQL datetime formats
 */

/**
 * Parse and validate date input
 * Handles: ISO strings, timestamps, Date objects
 * Returns: ISO string safe for database storage
 */
export const parseDate = (date: any): string | null => {
  if (!date) return null;
  
  try {
    let dateObj: Date;
    
    if (typeof date === 'string') {
      // ISO string or MySQL datetime format
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      // Timestamp
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      dateObj = date;
    } else {
      throw new Error('Invalid date type');
    }
    
    // Validate the date
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date value');
    }
    
    // Return ISO string
    return dateObj.toISOString();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse date: ${errorMsg}`);
  }
};

/**
 * Convert ISO string to MySQL DATETIME format (YYYY-MM-DD HH:MM:SS)
 */
export const toMySQLDateTime = (isoString: string): string | null => {
  if (!isoString) return null;
  
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid ISO string');
    }
    
    // Format: YYYY-MM-DD HH:MM:SS
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to convert to MySQL datetime: ${errorMsg}`);
  }
};

/**
 * Validate date is in the future or current
 */
export const isValidFutureDate = (isoString: string): boolean => {
  if (!isoString) return false;
  
  try {
    const date = new Date(isoString);
    const now = new Date();
    return date.getTime() >= now.getTime();
  } catch {
    return false;
  }
};

/**
 * Get date difference in days
 */
export const getDateDiffDays = (date1: string | Date, date2: string | Date): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Check if date is overdue (past)
 */
export const isOverdue = (targetDate: string | Date): boolean => {
  const date = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  return date.getTime() < new Date().getTime();
};

/**
 * Safe date normalization for API requests
 * Converts Date objects to ISO strings before sending to backend
 */
export const normalizeDates = (obj: any): any => {
  if (!obj) return obj;
  
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(normalizeDates);
  }
  
  if (typeof obj === 'object') {
    const normalized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[key] = normalizeDates(value);
    }
    return normalized;
  }
  
  return obj;
};
