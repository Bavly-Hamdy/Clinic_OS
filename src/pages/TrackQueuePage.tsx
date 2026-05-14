import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { Appointment } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Search,
  Clock,
  UserCheck,
  Stethoscope,
  ActivitySquare,
  Phone,
  ArrowLeft,
  ArrowRight,
  Globe
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SEO } from '@/components/SEO';
import { SEO_DATA } from '@/lib/seo';

export default function TrackQueuePage() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar' || !i18n.language; // fallback to 'ar' behavior if needed
  
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [myAppointment, setMyAppointment] = useState<Appointment | null>(null);
  const [patientsAhead, setPatientsAhead] = useState<number>(0);
  const [totalWaiting, setTotalWaiting] = useState<number>(0);

  const toggleLanguage = () => {
    i18n.changeLanguage(isRTL ? 'en' : 'ar');
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 8) return;

    setLoading(true);
    setError(null);
    setMyAppointment(null);
    setPatientsAhead(0);

    try {
      const todayString = new Date().toISOString().slice(0, 10);
      const q = query(
        collection(db, 'appointments'),
        where('patientPhone', '==', phoneNumber),
      );

      const snap = await getDocs(q);
      const activeToday = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Appointment))
        .filter(a => {
          const isToday = (a.scheduledAt || '').startsWith(todayString);
          return isToday && (a.status === 'WAITING' || a.status === 'IN_CLINIC');
        });

      if (activeToday.length === 0) {
        setError(t('trackPage.noActiveAppt'));
        setLoading(false);
        return;
      }

      activeToday.sort((a, b) => a.queueNumber - b.queueNumber);
      setMyAppointment(activeToday[0]);
      setLoading(false);
    } catch (err) {
      console.error('Search error:', err);
      setError(t('trackPage.searchError'));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!myAppointment?.id || !myAppointment.doctorId) return;

    const todayString = new Date().toISOString().slice(0, 10);
    const qDoctor = query(collection(db, 'appointments'), where('doctorId', '==', myAppointment.doctorId));

    const unsubscribe = onSnapshot(qDoctor, (snap) => {
      const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      
      const me = allDocs.find(a => a.id === myAppointment.id);
      if (me) {
        setMyAppointment((prev) => {
          if (!prev) return me;
          if (prev.status !== me.status || prev.queueNumber !== me.queueNumber) return me;
          return prev;
        });
      }

      const todayWaiting = allDocs.filter(a => 
        a.status === 'WAITING' && (a.scheduledAt || '').startsWith(todayString)
      );

      setTotalWaiting(todayWaiting.length);

      if (me?.status === 'WAITING') {
        const ahead = todayWaiting.filter(a => a.queueNumber < me.queueNumber).length;
        setPatientsAhead(ahead);
      } else {
        setPatientsAhead(0);
      }
    }, (err) => console.error('onSnapshot error:', err));

    return () => unsubscribe();
  }, [myAppointment?.id, myAppointment?.doctorId]);

  const IconArrow = isRTL ? ArrowLeft : ArrowRight;
  const BackArrow = isRTL ? ArrowRight : ArrowLeft;

  return (
    <>
      <SEO
        title={SEO_DATA.track.title}
        description={SEO_DATA.track.description}
        keywords={SEO_DATA.track.keywords}
        canonical={SEO_DATA.track.canonical}
      />
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#050505] flex flex-col items-center p-4 pt-12 md:pt-20 font-sans relative text-slate-900 overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      
      {/* ─── Creative Background Blobs ─── */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-400/10 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] right-[10%] w-[30%] h-[30%] bg-purple-400/10 rounded-full blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 end-6 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleLanguage} 
          className="gap-2 bg-white/40 dark:bg-black/40 backdrop-blur-xl rounded-2xl border-white/20 dark:border-white/10 text-foreground hover:bg-white/60 transition-all font-bold shadow-xl shadow-black/5"
        >
          <Globe className="h-4 w-4 text-primary" />
          <span className="hidden sm:inline">{isRTL ? 'English' : 'عربي'}</span>
          <span className="sm:hidden">{isRTL ? 'EN' : 'AR'}</span>
        </Button>
      </div>

      {/* ─── App Header ─── */}
      <div className="relative z-10 flex flex-col items-center gap-3 mb-12 text-center animate-fade-in">
        <div className="group relative">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative h-20 w-20 rounded-[2rem] bg-white dark:bg-black flex items-center justify-center shadow-2xl border border-white/20 dark:border-white/10 transition-transform duration-500 group-hover:scale-110">
            <ActivitySquare className="h-10 w-10 text-primary animate-pulse-subtle" />
          </div>
        </div>
        <div className="mt-4">
          <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/60">
            Clinic Hub
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="h-1 w-1 rounded-full bg-primary" />
            <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.3em]">{t('trackPage.subtitle')}</p>
            <span className="h-1 w-1 rounded-full bg-primary" />
          </div>
        </div>
      </div>

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* ─── Search Section ─── */}
        {!myAppointment ? (
          <div className="glass-card-premium rounded-[3rem] p-10 animate-fade-in-up border-white/40 dark:border-white/5">
            <div className="text-center mb-10">
               <h2 className="text-3xl font-black text-foreground tracking-tight">{t('trackPage.welcome')}</h2>
               <p className="text-muted-foreground mt-2 font-medium text-sm">{t('trackPage.enterPhone')}</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-6">
              <div className="space-y-3">
                <div className="relative group">
                  <div className="absolute start-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/50 group-focus-within:text-primary transition-colors z-10">
                    <Phone className="h-full w-full" />
                  </div>
                  <Input
                    type="tel"
                    placeholder={t('trackPage.phonePlaceholder')}
                    className="ps-14 h-16 bg-white/50 dark:bg-black/50 border-white/20 dark:border-white/10 focus:bg-white dark:focus:bg-black focus-visible:ring-primary/20 text-xl font-black rounded-3xl text-center tracking-[0.15em] transition-all placeholder:text-muted-foreground/30 shadow-inner"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    dir="ltr"
                  />
                </div>
                {error && (
                  <p className="text-destructive text-xs font-bold text-center animate-shake bg-destructive/5 py-2 rounded-xl border border-destructive/10">{error}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full h-16 rounded-[1.5rem] text-lg font-black bg-primary text-primary-foreground hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary/20 flex items-center gap-3 group"
                disabled={loading || phoneNumber.length < 8}
              >
                {loading ? (
                  <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{t('trackPage.trackBtn')}</span>
                    <IconArrow className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>
            
            <div className="mt-8 flex items-center justify-center gap-3 opacity-40">
                <div className="h-px w-8 bg-muted-foreground" />
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest">
                    {t('trackPage.privacy')}
                </p>
                <div className="h-px w-8 bg-muted-foreground" />
            </div>
          </div>
        ) : (
          /* ─── Results Section ─── */
          <div className="space-y-6 animate-fade-in">
             <button 
               onClick={() => setMyAppointment(null)}
               className="flex items-center gap-2 text-muted-foreground hover:text-primary font-bold transition-all group ps-4"
             >
                <div className="h-8 w-8 rounded-full bg-white/50 dark:bg-black/50 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-primary group-hover:text-white transition-all">
                  <BackArrow className="h-4 w-4" />
                </div>
                <span className="text-sm">{t('trackPage.changeNumber')}</span>
             </button>

             <div className="glass-card-premium rounded-[3rem] overflow-hidden border-white/40 dark:border-white/5">
               {/* Header Section */}
               <div className="relative p-10 text-center overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                 
                 <div className="relative z-10 space-y-6">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-primary/10 text-primary border border-primary/20 shadow-inner">
                       <Users className="h-8 w-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-muted-foreground">{t('trackPage.welcomePatient', { name: myAppointment.patientName })}</h3>
                      <div className="mt-2 flex items-center justify-center gap-4">
                         <div className="h-px w-8 bg-primary/20" />
                         <span className="text-4xl font-black tracking-tighter text-foreground">
                           {t('trackPage.queueNo', { num: myAppointment.queueNumber })}
                         </span>
                         <div className="h-px w-8 bg-primary/20" />
                      </div>
                    </div>
                 </div>
               </div>

               <div className="px-8 pb-10 space-y-10">
                 <div className="flex flex-col items-center text-center gap-6">
                   {myAppointment.status === 'IN_CLINIC' ? (
                     <div className="space-y-6 py-6 w-full animate-in zoom-in-95 duration-500">
                        <div className="relative flex justify-center">
                           <div className="absolute inset-0 bg-success/20 rounded-full blur-3xl animate-pulse" />
                           <div className="relative h-28 w-28 rounded-[2rem] bg-success/10 flex items-center justify-center border-2 border-success/30 text-success shadow-2xl">
                              <Stethoscope className="h-12 w-12" />
                           </div>
                        </div>
                        <div className="space-y-2">
                          <h4 className="text-4xl font-black text-success tracking-tight">{t('trackPage.inClinic')}</h4>
                          <p className="text-muted-foreground font-bold text-sm tracking-wide">{t('trackPage.doctorWaiting')}</p>
                        </div>
                     </div>
                   ) : patientsAhead === 0 ? (
                    <div className="space-y-6 py-6 w-full animate-in zoom-in-95 duration-500">
                       <div className="relative flex justify-center">
                          <div className="absolute inset-0 bg-info/20 rounded-full blur-3xl animate-pulse" />
                          <div className="relative h-28 w-28 rounded-[2rem] bg-info/10 flex items-center justify-center border-2 border-info/30 text-info shadow-2xl animate-bounce">
                             <UserCheck className="h-12 w-12" />
                          </div>
                       </div>
                       <div className="space-y-2">
                         <h4 className="text-4xl font-black text-info tracking-tight">{t('trackPage.nextPatient')}</h4>
                         <p className="text-muted-foreground font-bold text-sm tracking-wide">{t('trackPage.waitNearDoor')}</p>
                       </div>
                    </div>
                   ) : (
                     <div className="space-y-10 w-full animate-in slide-in-from-bottom-8 duration-700">
                        <div className="relative flex flex-col items-center">
                           <div className="relative flex items-center justify-center h-48 w-48">
                              {/* Background Rings */}
                              <div className="absolute inset-0 rounded-full border-4 border-muted/20" />
                              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin duration-[3s]" />
                              
                              <div className="text-center relative z-10">
                                <span className="block text-7xl font-black text-foreground drop-shadow-sm leading-none">
                                  {patientsAhead}
                                </span>
                                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-2">
                                  {t('trackPage.patientsAhead')}
                                </span>
                              </div>
                           </div>
                           
                           <Badge className="mt-8 bg-warning text-white border-white dark:border-black border-2 px-4 py-1.5 rounded-full text-xs font-black shadow-lg shadow-warning/20 animate-pulse">
                             {t('trackPage.liveNow')}
                           </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="glass-card-premium p-6 rounded-[2rem] border-white/40 dark:border-white/10 text-center space-y-2 group hover:scale-[1.05] transition-transform duration-300">
                             <div className="h-10 w-10 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-1">
                                <Users className="h-5 w-5 text-muted-foreground" />
                             </div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('trackPage.totalWaiting')}</p>
                             <p className="text-3xl font-black text-foreground">{totalWaiting}</p>
                          </div>
                          <div className="glass-card-premium p-6 rounded-[2rem] border-white/40 dark:border-white/10 text-center space-y-2 group hover:scale-[1.05] transition-transform duration-300">
                             <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
                                <Clock className="h-5 w-5 text-primary" />
                             </div>
                             <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('trackPage.expectedTime')}</p>
                             <p className="text-3xl font-black text-foreground">{t('trackPage.minsApx', { mins: patientsAhead * 15 })}</p>
                          </div>
                        </div>
                     </div>
                   )}
                 </div>

                 {/* Footer Status */}
                 <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-muted-foreground">
                    <div className="flex items-center gap-2 bg-muted/20 px-4 py-2 rounded-2xl">
                       <Clock className="h-4 w-4 text-primary" />
                       <span className="text-[10px] font-black uppercase tracking-widest">
                          {t('trackPage.lastUpdate', { time: new Date().toLocaleTimeString(isRTL ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }) })}
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       <span className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                       <span className="text-[10px] font-black tracking-widest uppercase opacity-70">Cloud Sync Active</span>
                    </div>
                 </div>
               </div>
             </div>

             {/* Pro Tip */}
             <div className="glass-card-premium rounded-[2rem] p-6 text-center border-white/20 dark:border-white/5 shadow-none relative group overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <p className="text-xs font-bold text-muted-foreground relative z-10 leading-relaxed">
                  <span className="text-primary me-2">💡</span>
                  {t('trackPage.tip')}
                </p>
             </div>
          </div>
        )}
      </div>

      <footer className="mt-auto py-12 text-muted-foreground/40 text-[10px] font-black uppercase tracking-[0.4em] text-center" dir="ltr">
         &copy; {new Date().getFullYear()} {t('trackPage.footer', { clinic: 'Clinic Hub', year: '' }).replace(new Date().getFullYear().toString(), '').trim()}
      </footer>
    </div>
    </>
  );
}
