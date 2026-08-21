import React from 'react';
import { LegalLayout } from './LegalLayout';
import { LEGAL_TEXTS, MERCHANT_KYC_DETAILS } from '../../data/portfolioData';

export default function Refund() {
  const { title, lastUpdated, content } = LEGAL_TEXTS.refund;

  return (
    <LegalLayout title={title} lastUpdated={lastUpdated} markdownContent={content}>
      <section className="space-y-6 text-[#12181A]/90">
        <div className="glass-panel p-5 rounded-2xl text-xs sm:text-sm text-[#557B83] space-y-1.5 border border-[#557B83]/20">
          <p><strong className="text-[#12181A]">Domain:</strong> {MERCHANT_KYC_DETAILS.domain}</p>
          <p><strong className="text-[#12181A]">Proprietor:</strong> {MERCHANT_KYC_DETAILS.legalName} ({MERCHANT_KYC_DETAILS.businessName})</p>
          <p><strong className="text-[#12181A]">Official Email:</strong> {MERCHANT_KYC_DETAILS.officialEmail} | <strong className="text-[#12181A]">Phone:</strong> {MERCHANT_KYC_DETAILS.phone}</p>
          <p><strong className="text-[#12181A]">Registered Address:</strong> {MERCHANT_KYC_DETAILS.registeredAddress}</p>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">1. Digital Products & Source Code Downloads</h2>
          <p className="mb-2 text-[#557B83] leading-relaxed">
            Due to the nature of downloadable digital assets (software templates, source code, and firmware), all sales are considered final once the digital download link is generated on screen and delivered.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li>
              <strong className="text-[#12181A]">Defective Code Guarantee:</strong> If a purchased digital package is proven defective, incomplete, or corrupted, and our support team is unable to provide a functional replacement within 48 hours, a <strong>100% full refund</strong> will be issued.
            </li>
            <li>
              <strong className="text-[#12181A]">Unaccessed Downloads:</strong> If payment is processed but the download link has not been accessed or clicked within 24 hours of purchase, cancellation may be requested for a full refund minus nominal payment gateway charges (2-3%).
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">2. Freelance Engineering Services</h2>
          <ul className="list-disc pl-5 space-y-2 text-[#557B83]">
            <li>
              <strong className="text-[#12181A]">Completed Work:</strong> Milestone payments for completed and approved phases of custom development work are non-refundable.
            </li>
            <li>
              <strong className="text-[#12181A]">Future Milestones:</strong> Any advance payments for subsequent phases that have not commenced will be refunded in full upon written cancellation.
            </li>
            <li>
              <strong className="text-[#12181A]">Hardware Procurement:</strong> Costs incurred for custom IoT components, PCBs, or microcontrollers purchased from third-party suppliers are non-refundable.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#12181A] mb-3">3. Refund Processing & Bank Timelines</h2>
          <p className="text-[#557B83] leading-relaxed">
            To submit a refund or cancellation inquiry, contact <a href={`mailto:${MERCHANT_KYC_DETAILS.officialEmail}`} className="text-[#39AEA9] font-medium underline">{MERCHANT_KYC_DETAILS.officialEmail}</a> with your Transaction ID (<code className="text-[#1D5C58] bg-[#39AEA9]/15 px-1.5 py-0.5 rounded font-mono">txnid</code>). Approved refunds are processed back to the original payment mode (UPI, Card, or Bank Account) within <strong>5 to 7 business days</strong>.
          </p>
        </div>
      </section>
    </LegalLayout>
  );
}
