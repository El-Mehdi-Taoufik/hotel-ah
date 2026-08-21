"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, Sparkles, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import { useTranslation } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function LoginPage() {
  const router = useRouter();
  const { auth, errors, common, isLoaded, direction } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      setError(errors('required'));
      return;
    }
    setError("");
    setLoading(true);

    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('refreshToken', response.refreshToken);

      // Dispatch event to notify Navbar and other components
      window.dispatchEvent(new Event('userUpdated'));

      router.push("/dashboard");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : errors('invalidCredentials') || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

return (
    <div className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-[#F8F6F2]" dir={direction}>
      {/* Animated ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#B38B59]/25 blur-[100px] animate-pulse" style={{ animationDuration: "6s" }} />
        <div className="absolute top-1/2 -right-32 h-[28rem] w-[28rem] rounded-full bg-[#C69C6D]/20 blur-[110px] animate-pulse" style={{ animationDuration: "8s" }} />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#2196F3]/10 blur-[100px]" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="/logo.jpeg" 
            alt="Hotel Aguelmam Logo" 
            className="h-14 w-14 rounded-2xl object-contain mb-4"
          />
          <h1 className="text-2xl font-semibold text-[#2F2A25] tracking-tight">{auth('loginTitle')}</h1>
          <p className="text-sm text-[#6B6258] mt-1.5">{auth('loginSubtitle')}</p>
        </div>

        <div className="flex justify-center mb-6">
          <LanguageSwitcher />
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-[#E7DFD4] rounded-xl shadow-sm p-7 sm:p-8 space-y-5">
          <div>
            <label className="text-xs font-medium text-[#6B6258] mb-1.5 block">{common('email')}</label>
            <div className="relative" dir={direction}>
              <Mail size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
              <Input
                type="email"
                placeholder={auth('emailPlaceholder')}
                className={direction === 'rtl' ? 'pr-10' : 'pl-10'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-[#6B6258]">{common('password')}</label>
              <button type="button" className="text-xs text-purple-300 hover:text-purple-200 transition-colors" disabled>
                {auth('forgotPasswordDisabled')}
              </button>
            </div>
            <div className="relative" dir={direction}>
              <Lock size={16} className="absolute top-1/2 -translate-y-1/2 text-text-muted" style={{ [direction === 'rtl' ? 'right' : 'left']: '0.875rem' }} />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={auth('passwordPlaceholderDots')}
                className={direction === 'rtl' ? 'pr-10 pl-10' : 'pl-10 pr-10'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute top-1/2 -translate-y-1/2 text-text-muted hover:text-[#6B6258]"
                style={{ [direction === 'rtl' ? 'left' : 'right']: '0.875rem' }}
                aria-label={showPassword ? auth('hidePassword') : auth('showPassword')}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-[#6B6258] cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 rounded accent-purple-500" defaultChecked />
            {auth('rememberMeText')}
          </label>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {auth('signingIn')}
              </>
            ) : (
              auth('signIn')
            )}
         </Button>
        </form>
      </div>
    </div>
  );
}
