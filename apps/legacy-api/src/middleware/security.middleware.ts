import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { sanitizeBody, sanitizeQuery } from '../utils/nosql-sanitizer';
import { SecurityUtils } from '../utils/security.utils';

type RateLimitRule = {
  limit: number;
  methods?: string[];
  path: RegExp;
  windowMs: number;
};

/**
 * Enhanced security middleware that provides:
 * - IP blocking
 * - Advanced rate limiting
 * - Input validation
 * - Request sanitization
 * - Attack pattern detection
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private rateLimitStore = new Map<
    string,
    { count: number; resetTime: number }
  >();
  private readonly rateLimitRules: RateLimitRule[] = [
    { methods: ['POST'], path: /^\/v2\/auth\/login$/, limit: 5, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/auth\/resend-otp$/, limit: 5, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/auth\/verify-otp$/, limit: 10, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/auth\/send-password-email$/, limit: 5, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/auth\/verify-password-otp$/, limit: 10, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/employee\/invite$/, limit: 10, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/employee\/invite\/[^/]+\/resend$/, limit: 10, windowMs: 60_000 },
    { methods: ['POST'], path: /^\/v2\/employee\/invite\/[^/]+\/link$/, limit: 10, windowMs: 60_000 },
  ];

  async use(req: Request, res: Response, next: NextFunction) {
    try {
      // Apply security headers
      this.setSecurityHeaders(res);

      // Validate request size and structure
      this.validateRequestStructure(req);

      // Apply targeted rate limits to auth and invite abuse surfaces
      this.applyRateLimit(req, res);

      // Validate MongoDB operators in keys (but allow nested objects in body)
      this.validateObjectKeys(req.body, 'body');

      // Query parameters have stricter validation - no nested objects
      this.validateQueryParams(req.query);

      // Params should be simple strings
      this.validateObjectKeys(req.params, 'params');

      // Check for attack patterns
      this.detectAttackPatterns(req);

      // Sanitize request data
      this.sanitizeRequest(req);

      next();
    } catch (error) {
      next(error);
    }
  }

  private setSecurityHeaders(res: Response): void {
    const nonce = crypto.randomBytes(16).toString('base64');
    res.locals.cspNonce = nonce;
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net https://unpkg.com`,
        `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: https: blob:",
        "connect-src 'self' https: wss: ws:",
        "media-src 'self'",
        "object-src 'none'",
        "frame-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ].join('; '),
    );

    // Strict Transport Security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload',
    );

    // X-Content-Type-Options
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options
    res.setHeader('X-Frame-Options', 'DENY');

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      [
        'camera=()',
        'microphone=()',
        'geolocation=()',
        'payment=()',
        'usb=()',
        'magnetometer=()',
        'accelerometer=()',
        'gyroscope=()',
      ].join(', '),
    );

    // Remove sensitive headers
    res.removeHeader('X-Powered-By');
    res.removeHeader('Server');

    // Custom security headers
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  }

  private validateRequestStructure(req: Request): void {
    // Check request size
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 10 * 1024 * 1024) {
      // 10MB limit
      throw new BadRequestException('Request payload too large');
    }

    // Validate headers
    if (req.headers['user-agent'] && req.headers['user-agent'].length > 1000) {
      throw new BadRequestException('Invalid user agent');
    }

    // Check for suspicious header patterns
    const suspiciousHeaders = ['x-forwarded-host', 'x-originating-ip'];
    for (const header of suspiciousHeaders) {
      if (req.headers[header] && Array.isArray(req.headers[header])) {
        throw new BadRequestException(`Invalid ${header} header`);
      }
    }
  }

  /**
   * Validate query parameters - should not contain nested objects or MongoDB operators
   */
  private validateQueryParams(query: any): void {
    if (!query || typeof query !== 'object') {
      return;
    }

    for (const [key, value] of Object.entries(query)) {
      // Check for MongoDB operators
      if (key.startsWith('$')) {
        throw new BadRequestException(
          `Invalid query parameter "${key}": MongoDB operators are not allowed`,
        );
      }

      // Check for prototype pollution
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === '__proto__' ||
        lowerKey === 'constructor' ||
        lowerKey === 'prototype'
      ) {
        throw new BadRequestException(
          `Invalid query parameter "${key}": Prototype pollution attempts are blocked`,
        );
      }

      // Query params should be simple values or arrays of simple values
      // No nested objects allowed in query parameters
      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        throw new BadRequestException(
          `Invalid query parameter "${key}": Nested objects are not allowed in query parameters`,
        );
      }

      // If it's an array, validate each element (no objects in arrays)
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          if (value[i] !== null && typeof value[i] === 'object') {
            throw new BadRequestException(
              `Invalid query parameter "${key}[${i}]": Objects are not allowed in query parameter arrays`,
            );
          }
        }
      }
    }
  }

  private detectAttackPatterns(req: Request): void {
    const attackPatterns = [
      // SQL injection patterns (more specific)
      /(\bunion\s+select\b)/i,
      /(\bselect\s+\*\s+from\b)/i,
      /(\bdrop\s+table\b)/i,
      /(\binsert\s+into\b)/i,
      /(\bupdate\s+set\b)/i,
      /(\bdelete\s+from\b)/i,
      /(\'; DROP TABLE)/i,
      /(\bor\s+1=1\b)/i,
      /(\bor\s+\'1\'=\'1\b)/i,

      // XSS patterns (more specific)
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
      /javascript:\s*[^;]+/i,
      /on(load|error|click|mouse)\s*=/i,
      /<iframe\b[^>]*>/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /execScript\s*\(/i,
      /Function\s*\(/i,
      /setTimeout\s*\(\s*["'`]/i,
      /setInterval\s*\(\s*["'`]/i,
      /document\.(cookie|write)/i,
      /window\.(location|open)\s*=/i,

      // Command injection patterns (more specific)
      /[;|&]\s*(wget|curl|nc|netcat|nslookup|ping|dig|cat|sh|bash|cmd|powershell|python|perl|ruby|php|node)/i,
      /\$\([^)]*\)/, // $(command)
      /`[^`]*`/, // `command`
      /(&&|\|\|)\s*(rm|del|mv|cp|chmod|kill)/i,

      // Path traversal patterns - detect any occurrence of ../
      /\.\.[\/\\]/,
      /(\/etc\/passwd|\/etc\/shadow|boot\.ini|win\.ini)/i,

      // NoSQL injection patterns
      /\$where\s*:/i,
      /\$regex\s*:/i,
      /\$ne\s*:/i,
      /\$nin\s*:/i,
      /\$in\s*:/i,
      /\$gt\s*:/i,
      /\$gte\s*:/i,
      /\$lt\s*:/i,
      /\$lte\s*:/i,
      /\$or\s*:/i,
      /\$and\s*:/i,
      /\$nor\s*:/i,
      /\$not\s*:/i,
      /\$exists\s*:/i,
      /\$type\s*:/i,
      /\$expr\s*:/i,
      /\$function\s*:/i,
      /\$accumulator\s*:/i,
      /\$jsonSchema\s*:/i,
      /\$all\s*:/i,
      /\$elemMatch\s*:/i,
      /\$size\s*:/i,
      /\$mod\s*:/i,
      /\$text\s*:/i,
      // Update operators
      /\$set\s*:/i,
      /\$inc\s*:/i,
      /\$push\s*:/i,
      /\$pull\s*:/i,
      /\$unset\s*:/i,
      /\$rename\s*:/i,
      /\$mul\s*:/i,
      /\$min\s*:/i,
      /\$max\s*:/i,
      /\$currentDate\s*:/i,
      /\{\s*\$ne\s*:\s*null\s*\}/i,

      // /androxgh0st/i,
      // /c99|r57|wso|b374k|aspxspy/i,
      // /china\s*chopper/i,
      // /eval\s*\(\s*\$_/i,
      // /system\s*\(\s*\$_/i,
      // /exec\s*\(\s*\$_/i,
      // /shell_exec/i,
      // /base64_decode.*eval/i,

      // /\.php\d*$/i,
      // /shell\.(php|asp|jsp)/i,
      // /cmd\.(php|asp|jsp)/i,
      // /backdoor\./i,
    ];

    // Check body, query parameters, and suspicious headers
    const checkData = {
      body: req.body,
      query: req.query,
      headers: {
        // Only check certain headers that could contain malicious input
        referer: req.headers['referer'],
        origin: req.headers['origin'],
        'x-custom': req.headers['x-custom'],
        cookie: req.headers['cookie'],
      },
    };

    const checkString = JSON.stringify(checkData).toLowerCase();

    for (const pattern of attackPatterns) {
      if (pattern.test(checkString)) {
        throw new BadRequestException('Malicious request pattern detected');
      }
    }
  }

  private cleanupExpiredEntries(now: number): void {
    for (const [key, entry] of this.rateLimitStore.entries()) {
      if (now > entry.resetTime) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  private applyRateLimit(req: Request, res: Response): void {
    const rule = this.rateLimitRules.find((candidate) => {
      if (candidate.methods && !candidate.methods.includes(req.method.toUpperCase())) {
        return false;
      }

      return candidate.path.test(req.path);
    });

    if (!rule) {
      return;
    }

    const now = Date.now();
    this.cleanupExpiredEntries(now);

    const identityParts = [SecurityUtils.getClientIp(req), req.path];
    const email =
      typeof req.body?.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : null;

    if (email) {
      identityParts.push(email);
    }

    const key = identityParts.join(':');
    const current = this.rateLimitStore.get(key);

    if (!current || current.resetTime <= now) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: now + rule.windowMs,
      });
      return;
    }

    if (current.count >= rule.limit) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((current.resetTime - now) / 1000),
      );
      res.setHeader('Retry-After', String(retryAfterSeconds));
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    current.count += 1;
    this.rateLimitStore.set(key, current);
  }

  private validateObjectKeys(obj: any, path: string = 'root'): void {
    // Early return for null/undefined
    if (obj === null || obj === undefined) {
      return;
    }

    // Handle primitive types
    if (typeof obj !== 'object') {
      return;
    }

    // Handle Date objects safely - they're valid and should not be traversed
    if (obj instanceof Date) {
      return;
    }

    // Handle Buffer objects - they're valid binary data
    if (Buffer.isBuffer(obj)) {
      return;
    }

    // Array handling
    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        this.validateObjectKeys(obj[i], `${path}[${i}]`);
      }
      return;
    }

    // Check for dangerous keys in objects
    const keys = Object.keys(obj);

    for (const key of keys) {
      // Enhanced NoSQL operator detection - check for $ prefix
      if (key.startsWith('$')) {
        throw new BadRequestException(
          `Invalid key detected: "${key}" at path ${path}. MongoDB operators are not allowed in user input.`,
        );
      }

      // Check for prototype pollution attempts
      const lowerKey = key.toLowerCase();
      if (
        lowerKey === '__proto__' ||
        lowerKey === 'constructor' ||
        lowerKey === 'prototype'
      ) {
        throw new BadRequestException(
          `Invalid key detected: "${key}". Prototype pollution attempts are blocked.`,
        );
      }

      // Check for suspicious key patterns that could indicate code injection attempts
      this.validateKeyPattern(key, path);

      // Recursive validation for nested objects
      const value = obj[key];
      if (value !== null && typeof value === 'object') {
        this.validateObjectKeys(value, `${path}.${key}`);
      }
    }
  }

  /**
   * Validate key names for suspicious patterns that could indicate malicious intent
   */
  private validateKeyPattern(key: string, path: string): void {
    const lowerKey = key.toLowerCase();

    // Dangerous key patterns that could indicate code injection
    const suspiciousPatterns = [
      // Script/code execution patterns - only flag if suspicious context
      {
        pattern: /^(bsh|jsh|bash|powershell|cmd|sh)\./i,
        reason: 'shell script pattern',
      },
      {
        pattern: /\.(bsh|jsh|bash|powershell|cmd)$/i,
        reason: 'shell script extension',
      },
      {
        pattern: /(^|\.)eval$/i,
        reason: 'eval function pattern',
      },
      {
        pattern: /(^|\.)exec$/i,
        reason: 'exec function pattern',
      },

      // System/process manipulation
      {
        pattern: /^(system|process)\.(spawn|fork|exec|eval)/i,
        reason: 'system manipulation pattern',
      },

      // Common attack vectors
      {
        pattern: /(javascript|vbscript|jscript):/i,
        reason: 'script protocol',
      },
      {
        pattern: /^on(load|error|click|mouse|key|focus|blur)/i,
        reason: 'event handler pattern',
      },

      // Prototype pollution variations
      {
        pattern: /__proto__|constructor\.prototype/i,
        reason: 'prototype pollution',
      },
    ];

    for (const { pattern, reason } of suspiciousPatterns) {
      if (pattern.test(lowerKey)) {
        throw new BadRequestException(
          `Suspicious key detected: "${key}" at path ${path}. Key contains ${reason} and is blocked for security reasons.`,
        );
      }
    }

    // Check for keys that contain multiple consecutive dots (could be property traversal)
    if (/\.{2,}/.test(key)) {
      throw new BadRequestException(
        `Suspicious key detected: "${key}" at path ${path}. Keys with consecutive dots are not allowed.`,
      );
    }
  }

  private sanitizeRequest(req: Request): void {
    try {
      // Sanitize query parameters - strict validation, no nested objects
      if (req.query) {
        req.query = sanitizeQuery(req.query);
      }

      // Sanitize request body - allows nested objects but checks for MongoDB operators
      if (req.body) {
        req.body = sanitizeBody(req.body);
      }

      // Sanitize path parameters - strict validation
      if (req.params) {
        req.params = sanitizeQuery(req.params);
      }
    } catch (error) {
      // Re-throw sanitization errors
      throw new BadRequestException(
        error.message || 'Invalid input data detected',
      );
    }
  }

  private sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((item) => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (key.startsWith('$')) {
          throw new BadRequestException(
            'MongoDB operators not allowed in field names',
          );
        }

        if (['__proto__', 'constructor', 'prototype'].includes(key)) {
          continue;
        }
        const cleanKey = this.sanitizeString(key);
        sanitized[cleanKey] = this.sanitizeObject(value);
      }
      return sanitized;
    }

    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }

    return obj;
  }

  private sanitizeString(str: string): string {
    if (typeof str !== 'string') {
      return str;
    }

    // Remove null bytes and control characters
    let cleaned = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Remove potential script injections
    cleaned = cleaned.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      '',
    );
    cleaned = cleaned.replace(/javascript:/gi, '');
    cleaned = cleaned.replace(/on\w+\s*=/gi, '');

    // Limit string length
    if (cleaned.length > 10000) {
      cleaned = cleaned.substring(0, 10000);
    }

    return cleaned.trim();
  }
}
