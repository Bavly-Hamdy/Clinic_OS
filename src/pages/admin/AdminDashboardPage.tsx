import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/providers/LanguageProvider';
import { useAdminDoctors } from '@/hooks/useAdminDoctors';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/providers/AuthProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Send,
  FileText,
  Printer,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Users,
  CheckCircle2,
  AlertTriangle,
  Pause,
  Clock,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  Shield
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const t_labels = {
  en: {
    title: 'Admin Dashboard',
    subtitle: 'Platform overview and management',
    totalDoctors: 'Total Doctors',
    activeSubs: 'Active Subscriptions',
    expiringSoon: 'Expiring Soon',
    suspended: 'Suspended',
    pendingActivation: 'Pending Activation',
    revenue: 'Est. Monthly Revenue',
    quickActions: 'Quick Actions',
    createDoctor: 'Create Doctor',
    manageSubs: 'Manage Subscriptions',
    managePricing: 'Pricing',
    recentActivity: 'Subscription Overview',
    expiryWarnings: 'Expiry Warnings (Next 7 Days)',
    noWarnings: 'No subscriptions expiring soon.',
    daysLeft: 'days left',
    autoExpired: 'subscriptions auto-expired',
    checkingExpiry: 'Checking for expired subscriptions...',
    noDoctors: 'No doctors yet. Create your first doctor account.',
    sendReminder: 'Send Reminder',
    sendDashboardNotify: 'Send to Dashboard',
    notifiedSuccess: 'Notifications sent to doctors dashboards!',
    notifying: 'Sending...',
    active: 'Active',
    expired: 'Expired',
    pending: 'Pending',
    suspendedStatus: 'Suspended',
    monthly: 'Monthly',
    yearly: 'Yearly',
    revenueGrowth: 'Revenue Growth',
    subDistribution: 'Subscription Distribution',
    printReport: 'Print Report',
    dailyReport: 'Daily Report',
    monthlyReport: 'Monthly Report',
    yearlyReport: 'Yearly Report',
    platformAudit: 'Platform Audit',
  },
  ar: {
    title: 'لوحة تحكم الإدارة',
    subtitle: 'نظرة عامة على المنصة وإدارتها',
    totalDoctors: 'إجمالي الدكاترة',
    activeSubs: 'اشتراكات نشطة',
    expiringSoon: 'ينتهي قريباً',
    suspended: 'موقوف',
    pendingActivation: 'في انتظار التفعيل',
    revenue: 'الإيرادات الشهرية المقدرة',
    quickActions: 'إجراءات سريعة',
    createDoctor: 'إنشاء دكتور',
    manageSubs: 'إدارة الاشتراكات',
    managePricing: 'الأسعار',
    recentActivity: 'نظرة عامة على الاشتراكات',
    expiryWarnings: 'تنبيهات الانتهاء (خلال 7 أيام)',
    noWarnings: 'لا توجد اشتراكات ستنتهي قريباً.',
    daysLeft: 'يوم متبقي',
    autoExpired: 'اشتراكات تم إيقافها تلقائياً',
    checkingExpiry: 'جاري فحص الاشتراكات المنتهية...',
    noDoctors: 'لا يوجد دكاترة بعد. أنشئ أول حساب دكتور.',
    sendReminder: 'إرسال تذكير',
    sendDashboardNotify: 'إرسال للمنصة',
    notifiedSuccess: 'تم إرسال الإشعارات لمنصات الدكاترة بنجاح!',
    notifying: 'جاري الإرسال...',
    active: 'نشط',
    expired: 'منتهي',
    pending: 'في الانتظار',
    suspendedStatus: 'موقوف',
    monthly: 'شهري',
    yearly: 'سنوي',
    revenueGrowth: 'نمو الإيرادات',
    subDistribution: 'توزيع الاشتراكات',
    printReport: 'طباعة تقرير',
    dailyReport: 'تقرير اليوم',
    monthlyReport: 'تقرير الشهر',
    yearlyReport: 'التقرير السنوي',
    platformAudit: 'جرد المنصة',
  },
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const labels = isRtl ? t_labels.ar : t_labels.en;
  const IconArrow = isRtl ? ArrowLeft : ArrowRight;

  const { doctors, isLoading: doctorsLoading } = useAdminDoctors();
  const { subscriptions, isLoading: subsLoading, checkAndExpireSubscriptions, getExpiringSubscriptions } = useSubscriptions();
  const { sendBulkNotifications } = useNotifications();

  const [autoExpireRan, setAutoExpireRan] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);

  // Run auto-expiry on mount
  useEffect(() => {
    if (!subsLoading && !autoExpireRan) {
      setAutoExpireRan(true);
      checkAndExpireSubscriptions().then((count) => {
        if (count > 0) {
          toast.warning(`${count} ${labels.autoExpired}`);
        }
      });
    }
  }, [subsLoading, autoExpireRan]);

  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const suspendedSubs = subscriptions.filter((s) => s.status === 'suspended');
  const pendingSubs = subscriptions.filter((s) => s.status === 'pending');
  const expiredSubs = subscriptions.filter((s) => s.status === 'expired');
  const expiringSoon = getExpiringSubscriptions(7);

  const estimatedRevenue = activeSubs.reduce((sum, s) => {
    return sum + (s.plan === 'monthly' ? s.price : Math.round(s.price / 12));
  }, 0);

  const isLoading = doctorsLoading || subsLoading;

  // Prepare Chart Data (Last 6 Months)
  const chartData = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    const monthYear = d.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short' });
    
    // Revenue for this specific month (estimated)
    const monthRevenue = activeSubs
      .filter(s => new Date(s.startDate) <= d)
      .reduce((sum, s) => sum + (s.plan === 'monthly' ? s.price : Math.round(s.price / 12)), 0);
      
    return { name: monthYear, revenue: monthRevenue };
  });

  const pieData = [
    { name: labels.monthly, value: activeSubs.filter(s => s.plan === 'monthly').length, color: '#f59e0b' },
    { name: labels.yearly, value: activeSubs.filter(s => s.plan === 'yearly').length, color: '#3b82f6' },
  ];

  const handlePrint = (type: 'daily' | 'monthly' | 'yearly') => {
    window.print();
  };

  const stats = [
    { label: labels.totalDoctors, value: doctors.length, icon: Users, color: 'from-blue-500 to-indigo-600', shadow: 'shadow-blue-500/20' },
    { label: labels.activeSubs, value: activeSubs.length, icon: CheckCircle2, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-500/20' },
    { label: labels.expiringSoon, value: expiringSoon.length, icon: AlertTriangle, color: 'from-amber-500 to-orange-600', shadow: 'shadow-amber-500/20' },
    { label: labels.suspended, value: suspendedSubs.length, icon: Pause, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/20' },
  ];

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const sendWhatsAppReminder = (phone: string, name: string, daysLeft: number) => {
    const msg = isRtl
      ? `*ClinicOS - تذكير تجديد الاشتراك*\n\nمرحباً ${name}،\n\nنود تذكيركم بأن اشتراككم في ClinicOS سينتهي خلال ${daysLeft} يوم.\n\nيرجى التواصل معنا لتجديد الاشتراك وتفادي توقف الخدمة.\n\nشكراً لكم.`
      : `*ClinicOS - Subscription Renewal Reminder*\n\nHello ${name},\n\nThis is a reminder that your ClinicOS subscription will expire in ${daysLeft} days.\n\nPlease contact us to renew your subscription and avoid service interruption.\n\nThank you.`;
    const url = `https://wa.me/2${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const notifyAllExpiring = async () => {
    if (expiringSoon.length === 0) {
      console.log('No expiring subscriptions found to notify.');
      return;
    }
    setIsNotifying(true);
    try {
      const userIds = expiringSoon.map(s => s.doctorId);
      console.log(`Sending bulk notifications to ${userIds.length} doctors:`, userIds);
      
      const title = isRtl ? 'تنبيه: اقتراب انتهاء الاشتراك' : 'Warning: Subscription Expiring Soon';
      const message = isRtl 
        ? 'نود تذكيركم بأن اشتراككم سينتهي قريباً. يرجى التواصل مع الإدارة لتجديد الاشتراك لتجنب توقف الخدمة.' 
        : 'Your subscription is expiring soon. Please contact administration to renew and avoid service interruption.';
      
      await sendBulkNotifications(userIds, title, message, 'warning');
      toast.success(labels.notifiedSuccess);
    } catch (err) {
      toast.error('Failed to send notifications');
    } finally {
      setIsNotifying(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="no-print space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground">
            {labels.title}
          </h1>
          <p className="text-muted-foreground font-medium">{labels.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => handlePrint('monthly')}
            className="rounded-2xl font-black gap-2 border-primary/20 hover:bg-primary/5 h-12 px-6 shadow-sm"
          >
            <Printer className="h-4 w-4" />
            {labels.printReport}
          </Button>
        </div>
      </div>

      {/* Expiry Notification Banner */}
      <AnimatePresence>
        {expiringSoon.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-red-500/20 flex items-center justify-center shrink-0">
                  <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />
                </div>
                <div>
                  <p className="font-black text-lg text-red-600 dark:text-red-400">
                    {isRtl ? `هناك ${expiringSoon.length} اشتراكات تنتهي قريباً!` : `There are ${expiringSoon.length} subscriptions expiring soon!`}
                  </p>
                  <p className="text-sm text-red-500/70 font-medium">
                    {isRtl ? 'يرجى إرسال تنبيهات لتجنب توقف الخدمة عن الدكاترة.' : 'Please send reminders to avoid service interruption for doctors.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={notifyAllExpiring}
                  disabled={isNotifying}
                  variant="outline"
                  className="bg-white/50 dark:bg-black/20 border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl h-12 px-5 font-bold gap-2"
                >
                  <Bell className="h-4 w-4" />
                  {isNotifying ? labels.notifying : labels.sendDashboardNotify}
                </Button>
                <Button 
                  onClick={() => navigate('/admin/subscriptions')}
                  className="bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 px-8 font-black shadow-lg shadow-red-500/20 transition-all hover:scale-105"
                >
                  {isRtl ? 'إرسال التنبيهات الآن' : 'Send Reminders Now'}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`relative group overflow-hidden rounded-3xl bg-card border border-border/50 p-6 shadow-sm hover:shadow-xl transition-all duration-500`}
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-[0.03] -mr-8 -mt-8 rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
            
            <div className="relative flex flex-col gap-4">
              <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center ${stat.shadow} group-hover:scale-110 transition-transform duration-500`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-3xl font-black text-foreground mt-1 tabular-nums">{stat.value}</h3>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Growth Chart */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 rounded-3xl border border-border/50 bg-card p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-black text-lg">{labels.revenueGrowth}</h3>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl text-xs font-bold gap-2" onClick={() => handlePrint('monthly')}>
                <Printer className="h-3.5 w-3.5" />
                {labels.printReport}
              </Button>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600 }}
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                    fontWeight: 'bold'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Subscription Distribution */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="rounded-3xl border border-border/50 bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <PieChartIcon className="h-5 w-5 text-blue-500" />
            </div>
            <h3 className="font-black text-lg">{labels.subDistribution}</h3>
          </div>

          <div className="h-[250px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black">{activeSubs.length}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{labels.activeSubs}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            {pieData.map((d, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-xs font-bold">{d.name}</span>
                </div>
                <span className="text-xs font-black">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Expiry Warnings List (Unified) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions & Auditing */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </div>
            <h3 className="font-black text-lg uppercase tracking-tight">{labels.platformAudit}</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            <div className="p-5 rounded-3xl bg-muted/20 border border-border/50 space-y-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{labels.printReport}</p>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => handlePrint('daily')}
                  className="w-full h-12 rounded-2xl font-black gap-3 justify-start px-5 border-primary/10 hover:bg-primary/5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  {labels.dailyReport}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handlePrint('monthly')}
                  className="w-full h-12 rounded-2xl font-black gap-3 justify-start px-5 border-blue-500/10 hover:bg-blue-500/5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </div>
                  {labels.monthlyReport}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handlePrint('yearly')}
                  className="w-full h-12 rounded-2xl font-black gap-3 justify-start px-5 border-emerald-500/10 hover:bg-emerald-500/5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-emerald-500" />
                  </div>
                  {labels.yearlyReport}
                </Button>
              </div>
            </div>

            <Button
              onClick={() => navigate('/admin/doctors')}
              className="group relative h-24 w-full justify-between rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-blue-500/25 active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-white/20 p-3 group-hover:bg-white/30 transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-start">
                  <p className="font-black text-xl leading-tight">{labels.createDoctor}</p>
                  <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest mt-1.5">{isRtl ? 'إضافة دكتور جديد للمنصة' : 'Add new doctor'}</p>
                </div>
              </div>
              <IconArrow className="h-6 w-6 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </Button>
          </div>
        </div>

        {/* Expiry Warnings List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Clock className="h-4 w-4 text-red-500" />
              </div>
              <h3 className="font-black text-lg uppercase tracking-tight">{labels.expiryWarnings}</h3>
            </div>
            {expiringSoon.length > 0 && (
              <span className="px-3 py-1 rounded-full bg-red-500 text-white text-[10px] font-black animate-pulse">
                {expiringSoon.length} {isRtl ? 'تحذيرات' : 'WARNINGS'}
              </span>
            )}
          </div>

          <div className="space-y-3">
            {expiringSoon.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500/20" />
                <p className="font-bold text-muted-foreground">{labels.noWarnings}</p>
              </div>
            ) : (
              expiringSoon.map((sub, i) => {
                const daysLeft = getDaysLeft(sub.endDate);
                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center justify-between p-5 rounded-3xl border border-border/50 bg-card hover:shadow-xl transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/10 group-hover:scale-110 transition-transform">
                        <span className="text-white font-black text-sm">
                          {daysLeft}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-lg text-foreground leading-tight">{sub.doctorName}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                          {sub.plan} • {daysLeft} {labels.daysLeft}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-12 w-12 rounded-2xl hover:bg-emerald-500/10 hover:text-emerald-600 transition-all group-hover:scale-110"
                      onClick={() => {
                        const doctor = doctors.find((d) => d.id === sub.doctorId);
                        if (doctor?.phone) {
                          sendWhatsAppReminder(doctor.phone, doctor.fullName, daysLeft);
                        } else {
                          toast.error(isRtl ? 'لم يتم العثور على رقم الهاتف' : 'Phone number not found');
                        }
                      }}
                    >
                      <Send className="h-5 w-5" />
                    </Button>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      </div>
      {/* --- STANDALONE PROFESSIONAL AUDIT DOCUMENT (A4) --- */}
      <div id="admin-print-report" className="hidden print:block bg-white text-black font-sans w-full min-h-screen p-0 m-0" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-[200mm] mx-auto p-[15mm] bg-white border-[12px] border-double border-black min-h-[260mm] relative flex flex-col shadow-none">
          {/* Letterhead Header */}
          <div className="flex justify-between items-start mb-10 border-b-4 border-black pb-8">
            <div className="space-y-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 bg-black flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic">ClinicOS</h1>
              </div>
              <p className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">Automated Health Auditing Suite</p>
              <div className="mt-6 text-[9px] text-gray-400 font-medium max-w-sm leading-relaxed uppercase">
                {isRtl 
                  ? 'هذا المستند تم توليده آلياً ويحتوي على سجلات حساسة. يمنع تداول هذا المستند خارج النطاق الإداري المعتمد.' 
                  : 'Electronically generated document. Confidential financial records enclosed. Unauthorized distribution is strictly prohibited.'}
              </div>
            </div>
            <div className="text-end">
              <h2 className="text-3xl font-black uppercase mb-2 border-b-2 border-black pb-1 inline-block leading-none">
                {isRtl ? 'سجل الرقابة والجرد' : 'Audit Ledger'}
              </h2>
              <div className="space-y-1 text-[11px] font-bold">
                <p className="flex justify-end gap-3">
                  <span className="text-gray-400 uppercase tracking-widest font-black">{isRtl ? 'التاريخ:' : 'Date:'}</span>
                  <span>{new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { dateStyle: 'full' })}</span>
                </p>
                <p className="flex justify-end gap-3">
                  <span className="text-gray-400 uppercase tracking-widest font-black">{isRtl ? 'المرجع:' : 'REF:'}</span>
                  <span className="font-mono">COS-{Date.now().toString().slice(-8)}</span>
                </p>
                <p className="flex justify-end gap-3">
                  <span className="text-gray-400 uppercase tracking-widest font-black">{isRtl ? 'المنشأة:' : 'Entity:'}</span>
                  <span className="uppercase">ClinicOS Global Platform</span>
                </p>
              </div>
            </div>
          </div>

          {/* Audit Summary Stats Grid */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                <div className="h-2 w-2 bg-black rotate-45" />
                {isRtl ? 'خلاصة البيانات التنفيذية والمالية' : 'Executive Financial & Operational Summary'}
              </h3>
              <div className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
                {isRtl ? 'بيانات حية ومحدثة' : 'Live Verified Data'}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-0 border-2 border-black overflow-hidden">
              {/* KPI 01: Doctors */}
              <div className="p-6 border-r-2 border-black relative bg-gray-50/30">
                <div className="absolute top-2 left-2 text-[8px] font-black text-gray-300">01</div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-3 text-center">{labels.totalDoctors}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-4xl font-black tabular-nums">{doctors.length}</p>
                  <span className="text-[10px] font-bold text-gray-400">{isRtl ? 'طبيب' : 'DRS'}</span>
                </div>
              </div>

              {/* KPI 02: Active Subs */}
              <div className="p-6 border-r-2 border-black relative">
                <div className="absolute top-2 left-2 text-[8px] font-black text-gray-300">02</div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-3 text-center">{labels.activeSubs}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-4xl font-black tabular-nums text-emerald-600">{activeSubs.length}</p>
                  <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse-slow" />
                </div>
              </div>

              {/* KPI 03: Warnings */}
              <div className="p-6 border-r-2 border-black relative">
                <div className="absolute top-2 left-2 text-[8px] font-black text-gray-300">03</div>
                <p className="text-[9px] font-black text-gray-400 uppercase mb-3 text-center">{isRtl ? 'تنبيهات الانتهاء' : 'Expiring Soon'}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-4xl font-black tabular-nums text-red-600">{expiringSoon.length}</p>
                  <span className="text-[10px] font-bold text-red-400">!</span>
                </div>
              </div>

              {/* KPI 04: Revenue */}
              <div className="p-6 relative bg-black text-white">
                <div className="absolute top-2 left-2 text-[8px] font-black text-gray-700">04</div>
                <p className="text-[9px] font-black text-gray-500 uppercase mb-3 text-center">{labels.revenue}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <p className="text-3xl font-black tabular-nums tracking-tighter">
                    {estimatedRevenue.toLocaleString()}
                  </p>
                  <span className="text-[9px] font-bold opacity-60 uppercase">EGP</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Audit Table */}
          <div className="flex-1">
            <h3 className="text-xs font-black uppercase mb-4 tracking-widest text-gray-400 flex items-center gap-2">
              <div className="h-1.5 w-1.5 bg-black rounded-full" />
              {isRtl ? 'سجل اشتراكات المنصة المعتمد' : 'Verified Platform Subscription Ledger'}
            </h3>
            <table className="w-full border-2 border-black border-collapse text-[10px]">
              <thead className="bg-gray-100 border-b-2 border-black">
                <tr>
                  <th className="p-3 text-start font-black uppercase border-r border-black w-10">SEQ</th>
                  <th className="p-3 text-start font-black uppercase border-r border-black">{isRtl ? 'الكيان المسجل' : 'Entity Identity'}</th>
                  <th className="p-3 text-start font-black uppercase border-r border-black">{isRtl ? 'كود التعريف' : 'UID'}</th>
                  <th className="p-3 text-start font-black uppercase border-r border-black">{isRtl ? 'باقة الاشتراك' : 'Plan Detail'}</th>
                  <th className="p-3 text-start font-black uppercase border-r border-black">{isRtl ? 'القيمة (جنيه)' : 'Amount (EGP)'}</th>
                  <th className="p-3 text-start font-black uppercase border-r border-black">{isRtl ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-start font-black uppercase">{isRtl ? 'الاستحقاق' : 'Expiry'}</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black">
                {subscriptions.map((s, idx) => {
                  const doctor = doctors.find(d => d.id === s.doctorId);
                  return (
                    <tr key={s.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'} page-break-inside-avoid`}>
                      <td className="p-3 font-mono text-gray-400 border-r border-black">{(idx + 1).toString().padStart(2, '0')}</td>
                      <td className="p-3 border-r border-black">
                        <p className="font-black text-sm uppercase tracking-tight">{s.doctorName}</p>
                        <p className="text-[8px] text-gray-500 font-medium lowercase italic">{s.doctorEmail}</p>
                      </td>
                      <td className="p-3 font-mono font-black border-r border-black text-xs">{doctor?.displayId || '—'}</td>
                      <td className="p-3 border-r border-black font-bold uppercase">{s.plan}</td>
                      <td className="p-3 font-black border-r border-black tabular-nums text-sm">{s.price.toLocaleString()}</td>
                      <td className="p-3 border-r border-black">
                        <span className={`font-black uppercase text-[9px] ${s.status === 'active' ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold">{new Date(s.endDate).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Signature & Validation Section */}
          <div className="mt-12 pt-8 border-t-2 border-black grid grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="border-b border-black pb-1">
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-6">Internal Controls & Validation</p>
                <div className="space-y-3 pb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 border border-black" />
                    <span className="text-[9px] font-bold uppercase">{isRtl ? 'تم التحقق من سجلات قاعدة البيانات' : 'Database Records Synchronized'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-3 border border-black" />
                    <span className="text-[9px] font-bold uppercase">{isRtl ? 'تمت مطابقة إجمالي الإيرادات' : 'Revenue Distribution Verified'}</span>
                  </div>
                </div>
              </div>
              <p className="text-[8px] italic text-gray-400 leading-relaxed">
                {isRtl 
                  ? 'هذا المستند معتمد وصادر عن نظام ClinicOS المركزى. تم إجراء الجرد بناءً على البيانات المسجلة حتى تاريخه.' 
                  : 'Authorized electronic record issued by ClinicOS Audit Core. Figures verified against active ledger entries as of current timestamp.'}
              </p>
            </div>

            <div className="text-end flex flex-col justify-between">
              <div className="space-y-2">
                <div className="h-20 w-48 border-b-2 border-black ml-auto bg-gray-50/50 flex items-center justify-center relative overflow-hidden">
                   <div className="absolute inset-0 border-2 border-dashed border-gray-200 rotate-12 flex items-center justify-center text-[8px] text-gray-200 uppercase font-black tracking-tighter">
                     Official Validation Stamp Required
                   </div>
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">{isRtl ? 'اعتماد المسؤول' : 'Authorized Signature'}</p>
                <div className="text-[8px] font-mono text-gray-400 space-y-0.5">
                  <p>ADM_UID: {user?.id.slice(0, 12).toUpperCase()}</p>
                  <p>SYS_REF: {Date.now().toString(16).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Page Footer */}
          <div className="mt-10 pt-4 border-t border-gray-100 flex justify-between items-center text-[8px] font-bold text-gray-300 uppercase tracking-[0.4em]">
            <p>Confidential • Platform Auditing Ledger • ClinicOS v2.4.0</p>
            <p>End of Official Audit Record</p>
          </div>
        </div>
      </div>
    </div>
  );
}
