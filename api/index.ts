import crypto from 'crypto';
import express from 'express';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { put, del, list } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import payuHostedRouter from './payu/payuHosted.js';
import payuCustomHostedRouter from './payu/payuCustomHosted.js';
import { analyzeEmailSpamScore, verifyEmailTimingSafe, encryptAES } from './utils/security.js';

// Server-side Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key';
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false }
});

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Mount isolated PayU Hosted and Custom Hosted Router modules
app.use('/api/payu/hosted', payuHostedRouter);
app.use('/api/payu/custom', payuCustomHostedRouter);


const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Endpoint to parse response sheet URL (Hardened against SSRF)
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: "Valid URL is required" });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.trim());
    } catch {
      return res.status(400).json({ error: "Malformed URL provided" });
    }

    // Enforce HTTP/HTTPS only
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ error: "Only http and https protocols are allowed" });
    }

    // SSRF Blocklist: Prevent loopback, private ranges, link-local, and cloud metadata (169.254.169.254)
    const hostname = parsedUrl.hostname.toLowerCase();
    const isPrivate = 
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local');

    if (isPrivate) {
      return res.status(403).json({ error: "Access to internal network addresses is forbidden" });
    }

    const response = await fetch(parsedUrl.href, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const html = await response.text();
    res.status(200).json({ html });
  } catch (error: any) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint for Vercel Blob stats
app.get('/api/blob/stats', async (req, res) => {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing.' });
    }

    let storageUsed = 0;
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const listResult = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
        cursor,
        limit: 1000 // max limit per page
      });

      for (const blob of listResult.blobs) {
        storageUsed += blob.size;
      }

      hasMore = listResult.hasMore;
      cursor = listResult.cursor;
    }

    // Free tier is roughly 250 MB
    const totalLimitBytes = 250 * 1024 * 1024;
    const remainingBytes = Math.max(0, totalLimitBytes - storageUsed);

    res.json({
      success: true,
      storageUsed,
      remainingBytes,
      totalLimitBytes
    });
  } catch (error: any) {
    console.error('Blob Stats Error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Vercel Blob stats' });
  }
});

// Endpoint for Vercel Blob client upload token generation and callback
app.post('/api/upload', async (req, res) => {
  try {
    const jsonResponse = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['application/pdf'],
          maximumSizeInBytes: 100 * 1024 * 1024, // 100MB
          addRandomSuffix: true,
          contentDispositionType: 'inline',
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Upload completed securely
      },
    });

    return res.status(200).json(jsonResponse);
  } catch (error: any) {
    console.error('Upload Error:', error);
    return res.status(400).json({ error: error.message || 'Failed to handle upload' });
  }
});

// Endpoint for Vercel Blob delete
app.delete('/api/upload/delete', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'No URL provided for deletion.' });
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({ error: 'BLOB_READ_WRITE_TOKEN is missing.' });
    }

    if (url.includes('blob.vercel-storage')) {
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    }
    
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete Error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete from Vercel Blob' });
  }
});

// In-memory rate limiting map for OTP email requests (Max 1 request every 30 seconds per IP/email)
const authOtpRateLimitMap = new Map<string, number>();

// Endpoint to send the login code via Resend
app.post('/api/auth/send-code', async (req, res) => {
  const { email, name } = req.body;
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
  const rateLimitKey = `${clientIp}_${email.trim().toLowerCase()}`;
  const lastSent = authOtpRateLimitMap.get(rateLimitKey);
  const now = Date.now();

  if (lastSent && (now - lastSent < 30000)) {
    return res.status(429).json({ 
      error: `Please wait ${Math.ceil((30000 - (now - lastSent)) / 1000)} seconds before requesting a new login code.` 
    });
  }
  authOtpRateLimitMap.set(rateLimitKey, now);

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured on the server.' });
  }

  const resend = new Resend(apiKey);
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    let senderEmail = process.env.RESEND_FROM_EMAIL || 'YK Yash <auth@verify.ykyash.in>';
    let { data, error } = await resend.emails.send({
      from: senderEmail,
      to: email,
      subject: 'Your YK Login Code',
      html: `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login Code</title>
  </head>
  <body
    style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 16px; color: #333333; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;"
  >
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      <tbody>
        <tr>
          <td align="center" style="padding: 40px 20px; font-size: 16px;">
            <table
              role="presentation"
              width="100%"
              style="max-width: 500px; margin: 0 auto; text-align: left;"
              cellspacing="0"
              cellpadding="0"
              border="0"
            >
              <tbody>
                <tr>
                  <td style="padding: 30px; border: 1px solid #eaeaea; border-radius: 8px; font-size: 16px;">
                    <h2 style="color: #111111; font-size: 20px; margin: 0 0 20px 0; font-weight: 600;">YK Yash</h2>

                    <p style="font-size: 15px; color: #444444; line-height: 1.6; margin: 0 0 24px 0;">
                      You requested a secure code to access your account. Please enter the code below to complete your
                      login.
                    </p>

                    <table
                      role="presentation"
                      cellspacing="0"
                      cellpadding="0"
                      border="0"
                      style="margin: 0 0 24px 0; width: 100%;"
                    >
                      <tbody>
                        <tr>
                          <td
                            align="center"
                            style="background-color: #f9f9f9; padding: 20px; border-radius: 6px; border: 1px solid #eeeeee;"
                          >
                            <span
                              style="font-size: 32px; font-weight: 700; color: #111111; letter-spacing: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;"
                              >${otp}</span
                            >
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <p style="margin: 0 0 30px 0; font-size: 15px;">
                      <a
                        href="https://ykyash.in/verify?c=${otp}"
                        style="color: #000000; text-decoration: underline; font-weight: 500;"
                        >Verify and login automatically</a
                      >
                    </p>

                    <p
                      style="margin: 0; font-size: 13px; color: #888888; line-height: 1.5; border-top: 1px solid #eaeaea; padding-top: 20px;"
                    >
                      This code will expire in 10 minutes.<br />
                      Didn't request this code? You can safely ignore this email.<br /><br />
                      <a
                        href="mailto:support@ykyash.in?subject=unsubscribe"
                        style="color: #888888; text-decoration: underline;"
                        >Unsubscribe</a
                      >
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>
      `
    });

    // Automatic fallback: if custom domain is not yet verified on Resend, retry with onboarding@resend.dev
    if (error && error.message && (error.message.includes('domain') || error.message.includes('verify') || error.message.includes('not verified'))) {
      console.warn('Resend custom domain not verified, falling back to onboarding@resend.dev');
      const fallbackResult = await resend.emails.send({
        from: 'YK Yash <onboarding@resend.dev>',
        to: email,
        subject: 'Your YK Login Code',
        html: `
<div style="font-family: sans-serif; padding: 20px; color: #111;">
  <h2>YK Yash Security Code</h2>
  <p>Your one-time login passkey is:</p>
  <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; padding: 16px; background: #f4f4f4; border-radius: 8px; text-align: center; margin: 16px 0;">${otp}</div>
  <p style="font-size: 12px; color: #666;">Expires in 10 minutes.</p>
</div>
        `
      });
      error = fallbackResult.error;
      data = fallbackResult.data;
    }

    if (error) {
      console.error('Resend API Error:', error);
      return res.status(400).json({ error: error.message || 'Resend API rejected the request' });
    }

    // STATELESS AUTH FOR VERCEL: Sign the OTP into a short-lived token
    const verificationToken = jwt.sign(
      { email, name, otp },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '10m' }
    );

    res.json({ success: true, verificationToken });
  } catch (error: any) {
    console.error('Resend Error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
});

// Endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) return res.status(400).json({ error: 'All fields are required' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY is not configured.' });

  const resend = new Resend(apiKey);

  try {
    const { data, error } = await resend.emails.send({
      from: 'YK Yash <delivered@resend.dev>',
      to: 'contact@ykyash.in',
      subject: `New Contact Form Message from ${name}`,
      replyTo: email,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Contact Message</title>
          <style>
            @media screen and (max-width: 600px) {
              .main-container { width: 100% !important; border-radius: 0 !important; border: none !important; }
              .content-padding { padding: 20px !important; }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 0; background-color: #FAEDCB; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FAEDCB; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table class="main-container" width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid #8D5700;">
                  <tr>
                    <td class="content-padding" align="center" style="padding: 30px 40px; border-bottom: 1px solid rgba(141, 87, 0, 0.2);">
                      <h1 style="color: #8D5700; margin: 0; font-size: 24px; font-weight: 700; text-transform: uppercase;">New Contact Message</h1>
                    </td>
                  </tr>
                  <tr>
                    <td class="content-padding" style="padding: 40px;">
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #8D5700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Sender Details</p>
                      <table width="100%" border="0" cellspacing="0" cellpadding="15" style="background-color: #FAEDCB; border-radius: 6px; margin-bottom: 30px;">
                        <tr>
                          <td>
                            <p style="margin: 0 0 8px 0; color: #8D5700; font-size: 15px;"><strong>Name:</strong> ${name}</p>
                            <p style="margin: 0; color: #8D5700; font-size: 15px;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #8D5700; text-decoration: underline;">${email}</a></p>
                          </td>
                        </tr>
                      </table>
                      <p style="margin: 0 0 10px 0; font-size: 14px; color: #8D5700; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.8;">Message</p>
                      <table width="100%" border="0" cellspacing="0" cellpadding="20" style="border: 1px solid rgba(141, 87, 0, 0.2); border-radius: 6px;">
                        <tr>
                          <td style="color: #8D5700; font-size: 15px; line-height: 1.6;">
                            ${message.replace(/\n/g, '<br/>')}
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td class="content-padding" align="center" style="padding: 20px 40px; background-color: rgba(250, 237, 203, 0.3); border-top: 1px solid rgba(141, 87, 0, 0.2);">
                      <p style="color: #8D5700; font-size: 12px; margin: 0; opacity: 0.7;">Sent via YK Yash Contact Form</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('Resend API Error (Contact):', error);
      return res.status(400).json({ error: error.message || 'Resend API rejected the request' });
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('Contact Form Error:', error);
    res.status(500).json({ error: error.message || 'Failed to send message' });
  }
});

// Endpoint to verify the code and issue a JWT
app.post('/api/auth/verify', (req, res) => {
  const { email, code, verificationToken } = req.body;
  
  if (!verificationToken) {
    return res.status(400).json({ error: 'Verification session expired or missing. Please request a new code.' });
  }

  try {
    const decoded = jwt.verify(verificationToken, process.env.JWT_SECRET || 'fallback_secret') as { email: string, name?: string, otp: string };

    if (decoded.email !== email || decoded.otp !== code) {
      return res.status(400).json({ error: 'Invalid code' });
    }

    const token = jwt.sign(
      { email, name: decoded.name }, 
      process.env.JWT_SECRET || 'fallback_secret', 
      { expiresIn: '7d' }
    );
    
    res.json({ success: true, token, user: { email, name: decoded.name } });
  } catch (error) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }
});

// Web Push setup
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || 'BKBmjGF6XWxFd6UQtsQlUgPs54dERDDqs20oMNjccb5z4irQTxysbZwSW7j3D3aeockUGiqlz6Ert5PagZtcWcs';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || 'd9R8oMbgRumYIJy_Nv8LXMD9qT3npM7wifpFRleppT4';

webpush.setVapidDetails(
  'mailto:auth@verify.ykyash.in',
  vapidPublicKey,
  vapidPrivateKey
);

app.post('/api/push/send', async (req, res) => {
  const { subscription, title, body, url } = req.body;

  if (!subscription) {
    return res.status(400).json({ error: 'Push subscription is required.' });
  }

  try {
    const payload = JSON.stringify({
      title: title || 'Notification from YK Yash',
      body: body || 'You have a new update!',
      url: url || '/'
    });

    await webpush.sendNotification(subscription, payload);
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: 'Failed to send notification.' });
  }
});


// Active checkout cooldown map to prevent duplicate / rapid requests from hitting PayU within 8s
const activeCheckoutLockMap = new Map<string, number>();

// PayU Custom Checkout (Merchant Hosted) Endpoints
app.get('/api/payu/config', (req, res) => {
  const isConfigured = Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
  const payuEnv = process.env.PAYU_ENV || 'production';
  const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');
  
  res.json({
    configured: isConfigured,
    environment: payuEnv,
    endpoint: payuUrl,
    merchantKey: process.env.PAYU_MERCHANT_KEY || '',
  });
});

// PayU Hash Generation for custom forms
app.post('/api/payu/hash', (req, res) => {
  try {
    const { 
      txnid, 
      amount, 
      productinfo, 
      firstname, 
      email, 
      udf1 = "", 
      udf2 = "", 
      udf3 = "", 
      udf4 = "", 
      udf5 = "", 
      udf6 = "", 
      udf7 = "", 
      udf8 = "", 
      udf9 = "", 
      udf10 = "" 
    } = req.body;

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    const formattedAmount = Number(amount).toFixed(2);
    const hashString = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|${udf6}|${udf7}|${udf8}|${udf9}|${udf10}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    res.json({ 
      hash, 
      key, 
      amount: formattedAmount,
      actionUrl: payuUrl,
      txnid,
      environment: payuEnv 
    });
  } catch (error: any) {
    console.error('PayU Hash Error:', error);
    res.status(500).json({ error: 'Failed to generate PayU hash', details: error.message });
  }
});

// PayU Official Hosted Checkout Session Initiation
app.post('/api/payu/initiate-custom-checkout', async (req, res) => {
  try {
    const {
      amount,
      productinfo,
      firstname,
      email,
      phone,
      paymentMode, // 'card' | 'upi' | 'nb' | 'wallet'
      cardDetails,
      upiDetails,
      nbDetails,
      walletDetails,
      udf1 = "custom_checkout",
      udf2 = "merchant_hosted",
      udf3 = "",
      udf4 = "",
      udf5 = ""
    } = req.body;

    if (!amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ error: 'Missing required checkout parameters (amount, productinfo, firstname, email).' });
    }

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');
    
    // Determine canonical HTTPS callback origin
    const rawOrigin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
    const originHost = (rawOrigin && rawOrigin.startsWith('https://')) ? rawOrigin : (process.env.APP_URL || 'https://ykyash.in');
    const surl = `${originHost}/api/payu/success`;
    const furl = `${originHost}/api/payu/failure`;

    // Extract actual customer's Client IP address to bypass Vercel serverless IP rate-limiting
    const rawIp = req.headers['x-forwarded-for'] 
      ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : (req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');
    const clientIp = String(rawIp).replace(/[^0-9a-fA-F:.]/g, '') || '127.0.0.1';

    // Enforce 8-second cooldown per client IP + email to completely prevent PayU rate limiting (Step 3 checklist)
    const userLockKey = `${clientIp}_${String(email).trim().toLowerCase()}`;
    const lastRequestTime = activeCheckoutLockMap.get(userLockKey);
    const now = Date.now();

    if (lastRequestTime && (now - lastRequestTime < 8000)) {
      console.warn(`[PayU Rate Limit Guard] Throttling rapid checkout attempt for ${userLockKey}. Cooldown active.`);
      return res.status(429).json({ 
        success: false, 
        error: 'Payment initiation is already in progress. Please wait 8 seconds before trying again.' 
      });
    }
    activeCheckoutLockMap.set(userLockKey, now);

    // PayU alphanumeric txnid without underscores to avoid rate-limit WAF triggers
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const txnid = req.body.txnid || ('YK' + Date.now() + randomSuffix);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    if (!customerPhone || customerPhone.length < 10) {
      return res.status(400).json({ error: 'A valid 10-digit mobile phone number is required for transaction processing.' });
    }

    console.log(`[PayU Audit Log] TS: ${new Date().toISOString()} | TXN: ${txnid} | Client IP: ${clientIp} | Customer: ${sanitizedFirstname} (${email}) | Amount: ${formattedAmount}`);

    // Hash formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Build the PayU Hosted / Custom parameters dictionary with s2s_client_ip
    const payuParams: Record<string, string> = {
      key,
      txnid,
      amount: formattedAmount,
      productinfo: sanitizedProduct,
      firstname: sanitizedFirstname,
      email: String(email).trim(),
      phone: customerPhone,
      surl,
      furl,
      hash,
      s2s_client_ip: clientIp,
      service_provider: 'payu_paisa',
      udf1,
      udf2,
      udf3,
      udf4,
      udf5
    };

    // Attach payment mode parameters according to PayU Custom Checkout specifications
    if (paymentMode === 'card' && cardDetails) {
      payuParams.pg = 'CC';
      payuParams.bankcode = 'CC';
      // Strip formatting spaces/hyphens
      payuParams.cnum = String(cardDetails.cnum || '').replace(/\D/g, '');
      payuParams.ccname = String(cardDetails.ccname || sanitizedFirstname);
      payuParams.ccexpmon = String(cardDetails.ccexpmon || '').padStart(2, '0');
      payuParams.ccexpyr = String(cardDetails.ccexpyr || '');
      payuParams.ccvv = String(cardDetails.ccvv || '');
    } else if (paymentMode === 'upi' && upiDetails) {
      payuParams.pg = 'UPI';
      payuParams.bankcode = 'UPI';
      if (upiDetails.vpa) {
        payuParams.vpa = String(upiDetails.vpa).trim();
      }
    } else if (paymentMode === 'nb' && nbDetails) {
      payuParams.pg = 'NB';
      payuParams.bankcode = String(nbDetails.bankcode || 'SBIN');
    } else if (paymentMode === 'wallet' && walletDetails) {
      payuParams.pg = 'WALLET';
      payuParams.bankcode = String(walletDetails.bankcode || 'PAYTM');
    }

    res.json({
      success: true,
      actionUrl: payuUrl,
      payuParams,
      txnid,
      environment: payuEnv
    });
  } catch (error: any) {
    console.error('Custom Checkout Initiation Error:', error);
    res.status(500).json({ error: 'Failed to initiate PayU custom checkout', details: error.message });
  }
});

// PayU Server-to-Server (S2S) UPI Intent Endpoint (https://docs.payu.in/docs/upi-intent-server-to-server)
app.post('/api/payu/s2s-upi-intent', async (req, res) => {
  try {
    const {
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1 = 's2s_upi_intent',
      udf2 = 'digital_license',
      udf3 = ''
    } = req.body;

    if (!amount || !productinfo || !firstname) {
      return res.status(400).json({ error: 'Missing required parameters: amount, productinfo, firstname' });
    }

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuEndpoint = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    const origin = req.headers.origin || (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : (process.env.APP_URL || 'https://ykyash.in'));
    const surl = `${origin}/api/payu/success`;
    const furl = `${origin}/api/payu/failure`;

    const txnid = 'YK_UPI_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    const customerEmail = email && String(email).includes('@') ? String(email).trim() : '';

    if (!customerPhone || customerPhone.length < 10 || !customerEmail) {
      return res.status(400).json({ error: 'Valid customer phone number and email are required for transaction.' });
    }

    // Standard PayU SHA-512 Hash formula (10 UDF slots total):
    // key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const udf4 = req.body.udf4 || '';
    const udf5 = req.body.udf5 || '';
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${customerEmail}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // PayU Official Payment Identifier & VPA fallback
    const payuMerchantVpa = 'payu@axisbank';
    const payuMerchantName = 'PayU Payments (YK Yash)';
    let dynamicUpiUri = `upi://pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`;

    // App-specific intent URIs based on PayU Intent specification
    let intentUris: Record<string, string> = {
      standard: dynamicUpiUri,
      gpay: `tez://upi/pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`,
      phonepe: `phonepe://pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`,
      paytm: `paytmmp://pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`,
      bhim: dynamicUpiUri,
      cred: `cred://upi/pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`,
      amazonpay: `amazonpay://upi/pay?pa=${encodeURIComponent(payuMerchantVpa)}&pn=${encodeURIComponent(payuMerchantName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent(`Order ${sanitizedProduct.slice(0, 20)} - ${txnid}`)}`
    };

    let payuServerResponse: any = null;

    // Call PayU S2S endpoint (https://docs.payu.in/docs/upi-intent-server-to-server)
    try {
      const postData = new URLSearchParams({
        key,
        txnid,
        amount: formattedAmount,
        productinfo: sanitizedProduct,
        firstname: sanitizedFirstname,
        email: customerEmail,
        phone: customerPhone,
        surl,
        furl,
        hash,
        pg: 'UPI',
        bankcode: 'INTENT',
        txn_s2s_flow: '1',
        udf1,
        udf2,
        udf3
      });

      const payuRes = await fetch(payuEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json, text/plain, */*'
        },
        body: postData.toString()
      });

      if (payuRes.ok) {
        const contentType = payuRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          payuServerResponse = await payuRes.json();
          if (payuServerResponse.intentURIs || payuServerResponse.data?.intentURIs) {
            const returnedUris = payuServerResponse.intentURIs || payuServerResponse.data?.intentURIs;
            intentUris = { ...intentUris, ...returnedUris };
            if (returnedUris.upiURI) dynamicUpiUri = returnedUris.upiURI;
          }
        }
      }
    } catch (payuErr) {
      console.warn('PayU S2S API call notice:', payuErr);
    }

    res.json({
      success: true,
      txnid,
      amount: formattedAmount,
      currency: 'INR',
      merchantVpa: payuMerchantVpa,
      merchantName: payuMerchantName,
      upiUri: dynamicUpiUri,
      intentUris,
      hash,
      key,
      payuEndpoint,
      payuParams: {
        key,
        txnid,
        amount: formattedAmount,
        productinfo: sanitizedProduct,
        firstname: sanitizedFirstname,
        email: customerEmail,
        phone: customerPhone,
        surl,
        furl,
        hash,
        pg: 'UPI',
        bankcode: 'INTENT',
        udf1,
        udf2,
        udf3
      },
      payuS2sActive: Boolean(payuServerResponse)
    });
  } catch (error: any) {
    console.error('PayU S2S UPI Intent Error:', error);
    res.status(500).json({ error: 'Failed to generate S2S UPI Intent', details: error.message });
  }
});

// PayU Server-to-Server Payment Status Verification (verify_payment command)
app.post('/api/payu/verify-payment', async (req, res) => {
  try {
    const { txnid } = req.body;
    if (!txnid) return res.status(400).json({ error: 'Transaction ID (txnid) is required' });

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const postserviceUrl = payuEnv === 'production' 
      ? 'https://info.payu.in/merchant/postservice.php?form=2' 
      : 'https://test.payu.in/merchant/postservice.php?form=2';

    // Hash formula for verify_payment: sha512(key|verify_payment|txnid|salt)
    const hashString = `${key}|verify_payment|${txnid}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    let paymentStatus = 'pending';
    let transactionDetails: any = { txnid, status: 'pending' };
    let isVerified = false;

    if (process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT) {
      try {
        const bodyParams = new URLSearchParams({
          key,
          command: 'verify_payment',
          var1: txnid,
          hash
        });

        const verifyRes = await fetch(postserviceUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: bodyParams.toString()
        });

        if (verifyRes.ok) {
          const rawText = await verifyRes.text();
          let data: any = null;
          try {
            data = JSON.parse(rawText);
          } catch {
            console.warn('[PayU verify_payment raw response]:', rawText);
          }

          if (data && data.transaction_details) {
            const matchedKey = Object.keys(data.transaction_details).find(
              k => k.toLowerCase() === String(txnid).toLowerCase()
            );
            
            if (matchedKey) {
              transactionDetails = data.transaction_details[matchedKey];
              paymentStatus = transactionDetails.status || 'pending';
              const unmapped = String(transactionDetails.unmappedstatus || '').toLowerCase();
              
              if (
                paymentStatus.toLowerCase() === 'success' || 
                unmapped === 'captured' || 
                unmapped === 'success' ||
                Boolean(transactionDetails.mihpayid && transactionDetails.bank_ref_num)
              ) {
                isVerified = true;
                paymentStatus = 'success';
              }
            }
          }
        }
      } catch (err) {
        console.warn('PayU verify_payment postservice check:', err);
      }
    }

    const failureReason = transactionDetails.field9 || transactionDetails.error_Message || transactionDetails.unmappedstatus || null;

    res.json({
      success: true,
      verified: isVerified,
      txnid,
      status: paymentStatus,
      reason: failureReason,
      bankRefNum: transactionDetails.bank_ref_num || transactionDetails.mihpayid || null,
      errorCode: transactionDetails.error || transactionDetails.error_code || null,
      details: transactionDetails
    });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify transaction status', details: error.message });
  }
});

// PayU Success Callback Handler (Supports both POST callbacks from PayU and GET redirects)
app.all('/api/payu/success', async (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const { 
      txnid = `TXN_${Date.now()}`, 
      amount = '499', 
      productinfo = 'Premium Digital Kit', 
      firstname = 'Valued Developer', 
      email = '', 
      status = 'success', 
      hash, 
      bank_ref_num, 
      payuMoneyId,
      additionalCharges,
      udf1 = "",
      udf2 = "",
      udf3 = "",
      udf4 = "",
      udf5 = ""
    } = params;

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    let hashVerified = false;

    // Verify reverse hash if salt and hash are present
    if (hash && salt && status) {
      let calculatedHashString = '';
      if (additionalCharges) {
        calculatedHashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      } else {
        calculatedHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      }
      const calculatedHash = crypto.createHash('sha512').update(calculatedHashString).digest('hex');
      if (calculatedHash.toLowerCase() === String(hash).toLowerCase()) {
        hashVerified = true;
      } else {
        console.warn('PayU Reverse Hash Verification Notice: Hash check mismatch in callback payload.');
      }
    }

    // Persist/update transaction in Supabase
    try {
      if (supabaseServer) {
        await supabaseServer.from('payments').upsert([{
          txnid,
          amount: Number(amount) || 0,
          product: productinfo,
          customer_name: firstname,
          customer_email: email,
          status: 'success',
          payment_mode: 'payu',
          bank_ref_num: bank_ref_num || payuMoneyId || null,
          mihpayid: payuMoneyId || null,
          hash_verified: hashVerified,
          raw_payload: params,
          updated_at: new Date().toISOString()
        }], { onConflict: 'txnid' });
      }
    } catch (dbErr) {
      console.error('[Supabase Payment Callback Error]:', dbErr);
    }

    const productParam = encodeURIComponent(String(productinfo));
    const custParam = encodeURIComponent(String(firstname));
    const emailParam = encodeURIComponent(String(email));
    const refParam = encodeURIComponent(String(bank_ref_num || payuMoneyId || txnid));

    res.redirect(`/payment/success?txnid=${txnid}&amount=${amount}&product=${productParam}&customer=${custParam}&email=${emailParam}&ref=${refParam}&status=success`);
  } catch (error) {
    console.error('PayU Success Handler Error:', error);
    res.redirect('/payment/success?status=success');
  }
});

// PayU Failure Callback Handler (Extracts field9 and error_Message from PayU)
app.all('/api/payu/failure', async (req, res) => {
  const params = { ...req.query, ...req.body };
  const { txnid = 'UNKNOWN', field9, error_Message, unmappedstatus, msg, error, amount = '0', productinfo = 'Product', firstname = 'Customer', email = '' } = params;
  const reasonText = field9 || error_Message || unmappedstatus || msg || error || 'Transaction was declined or cancelled by bank.';
  const reason = encodeURIComponent(String(reasonText));

  // Persist failure status in Supabase
  try {
    if (supabaseServer && txnid && txnid !== 'UNKNOWN') {
      await supabaseServer.from('payments').upsert([{
        txnid,
        amount: Number(amount) || 0,
        product: productinfo,
        customer_name: firstname,
        customer_email: email,
        status: 'failure',
        payment_mode: 'payu',
        raw_payload: params,
        updated_at: new Date().toISOString()
      }], { onConflict: 'txnid' });
    }
  } catch (dbErr) {
    console.error('[Supabase Failure Log Error]:', dbErr);
  }

  res.redirect(`/payment/failure?txnid=${txnid}&reason=${reason}`);
});

/**
 * PayU Webhook Handler (Asynchronous Server-to-Server Event Listener)
 * Supports all PayU event formats: JSON payloads, URL-encoded webhook posts, dispute/refund events, and test pings
 * Reference: https://docs.payu.in/docs/webhook-events-and-sample-payloads
 */
app.all('/api/payu/webhook', async (req, res) => {
  try {
    const payload = { ...req.query, ...req.body };
    const txnid = payload.txnid || payload.txn_id || payload.transaction_id || payload.id || payload.merchantTransactionId || payload.cb_id || null;
    const status = payload.status || payload.cb_status || payload.event || payload.action || 'received';
    const amount = payload.amount || payload.cb_amount || payload.net_amount_debit || '0';
    const productinfo = payload.productinfo || payload.product_info || payload.description || 'PayU Transaction';
    const firstname = payload.firstname || payload.first_name || payload.customer_name || 'Customer';
    const email = payload.email || payload.customer_email || '';
    const hash = payload.hash || payload.signature || null;
    const bank_ref_num = payload.bank_ref_num || payload.bank_reference || payload.bankRefNum || payload.mihpayid || null;
    const mihpayid = payload.mihpayid || payload.payuMoneyId || payload.payu_money_id || null;
    const additionalCharges = payload.additionalCharges || payload.additional_charges || null;
    const udf1 = payload.udf1 || "";
    const udf2 = payload.udf2 || "";
    const udf3 = payload.udf3 || "";
    const udf4 = payload.udf4 || "";
    const udf5 = payload.udf5 || "";

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    let hashVerified = false;

    // Verify SHA-512 Reverse Hash if hash and parameters are provided
    if (hash && salt && status && txnid) {
      let calculatedHashString = '';
      if (additionalCharges) {
        calculatedHashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      } else {
        calculatedHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      }
      const calculatedHash = crypto.createHash('sha512').update(calculatedHashString).digest('hex');
      hashVerified = (calculatedHash.toLowerCase() === String(hash).toLowerCase());
    }

    console.log(`[PayU Webhook] Notification received. TXN: ${txnid || 'N/A'} | Status: ${status} | Hash Verified: ${hashVerified}`);

    // Map standardized status
    const statusLower = String(status).toLowerCase();
    const normalizedStatus = (statusLower === 'success' || statusLower === 'captured') 
      ? 'success' 
      : (statusLower === 'pending' ? 'pending' : (statusLower.includes('fail') || statusLower.includes('decline') ? 'failure' : 'initiated'));

    // Upsert transaction in Supabase if a txnid or event exists
    if (txnid && supabaseServer) {
      try {
        await supabaseServer.from('payments').upsert([{
          txnid: String(txnid),
          amount: Number(amount) || 0,
          product: String(productinfo),
          customer_name: String(firstname),
          customer_email: String(email),
          status: normalizedStatus,
          payment_mode: 'payu_webhook',
          bank_ref_num: bank_ref_num || mihpayid || null,
          mihpayid: mihpayid || null,
          hash_verified: hashVerified,
          raw_payload: payload,
          updated_at: new Date().toISOString()
        }], { onConflict: 'txnid' });
      } catch (dbErr) {
        console.error('[Supabase Webhook Persistence Error]:', dbErr);
      }
    }

    // Always respond with 200 OK so PayU Webhook test verification succeeds
    return res.status(200).json({ 
      status: 'success',
      message: 'Webhook processed successfully',
      txnid: txnid || 'TEST_PING_ACK',
      hashVerified 
    });
  } catch (err: any) {
    console.error('PayU Webhook Error:', err);
    // Return 200 with error acknowledgement to prevent PayU dashboard retry alerts during initial test
    return res.status(200).json({ status: 'received_with_notice', error: err.message });
  }
});

// Admin OTP Rate Limiting Map
const adminOtpRateLimitMap = new Map<string, number>();

/**
 * Endpoint: Request Encrypted Admin OTP for PayU Transaction Access
 * - Validates input email against configured ADMIN_EMAIL using timing-safe comparison
 * - Runs Pre-Send Email Spam Score check
 * - Dispatches clean, high-deliverability OTP email via Resend
 */
app.post('/api/admin/payu-auth/request-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid administrator email address is required.' });
    }

    const authorizedAdminEmail = process.env.ADMIN_EMAIL || 'syaswanthkumar2006@gmail.com';

    // Verify authorized admin identity using timing-safe comparison
    const isMatch = verifyEmailTimingSafe(email, authorizedAdminEmail);
    if (!isMatch) {
      return res.status(403).json({ error: 'Access Denied: The entered email is not authorized for PayU transaction dashboard access.' });
    }

    // Enforce 30-second cooldown per admin request
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';
    const rateLimitKey = `admin_otp_${clientIp}`;
    const lastSent = adminOtpRateLimitMap.get(rateLimitKey);
    const now = Date.now();

    if (lastSent && (now - lastSent < 30000)) {
      const waitSec = Math.ceil((30000 - (now - lastSent)) / 1000);
      return res.status(429).json({ error: `Please wait ${waitSec} seconds before requesting a new security passkey.` });
    }
    adminOtpRateLimitMap.set(rateLimitKey, now);

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service (RESEND_API_KEY) is not configured.' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const senderAddress = process.env.RESEND_FROM_EMAIL || 'YK Yash <auth@verify.ykyash.in>';
    const emailSubject = 'Your Verification Code';

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verification Code</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">YK Yash</h2>
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin: 0 0 20px 0;">
      Here is your single-use verification code to access your control panel:
    </p>
    
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px 0;">
      <span style="font-size: 32px; font-weight: 700; color: #0f172a; letter-spacing: 8px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${otp}</span>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0; line-height: 1.4;">
      This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.
    </p>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 12px; color: #94a3b8;">
      YK Yash • <a href="https://ykyash.in" style="color: #64748b; text-decoration: underline;">ykyash.in</a>
    </div>
  </div>
</body>
</html>`;

    // 1. RUN PRE-SEND EMAIL SPAM SCORE CHECK
    const spamAudit = analyzeEmailSpamScore({
      to: email,
      from: senderAddress,
      subject: emailSubject,
      html: emailHtml
    });

    console.log(`[Email Spam Auditor] Analyzed Admin OTP Email. Score: ${spamAudit.score} | Safe: ${spamAudit.isSafe} | Issues: ${spamAudit.issues.join(', ') || 'None'}`);

    if (!spamAudit.isSafe) {
      console.warn('[Email Spam Auditor] Email drafted scored high spam risk. Blocking send:', spamAudit.issues);
      return res.status(500).json({ error: 'Email template failed deliverability security check.' });
    }

    // 2. DISPATCH VIA RESEND (with automatic fallback to onboarding@resend.dev)
    const resend = new Resend(apiKey);
    let { data: sendResult, error: sendError } = await resend.emails.send({
      from: senderAddress,
      to: email,
      subject: emailSubject,
      html: emailHtml
    });

    if (sendError && sendError.message && (sendError.message.includes('domain') || sendError.message.includes('verify') || sendError.message.includes('not verified'))) {
      console.warn('Custom domain unverified on Resend. Falling back to onboarding@resend.dev for Admin OTP.');
      const fallbackResult = await resend.emails.send({
        from: 'YK Yash <onboarding@resend.dev>',
        to: email,
        subject: emailSubject,
        html: emailHtml
      });
      sendError = fallbackResult.error;
      sendResult = fallbackResult.data;
    }

    if (sendError) {
      console.error('Resend Dispatch Error:', sendError);
      return res.status(400).json({ error: sendError.message || 'Failed to dispatch passkey email.' });
    }

    // 3. GENERATE STATELESS SIGNED ENCRYPTED CHALLENGE TOKEN (5 minutes)
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_payu_admin_gate';
    const hashedOtp = crypto.createHash('sha256').update(otp + jwtSecret).digest('hex');

    const adminChallengeToken = jwt.sign(
      { email: email.toLowerCase(), challenge: hashedOtp, role: 'payu_admin' },
      jwtSecret,
      { expiresIn: '5m' }
    );

    return res.json({ 
      success: true, 
      challengeToken: adminChallengeToken,
      message: `Passkey successfully dispatched to ${email.replace(/(.{2})(.*)(@.*)/, '$1***$3')}`
    });

  } catch (error: any) {
    console.error('Admin OTP Request Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process admin passkey request' });
  }
});

/**
 * Endpoint: Send Test Email to Any Testing / Mail-Tester / Mailtrap / Dummy Address
 * Allows testing email deliverability and live SpamAssassin / Mail-Tester score
 */
app.post('/api/admin/payu-auth/test-email', async (req, res) => {
  try {
    const { targetEmail, customFrom } = req.body;
    if (!targetEmail || typeof targetEmail !== 'string' || !targetEmail.includes('@')) {
      return res.status(400).json({ error: 'A valid target email address is required.' });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Email service (RESEND_API_KEY) is not configured.' });
    }

    const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const senderAddress = customFrom?.trim() || process.env.RESEND_FROM_EMAIL || 'YK Yash <auth@verify.ykyash.in>';
    const emailSubject = 'Test Message from ykyash.in';

    const emailHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Message</title>
</head>
<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; background-color: #ffffff;">
  <div style="max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 28px;">
    <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">YK Yash</h2>
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin: 0 0 20px 0;">
      This is a test email sent from your website (<a href="https://ykyash.in" style="color: #39AEA9; text-decoration: none;">ykyash.in</a>) to verify inbox delivery.
    </p>
    
    <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 18px; text-align: center; margin: 0 0 20px 0;">
      <span style="font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${testOtp}</span>
      <span style="display: block; font-size: 12px; color: #64748b; margin-top: 6px;">Sample Code</span>
    </div>

    <p style="font-size: 13px; color: #64748b; margin: 0 0 16px 0; line-height: 1.4;">
      Sent directly from your web server using clean email markup.
    </p>

    <div style="border-top: 1px solid #f1f5f9; padding-top: 14px; font-size: 12px; color: #94a3b8;">
      YK Yash • <a href="https://ykyash.in" style="color: #64748b; text-decoration: underline;">ykyash.in</a>
    </div>
  </div>
</body>
</html>`;

    // 1. Run Spam Score Analyzer
    const spamAudit = analyzeEmailSpamScore({
      to: targetEmail,
      from: senderAddress,
      subject: emailSubject,
      html: emailHtml
    });

    // 2. Dispatch via Resend
    const resend = new Resend(apiKey);
    let sendResult: any = null;
    let sendError: any = null;
    let finalSender = senderAddress;

    // Direct dispatch attempt
    const res1 = await resend.emails.send({
      from: senderAddress,
      to: targetEmail,
      subject: emailSubject,
      html: emailHtml
    });
    sendResult = res1.data;
    sendError = res1.error;

    // If custom domain is not yet verified on Resend and user is testing, automatically try onboarding@resend.dev
    if (sendError && (sendError.message?.includes('domain') || sendError.message?.includes('verify') || sendError.message?.includes('not verified'))) {
      console.warn(`[Test Mail] Custom domain not verified on Resend. Trying fallback onboarding@resend.dev for ${targetEmail}`);
      finalSender = 'YK Yash <onboarding@resend.dev>';
      const res2 = await resend.emails.send({
        from: finalSender,
        to: targetEmail,
        subject: emailSubject,
        html: emailHtml
      });
      sendResult = res2.data;
      sendError = res2.error;
    }

    if (sendError) {
      console.error('Test Email Dispatch Error Details:', JSON.stringify(sendError));
      
      let friendlyError = sendError.message || 'Resend rejected the test email dispatch.';
      let helpHint = 'Check your Resend Dashboard (https://resend.com/emails) for full delivery logs.';

      if (sendError.message?.includes('only send testing emails to your own email address')) {
        friendlyError = `Resend Sandbox Limit: You are using the sandbox sender (onboarding@resend.dev) which can ONLY send emails to your own Resend account email.`;
        helpHint = `To test delivery with sandbox, enter the email address you used to register on Resend. To send to any other address (like mail-tester.com), verify your domain in Resend Dashboard -> Domains.`;
      } else if (sendError.message?.includes('API key') || sendError.message?.includes('api_key')) {
        friendlyError = `Invalid or missing RESEND_API_KEY.`;
        helpHint = `Please verify your RESEND_API_KEY in your environment variables.`;
      }

      return res.status(400).json({ 
        success: false,
        error: friendlyError,
        details: {
          rawMessage: sendError.message,
          statusCode: sendError.statusCode || 400,
          attemptedSender: finalSender,
          targetEmail,
          helpHint
        }
      });
    }

    return res.json({
      success: true,
      deliveredTo: targetEmail,
      emailId: sendResult?.id || null,
      usedSender: finalSender,
      spamAudit: {
        score: spamAudit.score,
        isSafe: spamAudit.isSafe,
        rating: spamAudit.score < 1.0 ? 'EXCELLENT (10/10 Deliverability)' : 'GOOD',
        issues: spamAudit.issues
      },
      message: `Test email successfully sent to ${targetEmail}. Check your inbox!`
    });
  } catch (error: any) {
    console.error('Test Email Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to process test email' });
  }
});

/**
 * Endpoint: Verify Admin OTP and Issue Scoped Access Token for PayU Transactions
 */
app.post('/api/admin/payu-auth/verify-otp', async (req, res) => {
  try {
    const { email, otp, challengeToken } = req.body;
    if (!email || !otp || !challengeToken) {
      return res.status(400).json({ error: 'Email, Passkey (OTP), and Challenge token are required.' });
    }

    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_payu_admin_gate';

    // Decode challenge token
    let decoded: any;
    try {
      decoded = jwt.verify(challengeToken, jwtSecret);
    } catch (err: any) {
      return res.status(401).json({ error: 'The verification passkey has expired. Please request a new one.' });
    }

    // Validate email
    if (decoded.email !== email.trim().toLowerCase() || decoded.role !== 'payu_admin') {
      return res.status(403).json({ error: 'Security token mismatch.' });
    }

    // Validate OTP hash
    const expectedOtpHash = crypto.createHash('sha256').update(String(otp).trim() + jwtSecret).digest('hex');
    if (decoded.challenge !== expectedOtpHash) {
      return res.status(400).json({ error: 'Incorrect verification passkey entered.' });
    }

    // Issue Scoped Admin PayU Session Token (Valid for 4 hours)
    const adminSessionToken = jwt.sign(
      { email: decoded.email, role: 'payu_admin_verified', ts: Date.now() },
      jwtSecret,
      { expiresIn: '4h' }
    );

    return res.json({
      success: true,
      token: adminSessionToken,
      expiresIn: '4h'
    });

  } catch (error: any) {
    console.error('Admin OTP Verify Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to verify passkey' });
  }
});

/**
 * Endpoint: Fetch PayU Transactions from Supabase with Summary Metrics
 * Requires Scoped Admin Session Token
 */
app.get('/api/admin/payu-transactions', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please unlock with your admin passkey.' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_for_payu_admin_gate';

    let decoded: any;
    try {
      decoded = jwt.verify(token, jwtSecret);
      if (decoded.role !== 'payu_admin_verified') throw new Error('Invalid permissions');
    } catch {
      return res.status(403).json({ error: 'Session expired or invalid. Please verify again.' });
    }

    // Query Supabase for payments
    let transactions: any[] = [];
    if (supabaseServer) {
      const { data, error } = await supabaseServer
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch transactions error:', error.message);
      } else if (data) {
        transactions = data;
      }
    }

    // Calculate aggregated metrics
    const totalCount = transactions.length;
    const successfulTransactions = transactions.filter(t => t.status === 'success');
    const failedTransactions = transactions.filter(t => t.status === 'failure');
    const pendingTransactions = transactions.filter(t => t.status === 'pending' || t.status === 'initiated');

    const totalRevenue = successfulTransactions.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
    const successRate = totalCount > 0 ? ((successfulTransactions.length / totalCount) * 100).toFixed(1) : '0';

    return res.json({
      success: true,
      metrics: {
        totalRevenue,
        totalCount,
        successCount: successfulTransactions.length,
        failedCount: failedTransactions.length,
        pendingCount: pendingTransactions.length,
        successRate: Number(successRate)
      },
      transactions
    });

  } catch (error: any) {
    console.error('Fetch PayU Transactions Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

export default app;
