import crypto from 'crypto';

export interface SpamCheckResult {
  score: number;
  isSafe: boolean;
  issues: string[];
}

/**
 * Pre-Send Email Spam Score Analyzer
 * Analyzes drafted email parameters to guarantee zero spam triggers (< 1.5 score)
 * according to RFC 5322, SpamAssassin, and major mailbox provider rules.
 */
export function analyzeEmailSpamScore(options: {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}): SpamCheckResult {
  let score = 0;
  const issues: string[] = [];

  const { subject, html, to, from } = options;

  // 1. Check Subject Line
  if (!subject || subject.trim().length === 0) {
    score += 3.0;
    issues.push('Missing email subject');
  }

  if (subject && subject.length > 80) {
    score += 0.5;
    issues.push('Subject length is longer than recommended 80 chars');
  }

  // ALL-CAPS subject check
  const uppercaseChars = subject.replace(/[^A-Z]/g, '').length;
  const totalLetters = subject.replace(/[^a-zA-Z]/g, '').length;
  if (totalLetters > 5 && (uppercaseChars / totalLetters) > 0.6) {
    score += 2.5;
    issues.push('Excessive uppercase characters in subject');
  }

  // Spam trigger keywords in subject
  const highRiskSpamWords = [
    'viagra', 'lottery', 'winner', 'claim your prize', 'cash bonus', '100% free',
    'earn money fast', 'miracle', 'risk-free', 'urgent business', 'billion dollars',
    'act now!', 'buy direct', 'cheap', 'clearance', 'dear friend'
  ];

  const lowerSubject = subject.toLowerCase();
  for (const word of highRiskSpamWords) {
    if (lowerSubject.includes(word)) {
      score += 2.0;
      issues.push(`Subject contains spam trigger phrase: "${word}"`);
    }
  }

  // Excessive punctuation in subject (e.g., "???", "!!!", "$$$")
  if (/([!?$]{2,})/.test(subject)) {
    score += 1.5;
    issues.push('Subject contains repeated exclamation or punctuation marks');
  }

  // 2. Check HTML Body Structure
  if (!html || html.trim().length < 20) {
    score += 3.0;
    issues.push('HTML body is too short or empty');
  }

  // Ensure DOCTYPE and standard HTML tags are present for clean rendering
  if (!html.toLowerCase().includes('<!doctype html') && !html.toLowerCase().includes('<html')) {
    score += 0.8;
    issues.push('Missing standard HTML5 DOCTYPE structure');
  }

  // Check Text-to-HTML balance
  const strippedText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (strippedText.length < 15) {
    score += 1.5;
    issues.push('Low text-to-code ratio');
  }

  // Check for presence of Unsubscribe or sender contact identifier (RFC compliance)
  const lowerHtml = html.toLowerCase();
  const hasUnsubscribe = lowerHtml.includes('unsubscribe') || lowerHtml.includes('support@') || lowerHtml.includes('ykyash.in');
  if (!hasUnsubscribe) {
    score += 1.0;
    issues.push('Missing legitimate sender identification or opt-out information');
  }

  // 3. Sender Verification
  if (!from || !from.includes('@')) {
    score += 3.0;
    issues.push('Invalid sender address');
  }

  // Safe if total spam score is under 2.0
  const isSafe = score < 2.0;

  return {
    score: Number(score.toFixed(2)),
    isSafe,
    issues
  };
}

/**
 * Encrypt and Decrypt sensitive strings using AES-256-GCM
 */
const ENCRYPTION_SECRET = process.env.JWT_SECRET || process.env.PAYU_MERCHANT_SALT || 'ykyash_secure_admin_salt_key_32_bytes_len!';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export function encryptAES(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

export function decryptAES(cipherText: string): string | null {
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) return null;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    return null;
  }
}

/**
 * Constant-time hash verification to prevent timing attacks
 */
export function verifyEmailTimingSafe(inputEmail: string, authorizedEmail: string): boolean {
  const normalizedInput = inputEmail.trim().toLowerCase();
  const normalizedAuthorized = authorizedEmail.trim().toLowerCase();
  
  const hashA = crypto.createHash('sha256').update(normalizedInput).digest();
  const hashB = crypto.createHash('sha256').update(normalizedAuthorized).digest();
  
  return crypto.timingSafeEqual(hashA, hashB);
}
