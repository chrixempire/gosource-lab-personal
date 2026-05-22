import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { Request } from 'express';

/**
 * Security utilities for input validation and sanitization
 */
@Injectable()
export class SecurityUtils {
  /**
   * Validate MongoDB ObjectId
   */
  static isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
  }

  /**
   * Validate email format with enhanced security
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone: string): boolean {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  /**
   * Sanitize filename for file uploads
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .substring(0, 255);
  }

  /**
   * Validate URL format
   */
  static isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      return ['http:', 'https:'].includes(parsedUrl.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Generate secure random string
   */
  static generateSecureRandomString(length: number = 32): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBuffer = randomBytes(length);

    for (let i = 0; i < length; i++) {
      result += chars[randomBuffer[i] % chars.length];
    }
    return result;
  }

  /**
   * Hash sensitive data with salt
   */
  static hashWithSalt(
    data: string,
    salt?: string,
  ): { hash: string; salt: string } {
    const actualSalt = salt || this.generateSecureRandomString(16);
    const hash = createHash('sha256')
      .update(data + actualSalt)
      .digest('hex');
    return { hash, salt: actualSalt };
  }

  /**
   * Extract and validate IP address
   */
  static getClientIp(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.connection.remoteAddress;
    return this.isValidIp(ip) ? ip : '127.0.0.1';
  }

  /**
   * Validate IP address format
   */
  static isValidIp(ip: string): boolean {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }

  /**
   * Validate and sanitize search query
   */
  static sanitizeSearchQuery(query: string): string {
    if (!query || typeof query !== 'string') {
      return '';
    }

    // Remove special regex characters that could cause ReDoS
    const sanitized = query
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      .substring(0, 100)
      .trim();

    return sanitized;
  }

  /**
   * Validate password strength
   */
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password cannot contain common patterns');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Escape HTML entities
   */
  static escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };

    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * Validate currency amount
   */
  static isValidCurrencyAmount(amount: number): boolean {
    return (
      Number.isFinite(amount) &&
      amount >= 0 &&
      amount <= 99999999.99 &&
      Number((amount * 100).toFixed()) / 100 === amount
    );
  }

  /**
   * Rate limiting key generator
   */
  static generateRateLimitKey(req: Request, prefix: string): string {
    const ip = this.getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const hash = createHash('md5')
      .update(ip + userAgent)
      .digest('hex');
    return `${prefix}:${hash}`;
  }
}
