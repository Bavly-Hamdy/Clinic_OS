import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { ModeToggle } from '@/components/ModeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTranslation } from 'react-i18next';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useRegistrationRequests } from '@/hooks/useRegistrationRequests';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  DollarSign,
  Settings,
  LogOut,
  Shield,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Inbox,
} from 'lucide-react';
import { Logo } from '@/components/Logo';

const adminNavItems = [
  { key: 'dashboard',     icon: LayoutDashboard, path: '/admin/dashboard' },
  { key: 'joinRequests',  icon: Inbox,           path: '/admin/join-requests' },
  { key: 'doctors',       icon: Users,           path: '/admin/doctors' },
  { key: 'subscriptions', icon: CreditCard,      path: '/admin/subscriptions' },
  { key: 'pricing',       icon: DollarSign,      path: '/admin/pricing' },
  { key: 'settings',      icon: Settings,        path: '/admin/settings' },
];

const navLabels: Record<string, { en: string; ar: string }> = {
  dashboard:     { en: 'Dashboard',     ar: 'لوحة التحكم' },
  joinRequests:  { en: 'Join Requests', ar: 'طلبات الانضمام' },
  doctors:       { en: 'Doctors',       ar: 'الدكاترة' },
  subscriptions: { en: 'Subscriptions', ar: 'الاشتراكات' },
  pricing:       { en: 'Pricing',       ar: 'الأسعار' },
  settings:      { en: 'Settings',      ar: 'الإعدادات' },
};

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { getExpiringSubscriptions } = useSubscriptions();
  const { newCount: joinRequestsNewCount } = useRegistrationRequests();
  const expiringCount = getExpiringSubscriptions(7).length;
  const navigate = useNavigate();
  const location = useLocation();
  const { dir } = useLanguage();
  const { t } = useTranslation();
  const isRtl = dir === 'rtl';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const initials = user?.fullName
    ?.split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <div className="min-h-screen flex w-full bg-background" dir={dir}>
      {/* Sidebar */}
      <aside 
        className={`hidden md:flex flex-col w-72 sticky bg-card/80 backdrop-blur-xl border-e border-border/30 shadow-lg z-40 ${isRtl ? 'order-2' : 'order-1'}`}
        style={{ top: 'var(--titlebar-height, 0px)', height: 'calc(100vh - var(--titlebar-height, 0px))' }}
      >
        {/* Brand */}
        <div className="px-6 py-6 border-b border-border/30">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/admin/dashboard')}
          >
            <Logo className="h-20 w-auto" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold tracking-[0.15em] text-muted-foreground uppercase">
                {isRtl ? 'لوحة الإدارة' : 'Admin Panel'}
              </span>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <p className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 px-4 pb-2 mb-2 flex items-center gap-2">
            <span className="h-px w-3 bg-border" />
            {isRtl ? 'القائمة الرئيسية' : 'Main Menu'}
            <span className="h-px flex-1 bg-border" />
          </p>
          {adminNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            const label = isRtl ? navLabels[item.key].ar : navLabels[item.key].en;
            const hasNotification =
              (item.key === 'subscriptions' || item.key === 'dashboard') && expiringCount > 0
              || (item.key === 'joinRequests' && joinRequestsNewCount > 0);
            const badgeCount = item.key === 'joinRequests' ? joinRequestsNewCount : expiringCount;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`relative w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ring-1 ring-amber-500/20'
                    : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <>
                    <div className="absolute start-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-e-full bg-gradient-to-b from-amber-500 to-orange-500 animate-fade-in shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent pointer-events-none" />
                  </>
                )}
                <div className="relative">
                  <item.icon
                    className={`h-5 w-5 shrink-0 transition-all duration-300 ${
                      isActive ? 'scale-110 drop-shadow-sm text-amber-500' : 'group-hover:scale-110'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  {hasNotification && (
                    <span className="absolute -top-1 -right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  )}
                </div>
                <span className={`flex-1 text-start ${isActive ? 'font-bold' : ''}`}>{label}</span>
                {hasNotification && (item.key === 'subscriptions' || item.key === 'joinRequests') && (
                  <span className="px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black min-w-[18px] text-center">
                    {badgeCount}
                  </span>
                )}
                {isActive && !hasNotification && (isRtl ? <ChevronLeft className="h-4 w-4 opacity-50 text-amber-500" /> : <ChevronRight className="h-4 w-4 opacity-50 text-amber-500" />)}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border/30">
          <button
            onClick={() => navigate('/admin/settings')}
            className="w-full rounded-2xl bg-card border border-border shadow-sm p-4 flex items-center gap-3 group hover:border-amber-500/30 transition-all cursor-pointer"
          >
            <div className="h-10 w-10 shrink-0 rounded-full bg-gradient-to-br from-amber-600 to-orange-700 border border-white/10 flex items-center justify-center shadow-inner">
              <span className="text-white font-bold text-sm">{initials}</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0 text-start">
              <span className="text-sm font-bold text-foreground truncate">{user?.fullName}</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Shield className="h-3 w-3 text-amber-500" />
                <span className="text-[10px] font-medium text-muted-foreground tracking-wider uppercase">
                  {isRtl ? 'مدير النظام' : 'System Admin'}
                </span>
              </div>
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex flex-1 flex-col min-w-0 z-10 ${isRtl ? 'order-1' : 'order-2'}`}>
        {/* Top Header */}
        <header 
          className={`sticky z-30 flex h-16 items-center gap-4 bg-background/60 backdrop-blur-2xl px-6 border-b border-border/30 shadow-sm print:hidden ${isRtl ? 'flex-row-reverse' : ''}`}
          style={{ top: 'var(--titlebar-height, 0px)' }}
        >
          {/* Mobile brand */}
          <div className={`md:hidden flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-orange-600 tracking-tight">Admin</span>
          </div>

          <div className="flex-1" />

          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <LanguageToggle />
            <ModeToggle />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`flex items-center gap-3 rounded-full hover:bg-muted/50 p-1 transition-colors border border-transparent hover:border-border ${isRtl ? 'flex-row-reverse ps-3' : 'pe-3'}`}>
                  <Avatar className="h-9 w-9 shadow-sm border border-amber-500/20">
                    <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-sm font-bold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`hidden sm:flex flex-col ${isRtl ? 'items-end text-end' : 'items-start'}`}>
                    <span className="text-sm font-bold leading-tight text-foreground">{user?.fullName}</span>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Admin</span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRtl ? 'start' : 'end'} className="w-56 rounded-2xl p-2">
                <DropdownMenuLabel className="px-3 py-3">
                  <p className="font-bold text-base">{user?.fullName}</p>
                  <p className="text-xs text-muted-foreground font-medium mt-0.5">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/admin/settings')} className="rounded-xl px-3 cursor-pointer">
                  <UserIcon className={`h-4 w-4 ${isRtl ? 'ms-3' : 'me-3'}`} />
                  <span className="font-medium">{isRtl ? 'الإعدادات' : 'Settings'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-xl px-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                  <LogOut className={`h-4 w-4 ${isRtl ? 'ms-3' : 'me-3'}`} />
                  <span className="font-medium">{isRtl ? 'تسجيل الخروج' : 'Logout'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border/30 px-2 py-2 shadow-lg">
          <div className="flex items-center justify-around">
            {adminNavItems.slice(0, 4).map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.key}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                    isActive ? 'text-amber-500' : 'text-muted-foreground'
                  }`}
                >
                  <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="text-[10px] font-bold">{isRtl ? navLabels[item.key].ar : navLabels[item.key].en}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 relative">
          <div className="max-w-7xl mx-auto w-full h-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
