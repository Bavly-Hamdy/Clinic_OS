import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Building2,
  Smartphone,
  User,
  Briefcase,
  Tag,
  Sparkles,
  Clock,
  MessageCircle,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatformPricing } from '@/hooks/usePlatformPricing';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { toast } from 'sonner';

export default function RegistrationPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRTL = i18n.language === 'ar';
  const IconArrow = isRTL ? ArrowLeft : ArrowRight;

  const { pricing, isLoading: pricingLoading } = usePlatformPricing();

  // Read billing cycle from URL param (set by LandingPage)
  const plan = (searchParams.get('plan') as 'monthly' | 'yearly') || 'monthly';

  const savingPercent = pricing.monthlyPrice > 0
    ? Math.round(((pricing.monthlyPrice * 12 - pricing.yearlyPrice) / (pricing.monthlyPrice * 12)) * 100)
    : 0;

  const planLabel = pricingLoading
    ? (isRTL ? 'جاري التحميل...' : 'Loading...')
    : plan === 'monthly'
      ? (isRTL ? `شهري - ${pricing.monthlyPrice} ج.م / شهر` : `Monthly - ${pricing.monthlyPrice} EGP / month`)
      : (isRTL ? `سنوي - ${pricing.yearlyPrice} ج.م / سنة (وفر ${savingPercent}%)` : `Yearly - ${pricing.yearlyPrice} EGP / year (Save ${savingPercent}%)`);

  const [formData, setFormData] = useState({
    name: '',
    job: '',
    specialty: '',
    phone: '',
    clinicName: '',
    promoCode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedPhone, setSubmittedPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addDoc(collection(db, COLLECTIONS.REGISTRATION_REQUESTS), {
        name: formData.name.trim(),
        job: formData.job.trim() || null,
        specialty: formData.specialty.trim() || null,
        phone: formData.phone.trim(),
        clinicName: formData.clinicName.trim() || null,
        promoCode: formData.promoCode.trim() || null,
        plan,
        status: 'new',
        submittedAt: serverTimestamp(),
      });

      setSubmittedPhone(formData.phone.trim());
      setIsSuccess(true);
    } catch (err) {
      console.error('[RegistrationPage] submit error:', err);
      toast.error(isRTL ? 'حدث خطأ، يرجى المحاولة مجدداً.' : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // ── Success Screen ─────────────────────────────────────────────────────────
  if (isSuccess) {
    const steps = isRTL
      ? [
          { icon: '✅', title: 'تم استلام طلبك', desc: 'وصل طلبك إلى فريق Clinic Hub وتم تسجيله بنجاح في النظام.' },
          { icon: '📞', title: 'سيتواصل معك فريقنا', desc: `سيتواصل معك أحد متخصصينا عبر الواتساب على رقم ${submittedPhone} خلال دقائق.` },
          { icon: '🚀', title: 'تفعيل حسابك', desc: 'سيتم إعداد بيئتك الخاصة بالكامل وتفعيل حسابك فور تأكيدك.' },
        ]
      : [
          { icon: '✅', title: 'Request Received', desc: 'Your request has been logged in the Clinic Hub system successfully.' },
          { icon: '📞', title: 'Our team will reach you', desc: `A specialist will contact you via WhatsApp on ${submittedPhone} within minutes.` },
          { icon: '🚀', title: 'Account Activation', desc: 'Your dedicated environment will be fully set up and activated upon your confirmation.' },
        ];

    return (
      <div
        className="min-h-screen font-sans relative overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
        style={{ background: 'radial-gradient(ellipse at 60% 0%, hsl(142 76% 96%) 0%, hsl(220 14% 96%) 50%, hsl(262 83% 97%) 100%)' }}
      >
        {/* Decorative background blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -start-40 h-[600px] w-[600px] rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute top-1/2 -end-40 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 start-1/3 h-[400px] w-[400px] rounded-full bg-amber-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 180 }}
            className="w-full max-w-2xl"
          >
            {/* ── Top hero card ───────────────────────────────────────────── */}
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-500/10 mb-6">
              {/* Green gradient header */}
              <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-10 text-center relative overflow-hidden">
                {/* Shimmer overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.15)_0%,transparent_50%,rgba(255,255,255,0.05)_100%)]" />

                {/* Animated check icon */}
                <motion.div
                  className="relative mx-auto mb-6 h-28 w-28"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 14, stiffness: 200 }}
                >
                  <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-white/10 animate-ping" style={{ animationDelay: '0.3s' }} />
                  <div className="relative h-28 w-28 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 flex items-center justify-center shadow-xl">
                    <CheckCircle2 className="h-14 w-14 text-white drop-shadow-lg" strokeWidth={2.5} />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="relative space-y-2"
                >
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
                    <Sparkles className="h-4 w-4 text-yellow-200 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                    {isRTL ? '🎉 تم استلام طلبك بنجاح!' : '🎉 Request Submitted!'}
                  </h1>
                  <p className="text-green-100 text-base sm:text-lg font-medium leading-relaxed max-w-md mx-auto">
                    {isRTL
                      ? 'مرحباً بك في عائلة Clinic Hub! طلب انضمامك في أيدٍ أمينة الآن.'
                      : 'Welcome to the Clinic Hub family! Your request is now in safe hands.'}
                  </p>
                </motion.div>
              </div>

              {/* White body */}
              <div className="bg-card p-8 space-y-6">
                {/* Plan badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                  className="flex items-center justify-center"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-primary/5 border border-primary/20">
                    <span className="text-xl">{plan === 'monthly' ? '📅' : '🗓️'}</span>
                    <div className="text-start">
                      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {isRTL ? 'الخطة المختارة' : 'Selected Plan'}
                      </p>
                      <p className="font-black text-sm text-foreground">{planLabel}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-border/60" />
                  <span className="text-xs font-black uppercase tracking-widest text-muted-foreground/60">
                    {isRTL ? 'خطوات ما بعد التسجيل' : 'What happens next'}
                  </span>
                  <div className="flex-1 h-px bg-border/60" />
                </div>

                {/* Steps timeline */}
                <motion.div
                  className="space-y-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                >
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: isRTL ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.55 + i * 0.12 }}
                      className="flex items-start gap-4"
                    >
                      {/* Step number + icon */}
                      <div className="relative shrink-0">
                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-xl shadow-sm ${
                          i === 0 ? 'bg-emerald-500/10 border border-emerald-500/20' :
                          i === 1 ? 'bg-blue-500/10 border border-blue-500/20' :
                          'bg-primary/10 border border-primary/20'
                        }`}>
                          {step.icon}
                        </div>
                        {/* Connector line */}
                        {i < steps.length - 1 && (
                          <div className="absolute start-1/2 top-12 bottom-0 w-px h-4 bg-border/60 -translate-x-1/2 rtl:translate-x-1/2" />
                        )}
                      </div>
                      <div className="pt-1 space-y-0.5 flex-1 min-w-0">
                        <p className="font-black text-sm text-foreground">{step.title}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </div>

            {/* ── Stats row ───────────────────────────────────────────────── */}
            <motion.div
              className="grid grid-cols-3 gap-3 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              {(isRTL
                ? [
                    { value: '+500', label: 'طبيب يثق بنا' },
                    { value: '24/7', label: 'دعم فني متواصل' },
                    { value: '< 5 دقائق', label: 'وقت الاستجابة' },
                  ]
                : [
                    { value: '500+', label: 'Doctors Trust Us' },
                    { value: '24/7', label: 'Support Available' },
                    { value: '< 5 min', label: 'Response Time' },
                  ]
              ).map((stat, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border/60 p-4 text-center shadow-sm">
                  <p className="text-lg sm:text-xl font-black text-foreground leading-none">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground font-medium mt-1 leading-tight">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* ── CTA button ──────────────────────────────────────────────── */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.85 }}
            >
              <Button
                onClick={() => navigate('/')}
                className="h-14 px-10 rounded-2xl text-base font-black shadow-xl shadow-primary/20 gap-3 hover:scale-[1.03] active:scale-[0.97] transition-transform"
              >
                <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
                {isRTL ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
              </Button>
              <p className="text-xs text-muted-foreground font-medium mt-4">
                {isRTL
                  ? 'أو أغلق هذه النافذة وانتظر تواصلنا معك على الواتساب قريباً 🤝'
                  : 'Or close this window and expect our WhatsApp message shortly 🤝'}
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Navigation */}
      <nav
        className="fixed w-full z-[100] bg-card dark:bg-card/60 backdrop-blur-2xl border-b border-slate-200 dark:border-slate-800/50"
        style={{ top: 'var(--titlebar-height, 0px)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <Logo className="h-14 w-auto" />
          </motion.div>

          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2 font-bold text-muted-foreground hover:text-primary transition-all rounded-xl"
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
            {isRTL ? 'العودة للرئيسية' : 'Back to Home'}
          </Button>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-12 gap-12 items-start">

          {/* Form Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-7 space-y-8 text-start"
          >
            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
                {t('registration.title')}
              </h1>
              <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-xl">
                {t('registration.subtitle')}
              </p>
            </div>

            {/* Selected Plan Banner */}
            <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg">{plan === 'monthly' ? '📅' : '🗓️'}</span>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {isRTL ? 'الخطة المختارة' : 'Selected Plan'}
                  </p>
                  <p className="text-base font-black text-foreground">{planLabel}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="text-xs font-bold text-primary hover:underline"
              >
                {isRTL ? 'تغيير' : 'Change'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="glass-card p-6 md:p-10 rounded-[2.5rem] space-y-6 relative z-10">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                    {t('registration.name')}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                    <Input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder={isRTL ? "د. أحمد محمد" : "Dr. John Doe"}
                      className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                    {t('registration.job')}
                  </Label>
                  <div className="relative">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                    <Input
                      name="job"
                      value={formData.job}
                      onChange={handleChange}
                      placeholder={isRTL ? "طبيب ممارس" : "Medical Practitioner"}
                      className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                    {t('registration.specialty')}
                  </Label>
                  <div className="relative">
                    <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                    <Input
                      name="specialty"
                      value={formData.specialty}
                      onChange={handleChange}
                      placeholder={isRTL ? "أطفال / باطنة" : "Pediatrics / Internal Medicine"}
                      className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                    {t('registration.phone')}
                    <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                    <Input
                      required
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="01xxxxxxxxx"
                      className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                  {t('registration.clinicName')}
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                  <Input
                    name="clinicName"
                    value={formData.clinicName}
                    onChange={handleChange}
                    placeholder={isRTL ? "عيادة الأمل التخصصية" : "Hope Specialized Clinic"}
                    className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 ms-1 flex items-center gap-1 justify-start rtl:justify-start">
                  {t('registration.promoCode')}
                </Label>
                <div className="relative">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 rtl:left-auto rtl:right-4 z-10" />
                  <Input
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={handleChange}
                    placeholder="CO2024"
                    className="h-14 rounded-2xl border-border bg-muted/50 focus:bg-card transition-all px-14 text-base font-bold text-foreground placeholder:text-muted-foreground text-left rtl:text-right"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-5 w-5 animate-spin rounded-full border-3 border-white/30 border-t-white" />
                    {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    {t('registration.submit')}
                  </>
                )}
              </Button>
            </form>
          </motion.div>

          {/* Info Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-5 space-y-6 pt-12"
          >
            <div className="p-6 md:p-8 rounded-[2rem] bg-slate-900 dark:bg-slate-950 text-white space-y-6 relative overflow-hidden group shadow-elevated">
              <div className="absolute top-0 right-0 p-8 text-primary opacity-10 group-hover:scale-125 transition-transform duration-700">
                <Stethoscope className="h-32 w-32" />
              </div>
              <h3 className="text-2xl font-black relative z-10">
                {isRTL ? 'لماذا تختار Clinic Hub؟' : 'Why Choose Clinic Hub?'}
              </h3>
              <div className="space-y-4 relative z-10">
                {[
                  { t: isRTL ? 'تفعيل فوري' : 'Instant Activation', d: isRTL ? 'فريقنا متاح على مدار الساعة لتفعيل حسابك.' : 'Our team is available 24/7 to activate your account.' },
                  { t: isRTL ? 'دعم فني متميز' : 'Premium Support', d: isRTL ? 'مساعدة فنية متخصصة لكل الأطباء.' : 'Dedicated technical assistance for all medical staff.' },
                  { t: isRTL ? 'تحديثات مستمرة' : 'Continuous Updates', d: isRTL ? 'نحن نطور النظام باستمرار لنلبي احتياجاتك.' : 'We constantly evolve to meet your clinical needs.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-sm">{item.t}</p>
                      <p className="text-xs text-slate-400 font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 md:p-8 rounded-[2rem] space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Send className="h-4 w-4 text-emerald-500" />
                </div>
                <p className="font-bold text-sm text-foreground">
                  {isRTL ? 'بدون أي تعقيد' : 'No hassle at all'}
                </p>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                {isRTL
                  ? 'فقط أدخل بياناتك واضغط إرسال — سيتواصل معك فريق Clinic Hub مباشرةً عبر الواتساب لإتمام التفعيل خلال دقائق.'
                  : 'Just fill in your details and hit send — the Clinic Hub team will contact you directly via WhatsApp to complete activation within minutes.'}
              </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
