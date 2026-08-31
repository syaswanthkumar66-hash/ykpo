import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Check, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  Shield,
  Zap,
  Building2,
  Wallet,
  QrCode,
  LockKeyhole
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

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

export function PayUCustomCheckoutModal({
  isOpen,
  onClose,
  item,
  initialCustomerName = '',
  initialCustomerEmail = '',
  initialCustomerPhone = '',
  onSuccess
}: PayUCustomCheckoutModalProps) {
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(initialCustomerName);
  const [customerEmail, setCustomerEmail] = useState(initialCustomerEmail);
  const [customerPhone, setCustomerPhone] = useState(initialCustomerPhone);
  const [termsAgreed, setTermsAgreed] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync initial customer props
  useEffect(() => {
    if (initialCustomerName && !customerName) setCustomerName(initialCustomerName);
    if (initialCustomerEmail && !customerEmail) setCustomerEmail(initialCustomerEmail);
    if (initialCustomerPhone && !customerPhone) setCustomerPhone(initialCustomerPhone);
  }, [initialCustomerName, initialCustomerEmail, initialCustomerPhone]);

  if (!isOpen || !item) return null;

  // Submit form directly to PayU Hosted Gateway (https://secure.payu.in/_payment)
  const handleProceedToPayUGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!customerName.trim()) {
      setError('Please enter your full name for license issuance.');
      return;
    }
    if (!customerEmail.trim() || !customerEmail.includes('@')) {
      setError('Please enter a valid email address for instant digital asset delivery.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid 10-digit mobile number for transaction SMS.');
      return;
    }
    if (!termsAgreed) {
      setError('Please accept the Commercial License & Refund Policy.');
      return;
    }

    setLoading(true);

    try {
      // Generate a fresh unique alphanumeric txnid to prevent PayU rate limiting (Too many Requests)
      const uniqueTxnid = 'YK' + Date.now() + Math.floor(10000 + Math.random() * 90000);

      const payload = {
        txnid: uniqueTxnid,
        amount: item.priceINR,
        productinfo: item.title,
        firstname: customerName.trim(),
        email: customerEmail.trim(),
        phone: customerPhone.replace(/\D/g, ''),
        udf1: item.id,
        udf2: item.type || 'digital_product',
        udf3: customerPhone
      };

      // Log checkout initiation to Supabase payments table
      try {
        if (supabase) {
          await supabase.from('payments').insert([{
            txnid: uniqueTxnid,
            amount: item.priceINR,
            product: item.title,
            customer_name: customerName.trim(),
            customer_email: customerEmail.trim(),
            customer_phone: customerPhone.replace(/\D/g, ''),
            status: 'initiated',
            payment_mode: 'payu_custom_hosted',
            created_at: new Date().toISOString()
          }]);
        }
      } catch (dbErr) {
        console.warn('Supabase order logging notice:', dbErr);
      }

      // Call backend endpoint to calculate SHA-512 hash and return PayU Hosted form payload
      const response = await fetch('/api/payu/initiate-custom-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to initialize PayU payment session.');
      }

      // Construct standard HTML Form POST to official PayU Hosted Gateway (https://secure.payu.in/_payment)
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
      console.error('PayU gateway initiation error:', err);
      setError(err.message || 'Unable to redirect to PayU hosted gateway. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      
      <div className="bg-white max-w-xl w-full rounded-3xl shadow-2xl relative border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* Top Header Bar */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#1D5C58]/10 text-[#1D5C58] border border-[#1D5C58]/20">
              <ShieldCheck className="w-5 h-5 text-[#1D5C58]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-display font-extrabold text-slate-900">
                  PayU Secure Gateway Checkout
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  256-Bit SSL
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Official PayU Prebuilt Payment Gateway
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Close Checkout"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Order Item Summary */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-[#1D5C58] block font-mono mb-0.5">
                Item & Commercial License
              </span>
              <h4 className="text-lg font-display font-bold text-slate-900">
                {item.title}
              </h4>
              {item.fileSize && (
                <span className="text-xs text-slate-500 font-mono">Package Size: {item.fileSize} ZIP</span>
              )}
            </div>
            <div className="sm:text-right shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">Total Amount Payable</span>
              <span className="text-2xl font-display font-extrabold text-slate-900">
                ₹{item.priceINR.toLocaleString('en-IN')} <span className="text-xs font-mono font-normal text-slate-500">INR</span>
              </span>
            </div>
          </div>

          {/* Customer Input Form */}
          <form onSubmit={handleProceedToPayUGateway} className="space-y-5">
            
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono flex items-center justify-between">
                <span>Customer Contact & License Details</span>
                <span className="text-[11px] text-slate-400 font-normal">All fields required</span>
              </label>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Legal Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#1D5C58] focus:bg-white transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <input
                      type="email"
                      required
                      placeholder="Email Address *"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#1D5C58] focus:bg-white transition-all"
                    />
                  </div>
                  
                  <div>
                    <input
                      type="tel"
                      required
                      placeholder="Phone (10 Digits) *"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl py-3 px-4 text-sm text-slate-900 placeholder-slate-400 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#1D5C58] focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Supported Payment Methods Badge List on PayU Hosted Gateway */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-500 block">
                PayU Hosted Page Accepts All Payment Modes:
              </span>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 shrink-0" />
                  <span>UPI & QR</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Cards (CC/DC)</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                  <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Net Banking</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white border border-slate-200 text-slate-800">
                  <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Wallets & EMI</span>
                </div>
              </div>
            </div>

            {/* Terms Agreement Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms_payu_hosted"
                checked={termsAgreed}
                onChange={(e) => setTermsAgreed(e.target.checked)}
                className="mt-0.5 rounded text-[#1D5C58] focus:ring-[#1D5C58] cursor-pointer"
              />
              <label htmlFor="terms_payu_hosted" className="text-xs text-slate-600 leading-relaxed cursor-pointer font-sans">
                I agree to the <span className="font-semibold text-slate-900">Commercial License Terms</span> and <span className="font-semibold text-slate-900">Refund Policy</span>. Payment will be processed securely on PayU’s 256-Bit SSL gateway.
              </label>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit CTA Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-xl font-bold uppercase tracking-widest text-xs bg-gradient-to-r from-[#1D5C58] via-[#2A7873] to-[#39AEA9] hover:from-[#164845] hover:to-[#2F938F] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Connecting to PayU Gateway...</span>
                </>
              ) : (
                <>
                  <LockKeyhole className="w-4 h-4 text-white" />
                  <span>Pay ₹{item.priceINR.toLocaleString('en-IN')} via PayU Hosted Gateway</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Modal Footer Trust Bar */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-4 shrink-0">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" /> 256-Bit SSL
          </span>
          <span>•</span>
          <span>PCI-DSS Compliant</span>
          <span>•</span>
          <span>PayU India Gateway</span>
        </div>

      </div>

    </div>
  );
}

export default PayUCustomCheckoutModal;
