import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_TEXTS, MERCHANT_KYC_DETAILS } from '../../data/portfolioData';

export default function Privacy() {
  const { title, lastUpdated, content } = LEGAL_TEXTS.privacy;

  return (
    <LegalLayout title={title} lastUpdated={lastUpdated} markdownContent={content}>
      <section className="space-y-6 text-[#12181A]/90">
        <div className="glass-panel p-5 rounded-2xl text-xs sm:text-sm text-[#557B83] space-y-1.5 border border-[#557B83]/20">
          <p><strong className="text-[#12181A]">Domain:</strong> {MERCHANT_KYC_DETAILS.domain}</p>
          <p><strong className="text-[#12181A]">Proprietor:</strong> {MERCHANT_KYC_DETAILS.legalName} ({MERCHANT_KYC_DETAILS.businessName})</p>
          <p><strong className="text-[#12181A]">Official Contact:</strong> {MERCHANT_KYC_DETAILS.officialEmail}</p>
          <p><strong className="text-[#12181A]">Applicable Framework:</strong> Indian Information Technology Act, 2000 & SPDI Rules, 2011</p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">1. Information We Collect</h2>
          <p className="mb-2 text-[#557B83] leading-relaxed">
            We collect only the essential personal and transaction information required to provide digital downloads and fulfill engineering service agreements:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li><strong className="text-[#12181A]">Customer Data:</strong> Full Name and Email Address (used solely for order communication and receipt delivery).</li>
            <li><strong className="text-[#12181A]">Transaction Metadata:</strong> Transaction ID (<code className="text-[#1D5C58] bg-[#39AEA9]/15 px-1.5 py-0.5 rounded font-mono">txnid</code>), Order timestamp, Amount in INR, Product Purchased, and Payment Gateway Status.</li>
            <li><strong className="text-[#12181A]">Security Disclaimers:</strong> We NEVER collect or store raw Credit/Debit card numbers, CVVs, or UPI PINs. All financial interactions are directly processed via authorized PCI-DSS compliant payment gateways.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li>Generating instantaneous digital download access tokens and license keys.</li>
            <li>Transmitting digital payment receipts and order status notifications.</li>
            <li>Providing technical support, defect warranty remediation, and code update notices.</li>
            <li>Complying with statutory accounting and tax regulations in India.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">3. Data Sharing & Third-Party Processors</h2>
          <p className="text-[#557B83] leading-relaxed">
            We do not sell, lease, or distribute user personal information to marketing aggregators. Data is shared exclusively with critical infrastructure partners:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83] mt-2">
            <li><strong className="text-[#12181A]">Payment Gateway:</strong> RBI-authorized payment aggregators (Secured with 256-bit TLS encryption and SHA-512 cryptographic verification).</li>
            <li><strong className="text-[#12181A]">Hosting Infrastructure:</strong> Vercel & Supabase (Protected by 256-bit TLS/SSL encryption).</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">4. Grievance Redressal Mechanism</h2>
          <p className="text-[#557B83] leading-relaxed">
            In accordance with Information Technology Act, 2000, details of the appointed Grievance Officer:
          </p>
          <div className="glass-panel p-5 rounded-2xl border border-[#557B83]/20 mt-3 text-xs sm:text-sm text-[#557B83] space-y-1.5">
            <p><strong className="text-[#12181A]">Grievance Officer:</strong> {MERCHANT_KYC_DETAILS.grievanceOfficer}</p>
            <p><strong className="text-[#12181A]">Official Email:</strong> {MERCHANT_KYC_DETAILS.officialEmail}</p>
            <p className="text-[#1D5C58] font-medium pt-1">All inquiries are acknowledged within 24 hours and addressed within 15 business days.</p>
          </div>
        </div>
      </section>
    </LegalLayout>
  );
}
