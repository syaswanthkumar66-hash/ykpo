import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { subscribeToPush, savePushSubscription } from '../utils/push';
import { 
  ArrowLeft, 
  User, 
  ShieldAlert, 
  Activity, 
  Globe, 
  Bell, 
  Send, 
  CheckCircle2, 
  MessageSquare, 
  Mail, 
  CreditCard, 
  Lock, 
  Search, 
  Download, 
  Check, 
  RefreshCw, 
  AlertCircle,
  TrendingUp,
  XCircle,
  Clock,
  ExternalLink,
  ShieldCheck,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface VisitorEntry {
  id: string;
  user_agent?: string;
  userAgent?: string;
  path: string;
  created_at?: string;
  timestamp?: string;
}

interface MessageEntry {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at?: string;
  timestamp?: string;
  status?: string;
}

interface PaymentEntry {
  id: string;
  txnid: string;
  amount: number;
  product: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: 'success' | 'failure' | 'pending' | 'initiated';
  payment_mode: string;
  bank_ref_num?: string;
  mihpayid?: string;
  hash_verified?: boolean;
  created_at: string;
  updated_at: string;
}

interface PaymentMetrics {
  totalRevenue: number;
  totalCount: number;
  successCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
}

export default function ControlPanel() {
  const [activeTab, setActiveTab] = useState<'messages' | 'visitors' | 'push' | 'payments'>('payments');
  const [visitors, setVisitors] = useState<VisitorEntry[]>([]);
  const [messages, setMessages] = useState<MessageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PayU Security Gate State
  const [adminEmailInput, setAdminEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(() => localStorage.getItem('payu_admin_token'));
  const [otpStep, setOtpStep] = useState<'email' | 'otp' | 'unlocked'>('email');
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [gateSuccessMsg, setGateSuccessMsg] = useState<string | null>(null);

  // Payment Dashboard Data
  const [payments, setPayments] = useState<PaymentEntry[]>([]);
  const [metrics, setMetrics] = useState<PaymentMetrics>({
    totalRevenue: 0,
    totalCount: 0,
    successCount: 0,
    failedCount: 0,
    pendingCount: 0,
    successRate: 0
  });
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failure' | 'pending'>('all');
  const [selectedTxn, setSelectedTxn] = useState<PaymentEntry | null>(null);

  // Live Deliverability / Mail-Tester Test Modal State
  const [showTestMailModal, setShowTestMailModal] = useState(false);
  const [testEmailInput, setTestEmailInput] = useState('');
  const [testFromInput, setTestFromInput] = useState('YK Yash <auth@verify.ykyash.in>');
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<any>(null);
  const [testEmailError, setTestEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (adminSessionToken) {
      setOtpStep('unlocked');
    }
  }, [adminSessionToken]);

  // Load General Supabase Data (Messages / Visitors)
  useEffect(() => {
    setLoading(true);

    if (activeTab === 'visitors') {
      if (supabase) {
        supabase
          .from('visitors')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
          .then(({ data, error }) => {
            if (error) {
              console.warn('Fetch visitors note:', error.message);
            } else if (data) {
              setVisitors(data as VisitorEntry[]);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else if (activeTab === 'messages') {
      if (supabase) {
        supabase
          .from('inquiries')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
          .then(({ data, error }) => {
            if (error) {
              console.warn('Fetch messages note:', error.message);
            } else if (data) {
              setMessages(data as MessageEntry[]);
            }
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  // Fetch PayU Transactions when unlocked
  const fetchPayUTransactions = async () => {
    if (!adminSessionToken) return;
    setPaymentsLoading(true);
    try {
      const res = await fetch('/api/admin/payu-transactions', {
        headers: {
          'Authorization': `Bearer ${adminSessionToken}`
        }
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('payu_admin_token');
          setAdminSessionToken(null);
          setOtpStep('email');
          setGateError('Security session expired. Please re-authenticate.');
        } else {
          throw new Error(data.error || 'Failed to load PayU transactions');
        }
        return;
      }
      setPayments(data.transactions || []);
      setMetrics(data.metrics || {
        totalRevenue: 0,
        totalCount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
        successRate: 0
      });
    } catch (err: any) {
      console.error('Fetch transactions error:', err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'payments' && otpStep === 'unlocked') {
      fetchPayUTransactions();
    }
  }, [activeTab, otpStep]);

  // Step 1: Request Security Passkey OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateLoading(true);
    setGateError(null);
    setGateSuccessMsg(null);

    try {
      const res = await fetch('/api/admin/payu-auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmailInput.trim() })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch passkey email.');
      }

      setChallengeToken(data.challengeToken);
      setGateSuccessMsg(data.message || 'Security passkey sent to your email.');
      setOtpStep('otp');
    } catch (err: any) {
      setGateError(err.message);
    } finally {
      setGateLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateLoading(true);
    setGateError(null);

    try {
      const res = await fetch('/api/admin/payu-auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: adminEmailInput.trim(),
          otp: otpInput.trim(),
          challengeToken
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification passkey incorrect or expired.');
      }

      localStorage.setItem('payu_admin_token', data.token);
      setAdminSessionToken(data.token);
      setOtpStep('unlocked');
      setGateSuccessMsg(null);

      // Auto-subscribe Admin device to Push Notifications for background payment alerts
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          subscribeToPush(true).then(sub => {
            if (sub) savePushSubscription(sub, adminEmailInput.trim()).catch(console.error);
          }).catch(console.error);
        } else if (Notification.permission === 'default') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              subscribeToPush(true).then(sub => {
                if (sub) savePushSubscription(sub, adminEmailInput.trim()).catch(console.error);
              }).catch(console.error);
            }
          });
        }
      }
    } catch (err: any) {
      setGateError(err.message);
    } finally {
      setGateLoading(false);
    }
  };

  const handleLogoutAdmin = () => {
    localStorage.removeItem('payu_admin_token');
    setAdminSessionToken(null);
    setOtpStep('email');
    setOtpInput('');
    setAdminEmailInput('');
  };

  // Filter transactions
  const filteredPayments = payments.filter((txn) => {
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesStatus;

    const matchesSearch = 
      txn.txnid?.toLowerCase().includes(query) ||
      txn.customer_name?.toLowerCase().includes(query) ||
      txn.customer_email?.toLowerCase().includes(query) ||
      txn.product?.toLowerCase().includes(query) ||
      txn.bank_ref_num?.toLowerCase().includes(query) ||
      txn.mihpayid?.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredPayments.length === 0) return;

    const headers = ['TXN ID', 'Product', 'Amount (INR)', 'Customer Name', 'Customer Email', 'Customer Phone', 'Status', 'Bank Ref No', 'PayU Money ID', 'Hash Verified', 'Date'];
    const rows = filteredPayments.map(p => [
      p.txnid,
      `"${p.product || ''}"`,
      p.amount,
      `"${p.customer_name || ''}"`,
      p.customer_email || '',
      p.customer_phone || '',
      p.status,
      p.bank_ref_num || '',
      p.mihpayid || '',
      p.hash_verified ? 'YES' : 'NO',
      p.created_at ? new Date(p.created_at).toLocaleString() : ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PayU_Transactions_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send live test email to any test/dummy address (Mail-Tester, Mailtrap, etc.)
  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestEmailLoading(true);
    setTestEmailError(null);
    setTestEmailResult(null);

    try {
      const res = await fetch('/api/admin/payu-auth/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          targetEmail: testEmailInput.trim(),
          customFrom: testFromInput
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch test email.');
      }
      setTestEmailResult(data);
    } catch (err: any) {
      setTestEmailError(err.message);
    } finally {
      setTestEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFB] text-[#12181A] font-sans relative">
      {/* Dynamic Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-br from-[#39AEA9]/10 via-[#A2D5AB]/15 to-transparent rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#557B83]/15 sticky top-0 z-50 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-[#557B83]/10 rounded-full transition-colors text-[#12181A]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold font-display text-[#12181A] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#39AEA9]" />
              Merchant Control Panel
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs font-mono font-medium text-[#557B83] bg-white px-3 py-1.5 rounded-full border border-[#557B83]/20 shadow-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Supabase Live
            </div>
            {otpStep === 'unlocked' && (
              <button
                onClick={handleLogoutAdmin}
                className="text-xs text-red-600 hover:text-red-700 bg-red-50 border border-red-200 px-3 py-1.5 rounded-full transition-colors font-medium cursor-pointer"
              >
                Lock PayU Gate
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer text-xs font-mono uppercase tracking-wider ${
              activeTab === 'payments' 
                ? 'bg-[#12181A] text-white shadow-md' 
                : 'bg-white text-[#557B83] hover:text-[#12181A] hover:bg-white/90 border border-[#557B83]/15 shadow-xs'
            }`}
          >
            <CreditCard className="w-4 h-4 text-[#39AEA9]" />
            PayU Transactions & Analytics
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer text-xs font-mono uppercase tracking-wider ${
              activeTab === 'messages' 
                ? 'bg-[#12181A] text-white shadow-md' 
                : 'bg-white text-[#557B83] hover:text-[#12181A] hover:bg-white/90 border border-[#557B83]/15 shadow-xs'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#39AEA9]" />
            Contact Messages
          </button>
          <button
            onClick={() => setActiveTab('visitors')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer text-xs font-mono uppercase tracking-wider ${
              activeTab === 'visitors' 
                ? 'bg-[#12181A] text-white shadow-md' 
                : 'bg-white text-[#557B83] hover:text-[#12181A] hover:bg-white/90 border border-[#557B83]/15 shadow-xs'
            }`}
          >
            <Activity className="w-4 h-4 text-[#39AEA9]" />
            Website Visitors
          </button>
          <button
            onClick={() => setActiveTab('push')}
            className={`px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer text-xs font-mono uppercase tracking-wider ${
              activeTab === 'push' 
                ? 'bg-[#12181A] text-white shadow-md' 
                : 'bg-white text-[#557B83] hover:text-[#12181A] hover:bg-white/90 border border-[#557B83]/15 shadow-xs'
            }`}
          >
            <Bell className="w-4 h-4 text-[#39AEA9]" />
            Push Notifications
          </button>
        </div>

        {/* Tab 1: PayU Transactions & Analytics */}
        {activeTab === 'payments' && (
          <div>
            {otpStep !== 'unlocked' ? (
              /* Security Gate Modal / Card */
              <div 
                className="max-w-md mx-auto rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center"
                style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a' }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1D5C58] to-[#39AEA9] p-[1.5px] mx-auto flex items-center justify-center shadow-md">
                  <div className="w-full h-full bg-[#12181A] rounded-2xl flex items-center justify-center">
                    <Lock className="w-8 h-8 text-[#39AEA9]" />
                  </div>
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-mono uppercase tracking-wider mb-2.5 border border-emerald-200 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted Admin Passkey
                  </div>
                  <h2 
                    className="text-2xl font-display font-extrabold tracking-tight"
                    style={{ color: '#0f172a' }}
                  >
                    Unlock PayU Financial Ledger
                  </h2>
                  <p 
                    className="text-xs mt-1.5 max-w-xs mx-auto leading-relaxed font-medium"
                    style={{ color: '#475569' }}
                  >
                    Enter the authorized administrator email configured in server environment to receive a secure single-use passkey.
                  </p>
                </div>

                {gateError && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{gateError}</span>
                  </div>
                )}

                {gateSuccessMsg && (
                  <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>{gateSuccessMsg}</span>
                  </div>
                )}

                {otpStep === 'email' ? (
                  <form onSubmit={handleRequestOtp} className="space-y-4 text-left">
                    <div>
                      <label 
                        className="block text-xs font-mono font-bold mb-1.5 uppercase tracking-wider"
                        style={{ color: '#334155' }}
                      >
                        Admin Email Address
                      </label>
                      <input
                        type="email"
                        value={adminEmailInput}
                        onChange={(e) => setAdminEmailInput(e.target.value)}
                        placeholder="e.g. syaswanthkumar2006@gmail.com"
                        required
                        className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#39AEA9] transition-all"
                        style={{ backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={gateLoading}
                      className="w-full py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#1D5C58] to-[#39AEA9] hover:from-[#164845] hover:to-[#2F938F] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {gateLoading ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" /> Verifying Deliverability...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" /> Send Secure OTP Passkey
                        </>
                      )}
                    </button>

                    {/* Test Deliverability / Mail-Tester Score Tool */}
                    <div className="pt-3 border-t border-slate-200 text-center">
                      <button
                        type="button"
                        onClick={() => setShowTestMailModal(true)}
                        className="text-[11px] text-[#1D5C58] hover:text-[#39AEA9] font-mono font-bold flex items-center justify-center gap-1.5 mx-auto transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-[#39AEA9]" /> Test Deliverability / Mail-Tester Score
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp} className="space-y-4 text-left">
                    <div>
                      <label 
                        className="block text-xs font-mono font-bold mb-1.5 uppercase tracking-wider"
                        style={{ color: '#334155' }}
                      >
                        Enter 6-Digit Passkey
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otpInput}
                        onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full rounded-xl px-4 py-3 text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-[#39AEA9] transition-all"
                        style={{ backgroundColor: '#f8fafc', border: '1.5px solid #cbd5e1', color: '#0f172a' }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setOtpStep('email')}
                        className="w-1/3 py-3 rounded-xl border border-slate-300 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 text-xs font-mono font-bold transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={gateLoading || otpInput.length < 6}
                        className="w-2/3 py-3.5 px-6 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#1D5C58] to-[#39AEA9] hover:from-[#164845] hover:to-[#2F938F] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {gateLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Unlock Ledger
                      </button>
                    </div>
                  </form>
                )}
              </div>
            ) : (
              /* Unlocked PayU Transactions Dashboard */
              <div className="space-y-6">
                
                {/* 4 Analytics Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Revenue Card */}
                  <div className="bg-white border border-[#557B83]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between text-[#557B83] text-xs font-mono mb-2">
                      <span>GROSS SETTLED REVENUE</span>
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#12181A]">
                      ₹{metrics.totalRevenue.toLocaleString('en-IN')} <span className="text-xs text-[#557B83] font-normal">INR</span>
                    </div>
                    <p className="text-[11px] text-emerald-700 font-medium mt-2 flex items-center gap-1 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PayU Confirmed Volume
                    </p>
                  </div>

                  {/* Successful Orders Card */}
                  <div className="bg-white border border-[#557B83]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between text-[#557B83] text-xs font-mono mb-2">
                      <span>SUCCESSFUL ORDERS</span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#12181A]">
                      {metrics.successCount} <span className="text-xs text-[#557B83] font-normal">orders</span>
                    </div>
                    <p className="text-[11px] text-[#557B83] mt-2 font-mono">
                      {metrics.successRate}% Success conversion rate
                    </p>
                  </div>

                  {/* Failed Orders Card */}
                  <div className="bg-white border border-[#557B83]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between text-[#557B83] text-xs font-mono mb-2">
                      <span>FAILED / DECLINED</span>
                      <XCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#12181A]">
                      {metrics.failedCount} <span className="text-xs text-[#557B83] font-normal">failed</span>
                    </div>
                    <p className="text-[11px] text-red-600 font-medium mt-2 font-mono">
                      Bank drops / user cancellations
                    </p>
                  </div>

                  {/* Total Inquiries / Initiated */}
                  <div className="bg-white border border-[#557B83]/20 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                    <div className="flex items-center justify-between text-[#557B83] text-xs font-mono mb-2">
                      <span>ALL SESSIONS</span>
                      <Activity className="w-4 h-4 text-[#39AEA9]" />
                    </div>
                    <div className="text-2xl sm:text-3xl font-display font-extrabold text-[#12181A]">
                      {metrics.totalCount} <span className="text-xs text-[#557B83] font-normal">total</span>
                    </div>
                    <p className="text-[11px] text-[#557B83] mt-2 font-mono">
                      {metrics.pendingCount} pending / in-progress
                    </p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white border border-[#557B83]/20 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs">
                  <div className="relative w-full md:w-96">
                    <Search className="w-4 h-4 text-[#557B83] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search TXN ID, Customer, Email, Product..."
                      className="w-full bg-[#F8FAFB] border border-[#557B83]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-[#12181A] placeholder:text-[#557B83]/50 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
                    {/* Status Filter buttons */}
                    <div className="flex bg-[#F8FAFB] border border-[#557B83]/15 rounded-xl p-1 text-xs font-mono">
                      {(['all', 'success', 'failure', 'pending'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1 rounded-lg capitalize transition-all cursor-pointer ${
                            statusFilter === st ? 'bg-[#12181A] text-white font-bold shadow-xs' : 'text-[#557B83] hover:text-[#12181A]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleExportCSV}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-[#F8FAFB] border border-[#557B83]/20 text-xs font-mono text-[#12181A] transition-colors cursor-pointer shadow-xs"
                      title="Download CSV report"
                    >
                      <Download className="w-3.5 h-3.5 text-[#39AEA9]" />
                      <span className="hidden sm:inline font-medium">Export CSV</span>
                    </button>

                    <button
                      onClick={fetchPayUTransactions}
                      disabled={paymentsLoading}
                      className="p-2 rounded-xl bg-white hover:bg-[#F8FAFB] border border-[#557B83]/20 text-[#12181A] transition-colors cursor-pointer disabled:opacity-50 shadow-xs"
                      title="Refresh data"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-[#39AEA9] ${paymentsLoading ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Transactions Table */}
                <div className="bg-white border border-[#557B83]/20 rounded-2xl overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-[#557B83]/15 bg-[#F8FAFB] text-[#557B83]">
                          <th className="py-3 px-4 font-semibold">Transaction ID</th>
                          <th className="py-3 px-4 font-semibold">Product / Item</th>
                          <th className="py-3 px-4 font-semibold">Amount</th>
                          <th className="py-3 px-4 font-semibold">Customer</th>
                          <th className="py-3 px-4 font-semibold">Status</th>
                          <th className="py-3 px-4 font-semibold">Bank Ref / Hash</th>
                          <th className="py-3 px-4 font-semibold">Timestamp</th>
                          <th className="py-3 px-4 font-semibold text-right">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#557B83]/10">
                        {paymentsLoading ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-[#557B83]">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#39AEA9]" />
                              Loading latest PayU transactions...
                            </td>
                          </tr>
                        ) : filteredPayments.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="text-center py-12 text-[#557B83]">
                              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#39AEA9]" />
                              No transactions match the filter.
                            </td>
                          </tr>
                        ) : (
                          filteredPayments.map((txn) => (
                            <tr key={txn.id || txn.txnid} className="hover:bg-[#F8FAFB] transition-colors">
                              <td className="py-3.5 px-4 font-bold text-[#12181A] select-all">
                                {txn.txnid}
                              </td>
                              <td className="py-3.5 px-4 max-w-[200px] truncate text-[#557B83]" title={txn.product}>
                                {txn.product || 'Digital License'}
                              </td>
                              <td className="py-3.5 px-4 font-bold text-[#12181A]">
                                ₹{txn.amount?.toLocaleString('en-IN')}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-[#12181A] font-medium">{txn.customer_name || 'N/A'}</div>
                                <div className="text-[10px] text-[#557B83] truncate max-w-[150px]">{txn.customer_email}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                {txn.status === 'success' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> SUCCESS
                                  </span>
                                ) : txn.status === 'failure' ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-300 text-[10px] font-bold">
                                    <XCircle className="w-3 h-3 text-red-600" /> FAILED
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                    <Clock className="w-3 h-3 text-amber-600" /> PENDING
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-[#12181A]">{txn.bank_ref_num || txn.mihpayid || '—'}</div>
                                {txn.hash_verified && (
                                  <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-0.5">
                                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> SHA-512 Verified
                                  </span>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-[#557B83] text-[11px]">
                                {txn.created_at ? new Date(txn.created_at).toLocaleString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : 'Just now'}
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setSelectedTxn(txn)}
                                  className="px-2.5 py-1 rounded-lg bg-[#F8FAFB] hover:bg-white border border-[#557B83]/20 text-[#12181A] font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Inspect Transaction Modal */}
                {selectedTxn && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div className="bg-white border border-[#557B83]/25 rounded-3xl p-6 max-w-lg w-full text-left font-mono text-xs space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-[#557B83]/15 pb-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-[#39AEA9]" />
                          <h3 className="font-bold text-[#12181A] text-sm">Transaction Audit #{selectedTxn.txnid}</h3>
                        </div>
                        <button
                          onClick={() => setSelectedTxn(null)}
                          className="p-1 rounded-full hover:bg-[#557B83]/10 text-[#557B83] hover:text-[#12181A] cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="space-y-2.5 bg-[#F8FAFB] p-4 rounded-2xl border border-[#557B83]/10">
                        <div className="flex justify-between"><span className="text-[#557B83]">Product:</span><span className="text-[#12181A] font-bold">{selectedTxn.product}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Amount:</span><span className="text-[#12181A] font-bold">₹{selectedTxn.amount} INR</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Customer Name:</span><span className="text-[#12181A] font-medium">{selectedTxn.customer_name}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Customer Email:</span><span className="text-[#12181A]">{selectedTxn.customer_email}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Customer Phone:</span><span className="text-[#12181A]">{selectedTxn.customer_phone || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Settlement Status:</span><span className="text-emerald-700 font-bold uppercase">{selectedTxn.status}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Bank Ref / mihpayid:</span><span className="text-[#12181A]">{selectedTxn.bank_ref_num || selectedTxn.mihpayid || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Reverse Hash:</span><span className={selectedTxn.hash_verified ? 'text-emerald-700 font-medium' : 'text-amber-700'}>{selectedTxn.hash_verified ? 'YES (SHA-512 Valid)' : 'Standard'}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Payment Route:</span><span className="text-[#12181A]">{selectedTxn.payment_mode}</span></div>
                        <div className="flex justify-between"><span className="text-[#557B83]">Date:</span><span className="text-[#12181A]">{selectedTxn.created_at ? new Date(selectedTxn.created_at).toLocaleString() : 'N/A'}</span></div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => setSelectedTxn(null)}
                          className="px-5 py-2.5 rounded-xl bg-[#12181A] text-white font-bold hover:bg-[#1D5C58] transition-colors cursor-pointer text-xs uppercase tracking-wider"
                        >
                          Close Audit
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

        {/* Live Deliverability & Spam Score Tester Modal (Accessible across all views) */}
        {showTestMailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="bg-white border border-[#557B83]/25 rounded-3xl p-6 sm:p-8 max-w-md w-full text-left font-mono text-xs space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#557B83]/15 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#39AEA9]" />
                  <h3 className="font-bold text-[#12181A] text-sm">Deliverability & Test Mail Dispatch</h3>
                </div>
                <button
                  onClick={() => {
                    setShowTestMailModal(false);
                    setTestEmailResult(null);
                    setTestEmailError(null);
                  }}
                  className="p-1 rounded-full hover:bg-[#557B83]/10 text-[#557B83] hover:text-[#12181A] cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-[#557B83] leading-relaxed font-sans text-xs">
                Enter your test recipient email address (e.g. personal email or <strong className="text-[#1D5C58]">mail-tester.com</strong>) to verify live delivery:
              </p>

              <form onSubmit={handleSendTestEmail} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] uppercase text-[#557B83] font-bold mb-1">Target Recipient Email Address</label>
                  <input
                    type="email"
                    value={testEmailInput}
                    onChange={(e) => setTestEmailInput(e.target.value)}
                    placeholder="Enter recipient email (e.g. you@example.com)"
                    required
                    className="w-full bg-[#F8FAFB] border border-[#557B83]/25 rounded-xl px-4 py-2.5 text-xs text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase text-[#557B83] font-bold mb-1">From Sender Address</label>
                  <select
                    value={testFromInput}
                    onChange={(e) => setTestFromInput(e.target.value)}
                    className="w-full bg-[#F8FAFB] border border-[#557B83]/25 rounded-xl px-3 py-2 text-xs text-[#12181A] focus:outline-none focus:border-[#39AEA9] focus:bg-white font-mono cursor-pointer"
                  >
                    <option value="YK Yash <auth@verify.ykyash.in>">YK Yash &lt;auth@verify.ykyash.in&gt; (Custom Domain)</option>
                    <option value="YK Yash <onboarding@resend.dev>">YK Yash &lt;onboarding@resend.dev&gt; (Resend Sandbox)</option>
                  </select>
                  <p className="text-[10px] text-[#557B83] mt-1 font-sans">
                    {testFromInput.includes('resend.dev') 
                      ? '⚠️ Resend Sandbox can only deliver to your registered Resend account email.' 
                      : '✅ Custom domain sends to any inbox once DNS records are verified.'}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={testEmailLoading}
                  className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-[#1D5C58] to-[#39AEA9] hover:from-[#164845] hover:to-[#2F938F] text-white shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {testEmailLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispatching Test Email...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send Test Email
                    </>
                  )}
                </button>
              </form>

              {testEmailError && (
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs space-y-2 text-left">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>Dispatch Failed</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-red-700 font-sans">
                    {testEmailError}
                  </p>
                  {testEmailResult?.details?.helpHint && (
                    <div className="p-2.5 rounded-xl bg-white border border-red-200 text-[11px] font-mono text-slate-800">
                      <strong>💡 Diagnosis:</strong> {testEmailResult.details.helpHint}
                    </div>
                  )}
                </div>
              )}

              {testEmailResult && testEmailResult.success && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{testEmailResult.spamAudit?.rating || 'DISPATCHED SUCCESSFULLY'}</span>
                  </div>
                  <div className="text-[11px] text-[#12181A] space-y-1">
                    <div>• <strong>Internal Spam Score:</strong> {testEmailResult.spamAudit?.score} / 10.0 (Safe threshold &lt; 2.0)</div>
                    <div>• <strong>Delivered To:</strong> {testEmailResult.deliveredTo}</div>
                    <div>• <strong>Sender Address Used:</strong> {testEmailResult.usedSender || 'Resend Default'}</div>
                    {testEmailResult.emailId && <div>• <strong>Resend Message ID:</strong> {testEmailResult.emailId}</div>}
                  </div>
                  <p className="text-[10px] text-emerald-700 pt-1 font-medium">
                    Now check your score on Mail-Tester or open your mailbox to verify inbox placement!
                  </p>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Tab 2: Contact Messages */}
        {activeTab === 'messages' && (
          <div className="bg-white border border-[#557B83]/20 rounded-2xl p-6 shadow-xs">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="animate-spin text-[#39AEA9] w-8 h-8" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-[#557B83]">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#39AEA9]" />
                <p className="font-mono text-sm">No contact messages yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((entry) => (
                  <div key={entry.id} className="p-5 rounded-2xl border bg-[#F8FAFB] border-[#557B83]/15">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white border border-[#557B83]/20 flex items-center justify-center text-[#39AEA9] shadow-xs">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-[#12181A]">{entry.name}</h4>
                          <a href={`mailto:${entry.email}`} className="text-xs font-mono text-[#39AEA9] hover:underline flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {entry.email}
                          </a>
                        </div>
                      </div>
                      <span className="text-xs font-mono text-[#557B83]">
                        {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-[#12181A] whitespace-pre-wrap leading-relaxed text-sm bg-white p-4 rounded-xl border border-[#557B83]/10">{entry.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Visitors */}
        {activeTab === 'visitors' && (
          <div className="bg-white border border-[#557B83]/20 rounded-2xl p-6 shadow-xs">
            {loading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="animate-spin text-[#39AEA9] w-8 h-8" />
              </div>
            ) : visitors.length === 0 ? (
              <div className="text-center py-12 text-[#557B83]">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30 text-[#39AEA9]" />
                <p className="font-mono text-sm">No visitors recorded yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto font-mono text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#557B83]/15 text-[#557B83]">
                      <th className="pb-3 font-semibold">Path</th>
                      <th className="pb-3 font-semibold">User Agent</th>
                      <th className="pb-3 font-semibold">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#557B83]/10">
                    {visitors.map((entry) => (
                      <tr key={entry.id} className="hover:bg-[#F8FAFB] transition-colors">
                        <td className="py-4 font-bold flex items-center gap-2 text-[#12181A]">
                          <Globe className="w-4 h-4 text-[#39AEA9]" />
                          {entry.path}
                        </td>
                        <td className="py-4 text-[#557B83] max-w-xs truncate" title={entry.user_agent || entry.userAgent}>
                          {entry.user_agent || entry.userAgent}
                        </td>
                        <td className="py-4 text-[#557B83]">
                          {entry.created_at ? new Date(entry.created_at).toLocaleString() : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Push Notifications */}
        {activeTab === 'push' && <PushPanel />}

      </main>
    </div>
  );
}

function PushPanel() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const sendPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setStatusMessage('Fetching subscribers from Supabase...');

    try {
      if (!supabase) throw new Error('Supabase client not initialized');
      const { data: rows, error } = await supabase.from('push_subscriptions').select('*');
      
      if (error) throw error;
      if (!rows || rows.length === 0) {
        setStatus('error');
        setStatusMessage('No subscribers found in database.');
        return;
      }

      setStatusMessage(`Found ${rows.length} subscribers. Broadcasting...`);

      let successCount = 0;
      for (const row of rows) {
        if (row.subscription) {
          try {
            const subData = typeof row.subscription === 'string' ? JSON.parse(row.subscription) : row.subscription;
            await fetch('/api/push/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subscription: subData,
                title: title || 'Message from YK Yash',
                body: body || '',
                url: url || '/'
              }),
            });
            successCount++;
          } catch (e) {
            console.error('Broadcast failed for subscriber', row.id, e);
          }
        }
      }

      setStatus('success');
      setStatusMessage(`Complete. Sent to ${successCount} users.`);
      setTimeout(() => setStatus('idle'), 5000);
      setTitle('');
      setBody('');
      setUrl('');
      
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setStatusMessage(err.message || 'Error occurred while broadcasting.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white border border-[#557B83]/20 rounded-2xl p-6 text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#39AEA9]/10 text-[#39AEA9] flex items-center justify-center mx-auto mb-3">
          <Bell className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-display text-[#12181A]">Broadcast an Update</h2>
        <p className="text-[#557B83] text-xs mt-1">Send a web push notification directly to subscribed devices.</p>
      </div>

      <form onSubmit={sendPush} className="space-y-4 bg-white border border-[#557B83]/20 p-6 rounded-2xl shadow-xs">
        <div>
          <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-2">Notification Title</label>
          <input 
            type="text" 
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="e.g. New Project Published!" 
            required
            className="w-full bg-[#F8FAFB] border border-[#557B83]/25 rounded-xl py-3 px-4 text-sm text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all shadow-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-2">Message Body</label>
          <textarea 
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="e.g. Check out my latest work on..." 
            required
            rows={3}
            className="w-full bg-[#F8FAFB] border border-[#557B83]/25 rounded-xl py-3 px-4 text-sm text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all resize-none shadow-xs"
          />
        </div>
        <div>
          <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-2">Target URL (Optional)</label>
          <input 
            type="text" 
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="e.g. /#projects or https://..." 
            className="w-full bg-[#F8FAFB] border border-[#557B83]/25 rounded-xl py-3 px-4 text-sm text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all font-mono shadow-xs"
          />
        </div>

        {statusMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-mono font-medium ${
            status === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 
            status === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 
            'bg-[#F8FAFB] text-[#557B83] border border-[#557B83]/20'
          }`}>
            {statusMessage}
          </div>
        )}

        <button 
          type="submit"
          disabled={status === 'sending'}
          className="w-full flex items-center justify-center space-x-2 bg-[#12181A] hover:bg-[#1D5C58] text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-50 cursor-pointer shadow-md hover:shadow-lg"
        >
          <Send className="w-4 h-4 text-[#39AEA9]" />
          <span>{status === 'sending' ? 'Sending Broadcast...' : 'Fire Broadcast'}</span>
        </button>
      </form>
    </div>
  );
}
