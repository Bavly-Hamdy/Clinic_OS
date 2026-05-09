import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import {
  CalendarClock, Users, CreditCard, DollarSign, BarChart3, Settings,
  ArrowRight, ArrowLeft, Stethoscope, Activity, HeartPulse, Clock, TrendingUp, UserCheck
} from 'lucide-react';
import { Appointment, Payment } from '@/types/clinic';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export default function DashboardHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const { t, i18n } = useTranslation();
  
  const currentLang = i18n.language?.split('-')[0] || 'en';
  const locale = currentLang === 'ar' ? ar : enUS;
  const isRtl = currentLang === 'ar';

  // Live Data State
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);

  useEffect(() => {
    // Auth Guard: Only attach listeners if user is logged in
    if (!user || !user.id) return;
    
    setMounted(true);
    
    // Setup date boundaries for today
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

    // 1. Listen to today's appointments (Filtered by doctorId)
    // Simplified query to bypass composite index requirements
    const qAppts = query(
      collection(db, 'appointments'),
      where('doctorId', '==', effectiveDoctorId),
    );
    const unsubAppts = onSnapshot(qAppts, (snap) => {
      const allAppts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Appointment));
      // Filter TODAY in memory
      const filtered = allAppts.filter(a => a.scheduledAt >= start && a.scheduledAt <= end);
      setTodayAppts(filtered);
    });

    // 2. Listen to today's payments (Revenue) (Filtered by doctorId)
    // Simplified query to bypass composite index requirements
    const qPayments = query(
      collection(db, 'payments'),
      where('doctorId', '==', effectiveDoctorId),
    );
    const unsubPayments = onSnapshot(qPayments, (snap) => {
      let total = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.createdAt >= start && data.createdAt <= end) {
          total += data.amount || 0;
        }
      });
      setTodayRevenue(total);
    });

    // 3. Get total patients count (Filtered by doctorId)
    getDocs(query(
      collection(db, 'patients'), 
      where('doctorId', '==', effectiveDoctorId),
      limit(1000)
    )).then(snap => {
      setTotalPatients(snap.size);
    });

    return () => {
      unsubAppts();
      unsubPayments();
    };
  }, [user]);

  const doctorActions = [
    { icon: CalendarClock, label: t('common.queue'), desc: t('dashboard.actionQueueDesc'), url: '/doctor/workspace', color: 'from-primary to-blue-600', shadow: 'shadow-primary/20' },
    { icon: Users, label: t('common.patients'), desc: t('dashboard.actionPatientsDesc'), url: '/doctor/patients', color: 'from-info to-cyan-500', shadow: 'shadow-info/20' },
    { icon: BarChart3, label: t('common.analytics'), desc: t('dashboard.actionAnalyticsDesc'), url: '/doctor/analytics', color: 'from-success to-emerald-500', shadow: 'shadow-success/20' },
    { icon: Settings, label: t('common.settings'), desc: t('dashboard.actionSettingsDesc'), url: '/doctor/settings', color: 'from-slate-600 to-slate-800', shadow: 'shadow-slate-500/20' },
  ];

  const receptionistActions = [
    { icon: CalendarClock, label: t('common.queue'), desc: t('dashboard.actionQueueReceptionistDesc'), url: '/receptionist/queue', color: 'from-primary to-blue-600', shadow: 'shadow-primary/20' },
    { icon: DollarSign, label: t('common.shiftClose'), desc: t('dashboard.actionShiftCloseDesc'), url: '/receptionist/shift-close', color: 'from-warning to-amber-500', shadow: 'shadow-warning/20' },
  ];

  const actions = user?.role === 'DOCTOR' ? doctorActions : receptionistActions;

  // Compute live stats
  const waitingCount = todayAppts.filter(a => a.status === 'WAITING').length;
  const completedCount = todayAppts.filter(a => a.status === 'COMPLETED').length;
  const inClinicNow = todayAppts.find(a => a.status === 'IN_CLINIC');

  if (!mounted) return null;

  const hours = new Date().getHours();
  const greetingKey = hours < 12 ? 'dashboard.morning' : hours < 17 ? 'dashboard.afternoon' : 'dashboard.evening';

  return (
    <div className="space-y-10 pb-10">
      {/* Decorative Background Mesh */}
      <div className="absolute top-0 start-0 w-full h-96 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -start-24 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
        <div className="absolute top-10 -end-24 w-96 h-96 bg-info/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-3xl gradient-hero px-8 py-12 text-primary-foreground shadow-elevated border border-white/10 animate-fade-in-up">
        {/* Subtle glass overlay inside hero */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[2px]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className={`flex items-center gap-3 mb-4 rtl:flex-row-reverse rtl:text-end`}>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner border border-white/20">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div className={`flex flex-col rtl:items-end`}>
                <span className="text-sm font-bold tracking-wider text-white/80 uppercase">ClinicOS</span>
                <span className="text-xs text-white/60 font-medium">{t('sidebar.proEdition')}</span>
              </div>
            </div>
            
            <h1 className={`text-4xl md:text-5xl font-extrabold tracking-tight mb-2 text-start rtl:text-end`}>
              {t(greetingKey)},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                {user?.fullName.split(' ')[0]}
              </span>
            </h1>
            
            <p className={`text-white/80 text-lg max-w-xl font-medium text-start rtl:text-end rtl:ms-auto rtl:me-0`}>
              {user?.role === 'DOCTOR' ? t('dashboard.ready') : t('dashboard.readyReception')}
            </p>
          </div>
          
          <div className={`hidden md:flex flex-col items-end text-end rtl:items-start rtl:text-start`}>
            <div className="text-5xl font-light tracking-tighter mb-1">
              {format(new Date(), 'HH:mm')}
            </div>
            <div className="text-sm font-medium text-white/70 uppercase tracking-widest">
              {format(new Date(), 'EEEE, MMMM d, yyyy', { locale })}
            </div>
          </div>
        </div>
      </div>

      {/* Live Operational Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group">
           <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Clock className="h-6 w-6 text-primary" />
           </div>
           <p className="text-3xl font-black text-foreground">{waitingCount}</p>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('dashboard.waiting')}</p>
        </div>
        
        <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group">
           <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <UserCheck className="h-6 w-6 text-success" />
           </div>
           <p className="text-3xl font-black text-foreground">{completedCount}</p>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('dashboard.completed')}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group">
           <div className="h-12 w-12 rounded-full bg-info/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Users className="h-6 w-6 text-info" />
           </div>
           <p className="text-3xl font-black text-foreground">{totalPatients}</p>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('dashboard.totalPatients')}</p>
        </div>

        <div className="glass-card rounded-2xl p-5 flex flex-col items-center text-center group">
           <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <TrendingUp className="h-6 w-6 text-warning" />
           </div>
           <p className={`text-3xl font-black text-foreground flex items-baseline gap-1 rtl:flex-row-reverse`}>
             {todayRevenue} <span className="text-sm">EGP</span>
           </p>
           <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mt-1">{t('dashboard.revenue')}</p>
        </div>
      </div>

      {/* Decorative Divider */}
      <div className="flex items-center gap-4 opacity-50 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
        <Activity className="h-5 w-5 text-muted-foreground" />
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent flex-1" />
      </div>

      {/* Main Actions & Activity Grid */}
      <div className="grid lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        
        {/* Quick Actions (Left span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className={`text-2xl font-bold tracking-tight text-foreground text-start rtl:text-end`}>
            {t('dashboard.quickActions')}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {actions.map((a, i) => (
              <button
                key={a.url}
                onClick={() => navigate(a.url)}
                className={`group relative overflow-hidden rounded-2xl glass-card p-6 text-start transition-all duration-300 hover:-translate-y-1 rtl:text-end`}
                style={{ animationDelay: `${0.1 * (i + 1)}s` }}
              >
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 bg-gradient-to-br ${a.color} transition-opacity duration-500`} />
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl mb-5 bg-gradient-to-br ${a.color} text-white shadow-lg ${a.shadow} group-hover:scale-110 transition-transform duration-300 rtl:ms-auto rtl:me-0`}>
                  <a.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">{a.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{a.desc}</p>
                <div className={`mt-5 flex items-center text-sm font-semibold opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-4 group-hover:translate-x-0 rtl:translate-x-4 rtl:group-hover:translate-x-0`}>
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${a.color}`}>{t('dashboard.openModule')}</span>
                  {isRtl ? <ArrowLeft className="h-4 w-4 mx-1 text-primary" /> : <ArrowRight className="h-4 w-4 mx-1 text-primary" />}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Live Activity Feed (Right span 1) */}
        <div className="space-y-6">
           <h2 className={`text-2xl font-bold tracking-tight text-foreground text-start rtl:text-end`}>
            {t('dashboard.currentStatus')}
           </h2>
           <div className="glass-card rounded-3xl p-6 h-[calc(100%-3rem)] flex flex-col relative overflow-hidden">
              {inClinicNow ? (
                <div className="flex-1 flex flex-col justify-center items-center text-center z-10 animate-fade-in">
                  <div className="relative">
                    <div className="absolute inset-0 bg-info rounded-full blur-xl opacity-20 animate-pulse-glow" />
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-info to-blue-500 flex items-center justify-center mb-6 shadow-lg shadow-info/30 relative z-10 border-4 border-background">
                      <Stethoscope className="h-10 w-10 text-white" />
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-info/10 text-info border-info/30 mb-3 px-3 py-1 text-xs tracking-widest uppercase">
                    {t('dashboard.inClinic')}
                  </Badge>
                  <h3 className="text-2xl font-bold text-foreground truncate w-full px-4 mb-2">{(inClinicNow as any).patientName}</h3>
                  <p className="text-sm text-muted-foreground">{t('dashboard.queueNo')} #{inClinicNow.queueNumber}</p>
                  
                  <button 
                    onClick={() => navigate(user?.role === 'DOCTOR' ? '/doctor/workspace' : '/receptionist/queue')}
                    className="mt-8 px-6 py-2.5 rounded-full bg-foreground text-background font-bold text-sm hover:scale-105 transition-transform shadow-lg"
                  >
                    {t('dashboard.goWorkspace')}
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-center z-10 opacity-70">
                  <HeartPulse className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-lg font-bold text-foreground">{t('dashboard.quiet')}</h3>
                  <p className="text-sm text-muted-foreground mt-2 max-w-[200px]">
                    {t('dashboard.noPatients')}
                  </p>
                </div>
              )}
              
              {/* Decorative Corner Icon */}
              <Activity className="absolute -end-10 -bottom-10 h-64 w-64 text-primary/5 rtl:scale-x-[-1] pointer-events-none" />
           </div>
        </div>

      </div>
    </div>
  );
}
