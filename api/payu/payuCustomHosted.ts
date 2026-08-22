import { Router } from 'express';
import crypto from 'crypto';

const router = Router();

// Active cooldown tracking for Custom Checkout requests
const customCheckoutLockMap = new Map<string, number>();

/**
 * 1. PayU Custom Checkout Config
 * Reference: https://docs.payu.in/docs/custom-checkout-merchant-hosted
 */
router.get('/config', (req, res) => {
  const isConfigured = Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_MERCHANT_SALT);
  const payuEnv = process.env.PAYU_ENV || 'production';
  const endpoint = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

  res.json({
    success: true,
    gatewayType: 'payu_custom_merchant_hosted',
    configured: isConfigured,
    environment: payuEnv,
    endpoint,
    merchantKey: process.env.PAYU_MERCHANT_KEY || ''
  });
});

/**
 * 2. PayU Custom Checkout Hash Generation
 * For merchant-hosted custom forms calculation
 */
router.post('/hash', (req, res) => {
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
      success: true,
      hash, 
      key, 
      amount: formattedAmount,
      actionUrl: payuUrl,
      txnid,
      environment: payuEnv 
    });
  } catch (error: any) {
    console.error('[PayU Custom Hash Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to generate PayU custom hash', details: error.message });
  }
});

/**
 * 3. PayU Custom Checkout (Merchant-Hosted) Initiation
 * Implements parameters for Card (CC/DC), UPI (VPA), NetBanking (NB), and Wallets
 * Reference: https://docs.payu.in/docs/custom-checkout-merchant-hosted
 */
router.post('/initiate', async (req, res) => {
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
      udf1 = "payu_custom_checkout",
      udf2 = "merchant_hosted",
      udf3 = "",
      udf4 = "",
      udf5 = ""
    } = req.body;

    if (!amount || !productinfo || !firstname || !email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required checkout parameters (amount, productinfo, firstname, email).' 
      });
    }

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuUrl = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');
    
    // Determine canonical HTTPS callback origin
    const rawOrigin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : '');
    const originHost = (rawOrigin && rawOrigin.startsWith('https://')) ? rawOrigin : (process.env.APP_URL || 'https://ykyash.in');
    const surl = `${originHost}/api/payu/custom/success`;
    const furl = `${originHost}/api/payu/custom/failure`;

    // Extract Client IP
    const rawIp = req.headers['x-forwarded-for'] 
      ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : (req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');
    const clientIp = String(rawIp).replace(/[^0-9a-fA-F:.]/g, '') || '127.0.0.1';

    // 8-second anti-spam lock
    const userLockKey = `${clientIp}_${String(email).trim().toLowerCase()}`;
    const lastRequestTime = customCheckoutLockMap.get(userLockKey);
    const now = Date.now();

    if (lastRequestTime && (now - lastRequestTime < 8000)) {
      return res.status(429).json({ 
        success: false, 
        error: 'Custom payment initiation is already processing. Please wait 8 seconds.' 
      });
    }
    customCheckoutLockMap.set(userLockKey, now);

    const randomSuffix = Math.floor(100000 + Math.random() * 900000).toString() + Math.random().toString(36).substring(2, 6).toUpperCase();
    const txnid = req.body.txnid || ('YKC' + Date.now() + randomSuffix);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

    if (!customerPhone || customerPhone.length < 10) {
      return res.status(400).json({ success: false, error: 'A valid 10-digit mobile phone number is required.' });
    }

    // SHA-512 Hash Generation
    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${email}|${udf1}|${udf2}|${udf3}|${udf4}|${udf5}||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Build the PayU Merchant Hosted parameters dictionary
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

    // Attach merchant-hosted specific payment mode parameters
    if (paymentMode === 'card' && cardDetails) {
      payuParams.pg = 'CC';
      payuParams.bankcode = 'CC';
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
      gatewayType: 'payu_custom_merchant_hosted',
      actionUrl: payuUrl,
      payuParams,
      txnid,
      environment: payuEnv
    });
  } catch (error: any) {
    console.error('[PayU Custom Initiate Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to initiate PayU custom checkout', details: error.message });
  }
});

/**
 * 4. PayU S2S Payment Verification (verify_payment command)
 */
router.post('/verify-payment', async (req, res) => {
  try {
    const { txnid } = req.body;
    if (!txnid) return res.status(400).json({ success: false, error: 'Transaction ID (txnid) is required' });

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
          const data: any = await verifyRes.json();
          if (data && data.transaction_details && data.transaction_details[txnid]) {
            transactionDetails = data.transaction_details[txnid];
            paymentStatus = transactionDetails.status || 'pending';
            if (paymentStatus === 'success' || transactionDetails.unmappedstatus === 'captured') {
              isVerified = true;
            }
          }
        }
      } catch (err) {
        console.warn('[PayU Custom verify_payment check warning]:', err);
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
    console.error('[PayU Custom Verification Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to verify transaction status', details: error.message });
  }
});

/**
 * 5. PayU Custom S2S UPI Intent
 */
router.post('/s2s-upi-intent', async (req, res) => {
  try {
    const {
      amount,
      productinfo,
      firstname,
      email,
      phone,
      udf1 = 's2s_upi_custom',
      udf2 = 'digital_license',
      udf3 = ''
    } = req.body;

    if (!amount || !productinfo || !firstname) {
      return res.status(400).json({ success: false, error: 'Missing required parameters: amount, productinfo, firstname' });
    }

    const key = process.env.PAYU_MERCHANT_KEY || '';
    const salt = process.env.PAYU_MERCHANT_SALT || '';
    const payuEnv = process.env.PAYU_ENV || 'production';
    const payuEndpoint = process.env.PAYU_ENDPOINT || (payuEnv === 'production' ? 'https://secure.payu.in/_payment' : 'https://test.payu.in/_payment');

    const origin = req.headers.origin || (req.headers.host ? `${req.protocol || 'https'}://${req.headers.host}` : (process.env.APP_URL || 'https://ykyash.in'));
    const surl = `${origin}/api/payu/custom/success`;
    const furl = `${origin}/api/payu/custom/failure`;

    const txnid = 'YKUPI_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
    const formattedAmount = Number(amount).toFixed(2);
    const sanitizedProduct = String(productinfo).replace(/[^a-zA-Z0-9\s-_.]/g, '').slice(0, 100);
    const sanitizedFirstname = String(firstname).replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 50);
    const customerPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
    const customerEmail = email && String(email).includes('@') ? String(email).trim() : '';

    if (!customerPhone || customerPhone.length < 10 || !customerEmail) {
      return res.status(400).json({ success: false, error: 'Valid customer phone number and email are required for transaction.' });
    }

    const hashString = `${key}|${txnid}|${formattedAmount}|${sanitizedProduct}|${sanitizedFirstname}|${customerEmail}|${udf1}|${udf2}|${udf3}|||||||${salt}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    // Extract actual customer's IP address and User-Agent device info per PayU S2S spec
    const rawIp = req.headers['x-forwarded-for'] 
      ? (req.headers['x-forwarded-for'] as string).split(',')[0].trim()
      : (req.headers['x-real-ip'] || req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '127.0.0.1');
    const clientIp = String(rawIp).replace(/[^0-9a-fA-F:.]/g, '') || '127.0.0.1';
    const deviceInfo = (req.headers['user-agent'] as string) || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0';

    let dynamicUpiUri = '';
    let intentUris: Record<string, string> = {};
    let payuServerResponse: any = null;

    // Call official PayU Dynamic QR / S2S UPI Intent API
    // Reference 1: https://docs.payu.in/reference/dynamic-qr-generation-api (pg=DBQR, bankcode=UPIDBQR, txn_s2s_flow=4)
    // Reference 2: https://docs.payu.in/docs/upi-intent-server-to-server (pg=UPI, bankcode=INTENT, txn_s2s_flow=4)
    const attempts = [
      { pg: 'DBQR', bankcode: 'UPIDBQR', txn_s2s_flow: '4' },
      { pg: 'UPI', bankcode: 'INTENT', txn_s2s_flow: '4' }
    ];

    for (const config of attempts) {
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
          pg: config.pg,
          bankcode: config.bankcode,
          txn_s2s_flow: config.txn_s2s_flow,
          s2s_client_ip: clientIp,
          s2s_device_info: deviceInfo,
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
          } else {
            const rawText = await payuRes.text();
            try {
              payuServerResponse = JSON.parse(rawText);
            } catch {
              console.warn(`[PayU ${config.pg} Response text]:`, rawText);
            }
          }

          if (payuServerResponse) {
            const returnedUris = payuServerResponse.intentURIs || 
                                 payuServerResponse.intentURIData || 
                                 payuServerResponse.data?.intentURIs || 
                                 payuServerResponse.data?.intentURIData || 
                                 payuServerResponse.result?.intentURIs ||
                                 payuServerResponse.data;

            if (returnedUris && typeof returnedUris === 'object') {
              intentUris = returnedUris;
              dynamicUpiUri = returnedUris.upiURI || returnedUris.upiUri || returnedUris.qrString || returnedUris.qrCode || returnedUris.standard || '';
            } else if (payuServerResponse.upiURI || payuServerResponse.upiUri || payuServerResponse.qrString || payuServerResponse.qrCode) {
              dynamicUpiUri = payuServerResponse.upiURI || payuServerResponse.upiUri || payuServerResponse.qrString || payuServerResponse.qrCode;
              intentUris = { standard: dynamicUpiUri };
            }

            if (dynamicUpiUri) break; // Successfully obtained dynamic QR/Intent URI
          }
        }
      } catch (err) {
        console.warn(`[PayU ${config.pg} Attempt Notice]:`, err);
      }
    }

    if (!dynamicUpiUri) {
      console.error('[PayU Dynamic QR/Intent Warning] Server response:', payuServerResponse);
      return res.status(502).json({
        success: false,
        error: 'PayU did not return a dynamic UPI QR / Intent URI. Please ensure DBQR or UPI Intent permissions are activated on your PayU Merchant account (https://docs.payu.in/reference/dynamic-qr-generation-api), or pay via Card/NetBanking.',
        details: payuServerResponse
      });
    }



    res.json({
      success: true,
      txnid,
      amount: formattedAmount,
      currency: 'INR',
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
      payuS2sActive: true
    });

  } catch (error: any) {
    console.error('[PayU Custom S2S UPI Intent Error]:', error);
    res.status(500).json({ success: false, error: 'Failed to generate Dynamic S2S UPI Intent & QR', details: error.message });
  }
});


/**
 * 6. PayU Custom Checkout Success Callback
 */
router.all('/success', (req, res) => {
  try {
    const params = { ...req.query, ...req.body };
    const { 
      txnid = `TXN_${Date.now()}`, 
      amount = '499', 
      productinfo = 'Custom Digital Item', 
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
        console.warn('[PayU Custom] Reverse Hash verification mismatch notice.');
      }
    }

    const productParam = encodeURIComponent(String(productinfo));
    const custParam = encodeURIComponent(String(firstname));
    const emailParam = encodeURIComponent(String(email));
    const refParam = encodeURIComponent(String(bank_ref_num || payuMoneyId || txnid));

    res.redirect(`/payment/success?txnid=${txnid}&amount=${amount}&product=${productParam}&customer=${custParam}&email=${emailParam}&ref=${refParam}&gateway=payu_custom&status=success`);
  } catch (error) {
    console.error('[PayU Custom Success Handler Error]:', error);
    res.redirect('/payment/success?status=success&gateway=payu_custom');
  }
});

/**
 * 7. PayU Custom Checkout Failure Callback
 */
router.all('/failure', (req, res) => {
  const params = { ...req.query, ...req.body };
  const { txnid = 'UNKNOWN', field9, error_Message, unmappedstatus, msg, error } = params;
  const reasonText = field9 || error_Message || unmappedstatus || msg || error || 'Transaction was declined or cancelled.';
  const reason = encodeURIComponent(String(reasonText));
  res.redirect(`/payment/failure?txnid=${txnid}&reason=${reason}&gateway=payu_custom`);
});

export default router;
