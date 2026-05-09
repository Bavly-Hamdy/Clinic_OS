import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useNotifications } from '@/hooks/useNotifications';
import { useLanguage } from '@/providers/LanguageProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export function NotificationBell() {
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const { notifications, markAsRead, deleteNotification } = useNotifications(user?.id);

  console.log(`NotificationBell for user ${user?.id}:`, notifications.length, 'notifications found');

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-full hover:bg-primary/10 hover:text-primary transition-colors group"
        >
          <Bell className="h-5 w-5 group-hover:scale-110 transition-transform" />
          {unreadCount > 0 && (
            <span className={`absolute top-2 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background shadow-glow animate-pulse ${isRtl ? 'start-2' : 'end-2'}`} />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={isRtl ? 'start' : 'end'}
        className="w-80 rounded-2xl p-2 border-white/10 glass-card z-[100]"
      >
        <DropdownMenuLabel className={`px-4 py-3 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <span className="font-black text-base">{isRtl ? 'الإشعارات' : 'Notifications'}</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {unreadCount} {isRtl ? 'جديد' : 'New'}
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          <div className="flex flex-col gap-1 p-1">
            <AnimatePresence initial={false}>
              {notifications.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-xs font-medium">{isRtl ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: isRtl ? 20 : -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`relative rounded-xl p-3 transition-colors ${
                      notification.isRead ? 'opacity-60 bg-transparent' : 'bg-primary/5 ring-1 ring-primary/10'
                    }`}
                  >
                    <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
                        notification.type === 'warning' ? 'bg-amber-500/20 text-amber-500' :
                        notification.type === 'error' ? 'bg-red-500/20 text-red-500' :
                        'bg-blue-500/20 text-blue-500'
                      }`}>
                        {notification.type === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                      </div>
                      <div className={`flex-1 min-w-0 ${isRtl ? 'text-end' : 'text-start'}`}>
                        <p className="text-sm font-bold text-foreground leading-tight truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {notification.message}
                        </p>
                        <div className={`flex items-center gap-3 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                           <span className="text-[10px] text-muted-foreground/50">
                             {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </span>
                           {!notification.isRead && (
                             <button
                               onClick={() => markAsRead(notification.id)}
                               className="text-[10px] font-bold text-primary hover:underline"
                             >
                               {isRtl ? 'تحديد كمقروء' : 'Mark as read'}
                             </button>
                           )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
