'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  Layers, 
  Zap, 
  Shield, 
  Globe,
  Layout,
  Sparkles,
  Command,
  Smartphone,
  Cpu,
  Moon,
  Sun
} from 'lucide-react';

export default function LandingPage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' || 'dark';
    document.documentElement.className = savedTheme;
    
    // Defer state updates to avoid synchronous cascading renders warning
    const timer = setTimeout(() => {
      setTheme(savedTheme);
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    document.documentElement.className = nextTheme;
  };

  if (!mounted) return null; // Avoid hydration mismatch and unnecessary renders before mount

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-primary)] transition-colors duration-500 selection:bg-blue-500/30">
      {/* Dynamic Background */}
      <div className="absolute top-0 -left-4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob pointer-events-none" />
      <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-2000 pointer-events-none" />
      <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500/10 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 animate-blob animation-delay-4000 pointer-events-none" />

      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-[var(--text-primary)]">Nexus</span>
          </div>
          
          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-[var(--text-secondary)]">
            {['Features', 'About', 'Pricing'].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[var(--text-primary)] transition-colors relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-500 transition-all group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-6">
              <Link href="/auth" className="text-sm font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                Sign In
              </Link>
              <Link href="/chat" className="btn-primary py-2.5 px-6 text-sm">
                Launch App
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative pt-40 pb-20 px-6">
        {/* Hero Section */}
        <div className="mx-auto max-w-6xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-8">
              <Sparkles className="w-3.5 h-3.5" />
              Intelligence meets Velocity
            </span>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-[var(--text-primary)] mb-8 leading-[0.9]">
              Sync teams with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-gradient">total clarity.</span>
            </h1>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-12 leading-relaxed font-medium">
              The high-performance workspace designed for elite teams. 
              Real-time collaboration with zero friction and beautiful aesthetics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <Link href="/chat" className="btn-primary px-10 py-5 text-xl w-full sm:w-auto shadow-2xl shadow-blue-500/30">
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Link>
              <Link href="/auth" className="btn-secondary px-10 py-5 text-xl w-full sm:w-auto border-[var(--border-color)]">
                View Demo
              </Link>
            </div>
          </motion.div>

          {/* App Preview Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 1, ease: "easeOut" }}
            className="mt-32 relative group max-w-5xl mx-auto"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-[40px] blur-3xl opacity-20 group-hover:opacity-30 transition duration-1000" />
            <div className="relative glass rounded-[32px] overflow-hidden border-[var(--border-color)] shadow-2xl bg-[var(--bg-secondary)]/80">
              <div className="h-12 border-b border-[var(--border-color)] bg-[var(--bg-tertiary)]/50 flex items-center px-6 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/40" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/40" />
                <div className="w-3 h-3 rounded-full bg-green-500/40" />
                <div className="ml-4 h-6 w-40 rounded-lg bg-[var(--bg-primary)]/50 border border-[var(--border-color)]" />
              </div>
              <div className="aspect-[16/10] bg-[var(--bg-primary)] p-10 overflow-hidden">
                <div className="grid grid-cols-12 gap-8 h-full">
                  <div className="col-span-3 space-y-6">
                    <div className="h-4 w-2/3 bg-[var(--bg-tertiary)] rounded-full" />
                    <div className="space-y-3">
                      <div className="h-10 w-full bg-blue-500/10 border border-blue-500/20 rounded-2xl" />
                      <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded-2xl" />
                      <div className="h-10 w-full bg-[var(--bg-tertiary)] rounded-2xl" />
                    </div>
                  </div>
                  <div className="col-span-9 flex flex-col justify-end gap-6">
                    <div className="space-y-4">
                      <div className="h-4 w-1/4 bg-[var(--bg-tertiary)] rounded-full" />
                      <div className="h-24 w-4/5 bg-[var(--bg-tertiary)] rounded-[28px]" />
                      <div className="h-20 w-3/5 ml-auto bg-blue-500/10 border border-blue-500/20 rounded-[28px]" />
                    </div>
                    <div className="h-14 w-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl mt-6" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl mt-60 mb-20">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">Everything you need <br />to move fast.</h2>
            <p className="text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">Built for the modern web with performance and security at its core.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Zap className="w-8 h-8 text-blue-500" />,
                title: "Ultra Low Latency",
                desc: "Powered by Supabase Realtime for sub-100ms message delivery worldwide."
              },
              {
                icon: <Layout className="w-8 h-8 text-purple-500" />,
                title: "Fluid Design",
                desc: "A focused, minimal interface that stays out of your way and lets you work."
              },
              {
                icon: <Shield className="w-8 h-8 text-pink-500" />,
                title: "Enterprise Security",
                desc: "COPPA compliant with end-to-end Row Level Security for your data."
              },
              {
                icon: <Command className="w-8 h-8 text-orange-500" />,
                title: "Command Center",
                desc: "Keyboard-first navigation and shortcuts for power users."
              },
              {
                icon: <Smartphone className="w-8 h-8 text-emerald-500" />,
                title: "Mobile First",
                desc: "Seamless experience across all devices with native-feel interactions."
              },
              {
                icon: <Cpu className="w-8 h-8 text-indigo-500" />,
                title: "Edge Computed",
                desc: "Optimized delivery and caching to ensure Nexus is always available."
              }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass p-10 rounded-[32px] border-[var(--border-color)] hover:bg-[var(--bg-tertiary)]/50 transition-all group cursor-default"
              >
                <div className="w-16 h-16 rounded-[22px] bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-xl">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4 tracking-tight">{f.title}</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-color)] py-20 px-6 bg-[var(--bg-secondary)]/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <Layers className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-black text-[var(--text-primary)] tracking-tighter">Nexus</span>
              </div>
              <p className="text-[var(--text-secondary)] max-w-xs font-medium leading-relaxed">
                Reinventing the way teams communicate in the modern age. Speed, security, and beauty.
              </p>
            </div>
            <div>
              <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs mb-8">Product</h4>
              <ul className="space-y-4 text-sm font-bold text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-blue-500 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Solutions</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs mb-8">Company</h4>
              <ul className="space-y-4 text-sm font-bold text-[var(--text-secondary)]">
                <li><a href="#" className="hover:text-blue-500 transition-colors">About</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-blue-500 transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 pt-10 border-t border-[var(--border-color)]">
            <p className="text-[var(--text-muted)] text-sm font-bold">
              © 2026 Nexus Workspace Inc. All rights reserved.
            </p>
            <div className="flex items-center gap-8">
              <Globe className="w-5 h-5 text-[var(--text-muted)] hover:text-blue-500 cursor-pointer transition-colors" />
              <div className="flex items-center gap-2 text-sm font-black text-[var(--text-muted)]">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                System Operational
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
