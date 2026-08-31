import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../supabase';
import { subscribeToPush, savePushSubscription, sendNotificationToUser } from '../utils/push';
import { X, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, user, login, sendCode } = useAuth();
  
  const [authStep, setAuthStep] = useState<'email' | 'code' | 'name'>('email');
  const [authEmail, setAuthEmail] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [authName, setAuthName] = useState('');
  const [tempToken, setTempToken] = useState<{token: string, user: any} | null>(null);
  const [verificationToken, setVerificationToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Reset modal state when it closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setAuthStep('email');
      setAuthCode('');
      setAuthName('');
      setVerificationToken('');
      setAuthError('');
      setTempToken(null);
    }
  }, [isAuthModalOpen]);

  if (!isAuthModalOpen) return null;

  const handleSendCodeLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const data = await sendCode(authEmail);
      setVerificationToken(data.verificationToken);
      setAuthStep('code');
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCodeLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, code: authCode, verificationToken })
      });
      
      const contentType = res.headers.get("content-type");
      if (!contentType || contentType.indexOf("application/json") === -1) {
        throw new Error(`Server returned an unexpected response. Please try again.`);
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      let existingUser = null;
      if (supabase) {
        const { data: userRow } = await supabase
          .from('users')
          .select('*')
          .eq('email', authEmail.toLowerCase())
          .maybeSingle();
        existingUser = userRow;
      }

      if (existingUser) {
        const finalName = existingUser.name || data.user?.name;
        
        await login(authEmail, authCode, verificationToken, finalName);
        
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            subscribeToPush(true).then(async subscription => {
              if (subscription) {
                localStorage.setItem('push_renew_v1', 'true');
                await savePushSubscription(subscription, authEmail);
                if (authEmail.toLowerCase() === 'syaswanthkumar2006@gmail.com') {
                  await sendNotificationToUser(authEmail, 'Admin Login Detected 🛡️', 'You successfully logged into a dashboard device.', '/cp');
                } else {
                  await sendNotificationToUser(authEmail, 'New Device Logged In', `Welcome back, ${finalName || authEmail.split('@')[0]}! A new login was just detected.`, '/');
                }
              }
            }).catch(console.error);
          } else if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted') {
                subscribeToPush(true).then(async subscription => {
                  if (subscription) {
                    localStorage.setItem('push_renew_v1', 'true');
                    await savePushSubscription(subscription, authEmail);
                    if (authEmail.toLowerCase() === 'syaswanthkumar2006@gmail.com') {
                      await sendNotificationToUser(authEmail, 'Admin Login Detected 🛡️', 'You successfully logged into a dashboard device.', '/cp');
                    } else {
                      await sendNotificationToUser(authEmail, 'New Device Logged In', `Welcome back, ${finalName || authEmail.split('@')[0]}! A new login was just detected.`, '/');
                    }
                  }
                }).catch(console.error);
              }
            });
          }
        }
      } else {
        setTempToken({ token: data.token, user: data.user });
        setAuthStep('name');
      }

    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authName.trim()) { setAuthError('Please enter your name.'); return; }
    setIsLoading(true);
    setAuthError('');

    try {
      if (supabase) {
        await supabase.from('users').upsert([{
          email: authEmail.toLowerCase(),
          name: authName.trim(),
          created_at: new Date().toISOString()
        }]);
      }

      if (tempToken) {
        const finalUser = { email: authEmail, name: authName.trim(), token: tempToken.token };
        localStorage.setItem('auth_token', tempToken.token);
        localStorage.setItem('auth_user', JSON.stringify(finalUser));

        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            const subscription = await subscribeToPush(true);
            if (subscription) {
              localStorage.setItem('push_renew_v1', 'true');
              await savePushSubscription(subscription, authEmail);
              await sendNotificationToUser(authEmail, 'Signup Successful', `Welcome to the community, ${finalUser.name}!`, '/');
            }
          } catch (err) { console.error(err); }
        }
      }
      closeAuthModal();
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-[#12181A]/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-6 sm:p-8 md:p-10 rounded-3xl w-full max-w-md relative shadow-2xl border border-[#557B83]/20 max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={closeAuthModal} 
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#557B83]/10 text-[#557B83] hover:text-[#12181A] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#39AEA9] to-[#557B83] p-[1px] shadow-sm">
            <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center text-[#12181A] font-bold text-sm font-display">
              YK
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-[#12181A]">
              {authStep === 'email' ? 'Welcome Back' : authStep === 'code' ? 'Verify Identity' : 'Complete Setup'}
            </h2>
            <p className="text-xs text-[#557B83] font-mono">Passwordless Secure Authentication</p>
          </div>
        </div>
        
        {authError && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            {authError}
          </div>
        )}

        {authStep === 'email' ? (
          <form onSubmit={handleSendCodeLocal} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-1.5">Email Address</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com" 
                required
                className="w-full bg-[#F8FAFB] border border-[#557B83]/30 rounded-xl py-3 px-4 text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all text-sm font-medium shadow-xs"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-[#12181A] hover:bg-[#1D5C58] text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-70 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>{isLoading ? 'Sending Passkey...' : 'Send Login Code'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 text-[#39AEA9]" />}
            </button>
            <p className="text-xs text-[#557B83] text-center font-medium mt-3">
              We'll send a secure one-time single-use code to your email.
            </p>
          </form>
        ) : authStep === 'code' ? (
          <form onSubmit={handleVerifyCodeLocal} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-1.5">6-Digit Passkey</label>
              <input 
                type="text" 
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="123456" 
                required
                maxLength={6}
                className="w-full bg-[#F8FAFB] border border-[#557B83]/30 rounded-xl py-3 px-4 text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all font-mono font-bold text-center text-2xl tracking-[0.4em] shadow-xs"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-[#12181A] hover:bg-[#1D5C58] text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-70 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>{isLoading ? 'Verifying Passkey...' : 'Verify & Sign In'}</span>
            </button>
            <button 
              type="button"
              onClick={() => { setAuthStep('email'); setAuthCode(''); setAuthName(''); setVerificationToken(''); setAuthError(''); }}
              className="w-full text-xs text-[#557B83] hover:text-[#12181A] font-bold uppercase tracking-wider text-center mt-3 transition-colors cursor-pointer"
            >
              ← Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteSignup} className="space-y-5">
            <div>
              <label className="block text-xs font-mono font-bold text-[#557B83] uppercase mb-1.5">Your Full Name</label>
              <input 
                type="text" 
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="Yaswanth Kumar" 
                required
                className="w-full bg-[#F8FAFB] border border-[#557B83]/30 rounded-xl py-3 px-4 text-[#12181A] placeholder:text-[#557B83]/40 focus:outline-none focus:border-[#39AEA9] focus:bg-white transition-all text-sm font-medium shadow-xs"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-[#12181A] hover:bg-[#1D5C58] text-white px-6 py-3.5 rounded-xl font-bold uppercase tracking-wider text-xs transition-colors disabled:opacity-70 cursor-pointer shadow-md hover:shadow-lg"
            >
              <span>{isLoading ? 'Setting up Profile...' : 'Complete Registration'}</span>
            </button>
            <p className="text-xs text-[#557B83] text-center font-medium mt-3">
              One last quick step to personalize your client account.
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
