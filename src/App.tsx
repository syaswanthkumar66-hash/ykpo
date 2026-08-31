import React, { useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Cpu, 
  Globe, 
  Code2, 
  ArrowRight, 
  ShoppingBag, 
  ShieldCheck, 
  Sparkles, 
  Check, 
  CreditCard, 
  Zap, 
  Download, 
  Layers, 
  Server, 
  ExternalLink,
  ChevronRight,
  MessageSquare
} from 'lucide-react';

import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import Services from './pages/Services';
import Projects from './pages/Projects';
import Contact from './pages/Contact';
import Terms from './pages/legal/Terms';
import Privacy from './pages/legal/Privacy';
import Refund from './pages/legal/Refund';
import Delivery from './pages/legal/Delivery';
import { PaymentSuccess, PaymentFailure } from './pages/PaymentStatus';
import ControlPanel from './pages/ControlPanel';

import { SERVICES, PROJECTS, SKILL_CATEGORIES, MERCHANT_KYC_DETAILS } from './data/portfolioData';

function HomePage() {
  return (
    <div className="min-h-screen font-sans relative overflow-hidden bg-white text-[#12181A]">
      
      {/* Dynamic Background Soft Ambient Light Glows */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-gradient-to-br from-[#39AEA9]/10 via-[#A2D5AB]/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[800px] right-[5%] w-[450px] h-[450px] bg-[#E5EFC1]/40 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-[1600px] left-[5%] w-[500px] h-[500px] bg-[#39AEA9]/08 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* 1. Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Glassmorphic Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-mono text-[#12181A] shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[#39AEA9] shadow-[0_0_8px_#39AEA9] animate-ping" />
            <span>S. Yaswanth Kumar (YK Yash) • Full-Stack Dev & IoT Systems Engineer</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-[#12181A] tracking-tight leading-[1.15]">
            Engineering Hardware Telemetry & <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1D5C58] via-[#39AEA9] to-[#557B83]">Modern Digital Software</span>
          </h1>

          <p className="text-[#557B83] text-base sm:text-xl max-w-2xl mx-auto leading-relaxed font-normal">
            Specialized Full-Stack & IoT Systems Engineer architecting real-time embedded microcontroller firmware, resilient cloud backends, and enterprise web solutions with seamless PayU transaction flows.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              to="/projects"
              className="px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-dark flex items-center gap-2.5 cursor-pointer shadow-lg"
            >
              <Cpu className="w-4 h-4 text-[#E5EFC1]" />
              View Featured Projects
            </Link>

            <Link
              to="/services"
              className="px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-glass flex items-center gap-2.5 cursor-pointer shadow-sm"
            >
              <CreditCard className="w-4 h-4 text-[#39AEA9]" />
              Commission & Milestone Pay (PayU)
            </Link>
          </div>

          {/* Metrics / Trust Badges */}
          <div className="pt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-display font-bold text-[#12181A] block">15+</span>
              <span className="text-xs text-[#557B83] uppercase tracking-wider font-mono">Shipped Projects</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-display font-bold text-[#39AEA9] block">PayU Live</span>
              <span className="text-xs text-[#557B83] uppercase tracking-wider font-mono">Integrated Payments</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-display font-bold text-[#1D5C58] block">ESP32 & Web</span>
              <span className="text-xs text-[#557B83] uppercase tracking-wider font-mono">Hardware & Cloud</span>
            </div>
            <div className="glass-panel p-5 rounded-2xl">
              <span className="text-2xl sm:text-3xl font-display font-bold text-[#12181A] block">Full-Stack</span>
              <span className="text-xs text-[#557B83] uppercase tracking-wider font-mono">React & Microservices</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Live ₹1 PayU & UPI Payment Sandbox Verification */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#557B83]/15">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#39AEA9] mb-2 font-mono">
              <Sparkles className="w-3.5 h-3.5" /> Real-Time Payment Testing Engine
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#12181A]">
              ₹1 Live PayU & Direct UPI Gateway Sandbox
            </h2>
          </div>
          <Link
            to="/control-panel"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#39AEA9] hover:text-[#12181A] transition-colors"
          >
            Open PayU Live Ledger <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ₹1 Test Showcase Card */}
        <div className="glass-panel-interactive rounded-3xl p-8 sm:p-12 border-2 border-[#39AEA9]/30 bg-gradient-to-br from-white via-[#F4F8F7] to-[#E5EFC1]/20 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="flex items-center gap-3">
                <span className="px-3.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-[#39AEA9] text-white shadow-sm">
                  ⚡ ₹1 Live Test
                </span>
                <span className="text-xs font-mono text-[#557B83] font-semibold">
                  NPCI UPI Intent • Dynamic QR • SHA-512 Signed
                </span>
              </div>

              <h3 className="text-2xl sm:text-3xl font-display font-extrabold text-[#12181A]">
                Test Real-Time PayU Hosted Checkout & Background WebPush Notifications
              </h3>

              <p className="text-sm text-[#557B83] leading-relaxed">
                Perform a live ₹1.00 transaction to test seamless payment gateway redirection, bank authorization, instant Supabase ledger persistence, and server-dispatched Web Push notification alerts.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-[#12181A]/90 font-mono">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#39AEA9]" />
                  <span>Real-time ₹1.00 PayU Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#39AEA9]" />
                  <span>Reverse SHA-512 Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#39AEA9]" />
                  <span>Live Supabase Ledger Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#39AEA9]" />
                  <span>Instant Server WebPush Notification</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-white border border-[#557B83]/20 shadow-md text-center space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-[#557B83]">Transaction Price</span>
              <div className="text-5xl font-display font-extrabold text-[#1D5C58]">
                ₹1<span className="text-xl font-normal text-[#557B83]">.00</span>
              </div>
              <Link
                to="/services"
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#1D5C58] via-[#39AEA9] to-[#557B83] text-white hover:brightness-105 transition-all shadow-lg flex items-center justify-center gap-2 font-mono"
              >
                <CreditCard className="w-4 h-4" /> Start ₹1 Live PayU Checkout
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. About Me & Engineering Philosophy */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#557B83]/15">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel text-xs font-mono text-[#1D5C58]">
              <span>Electronics & Communication Engineer</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#12181A]">
              Bridging Silicon Hardware with High-Speed Cloud Systems
            </h2>

            <p className="text-[#557B83] text-sm sm:text-base leading-relaxed">
              Based in Visakhapatnam, India, I specialize in architecting full-stack digital products alongside embedded hardware telemetry. Whether implementing sub-second IoT data pipelines on ESP32/STM32 microcontrollers or designing compliant fintech checkouts in React, I focus on clean code, testability, and resilience.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 text-sm text-[#12181A]/90">
                <Check className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
                <span><strong className="text-[#12181A]">Microcontroller Architecture:</strong> FreeRTOS, non-blocking state machines, sensor fusion, and MQTT.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#12181A]/90">
                <Check className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
                <span><strong className="text-[#12181A]">Full-Stack Applications:</strong> Modern React, Next.js, Node.js, and relational database modeling.</span>
              </div>
              <div className="flex items-start gap-3 text-sm text-[#12181A]/90">
                <Check className="w-5 h-5 text-[#39AEA9] shrink-0 mt-0.5" />
                <span><strong className="text-[#12181A]">Payments & Webhooks:</strong> PayU SHA-512 integration, idempotency, and automated digital fulfillment.</span>
              </div>
            </div>
          </div>

          {/* Skills Matrix */}
          <div className="lg:col-span-6 space-y-4">
            {SKILL_CATEGORIES.map((cat, idx) => (
              <div key={idx} className="glass-panel rounded-3xl p-6">
                <h3 className="text-base font-display font-bold text-[#12181A] mb-3">
                  {cat.name}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {cat.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="px-3 py-1.5 rounded-xl text-xs font-mono bg-[#F4F8F7] border border-[#557B83]/20 text-[#1D5C58]">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 4. Projects Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#557B83]/15">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#39AEA9] mb-2 font-mono">
              <Cpu className="w-3.5 h-3.5" /> Case Studies
            </div>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#12181A]">
              Hardware & Web Case Studies
            </h2>
          </div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#39AEA9] hover:text-[#12181A] transition-colors"
          >
            Explore All Projects <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {PROJECTS.slice(0, 2).map((proj) => (
            <div key={proj.id} className="glass-panel-interactive rounded-3xl p-6 sm:p-8">
              <h3 className="text-2xl font-display font-bold text-[#12181A] mb-2">
                {proj.title}
              </h3>
              <p className="text-sm text-[#557B83] mb-4 leading-relaxed">
                {proj.description}
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {proj.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-xs font-mono bg-[#F4F8F7] border border-[#557B83]/20 text-[#1D5C58]">
                    {tag}
                  </span>
                ))}
              </div>
              <Link to="/projects" className="text-xs font-bold uppercase tracking-wider text-[#39AEA9] hover:text-[#12181A] flex items-center gap-1.5">
                Read Case Study <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Contact CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-[#557B83]/15">
        <div className="glass-panel rounded-3xl p-8 sm:p-14 text-center max-w-4xl mx-auto shadow-xl space-y-6 border border-[#39AEA9]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10" />
          
          <div className="w-12 h-12 rounded-2xl bg-[#39AEA9]/15 border border-[#39AEA9]/30 text-[#39AEA9] flex items-center justify-center mx-auto shadow-sm">
            <MessageSquare className="w-6 h-6" />
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#12181A]">
            Ready to Build Your Project or Need Custom Source Code?
          </h2>
          <p className="text-sm sm:text-base text-[#557B83] max-w-xl mx-auto">
            Contact me directly to discuss milestones, Statements of Work, or custom IoT hardware prototyping.
          </p>
          
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/contact"
              className="px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-dark shadow-lg"
            >
              Get In Touch With YK Yash
            </Link>
            <Link
              to="/services"
              className="px-8 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-glass"
            >
              View Service Pricing in INR
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default function App() {
  const location = useLocation();

  // Scroll to top on route navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#12181A]">
      <Navbar />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<Services />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/contact" element={<Contact />} />
          
          {/* PayU Mandatory Legal Pages */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/refund" element={<Refund />} />
          <Route path="/delivery" element={<Delivery />} />
          <Route path="/shipping" element={<Delivery />} />

          {/* Payment Status & Download Handlers */}
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/failure" element={<PaymentFailure />} />

          {/* Admin Control Panel */}
          <Route path="/control-panel" element={<ControlPanel />} />

          {/* Fallback */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
