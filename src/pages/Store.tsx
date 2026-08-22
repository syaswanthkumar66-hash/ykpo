import React, { useState } from 'react';
import { ShoppingBag, Check, ShieldCheck, Sparkles, CreditCard, Zap, AlertCircle, Lock, PackageCheck, Download, Globe } from 'lucide-react';
import { DIGITAL_PRODUCTS } from '../data/portfolioData';
import { DigitalProduct } from '../types';
import { Link } from 'react-router-dom';
import PayUHostedCheckoutModal from '../components/payu/PayUHostedCheckoutModal';

export default function Store() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hostedProduct, setHostedProduct] = useState<DigitalProduct | null>(null);

  const categories = [
    { id: 'all', label: 'All Digital Products' },
    { id: 'testing', label: '⚡ ₹1 Live Test Sandbox' },
    { id: 'template', label: 'Fintech & UI Kits' },
    { id: 'iot', label: 'IoT & ESP32 Firmware' },
    { id: 'web', label: 'Full-Stack SaaS Starters' },
    { id: 'backend', label: 'Payments & Backend' },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? DIGITAL_PRODUCTS
    : DIGITAL_PRODUCTS.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-20 right-10 w-96 h-96 bg-[#39AEA9]/10 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-[#A2D5AB]/15 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-[#1D5C58] text-xs font-bold uppercase tracking-widest mb-4 font-mono shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-[#39AEA9]" /> Official Digital Store
          </div>
          <h1 className="text-3xl sm:text-5xl font-display font-extrabold text-[#12181A] tracking-tight mb-4">
            Production-Grade Code, Firmware & UI Kits
          </h1>
          <p className="text-[#557B83] text-base sm:text-lg">
            Instant digital downloads for developers, startups, and hardware engineers. Fixed INR pricing with full commercial license rights.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#12181A] text-white shadow-md font-extrabold'
                  : 'glass-panel text-[#557B83] hover:text-[#12181A] hover:border-[#39AEA9]/40'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick ₹1 Live Test Sandbox Callout Banner */}
        <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-[#12181A] via-[#1D5C58] to-[#12181A] text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-[#39AEA9]/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#39AEA9]/20 rounded-full blur-3xl -z-1 pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#39AEA9]/20 border border-[#39AEA9]/40 flex items-center justify-center text-[#E5EFC1] shrink-0">
              <Zap className="w-6 h-6 fill-current animate-pulse text-[#E5EFC1]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-[#E5EFC1] text-[#12181A]">
                  ₹1 Live Transaction Sandbox
                </span>
                <span className="text-[11px] text-[#A2D5AB] font-mono">Direct NPCI Live UPI</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Test Real-Time Payment for Just ₹1.00
              </h2>
              <p className="text-xs text-[#E5EFC1]/80 max-w-xl">
                Test PayU Hosted checkout or in-app Custom checkout with instant verification for ₹1.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                const testItem = DIGITAL_PRODUCTS.find(p => p.id === 'prod-test-rupee');
                if (testItem) setHostedProduct(testItem);
              }}
              className="px-4 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs bg-[#E5EFC1] text-[#12181A] hover:bg-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Globe className="w-4 h-4 text-[#1D5C58]" />
              PayU Hosted (₹1)
            </button>
            <button
              onClick={() => {
                const testItem = DIGITAL_PRODUCTS.find(p => p.id === 'prod-test-rupee');
                if (testItem) setCustomProduct(testItem);
              }}
              className="px-4 py-3 rounded-2xl font-bold uppercase tracking-wider text-xs bg-[#39AEA9] text-white hover:bg-white hover:text-[#12181A] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <CreditCard className="w-4 h-4" />
              Custom Hosted (₹1)
            </button>
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="glass-panel-interactive rounded-3xl p-6 sm:p-8 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#39AEA9]/5 rounded-full blur-2xl -z-10" />

              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#39AEA9]/15 text-[#1D5C58] border border-[#39AEA9]/30 font-mono">
                    {product.badge || 'Digital Product'}
                  </span>
                  <div className="text-right">
                    <div className="text-2xl sm:text-3xl font-display font-bold text-[#12181A]">
                      ₹{product.priceINR.toLocaleString('en-IN')}
                    </div>
                    <p className="text-[10px] text-[#557B83] uppercase font-mono">One-time payment (INR)</p>
                  </div>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#12181A] mb-2 group-hover:text-[#39AEA9] transition-colors">
                  {product.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#557B83] mb-6 leading-relaxed">
                  {product.description}
                </p>

                {/* Inclusions Box */}
                <div className="space-y-2 mb-6 bg-[#F4F8F7]/80 p-4 rounded-2xl border border-[#557B83]/15">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#1D5C58] mb-2 font-mono">
                    Package Inclusions:
                  </p>
                  {product.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#12181A]/90">
                      <Check className="w-4 h-4 text-[#39AEA9] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-[#557B83]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-xs text-[#557B83]">
                  <span className="block font-semibold text-[#12181A] font-mono">{product.fileSize}</span>
                  <span className="flex items-center gap-1 text-[11px] text-[#1D5C58] font-bold">
                    <Zap className="w-3 h-3 text-[#39AEA9] fill-current" /> Instant UPI & ZIP Download
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHostedProduct(product)}
                    className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold uppercase tracking-wider text-xs btn-turtle-dark cursor-pointer shadow-md hover:shadow-lg transition-all"
                    title="Pay securely via PayU Official Payment Gateway (UPI, Cards, NetBanking, QR, Wallets)"
                  >
                    <Globe className="w-4 h-4 text-[#E5EFC1]" /> Buy Now (PayU Hosted)
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* PayU Hosted Prebuilt Checkout Modal */}
        <PayUHostedCheckoutModal
          isOpen={Boolean(hostedProduct)}
          onClose={() => setHostedProduct(null)}
          item={hostedProduct}
        />

      </div>
    </div>
  );
}

