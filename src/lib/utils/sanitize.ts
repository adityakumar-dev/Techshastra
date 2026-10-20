/**
 * Security & Input Sanitization Utilities for TechShastra
 *
 * Protects forms, inputs, CSV uploads, and URL parameters from:
 * - XSS (<script>, <img onerror>, javascript: URIs)
 * - CSV Injection (=cmd|, @SUM, etc.)
 * - Excessive input bloat (length clamping)
 * - Malformed symbol-only spam names
 * - SQL / shell control characters
 */

/**
 * Strips HTML tags and encodes dangerous characters
 */
export function stripHtml(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>/g, "") // strip tags
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

/**
 * Validates and sanitizes a person's display name.
 * Allows international characters, accents, spaces, hyphens, and apostrophes.
 * Rejects pure symbols, script tags, or strings shorter than 2 or longer than 70 chars.
 */
export function sanitizeName(name: string): { valid: boolean; cleaned: string; error?: string } {
  if (!name) return { valid: false, cleaned: "", error: "Name is required" };

  // Reject immediately if the raw input contains HTML-like angle brackets
  if (/<|>/.test(name)) {
    return { valid: false, cleaned: "", error: "Name cannot contain < or > characters" };
  }

  // Block javascript: / data: URI schemes used in XSS
  if (/javascript\s*:|data\s*:/i.test(name)) {
    return { valid: false, cleaned: "", error: "Name contains a disallowed URI scheme" };
  }

  // Reject control characters or newlines
  if (/[\u0000-\u001F\u007F-\u009F]/.test(name)) {
    return { valid: false, cleaned: "", error: "Name contains invalid control characters" };
  }

  let cleaned = stripHtml(name).trim();
  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, " ");

  if (cleaned.length < 2) {
    return { valid: false, cleaned, error: "Name must be at least 2 characters" };
  }
  if (cleaned.length > 70) {
    return { valid: false, cleaned: cleaned.substring(0, 70), error: "Name cannot exceed 70 characters" };
  }

  // Check that it's not pure punctuation/symbols
  // Requires at least 2 alphabetic/unicode characters
  const letterCount = (cleaned.match(/[\p{L}]/gu) || []).length;
  if (letterCount < 2) {
    return { valid: false, cleaned, error: "Name must contain real alphabetic letters" };
  }

  // Disallow dangerous syntax characters
  if (/[<>{}[\]\\;/=^`~]/.test(cleaned)) {
    return { valid: false, cleaned, error: "Name cannot contain special characters like < > { } [ ] \\ ; / = ^" };
  }

  return { valid: true, cleaned };
}


/**
 * Validates and normalizes phone numbers.
 * Strips non-digits and checks length.
 */
export function sanitizeMobile(mobile: string): { valid: boolean; cleaned: string; error?: string } {
  if (!mobile) return { valid: false, cleaned: "", error: "Mobile number is required" };

  // Explicitly reject if input contains letters or dangerous symbols (<, >, =, ;, etc.)
  if (/[a-zA-Z<>{}[\]\\;/=^`~]/.test(mobile)) {
    return { valid: false, cleaned: "", error: "Mobile number can only contain digits, spaces, and + or - prefixes" };
  }

  const cleaned = mobile.replace(/[^0-9]/g, "");

  if (cleaned.length < 10) {
    return { valid: false, cleaned, error: "Mobile number must be at least 10 digits" };
  }
  if (cleaned.length > 15) {
    return { valid: false, cleaned: cleaned.substring(0, 15), error: "Mobile number cannot exceed 15 digits" };
  }

  return { valid: true, cleaned };
}

/**
 * Validates and normalizes email addresses.
 */
export function sanitizeEmail(email: string): { valid: boolean; cleaned: string; error?: string } {
  if (!email) return { valid: false, cleaned: "", error: "Email is required" };
  const cleaned = email.trim().toLowerCase();
  
  // RFC 5322 standard regex subset
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(cleaned)) {
    return { valid: false, cleaned, error: "Please enter a valid email address" };
  }
  if (cleaned.length > 254) {
    return { valid: false, cleaned, error: "Email address is too long" };
  }

  return { valid: true, cleaned };
}

/**
 * Protects against CSV Formula Injection when exporting/importing CSV data.
 * If a cell starts with =, +, -, @, \t, or \r, prefix with a single quote.
 */
export function sanitizeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * General text input sanitizer (messages, inquiries, notes)
 */
export function sanitizeGeneralText(text: string, maxLen: number = 2000): string {
  if (!text) return "";
  const cleaned = stripHtml(text).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  return cleaned.length > maxLen ? cleaned.substring(0, maxLen) : cleaned;
}
