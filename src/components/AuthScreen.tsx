import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  BarChart3,
  Terminal,
  Cpu,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export const AuthScreen: React.FC = () => {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInAsDemo } = useAuth();
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [riskAgreement, setRiskAgreement] = useState(true);

  // Status
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    if (mode === 'REGISTER') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!riskAgreement) {
        setError('Please acknowledge the quantitative trading risk rules.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'LOGIN') {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password, name);
        setSuccessMsg('Account registered successfully! Logging you into the terminal...');
      }
    } catch (err: any) {
      console.error('[Auth error]:', err);
      let msg = err.message || 'Authentication failed. Please verify credentials.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        msg = 'Invalid email or password. Please check your credentials or register.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/popup-closed-by-user') {
        msg = 'Google sign-in popup was cancelled.';
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error('[Google sign in error]:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google sign-in could not be completed. You can use email or Instant Demo.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    signInAsDemo();
  };

  return (
    <div className="min-h-screen w-full bg-[#0c1017] text-stone-100 flex flex-col justify-between selection:bg-orange-600 selection:text-white relative overflow-hidden font-sans">
      {/* Background Subtle Glowing Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Bar */}
      <header className="relative z-10 border-b border-stone-800/80 bg-stone-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-amber-700 flex items-center justify-center shadow-lg shadow-orange-950/40 text-white font-black text-xl">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-wider uppercase text-white font-mono">
                AI Trader Pro
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold tracking-widest uppercase">
                v2.6 Enterprise
              </span>
            </div>
            <p className="text-xs text-stone-400">
              Institutional Intraday Algorithmic Engine & Execution Desk
            </p>
          </div>
        </div>

        {/* Live Broker Connectivity Badges */}
        <div className="hidden sm:flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>NSE/BSE Feeds Active</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-stone-900 border border-stone-800 text-stone-300">
            <span className="text-orange-400 font-bold">Dhan</span>
            <span className="text-stone-500">•</span>
            <span className="text-purple-400 font-bold">Upstox</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero & Feature Highlights (5 cols) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col gap-6 text-stone-300 pr-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-xs font-medium text-orange-400 mb-4">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Institutional AI Trading Desk
              </div>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">
                Precision Intraday Scalping & Option Strategy Hub
              </h2>
              <p className="mt-3 text-stone-400 text-sm leading-relaxed">
                Connect directly to live Indian stock market telemetry with automated SuperTrend Pivots, 1:2 R:R options hedging, and multi-day GTT execution.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div className="space-y-3.5 text-sm">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <div className="p-2 rounded-lg bg-orange-950/60 text-orange-400 border border-orange-800/50 mt-0.5">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Dhan & Upstox AI Terminal</h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Live VWAP, PCR telemetry, support & resistance breakdown with single-click Dhan order routing.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 mt-0.5">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Interactive TradingView Charts</h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Pro indicators (RSI, ADX, Bollinger Bands, SuperTrend) with automated price alert watchdogs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-stone-900/60 border border-stone-800/80">
                <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/50 mt-0.5">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Python Lab & Backtest Engine</h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Generate production-ready Python DhanHQ scripts and test strategies across historical bars.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs text-stone-500 font-mono">
              <span>Zero-Lag WebSockets</span>
              <span>•</span>
              <span>SEBI 1-2% Risk Guard</span>
              <span>•</span>
              <span>Virtual ₹10L Paper Capital</span>
            </div>
          </div>

          {/* Right Auth Card (7 cols) */}
          <div className="col-span-1 lg:col-span-7 flex justify-center">
            <div className="w-full max-w-md bg-stone-900/90 border border-stone-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8">
              
              {/* Tabs Switcher: LOGIN vs REGISTER */}
              <div className="flex rounded-xl bg-stone-950 p-1 mb-6 border border-stone-800">
                <button
                  type="button"
                  onClick={() => {
                    setMode('LOGIN');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'LOGIN'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Log In to Terminal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('REGISTER');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mode === 'REGISTER'
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  Create Trader Account
                </button>
              </div>

              {/* Title & Prompt */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {mode === 'LOGIN' ? 'Welcome Back, Trader' : 'Join AI Quantitative Desk'}
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  {mode === 'LOGIN'
                    ? 'Enter your credentials to access live charts, strategies, and orders.'
                    : 'Register your secure trader profile for real-time tracking and algo deployment.'}
                </p>
              </div>

              {/* Success Alert */}
              {successMsg && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <span className="leading-snug">{successMsg}</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Trader Name / Alias
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Rahul Sharma"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="trader@domain.com"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-stone-300">
                      Password
                    </label>
                    {mode === 'LOGIN' && (
                      <span className="text-[11px] text-stone-500 hover:text-stone-400 cursor-pointer">
                        Forgot Password?
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'REGISTER' && (
                  <div>
                    <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-stone-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:border-orange-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {mode === 'REGISTER' && (
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="risk-check"
                      checked={riskAgreement}
                      onChange={(e) => setRiskAgreement(e.target.checked)}
                      className="mt-0.5 rounded border-stone-700 bg-stone-950 text-orange-600 focus:ring-orange-500"
                    />
                    <label htmlFor="risk-check" className="text-xs text-stone-400 leading-tight">
                      I understand that market trading carries financial risk and I agree to practice strict 1:2 risk-to-reward discipline.
                    </label>
                  </div>
                )}

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-950/50 hover:shadow-orange-700/40 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'LOGIN' ? 'Sign In & Enter Terminal' : 'Create Free Trader Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-stone-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase font-mono text-stone-500">
                  <span className="bg-stone-900/90 px-3">or continue with</span>
                </div>
              </div>

              {/* Google Sign-in */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-200 border border-stone-800 font-semibold text-xs flex items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.14z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Instant Demo Exploration Access */}
              <div className="mt-4 pt-4 border-t border-stone-800/80">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="w-full py-2.5 px-4 rounded-xl bg-linear-to-r from-emerald-950/60 to-stone-900 border border-emerald-600/40 hover:border-emerald-500 text-emerald-300 hover:text-emerald-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Instant Demo Access (Explore without signup)</span>
                </button>
                <p className="text-[11px] text-stone-500 text-center mt-2">
                  Loaded with ₹10,00,000 virtual capital, NSE live simulator, and sample orders.
                </p>
              </div>

              {/* Toggle Mode Footer */}
              <div className="mt-5 text-center text-xs text-stone-400">
                {mode === 'LOGIN' ? (
                  <span>
                    New to AI Trader Pro?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('REGISTER');
                        setError(null);
                      }}
                      className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setMode('LOGIN');
                        setError(null);
                      }}
                      className="text-orange-400 hover:text-orange-300 font-bold underline cursor-pointer"
                    >
                      Log in here
                    </button>
                  </span>
                )}
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Bottom Live Market Ticker */}
      <footer className="relative z-10 border-t border-stone-800/80 bg-stone-950/80 backdrop-blur-md px-6 py-2.5 text-xs text-stone-400 flex flex-wrap items-center justify-between gap-4 font-mono">
        <div className="flex items-center gap-4 overflow-x-auto py-0.5">
          <span className="text-stone-500 font-bold uppercase text-[10px]">Markets:</span>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-300 font-semibold">NIFTY 50</span>
            <span className="text-emerald-400">23,228.00 (+0.42%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-300 font-semibold">BANKNIFTY</span>
            <span className="text-emerald-400">51,450.20 (+0.38%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-300 font-semibold">FINNIFTY</span>
            <span className="text-emerald-400">22,890.10 (+0.25%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-stone-300 font-semibold">RELIANCE</span>
            <span className="text-emerald-400">1,288.40 (+1.10%)</span>
          </div>
        </div>
        <div className="text-[11px] text-stone-500">
          Encrypted Authentication • Firestore Secured
        </div>
      </footer>
    </div>
  );
};
