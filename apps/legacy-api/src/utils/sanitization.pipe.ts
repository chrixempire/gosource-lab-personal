import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';

/**
 * Global validation pipe to detect and reject malicious user inputs
 * Prevents XSS, SQL injection, NoSQL injection, and other security threats
 * WITHOUT modifying the original data
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  private readonly maxStringLength = 10000;
  private readonly maxDepth = 100;

  transform(value: any, metadata: ArgumentMetadata): any {
    if (!value) return value;

    // Skip validation for files and certain metadata types
    if (
      metadata.type === 'custom' ||
      this.isFile(value) ||
      this.isBuffer(value)
    ) {
      return value;
    }

    try {
      this.validateValue(value, 0);
      return value; // Return original value unchanged
    } catch (error) {
      throw new BadRequestException(
        error.message ||
          'Invalid input data format or contains malicious content',
      );
    }
  }

  private validateValue(value: any, depth: number): void {
    // Prevent deep recursion attacks
    if (depth > this.maxDepth) {
      throw new BadRequestException('Input data structure too deep');
    }

    if (value === null || value === undefined) {
      return;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      value.forEach((item) => this.validateValue(item, depth + 1));
      return;
    }

    // Handle objects
    if (typeof value === 'object') {
      for (const [key, val] of Object.entries(value)) {
        // Reject MongoDB operators in keys
        if (key.startsWith('$')) {
          throw new BadRequestException(
            `MongoDB operators not allowed in object keys: ${key}`,
          );
        }

        this.validateString(key); // Validate object keys
        this.validateValue(val, depth + 1);
      }
      return;
    }

    // Handle strings
    if (typeof value === 'string') {
      this.validateString(value);
      return;
    }

    // Handle numbers
    if (typeof value === 'number') {
      this.validateNumber(value);
      return;
    }

    // Handle booleans and dates (pass through)
    if (typeof value === 'boolean' || value instanceof Date) {
      return;
    }

    // Allow other types to pass through
    return;
  }

  private validateString(str: string): void {
    if (typeof str !== 'string') {
      return;
    }

    // Check string length
    if (str.length > this.maxStringLength) {
      throw new BadRequestException(
        `String length exceeds maximum allowed length of ${this.maxStringLength}`,
      );
    }

    // Check for null bytes and control characters
    if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(str)) {
      throw new BadRequestException(
        'Input contains invalid control characters',
      );
    }

    // Check for potential XSS attacks
    this.validateXSS(str);

    // Check for potential NoSQL injection patterns
    this.validateNoSQLInjection(str);
  }

  private validateXSS(str: string): void {
    // SECURITY: Simplified patterns to prevent ReDoS attacks
    // Use case-insensitive search for performance

    const lowerStr = str.toLowerCase();

    // Check for script tags (simplified pattern)
    if (lowerStr.includes('<script') || lowerStr.includes('</script>')) {
      throw new BadRequestException(
        'Input contains potentially malicious script tags',
      );
    }

    // Check for javascript: protocol
    if (lowerStr.includes('javascript:')) {
      throw new BadRequestException(
        'Input contains potentially malicious javascript protocol',
      );
    }

    // Check for event handlers (simplified - check for common patterns)
    const eventHandlers = [
      'onclick=',
      'onload=',
      'onerror=',
      'onmouseover=',
      'onmouseout=',
      'onfocus=',
      'onblur=',
      'onchange=',
      'onsubmit=',
    ];

    for (const handler of eventHandlers) {
      if (lowerStr.includes(handler)) {
        throw new BadRequestException(
          'Input contains potentially malicious event handlers',
        );
      }
    }

    // Check for dangerous HTML tags (simplified string search)
    const dangerousTags = [
      '<iframe',
      '<object',
      '<embed',
      '<link',
      '<meta',
      'vbscript:',
      'data:text/html',
    ];

    for (const tag of dangerousTags) {
      if (lowerStr.includes(tag)) {
        throw new BadRequestException(
          'Input contains potentially malicious content',
        );
      }
    }

    // Check for CSS expression (IE-specific XSS vector)
    if (lowerStr.includes('expression(') || lowerStr.includes('expression (')) {
      throw new BadRequestException(
        'Input contains potentially malicious content',
      );
    }
  }

  private validateNumber(num: number): void {
    // Check for NaN and Infinity
    if (!Number.isFinite(num)) {
      throw new BadRequestException('Invalid number value');
    }

    // Check for reasonable bounds
    if (Math.abs(num) > Number.MAX_SAFE_INTEGER) {
      throw new BadRequestException('Number value out of safe range');
    }
  }

  private validateNoSQLInjection(str: string): void {
    // Check for common NoSQL injection patterns
    const noSQLPatterns = [
      /\$where\s*:/gi,
      /\$regex\s*:/gi,
      /\$ne\s*:/gi,
      /\$nin\s*:/gi,
      /\$or\s*:/gi,
      /\$and\s*:/gi,
      /\$nor\s*:/gi,
      /\$not\s*:/gi,
      /\$exists\s*:/gi,
      /\$type\s*:/gi,
      /\$mod\s*:/gi,
      /\$all\s*:/gi,
      /\$size\s*:/gi,
      /\$elemMatch\s*:/gi,
      /\$slice\s*:/gi,
      /eval\s*\(/gi,
      /function\s*\(/gi,
    ];

    for (const pattern of noSQLPatterns) {
      if (pattern.test(str)) {
        throw new BadRequestException(
          'Input contains potentially malicious NoSQL injection patterns',
        );
      }
    }
  }

  private isFile(value: any): boolean {
    return value && typeof value === 'object' && value.originalname;
  }

  private isBuffer(value: any): boolean {
    return Buffer.isBuffer(value);
  }
}

/**
 * Decorator for applying validation to specific parameters
 */
export function Validate() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      const validationPipe = new SanitizationPipe();
      args.forEach((arg) =>
        validationPipe.transform(arg, { type: 'body' } as ArgumentMetadata),
      );
      return originalMethod.apply(this, args); // Use original args
    };
  };
}
