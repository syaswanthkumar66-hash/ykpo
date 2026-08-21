import React, { useState } from 'react';
import { ArrowLeft, Check, CreditCard, ShieldCheck, Sparkles, Lock, AlertCircle, FileCode, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SERVICES, MERCHANT_KYC_DETAILS } from '../data/portfolioData';
import PayUCustomCheckoutModal, { PayUCheckoutItem } from '../components/PayUCustomCheckoutModal';

export default function Services() {
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    firstname: '',
    email: '',
    phone: '8309080424',
    projectId: '',
    milestoneTitle: 'Phase 1: Architecture & Kickoff',
    productinfo: SERVICES[0].title
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleServiceSelect = (service: typeof SERVICES[0]) => {
    setIsCustom(false);
    setSelectedService(service);
    setFormData(prev => ({ 
      ...prev, 
      productinfo: service.title,
      milestoneTitle: service.milestones[0]?.phase || 'Full Project Package'
    }));
  };

  const handleCustomSelect = () => {
    setIsCustom(true);
    setFormData(prev => ({ ...prev, productinfo: 'Custom Project Milestone Payment' }));
  };

  const initiatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = isCustom ? Number(customAmount) : selectedService.priceINR;

    if (!formData.firstname.trim() || !formData.email.trim()) {
      setError('Please provide your name and email address.');
      return;
    }
    if (isCustom && (!customAmount || Number(customAmount) < 1)) {
      setError('Please enter a milestone amount of at least ₹1.');
      return;
    }

    setCheckoutModalOpen(true);
  };

  const activeCheckoutItem: PayUCheckoutItem = {
    id: isCustom ? 'custom_milestone' : selectedService.id,
    title: isCustom ? `Custom Milestone: ${formData.projectId || 'SOW Agreement'}` : `${selectedService.title} (${formData.milestoneTitle})`,
    priceINR: isCustom ? Number(customAmount || 0) : selectedService.priceINR,
    description: selectedService.description,
    type: 'service'
  };

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-24 left-1/4 w-96 h-96 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-24 right-1/4 w-96 h-96 bg-[#A2D5AB]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Navigation & Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-[#1D5C58] text-xs font-bold uppercase tracking-widest mb-4 font-mono shadow-sm">
            <CreditCard className="w-3.5 h-3.5 text-[#39AEA9]" />
            Bespoke Engineering & Milestone Payments
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#12181A] tracking-tight mb-4">
            Freelance Services & Retainers
          </h1>
          <p className="text-[#557B83] text-base sm:text-lg leading-relaxed">
            Transparent pricing in Indian Rupees (INR) with structured milestone deliverables. 
            All engagements include clear Statements of Work and full source code IP handover.
          </p>
        </div>

        {/* Services & Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Service Catalog */}
          <div className="lg:col-span-7 space-y-6">
            <h2 className="text-xl font-display font-bold text-[#12181A] mb-4">
              1. Select Service Tier or Custom Milestone
            </h2>

            <div className="space-y-4">
              {SERVICES.map((service) => {
                const isSelected = !isCustom && selectedService.id === service.id;
                return (
                  <div
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className={`p-6 rounded-3xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-2 border-[#39AEA9] shadow-[0_10px_30px_rgba(57,174,169,0.18)]'
                        : 'glass-panel-interactive'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-display font-bold text-lg text-[#12181A]">
                        {service.title}
                      </h3>
                      <div className="text-right">
                        <span className="font-display font-bold text-xl text-[#1D5C58]">
                          ₹{service.priceINR.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[10px] text-[#557B83] block uppercase font-mono">
                          {service.duration}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#557B83] mb-4">
                      {service.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4 text-xs text-[#12181A]/90">
                      {service.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-[#39AEA9] shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    {/* Milestone Structure */}
                    <div className="pt-3 border-t border-[#557B83]/15">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#557B83] block mb-2 font-mono">
                        Milestone Deliverables:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {service.milestones.map((m, i) => (
                          <div key={i} className="bg-[#F4F8F7] p-2.5 rounded-xl text-[10px] border border-[#557B83]/15">
                            <span className="font-bold text-[#1D5C58] block font-mono">{m.percentage}% Deposit</span>
                            <span className="text-[#557B83]">{m.phase}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Custom Milestone Payment Card */}
              <div
                onClick={handleCustomSelect}
                className={`p-6 rounded-3xl transition-all cursor-pointer ${
                  isCustom
                    ? 'bg-white border-2 border-[#39AEA9] shadow-[0_10px_30px_rgba(57,174,169,0.18)]'
                    : 'glass-panel-interactive'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-display font-bold text-lg text-[#12181A]">
                    Custom Project Milestone / Invoice Payment
                  </h3>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-[#39AEA9]/15 text-[#1D5C58] border border-[#39AEA9]/30 font-bold font-mono">
                    Flexible INR
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#557B83]">
                  Have a custom milestone agreed in your Statement of Work? Enter your Project ID and approved milestone amount.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout & Billing Form */}
          <div className="lg:col-span-5">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl sticky top-28 border border-[#557B83]/20">
              <h2 className="text-xl font-display font-bold text-[#12181A] mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#39AEA9]" />
                2. Secure Milestone Checkout
              </h2>
              <p className="text-xs text-[#557B83] mb-5 font-mono">
                Settled securely via RBI-authorized payment infrastructure
              </p>

              {/* Review Compliance Notice */}
              <div className="bg-[#39AEA9]/10 border border-[#39AEA9]/30 rounded-2xl p-3 mb-5 text-xs text-[#1D5C58] space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#39AEA9]" />
                  <span>Merchant Gateway Review Mode</span>
                </div>
                <p className="text-[#557B83] leading-relaxed text-[11px]">
                  Online payment aggregator verification is in progress. Submitting generates an official milestone contract record and verified digital invoice.
                </p>
              </div>

              {/* Selection Summary */}
              <div className="bg-[#F4F8F7] p-4 rounded-2xl border border-[#557B83]/15 mb-6 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-[#557B83]">Selected Engagement:</span>
                  <span className="text-[#12181A] font-bold">{isCustom ? 'Custom Milestone' : selectedService.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#557B83]">Security Protocol:</span>
                  <span className="text-[#1D5C58] font-semibold">256-bit TLS Encrypted</span>
                </div>
              </div>

              <form onSubmit={initiatePayment} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-1.5 font-mono">
                    Client / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstname}
                    onChange={e => setFormData({ ...formData, firstname: e.target.value })}
                    placeholder="e.g. S. Kumar or Startup Corp"
                    className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-1.5 font-mono">
                    Email Address for Receipt & Invoices *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="client@example.com"
                    className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-1.5 font-mono">
                    Mobile Number (10 Digits) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    placeholder="8309080424"
                    className="w-full glass-input rounded-xl py-3 px-4 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-1.5 font-mono">
                    Project ID / Statement of Work Ref
                  </label>
                  <input
                    type="text"
                    value={formData.projectId}
                    onChange={e => setFormData({ ...formData, projectId: e.target.value })}
                    placeholder="e.g. PRJ-2026-IOT or Web App Phase 1"
                    className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                  />
                </div>

                {isCustom && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-1.5 font-mono">
                      Milestone Amount in INR (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      placeholder="e.g. 1 or 15000"
                      className="w-full glass-input rounded-xl py-3 px-4 text-sm font-mono mb-2"
                    />
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setCustomAmount('1')}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold bg-[#39AEA9]/15 text-[#1D5C58] border border-[#39AEA9]/30 hover:bg-[#39AEA9]/25 transition-all cursor-pointer"
                      >
                        ⚡ ₹1 (Live Test)
                      </button>
                      {['500', '2500', '10000', '25000'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCustomAmount(amt)}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-black/5 hover:bg-black/10 text-[#12181A] transition-all cursor-pointer"
                        >
                          ₹{Number(amt).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Total & Submit */}
                <div className="pt-4 border-t border-[#557B83]/15">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs uppercase font-bold text-[#557B83] font-mono">Total Milestone:</span>
                    <span className="text-2xl font-display font-bold text-[#12181A]">
                      ₹{isCustom ? (Number(customAmount) || 0).toLocaleString('en-IN') : selectedService.priceINR.toLocaleString('en-IN')} INR
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-2xl font-bold uppercase tracking-widest text-xs btn-turtle-primary flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg transition-all"
                  >
                    <CreditCard className="w-4 h-4 text-white" />
                    Proceed to PayU Custom Checkout (₹{isCustom ? (Number(customAmount) || 0).toLocaleString('en-IN') : selectedService.priceINR.toLocaleString('en-IN')})
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center">
                <p className="text-[10px] text-[#557B83] font-mono">
                  By paying, you accept the <Link to="/terms" className="underline text-[#12181A]">Terms of Service</Link> and <Link to="/refund" className="underline text-[#12181A]">Refund Policy</Link>.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* PayU Merchant Hosted Modal */}
        <PayUCustomCheckoutModal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          item={activeCheckoutItem}
          initialCustomerName={formData.firstname}
          initialCustomerEmail={formData.email}
          initialCustomerPhone={formData.phone}
        />

      </div>
    </div>
  );
}
