import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_TEXTS, MERCHANT_KYC_DETAILS } from '../../data/portfolioData';

export default function Terms() {
  const { title, lastUpdated, content } = LEGAL_TEXTS.terms;

  return (
    <LegalLayout title={title} lastUpdated={lastUpdated} markdownContent={content}>
      <section className="space-y-6 text-[#12181A]/90">
        <div className="glass-panel p-5 rounded-2xl text-xs sm:text-sm text-[#557B83] space-y-1.5 border border-[#557B83]/20">
          <p><strong className="text-[#12181A]">Domain:</strong> {MERCHANT_KYC_DETAILS.domain}</p>
          <p><strong className="text-[#12181A]">Proprietor / Service Provider:</strong> {MERCHANT_KYC_DETAILS.legalName} ({MERCHANT_KYC_DETAILS.businessName})</p>
          <p><strong className="text-[#12181A]">Official Contact:</strong> {MERCHANT_KYC_DETAILS.officialEmail}</p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">1. Acceptance of Terms</h2>
          <p className="text-[#557B83] leading-relaxed">
            By accessing and utilizing the website <strong>https://ykyash.in</strong>, purchasing downloadable digital goods (such as source code templates, UI kits, and IoT firmware packages), or engaging freelance software and hardware engineering services, you ("Customer", "Client", or "User") agree to be bound by these comprehensive Terms and Conditions.
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">2. Digital Products Store & Licensing</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li>
              <strong className="text-[#12181A]">Commercial License Grant:</strong> Upon successful settlement of the specified fee in Indian Rupees (INR), you receive a non-exclusive, perpetual, worldwide commercial license to use, modify, and integrate the purchased code into unlimited personal or commercial client applications.
            </li>
            <li>
              <strong className="text-[#12181A]">Redistribution Prohibition:</strong> You may not resell, sub-license, redistribute, or publish the raw source code or asset bundles as standalone templates or open-source boilerplates.
            </li>
            <li>
              <strong className="text-[#12181A]">Instant Electronic Delivery:</strong> All products are digital. Download links are generated immediately on screen following payment clearance and confirmed via email.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">3. Freelance Engineering Services & Milestones</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li>
              <strong className="text-[#12181A]">Statement of Work (SOW):</strong> Custom bespoke engineering engagements operate under written project deliverables with explicit milestone breakdown percentages.
            </li>
            <li>
              <strong className="text-[#12181A]">Milestone Invoicing:</strong> Work on each subsequent stage proceeds after the preceding phase milestone payment has been settled.
            </li>
            <li>
              <strong className="text-[#12181A]">IP Transfer:</strong> Intellectual property rights and custom source code ownership transfer completely to the Client only upon 100% full receipt of all agreed project milestones.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">4. Payment Processing & Gateway Compliance</h2>
          <p className="text-[#557B83] leading-relaxed">
            All payments are processed securely through RBI-authorized payment aggregators and payment gateways. We do not store raw card numbers, CVVs, or bank credentials. All prices on ykyash.in are transparently denominated in Indian Rupees (INR ₹).
          </p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">5. Governing Law & Jurisdiction</h2>
          <p className="text-[#557B83] leading-relaxed">
            These Terms shall be governed by and interpreted in accordance with the laws of the Republic of India. Any legal disputes or claims shall be subject to the exclusive jurisdiction of the competent courts in Chittoor / Srikalahasti, Andhra Pradesh, India.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
