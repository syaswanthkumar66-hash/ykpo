import React, { useState } from 'react';
import { ArrowLeft, Copy, Check, FileText, Code, ShieldCheck, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  markdownContent: string;
  children: React.ReactNode;
}

export function LegalLayout({ title, lastUpdated, markdownContent, children }: LegalLayoutProps) {
  const [viewMode, setViewMode] = useState<'rendered' | 'markdown' | 'html'>('rendered');
  const [copied, setCopied] = useState(false);

  const getHtmlContent = () => {
    return `<article class="legal-document">
  <h1>${title}</h1>
  <p><em>Last Updated: ${lastUpdated}</em></p>
  <div>
${markdownContent
  .split('\n\n')
  .map(p => `    <p>${p.replace(/\n/g, '<br/>')}</p>`)
  .join('\n')}
  </div>
</article>`;
  };

  const handleCopy = () => {
    const textToCopy = viewMode === 'html' ? getHtmlContent() : markdownContent;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen text-[#12181A] bg-white pt-28 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Ambient Glow */}
      <div className="absolute top-24 left-1/3 w-[500px] h-[500px] bg-[#39AEA9]/10 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        
        {/* Back Link & Quick Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#557B83] hover:text-[#12181A] transition-colors font-mono"
          >
            <ArrowLeft className="w-4 h-4 text-[#39AEA9]" /> Back to Home
          </Link>

          {/* Quick Legal Switcher Links */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-[#557B83] font-mono">
            <Link to="/terms" className="hover:text-[#12181A] px-3 py-1 rounded-xl glass-panel">Terms</Link>
            <Link to="/privacy" className="hover:text-[#12181A] px-3 py-1 rounded-xl glass-panel">Privacy</Link>
            <Link to="/refund" className="hover:text-[#12181A] px-3 py-1 rounded-xl glass-panel">Refund</Link>
            <Link to="/delivery" className="hover:text-[#12181A] px-3 py-1 rounded-xl glass-panel">Delivery</Link>
            <Link to="/contact" className="hover:text-[#12181A] px-3 py-1 rounded-xl glass-panel">Contact</Link>
          </div>
        </div>

        {/* Document Glassmorphic Container */}
        <div className="glass-panel rounded-3xl p-6 sm:p-10 shadow-xl relative border border-[#557B83]/20">
          
          {/* Header */}
          <div className="border-b border-[#557B83]/15 pb-6 mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#39AEA9]/15 border border-[#39AEA9]/30 text-[#1D5C58] text-xs font-bold font-mono mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-[#39AEA9]" /> Compliance & Legal Policy Document
              </div>
              <h1 className="text-2xl sm:text-4xl font-display font-bold text-[#12181A]">
                {title}
              </h1>
              <p className="text-xs text-[#557B83] mt-1 font-mono">
                Last Updated: {lastUpdated} • Official Domain: <span className="text-[#12181A] font-bold">ykyash.in</span>
              </p>
            </div>

            {/* Action Bar (View Switcher & Copy) */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <div className="bg-[#F4F8F7] border border-[#557B83]/20 rounded-xl p-1 flex items-center gap-1">
                <button
                  onClick={() => setViewMode('rendered')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'rendered' ? 'bg-[#12181A] text-white font-bold' : 'text-[#557B83] hover:text-[#12181A]'
                  }`}
                >
                  Document
                </button>
                <button
                  onClick={() => setViewMode('markdown')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'markdown' ? 'bg-[#12181A] text-white font-bold' : 'text-[#557B83] hover:text-[#12181A]'
                  }`}
                >
                  Raw MD
                </button>
                <button
                  onClick={() => setViewMode('html')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'html' ? 'bg-[#12181A] text-white font-bold' : 'text-[#557B83] hover:text-[#12181A]'
                  }`}
                >
                  HTML
                </button>
              </div>

              <button
                onClick={handleCopy}
                className="p-2.5 rounded-xl bg-white border border-[#557B83]/20 text-[#12181A] hover:bg-[#F4F8F7] transition-colors cursor-pointer"
                title="Copy content to clipboard"
              >
                {copied ? <Check className="w-4 h-4 text-[#39AEA9]" /> : <Copy className="w-4 h-4" />}
              </button>

              <button
                onClick={handlePrint}
                className="p-2.5 rounded-xl bg-white border border-[#557B83]/20 text-[#12181A] hover:bg-[#F4F8F7] transition-colors cursor-pointer"
                title="Print policy"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content Area */}
          {viewMode === 'rendered' && (
            <div className="prose prose-slate max-w-none text-[#12181A]/90 leading-relaxed space-y-6 text-sm sm:text-base">
              {children}
            </div>
          )}

          {viewMode === 'markdown' && (
            <div className="bg-[#F4F8F7] rounded-2xl p-4 sm:p-6 border border-[#557B83]/20 font-mono text-xs text-[#1D5C58] whitespace-pre-wrap overflow-x-auto select-all max-h-[600px] overflow-y-auto">
              {markdownContent}
            </div>
          )}

          {viewMode === 'html' && (
            <div className="bg-[#F4F8F7] rounded-2xl p-4 sm:p-6 border border-[#557B83]/20 font-mono text-xs text-[#12181A] whitespace-pre-wrap overflow-x-auto select-all max-h-[600px] overflow-y-auto">
              {getHtmlContent()}
            </div>
          )}

          {/* Verification Badge */}
          <div className="mt-12 pt-6 border-t border-[#557B83]/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#557B83] font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#39AEA9]" />
              <span>Compliant with Indian IT Act (SPDI) & RBI Guidelines</span>
            </div>
            <div>
              <span>Official: <a href="mailto:contact@ykyash.in" className="text-[#12181A] underline">contact@ykyash.in</a></span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
