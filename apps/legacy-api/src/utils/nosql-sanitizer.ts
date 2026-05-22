import { BadRequestException } from '@nestjs/common';

/**
 * NoSQL Injection Protection Utilities
 *
 * Provides runtime protection against MongoDB operator injection attacks
 * even when express-mongo-sanitize middleware is bypassed or not sufficient.
 */

/**
 * List of dangerous MongoDB operators that should never come from user input
 */
const DANGEROUS_OPERATORS = [
  '$where',
  '$regex',
  '$ne',
  '$nin',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$in',
  '$or',
  '$and',
  '$not',
  '$nor',
  '$exists',
  '$type',
  '$expr',
  '$jsonSchema',
  '$mod',
  '$text',
  '$function',
  '$accumulator',
  '$all',
  '$elemMatch',
  '$size',
];

/**
 * Checks if a value contains MongoDB operators
 * @param value - Value to check
 * @returns true if MongoDB operators are found
 */
export function containsMongoOperators(value: any): boolean {
  if (typeof value === 'string') {
    return DANGEROUS_OPERATORS.some((op) => value.includes(op));
  }

  if (typeof value === 'object' && value !== null) {
    // Check all keys in the object
    const keys = Object.keys(value);
    return keys.some((key) => {
      // Check if key itself is an operator
      if (key.startsWith('$')) {
        return true;
      }
      // Recursively check nested values
      return containsMongoOperators(value[key]);
    });
  }

  return false;
}

/**
 * Sanitizes a single value by rejecting objects with MongoDB operators
 * @param value - Value to sanitize
 * @param fieldName - Name of the field (for error messages)
 * @param allowNestedObjects - Whether to allow nested objects (true for body, false for query)
 * @throws BadRequestException if MongoDB operators are detected
 * @returns The sanitized value
 */
export function sanitizeQueryValue(
  value: any,
  fieldName: string = 'field',
  allowNestedObjects: boolean = false,
): any {
  // Allow null and undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Allow primitives (string, number, boolean)
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    // Check for operator strings
    if (typeof value === 'string' && containsMongoOperators(value)) {
      throw new BadRequestException(
        `Invalid value for ${fieldName}: contains MongoDB operators`,
      );
    }
    return value;
  }

  // Handle Date objects
  if (value instanceof Date) {
    return value;
  }

  // Reject objects (potential operator injection)
  if (typeof value === 'object') {
    // Check if it's an array
    if (Array.isArray(value)) {
      return value.map((item, index) =>
        sanitizeQueryValue(item, `${fieldName}[${index}]`, allowNestedObjects),
      );
    }

    // Check for MongoDB operators first
    if (containsMongoOperators(value)) {
      throw new BadRequestException(
        `Invalid value for ${fieldName}: MongoDB operators are not allowed`,
      );
    }

    // If nested objects are allowed (for request body), recursively sanitize
    if (allowNestedObjects) {
      const sanitized: Record<string, any> = {};
      for (const [key, val] of Object.entries(value)) {
        // Still check for $ prefix in keys
        if (key.startsWith('$')) {
          throw new BadRequestException(
            `Invalid field name: "${key}" at ${fieldName} - MongoDB operators are not allowed`,
          );
        }
        sanitized[key] = sanitizeQueryValue(
          val,
          `${fieldName}.${key}`,
          allowNestedObjects,
        );
      }
      return sanitized;
    }

    // For query params, reject all objects
    throw new BadRequestException(
      `Invalid value for ${fieldName}: objects are not allowed in queries`,
    );
  }

  return value;
}

/**
 * Sanitizes an entire object by checking all fields
 * @param obj - Object to sanitize
 * @param allowedFields - Optional whitelist of allowed field names
 * @param allowNestedObjects - Whether to allow nested objects (true for body, false for query)
 * @throws BadRequestException if MongoDB operators or disallowed fields are detected
 * @returns Sanitized object
 */
export function sanitizeObject(
  obj: Record<string, any>,
  allowedFields?: string[],
  allowNestedObjects: boolean = false,
): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if field name starts with $ (MongoDB operator)
    if (key.startsWith('$')) {
      throw new BadRequestException(
        `Invalid field name: "${key}" - MongoDB operators are not allowed`,
      );
    }

    // Check if field is in whitelist (if provided)
    if (allowedFields && !allowedFields.includes(key)) {
      throw new BadRequestException(
        `Field "${key}" is not allowed in this query`,
      );
    }

    // Sanitize the value
    sanitized[key] = sanitizeQueryValue(value, key, allowNestedObjects);
  }

  return sanitized;
}

/**
 * Sanitizes request body - allows nested objects but checks for MongoDB operators
 * @param body - Request body to sanitize
 * @returns Sanitized body
 */
export function sanitizeBody(body: Record<string, any>): Record<string, any> {
  return sanitizeObject(body, undefined, true); // Allow nested objects
}

/**
 * Sanitizes query parameters - does not allow nested objects
 * @param query - Query parameters to sanitize
 * @returns Sanitized query
 */
export function sanitizeQuery(query: Record<string, any>): Record<string, any> {
  return sanitizeObject(query, undefined, false); // Reject nested objects
}

/**
 * Ensures a value is a primitive type (string, number, boolean)
 * Throws if the value is an object or contains MongoDB operators
 *
 * @param value - Value to validate
 * @param expectedType - Expected type ('string', 'number', 'boolean', or 'any')
 * @param fieldName - Name of the field for error messages
 * @throws BadRequestException if validation fails
 * @returns The validated primitive value
 */
export function ensurePrimitive(
  value: any,
  expectedType: 'string' | 'number' | 'boolean' | 'any' = 'any',
  fieldName: string = 'field',
): string | number | boolean {
  // Check if it's an object (potential injection)
  if (typeof value === 'object' && value !== null) {
    throw new BadRequestException(
      `Invalid ${fieldName}: expected ${expectedType}, got object`,
    );
  }

  // Check expected type
  if (expectedType !== 'any' && typeof value !== expectedType) {
    throw new BadRequestException(
      `Invalid ${fieldName}: expected ${expectedType}, got ${typeof value}`,
    );
  }

  // Additional check for strings containing operators
  if (typeof value === 'string' && containsMongoOperators(value)) {
    throw new BadRequestException(
      `Invalid ${fieldName}: contains MongoDB operators`,
    );
  }

  return value;
}

/**
 * Decorator to automatically sanitize method parameters
 * Use this on service methods that accept user input for queries
 *
 * @example
 * ```typescript
 * @SanitizeParams()
 * async findUser(email: string, status: string) {
 *   return this.userModel.findOne({ email, status });
 * }
 * ```
 */
export function SanitizeParams() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Sanitize all arguments
      const sanitizedArgs = args.map((arg, index) => {
        try {
          if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
            return sanitizeObject(arg);
          }
          return sanitizeQueryValue(arg, `parameter ${index}`);
        } catch (error) {
          throw error;
        }
      });

      return originalMethod.apply(this, sanitizedArgs);
    };

    return descriptor;
  };
}

/**
 * Safe wrapper for MongoDB queries
 * Ensures query parameters don't contain operators
 *
 * @example
 * ```typescript
 * const query = safeQuery({ email: userInput, status: 'active' });
 * const user = await this.userModel.findOne(query);
 * ```
 */
export function safeQuery(query: Record<string, any>): Record<string, any> {
  return sanitizeObject(query);
}
