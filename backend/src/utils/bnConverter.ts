import { BN } from '@drift-labs/sdk';

/**
 * Utility class for converting BN objects to/from MongoDB-friendly format
 */
export class BNConverter {
  /**
   * Format used for BN objects in MongoDB
   */
  private static readonly BN_FORMAT = {
    TYPE: 'BN',
    TYPE_FIELD: 'type',
    VALUE_FIELD: 'value'
  };

  /**
   * Convert a value (potentially containing BN objects) to MongoDB-friendly format
   * 
   * @param value - Any value that might contain BN objects
   * @returns The value with all BN objects converted to MongoDB-friendly format
   */
  static toMongoFormat(value: any): any {
    // Use a WeakMap to track processed objects and avoid circular references
    const processed = new WeakMap();
    
    const process = (val: any): any => {
      if (val === null || val === undefined) {
        return val;
      }
      
      // Handle BN objects
      if (val instanceof BN) {
        return {
          [this.BN_FORMAT.TYPE_FIELD]: this.BN_FORMAT.TYPE,
          [this.BN_FORMAT.VALUE_FIELD]: val.toString(10) // Base 10 string representation
        };
      }
      
      // Handle arrays
      if (Array.isArray(val)) {
        return val.map(item => process(item));
      }
      
      // Handle objects (but not dates or other special types)
      if (typeof val === 'object' && !(val instanceof Date)) {
        // Check if we've already processed this object (circular reference)
        if (processed.has(val)) {
          return processed.get(val);
        }
        
        // Create a new object to hold the processed values
        const result: any = {};
        
        // Store the result in the WeakMap before processing properties
        // This handles circular references
        processed.set(val, result);
        
        // Process each property
        for (const [key, propVal] of Object.entries(val)) {
          try {
            result[key] = process(propVal);
          } catch (e) {
            // If processing a property fails, store it as a string
            result[key] = `[Error processing: ${e instanceof Error ? e.message : String(e)}]`;
          }
        }
        
        return result;
      }
      
      // Return primitives as is
      return val;
    };
    
    return process(value);
  }

  /**
   * Convert values from MongoDB format back to their original types (including BN)
   * 
   * @param value - Any value potentially containing MongoDB-formatted BN objects
   * @returns The value with all MongoDB-formatted BN objects converted to BN instances
   */
  static fromMongoFormat(value: any): any {
    // Use a WeakMap to track processed objects and avoid circular references
    const processed = new WeakMap();
    
    const process = (val: any): any => {
      if (val === null || val === undefined) {
        return val;
      }
      
      // Handle our BN object format
      if (
        val && 
        typeof val === 'object' && 
        val[this.BN_FORMAT.TYPE_FIELD] === this.BN_FORMAT.TYPE && 
        val[this.BN_FORMAT.VALUE_FIELD]
      ) {
        try {
          return new BN(val[this.BN_FORMAT.VALUE_FIELD]);
        } catch (e) {
          console.warn(`Failed to convert BN value: ${val[this.BN_FORMAT.VALUE_FIELD]}`, e);
          return new BN(0); // Return 0 if conversion fails
        }
      }
      
      // Handle arrays
      if (Array.isArray(val)) {
        return val.map(item => process(item));
      }
      
      // Handle objects (but not dates)
      if (val && typeof val === 'object' && !(val instanceof Date)) {
        // Check if we've already processed this object (circular reference)
        if (processed.has(val)) {
          return processed.get(val);
        }
        
        // Create a new object to hold the processed values
        const result: any = {};
        
        // Store the result in the WeakMap before processing properties
        // This handles circular references
        processed.set(val, result);
        
        // Process each property
        for (const [key, propVal] of Object.entries(val)) {
          try {
            result[key] = process(propVal);
          } catch (e) {
            // If processing a property fails, keep the original value
            result[key] = propVal;
          }
        }
        
        return result;
      }
      
      // Return primitives as is
      return val;
    };
    
    return process(value);
  }

  /**
   * Check if a value is in our MongoDB BN format
   * 
   * @param value - Any value to check
   * @returns True if the value is in MongoDB BN format
   */
  static isMongoFormatBN(value: any): boolean {
    return (
      value && 
      typeof value === 'object' && 
      value[this.BN_FORMAT.TYPE_FIELD] === this.BN_FORMAT.TYPE && 
      value[this.BN_FORMAT.VALUE_FIELD] !== undefined
    );
  }

  /**
   * Convert a BN to a readable string format for display
   * 
   * @param bn - BN object to convert
   * @param decimals - Number of decimals to display (default: 0)
   * @returns Formatted string representation 
   */
  static formatBNWithDecimals(bn: BN, decimals: number = 0): string {
    if (!bn) return '0';
    
    const bnStr = bn.toString(10);
    if (decimals === 0) return bnStr;
    
    // Handle negative numbers
    const isNegative = bn.isNeg();
    const absStr = isNegative ? bnStr.substring(1) : bnStr;
    
    // Pad with leading zeros if needed
    const paddedStr = absStr.padStart(decimals + 1, '0');
    
    // Calculate decimal position
    const intPart = paddedStr.slice(0, -decimals) || '0';
    const fracPart = paddedStr.slice(-decimals);
    
    // Format with decimal point
    const formatted = `${intPart}.${fracPart}`;
    
    // Add negative sign if needed
    return isNegative ? `-${formatted}` : formatted;
  }
}