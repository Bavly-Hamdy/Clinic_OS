import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { NavLink } from '@/components/NavLink';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  Users,
  CalendarClock,
  LayoutDashboard,
  Stethoscope,
  CreditCard,
  BarChart3,
  Settings,
  DollarSign,
  ActivitySquare,
  ChevronRight,
  Wifi,
  Sparkles,
  User as UserIcon,
  ChevronLeft,
} from 'lucide-react';
import { Appointment } from '@/types/clinic';

export function AppSidebar() {
  const { user } = useAuth();
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const [waitingCount, setWaitingCount] = useState(0);

  const doctorNav = [
    {
      label: t('common.overview', 'Overview'),
      items: [
        { title: t('common.home', 'Dashboard'), url: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: t('common.workspace', 'Workspace'),
      items: [
        { title: t('common.queue', 'Queue & Visits'), url: '/doctor/workspace', icon: CalendarClock },
        { title: t('common.patients', 'Patients Vault'), url: '/doctor/patients', icon: Users },
      ],
    },
    {
      label: t('common.reports', 'Reports'),
      items: [
        { title: t('common.analytics', 'Analytics'), url: '/doctor/analytics', icon: BarChart3 },
        { title: t('common.settings', 'Settings'), url: '/doctor/settings', icon: Settings },
      ],
    },
  ];

  const receptionistNav = [
    {
      label: t('common.overview', 'Overview'),
      items: [
        { title: t('common.home', 'Dashboard'), url: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      label: t('common.reception', 'Reception'),
      items: [
        { title: t('common.queue', 'Live Queue'), url: '/receptionist/queue', icon: CalendarClock },
        { title: t('common.shiftClose', 'Shift Close'), url: '/receptionist/shift-close', icon: DollarSign },
      ],
    },
  ];

  useEffect(() => {
    // Auth Guard: Only attach listener if user is logged in
    if (!user || !user.id) return;

    // Live Queue Telemetry for Sidebar Widget
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const end = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', effectiveDoctorId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const allAppts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
      
      // Client-Side Filtering
      const todayAppts = allAppts.filter(a => 
        a.scheduledAt >= start && a.scheduledAt <= end
      );

      const w = todayAppts.filter(a => a.status === 'WAITING');
      setWaitingCount(w.length);
    }, (err) => {
      console.error('Sidebar listener error:', err);
    });

    return () => unsub();
  }, [user]);

  const navGroups = user?.role === 'DOCTOR' ? doctorNav : receptionistNav;

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const currentEdition = user?.role === 'DOCTOR' ? t('sidebar.proEdition') : t('sidebar.reception');

  return (
    <Sidebar collapsible="icon" className="border-none bg-transparent" side={dir === 'rtl' ? 'right' : 'left'}>
      {/* Brand Header */}
      <SidebarHeader className="px-4 py-6 border-b border-border/30 mb-2">
        <div 
          className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} transition-all cursor-pointer group`}
          onClick={() => navigate('/dashboard')}
        >
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info shadow-xl shadow-primary/20 group-hover:scale-105 transition-transform duration-500 overflow-hidden ring-1 ring-white/10">
             <div className="absolute inset-0 bg-white/20 rounded-xl" />
             <ActivitySquare className="h-6 w-6 text-white relative z-10" strokeWidth={2.5} />
             {/* Shimmer effect */}
             <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-[shimmer_2.5s_infinite]" />
          </div>
          {!collapsed && (
            <div className={`flex flex-col animate-fade-in overflow-hidden ${isRtl ? 'items-start' : ''}`}>
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary via-info to-primary animate-gradient-x">
                Clinic Hub
              </span>
              <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase opacity-80 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-info" />
                {currentEdition}
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {/* Nav Links */}
      <SidebarContent className="px-3 space-y-6 pt-2 overflow-y-auto custom-scrollbar">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="p-0">
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 pb-2 mb-1 flex items-center gap-2">
                <span className="h-px w-3 bg-border" />
                {group.label}
                <span className="h-px flex-1 bg-border" />
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.url || (item.url !== '/' && location.pathname.startsWith(item.url));
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild tooltip={item.title}>
                        <NavLink
                          to={item.url}
                          end
                          onClick={handleLinkClick}
                          className={`relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group overflow-hidden ${
                            isActive
                              ? 'text-primary bg-primary/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ring-1 ring-primary/20'
                              : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm'
                          }`}
                          activeClassName=""
                        >
                          {isActive && (
                            <>
                              <div className="absolute start-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-e-full bg-gradient-to-b from-primary to-info animate-fade-in shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent pointer-events-none" />
                            </>
                          )}
                          <item.icon className={`h-5 w-5 shrink-0 transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-sm text-primary' : 'group-hover:scale-110 group-hover:text-foreground'}`} strokeWidth={isActive ? 2.5 : 2} />
                          {!collapsed && (
                            <div className="flex flex-1 items-center justify-between">
                              <span className={`truncate ${isActive ? 'font-bold' : 'group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform'}`}>{item.title}</span>
                              {isActive && (isRtl ? <ChevronLeft className="h-4 w-4 opacity-50 text-primary" /> : <ChevronRight className="h-4 w-4 opacity-50 text-primary" />)}
                            </div>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Live Mini-Widget */}
        {!collapsed && (
          <div className="mx-2 mt-6 p-4 rounded-2xl glass-card border border-primary/10 bg-gradient-to-br from-background to-primary/5 relative overflow-hidden group">
            <div className="absolute top-0 end-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-700 pointer-events-none">
              <CalendarClock className="h-24 w-24" />
            </div>
            <div className="relative z-10 flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                {t('sidebar.liveTelemetry')}
              </h4>
            </div>
            <div className="relative z-10">
              <div className="flex items-baseline gap-2 text-start">
                <span className="text-3xl font-black text-foreground">{waitingCount}</span>
                <span className="text-sm font-medium text-muted-foreground">{t('sidebar.waiting')}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-start">{t('sidebar.patientsInQueue')}</p>
            </div>
          </div>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 pb-8 mt-auto border-t border-border/30">
        {!collapsed ? (
          <button 
            onClick={() => navigate('/profile')}
            className="relative w-full overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-4 animate-fade-in flex items-center gap-3 group hover:border-primary/30 transition-all cursor-pointer"
          >
             <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center shadow-inner group-hover:shadow-primary/20 transition-all">
               <span className="text-white font-bold text-sm">
                 {user?.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
               </span>
             </div>
             <div className="flex flex-col flex-1 min-w-0 text-start">
                <span className="text-sm font-bold text-foreground truncate">{user?.fullName}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="relative flex h-2 w-2">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                     <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
                   </div>
                   <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">{t('common.profile')}</span>
                </div>
             </div>
             {isRtl ? <ChevronLeft className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:-translate-x-1" /> : <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-all group-hover:translate-x-1" />}
          </button>
        ) : (
           <button 
            onClick={() => navigate('/profile')}
            className="h-10 w-10 mx-auto rounded-full bg-card border border-border flex items-center justify-center cursor-pointer relative group"
           >
             <div className="absolute -top-1 -end-1 flex h-3 w-3">
               <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
               <span className="relative inline-flex rounded-full h-3 w-3 bg-success border-2 border-background"></span>
             </div>
             <UserIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
           </button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
