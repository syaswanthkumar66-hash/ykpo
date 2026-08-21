import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_TEXTS, MERCHANT_KYC_DETAILS } from '../../data/portfolioData';
import { Zap } from 'lucide-react';

export default function Delivery() {
  const { title, lastUpdated, content } = LEGAL_TEXTS.delivery;

  return (
    <LegalLayout title={title} lastUpdated={lastUpdated} markdownContent={content}>
      <section className="space-y-6 text-[#12181A]/90">
        <div className="glass-panel p-5 rounded-2xl text-xs sm:text-sm text-[#557B83] space-y-1.5 border border-[#557B83]/20">
          <p><strong className="text-[#12181A]">Domain:</strong> {MERCHANT_KYC_DETAILS.domain}</p>
          <p><strong className="text-[#12181A]">Proprietor:</strong> {MERCHANT_KYC_DETAILS.legalName} ({MERCHANT_KYC_DETAILS.businessName})</p>
          <p><strong className="text-[#12181A]">Official Contact:</strong> {MERCHANT_KYC_DETAILS.officialEmail} | {MERCHANT_KYC_DETAILS.phone}</p>
          <p><strong className="text-[#12181A]">Registered Address:</strong> {MERCHANT_KYC_DETAILS.registeredAddress}</p>
        </div>

        {/* Highlight Banner */}
        <div className="bg-[#39AEA9]/10 border border-[#39AEA9]/30 rounded-2xl p-5 text-[#1D5C58] text-sm flex items-start gap-3">
          <Zap className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#12181A] block font-display text-base font-bold">100% Instant Digital Electronic Delivery</strong>
            <span className="text-[#557B83]">
              All products sold on ykyash.in are strictly digital software assets (source code, templates, and firmware). No physical shipping, postal handling, or courier delivery is involved.
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">1. Delivery Process & Timelines</h2>
          <ul className="list-disc pl-5 space-y-3 text-[#557B83]">
            <li>
              <strong className="text-[#12181A]">Instant On-Screen Download:</strong> Upon successful transaction authorization, the browser is automatically redirected to the secure Payment Success & Download portal. You can download your ZIP file immediately.
            </li>
            <li>
              <strong className="text-[#12181A]">Automated Email Dispatch:</strong> An electronic confirmation containing your license key, download credentials, and transaction receipt is transmitted to your registered email address within <strong>5 minutes</strong> of payment clearance.
            </li>
            <li>
              <strong className="text-[#12181A]">Custom Engineering Services:</strong> Bespoke milestone code is delivered electronically via private Git repositories (GitHub/GitLab) and cloud staging deployments per the agreed project schedule.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">2. Shipping Charges & Zero Hidden Costs</h2>
          <p className="text-[#557B83] leading-relaxed">
            Because all products are delivered electronically over the internet, <strong>no shipping or courier charges (₹0.00)</strong> are levied on any transaction.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">3. Troubleshooting & Download Assistance</h2>
          <p className="text-[#557B83] mb-2 leading-relaxed">
            If you encounter any delay in accessing your digital download or have not received your email confirmation:
          </p>
          <div className="glass-panel p-5 rounded-2xl border border-[#557B83]/20 text-xs sm:text-sm text-[#557B83] space-y-2">
            <p>1. Check your email Spam, Junk, or Promotions folder.</p>
            <p>2. Verify your transaction on our <a href="/payment/success" className="text-[#39AEA9] underline font-medium">Payment Status Portal</a> using your Transaction ID.</p>
            <p>3. Directly reach out to our emergency support desk at <strong className="text-[#12181A]">{MERCHANT_KYC_DETAILS.officialEmail}</strong> or call <strong className="text-[#12181A]">{MERCHANT_KYC_DETAILS.phone}</strong> for instant manual re-issuance.</p>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
