import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, ShieldCheck, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { MERCHANT_KYC_DETAILS } from '../data/portfolioData';
import { supabase } from '../supabase';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (supabase) {
        await supabase.from('inquiries').insert([{
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
          source: 'contact_page',
          created_at: new Date().toISOString()
        }]);
      }
      setSubmitted(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact submission error:', err);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient Glows */}
      <div className="absolute top-20 right-1/4 w-96 h-96 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-[#A2D5AB]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-[#1D5C58] text-xs font-bold uppercase tracking-widest mb-4 font-mono shadow-sm">
            <MessageSquare className="w-3.5 h-3.5 text-[#39AEA9]" />
            Get In Touch & Merchant KYC
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#12181A] tracking-tight mb-4">
            Contact & Support Desk
          </h1>
          <p className="text-[#557B83] text-base sm:text-lg leading-relaxed">
            Have a custom freelance engineering project or an inquiry about our digital products store? 
            Reach out directly or visit our registered development hub.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Column: Official KYC Disclosures */}
          <div className="lg:col-span-5 space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl border border-[#557B83]/20">
              <h2 className="text-xl font-display font-bold text-[#12181A] mb-6 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#39AEA9]" />
                Registered Merchant Information
              </h2>

              <div className="space-y-5 text-sm text-[#12181A]/90">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-[#1D5C58] block mb-1 font-mono">
                    Legal Entity Name
                  </span>
                  <p className="font-semibold text-[#12181A]">
                    {MERCHANT_KYC_DETAILS.legalName}
                  </p>
                  <p className="text-xs text-[#557B83] font-mono">
                    Proprietor, {MERCHANT_KYC_DETAILS.businessName}
                  </p>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-[#557B83]/15">
                  <Mail className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#1D5C58] block mb-0.5 font-mono">
                      Official Contact Email
                    </span>
                    <a href={`mailto:${MERCHANT_KYC_DETAILS.officialEmail}`} className="text-[#12181A] hover:text-[#39AEA9] underline font-medium">
                      {MERCHANT_KYC_DETAILS.officialEmail}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-3 border-t border-[#557B83]/15">
                  <Clock className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-[#1D5C58] block mb-0.5 font-mono">
                      Operating Hours
                    </span>
                    <p className="text-[#557B83] text-xs">
                      {MERCHANT_KYC_DETAILS.operatingHours}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Grievance Redressal Card */}
            <div className="glass-panel rounded-2xl p-5 text-xs text-[#557B83] space-y-2 border border-[#557B83]/15">
              <strong className="text-[#12181A] block font-bold font-mono">Grievance & Customer Redressal:</strong>
              <p>For any inquiries or PayU payment assistance, reach our desk directly at <a href={`mailto:${MERCHANT_KYC_DETAILS.officialEmail}`} className="text-[#39AEA9] underline font-medium">{MERCHANT_KYC_DETAILS.officialEmail}</a>. Response within 24 hours.</p>
            </div>
          </div>

          {/* Right Column: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-xl border border-[#557B83]/20">
              <h2 className="text-2xl font-display font-bold text-[#12181A] mb-2">
                Send a Direct Message
              </h2>
              <p className="text-sm text-[#557B83] mb-8">
                Inquire about custom software, IoT prototypes, or request a custom milestone invoice.
              </p>

              {submitted ? (
                <div className="bg-[#39AEA9]/10 border border-[#39AEA9]/30 rounded-2xl p-8 text-center space-y-4 animate-in fade-in">
                  <CheckCircle className="w-12 h-12 text-[#39AEA9] mx-auto" />
                  <h3 className="text-xl font-display font-bold text-[#12181A]">Message Received!</h3>
                  <p className="text-sm text-[#557B83] max-w-md mx-auto">
                    Thank you for reaching out. S. Yaswanth Kumar will review your inquiry and get back to you at your email address within 24 hours.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-6 py-2.5 rounded-2xl btn-turtle-dark text-xs uppercase tracking-wider"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-2 font-mono">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. S. Kumar"
                        className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-2 font-mono">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="name@example.com"
                        className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-2 font-mono">
                      Subject / Service Category
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="e.g. Custom IoT Firmware / Fintech Web App"
                      className="w-full glass-input rounded-xl py-3 px-4 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#12181A] mb-2 font-mono">
                      Project Details / Message *
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Please describe your requirements, timeline, or product inquiry..."
                      className="w-full glass-input rounded-xl py-3 px-4 text-sm resize-y"
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-primary flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4 text-white" />
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
