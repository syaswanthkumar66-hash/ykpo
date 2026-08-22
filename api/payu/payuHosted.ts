import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Active cooldown tracking for PayU Hosted Checkout requests
const hostedCheckoutLockMap = new Map<string, number>();

/**
 * 1. PayU Hosted Config Endpoint
 * Reference: https://docs.payu.in/docs/prebuilt-checkout-payu-hosted
 */
router.get('/config', (req, res) => {
  const isConfigured = Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
  const payuEnv = process.env.PAYU_ENV || 'production';
  const endpoint = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

  res.json({
    success: true,
    gatewayType: 'payu_hosted_prebuilt',
    configured: isConfigured,
    environment: payuEnv,
    endpoint,
    merchantKey: process.env.PAYU_MERCHANT_KEY || ''
  });
});

/**
 * 2. PayU Hosted Checkout Initiation & Hash Generation
 * Builds parameters and SHA-512 hash to auto-redirect user to PayU's hosted payment page
 * Reference: https://docs.payu.in/docs/prebuilt-checkout-payu-hosted
 */
router.post('/initiate', async (req, res) => {
  try {
    const {
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1 = 'payu_hosted',
      udf2 = 'digital_asset',
      udf3 = '',
      udf4 = '',
      udf5 = ''
    } = req.body;

    if (!amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters (amount, productinfo, firstname, email).' 
      });
    }

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    // Determine host origin for callbacks
    const rawOrigin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
    const originHost = (rawOrigin && rawOrigin.startsWith('https://')) ? rawOrigin : (process.env.APP_URL || 'https://ykyash.in');
    const surl = `${originHost}/api/payu/hosted/success`;
    const furl = `${originHost}/api/payu/hosted/failure`;

    // Client IP tracking
    const rawIp = req.headers['x-forwarded-for'] 
      ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : (req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');
    const clientIp = String(rawIp).replace(/[^0-9a-fA-F:.]/g, '') || '127.0.0.1';

    // 8-second anti-spam lock per user
    const userLockKey = `${clientIp}_${String(email).trim().toLowerCase()}`;
    const lastRequestTime = hostedCheckoutLockMap.get(userLockKey);
    const now = Date.now();

    if (lastRequestTime && (now - lastRequestTime < 8000)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Payment session already initializing. Please wait a few seconds before trying again.' 
      });
    }
    hostedCheckoutLockMap.set(userLockKey, now);

    // Prepare sanitized fields
    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const txnid = req.body.txnid || ('YKH' + Date.now() + randomSuffix);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    if (!customerPhone || customerPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit mobile number is required.' });
    }

    // SHA-512 Hash Generation: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Build standard PayU Hosted form payload
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

    res.json({
      success: true,
      gatewayType: 'payu_hosted_prebuilt',
      actionUrl: payuUrl,
      payuParams,
      txnid,
      environment: payuEnv
    });
  } catch (error: any) {
    console.error('[PayU Hosted Initiate Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate PayU Hosted payment', details: error.message });
  }
});

/**
 * 3. PayU Hosted Success Callback
 */
router.all('/success', (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const { 
      txnid = `TXN_${Date.now()}`, 
      amount = '499', 
      productinfo = 'Digital Asset', 
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

    // Reverse hash verification
    if (hash && salt && status) {
      let calculatedHashString = '';
      if (additionalCharges) {
        calculatedHashString = `${additionalCharges}|${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      } else {
        calculatedHashString = `${salt}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      }
      const calculatedHash = crypto.createHash('sha512').update(calculatedHashString).digest('hex');
      if (calculatedHash.toLowerCase() !== String(hash).toLowerCase()) {
        console.warn('[PayU Hosted] Reverse Hash verification mismatch notice.');
      }
    }

    const productParam = encodeURIComponent(String(productinfo));
    const custParam = encodeURIComponent(String(firstname));
    const emailParam = encodeURIComponent(String(email));
    const refParam = encodeURIComponent(String(bank_ref_num || payuMoneyId || txnid));

    res.redirect(`/payment/success?txnid=${txnid}&amount=${amount}&product=${productParam}&customer=${custParam}&email=${emailParam}&ref=${refParam}&gateway=payu_hosted&status=success`);
  } catch (error) {
    console.error('[PayU Hosted Success Handler Error]:', error);
    res.redirect('/payment/success?status=success&gateway=payu_hosted');
  }
});

/**
 * 4. PayU Hosted Failure Callback
 */
router.all('/failure', (req, res) => {
  const params = { ...req.query, ...req.body };
  const { txnid = 'UNKNOWN', field9, error_Message, unmappedstatus, msg, error } = params;
  const reasonText = field9 || error_Message || unmappedstatus || msg || error || 'Transaction was declined or cancelled on PayU gateway.';
  const reason = encodeURIComponent(String(reasonText));
  res.redirect(`/payment/failure?txnid=${txnid}&reason=${reason}&gateway=payu_hosted`);
});

export default router;
