import React, { useState, useEffect } from 'react';
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
  Smartphone
} from 'lucide-react';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

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

/**
 * PayU Custom Checkout (Merchant-Hosted) Modal
 * Enables in-app customer selection of payment method (UPI, Cards, NetBanking, Wallets)
 * and seamless submission adhering to PayU Merchant-Hosted specifications.
 * Reference: https://docs.payu.in/docs/custom-checkout-merchant-hosted
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
  
  // Customer basic info
  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // UPI fields
  const [vpa, setVpa] = useState('');

  // NetBanking fields
  const [selectedBank, setSelectedBank] = useState('SBIN');

  // Wallet fields
  const [selectedWallet, setSelectedWallet] = useState('PAYTM');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialCustomerName && !customerName) setCustomerName(initialCustomerName);
    if (initialCustomerEmail && !customerEmail) setCustomerEmail(initialCustomerEmail);
    if (initialCustomerPhone && !customerPhone) setCustomerPhone(initialCustomerPhone);
  }, [initialCustomerName, initialCustomerEmail, initialCustomerPhone]);

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

    if (activeTab === 'upi' && vpa.trim() && !vpa.includes('@')) {
      setError('Please enter a valid UPI VPA (e.g., username@okhdfcbank).');
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
        upiDetails: activeTab === 'upi' ? { vpa: vpa.trim() } : undefined,
        nbDetails: activeTab === 'nb' ? { bankcode: selectedBank } : undefined,
        walletDetails: activeTab === 'wallet' ? { bankcode: selectedWallet } : undefined,
        udf1: item.id,
        udf2: item.type || 'digital_product',
        udf3: customerPhone
      };

      // Optional database order log
      try {
        if (db) {
          await addDoc(collection(db, 'inquiries'), {
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            txnid: uniqueTxnid,
            productTitle: item.title,
            priceINR: item.priceINR,
            paymentMethod: `payu_custom_${activeTab}`,
            status: 'initiated',
            timestamp: new Date().toISOString(),
            source: 'payu_custom_hosted'
          });
        }
      } catch (dbErr) {
        console.warn('Firestore order logging notice:', dbErr);
      }

      // Call dedicated PayU Custom initiation endpoint
      const response = await fetch('/api/payu/custom/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize PayU custom checkout.');
      }

      // Post parameters directly to PayU gateway endpoint
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
        
        {/* Top Header */}
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
                PayU Custom Merchant-Hosted Flow
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
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

          <form onSubmit={handleCustomSubmit} className="space-y-4">
            {/* Customer Details */}
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

            {/* Payment Method Selector Tabs */}
            <div className="space-y-2 pt-2">
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

              {/* Tab Contents */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 mt-2">
                {/* UPI Mode */}
                {activeTab === 'upi' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      Enter your Virtual Payment Address (VPA) or leave blank to choose directly on UPI screen.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. yourname@oksbi / yourname@paytm"
                      value={vpa}
                      onChange={(e) => setVpa(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>Supported: GPay, PhonePe, Paytm, BHIM, CRED</span>
                    </div>
                  </div>
                )}

                {/* Cards Mode */}
                {activeTab === 'card' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-500 block mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4532 •••• •••• ••••"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 '))}
                        className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-mono text-slate-500 block mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, '');
                            if (val.length > 2) val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            setCardExpiry(val);
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-mono text-slate-500 block mb-1">CVV</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* NetBanking Mode */}
                {activeTab === 'nb' && (
                  <div className="space-y-3">
                    <label className="text-xs text-slate-600 block">Select your banking institution:</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                    >
                      {popularBanks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Wallets Mode */}
                {activeTab === 'wallet' && (
                  <div className="space-y-3">
                    <label className="text-xs text-slate-600 block">Select supported wallet:</label>
                    <select
                      value={selectedWallet}
                      onChange={(e) => setSelectedWallet(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl py-2.5 px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-600 cursor-pointer"
                    >
                      {popularWallets.map((w) => (
                        <option key={w.code} value={w.code}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-6 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-mono text-xs font-bold uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Initiating Custom Payment...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-300" />
                  <span>Authorize ₹{item.priceINR} via {activeTab.toUpperCase()}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-teal-700" /> PCI-DSS Encrypted
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600" /> PayU Custom Checkout
          </span>
        </div>

      </div>
    </div>
  );
}

export default PayUCustomHostedModal;
