import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Copy, Check, Bug } from 'lucide-react';

interface PayUDebugResponseProps {
  rawResponse: any;
  error?: string | null;
}

/**
 * Isolated Debug Component for PayU Server Response
 * Easily removable: Delete this file or remove <PayUDebugResponse /> from the modal.
 */
export function PayUDebugResponse({ rawResponse, error }: PayUDebugResponseProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  if (!rawResponse && !error) return null;

  const formattedJson = typeof rawResponse === 'object' 
    ? JSON.stringify(rawResponse, null, 2) 
    : String(rawResponse || '');

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedJson || String(error));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50/70 p-3 text-xs font-mono shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-amber-900">
          <Bug className="w-4 h-4 text-amber-700" />
          <span>PayU Server Response Log</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            title="Copy response JSON"
            className="p-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-all cursor-pointer flex items-center gap-1 text-[10px]"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-700" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 transition-all cursor-pointer"
          >
            {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-2 space-y-2">
          {error && (
            <div className="p-2 bg-red-100/80 border border-red-200 rounded-lg text-red-800 text-[11px] leading-relaxed">
              <span className="font-bold">Status:</span> {error}
            </div>
          )}
          {formattedJson && (
            <div className="relative max-h-48 overflow-y-auto rounded-lg bg-slate-900 p-2.5 text-[11px] text-emerald-400">
              <pre className="whitespace-pre-wrap break-all">{formattedJson}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
