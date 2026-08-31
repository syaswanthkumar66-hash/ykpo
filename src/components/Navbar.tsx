import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ShoppingBag, CreditCard } from 'lucide-react';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 15);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
          <Link
            to="/store"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/80 hover:bg-white border border-[#557B83]/20 text-[#12181A] hover:border-[#39AEA9] transition-all backdrop-blur-md shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-[#39AEA9]" />
            Digital Store
          </Link>
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
            <Link
              to="/store"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-white border border-[#557B83]/20 text-[#12181A]"
            >
              Digital Store
            </Link>
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2.5 rounded-xl text-center text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-[#39AEA9] to-[#557B83] text-white"
            >
              Milestones
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
