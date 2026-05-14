import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  ActivitySquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlatformPricing } from '@/hooks/usePlatformPricing';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const whatsappNumber = '201153762560';
    const divider = '\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501';
    
    const lines: string[] = [];
    
    if (isRTL) {
      lines.push(`*[ Clinic Hub ] طلب اشتراك جديد*`);
      lines.push(divider);
      lines.push('');
      lines.push(`*الاسم:* ${formData.name}`);
      if (formData.job) lines.push(`*المهنة:* ${formData.job}`);
      if (formData.specialty) lines.push(`*التخصص:* ${formData.specialty}`);
      lines.push(`*الهاتف:* ${formData.phone}`);
      if (formData.clinicName) lines.push(`*العيادة:* ${formData.clinicName}`);
      lines.push('');
      lines.push(divider);
      lines.push('');
      lines.push(`*الخطة المختارة:*`);
      lines.push(`  ${plan === 'monthly' ? '[خطة شهرية]' : '[خطة سنوية]'} ${planLabel}`);
      if (formData.promoCode) lines.push(`*كود الخصم:* ${formData.promoCode}`);
      lines.push('');
      lines.push(divider);
      lines.push(`_تم الإرسال عبر بوابة العيادة_`);
    } else {
      lines.push(`*[ Clinic Hub ] New Subscription Request*`);
      lines.push(divider);
      lines.push('');
      lines.push(`*Name:* ${formData.name}`);
      if (formData.job) lines.push(`*Profession:* ${formData.job}`);
      if (formData.specialty) lines.push(`*Specialty:* ${formData.specialty}`);
      lines.push(`*Phone:* ${formData.phone}`);
      if (formData.clinicName) lines.push(`*Clinic:* ${formData.clinicName}`);
      lines.push('');
      lines.push(divider);
      lines.push('');
      lines.push(`*Selected Plan:*`);
      lines.push(`  ${plan === 'monthly' ? '[Monthly Plan]' : '[Yearly Plan]'} ${planLabel}`);
      if (formData.promoCode) lines.push(`*Promo Code:* ${formData.promoCode}`);
      lines.push('');
      lines.push(divider);
      lines.push(`_Sent via Clinic Portal_`);
    }

    const message = lines.join('\n');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      setIsSubmitting(false);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

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
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20">
              <ActivitySquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-black text-foreground tracking-tighter">Clinic Hub</span>
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
                className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4"
              >
                {isSubmitting ? t('registration.success') : t('registration.submit')}
                {!isSubmitting && <IconArrow className="ms-3 h-5 w-5 rtl:rotate-180" />}
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
                <ActivitySquare className="h-32 w-32" />
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
               <p className="text-slate-500 dark:text-slate-400 font-medium text-sm leading-relaxed">
                  {isRTL 
                    ? 'بعد إرسال الطلب، سيتم تحويلك إلى واتساب. يرجى إرسال الرسالة المكتوبة وسيتواصل معك أحد ممثلينا خلال دقائق.' 
                    : 'After submitting, you will be redirected to WhatsApp. Please send the pre-written message and a representative will contact you within minutes.'}
               </p>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
