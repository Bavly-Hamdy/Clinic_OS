import { useAuth } from '@/providers/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/providers/LanguageProvider';
import { motion } from 'framer-motion';
import { AlertTriangle, LogOut, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionExpiredPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir={dir}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center space-y-6"
      >
        <div className="mx-auto h-20 w-20 rounded-3xl bg-amber-500/10 flex items-center justify-center">
          <AlertTriangle className="h-10 w-10 text-amber-500" />
        </div>

        <h1 className="text-3xl font-black text-foreground">
          {isRtl ? 'اشتراكك منتهي' : 'Subscription Expired'}
        </h1>
        <p className="text-muted-foreground font-medium leading-relaxed">
          {isRtl
            ? 'لقد انتهت صلاحية اشتراكك في Clinic Hub. يرجى التواصل مع إدارة المنصة لتجديد الاشتراك واستعادة الوصول إلى حسابك.'
            : 'Your Clinic Hub subscription has expired. Please contact the platform administration to renew your subscription and regain access to your account.'}
        </p>

        <div className="space-y-3 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button 
              onClick={() => {
                const msg = isRtl ? 'مرحباً، أرغب في تجديد اشتراكي (رقم 1).' : 'Hello, I would like to renew my subscription (Admin 1).';
                window.open(`https://wa.me/201111835471?text=${encodeURIComponent(msg)}`, '_blank');
              }} 
              className="w-full h-14 rounded-2xl text-sm font-black gap-2 bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20"
            >
              <MessageCircle className="h-5 w-5" />
              {isRtl ? 'الإدارة (1)' : 'Admin (1)'}
            </Button>
            <Button 
              onClick={() => {
                const msg = isRtl ? 'مرحباً، أرغب في تجديد اشتراكي (رقم 2).' : 'Hello, I would like to renew my subscription (Admin 2).';
                window.open(`https://wa.me/201153762560?text=${encodeURIComponent(msg)}`, '_blank');
              }} 
              className="w-full h-14 rounded-2xl text-sm font-black gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20"
            >
              <MessageCircle className="h-5 w-5" />
              {isRtl ? 'الإدارة (2)' : 'Admin (2)'}
            </Button>
          </div>
          <Button onClick={handleLogout} variant="outline" className="w-full h-12 rounded-2xl font-bold gap-2">
            <LogOut className="h-4 w-4" />
            {isRtl ? 'تسجيل الخروج' : 'Sign Out'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
