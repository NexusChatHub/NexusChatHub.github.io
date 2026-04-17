'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Turnstile } from '@marsidev/react-turnstile';
import {
  ArrowRight, 
  Eye, 
  EyeOff, 
  Globe, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  UserRound,
  ShieldAlert,
  Calendar,
  Layers,
  Moon,
  Sun,
  UserCheck,
  ShieldQuestion
} from 'lucide-react';
import {
  supabase,
  isSupabaseConfigured,
  SUPABASE_CONFIG_ERROR,
} from '@/lib/supabase';
import { PUBLIC_TURNSTILE_SITE_KEY } from '@/lib/publicConfig';
import { useTheme } from '@/hooks/useTheme';

const turnstileSiteKeyRaw = PUBLIC_TURNSTILE_SITE_KEY?.trim();
const turnstileSiteKey = turnstileSiteKeyRaw?.startsWith('http')
  ? undefined
  : turnstileSiteKeyRaw;
const isTurnstileMisconfigured = Boolean(turnstileSiteKeyRaw && !turnstileSiteKey);

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [parentEmail, setParentEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(
    turnstileSiteKey ? null : isTurnstileMisconfigured ? null : 'local-bypass',
  );
  const { theme, toggleTheme } = useTheme();
  const isMinor = typeof age === 'number' && age < 13;

  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      if (!isSupabaseConfigured) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push('/chat');
    };
    checkUser();
  }, [router]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSupabaseConfigured) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    if (isTurnstileMisconfigured) {
      setError('Turnstile is misconfigured. Use the Cloudflare site key, not your /auth page URL.');
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the captcha verification.');
      return;
    }

    if (!isLogin) {
      if (typeof age !== 'number' || Number.isNaN(age) || age < 5) {
        setError('Please enter a valid age.');
        return;
      }
      if (age < 13 && !parentEmail.trim()) {
        setError('A parent/guardian email is required for users under 13 (COPPA).');
        return;
      }
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
          options: {
            captchaToken: turnstileToken || undefined,
          },
        });
        if (signInError) throw signInError;
        router.push('/chat');
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { 
            full_name: username,
            age: age,
            parent_email: isMinor ? parentEmail.trim() : null,
            restricted: isMinor,
          },
          captchaToken: turnstileToken || undefined,
          emailRedirectTo: `${window.location.origin}/chat`,
        },
      });

      if (signUpError) throw signUpError;
      
      if (data.session) {
        router.push('/chat');
      } else {
        setSuccessMessage('Welcome! Check your email to confirm your account and parent consent if applicable.');
        setIsLogin(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!isSupabaseConfigured) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    if (isTurnstileMisconfigured) {
      setError('Turnstile is misconfigured. Use the Cloudflare site key, not your /auth page URL.');
      return;
    }

    if (turnstileSiteKey && !turnstileToken) {
      setError('Please complete the captcha verification.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const oauthCredentials: Parameters<typeof supabase.auth.signInWithOAuth>[0] & {
        options: {
          redirectTo: string;
          captchaToken?: string;
        };
      } = {
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/chat`,
          captchaToken: turnstileToken || undefined,
        },
      };

      const { error: oauthError } = await supabase.auth.signInWithOAuth(oauthCredentials);
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col lg:flex-row transition-colors duration-500 overflow-hidden">
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[128px] animate-blob pointer-events-none" />
      <div className="absolute -bottom-8 -right-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[128px] animate-blob animation-delay-2000 pointer-events-none" />

      <button 
        onClick={toggleTheme}
        className="fixed top-6 right-6 z-50 p-3 rounded-2xl glass hover:scale-110 transition-all border border-[var(--border-color)] text-[var(--text-primary)]"
      >
        {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      {/* Left Branding Panel */}
      <div className="hidden lg:flex flex-col justify-between p-16 lg:w-[45%] relative z-10">
        <div className="space-y-12">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-[18px] bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-[var(--text-primary)]">Nexus</span>
          </Link>

          <div className="space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Safety First Infrastructure
            </motion.div>
            <h1 className="text-7xl font-black tracking-tight text-[var(--text-primary)] leading-[0.9]">
              Built for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient">Everyone.</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] max-w-md font-medium leading-relaxed">
              A high-performance workspace that respects privacy and complies with global safety standards including COPPA.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-sm">
            {[
              { icon: <UserCheck className="w-5 h-5 text-emerald-500" />, title: 'Parental Consent', desc: 'Secure verification for minors' },
              { icon: <ShieldAlert className="w-5 h-5 text-blue-500" />, title: 'Restricted Mode', desc: 'Safe-guarded chat for under 13s' },
            ].map((feature, i) => (
              <div key={i} className="glass p-6 rounded-3xl border border-[var(--border-color)] flex items-start gap-4">
                <div className="mt-1">{feature.icon}</div>
                <div>
                  <h3 className="font-black text-sm text-[var(--text-primary)] uppercase tracking-tight">{feature.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <motion.div layout className="w-full max-w-[480px] glass p-10 rounded-[40px] border border-[var(--border-color)] shadow-2xl bg-[var(--bg-secondary)]/40 backdrop-blur-3xl">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-3">
              {isLogin ? 'Welcome Back' : 'Get Started'}
            </h2>
            <p className="text-[var(--text-secondary)] font-bold tracking-tight uppercase text-[10px]">
              {isLogin ? 'Access your intelligence frequency' : 'Join the global team network'}
            </p>
          </div>

          <div className="flex p-1.5 bg-[var(--bg-tertiary)] rounded-2xl mb-8">
            <button onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${isLogin ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Sign In
            </button>
            <button onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!isLogin ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'}`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-5">
            {!isSupabaseConfigured && (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-4 text-left shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-800 dark:text-amber-300">
                  Workspace Setup Required
                </p>
                <p className="mt-2 text-sm leading-relaxed text-amber-950/80 dark:text-amber-100/80">
                  Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
                  to enable sign-in, channels, and real-time sync.
                </p>
              </div>
            )}

            {isTurnstileMisconfigured && (
              <div className="rounded-3xl border border-orange-500/30 bg-orange-500/10 p-4 text-left shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-800 dark:text-orange-300">
                  Captcha Config Error
                </p>
                <p className="mt-2 text-sm leading-relaxed text-orange-950/80 dark:text-orange-100/80">
                  `NEXT_PUBLIC_TURNSTILE_SITE_KEY` currently looks like a URL. Use the
                  Cloudflare Turnstile site key instead, usually something like `0x4AAAA...`.
                </p>
              </div>
            )}

            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
                  <div className="space-y-2">
                    <label className="eyebrow ml-1">Identity Display</label>
                    <div className="relative group">
                      <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                      <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="input-modern pl-12 h-14 font-bold" />
                    </div>
                  </div>

                    <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="eyebrow ml-1">Chronological Age</label>
                      <div className="relative group">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                        <input type="number" required value={age} onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : '')} placeholder="Years" className="input-modern pl-12 h-14 font-bold" />
                      </div>
                    </div>
                    {isMinor && (
                      <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                        <label className="eyebrow ml-1">Restricted</label>
                        <div className="h-14 rounded-xl border border-orange-500/20 bg-orange-500/5 flex items-center px-4 gap-2">
                          <ShieldAlert className="w-4 h-4 text-orange-500" />
                          <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">COPPA Applied</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {isMinor && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                      <label className="eyebrow ml-1">Guardian Intelligence (Email)</label>
                      <div className="relative group">
                        <ShieldQuestion className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                        <input type="email" required value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} placeholder="parent@consent.com" className="input-modern pl-12 h-14 font-bold border-blue-500/30" />
                      </div>
                      <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest px-1">Required for users under 13 to verify authorization.</p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="eyebrow ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@nexus.com" className="input-modern pl-12 h-14 font-bold" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="eyebrow ml-1">Intelligence Key</label>
              <div className="relative group">
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)] group-focus-within:text-blue-500 transition-colors" />
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input-modern pl-12 pr-12 h-14 font-bold" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Turnstile Captcha */}
            <div className="py-2 flex justify-center">
              {turnstileSiteKey ? (
                <Turnstile
                  siteKey={turnstileSiteKey}
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setError(null);
                  }}
                  onExpire={() => setTurnstileToken(null)}
                  onError={() => {
                    setTurnstileToken(null);
                    setError('Captcha failed to load. Check your Turnstile site key and allowed domains.');
                  }}
                  options={{ theme: theme === 'dark' ? 'dark' : 'light', size: 'flexible' }}
                />
              ) : (
                <div className="w-full p-4 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center gap-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                    {isTurnstileMisconfigured ? 'Invalid Turnstile Key' : 'Verification Bypass Enabled'}
                  </span>
                </div>
              )}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-black uppercase tracking-widest flex items-center gap-3"
              >
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-3"
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </motion.div>
            )}

            <button type="submit" disabled={loading || !isSupabaseConfigured} className="btn-primary w-full py-5 text-sm font-black uppercase tracking-[0.2em] mt-2 shadow-2xl shadow-blue-500/30 active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50">
              {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : (
                <div className="flex items-center justify-center gap-3">
                  <span>{isLogin ? 'Establish Link' : 'Initialize Account'}</span>
                  <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </button>
          </form>

          <div className="my-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--border-color)]" />
            <span className="eyebrow text-[8px]">Standard Protocols</span>
            <div className="h-px flex-1 bg-[var(--border-color)]" />
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={loading || !isSupabaseConfigured}
            className="btn-secondary w-full py-4 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-sm border-[var(--border-color)] active:scale-95 transition-all disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Globe className="w-4 h-4 text-blue-500" />
            Sync with Google
          </button>

          <div className="mt-8 pt-8 border-t border-[var(--border-color)] text-center">
            <p className="text-[9px] text-[var(--text-muted)] font-black uppercase tracking-[0.1em]">
              By proceeding, you authorize our 
              <Link href="#" className="text-blue-500 hover:text-blue-400 mx-1 transition-colors">Terms of Sync</Link>
              & 
              <Link href="#" className="text-blue-500 hover:text-blue-400 ml-1 transition-colors">Safety Code</Link>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
