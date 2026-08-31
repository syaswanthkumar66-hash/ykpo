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
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 bg-olive/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-pistachio p-6 sm:p-8 md:p-10 rounded-2xl w-full max-w-md relative shadow-2xl border border-sage/30 max-h-[90vh] overflow-y-auto"
      >
        <button 
          onClick={closeAuthModal} 
          className="absolute top-4 right-4 text-olive/60 hover:text-olive transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-3 mb-8">
          <img src="/favicon.svg" alt="YK Logo" className="w-8 h-8" />
          <h2 className="font-display text-2xl font-bold text-olive uppercase tracking-widest">
            {authStep === 'email' ? 'Welcome' : authStep === 'code' ? 'Verify' : 'Complete Setup'}
          </h2>
        </div>
        
        {authError && (
          <div className="mb-6 p-3 bg-red-100 border border-red-200 text-red-700 text-sm rounded-2xl font-medium">
            {authError}
          </div>
        )}

        {authStep === 'email' ? (
          <form onSubmit={handleSendCodeLocal} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-olive uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="you@example.com" 
                required
                className="w-full bg-white/60 border border-olive/20 rounded-2xl py-3 px-4 text-olive placeholder:text-olive/40 focus:outline-none focus:border-olive focus:bg-white transition-all font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-olive text-pistachio px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-olive-dark transition-colors disabled:opacity-70"
            >
              <span>{isLoading ? 'Sending...' : 'Send Login Code'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </button>
            <p className="text-xs text-olive/60 text-center font-medium mt-4">
              We'll send a secure one-time code to your email.
            </p>
          </form>
        ) : authStep === 'code' ? (
          <form onSubmit={handleVerifyCodeLocal} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-olive uppercase tracking-widest mb-2">6-Digit Code</label>
              <input 
                type="text" 
                value={authCode}
                onChange={(e) => setAuthCode(e.target.value)}
                placeholder="123456" 
                required
                maxLength={6}
                className="w-full bg-white/60 border border-olive/20 rounded-2xl py-3 px-4 text-olive placeholder:text-olive/40 focus:outline-none focus:border-olive focus:bg-white transition-all font-medium text-center text-2xl tracking-[0.5em]"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-olive text-pistachio px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-olive-dark transition-colors disabled:opacity-70"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify & Login'}</span>
            </button>
            <button 
              type="button"
              onClick={() => { setAuthStep('email'); setAuthCode(''); setAuthName(''); setVerificationToken(''); setAuthError(''); }}
              className="w-full text-xs text-olive/80 hover:text-olive font-bold uppercase tracking-widest text-center mt-4 transition-colors"
            >
              Use a different email
            </button>
          </form>
        ) : (
          <form onSubmit={handleCompleteSignup} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-olive uppercase tracking-widest mb-2">Your Name</label>
              <input 
                type="text" 
                value={authName}
                onChange={(e) => setAuthName(e.target.value)}
                placeholder="John Doe" 
                required
                className="w-full bg-white/60 border border-olive/20 rounded-2xl py-3 px-4 text-olive placeholder:text-olive/40 focus:outline-none focus:border-olive focus:bg-white transition-all font-medium"
              />
            </div>
            <button 
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 bg-olive text-pistachio px-6 py-4 rounded-2xl font-bold uppercase tracking-widest hover:bg-olive-dark transition-colors disabled:opacity-70"
            >
              <span>{isLoading ? 'Completing...' : 'Create Account'}</span>
            </button>
            <p className="text-xs text-olive/60 text-center font-medium mt-4">
              Just one last step to set up your profile!
            </p>
          </form>
        )}
      </motion.div>
    </div>
  );
}
