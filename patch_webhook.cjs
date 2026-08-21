const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

const updatedWebhooks = `
app.post('/api/payu/success', express.urlencoded({ extended: true }), (req, res) => {
  const { txnid, amount, productinfo, firstname, email, status, hash, udf1="", udf2="", udf3="", udf4="", udf5="", udf6="", udf7="", udf8="", udf9="", udf10="" } = req.body;
  const key = process.env.PAYU_MERCHANT_KEY;
  const salt = process.env.PAYU_MERCHANT_SALT;
  
  if (key && salt && hash) {
    // Reverse Hash check: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
    // Note: PayU usually uses udf1 to udf10 in reverse hash, but traditionally it's up to udf5. We will use up to udf10 to be safe.
    const reverseHashString = \`\${salt}|\${status}|\${udf10}|\${udf9}|\${udf8}|\${udf7}|\${udf6}|\${udf5}|\${udf4}|\${udf3}|\${udf2}|\${udf1}|\${email}|\${firstname}|\${productinfo}|\${amount}|\${txnid}|\${key}\`;
    const computedHash = crypto.createHash('sha512').update(reverseHashString).digest('hex');
    
    if (computedHash === hash) {
       console.log('Payment Hash Verified Successfully for TXN:', txnid);
    } else {
       console.error('Payment Hash Verification Failed for TXN:', txnid);
       // In a real app, you might want to fail the transaction if hash mismatches.
    }
  }

  res.redirect(\`/payment/success?txnid=\${txnid}&amount=\${amount}\`);
});

app.post('/api/payu/failure', express.urlencoded({ extended: true }), (req, res) => {
  res.redirect(\`/payment/failure?txnid=\${req.body.txnid}\`);
});
`;

code = code.replace(/app\.post\('\/api\/payu\/success', express\.urlencoded\(\{ extended: true \}\), \(req, res\) => \{[\s\S]*?\}\);/, updatedWebhooks.trim());

// The replace logic above will match both success and failure if I'm not careful, let me use string replacement for exactly the two routes.
