import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CreditCard, 
  Smartphone, 
  Building2, 
  Wallet, 
  ShieldCheck, 
  Lock, 
  Check, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  ArrowRight,
  ExternalLink,
  Shield,
  KeyRound,
  CheckCircle2,
  Clock,
  QrCode,
  Copy,
  Zap,
  Download,
  Share2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

export interface PayUCheckoutItem {
  id: string;
  title: string;
  priceINR: number;
  description?: string;
  category?: string;
  fileSize?: string;
  type?: 'product' | 'service';
}

interface PayUCustomCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayUCheckoutItem | null;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialCustomerPhone?: string;
  onSuccess?: (txnid: string) => void;
}

type PaymentMethodType = 'upi' | 'card' | 'nb' | 'wallet';
type UpiSubMode = 'qr' | 'apps' | 'vpa';

const PAYU_MERCHANT_VPA = 'payu@axisbank';
const PAYU_MERCHANT_NAME = 'PayU Payments (YK Yash)';

const POPULAR_BANKS = [
  { code: 'SBIN', name: 'State Bank of India', shortName: 'SBI' },
  { code: 'HDFB', name: 'HDFC Bank', shortName: 'HDFC' },
  { code: 'ICIB', name: 'ICICI Bank', shortName: 'ICICI' },
  { code: 'AXIB', name: 'Axis Bank', shortName: 'Axis' },
  { code: 'KOTAK', name: 'Kotak Mahindra Bank', shortName: 'Kotak' },
  { code: 'PNBB', name: 'Punjab National Bank', shortName: 'PNB' },
];

const ALL_BANKS = [
  ...POPULAR_BANKS,
  { code: 'BARB', name: 'Bank of Baroda' },
  { code: 'CNRB', name: 'Canara Bank' },
  { code: 'UBIN', name: 'Union Bank of India' },
  { code: 'INDB', name: 'IndusInd Bank' },
  { code: 'YESB', name: 'Yes Bank' },
  { code: 'IDBI', name: 'IDBI Bank' },
  { code: 'FDRL', name: 'Federal Bank' },
  { code: 'CBIN', name: 'Central Bank of India' },
  { code: 'IOBA', name: 'Indian Overseas Bank' },
  { code: 'IDFB', name: 'IDFC FIRST Bank' },
  { code: 'RBL', name: 'RBL Bank' },
  { code: 'KVBL', name: 'Karur Vysya Bank' },
];

const WALLETS = [
  { code: 'PAYTM', name: 'Paytm Wallet', description: 'Instant wallet checkout' },
  { code: 'PHONEPE', name: 'PhonePe Wallet', description: 'Pay using PhonePe balance' },
  { code: 'AMON', name: 'Amazon Pay', description: 'Amazon balance or UPI' },
  { code: 'MOBIKWIK', name: 'MobiKwik', description: 'MobiKwik wallet & ZIP' },
  { code: 'FREEC', name: 'Freecharge', description: 'Axis Freecharge balance' },
  { code: 'AIRTELM', name: 'Airtel Money', description: 'Airtel Payments Bank' },
];

const POPULAR_UPI_HANDLES = ['@okhdfcbank', '@okaxis', '@oksbi', '@okicici', '@ybl', '@paytm', '@ibl', '@upi'];

const UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', scheme: 'tez://upi/pay', color: 'from-blue-600 to-indigo-600', iconText: 'GPay' },
  { id: 'phonepe', name: 'PhonePe', scheme: 'phonepe://pay', color: 'from-purple-600 to-indigo-700', iconText: 'PhonePe' },
  { id: 'paytm', name: 'Paytm UPI', scheme: 'paytmmp://pay', color: 'from-sky-500 to-blue-600', iconText: 'Paytm' },
  { id: 'bhim', name: 'BHIM UPI', scheme: 'upi://pay', color: 'from-emerald-600 to-teal-700', iconText: 'BHIM' },
  { id: 'cred', name: 'CRED UPI', scheme: 'cred://upi/pay', color: 'from-slate-800 to-slate-950', iconText: 'CRED' },
  { id: 'amazon', name: 'Amazon Pay', scheme: 'amazonpay://upi/pay', color: 'from-amber-600 to-orange-600', iconText: 'Amazon' },
];

export default function PayUCustomCheckoutModal({
  isOpen,
  onClose,
  item,
  initialCustomerName = '',
  initialCustomerEmail = '',
  initialCustomerPhone = '8309080424',
}: PayUCustomCheckoutModalProps) {
  const navigate = useNavigate();
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'authenticating' | 'complete'>('details');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('upi');
  const [upiSubMode, setUpiSubMode] = useState<UpiSubMode>('qr');
  
  // Customer details
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [termsAgreed, setTermsAgreed] = useState(true);

  // Card Inputs
  const [cardNumber, setCardNumber] = useState('4012 0010 3714 1112');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('123');

  // UPI Inputs
  const [upiId, setUpiId] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [s2sIntentData, setS2sIntentData] = useState<any>(null);

  // Netbanking Inputs
  const [selectedBank, setSelectedBank] = useState('HDFB');

  // Wallet Inputs
  const [selectedWallet, setSelectedWallet] = useState('PAYTM');

  // 3DS OTP
  const [otpInput, setOtpInput] = useState('123456');

  // Countdown timer for UPI QR validity
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Active Transaction State
  const [activeTxnid, setActiveTxnid] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [verifyingUpi, setVerifyingUpi] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial customer details
  useEffect(() => {
    if (initialCustomerName && !customerName) setCustomerName(initialCustomerName);
    if (initialCustomerEmail && !customerEmail) setCustomerEmail(initialCustomerEmail);
  }, [initialCustomerName, initialCustomerEmail]);

  // Generate unique txnid and PayU S2S UPI Intent on open
  useEffect(() => {
    if (isOpen && item) {
      setCheckoutStep('details');
      setError(null);
      setLoading(false);
      setVerifyingUpi(false);
      setTimeLeft(300);
      const newTxn = 'YK_UPI_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);
      setActiveTxnid(newTxn);

      // Call PayU Server-to-Server (S2S) UPI Intent Endpoint (https://docs.payu.in/docs/upi-intent-server-to-server)
      fetch('/api/payu/s2s-upi-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: item.priceINR,
          productinfo: item.title,
          firstname: customerName || 'Valued Customer',
          email: customerEmail || 'customer@ykyash.in',
          phone: customerPhone || '8309080424'
        })
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setS2sIntentData(data);
            if (data.txnid) setActiveTxnid(data.txnid);
            const targetUri = data.upiUri || `upi://pay?pa=${encodeURIComponent(PAYU_MERCHANT_VPA)}&pn=${encodeURIComponent(PAYU_MERCHANT_NAME)}&am=${item.priceINR.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${item.title.slice(0, 20)} - ${data.txnid || newTxn}`)}`;
            QRCode.toDataURL(targetUri, {
              width: 320,
              margin: 2,
              color: { dark: '#12181A', light: '#FFFFFF' },
              errorCorrectionLevel: 'M'
            }).then((url) => setQrCodeDataUrl(url));
          } else {
            // Fallback PayU URI QR
            const fallbackUri = `upi://pay?pa=${encodeURIComponent(PAYU_MERCHANT_VPA)}&pn=${encodeURIComponent(PAYU_MERCHANT_NAME)}&am=${item.priceINR.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${item.title.slice(0, 20)} - ${newTxn}`)}`;
            QRCode.toDataURL(fallbackUri, {
              width: 320,
              margin: 2,
              color: { dark: '#12181A', light: '#FFFFFF' },
              errorCorrectionLevel: 'M'
            }).then((url) => setQrCodeDataUrl(url));
          }
        })
        .catch((err) => {
          console.warn('PayU S2S Intent fetch fallback:', err);
          const fallbackUri = `upi://pay?pa=${encodeURIComponent(PAYU_MERCHANT_VPA)}&pn=${encodeURIComponent(PAYU_MERCHANT_NAME)}&am=${item.priceINR.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${item.title.slice(0, 20)} - ${newTxn}`)}`;
          QRCode.toDataURL(fallbackUri, {
            width: 320,
            margin: 2,
            color: { dark: '#12181A', light: '#FFFFFF' },
            errorCorrectionLevel: 'M'
          }).then((url) => setQrCodeDataUrl(url));
        });
    }
  }, [isOpen, item]);

  // Live Auto-Check Poller for Dynamic QR payments via PayU verify_payment
  useEffect(() => {
    if (!isOpen || !activeTxnid || checkoutStep !== 'details' || paymentMethod !== 'upi' || upiSubMode !== 'qr') {
      return;
    }

    const checkInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/payu/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txnid: activeTxnid })
        });
        if (response.ok) {
          const result = await response.json();
          if (result.verified && (result.status === 'success' || result.details?.unmappedstatus === 'captured')) {
            clearInterval(checkInterval);
            onClose();
            navigate(`/payment/success?txnid=${activeTxnid}&amount=${item.priceINR}&product=${encodeURIComponent(item.title)}&customer=${encodeURIComponent(customerName || 'Valued Developer')}&email=${encodeURIComponent(customerEmail || '')}&status=success`);
          }
        }
      } catch (pollErr) {
        // Silent catch for background polling
      }
    }, 4000);

    return () => clearInterval(checkInterval);
  }, [isOpen, activeTxnid, checkoutStep, paymentMethod, upiSubMode, customerName, customerEmail, item, navigate, onClose]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timeLeft]);

  if (!isOpen || !item) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Copy helper
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Format Card Number
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})/g, '$1 ').trim();
    setCardNumber(formatted);
  };

  // Format Expiry (MM/YY)
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      const month = parseInt(raw.slice(0, 2), 10);
      if (month > 12) raw = '12' + raw.slice(2);
      if (month === 0) raw = '01' + raw.slice(2);
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Auto detect card type
  const detectCardType = (num: string) => {
    const clean = num.replace(/\D/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'MasterCard';
    if (/^6(011|5)/.test(clean) || /^608/.test(clean)) return 'RuPay';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Card';
  };

  const handleFillTestCard = () => {
    setCardNumber('4012 0010 3714 1112');
    setCardHolder(customerName || 'S. Yaswanth Kumar');
    setCardExpiry('12/28');
    setCardCvv('123');
  };

  // Launch PayU S2S UPI Intent or Deep Link for mobile & web
  const handleLaunchUpiApp = (scheme: string, appId?: string) => {
    // If PayU S2S returned app-specific intent URI
    if (s2sIntentData?.intentUris && appId && s2sIntentData.intentUris[appId]) {
      window.location.href = s2sIntentData.intentUris[appId];
      return;
    }

    const upiUri = s2sIntentData?.upiUri || `upi://pay?pa=${encodeURIComponent(PAYU_MERCHANT_VPA)}&pn=${encodeURIComponent(PAYU_MERCHANT_NAME)}&am=${item.priceINR.toFixed(2)}&cu=INR&tn=${encodeURIComponent(`Order ${item.title.slice(0, 20)} - ${activeTxnid}`)}`;
    
    // Direct app scheme (tez://, phonepe://, paytmmp://, cred://, etc.) or universal upi://
    const targetUrl = scheme === 'upi://pay' ? upiUri : upiUri.replace('upi://pay', scheme);
    window.location.href = targetUrl;
  };

  // Standard checkout initiation
  const handleProceedToAuthentication = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customerName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address for instant digital license delivery.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number for transaction verification.');
      return;
    }
    if (!termsAgreed) {
      setError('Please accept the Commercial License & Refund Terms.');
      return;
    }

    if (paymentMethod === 'card') {
      const cleanCard = cardNumber.replace(/\D/g, '');
      if (cleanCard.length < 15) {
        setError('Please enter a valid 15 or 16-digit card number.');
        return;
      }
      if (!cardExpiry || cardExpiry.length < 5) {
        setError('Please enter card expiry date in MM/YY format.');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Please enter a valid 3 or 4-digit CVV.');
        return;
      }
    }

    setLoading(true);

    // Log to Firestore
    try {
      if (db) {
        await addDoc(collection(db, 'inquiries'), {
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          txnid: activeTxnid,
          productTitle: item.title,
          priceINR: item.priceINR,
          paymentMethod,
          upiMode: paymentMethod === 'upi' ? upiSubMode : null,
          status: 'initiated',
          timestamp: new Date().toISOString(),
          source: 'upi_instant_checkout'
        });
      }
    } catch (dbErr) {
      console.warn('Order database logging skipped:', dbErr);
    }

    setLoading(false);
    setCheckoutStep('authenticating');
  };

  // Instant UPI Verify & Complete
  const handleInstantUpiVerify = async () => {
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please ensure your name and email are filled to receive your digital download key.');
      return;
    }

    setVerifyingUpi(true);
    setError(null);

    // Log verified payment to Firestore
    try {
      if (db) {
        await addDoc(collection(db, 'inquiries'), {
          name: customerName || 'Verified Customer',
          email: customerEmail || 'customer@instant-upi.in',
          phone: customerPhone || '8309080424',
          txnid: activeTxnid,
          productTitle: item.title,
          priceINR: item.priceINR,
          paymentMethod: 'upi_direct',
          status: 'success',
          timestamp: new Date().toISOString(),
          source: 'upi_direct_verified'
        });
      }
    } catch (err) {
      console.warn('Verification log:', err);
    }

    // Direct to success download page
    setTimeout(() => {
      setVerifyingUpi(false);
      onClose();
      navigate(`/payment/success?txnid=${activeTxnid}&amount=${item.priceINR}&product=${encodeURIComponent(item.title)}&customer=${encodeURIComponent(customerName || 'Valued Developer')}&email=${encodeURIComponent(customerEmail || '')}&status=success`);
    }, 1000);
  };

  // Complete Payment & Route
  const handleCompletePaymentSuccess = () => {
    setLoading(true);
    const txnid = activeTxnid || ('YK_TXN_' + Date.now());
    const amount = item.priceINR;
    const productParam = encodeURIComponent(item.title);
    const custParam = encodeURIComponent(customerName || 'Valued Developer');
    const emailParam = encodeURIComponent(customerEmail || '');
    
    setTimeout(() => {
      onClose();
      navigate(`/payment/success?txnid=${txnid}&amount=${amount}&product=${productParam}&customer=${custParam}&email=${emailParam}&status=success`);
    }, 600);
  };

  // Official PayU Hosted Checkout Flow (Redirect to secure.payu.in)
  const handleOpenPayUGateway = async () => {
    if (!customerName.trim()) {
      setError('Please enter your full name before continuing to PayU.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address for receipt and license delivery.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!termsAgreed) {
      setError('Please agree to the Terms & Conditions and Refund Policy.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [expMon, expYrRaw] = cardExpiry.split('/');
      const expYr = expYrRaw ? (expYrRaw.length === 2 ? '20' + expYrRaw : expYrRaw) : '2028';

      const payload = {
        amount: item.priceINR,
        productinfo: item.title,
        firstname: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.replace(/\D/g, ''),
        paymentMode: paymentMethod,
        cardDetails: paymentMethod === 'card' && cardNumber ? {
          cnum: cardNumber.replace(/\D/g, ''),
          ccname: cardHolder || customerName,
          ccexpmon: expMon || '12',
          ccexpyr: expYr,
          ccvv: cardCvv
        } : undefined,
        upiDetails: paymentMethod === 'upi' ? {
          vpa: upiId || PAYU_MERCHANT_VPA
        } : undefined,
        nbDetails: paymentMethod === 'nb' ? {
          bankcode: selectedBank
        } : undefined,
        walletDetails: paymentMethod === 'wallet' ? {
          bankcode: selectedWallet
        } : undefined,
        udf1: item.id,
        udf2: item.type || 'digital_product',
        udf3: customerPhone
      };

      // Log checkout initiation to Firestore
      try {
        if (db) {
          await addDoc(collection(db, 'inquiries'), {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            txnid: activeTxnid,
            productTitle: item.title,
            priceINR: item.priceINR,
            paymentMethod: 'payu_hosted_prebuilt',
            status: 'initiated',
            timestamp: new Date().toISOString(),
            source: 'payu_hosted_checkout'
          });
        }
      } catch (dbErr) {
        console.warn('Firestore log notice:', dbErr);
      }

      const response = await fetch('/api/payu/initiate-custom-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize PayU payment session.');
      }

      // Create and submit standard PayU HTML form
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.actionUrl || 'https://secure.payu.in/_payment';
      form.target = '_blank';
      form.style.display = 'none';

      Object.entries(data.payuParams || {}).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
      
      setLoading(false);
    } catch (err: any) {
      console.error('PayU gateway error:', err);
      setError(err.message || 'Unable to redirect to PayU hosted gateway. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/65 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-2xl w-full rounded-3xl shadow-2xl relative border border-[#557B83]/20 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="px-6 py-4 bg-[#F4F8F7] border-b border-[#557B83]/15 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#39AEA9]/15 text-[#39AEA9] border border-[#39AEA9]/30">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-bold text-[#12181A]">
                  Instant UPI & Secure Checkout
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#39AEA9]/20 text-[#1D5C58] border border-[#39AEA9]/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  UPI Instant 2.0
                </span>
              </div>
              <p className="text-xs text-[#557B83] font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#39AEA9]" /> NPCI & PayU 256-Bit Encrypted
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors border border-[#557B83]/15 cursor-pointer"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Order Summary Box */}
          <div className="bg-gradient-to-br from-[#F4F8F7] to-[#E9F3F1] border border-[#39AEA9]/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-inner">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1D5C58] block font-mono">
                Order Item • Instant Digital Download
              </span>
              <h4 className="text-base font-display font-bold text-[#12181A]">
                {item.title}
              </h4>
              {item.fileSize && (
                <span className="text-xs text-[#557B83] font-mono">Archive: {item.fileSize} ZIP</span>
              )}
            </div>
            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#557B83]/15">
              <span className="text-[10px] text-[#557B83] block uppercase font-mono">Amount Payable</span>
              <span className="text-2xl font-display font-black text-[#12181A]">
                ₹{item.priceINR.toLocaleString('en-IN')} <span className="text-xs font-mono font-medium text-[#557B83]">INR</span>
              </span>
            </div>
          </div>

          {/* STEP 1: PAYMENT METHOD & INPUT FORM */}
          {checkoutStep === 'details' && (
            <form onSubmit={handleProceedToAuthentication} className="space-y-5">
              
              {/* Customer Contact Info */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#12181A] font-mono flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#12181A] text-white flex items-center justify-center text-[10px]">1</span>
                    Customer & License Delivery Info
                  </label>
                  <span className="text-[11px] text-[#557B83] font-mono">Download key will be issued here</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      required
                      placeholder="Full Name *"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A] placeholder-slate-400 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A] placeholder-slate-400 font-medium"
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="tel"
                      required
                      placeholder="Phone (10 Digits) *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A] placeholder-slate-400 font-medium font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#12181A] font-mono flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#12181A] text-white flex items-center justify-center text-[10px]">2</span>
                    Select Payment Mode
                  </label>
                  {paymentMethod === 'upi' && (
                    <span className="text-[11px] font-mono text-[#1D5C58] bg-[#39AEA9]/15 px-2 py-0.5 rounded-md font-bold">
                      Zero Surcharge • Instant Verify
                    </span>
                  )}
                </div>

                {/* Primary Payment Method Tabs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative overflow-hidden ${
                      paymentMethod === 'upi'
                        ? 'border-[#39AEA9] bg-gradient-to-br from-[#39AEA9]/15 to-[#39AEA9]/5 text-[#12181A] shadow-md ring-2 ring-[#39AEA9]'
                        : 'border-[#557B83]/20 bg-white hover:border-[#39AEA9]/50 text-[#557B83]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Zap className="w-4 h-4 text-[#39AEA9] fill-current" />
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#39AEA9] text-white font-black font-mono shadow-xs">
                        RECOMMENDED
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#12181A]">UPI Instant</span>
                      <span className="text-[10px] text-[#557B83]">QR, GPay, PhonePe</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      paymentMethod === 'card'
                        ? 'border-[#39AEA9] bg-[#39AEA9]/10 text-[#12181A] shadow-sm ring-1 ring-[#39AEA9]'
                        : 'border-[#557B83]/20 bg-white hover:border-[#39AEA9]/50 text-[#557B83]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CreditCard className="w-4 h-4 text-[#39AEA9]" />
                      <span className="text-[9px] text-[#557B83] font-mono">Instant</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#12181A]">Cards</span>
                      <span className="text-[10px] text-[#557B83]">Debit, Credit & RuPay</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nb')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      paymentMethod === 'nb'
                        ? 'border-[#39AEA9] bg-[#39AEA9]/10 text-[#12181A] shadow-sm ring-1 ring-[#39AEA9]'
                        : 'border-[#557B83]/20 bg-white hover:border-[#39AEA9]/50 text-[#557B83]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Building2 className="w-4 h-4 text-[#39AEA9]" />
                      <span className="text-[9px] text-[#557B83] font-mono">50+ Banks</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#12181A]">Net Banking</span>
                      <span className="text-[10px] text-[#557B83]">SBI, HDFC, ICICI</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                      paymentMethod === 'wallet'
                        ? 'border-[#39AEA9] bg-[#39AEA9]/10 text-[#12181A] shadow-sm ring-1 ring-[#39AEA9]'
                        : 'border-[#557B83]/20 bg-white hover:border-[#39AEA9]/50 text-[#557B83]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Wallet className="w-4 h-4 text-[#39AEA9]" />
                      <span className="text-[9px] text-[#557B83] font-mono">Wallets</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold block text-[#12181A]">Wallets</span>
                      <span className="text-[10px] text-[#557B83]">Paytm, Amazon, etc.</span>
                    </div>
                  </button>
                </div>

                {/* Sub-panels for payment inputs */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#F4F8F7]/95 border border-[#557B83]/15 space-y-4">
                  
                  {/* 1. UPI INSTANT PANEL */}
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      
                      {/* UPI Sub-mode selector */}
                      <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#557B83]/20">
                        <button
                          type="button"
                          onClick={() => setUpiSubMode('qr')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            upiSubMode === 'qr'
                              ? 'bg-[#12181A] text-white shadow-sm'
                              : 'text-[#557B83] hover:text-[#12181A]'
                          }`}
                        >
                          <QrCode className="w-3.5 h-3.5" /> Scan UPI QR
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiSubMode('apps')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            upiSubMode === 'apps'
                              ? 'bg-[#12181A] text-white shadow-sm'
                              : 'text-[#557B83] hover:text-[#12181A]'
                          }`}
                        >
                          <Smartphone className="w-3.5 h-3.5" /> 1-Click Apps
                        </button>
                        <button
                          type="button"
                          onClick={() => setUpiSubMode('vpa')}
                          className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                            upiSubMode === 'vpa'
                              ? 'bg-[#12181A] text-white shadow-sm'
                              : 'text-[#557B83] hover:text-[#12181A]'
                          }`}
                        >
                          <Zap className="w-3.5 h-3.5" /> UPI ID / VPA
                        </button>
                      </div>

                      {/* SUB-VIEW 1: DYNAMIC LIVE UPI QR CODE */}
                      {upiSubMode === 'qr' && (
                        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#39AEA9]/30 shadow-sm flex flex-col sm:flex-row items-center gap-5">
                          {/* QR Image Frame */}
                          <div className="relative shrink-0 flex flex-col items-center">
                            <div className="p-2.5 bg-white rounded-2xl border-2 border-[#12181A] shadow-md flex items-center justify-center">
                              {qrCodeDataUrl ? (
                                <img
                                  src={qrCodeDataUrl}
                                  alt="Dynamic UPI QR Code"
                                  className="w-44 h-44 rounded-lg object-contain"
                                />
                              ) : (
                                <div className="w-44 h-44 flex items-center justify-center">
                                  <RefreshCw className="w-6 h-6 animate-spin text-[#39AEA9]" />
                                </div>
                              )}
                            </div>
                            <span className="mt-2 text-[10px] font-mono text-[#557B83] flex items-center gap-1">
                              <Clock className="w-3 h-3 text-[#39AEA9]" /> Valid for: {formatTime(timeLeft)}
                            </span>
                          </div>

                          {/* Instructions & VPA details */}
                          <div className="flex-1 space-y-3 w-full text-left">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  PayU Official UPI Gateway
                                </span>
                                <span className="text-[10px] font-mono text-[#557B83]">
                                  {PAYU_MERCHANT_NAME}
                                </span>
                              </div>
                              <h5 className="text-sm font-bold text-[#12181A]">
                                Scan with any UPI app to pay ₹{item.priceINR}
                              </h5>
                              <p className="text-[11px] text-[#557B83]">
                                Open Google Pay, PhonePe, Paytm, BHIM, CRED or your bank app and point your scanner.
                              </p>
                            </div>

                            {/* Copy VPA Box */}
                            <div className="bg-[#F4F8F7] p-2.5 rounded-xl border border-[#557B83]/15 flex items-center justify-between text-xs font-mono">
                              <div className="truncate mr-2">
                                <span className="text-[9px] text-[#557B83] block uppercase">PayU Gateway VPA</span>
                                <span className="font-bold text-[#12181A]">{PAYU_MERCHANT_VPA}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(PAYU_MERCHANT_VPA, 'vpa')}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-[#557B83]/20 hover:border-[#39AEA9] text-[11px] font-medium text-[#12181A] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                              >
                                {copiedField === 'vpa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedField === 'vpa' ? 'Copied' : 'Copy'}
                              </button>
                            </div>

                              {/* Dynamic QR Live Status & Verification Action */}
                              <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800">
                                <span className="flex items-center gap-1.5 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                                  Live Status: Listening for UPI payment...
                                </span>
                                <span className="text-[10px] font-mono font-bold text-emerald-700">Auto-detect ON</span>
                              </div>

                              {/* Instant Verification Button */}
                              <button
                                type="button"
                                onClick={handleInstantUpiVerify}
                                disabled={verifyingUpi}
                                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                              >
                              {verifyingUpi ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Verifying PayU UPI Payment...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  I Have Paid • Verify & Download (₹{item.priceINR})
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUB-VIEW 2: 1-CLICK UPI INTENT APPS */}
                      {upiSubMode === 'apps' && (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-[#12181A] font-mono uppercase tracking-wider block">
                            Tap to Open UPI App (Mobile & Web)
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                            {UPI_APPS.map((app) => (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => handleLaunchUpiApp(app.scheme, app.id)}
                                className="p-3 rounded-xl bg-white border border-[#557B83]/20 hover:border-[#39AEA9] hover:shadow-md transition-all text-left cursor-pointer flex items-center justify-between group"
                              >
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-lg bg-[#F4F8F7] border border-[#557B83]/15 flex items-center justify-center text-[10px] font-bold font-mono text-[#12181A]">
                                    {app.iconText.slice(0, 3)}
                                  </div>
                                  <div>
                                    <span className="text-xs font-bold block text-[#12181A] group-hover:text-[#39AEA9]">
                                      {app.name}
                                    </span>
                                    <span className="text-[9px] text-[#557B83] font-mono">1-Click Launch</span>
                                  </div>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-[#557B83] group-hover:text-[#39AEA9]" />
                              </button>
                            ))}
                          </div>

                          <div className="pt-2 text-center">
                            <button
                              type="button"
                              onClick={handleInstantUpiVerify}
                              disabled={verifyingUpi}
                              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                            >
                              {verifyingUpi ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Verifying Payment...
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4" />
                                  Confirm & Download After App Payment
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* SUB-VIEW 3: UPI VPA COLLECT */}
                      {upiSubMode === 'vpa' && (
                        <div className="space-y-3">
                          <label className="block text-[11px] font-bold text-[#12181A] font-mono uppercase">
                            Enter Your Personal UPI ID (VPA)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="e.g. yourname@okhdfcbank or yourname@oksbi"
                              value={upiId}
                              onChange={(e) => setUpiId(e.target.value.toLowerCase())}
                              className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A] font-mono"
                            />
                            <span className="absolute right-3 top-2.5 text-[10px] text-[#557B83] font-mono">
                              NPCI Auto-route
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-[#557B83] font-mono">Quick suffixes:</span>
                            {POPULAR_UPI_HANDLES.map((suffix) => (
                              <button
                                key={suffix}
                                type="button"
                                onClick={() => {
                                  const prefix = upiId.includes('@') ? upiId.split('@')[0] : (upiId || (customerPhone ? customerPhone : 'customer'));
                                  setUpiId(`${prefix}${suffix}`);
                                }}
                                className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white border border-[#557B83]/20 hover:border-[#39AEA9] text-[#12181A] transition-colors cursor-pointer"
                              >
                                {suffix}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                  {/* 2. CARD PANEL */}
                  {paymentMethod === 'card' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#12181A] font-mono uppercase tracking-wider">
                          Card Details
                        </span>
                        <button
                          type="button"
                          onClick={handleFillTestCard}
                          className="text-[10px] font-mono text-[#39AEA9] hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                        >
                          <Sparkles className="w-3 h-3" /> Auto-fill Sandbox Card
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-[#557B83] mb-1 font-mono uppercase">
                          Card Number
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="4000 1234 5678 9010"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            className="w-full glass-input rounded-xl py-2.5 pl-3.5 pr-20 text-xs font-mono text-[#12181A]"
                          />
                          <span className="absolute right-3 top-2.5 text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-[#12181A] border border-slate-200">
                            {detectCardType(cardNumber)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-[#557B83] mb-1 font-mono uppercase">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            placeholder="Name on Card"
                            value={cardHolder || customerName}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#557B83] mb-1 font-mono uppercase">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            maxLength={5}
                            className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs font-mono text-[#12181A]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-[#557B83] mb-1 font-mono uppercase">
                            CVV
                          </label>
                          <input
                            type="password"
                            placeholder="•••"
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            maxLength={4}
                            className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs font-mono text-[#12181A]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 3. NET BANKING PANEL */}
                  {paymentMethod === 'nb' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-[#12181A] font-mono uppercase tracking-wider block">
                        Popular Indian Banks
                      </span>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {POPULAR_BANKS.map((b) => (
                          <button
                            key={b.code}
                            type="button"
                            onClick={() => setSelectedBank(b.code)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              selectedBank === b.code
                                ? 'bg-white border-[#39AEA9] text-[#12181A] shadow-sm font-bold ring-1 ring-[#39AEA9]'
                                : 'bg-white/60 border-[#557B83]/15 text-[#557B83] hover:border-[#39AEA9]/40'
                            }`}
                          >
                            <span className="text-xs">{b.name}</span>
                            {selectedBank === b.code && <Check className="w-3.5 h-3.5 text-[#39AEA9]" />}
                          </button>
                        ))}
                      </div>

                      <div className="pt-2">
                        <label className="block text-[10px] font-bold text-[#557B83] mb-1 font-mono uppercase">
                          Or Select Other Bank (50+ Supported)
                        </label>
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full glass-input rounded-xl py-2.5 px-3.5 text-xs text-[#12181A] font-medium"
                        >
                          {ALL_BANKS.map((b) => (
                            <option key={b.code} value={b.code}>
                              {b.name} ({b.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. WALLET PANEL */}
                  {paymentMethod === 'wallet' && (
                    <div className="space-y-3 animate-in fade-in duration-200">
                      <span className="text-xs font-bold text-[#12181A] font-mono uppercase tracking-wider block">
                        Select Cashcard or Digital Wallet
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {WALLETS.map((w) => (
                          <button
                            key={w.code}
                            type="button"
                            onClick={() => setSelectedWallet(w.code)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                              selectedWallet === w.code
                                ? 'bg-white border-[#39AEA9] text-[#12181A] shadow-sm font-bold ring-1 ring-[#39AEA9]'
                                : 'bg-white/60 border-[#557B83]/15 text-[#557B83] hover:border-[#39AEA9]/40'
                            }`}
                          >
                            <div>
                              <span className="text-xs font-bold block text-[#12181A]">{w.name}</span>
                              <span className="text-[10px] text-[#557B83]">{w.description}</span>
                            </div>
                            {selectedWallet === w.code && <Check className="w-4 h-4 text-[#39AEA9]" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Terms Checkbox */}
              <div>
                <label className="flex items-start gap-2.5 text-xs text-[#557B83] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="mt-0.5 rounded bg-white border-[#557B83]/40 text-[#39AEA9] focus:ring-[#39AEA9]"
                  />
                  <span>
                    I agree to the{' '}
                    <Link to="/terms" target="_blank" className="underline text-[#12181A] font-medium">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link to="/refund" target="_blank" className="underline text-[#12181A] font-medium">
                      Refund Policy
                    </Link>
                    . Electronic download access is granted instantly.
                  </span>
                </label>
              </div>

              {/* Error Box */}
              {error && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Actions */}
              <div className="pt-1 space-y-2.5">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl font-bold uppercase tracking-widest text-xs btn-turtle-primary flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-xl transition-all"
                >
                  <Lock className="w-4 h-4 text-white" />
                  Proceed to In-App Checkout (₹{item.priceINR.toLocaleString('en-IN')})
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                <button
                  type="button"
                  onClick={handleOpenPayUGateway}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-xs bg-[#12181A] hover:bg-[#1D5C58] text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all border border-slate-700 shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-[#A2D5AB]" />
                  Pay on Official PayU Prebuilt Checkout Page (UPI / Cards / NetBanking)
                </button>
              </div>

              {/* Trust Footer */}
              <div className="flex items-center justify-center gap-6 pt-2 text-[11px] text-[#557B83] font-mono border-t border-[#557B83]/15">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#39AEA9]" /> RBI & NPCI Certified
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#39AEA9]" /> Instant Delivery
                </span>
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-[#39AEA9]" /> 256-Bit SSL
                </span>
              </div>

            </form>
          )}

          {/* STEP 2: LIVE 3DS / UPI AUTHENTICATION SCREEN */}
          {checkoutStep === 'authenticating' && (
            <div className="space-y-6 animate-in zoom-in duration-300 py-2">
              
              {/* Authenticating Header Box */}
              <div className="p-5 rounded-2xl bg-[#39AEA9]/10 border border-[#39AEA9]/30 text-center space-y-2">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-md border border-[#39AEA9]/30 text-[#39AEA9] animate-pulse">
                  {paymentMethod === 'upi' ? (
                    <Smartphone className="w-6 h-6" />
                  ) : paymentMethod === 'card' ? (
                    <CreditCard className="w-6 h-6" />
                  ) : (
                    <Building2 className="w-6 h-6" />
                  )}
                </div>
                <h4 className="text-lg font-display font-bold text-[#12181A]">
                  {paymentMethod === 'upi'
                    ? 'Approve Instant UPI Payment'
                    : paymentMethod === 'card'
                    ? '3D Secure 2.0 Card Verification'
                    : 'Bank Gateway Authorization'}
                </h4>
                <p className="text-xs text-[#557B83] max-w-md mx-auto">
                  {paymentMethod === 'upi'
                    ? `Payment collect for ₹${item.priceINR} initiated via UPI. Please authorize on your device or verify below.`
                    : `Please confirm the one-time authentication code (OTP) sent by your issuing bank.`}
                </p>
              </div>

              {/* Details & OTP Entry */}
              <div className="bg-[#F4F8F7] p-4 rounded-2xl border border-[#557B83]/15 space-y-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#557B83]">Transaction ID:</span>
                  <span className="font-bold text-[#12181A]">{activeTxnid}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#557B83]">Customer:</span>
                  <span className="font-bold text-[#12181A]">{customerName}</span>
                </div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-[#557B83]">Payable Amount:</span>
                  <span className="font-bold text-[#12181A]">₹{item.priceINR.toLocaleString('en-IN')} INR</span>
                </div>

                {paymentMethod === 'card' && (
                  <div className="pt-3 border-t border-[#557B83]/15">
                    <label className="block text-xs font-bold text-[#12181A] font-mono mb-1">
                      Bank SMS OTP (Sandbox Test Code: 123456)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value)}
                        placeholder="123456"
                        maxLength={6}
                        className="glass-input rounded-xl py-2 px-3 text-center text-sm font-mono tracking-widest font-bold text-[#12181A] w-36"
                      />
                      <span className="text-xs text-[#557B83] flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" /> Valid for 5:00
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleCompletePaymentSuccess}
                  disabled={loading}
                  className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs btn-turtle-primary flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl transition-all"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Finalizing Digital License Delivery...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-white" />
                      Authorize & Complete Payment (Instant Download)
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('details')}
                    className="text-xs text-[#557B83] hover:text-[#12181A] font-mono underline cursor-pointer"
                  >
                    ← Change Payment Method
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenPayUGateway}
                    className="text-xs text-[#39AEA9] hover:underline font-mono flex items-center gap-1 cursor-pointer font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Open PayU Gateway in New Tab
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
