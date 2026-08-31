import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase
const supabaseUrl = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 
  (import.meta as any).env?.VITE_SUPABASE_URL || 
  'https://placeholder-project.supabase.co';

const supabaseAnonKey = 
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
  'placeholder-anon-key';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseUrl !== 'https://placeholder-project.supabase.co' && 
  supabaseAnonKey && 
  supabaseAnonKey !== 'placeholder-anon-key'
);

/**
 * Universal Supabase Client with graceful fallback support
 */
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Database Schema Reference for Supabase (Execute in Supabase SQL Editor):
 * 
 * -- 1. Payments Table
 * CREATE TABLE IF NOT EXISTS public.payments (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   txnid TEXT UNIQUE NOT NULL,
 *   amount NUMERIC(10, 2) NOT NULL,
 *   product TEXT,
 *   customer_name TEXT,
 *   customer_email TEXT,
 *   customer_phone TEXT,
 *   status TEXT NOT NULL DEFAULT 'initiated', -- 'success', 'failure', 'pending', 'initiated'
 *   payment_mode TEXT DEFAULT 'payu',
 *   bank_ref_num TEXT,
 *   mihpayid TEXT,
 *   hash_verified BOOLEAN DEFAULT false,
 *   raw_payload JSONB,
 *   created_at TIMESTAMPTZ DEFAULT now(),
 *   updated_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 2. Inquiries & Contact Messages Table
 * CREATE TABLE IF NOT EXISTS public.inquiries (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   name TEXT,
 *   email TEXT,
 *   phone TEXT,
 *   subject TEXT,
 *   message TEXT,
 *   product_title TEXT,
 *   price_inr NUMERIC(10, 2),
 *   status TEXT DEFAULT 'unread', -- 'unread', 'read', 'initiated'
 *   source TEXT DEFAULT 'contact_page',
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 3. Visitors Table
 * CREATE TABLE IF NOT EXISTS public.visitors (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   ip TEXT,
 *   user_agent TEXT,
 *   path TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 4. Push Subscriptions Table
 * CREATE TABLE IF NOT EXISTS public.push_subscriptions (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   endpoint TEXT UNIQUE NOT NULL,
 *   subscription JSONB NOT NULL,
 *   email TEXT,
 *   user_agent TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- 5. Users Table
 * CREATE TABLE IF NOT EXISTS public.users (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   email TEXT UNIQUE NOT NULL,
 *   name TEXT,
 *   created_at TIMESTAMPTZ DEFAULT now()
 * );
 * 
 * -- Enable Row Level Security (RLS) & allow anonymous inserts/reads for public features:
 * ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public read and insert payments" ON public.payments FOR ALL USING (true) WITH CHECK (true);
 * 
 * ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public insert inquiries" ON public.inquiries FOR ALL USING (true) WITH CHECK (true);
 * 
 * ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public insert visitors" ON public.visitors FOR ALL USING (true) WITH CHECK (true);
 * 
 * ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public insert push_subscriptions" ON public.push_subscriptions FOR ALL USING (true) WITH CHECK (true);
 * 
 * ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
 * CREATE POLICY "Public insert and read users" ON public.users FOR ALL USING (true) WITH CHECK (true);
 */
