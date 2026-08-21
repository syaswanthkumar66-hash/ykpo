const fs = require('fs');
let code = fs.readFileSync('api/index.ts', 'utf8');

if (!code.includes("import crypto from 'crypto';")) {
    code = "import crypto from 'crypto';\n" + code;
}

const payuEndpoints = `
// PayU Hash Generation
app.post('/api/payu/hash', (req, res) => {
  try {
    const { txnid, amount, productinfo, firstname, email, udf1 = "", udf2 = "", udf3 = "", udf4 = "", udf5 = "", udf6 = "", udf7 = "", udf8 = "", udf9 = "", udf10 = "" } = req.body;
    const key = process.env.PAYU_MERCHANT_KEY;
    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!key || !salt) {
      return res.status(500).json({ error: 'PayU credentials not configured.' });
    }

    const hashString = \`\${key}|\${txnid}|\${amount}|\${productinfo}|\${firstname}|\${email}|\${udf1}|\${udf2}|\${udf3}|\${udf4}|\${udf5}|\${udf6}|\${udf7}|\${udf8}|\${udf9}|\${udf10}|\${salt}\`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');
    
    res.json({ hash, key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate hash' });
  }
});

app.post('/api/payu/success', express.urlencoded({ extended: true }), (req, res) => {
  res.redirect(\`/payment/success?txnid=\${req.body.txnid}&amount=\${req.body.amount}\`);
});

app.post('/api/payu/failure', express.urlencoded({ extended: true }), (req, res) => {
  res.redirect(\`/payment/failure?txnid=\${req.body.txnid}\`);
});
`;

if (!code.includes("/api/payu/hash")) {
    code = code.replace("export default app;", payuEndpoints + "\nexport default app;");
    fs.writeFileSync('api/index.ts', code);
}
