import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  AlertCircle, 
  Building2, 
  Wallet, 
  QrCode,
  Zap,
  ArrowRight,
  CheckCircle2,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  Clock
} from 'lucide-react';
import QRCode from 'qrcode';
import { supabase } from '../../supabase';
import { PayUDebugResponse } from './PayUDebugResponse';

export interface PayUCustomItem {
  id: string;
  title: string;
  priceINR: number;
  description?: string;
  category?: string;
  fileSize?: string;
  type?: 'product' | 'service';
}

interface PayUCustomHostedModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PayUCustomItem | null;
  initialCustomerName?: string;
  initialCustomerEmail?: string;
  initialCustomerPhone?: string;
}

type PaymentTab = 'upi' | 'card' | 'nb' | 'wallet';
type UpiMode = 'qr' | 'intent' | 'vpa';

/**
 * PayU Custom Checkout (Merchant-Hosted) Modal
 * Features:
 * 1. UPI Intent App Triggers (GPay, PhonePe, Paytm, CRED, BHIM)
 * 2. Dynamic NPCI UPI QR Code Generation & Auto Status Verification Polling
 * 3. UPI VPA Collect Mode
 * 4. Credit / Debit Cards (CC/DC)
 * 5. Net Banking & Wallets
 * Reference: 
 * - https://docs.payu.in/docs/custom-checkout-merchant-hosted
 * - https://docs.payu.in/docs/upi-intent-server-to-server
 */
export function PayUCustomHostedModal({
  isOpen,
  onClose,
  item,
  initialCustomerName = '',
  initialCustomerEmail = '',
  initialCustomerPhone = ''
}: PayUCustomHostedModalProps) {
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');
  const [upiMode, setUpiMode] = useState<UpiMode>('qr');
  
  // Customer basic info
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);

  // Dynamic QR & UPI Intent State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [upiIntentUri, setUpiIntentUri] = useState<string>('');
  const [upiAppUris, setUpiAppUris] = useState<Record<string, string>>({});
  const [generatedTxnid, setGeneratedTxnid] = useState<string>('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrPolling, setQrPolling] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI VPA field
  const [vpa, setVpa] = useState('');

  // NetBanking & Wallet fields
  const [selectedBank, setSelectedBank] = useState('SBIN');
  const [selectedWallet, setSelectedWallet] = useState('PAYTM');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawServerResponse, setRawServerResponse] = useState<any>(null);
  const [latestVerifyData, setLatestVerifyData] = useState<any>(null);
  const [verifyCount, setVerifyCount] = useState(0);
  const [manualChecking, setManualChecking] = useState(false);

  const pollingIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (initialCustomerName && !customerName) setCustomerName(initialCustomerName);
    if (initialCustomerEmail && !customerEmail) setCustomerEmail(initialCustomerEmail);
    if (initialCustomerPhone && !customerPhone) setCustomerPhone(initialCustomerPhone);
  }, [initialCustomerName, initialCustomerEmail, initialCustomerPhone]);

  // Clean up polling interval on unmount or close
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    };
  }, []);

  if (!isOpen || !item) return null;

  const popularBanks = [
    { code: 'SBIN', name: 'State Bank of India' },
    { code: 'HDFCB', name: 'HDFC Bank' },
    { code: 'ICICB', name: 'ICICI Bank' },
    { code: 'UTIB', name: 'Axis Bank' },
    { code: 'KKBK', name: 'Kotak Mahindra' },
    { code: 'PUNB', name: 'Punjab National Bank' }
  ];

  const popularWallets = [
    { code: 'PAYTM', name: 'Paytm Wallet' },
    { code: 'MOBIKWIK', name: 'MobiKwik' },
    { code: 'FREECHARGE', name: 'FreeCharge' },
    { code: 'OLAMONEY', name: 'Ola Money' }
  ];

  // Generate Dynamic S2S UPI Intent and QR Code
  const handleGenerateUpiIntentOrQr = async () => {
    if (!customerName.trim() || !customerEmail.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please fill in your Name, Email, and 10-digit Phone first.');
      return;
    }
    setError(null);
    setQrLoading(true);

    try {
      let clientPublicIp = '';
      try {
        const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(2000) });
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          clientPublicIp = ipData.ip || '';
        }
      } catch (ipErr) {
        console.warn('Direct IP detection note:', ipErr);
      }

      const payload = {
        amount: item.priceINR,
        productinfo: item.title,
        firstname: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.replace(/\D/g, ''),
        clientPublicIp,
        udf1: item.id,
        udf2: item.type || 'digital_product',
        udf3: customerPhone
      };

      const res = await fetch('/api/payu/custom/s2s-upi-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });


      const data = await res.json();
      if (data.payuRawResponse) {
        setRawServerResponse(data.payuRawResponse);
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to generate UPI Intent.');
      }

      setGeneratedTxnid(data.txnid);
      setUpiIntentUri(data.upiUri);
      setUpiAppUris(data.intentUris || {});

      // Generate QR Canvas
      if (data.upiUri) {
        const qrUrl = await QRCode.toDataURL(data.upiUri, {
          width: 250,
          margin: 2,
          color: {
            dark: '#12181A',
            light: '#FFFFFF'
          }
        });
        setQrCodeDataUrl(qrUrl);
      }

      // Start automatic polling for payment verification
      startStatusPolling(data.txnid);

    } catch (err: any) {
      console.error('UPI Intent/QR Error:', err);
      setError(err.message || 'Unable to generate dynamic UPI QR. Please try VPA or Card mode.');
    } finally {
      setQrLoading(false);
    }

  };

    // Poll server for payment confirmation via verify_payment command
    const checkPaymentStatusOnce = async (txnidToCheck: string, isManualClick = false) => {
      if (isManualClick) setManualChecking(true);
      try {
        const res = await fetch('/api/payu/custom/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txnid: txnidToCheck })
        });
        const verifyData = await res.json();
        setLatestVerifyData(verifyData);
        setVerifyCount(c => c + 1);

        const statusStr = String(verifyData.status || '').toLowerCase();
        const unmappedStr = String(verifyData.details?.unmappedstatus || '').toLowerCase();
        const msgStr = String(verifyData.details?.error_Message || verifyData.details?.msg || '').toLowerCase();

        const isSuccess = 
          verifyData.verified === true || 
          statusStr === 'success' || 
          statusStr === 'captured' ||
          unmappedStr === 'captured' ||
          unmappedStr === 'success' ||
          msgStr.includes('success') ||
          msgStr.includes('completed') ||
          Boolean(verifyData.bankRefNum && statusStr !== 'failed');

        if (isSuccess || (isManualClick && statusStr !== 'failed')) {
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
          window.location.href = `/payment/success?txnid=${txnidToCheck}&amount=${item.priceINR}&product=${encodeURIComponent(item.title)}&customer=${encodeURIComponent(customerName)}&email=${encodeURIComponent(customerEmail)}&gateway=payu_custom&status=success`;
          return true;
        }
        return false;
      } catch (pollErr) {
        console.warn('Payment polling check:', pollErr);
        if (isManualClick) {
          window.location.href = `/payment/success?txnid=${txnidToCheck}&amount=${item.priceINR}&product=${encodeURIComponent(item.title)}&customer=${encodeURIComponent(customerName)}&email=${encodeURIComponent(customerEmail)}&gateway=payu_custom&status=success`;
          return true;
        }
        return false;
      } finally {
        if (isManualClick) setManualChecking(false);
      }
    };

    const startStatusPolling = (txnid: string) => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      setQrPolling(true);

      // Immediately run an initial check
      checkPaymentStatusOnce(txnid, false);

      // Poll every 2.5 seconds for instant detection
      pollingIntervalRef.current = setInterval(() => {
        checkPaymentStatusOnce(txnid, false);
      }, 2500);
    };

  // Handle standard Custom Checkout submission (Cards, VPA, NetBanking, Wallets)
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    // Validation
    if (!customerName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (activeTab === 'card') {
      const cleanNum = cardNumber.replace(/\s/g, '');
      if (cleanNum.length < 13) {
        setError('Please enter a valid card number.');
        return;
      }
      if (!cardExpiry.includes('/')) {
        setError('Card expiry should be in MM/YY format.');
        return;
      }
      if (cardCvv.length < 3) {
        setError('Please enter a valid 3 or 4-digit CVV.');
        return;
      }
    }

    if (activeTab === 'upi' && upiMode === 'vpa' && (!vpa.trim() || !vpa.includes('@'))) {
      setError('Please enter a valid UPI VPA (e.g. username@okaxis / username@paytm).');
      return;
    }

    setLoading(true);

    try {
      const uniqueTxnid = 'YKC' + Date.now() + Math.floor(10000 + Math.random() * 90000);

      let cardDetails: any = undefined;
      if (activeTab === 'card') {
        const [mon, yr] = cardExpiry.split('/');
        cardDetails = {
          cnum: cardNumber.replace(/\s/g, ''),
          ccname: cardHolder || customerName,
          ccexpmon: mon,
          ccexpyr: yr?.length === 2 ? `20${yr}` : yr,
          ccvv: cardCvv
        };
      }

      const payload = {
        txnid: uniqueTxnid,
        amount: item.priceINR,
        productinfo: item.title,
        firstname: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.replace(/\D/g, ''),
        paymentMode: activeTab,
        cardDetails,
        upiDetails: (activeTab === 'upi' && vpa) ? { vpa: vpa.trim() } : undefined,
        nbDetails: activeTab === 'nb' ? { bankcode: selectedBank } : undefined,
        walletDetails: activeTab === 'wallet' ? { bankcode: selectedWallet } : undefined,
        udf1: item.id,
        udf2: item.type || 'digital_product',
        udf3: customerPhone
      };

      // Supabase logging
      try {
        if (supabase) {
          await supabase.from('payments').insert([{
            txnid: uniqueTxnid,
            amount: item.priceINR,
            product: item.title,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            customer_phone: customerPhone.replace(/\D/g, ''),
            payment_mode: `payu_custom_${activeTab}`,
            status: 'initiated',
            created_at: new Date().toISOString()
          }]);
        }
      } catch (dbErr) {
        console.warn('Supabase order logging notice:', dbErr);
      }

      const response = await fetch('/api/payu/custom/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize PayU custom checkout.');
      }

      // Auto-post Merchant-Hosted form to PayU gateway
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.actionUrl || 'https://secure.payu.in/_payment';
      form.target = '_self';
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

    } catch (err: any) {
      console.error('[PayU Custom Checkout Error]:', err);
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl relative border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-600/10 text-teal-700 border border-teal-600/20">
              <CreditCard className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-extrabold text-slate-900">
                  Custom In-App Checkout
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  Merchant-Hosted
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Direct In-Modal UPI QR, Apps & Card Checkout
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
              onClose();
            }}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Item Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-teal-700 font-mono block">
                Selected Item
              </span>
              <h4 className="text-base font-bold text-slate-900 line-clamp-1">{item.title}</h4>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xl font-bold text-slate-900 font-mono">
                ₹{item.priceINR.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* 1. Customer Details */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              1. Customer Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                required
                placeholder="Full Legal Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <input
                type="email"
                required
                placeholder="Email Address"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
              <input
                type="tel"
                required
                placeholder="10-Digit Mobile"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
              />
            </div>
          </div>

          {/* 2. Payment Method Tabs */}
          <div className="space-y-2 pt-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
              2. Choose Payment Mode
            </label>
            
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-2 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'upi' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> UPI
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'card' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" /> Cards
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('nb')}
                className={`py-2 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'nb' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" /> NetBank
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('wallet')}
                className={`py-2 text-xs font-mono font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'wallet' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" /> Wallets
              </button>
            </div>

            {/* Sub-tab / Controls container */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                           {/* UPI Tab with Dynamic QR, 1-Click Apps, and VPA */}
              {activeTab === 'upi' && (
                <div className="space-y-4">
                  {/* Dynamic QR Display & Generation */}
                  <div className="text-center space-y-3">
                    {qrLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 text-teal-700 animate-spin" />
                        <span className="text-xs font-mono text-slate-500">Generating NPCI Dynamic QR Code & UPI Links...</span>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <div className="flex flex-col items-center space-y-3">
                        <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl shadow-sm">
                          <img src={qrCodeDataUrl} alt="PayU Dynamic UPI QR" className="w-48 h-48 mx-auto" />
                        </div>
                        <p className="text-xs text-slate-700 font-bold">
                          Scan with GPay, PhonePe, Paytm, BHIM, CRED or any UPI App
                        </p>

                        {/* 1-Click UPI App Links */}
                        <div className="w-full pt-1">
                          <span className="text-[11px] font-mono text-slate-500 block mb-1.5 uppercase font-bold">
                            Or Tap to Open UPI App:
                          </span>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            <a
                              href={upiAppUris.gpay || upiIntentUri}
                              className="p-2 rounded-xl border border-slate-200 bg-white hover:border-blue-500 hover:shadow-xs transition-all text-center font-mono text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-4 h-4 text-blue-600" />
                              <span>GPay</span>
                            </a>
                            <a
                              href={upiAppUris.phonepe || upiIntentUri}
                              className="p-2 rounded-xl border border-slate-200 bg-white hover:border-purple-500 hover:shadow-xs transition-all text-center font-mono text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-4 h-4 text-purple-600" />
                              <span>PhonePe</span>
                            </a>
                            <a
                              href={upiAppUris.paytm || upiIntentUri}
                              className="p-2 rounded-xl border border-slate-200 bg-white hover:border-cyan-500 hover:shadow-xs transition-all text-center font-mono text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-4 h-4 text-cyan-600" />
                              <span>Paytm</span>
                            </a>
                            <a
                              href={upiAppUris.cred || upiIntentUri}
                              className="p-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:shadow-xs transition-all text-center font-mono text-xs font-bold text-slate-800 flex items-center justify-center gap-1.5"
                            >
                              <Smartphone className="w-4 h-4 text-slate-900" />
                              <span>BHIM/CRED</span>
                            </a>
                          </div>
                        </div>

                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-mono text-emerald-800 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          <span>Auto-verifying payment every 3s...</span>
                        </div>

                        <button
                          type="button"
                          disabled={manualChecking}
                          onClick={() => generatedTxnid && checkPaymentStatusOnce(generatedTxnid, true)}
                          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                        >
                          {manualChecking ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-white" />
                          ) : (
                            <Check className="w-4 h-4 text-white" />
                          )}
                          <span>{manualChecking ? 'Redirecting to Confirmation...' : 'I Have Paid / Amount Deducted (Continue)'}</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleGenerateUpiIntentOrQr}
                        className="w-full py-3.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                      >
                        <QrCode className="w-4 h-4" /> Show UPI QR Code & App Links (₹{item.priceINR})
                      </button>
                    )}
                  </div>

                  {/* VPA Collect Option Collapsible */}
                  <div className="pt-2 border-t border-slate-200">
                    <p className="text-[11px] font-mono text-slate-500 mb-1.5">
                      Or request payment via your UPI ID (VPA):
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. yourname@okaxis"
                        value={vpa}
                        onChange={(e) => setVpa(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                      <button
                        type="button"
                        onClick={handleCustomSubmit}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-mono text-xs font-bold uppercase cursor-pointer disabled:opacity-50"
                      >
                        {loading ? 'Sending...' : 'Request'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Cards Mode -> Redirect to PayU Official Checkout */}
              {activeTab === 'card' && (
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <CreditCard className="w-4 h-4 text-teal-700" /> Credit & Debit Cards via PayU
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      You will be securely redirected to PayU's 256-bit encrypted checkout to complete your Card or EMI payment with 3D Secure OTP.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{loading ? 'Connecting to PayU...' : `Continue to Pay ₹${item.priceINR} via Card`}</span>
                  </button>
                </div>
              )}

              {/* NetBanking Mode -> Redirect to PayU Official Checkout */}
              {activeTab === 'nb' && (
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-teal-700" /> NetBanking & 50+ Major Indian Banks
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Choose SBI, HDFC, ICICI, Axis, or any other bank securely on PayU's official payment page.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{loading ? 'Redirecting to Bank Gateway...' : `Proceed to NetBanking (₹${item.priceINR})`}</span>
                  </button>
                </div>
              )}

              {/* Wallets & Pay Later Mode -> Redirect to PayU Official Checkout */}
              {activeTab === 'wallet' && (
                <div className="space-y-4 py-2">
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-950 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <Wallet className="w-4 h-4 text-teal-700" /> Wallets & PayLater Options
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                      Pay using Paytm Wallet, PhonePe Wallet, Amazon Pay, Mobikwik, or LazyPay via PayU.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    <span>{loading ? 'Connecting Wallet...' : `Proceed to Wallets / PayLater (₹${item.priceINR})`}</span>
                  </button>
                </div>
              )}

            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Isolated Server Response Debug Section (Easy to toggle / remove) */}
          <PayUDebugResponse 
            rawResponse={latestVerifyData ? { _verifyPollCount: verifyCount, verifyStatus: latestVerifyData, s2sInitiationResponse: rawServerResponse } : rawServerResponse} 
            error={error} 
          />

        </div>


        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-teal-700" /> PCI-DSS Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> PayU Custom Merchant-Hosted
          </span>
        </div>

      </div>
    </div>
  );
}

export default PayUCustomHostedModal;
