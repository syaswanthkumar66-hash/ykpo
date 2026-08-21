import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  Copy, 
  Check, 
  Printer, 
  Sparkles, 
  ExternalLink,
  Lock,
  Building2,
  FileCheck,
  Zap,
  Clock,
  HelpCircle,
  Mail,
  Shield
} from 'lucide-react';
import { MERCHANT_KYC_DETAILS } from '../data/portfolioData';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid') || `YK_TXN_${Date.now()}`;
  const rawAmount = searchParams.get('amount') || '499';
  const amount = Number(rawAmount);
  const product = searchParams.get('product') || 'Premium Fintech UI & Analytics Dashboard Kit';
  const customer = searchParams.get('customer') || 'Valued Developer';
  const email = searchParams.get('email') || 'developer@ykyash.in';
  const paymentMode = searchParams.get('mode') || 'PayU Secure Checkout';

  const [copiedKey, setCopiedKey] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadCompleted, setDownloadCompleted] = useState(false);

  // Generate deterministic license key
  const licenseKey = `YKYASH-${txnid.replace(/[^A-Z0-9]/gi, '').slice(-8).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCopyLicense = () => {
    navigator.clipboard.writeText(licenseKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleDownloadAsset = () => {
    setDownloading(true);

    setTimeout(() => {
      const packageContent = `===================================================================
YK YASH DIGITAL ASSET & COMMERCIAL LICENSE CERTIFICATE
===================================================================

PRODUCT: ${product}
TRANSACTION ID: ${txnid}
LICENSE KEY: ${licenseKey}
LICENSED TO: ${customer} (${email})
DATE OF ISSUANCE: ${new Date().toUTCString()}
AMOUNT SETTLED: INR ₹${amount.toLocaleString('en-IN')}
PAYMENT GATEWAY: PayU Payments (256-Bit SSL Encrypted)
MERCHANT DOMAIN: https://ykyash.in
PROPRIETOR: ${MERCHANT_KYC_DETAILS.legalName}
OFFICIAL EMAIL: ${MERCHANT_KYC_DETAILS.officialEmail}

-------------------------------------------------------------------
TERMS OF COMMERCIAL GRANT:
-------------------------------------------------------------------
1. You are granted a non-exclusive, perpetual, worldwide commercial license 
   to use, modify, build upon, and deploy this software in personal and 
   commercial client projects.
2. Redistribution, re-licensing, or resale of the raw template/source package 
   is strictly prohibited without written consent.

-------------------------------------------------------------------
QUICK SETUP INSTRUCTIONS:
-------------------------------------------------------------------
1. Unzip the project archive into your workspace folder.
2. Run 'npm install' or 'bun install' to install peer dependencies.
3. Configure environment variables in .env:
   VITE_PUBLIC_URL=https://ykyash.in
   PAYU_MERCHANT_KEY=gtKFFx
4. Run 'npm run dev' to launch local server.

For priority engineering support:
Support Email: ${MERCHANT_KYC_DETAILS.officialEmail}
Support Line: ${MERCHANT_KYC_DETAILS.phone}

Thank you for engineering with YK Yash!
===================================================================
`;

      const blob = new Blob([packageContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `YKYASH-LICENSE-${txnid}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDownloading(false);
      setDownloadCompleted(true);
    }, 800);
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="min-h-screen text-[#12181A] bg-[#F8FAFC] pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient Radial Background Glows */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-[#39AEA9]/15 via-[#1D5C58]/10 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-[#39AEA9]/10 rounded-full blur-2xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Top Trust Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs text-[#557B83]">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-[#39AEA9]" />
            <span>PayU Verified Merchant Settlement • 256-Bit SSL Protection</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-6-00 font-semibold">
              <Zap className="w-3 h-3 text-emerald-500 fill-emerald-500" /> Instant Electronic Delivery
            </span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline">Ref: {txnid}</span>
          </div>
        </div>

        {/* Main Executive Payment Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-slate-200/90 relative overflow-hidden">
          
          {/* Subtle Card Header Accent Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1D5C58] via-[#39AEA9] to-[#88E5BE]" />

          {/* Status Header */}
          <div className="text-center mb-8 pt-2">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-4 shadow-sm animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold font-mono uppercase tracking-widest mb-3 border border-emerald-200">
              <Lock className="w-3 h-3 text-emerald-600" />
              Verified & Settled via PayU
            </div>

            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-slate-900 tracking-tight mb-2">
              Payment Complete & License Issued
            </h1>
            <p className="text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              Thank you, <span className="font-semibold text-slate-800">{customer}</span>! Your payment of <span className="font-bold text-slate-900">₹{amount.toLocaleString('en-IN')} INR</span> has been authorized. Your digital license package is unlocked below.
            </p>
          </div>

          {/* Unlocked Product & Download Container */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 mb-8 space-y-6 shadow-inner">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-[#1D5C58] block mb-1 font-mono">
                  Purchased Item & Perpetual License
                </span>
                <h2 className="text-xl font-display font-bold text-slate-900">
                  {product}
                </h2>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono">Amount Paid</span>
                <span className="text-2xl font-display font-extrabold text-slate-900">₹{amount.toLocaleString('en-IN')} <span className="text-xs text-slate-500 font-normal">INR</span></span>
              </div>
            </div>

            {/* License Key Card */}
            <div className="bg-white border border-slate-300/80 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mb-1">
                  <FileCheck className="w-3.5 h-3.5 text-[#39AEA9]" />
                  <span>Commercial License Certificate Key:</span>
                </div>
                <span className="font-mono text-sm sm:text-base text-slate-900 font-bold tracking-wide select-all block">
                  {licenseKey}
                </span>
              </div>
              <button
                onClick={handleCopyLicense}
                className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                {copiedKey ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" /> Copy Key
                  </>
                )}
              </button>
            </div>

            {/* Download Call to Action Button */}
            <div className="pt-2">
              <button
                onClick={handleDownloadAsset}
                disabled={downloading}
                className="w-full py-4 px-8 rounded-xl font-bold uppercase tracking-widest text-xs bg-gradient-to-r from-[#1D5C58] via-[#2A7873] to-[#39AEA9] hover:from-[#164845] hover:to-[#2F938F] text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4.5 h-4.5 text-white" />
                {downloading ? 'Preparing Source Package...' : (downloadCompleted ? 'Download License Package Again (.txt)' : 'Download Source Package & License Certificate')}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 font-mono pt-1 text-center">
              <Mail className="w-3.5 h-3.5 text-[#39AEA9]" />
              <span>Sent receipt copy to: <strong className="text-slate-700">{email}</strong></span>
            </div>
          </div>

          {/* Formal Tax & Settlement Invoice */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 text-xs text-slate-700 space-y-4 shadow-sm font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1D5C58]" />
                <span className="font-bold text-slate-900 uppercase tracking-wider">Official Tax Invoice & Receipt</span>
              </div>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 text-[#1D5C58] hover:text-slate-900 transition-colors cursor-pointer font-bold"
              >
                <Printer className="w-3.5 h-3.5" /> Print Invoice
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-xs">
              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-slate-400">Order Ref:</span>
                <span className="font-bold text-slate-800 truncate">{txnid}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-800">{new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-slate-400">Customer Name:</span>
                <span className="text-slate-800 font-medium">{customer}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-slate-400">Customer Email:</span>
                <span className="text-slate-800">{email}</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-slate-400">Gateway Processor:</span>
                <span className="text-slate-800 font-medium">PayU Payments (India)</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-slate-400">Settlement Status:</span>
                <span className="text-emerald-700 font-bold uppercase">SUCCESS / CAPTURED</span>
              </div>

              <div className="flex justify-between sm:justify-start sm:gap-4">
                <span className="text-slate-400">Legal Business Entity:</span>
                <span className="text-slate-800">{MERCHANT_KYC_DETAILS.businessName}</span>
              </div>
              <div className="flex justify-between sm:justify-end sm:gap-4">
                <span className="text-slate-400">GST Status:</span>
                <span className="text-slate-800 font-semibold">{MERCHANT_KYC_DETAILS.gstNumber ? `GSTIN: ${MERCHANT_KYC_DETAILS.gstNumber}` : 'Composition / Unregistered'}</span>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-3 flex items-center justify-between font-bold text-sm">
              <span className="text-slate-900">Total Net Amount Paid:</span>
              <span className="text-slate-900 text-base">₹{amount.toLocaleString('en-IN')} INR</span>
            </div>
          </div>

          {/* Action Navigation */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-200/80">
            <Link
              to="/store"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-mono text-xs font-bold transition-colors w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 text-[#1D5C58]" /> Return to Store Catalog
            </Link>
            
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 font-mono text-xs font-medium transition-colors w-full sm:w-auto"
            >
              <HelpCircle className="w-4 h-4 text-slate-400" /> Need Support? ({MERCHANT_KYC_DETAILS.officialEmail})
            </Link>
          </div>

        </div>

        {/* Security Seals */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400 text-xs font-mono py-2">
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-500" /> 256-Bit SSL Encryption
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-[#39AEA9]" /> PCI-DSS Compliant PayU Gateway
          </span>
          <span>•</span>
          <span>Perpetual Commercial Grant</span>
        </div>

      </div>
    </div>
  );
}

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid') || 'N/A';
  const reason = searchParams.get('reason') || 'The transaction was cancelled or declined by your card issuing bank.';

  return (
    <div className="min-h-screen text-[#12181A] bg-[#F8FAFC] pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex items-center justify-center">
      
      {/* Ambient Red Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-md w-full mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-200 text-center space-y-6 relative overflow-hidden">
          
          <div className="w-20 h-20 rounded-3xl bg-red-50 text-red-500 border-2 border-red-200 flex items-center justify-center mx-auto shadow-sm">
            <XCircle className="w-12 h-12" />
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold font-mono uppercase tracking-widest mb-2 border border-red-200">
              Payment Incomplete
            </div>
            <h1 className="text-2xl font-display font-extrabold text-slate-900 mb-2">
              Transaction Declined
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              {reason}
            </p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-600 space-y-1 text-left">
            <div className="flex justify-between">
              <span className="text-slate-400">Transaction Ref:</span>
              <span className="font-bold text-slate-900">{txnid}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Gateway Provider:</span>
              <span className="text-slate-800">PayU Payments</span>
            </div>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <Link
              to="/store"
              className="block w-full py-3.5 px-6 rounded-xl bg-[#1D5C58] hover:bg-[#164845] font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all"
            >
              Try Order Again from Store
            </Link>
            <Link
              to="/contact"
              className="block w-full py-2.5 px-6 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 font-medium transition-colors"
            >
              Contact Support ({MERCHANT_KYC_DETAILS.officialEmail})
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}

