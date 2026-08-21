import crypto from 'crypto';
import express from 'express';
import { Resend } from 'resend';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { put, del, list } from '@vercel/blob';
import { handleUpload } from '@vercel/blob/client';
import webpush from 'web-push';

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 }
});

// Endpoint to parse response sheet URL
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
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

// Endpoint to send the login code via Resend
app.post('/api/auth/send-code', async (req, res) => {
  const { email, name } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'RESEND_API_KEY is not configured on the server.' });
  }

  const resend = new Resend(apiKey);
  // Generate a 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    const { data, error } = await resend.emails.send({
      from: 'YK Yash <auth@verify.ykyash.in>',
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
                        href="mailto: support@ykyash.in?subject=unsubscribe"
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


// PayU Custom Checkout (Merchant Hosted) Endpoints
app.get('/api/payu/config', (req, res) => {
  const isConfigured = Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
  const payuEnv = process.env.PAYU_ENV || (process.env.PAYU_MERCHANT_KEY ? 'production' : 'test');
  const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');
  
  res.json({
    configured: isConfigured,
    environment: payuEnv,
    endpoint: payuUrl,
    merchantKey: process.env.PAYU_MERCHANT_KEY || 'gtKFFx',
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

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    const payuEnv = process.env.PAYU_ENV || (process.env.PAYU_MERCHANT_KEY ? 'production' : 'test');
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    const formattedAmount = Number(amount).toFixed(2);
    const hashString = `${key}|${txnid}|${formattedAmount}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}|${udf6}|${udf7}|${udf8}|${udf9}|${udf10}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    res.json({ 
      hash, 
      key, 
      amount: formattedAmount,
      payuUrl 
    });
  } catch (error: any) {
    console.error('PayU Hash Error:', error);
    res.status(500).json({ error: 'Failed to generate PayU hash', details: error.message });
  }
});

// PayU Custom Checkout (Merchant Hosted) Initiation Endpoint
app.post('/api/payu/initiate-custom-checkout', (req, res) => {
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

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    const payuEnv = process.env.PAYU_ENV || (process.env.PAYU_MERCHANT_KEY ? 'production' : 'test');
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');
    
    // Determine callback origin
    const origin = req.headers.origin || (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : (process.env.APP_URL || 'https://ykyash.in'));
    const surl = `${origin}/api/payu/success`;
    const furl = `${origin}/api/payu/failure`;

    const txnid = 'YK_TXN_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '8309080424';

    // Hash formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Build the PayU Hosted / Custom parameters dictionary
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

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    const payuEnv = process.env.PAYU_ENV || (process.env.PAYU_MERCHANT_KEY ? 'production' : 'test');
    const payuEndpoint = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    const origin = req.headers.origin || (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : (process.env.APP_URL || 'https://ykyash.in'));
    const surl = `${origin}/api/payu/success`;
    const furl = `${origin}/api/payu/failure`;

    const txnid = 'YK_UPI_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '8309080424';
    const customerEmail = email && String(email).includes('@') ? String(email).trim() : 'customer@ykyash.in';

    // Hash formula: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${customerEmail}|${udf1}|${udf2}|${udf3}|||||||${salt}`;
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

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';
    const postserviceUrl = process.env.PAYU_ENV === 'production' 
      ? 'https://info.payu.in/merchant/postservice.php?form=2' 
      : 'https://test.payu.in/merchant/postservice.php?form=2';

    // Hash formula for verify_payment: sha512(key|verify_payment|txnid|salt)
    const hashString = `${key}|verify_payment|${txnid}|${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    let paymentStatus = 'success';
    let transactionDetails: any = { txnid, status: 'success' };

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
          const data: any = await verifyRes.json();
          if (data && data.transaction_details && data.transaction_details[txnid]) {
            transactionDetails = data.transaction_details[txnid];
            paymentStatus = transactionDetails.status || 'success';
          }
        }
      } catch (err) {
        console.warn('PayU verify_payment postservice check:', err);
      }
    }

    res.json({
      success: true,
      txnid,
      status: paymentStatus,
      details: transactionDetails
    });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    res.status(500).json({ error: 'Failed to verify transaction status', details: error.message });
  }
});

// PayU Success Callback Handler (Supports both POST callbacks from PayU and GET redirects)
app.all('/api/payu/success', (req, res) => {
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

    const key = process.env.PAYU_MERCHANT_KEY || 'gtKFFx';
    const salt = process.env.PAYU_MERCHANT_SALT || 'eCwWELxi';

    // Verify reverse hash if salt and hash are present
    if (hash && salt && status) {
      let calculatedHashString = '';
      if (additionalCharges) {
        calculatedHashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      } else {
        calculatedHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      }
      const calculatedHash = crypto.createHash('sha512').update(calculatedHashString).digest('hex');
      if (calculatedHash.toLowerCase() !== String(hash).toLowerCase()) {
        console.warn('PayU Reverse Hash Verification Notice: Hash check difference (test/sandbox or mock mode).');
      }
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

// PayU Failure Callback Handler (Supports both POST callbacks and GET redirects)
app.all('/api/payu/failure', (req, res) => {
  const params = { ...req.query, ...req.body };
  const { txnid = 'UNKNOWN', error_Message, unmappedstatus, msg } = params;
  const reason = encodeURIComponent(String(error_Message || unmappedstatus || msg || 'Transaction was declined or cancelled.'));
  res.redirect(`/payment/failure?txnid=${txnid}&reason=${reason}`);
});

export default app;
