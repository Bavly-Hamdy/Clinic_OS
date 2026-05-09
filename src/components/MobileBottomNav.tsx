import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';
import {
    CalendarClock, Users, BarChart3, Settings, DollarSign, LayoutDashboard,
} from 'lucide-react';

import { useTranslation } from 'react-i18next';

export function MobileBottomNav() {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const doctorItems = [
        { title: t('common.home'), url: '/dashboard', icon: LayoutDashboard },
        { title: t('common.queue'), url: '/doctor/workspace', icon: CalendarClock },
        { title: t('common.patients'), url: '/doctor/patients', icon: Users },
        { title: t('common.analytics'), url: '/doctor/analytics', icon: BarChart3 },
        { title: t('common.settings'), url: '/doctor/settings', icon: Settings },
    ];

    const receptionistItems = [
        { title: t('common.home'), url: '/dashboard', icon: LayoutDashboard },
        { title: t('common.queue'), url: '/receptionist/queue', icon: CalendarClock },
        { title: t('common.shiftClose'), url: '/receptionist/shift-close', icon: DollarSign },
    ];

    const items = user?.role === 'DOCTOR' ? doctorItems : receptionistItems;

    return (
        <nav className="fixed bottom-0 inset-x-0 z-40 flex md:hidden bg-background/80 backdrop-blur-2xl border-t border-white/10 safe-area-pb shadow-[0_-10px_40px_rgba(0,0,0,0.1)] print:hidden">
            <div className="flex w-full px-2 py-1 justify-around items-center">
                {items.map((item) => {
                    const isActive = location.pathname === item.url ||
                        (item.url !== '/' && location.pathname.startsWith(item.url));
                    return (
                        <button
                            key={item.url}
                            onClick={() => navigate(item.url)}
                            className="relative flex flex-1 flex-col items-center justify-center gap-1 min-h-[4rem] group"
                        >
                            {isActive && (
                                <div className="absolute inset-0 bg-primary/10 rounded-2xl scale-90 transition-transform -z-10" />
                            )}
                            <div className="relative">
                                {isActive && (
                                    <div className="absolute inset-0 bg-primary blur-md opacity-40 rounded-full" />
                                )}
                                <item.icon
                                    className={`relative z-10 h-6 w-6 transition-all duration-300 ${isActive ? 'scale-110 text-primary drop-shadow-[0_0_8px_rgba(37,99,235,0.8)]' : 'text-muted-foreground group-hover:text-foreground group-hover:scale-105'}`}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>
                            <span className={`text-[10px] whitespace-nowrap transition-all duration-300 ${isActive ? 'font-bold text-primary translate-y-0.5' : 'font-medium text-muted-foreground group-hover:text-foreground'}`}>
                                {item.title}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
