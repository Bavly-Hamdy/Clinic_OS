import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { Shield, Mail, User } from 'lucide-react';

const t = {
  en: {
    title: 'Platform Settings',
    subtitle: 'Admin profile and platform configuration',
    profile: 'Admin Profile',
    name: 'Name',
    email: 'Email',
    role: 'Role',
    admin: 'System Administrator',
    info: 'To change your password, please use the Firebase Console.',
  },
  ar: {
    title: 'إعدادات المنصة',
    subtitle: 'الملف الشخصي للإدارة وإعدادات المنصة',
    profile: 'الملف الشخصي للمدير',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    role: 'الدور',
    admin: 'مدير النظام',
    info: 'لتغيير كلمة المرور، يرجى استخدام Firebase Console.',
  },
};

export default function AdminSettingsPage() {
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const labels = isRtl ? t.ar : t.en;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{labels.title}</h1>
        <p className="text-muted-foreground font-medium">{labels.subtitle}</p>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card p-8 max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">{labels.profile}</h2>
            <p className="text-sm text-muted-foreground">{labels.admin}</p>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border/30">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
            <User className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{labels.name}</p>
              <p className="font-bold text-foreground">{user?.fullName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{labels.email}</p>
              <p className="font-bold text-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-muted/30">
            <Shield className="h-5 w-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{labels.role}</p>
              <p className="font-bold text-amber-600 dark:text-amber-400">{labels.admin}</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2">{labels.info}</p>
      </div>
    </div>
  );
}
