import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, FileText, CheckCircle2 } from 'lucide-react';
import { MERCHANT_KYC_DETAILS } from '../data/portfolioData';

export function Footer() {
  return (
    <footer className="bg-white/80 border-t border-[#557B83]/15 pt-16 pb-12 text-[#557B83] backdrop-blur-xl relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#39AEA9]/5 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#A2D5AB]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-[#557B83]/15">
          
          {/* Brand & Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#39AEA9] to-[#557B83] p-[1px] shadow-sm">
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-[#12181A] font-bold text-lg font-display">
                  YK
                </div>
              </div>
              <div>
                <span className="font-bold text-lg text-[#12181A] font-display">YK Yash</span>
                <p className="text-[10px] uppercase font-mono tracking-widest text-[#557B83]">
                  ykyash.in
                </p>
              </div>
            </div>
            
            <p className="text-xs sm:text-sm text-[#557B83] leading-relaxed">
              Full-Stack Developer & IoT Systems Engineer delivering high-performance web applications, embedded FreeRTOS firmware, and digital developer packages.
            </p>
          </div>

          {/* Explore Links */}
          <div>
            <h4 className="text-[#12181A] font-bold text-xs uppercase tracking-widest mb-4 font-mono">
              Explore Store & Work
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li><Link to="/" className="text-[#557B83] hover:text-[#12181A] transition-colors">Home Overview</Link></li>
              <li><Link to="/store" className="text-[#39AEA9] font-semibold hover:text-[#12181A] transition-colors flex items-center gap-1.5">Digital Products Store <span className="px-1.5 py-0.2 rounded text-[9px] bg-[#39AEA9]/15 font-mono">NEW</span></Link></li>
              <li><Link to="/services" className="text-[#557B83] hover:text-[#12181A] transition-colors">Services & Milestones</Link></li>
              <li><Link to="/projects" className="text-[#557B83] hover:text-[#12181A] transition-colors">Hardware & Web Case Studies</Link></li>
              <li><Link to="/contact" className="text-[#557B83] hover:text-[#12181A] transition-colors">Direct Contact Desk</Link></li>
            </ul>
          </div>

          {/* Merchant Mandatory Legal Pages */}
          <div>
            <h4 className="text-[#12181A] font-bold text-xs uppercase tracking-widest mb-4 font-mono">
              Mandatory Legal & Policies
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm">
              <li><Link to="/terms" className="text-[#557B83] hover:text-[#12181A] flex items-center gap-2 transition-colors"><FileText className="w-3.5 h-3.5 text-[#39AEA9]"/> Terms & Conditions</Link></li>
              <li><Link to="/privacy" className="text-[#557B83] hover:text-[#12181A] flex items-center gap-2 transition-colors"><FileText className="w-3.5 h-3.5 text-[#39AEA9]"/> Privacy Policy (DPDP Act)</Link></li>
              <li><Link to="/refund" className="text-[#557B83] hover:text-[#12181A] flex items-center gap-2 transition-colors"><FileText className="w-3.5 h-3.5 text-[#39AEA9]"/> Refund & Cancellation</Link></li>
              <li><Link to="/delivery" className="text-[#557B83] hover:text-[#12181A] flex items-center gap-2 transition-colors"><FileText className="w-3.5 h-3.5 text-[#39AEA9]"/> Instant Digital Delivery</Link></li>
              <li><Link to="/contact" className="text-[#557B83] hover:text-[#12181A] flex items-center gap-2 transition-colors"><FileText className="w-3.5 h-3.5 text-[#39AEA9]"/> Merchant KYC Details</Link></li>
            </ul>
          </div>

          {/* Merchant KYC Details */}
          <div>
            <h4 className="text-[#12181A] font-bold text-xs uppercase tracking-widest mb-4 font-mono">
              Merchant KYC Disclosures
            </h4>
            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#39AEA9] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#12181A]">Official Inquiries:</p>
                  <a href={`mailto:${MERCHANT_KYC_DETAILS.officialEmail}`} className="underline text-[#39AEA9] hover:text-[#12181A]">
                    {MERCHANT_KYC_DETAILS.officialEmail}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#39AEA9] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#12181A]">Helpline / WhatsApp:</p>
                  <a href={`tel:${MERCHANT_KYC_DETAILS.phone}`} className="text-[#557B83] hover:text-[#12181A]">
                    {MERCHANT_KYC_DETAILS.phone}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#39AEA9] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#12181A]">Registered Address:</p>
                  <p className="text-[#557B83] leading-relaxed">{MERCHANT_KYC_DETAILS.registeredAddress}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#557B83]/80">
          <span>&copy; {new Date().getFullYear()} {MERCHANT_KYC_DETAILS.legalName} ({MERCHANT_KYC_DETAILS.businessName}). All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-[#1D5C58] font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#39AEA9]" /> 100% Instant Digital Software Delivery (₹0 Shipping Fee)
          </span>
        </div>
      </div>
    </footer>
  );
}
