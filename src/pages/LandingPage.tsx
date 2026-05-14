import { motion, useScroll, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import {
  ActivitySquare,
  Users,
  Stethoscope,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Globe,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Lock,
  Smartphone,
  Cpu,
  Star,
  Plus,
  CalendarClock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePlatformPricing } from '@/hooks/usePlatformPricing';
import { SEO } from '@/components/SEO';
import { ModeToggle } from '@/components/ModeToggle';
import {
  SEO_DATA,
  getSoftwareSchema,
  getOrganizationSchema,
  getWebsiteSchema,
  getFAQSchema,
} from '@/lib/seo';

// --- Sub-components for Advanced UI ---

const MouseImageParallax = ({ children }: { children: React.ReactNode }) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    mouseX.set(clientX - innerWidth / 2);
    mouseY.set(clientY - innerHeight / 2);
  };

  const x = useSpring(useTransform(mouseX, [-500, 500], [-20, 20]), { stiffness: 100, damping: 30 });
  const y = useSpring(useTransform(mouseY, [-500, 500], [-20, 20]), { stiffness: 100, damping: 30 });

  return (
    <div onMouseMove={handleMouseMove} className="relative w-full h-full">
      <motion.div style={{ x, y }} className="w-full h-full">
        {children}
      </motion.div>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc, delay, className }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.6 }}
    whileHover={{ y: -5, scale: 1.02 }}
    className={`group p-8 rounded-[2rem] glass-card ${className}`}
  >
    <div className="h-14 w-14 rounded-2xl bg-primary/5 text-primary flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all duration-500">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="text-xl font-black text-foreground mb-3">{title}</h3>
    <p className="text-muted-foreground font-medium leading-relaxed">{desc}</p>
  </motion.div>
);

export default function LandingPage() {
   const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { pricing, isLoading: pricingLoading } = usePlatformPricing();
  const isRTL = i18n.language === 'ar';
  const containerRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const toggleLanguage = () => {
    i18n.changeLanguage(isRTL ? 'en' : 'ar');
  };

  const IconArrow = isRTL ? ArrowLeft : ArrowRight;

  return (
    <>
      <SEO
        title={SEO_DATA.landing.title}
        description={SEO_DATA.landing.description}
        keywords={SEO_DATA.landing.keywords}
        canonical={SEO_DATA.landing.canonical}
        schema={[
          getSoftwareSchema(),
          getOrganizationSchema(),
          getWebsiteSchema(),
          getFAQSchema([
            {
              q: 'What is Clinic Hub?',
              a: 'Clinic Hub is a professional, bilingual clinic management system featuring real-time patient queuing, smart prescriptions, financial analytics, and multi-role access for doctors, receptionists, and admins.',
            },
            {
              q: 'Does Clinic Hub work in Arabic?',
              a: 'Yes. Clinic Hub is fully bilingual with complete Arabic (RTL) and English (LTR) support. You can switch languages instantly without any page reload.',
            },
            {
              q: 'Is Clinic Hub available offline?',
              a: 'Yes. Clinic Hub uses Firebase Firestore with persistent offline cache, so it continues to work even in low-connectivity clinic environments.',
            },
          ]),
        ]}
      />
    <div ref={containerRef} className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary overflow-x-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* --- Advanced Navigation --- */}
      <nav className="fixed w-full z-[100] bg-background/60 backdrop-blur-2xl border-b border-border/50" style={{ top: 'var(--titlebar-height, 0px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 ring-1 ring-white/20 shrink-0">
              <ActivitySquare className="h-6 w-6 text-white" />
            </div>
            <span className="hidden sm:inline text-2xl font-black text-foreground tracking-tighter">Clinic Hub</span>
          </motion.div>

          <div className="flex items-center gap-2 sm:gap-6">
            <ModeToggle />
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleLanguage}
              className="gap-2 font-bold text-muted-foreground hover:text-primary transition-all rounded-xl px-2 sm:px-3"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">{isRTL ? 'English' : 'عربي'}</span>
              <span className="sm:hidden">{isRTL ? 'EN' : 'AR'}</span>
            </Button>
            
            <div className="h-6 w-px bg-border hidden sm:block" />

            <Button 
              variant="ghost"
              size="sm" 
              className="flex font-bold text-muted-foreground hover:text-primary transition-all rounded-xl px-2 sm:px-3"
              onClick={() => navigate('/login')}
            >
              <span className="hidden sm:inline">{t('landing.hero.login')}</span>
              <span className="sm:hidden text-xs">{isRTL ? 'دخول' : 'Login'}</span>
            </Button>
            
            <Button 
              size="sm" 
              className="font-bold rounded-xl shadow-lg shadow-primary/25 px-4 sm:px-6 text-xs sm:text-sm"
              onClick={() => navigate(`/subscribe?plan=${billingCycle}`)}
            >
              {t('landing.hero.getStarted')}
            </Button>
          </div>
        </div>
      </nav>

      {/* --- Hero Section with Parallax --- */}
      <section className="relative pt-40 pb-32 lg:pt-52 lg:pb-48 overflow-hidden bg-background">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-b from-primary/5 to-transparent -skew-x-12 translate-x-1/4 pointer-events-none" />
        
        {/* Animated Blobs */}
        <div className="absolute top-1/4 left-0 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-400/10 rounded-full blur-[150px] animate-pulse pointer-events-none" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center text-start">
            <motion.div
               initial={{ opacity: 0, x: isRTL ? 50 : -50 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.8, ease: "easeOut" }}
               className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/10 text-primary text-xs font-bold uppercase tracking-widest"
              >
                <Zap className="h-3.5 w-3.5 fill-current" />
                {isRTL ? 'يثق بها أكثر من 500 عيادة حول العالم' : 'Trusted by 500+ Clinics Worldwide'}
              </motion.div>

              <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-foreground tracking-tight leading-[0.95] !mb-4">
                {isRTL ? (
                  <>
                    <span className="text-primary italic block mb-2">{t('landing.hero.title').split(' ')[0]}</span>
                    {t('landing.hero.title').split(' ').slice(1).join(' ')}
                  </>
                ) : (
                  <>
                    {t('landing.hero.title').split(' ').slice(0, -1).join(' ')}<br />
                    <span className="text-primary italic">{t('landing.hero.title').split(' ').slice(-1)}</span>
                  </>
                )}
              </h1>

              <p className="text-xl text-muted-foreground max-w-xl font-medium leading-relaxed">
                {t('landing.hero.subtitle')}
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-black shadow-2xl shadow-primary/30 transition-all hover:scale-105 group bg-primary"
                  onClick={() => navigate(`/subscribe?plan=${billingCycle}`)}
                >
                  {t('landing.hero.getStarted')}
                  <IconArrow className="ms-2 h-5 w-5 group-hover:translate-x-1 transition-transform rtl:rotate-180" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-bold border-border hover:bg-muted transition-all text-foreground bg-background"
                  onClick={() => navigate('/track')}
                >
                  {t('landing.hero.secondaryCTA')}
                </Button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-8 pt-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
                 <div className="flex items-center gap-2 font-black text-muted-foreground">
                    <ShieldCheck className="h-6 w-6" /> {isRTL ? 'آمن 100%' : 'SECURE'}
                 </div>
                 <div className="flex items-center gap-2 font-black text-muted-foreground">
                    <Star className="h-6 w-6" /> 4.9/5
                 </div>
                 <div className="flex items-center gap-2 font-black text-muted-foreground">
                    <Users className="h-6 w-6" /> {isRTL ? 'خصوصية البيانات' : 'HIPAA'}
                 </div>
              </div>
            </motion.div>

            {/* Parallax Image Mockup */}
            <motion.div
               initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
               animate={{ opacity: 1, scale: 1, rotate: 0 }}
               transition={{ duration: 1, ease: "circOut" }}
               className="relative hidden lg:block"
            >
               <MouseImageParallax>
                  <div className="relative group">
                    <div className="absolute -inset-4 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-1000" />
                    
                    {/* Main Mockup Card */}
                    <div className="relative bg-[#1E293B] rounded-[2.5rem] shadow-2xl p-1 overflow-hidden ring-1 ring-white/10 aspect-square flex flex-col items-center justify-center">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-transparent opacity-50" />
                       
                       {/* Abstract UI Elements */}
                       <motion.div 
                          animate={{ y: [0, -10, 0] }}
                          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                          className="w-[80%] h-12 bg-white/5 rounded-xl mb-4 border border-white/10" 
                       />
                       <div className="grid grid-cols-2 gap-4 w-[80%]">
                          <motion.div 
                             animate={{ scale: [1, 1.05, 1] }}
                             transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                             className="h-32 bg-primary/10 rounded-2xl border border-primary/20 flex items-center justify-center"
                          >
                             <ActivitySquare className="h-10 w-10 text-primary" />
                          </motion.div>
                          <div className="space-y-4">
                             <div className="h-4 bg-white/10 rounded-full w-full" />
                             <div className="h-4 bg-white/10 rounded-full w-[60%]" />
                             <div className="h-4 bg-white/10 rounded-full w-[80%]" />
                          </div>
                       </div>
                       
                       {/* Floating Overlay Card */}
                       <motion.div 
                          initial={{ x: 50, y: 50 }}
                          animate={{ x: 20, y: 40 }}
                          className="absolute bottom-10 right-0 bg-card shadow-2xl rounded-3xl p-6 border border-border flex items-center gap-4"
                       >
                          <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                             <CheckCircle2 className="h-6 w-6" />
                          </div>
                          <div className="text-start">
                             <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{isRTL ? 'موعد طبي' : 'Appointment'}</p>
                             <p className="text-sm font-black text-foreground">{isRTL ? 'مؤكد وجاهز ✓' : 'Confirmed & Ready'}</p>
                          </div>
                       </motion.div>
                    </div>
                  </div>
               </MouseImageParallax>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Bento Grid Section --- */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="px-4 py-1.5 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] inline-block mb-2"
            >
              {isRTL ? 'كفاءة لا مثيل لها' : 'Efficiency Redefined'}
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-foreground tracking-tight"
            >
              {t('landing.bento.title')}
            </motion.h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-auto md:auto-rows-[250px] lg:auto-rows-[300px]">
             {/* Large Bento Item */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="md:col-span-8 md:row-span-1 rounded-[2.5rem] glass-card p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 overflow-hidden group"
             >
                <div className="flex-1 space-y-4 text-start">
                   <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-500">
                      <Users className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground">{t('landing.bento.records.title')}</h3>
                   <p className="text-muted-foreground font-medium leading-relaxed max-w-sm">
                      {t('landing.bento.records.desc')}
                   </p>
                </div>
                <div className="flex-1 w-full h-full bg-muted/50 rounded-3xl border border-border p-6 flex items-center justify-center relative group-hover:scale-105 transition-transform duration-700">
                   <div className="space-y-2 w-full">
                      {[1,2,3].map(i => (
                        <div key={i} className="h-10 bg-card rounded-xl shadow-sm border border-border flex items-center px-4 gap-3">
                           <div className="h-4 w-4 rounded-full bg-primary/20" />
                           <div className="h-2 w-24 bg-muted rounded-full" />
                        </div>
                      ))}
                   </div>
                </div>
             </motion.div>

             {/* Small Bento Item */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="md:col-span-4 md:row-span-1 rounded-[2.5rem] bg-slate-900 dark:bg-slate-950 p-6 md:p-10 flex flex-col justify-end text-start overflow-hidden relative group hover:scale-[0.98] transition-all duration-500 ring-1 ring-white/10 shadow-elevated"
             >
                <div className="absolute top-0 right-0 p-8 text-primary opacity-20 group-hover:scale-125 transition-transform duration-700">
                   <Lock className="h-20 w-20" />
                </div>
                <div className="relative z-10 space-y-3">
                   <h3 className="text-2xl font-black text-white">{t('landing.bento.security.title')}</h3>
                   <p className="text-slate-400 dark:text-slate-300 font-medium leading-tight">
                      {t('landing.bento.security.desc')}
                   </p>
                </div>
             </motion.div>

             {/* Medium Bento Item */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="md:col-span-6 md:row-span-1 rounded-[2.5rem] gradient-primary p-6 md:p-10 flex flex-col justify-between text-start group shadow-glow hover:shadow-elevated transition-shadow duration-500"
             >
                <div className="h-16 w-16 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/10 group-hover:scale-110 transition-transform">
                   <Cpu className="h-8 w-8" />
                </div>
                <div className="space-y-3">
                   <h3 className="text-2xl font-black text-white">{t('landing.bento.speed.title')}</h3>
                   <p className="text-white/70 font-medium font-medium leading-relaxed">
                      {t('landing.bento.speed.desc')}
                   </p>
                </div>
             </motion.div>

             {/* Long Bento Item */}
             <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-6 md:row-span-1 rounded-[2.5rem] glass-card p-6 md:p-10 flex flex-col md:flex-row items-center gap-6 md:gap-10 overflow-hidden group"
             >
                <div className="flex-1 space-y-3 text-start">
                   <div className="h-14 w-14 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-2 group-hover:rotate-12 transition-transform duration-500">
                      <Smartphone className="h-7 w-7" />
                   </div>
                   <h3 className="text-2xl font-black text-foreground">{t('landing.bento.mobile.title')}</h3>
                   <p className="text-muted-foreground font-medium leading-relaxed">
                      {t('landing.bento.mobile.desc')}
                   </p>
                </div>
                <div className="relative group-hover:-translate-x-4 transition-transform duration-700">
                   <div className="w-24 h-48 bg-slate-900 dark:bg-slate-950 rounded-2xl border-4 border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-1">
                      <div className="w-full h-full bg-slate-800 rounded-lg flex flex-col items-center justify-center gap-2">
                         <div className="h-1 w-12 bg-white/20 rounded-full" />
                         <div className="h-1 w-10 bg-white/20 rounded-full" />
                         <div className="h-8 w-8 rounded-lg bg-primary/20" />
                      </div>
                   </div>
                </div>
             </motion.div>
          </div>
        </div>
      </section>

      {/* --- Advanced Features Section --- */}
      <section className="py-24 bg-background relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
             <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl font-black text-foreground tracking-tight"
            >
              {t('landing.features.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-lg text-muted-foreground font-medium max-w-2xl mx-auto"
            >
              {t('landing.features.subtitle')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
               icon={CalendarClock} 
               title={t('landing.features.queue.title')} 
               desc={t('landing.features.queue.desc')} 
               delay={0.1} 
            />
            <FeatureCard 
               icon={Stethoscope} 
               title={t('landing.features.workspace.title')} 
               desc={t('landing.features.workspace.desc')} 
               delay={0.2} 
            />
            <FeatureCard 
               icon={BarChart3} 
               title={t('landing.features.analytics.title')} 
               desc={t('landing.features.analytics.desc')} 
               delay={0.3} 
            />
          </div>
        </div>
      </section>

      {/* --- Performance/Impact Stats --- */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary opacity-5 mix-blend-color pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
           <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center md:text-start">
              {[
                { val: "50K+", label: t('landing.stats.patients'), sub: isRTL ? 'معاملة شهرية' : 'Monthly Transactions' },
                { val: "1.2K+", label: t('landing.stats.clinics'), sub: isRTL ? 'مستخدم محترف' : 'Professional Users' },
                { val: "99.9%", label: t('landing.stats.uptime'), sub: isRTL ? 'موثوقية مضمونة' : 'Reliability Guaranteed' },
                { val: "2.0", label: isRTL ? 'الإصدار' : 'Version', sub: isRTL ? 'تقنيات متطورة' : 'Cutting-edge Stack' }
              ].map((stat, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  key={i} 
                  className="space-y-1"
                >
                   <h3 className="text-4xl md:text-5xl font-black text-primary tracking-tighter">{stat.val}</h3>
                   <p className="text-slate-100 font-black tracking-widest text-xs uppercase">{stat.label}</p>
                   <p className="text-slate-500 text-[10px] uppercase tracking-widest font-bold">{stat.sub}</p>
                </motion.div>
              ))}
           </div>
        </div>
      </section>

      {/* --- Advanced Pricing Section --- */}
      <section className="py-32 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
             <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-4xl md:text-5xl font-black text-foreground tracking-tight"
            >
              {t('landing.pricing.title')}
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto"
            >
              {t('landing.pricing.subtitle')}
            </motion.p>
          </div>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex justify-center mb-16"
          >
            <div className="bg-muted p-1 rounded-[1.25rem] flex items-center gap-1 border border-border/50">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-8 py-3 rounded-[1rem] text-sm font-black transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-card text-primary shadow-xl shadow-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('landing.pricing.plan.monthly')}
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-8 py-3 rounded-[1rem] text-sm font-black transition-all duration-300 relative ${billingCycle === 'yearly' ? 'bg-card text-primary shadow-xl shadow-primary/10' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {t('landing.pricing.plan.yearly')}
                {pricing.monthlyPrice > 0 && pricing.yearlyPrice < (pricing.monthlyPrice * 12) && (
                  <span className="absolute -top-3 -right-3 bg-primary text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-lg shadow-primary/20 border-2 border-background">
                    {isRTL ? `وفر ${Math.round(((pricing.monthlyPrice * 12 - pricing.yearlyPrice) / (pricing.monthlyPrice * 12)) * 100)}%` : `Save ${Math.round(((pricing.monthlyPrice * 12 - pricing.yearlyPrice) / (pricing.monthlyPrice * 12)) * 100)}%`}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          <div className="max-w-2xl mx-auto">
             {/* Unified Plan */}
             <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-[3rem] glass-card-premium glass-card-glow p-8 md:p-12 flex flex-col items-start gap-8 relative"
             >
                <div className="space-y-2 text-start">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-2">
                      <Star className="h-3 w-3 fill-current" />
                      {isRTL ? 'كل شيء مشمول' : 'Everything Included'}
                   </div>
                   <h3 className="text-3xl font-black text-foreground">{t('landing.pricing.plan.title')}</h3>
                   <p className="text-muted-foreground font-medium text-lg">{t('landing.pricing.plan.desc')}</p>
                </div>
                <div className="flex items-baseline gap-2">
                   <motion.span 
                      key={billingCycle}
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-7xl font-black text-foreground"
                   >
                      {pricingLoading ? '...' : (billingCycle === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice)}
                   </motion.span>
                   <div className="flex flex-col">
                      <span className="text-primary font-black text-2xl leading-none">{t('landing.pricing.plan.currency')}</span>
                      <span className="text-muted-foreground font-bold text-sm uppercase tracking-widest">
                         / {billingCycle === 'monthly' ? t('landing.pricing.plan.monthly') : t('landing.pricing.plan.yearly')}
                      </span>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4 w-full text-start flex-1">
                   {(t('landing.pricing.plan.features', { returnObjects: true }) as string[]).map((f: string, i: number) => (
                      <div key={i} className="flex items-center gap-3 text-muted-foreground font-medium">
                         <CheckCircle2 className="h-5 w-5 text-primary" />
                         {f}
                      </div>
                   ))}
                </div>
                <Button 
                   size="lg" 
                   className="w-full h-20 rounded-2xl text-xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform"
                   onClick={() => navigate(`/subscribe?plan=${billingCycle}`)}
                >
                   {t('landing.hero.getStarted')}
                </Button>
             </motion.div>
          </div>
        </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="py-24 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
             <h2 className="text-4xl font-black text-foreground tracking-tight">{t('landing.faq.title')}</h2>
             <p className="text-lg text-muted-foreground font-medium">{t('landing.faq.subtitle')}</p>
          </div>
          <div className="space-y-6">
             {[1, 2, 3].map((i) => (
               <motion.div 
                 key={i}
                 initial={{ opacity: 0, y: 10 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true }}
                 transition={{ delay: i * 0.1 }}
                 className="p-8 rounded-3xl bg-muted/50 border border-border text-start"
               >
                 <h4 className="text-lg font-black text-foreground mb-2 flex items-center gap-3">
                   <Plus className="h-5 w-5 text-primary" />
                   {t(`landing.faq.q${i}.q`)}
                 </h4>
                 <p className="text-muted-foreground font-medium leading-relaxed ps-8">
                   {t(`landing.faq.q${i}.a`)}
                 </p>
               </motion.div>
             ))}
          </div>
        </div>
      </section>

      {/* --- Optimized CTA --- */}
      <section className="py-32 relative bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center bg-slate-900 rounded-[4rem] p-16 md:p-24 relative overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.1)]">
           <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent pointer-events-none" />
           
           <motion.div
             initial={{ opacity: 0, scale: 0.9 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
             className="space-y-10 relative z-10"
           >
              <div className="space-y-4">
                 <h2 className="text-5xl md:text-6xl font-black text-white leading-tight tracking-tighter">
                   {t('landing.cta.title')}
                 </h2>
                 <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
                   {t('landing.cta.desc')}
                 </p>
              </div>

              <div className="flex flex-col items-center gap-8">
                 <Button 
                    size="lg" 
                    className="px-16 h-20 rounded-[1.5rem] text-2xl font-black shadow-2xl shadow-primary/50 hover:scale-105 transition-all"
                    onClick={() => navigate(`/subscribe?plan=${billingCycle}`)}
                 >
                    {t('landing.cta.button')}
                 </Button>

                 <div className="flex flex-wrap justify-center gap-8 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px]">
                    <div className="flex items-center gap-2">
                       <CheckCircle2 className="h-4 w-4 text-primary" />
                       {isRTL ? 'بدون رسوم تسجيل' : 'No Setup Fee'}
                    </div>
                    <div className="flex items-center gap-2">
                       <Lock className="h-4 w-4 text-primary" />
                       {isRTL ? 'خصوصية البيانات أولاً' : 'Data Privacy First'}
                    </div>
                    <div className="flex items-center gap-2">
                       <ActivitySquare className="h-4 w-4 text-primary" />
                       {isRTL ? 'تطوير مستمر' : 'Active Development'}
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      </section>

      {/* --- Modern Footer --- */}
      <footer className="bg-background pt-32 pb-16 border-t border-border/50">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-4 gap-12 mb-20 text-start">
               <div className="col-span-1 md:col-span-2 space-y-8">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-foreground flex items-center justify-center">
                       <ActivitySquare className="h-6 w-6 text-background" />
                    </div>
                    <span className="text-2xl font-black text-foreground tracking-tighter">Clinic Hub</span>
                  </div>
                  <p className="text-muted-foreground font-medium max-w-sm leading-relaxed">
                     {isRTL
                       ? 'نُمكّن المتخصصين الطبيين بأدوات ذكية مصممة للتميز. انضم إلى مستقبل الرعاية الصحية اليوم.'
                       : 'Empowering medical professionals with intelligent tools designed for excellence. Join the future of healthcare today.'}
                  </p>
               </div>
               
               <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{isRTL ? 'المنصة' : 'Platform'}</h4>
                  <ul className="space-y-4 text-muted-foreground font-bold">
                     <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/login')}>
                        {isRTL ? 'تسجيل دخول العيادة' : 'Clinic Login'}
                     </li>
                     <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate(`/subscribe?plan=${billingCycle}`)}>
                        {isRTL ? 'الأسعار والاشتراكات' : 'Pricing & Plans'}
                     </li>
                     <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => navigate('/track')}>
                        {isRTL ? 'تتبع حالة الطلب' : 'Track Request Status'}
                     </li>
                  </ul>
               </div>

               <div className="space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">{isRTL ? 'الدعم الفني' : 'Support'}</h4>
                  <ul className="space-y-4 text-muted-foreground font-bold">
                     <li>
                        <a href="https://wa.me/201153762560" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors flex items-center gap-2">
                           {isRTL ? 'محادثة واتساب' : 'WhatsApp Chat'}
                        </a>
                     </li>
                     <li>
                        <a href="tel:+201153762560" className="hover:text-primary transition-colors flex items-center gap-2" dir="ltr">
                           +20 115 376 2560
                        </a>
                     </li>
                     <li className="hover:text-primary transition-colors cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                        {isRTL ? 'العودة للأعلى' : 'Back to Top'}
                     </li>
                  </ul>
               </div>
            </div>

            <div className="pt-10 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
               <p className="text-muted-foreground text-xs font-bold uppercase tracking-[0.3em]">
                  © {new Date().getFullYear()} {isRTL ? 'Clinic Hub — جميع الحقوق محفوظة.' : 'Clinic Hub Management. All rights reserved.'}
               </p>
               <div className="flex items-center gap-6 opacity-30">
                  <div className="h-6 w-12 bg-slate-400 rounded-md" />
                  <div className="h-6 w-12 bg-slate-400 rounded-md" />
                  <div className="h-6 w-12 bg-slate-400 rounded-md" />
               </div>
            </div>
         </div>
      </footer>
    </div>
    </>
  );
}
