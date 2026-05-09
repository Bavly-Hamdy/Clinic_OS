import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, ActivitySquare, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type LoginFormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname;
  const isRtl = i18n.language === 'ar';

  const loginSchema = z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.passwordMin')),
  });

  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      await login(values.email, values.password);
      // Check user role from Firestore to redirect appropriately
      const { getDoc, doc } = await import('firebase/firestore');
      const { db, auth } = await import('@/lib/firebase');
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'ADMIN') {
          navigate('/admin/dashboard', { replace: true });
          return;
        }
      }
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err: any) {
      let message = t('auth.login.generalError');
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = t('auth.login.invalidCredentials');
      } else if (err.code === 'auth/too-many-requests') {
        message = t('auth.login.tooManyRequests');
      } else if (err.message) {
        message = err.message;
      }
      setServerError(message);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      {/* Dynamic Animated Background Mesh */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] start-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full mix-blend-multiply filter blur-[100px] animate-float opacity-70" />
        <div className="absolute bottom-[-10%] end-[-10%] w-[60%] h-[60%] bg-info/20 rounded-full mix-blend-multiply filter blur-[120px] animate-pulse-glow opacity-60" style={{ animationDuration: '8s' }} />
        <div className="absolute top-[20%] end-[20%] w-[30%] h-[30%] bg-purple-500/10 rounded-full mix-blend-multiply filter blur-[80px] animate-float opacity-50" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-5xl z-10 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16 px-6 py-12">
        
        {/* Left Branding Area */}
        <div className="flex-1 flex flex-col justify-center max-w-md lg:max-w-none w-full animate-fade-in-up">
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-6 border border-primary/20 backdrop-blur-md w-fit">
              <ShieldCheck className="h-4 w-4" /> {t('auth.login.securePortal')}
           </div>
           
           <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1] mb-6 shadow-sm">
             {t('auth.login.heroTitle1')}<br />
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-info">{t('auth.login.heroTitle2')}</span>
           </h1>
           
           <p className="text-lg text-muted-foreground leading-relaxed mb-8 max-w-lg">
             {t('auth.login.heroDesc')}
           </p>
           
           <div className="hidden lg:grid grid-cols-2 gap-4">
             {[
               { title: t('auth.login.liveQueue'), desc: t('auth.login.liveQueueDesc') },
               { title: t('auth.login.smartRx'), desc: t('auth.login.smartRxDesc') },
             ].map((feature, i) => (
               <div key={i} className="glass-card rounded-2xl p-4 flex flex-col justify-center">
                 <span className="font-bold text-foreground">{feature.title}</span>
                 <span className="text-sm text-muted-foreground mt-1">{feature.desc}</span>
               </div>
             ))}
           </div>
        </div>

        {/* Right Login Card */}
        <div className="w-full max-w-md animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="glass overflow-hidden rounded-[2rem] p-8 md:p-10 relative">
            {/* Subtle inner top glow */}
            <div className="absolute top-0 start-0 end-0 h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />
            
            <div className={`flex items-center gap-3 mb-8`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/30">
                <ActivitySquare className="h-6 w-6 text-white" />
              </div>
              <span className={`text-2xl font-extrabold tracking-tight`}>ClinicOS</span>
            </div>

            <div className={`mb-8`}>
              <h2 className={`text-2xl font-bold tracking-tight text-foreground`}>{t('auth.login.title')}</h2>
              <p className={`mt-2 text-sm text-muted-foreground font-medium`}>
                {t('auth.login.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              {serverError && (
                <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{serverError}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className={`text-xs font-bold uppercase tracking-wider text-muted-foreground block text-start`}>{t('auth.login.emailLabel')}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t('auth.login.emailPlaceholder')}
                  {...register('email')}
                  className={`h-12 bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.email ? 'border-destructive/50 focus-visible:ring-destructive/20' : ''}`}
                />
                {errors.email && (
                  <p className="text-xs text-destructive font-medium mt-1 text-start">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className={`text-xs font-bold uppercase tracking-wider text-muted-foreground block text-start`}>{t('auth.login.passwordLabel')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder={t('auth.login.passwordPlaceholder')}
                    {...register('password')}
                    className={`h-12 pe-12 bg-background/50 backdrop-blur-sm border-white/10 focus:border-primary/50 transition-all ${errors.password ? 'border-destructive/50 focus-visible:ring-destructive/20' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute inset-y-0 end-0 px-4 flex items-center text-muted-foreground hover:text-foreground transition-colors group"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5 group-hover:scale-110 transition-transform" /> : <Eye className="h-5 w-5 group-hover:scale-110 transition-transform" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-destructive font-medium mt-1 text-start">{errors.password.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all group overflow-hidden relative mt-4" 
                disabled={isSubmitting}
              >
                <span className="relative z-10 flex items-center justify-center w-full gap-2">
                  {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
                  {!isSubmitting && (isRtl ? <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> : <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />)}
                </span>
                {/* Button shiny hover effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
              </Button>
            </form>

            <div className="mt-8 text-center text-sm text-muted-foreground border-t border-border/50 pt-6">
              {t('auth.login.securePortalDesc', 'Authorized Personnel Only')}
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
