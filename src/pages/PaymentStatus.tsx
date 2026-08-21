import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle, 
  XCircle, 
  Download, 
  ArrowLeft, 
  ShieldCheck, 
  Copy, 
  Check, 
  Printer, 
  FileCode, 
  Sparkles, 
  ExternalLink 
} from 'lucide-react';
import { MERCHANT_KYC_DETAILS } from '../data/portfolioData';

export function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid') || `TXN_${Date.now()}`;
  const amount = searchParams.get('amount') || '499';
  const product = searchParams.get('product') || 'Premium Fintech UI & Analytics Dashboard Kit';
  const customer = searchParams.get('customer') || 'Valued Developer';
  const email = searchParams.get('email') || 'developer@ykyash.in';

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
AMOUNT SETTLED: INR ₹${amount}
MERCHANT DOMAIN: https://ykyash.in
PROPRIETOR: ${MERCHANT_KYC_DETAILS.legalName}

-------------------------------------------------------------------
TERMS OF COMMERCIAL GRANT:
-------------------------------------------------------------------
1. You are granted a non-exclusive, perpetual, worldwide license to use,
   modify, and deploy this software for personal and commercial projects.
2. Redistribution, re-licensing, or resale of the raw source package is
   strictly prohibited.

-------------------------------------------------------------------
QUICK SETUP INSTRUCTIONS:
-------------------------------------------------------------------
1. Unzip the project files into your desired workspace directory.
2. Run 'npm install' or 'bun install' to install peer dependencies.
3. Configure your .env with your project credentials:
   VITE_PUBLIC_URL=https://ykyash.in
   GATEWAY_MERCHANT_KEY=your_key_here
   GATEWAY_MERCHANT_SALT=your_salt_here
4. Run 'npm run dev' to start the local development server on port 3000.

For priority engineering support or updates:
Official Email: ${MERCHANT_KYC_DETAILS.officialEmail}
Helpline: ${MERCHANT_KYC_DETAILS.phone}

Thank you for building with YK Yash!
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
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[#39AEA9]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-3xl mx-auto">
        
        {/* Success Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl relative border border-[#39AEA9]/40">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-[#39AEA9]/15 text-[#39AEA9] border border-[#39AEA9]/30 flex items-center justify-center mx-auto mb-4 shadow-sm animate-in zoom-in duration-300">
              <CheckCircle className="w-10 h-10 text-[#39AEA9]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#39AEA9]/15 text-[#1D5C58] text-xs font-bold font-mono uppercase tracking-widest mb-2 border border-[#39AEA9]/30">
              <ShieldCheck className="w-3.5 h-3.5 text-[#39AEA9]" />
              Payment Processed Successfully
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#12181A] mb-2">
              Order Confirmed & Ready to Download
            </h1>
            <p className="text-sm text-[#557B83] max-w-md mx-auto">
              Your transaction has been processed securely. Your digital assets and commercial license key are ready below.
            </p>
          </div>

          {/* Instant Download Action Box */}
          <div className="bg-[#F4F8F7] border border-[#39AEA9]/30 rounded-2xl p-6 mb-8 text-center space-y-4 shadow-inner">
            <div>
              <span className="text-xs uppercase font-bold tracking-wider text-[#1D5C58] block mb-1 font-mono">
                Your Purchased Digital Package
              </span>
              <h3 className="text-lg font-display font-bold text-[#12181A]">
                {product}
              </h3>
            </div>

            {/* License Key Box */}
            <div className="bg-white border border-[#557B83]/20 rounded-xl p-3 max-w-md mx-auto flex items-center justify-between gap-2 shadow-sm">
              <div className="text-left overflow-hidden">
                <span className="text-[10px] text-[#557B83] uppercase tracking-wider block font-mono">Commercial License Key:</span>
                <span className="font-mono text-xs sm:text-sm text-[#12181A] font-bold truncate block">
                  {licenseKey}
                </span>
              </div>
              <button
                onClick={handleCopyLicense}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#12181A] border border-[#557B83]/20 transition-colors cursor-pointer shrink-0"
                title="Copy License Key"
              >
                {copiedKey ? <Check className="w-4 h-4 text-[#39AEA9]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            {/* Primary Download Button */}
            <div className="pt-2">
              <button
                onClick={handleDownloadAsset}
                disabled={downloading}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs btn-turtle-primary flex items-center justify-center gap-2 mx-auto cursor-pointer disabled:opacity-50 shadow-md"
              >
                <Download className="w-4 h-4 text-white" />
                {downloading ? 'Preparing Digital Asset...' : (downloadCompleted ? 'Download Again' : 'Download Digital Source Code (.zip / .txt)')}
              </button>
            </div>

            <p className="text-[11px] text-[#557B83] font-mono">
              ⚡ Instant 100% electronic delivery. A copy of the license has also been dispatched to your email.
            </p>
          </div>

          {/* Official Invoice / Transaction Receipt */}
          <div className="bg-[#F4F8F7]/80 border border-[#557B83]/15 rounded-2xl p-6 mb-8 text-xs text-[#12181A]/90 space-y-3 font-mono">
            <div className="flex items-center justify-between border-b border-[#557B83]/15 pb-3">
              <span className="font-bold text-[#12181A] uppercase tracking-wider">Transaction Summary</span>
              <button
                onClick={handlePrintReceipt}
                className="flex items-center gap-1.5 text-[#39AEA9] hover:text-[#12181A] transition-colors cursor-pointer font-semibold"
              >
                <Printer className="w-3.5 h-3.5" /> Print Receipt
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <span className="text-[#557B83]">Transaction ID:</span>
              <span className="text-[#12181A] font-mono text-right truncate font-medium">{txnid}</span>

              <span className="text-[#557B83]">Total Paid:</span>
              <span className="text-[#12181A] font-bold text-right text-sm">₹{Number(amount).toLocaleString('en-IN')} INR</span>

              <span className="text-[#557B83]">Payment Status:</span>
              <span className="text-[#1D5C58] font-bold text-right">SUCCESS (Settled via Secure Gateway)</span>

              <span className="text-[#557B83]">Delivery Method:</span>
              <span className="text-[#12181A] text-right">Instant On-Screen Download</span>

              <span className="text-[#557B83]">Merchant:</span>
              <span className="text-[#12181A] text-right">{MERCHANT_KYC_DETAILS.businessName}</span>
            </div>
          </div>

          {/* Action Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-mono">
            <Link
              to="/store"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-panel text-[#12181A] hover:border-[#39AEA9] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#39AEA9]" /> Return to Store
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[#557B83]/20 text-[#557B83] hover:text-[#12181A] transition-colors"
            >
              Need Help? Contact Support
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}

export function PaymentFailure() {
  const [searchParams] = useSearchParams();
  const txnid = searchParams.get('txnid') || 'N/A';
  const reason = searchParams.get('reason') || 'The payment was cancelled by user or declined by bank.';

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="max-w-md mx-auto text-center">
        <div className="glass-panel rounded-3xl p-8 shadow-xl border border-red-500/30">
          
          <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>

          <h1 className="text-2xl font-display font-bold text-[#12181A] mb-2">
            Payment Not Completed
          </h1>
          <p className="text-sm text-[#557B83] mb-4 leading-relaxed">
            {reason}
          </p>

          <div className="bg-[#F4F8F7] p-3 rounded-xl border border-[#557B83]/15 mb-6 text-xs text-[#557B83] font-mono">
            Transaction Ref: <span className="font-bold text-[#12181A]">{txnid}</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <Link
              to="/store"
              className="block w-full py-3.5 rounded-2xl btn-turtle-primary uppercase tracking-wider text-white shadow-md hover:shadow-lg transition-all"
            >
              Try Again from Store
            </Link>
            <Link
              to="/contact"
              className="block w-full py-2.5 rounded-xl text-[#557B83] hover:text-[#12181A] transition-colors"
            >
              Contact Support ({MERCHANT_KYC_DETAILS.officialEmail})
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
