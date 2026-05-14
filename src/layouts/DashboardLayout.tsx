import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import { AppSidebar } from '@/components/AppSidebar';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Bell, LogOut, User, ActivitySquare } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/LanguageProvider';
import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { NotificationBell } from '@/components/NotificationBell';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { t } = useTranslation();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'DR';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background relative selection:bg-primary/20" dir={dir}>
        
        {/* Sidebar — hidden on mobile, visible on md+ */}
        <div 
          className={`hidden md:block sticky z-40 bg-card/80 backdrop-blur-xl border-e border-white/10 shadow-elevated print:hidden ${dir === 'rtl' ? 'order-2' : 'order-1'}`}
          style={{ top: 'var(--titlebar-height, 0px)', height: 'calc(100vh - var(--titlebar-height, 0px))' }}
        >
          <AppSidebar />
        </div>

        <div className={`flex flex-1 flex-col min-w-0 z-10 ${dir === 'rtl' ? 'order-1' : 'order-2'}`}>
          {/* Top header - Floating Glassmorphic */}
          <header 
            className={`sticky z-30 flex h-16 items-center gap-4 bg-background/60 backdrop-blur-2xl px-6 border-b border-white/10 shadow-sm transition-all print:hidden ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}
            style={{ top: 'var(--titlebar-height, 0px)' }}
          >
            {/* Only show sidebar trigger on desktop */}
            <div className="hidden md:block">
              <SidebarTrigger className={`text-muted-foreground hover:text-primary transition-colors hover:scale-105 active:scale-95 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
            </div>

             {/* App title on mobile */}
             <div className={`md:hidden flex items-center gap-2 ${dir === 'rtl' ? 'flex-row-reverse text-end' : ''}`}>
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                <ActivitySquare className="h-4 w-4 text-white" />
              </div>
              <span className="font-extrabold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-info tracking-tight truncate">Clinic Hub</span>
              <Badge
                variant="outline"
                className={`text-[10px] px-2 py-0.5 h-5 rounded-full shrink-0 ${
                  user?.role === 'DOCTOR'
                    ? 'border-primary/40 text-primary bg-primary/5'
                    : 'border-info/40 text-info bg-info/5'
                }`}
              >
                {user?.role === 'DOCTOR' ? t('common.doctor') : t('common.receptionist')}
              </Badge>
            </div>

            <div className="flex-1" />

            <div className={`flex items-center gap-1 sm:gap-3 ${dir === 'rtl' ? 'flex-row-reverse' : ''}`}>
              <NotificationBell />

              <LanguageToggle />
              <ModeToggle />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex items-center gap-3 rounded-full hover:bg-muted/50 p-1 transition-colors border border-transparent hover:border-border ${dir === 'rtl' ? 'flex-row-reverse ps-3' : 'pe-3'}`}>
                    <Avatar className="h-9 w-9 shadow-sm border border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`hidden sm:flex flex-col ${dir === 'rtl' ? 'items-end text-end' : 'items-start'}`}>
                      <span className="text-sm font-bold leading-tight text-foreground">{user?.fullName}</span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                         {user?.role === 'DOCTOR' ? t('common.doctor') : t('common.receptionist')}
                      </span>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={dir === 'rtl' ? 'start' : 'end'} className="w-56 rounded-2xl glass-card p-2 border-white/10">
                  <DropdownMenuLabel className={`px-3 py-3 ${dir === 'rtl' ? 'text-end' : ''}`}>
                    <p className="font-bold text-base">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">{user?.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')}
                    className={`rounded-xl px-3 cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors my-1 ${dir === 'rtl' ? 'flex-row-reverse text-end' : ''}`}
                  >
                    <User className={`h-4 w-4 ${dir === 'rtl' ? 'ms-3' : 'me-3'}`} />
                    <span className="font-medium">{t('common.profile')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem onClick={handleLogout} className={`rounded-xl px-3 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors my-1 ${dir === 'rtl' ? 'flex-row-reverse text-end' : ''}`}>
                    <LogOut className={`h-4 w-4 ${dir === 'rtl' ? 'ms-3' : 'me-3'}`} />
                    <span className="font-medium">{t('common.logout')}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          {/* Main content — add bottom padding on mobile for the bottom nav */}
          <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 relative">
            <div className="max-w-7xl mx-auto w-full h-full animate-fade-in">
               <Outlet />
            </div>
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
