// src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthWithNavigate } from '@/hooks/useAuthWithNavigate';
import { Zap, Mail, Lock, Eye, EyeOff, ChevronRight, AlertCircle, Star, Users, BarChart3, Github } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { loginAndNavigate, isLoading, error } = useAuthWithNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setLocalError('Пожалуйста, заполните все поля.');
      return;
    }
    setLocalError('');
    try {
      await loginAndNavigate(formData.email, formData.password);
    } catch (err) {
      // Ошибка уже обработана в хуке
    }
  };

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Left decorative panel - как в Figma */}
      <div
        className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #6C63FF 0%, #4f46e5 55%, #2563eb 100%)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
        <div className="absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-[#4CAF50]/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-white/[0.03] border border-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/[0.04] border border-white/10" />

        {/* Brand */}
        <button
          onClick={() => navigate('/')}
          className="relative flex items-center gap-3 z-10 w-fit"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/25 shadow-lg">
            <Zap size={20} className="text-white" />
          </div>
          <span
            className="text-2xl font-extrabold text-white tracking-tight"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Quizify
          </span>
        </button>

        {/* Center copy */}
        <div className="relative z-10">
          <div className="flex gap-3 mb-8 flex-wrap">
            {[
              { icon: <Zap size={14} />, label: "Create quizzes in minutes" },
              { icon: <Users size={14} />, label: "Play with anyone, anywhere" },
              { icon: <BarChart3 size={14} />, label: "Track every result" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white/90 text-xs font-semibold px-3 py-2 rounded-xl border border-white/15"
              >
                {item.icon}
                <span className="hidden xl:inline">{item.label}</span>
              </div>
            ))}
          </div>
          <h2
            className="text-4xl font-extrabold text-white leading-tight mb-4"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            Learning that
            <br />
            <span className="text-[#a5f3a5]">feels like play.</span>
          </h2>
          <p className="text-white/65 text-sm leading-relaxed max-w-xs">
            Join 48,000+ learners who use Quizify to create engaging quizzes and compete in real-time.
          </p>
        </div>

        {/* Testimonial - как в Figma */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15">
          <div className="flex gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={13} className="text-[#FFD700] fill-[#FFD700]" />
            ))}
          </div>
          <p className="text-white/85 text-sm leading-relaxed mb-4">
            "Quizify transformed how my students engage with material. The real-time leaderboard is addictive!"
          </p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#4CAF50]/30 flex items-center justify-center text-sm font-bold text-white">
              MR
            </div>
            <div>
              <p className="text-white text-xs font-semibold">Maya Rodriguez</p>
              <p className="text-white/50 text-xs">High School Biology Teacher</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel - как в Figma */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 bg-[#f8f7ff]">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-3xl font-extrabold text-[#1a1535] mb-2"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              Welcome back
            </h1>
            <p className="text-[#6b6a8a] text-sm">
              Sign in to your account to continue.
            </p>
          </div>

          {/* Social buttons - как в Figma */}
          <div className="flex gap-3 mb-6">
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[rgba(108,99,255,0.15)] bg-white text-[#1a1535] text-sm font-semibold hover:border-[#6C63FF]/35 hover:bg-[#fafaff] transition-all">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" fill="#4285F4" />
                <path d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2.01c-.72.48-1.63.76-2.7.76-2.08 0-3.84-1.4-4.47-3.29H1.84v2.07A8 8 0 0 0 8.98 17z" fill="#34A853" />
                <path d="M4.51 10.52A4.84 4.84 0 0 1 4.26 9c0-.53.09-1.04.25-1.52V5.41H1.84A8 8 0 0 0 .98 9c0 1.29.31 2.51.86 3.59l2.67-2.07z" fill="#FBBC05" />
                <path d="M8.98 3.58c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 .98 9l2.66 2.07A4.77 4.77 0 0 1 8.98 3.58z" fill="#EA4335" />
              </svg>
              Google
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-[rgba(108,99,255,0.15)] bg-white text-[#1a1535] text-sm font-semibold hover:border-[#6C63FF]/35 hover:bg-[#fafaff] transition-all">
              <Github size={18} />
              GitHub
            </button>
          </div>

          {/* Divider - как в Figma */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-[rgba(108,99,255,0.1)]" />
            <span className="text-xs text-[#6b6a8a] font-medium">or continue with email</span>
            <div className="flex-1 h-px bg-[rgba(108,99,255,0.1)]" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {(error || localError) && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold px-4 py-3 rounded-xl">
                <AlertCircle size={14} />
                {error || localError}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#1a1535] mb-2">Email address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6a8a]" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full bg-white border-2 border-[rgba(108,99,255,0.12)] rounded-xl pl-11 pr-4 py-3 text-sm text-[#1a1535] placeholder-[#b4b3cc] focus:outline-none focus:border-[#6C63FF] focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-semibold text-[#1a1535]">Password</label>
                <button type="button" className="text-xs font-semibold text-[#6C63FF] hover:underline">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6b6a8a]" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full bg-white border-2 border-[rgba(108,99,255,0.12)] rounded-xl pl-11 pr-12 py-3 text-sm text-[#1a1535] placeholder-[#b4b3cc] focus:outline-none focus:border-[#6C63FF] focus:ring-4 focus:ring-[#6C63FF]/10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b6a8a] hover:text-[#6C63FF] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-1">
              <input
                type="checkbox"
                id="remember"
                checked={formData.rememberMe}
                onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                className="w-4 h-4 rounded border-[rgba(108,99,255,0.3)] accent-[#6C63FF]"
              />
              <label htmlFor="remember" className="text-sm text-[#6b6a8a] font-medium">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm transition-all shadow-lg shadow-[#6C63FF]/25 hover:opacity-90 active:scale-[0.98] disabled:opacity-70 mt-2"
              style={{ background: "linear-gradient(135deg, #6C63FF, #4f46e5)" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                <>Sign In <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b6a8a] mt-6">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-bold text-[#6C63FF] hover:underline"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};