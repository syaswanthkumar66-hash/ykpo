import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, CreditCard, Bell, BellRing, UserCheck, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToPush, savePushSubscription } from '../utils/push';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [pushLoading, setPushLoading] = useState(false);
  const location = useLocation();
  const { user, openAuthModal, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        setPushStatus('granted');
      } else if (Notification.permission === 'denied') {
        setPushStatus('denied');
      } else {
        setPushStatus('prompt');
      }
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    setPushLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPushStatus('granted');
        const sub = await subscribeToPush(true);
        if (sub) {
          await savePushSubscription(sub, user?.email);
          // Show instant confirmation toast/alert
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Push Notifications Active 🔔', {
              body: 'You will now receive instant push alerts whenever a payment or transaction is received!',
              icon: '/vite.svg'
            });
          }
        }
      } else {
        setPushStatus('denied');
      }
    } catch (err) {
      console.error('Push permission error:', err);
    } finally {
      setPushLoading(false);
    }
  };

  interface NavItem {
    name: string;
    path: string;
    badge?: string;
  }

  const navLinks: NavItem[] = [
    { name: 'Home', path: '/' },
    { name: 'Projects & Case Studies', path: '/projects' },
    { name: 'Services & Milestones', path: '/services', badge: 'PayU' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/85 backdrop-blur-xl border-b border-[#557B83]/15 py-3 shadow-[0_4px_25px_rgba(85,123,131,0.08)]'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-3 group focus:outline-none">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#39AEA9] to-[#557B83] p-[1px] shadow-[0_2px_12px_rgba(57,174,169,0.25)] group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white/95 backdrop-blur-md rounded-2xl flex items-center justify-center text-[#12181A] font-bold text-lg font-display">
              YK
            </div>
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-wider text-[#12181A] flex items-center gap-2 font-display">
              YK Yash
              <span className="inline-block w-2 h-2 rounded-full bg-[#39AEA9] shadow-[0_0_8px_#39AEA9] animate-pulse" />
            </span>
            <p className="text-[10px] tracking-widest uppercase text-[#557B83] font-mono font-semibold">
              Full-Stack & IoT Eng
            </p>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-white/70 border border-[#557B83]/15 backdrop-blur-xl px-4 py-1.5 rounded-full shadow-[0_2px_15px_rgba(85,123,131,0.06)]">
          {navLinks.map((link) => {
            const active = isActive(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${
                  active
                    ? 'text-white bg-[#12181A] shadow-sm font-bold'
                    : 'text-[#557B83] hover:text-[#12181A] hover:bg-[#E5EFC1]/40'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {link.name}
                  {link.badge && (
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full uppercase tracking-tight ${
                      active ? 'bg-[#39AEA9] text-white' : 'bg-[#39AEA9]/15 text-[#1D5C58] border border-[#39AEA9]/30'
                    }`}>
                      {link.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Action CTAs */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Push Notification Enable Bell Button */}
          <button
            onClick={handleEnablePush}
            disabled={pushLoading || pushStatus === 'granted'}
            title={pushStatus === 'granted' ? 'Web Push Active for Payment Alerts' : 'Enable Instant Payment & Status Notifications'}
            className={`p-2.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              pushStatus === 'granted'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-white/80 hover:bg-white text-[#12181A] border border-[#557B83]/20 hover:border-[#39AEA9]'
            }`}
          >
            {pushStatus === 'granted' ? (
              <>
                <BellRing className="w-4 h-4 text-emerald-600 animate-bounce" />
                <span className="text-[11px]">Alerts ON</span>
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 text-[#39AEA9]" />
                <span className="text-[11px]">Enable Alerts</span>
              </>
            )}
          </button>

          {/* User Auth OTP Button */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-[#1D5C58] bg-[#E5EFC1]/60 px-3 py-1.5 rounded-xl border border-[#39AEA9]/20 font-bold flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-[#39AEA9]" />
                {user.name || user.email.split('@')[0]}
              </span>
              <button
                onClick={logout}
                className="text-[11px] text-red-500 hover:text-red-700 font-mono underline cursor-pointer"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/80 hover:bg-white border border-[#557B83]/20 text-[#12181A] hover:border-[#39AEA9] transition-all backdrop-blur-md shadow-sm cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-[#39AEA9]" />
              Client Login
            </button>
          )}

          <Link
            to="/services"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#39AEA9] to-[#557B83] text-white hover:brightness-105 transition-all font-sans shadow-[0_3px_12px_rgba(57,174,169,0.25)]"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Milestone Pay
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-white/80 border border-[#557B83]/20 text-[#12181A] backdrop-blur-md"
        >
          {mobileMenuOpen ? <X className="w-6 h-6 text-[#12181A]" /> : <Menu className="w-6 h-6 text-[#12181A]" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/95 backdrop-blur-2xl border-b border-[#557B83]/15 px-4 pt-4 pb-6 space-y-3 shadow-xl animate-in slide-in-from-top-4">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.path)
                    ? 'bg-[#12181A] text-white font-bold'
                    : 'text-[#557B83] hover:bg-[#F4F8F7] hover:text-[#12181A]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{link.name}</span>
                  {link.badge && (
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#39AEA9]/15 text-[#1D5C58]">
                      {link.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-[#557B83]/15 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleEnablePush();
              }}
              className="px-3 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-white border border-[#557B83]/20 text-[#12181A] flex items-center justify-center gap-1.5"
            >
              <Bell className="w-3.5 h-3.5 text-[#39AEA9]" /> Alerts {pushStatus === 'granted' ? 'ON' : 'OFF'}
            </button>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#39AEA9] to-[#557B83] text-white flex items-center justify-center gap-1"
            >
              <CreditCard className="w-3.5 h-3.5" /> Milestones
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
