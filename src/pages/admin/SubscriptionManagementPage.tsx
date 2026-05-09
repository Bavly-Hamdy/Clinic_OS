import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useAdminDoctors } from '@/hooks/useAdminDoctors';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useLanguage } from '@/providers/LanguageProvider';
import { motion } from 'framer-motion';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlatformPricing } from '@/types/clinic';
import {
  CheckCircle2,
  XCircle,
  Pause,
  RefreshCw,
  Clock,
  Filter,
  CreditCard,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect } from 'react';

const t = {
  en: {
    title: 'Subscription Management',
    subtitle: 'Manage all doctor subscriptions',
    all: 'All',
    active: 'Active',
    expired: 'Expired',
    suspended: 'Suspended',
    pending: 'Pending',
    activate: 'Activate',
    suspend: 'Suspend',
    renew: 'Renew',
    monthly: 'Monthly',
    yearly: 'Yearly',
    daysLeft: 'days left',
    daysAgo: 'days ago',
    expires: 'Expires',
    started: 'Started',
    price: 'Price',
    noSubs: 'No subscriptions found.',
    selectPlan: 'Select Plan',
    activating: 'Activating...',
    successActivated: 'Subscription activated!',
    successSuspended: 'Subscription suspended.',
    successRenewed: 'Subscription renewed!',
    error: 'An error occurred.',
    custom: 'Custom Period',
    customShort: 'Custom',
    endDate: 'End Date',
    priceLabel: 'Amount (EGP)',
  },
  ar: {
    title: 'إدارة الاشتراكات',
    subtitle: 'إدارة جميع اشتراكات الدكاترة',
    all: 'الكل',
    active: 'نشط',
    expired: 'منتهي',
    suspended: 'موقوف',
    pending: 'في الانتظار',
    activate: 'تفعيل',
    suspend: 'إيقاف',
    renew: 'تجديد',
    monthly: 'شهري',
    yearly: 'سنوي',
    daysLeft: 'يوم متبقي',
    daysAgo: 'يوم مضى',
    expires: 'ينتهي',
    started: 'بدأ',
    price: 'السعر',
    noSubs: 'لا توجد اشتراكات.',
    selectPlan: 'اختر الخطة',
    activating: 'جاري التفعيل...',
    successActivated: 'تم تفعيل الاشتراك!',
    successSuspended: 'تم إيقاف الاشتراك.',
    successRenewed: 'تم تجديد الاشتراك!',
    error: 'حدث خطأ.',
    custom: 'فترة مخصصة',
    customShort: 'مخصص',
    endDate: 'تاريخ الانتهاء',
    priceLabel: 'المبلغ (ج.م)',
  },
};

export default function SubscriptionManagementPage() {
  const { user } = useAuth();
  const { doctors } = useAdminDoctors();
  const { subscriptions, isLoading, activateSubscription, suspendSubscription, renewSubscription } = useSubscriptions();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const labels = isRtl ? t.ar : t.en;

  const [filter, setFilter] = useState<string>('all');
  const [pricing, setPricing] = useState<PlatformPricing | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  
  // Custom plan state
  const [isCustomMode, setIsCustomMode] = useState<string | null>(null); // doctorId or subId
  const [customDate, setCustomDate] = useState<string>('');
  const [customPrice, setCustomPrice] = useState<number>(0);

  // Load pricing
  useEffect(() => {
    const loadPricing = async () => {
      const snap = await getDoc(doc(db, 'platform_settings', 'pricing'));
      if (snap.exists()) {
        setPricing(snap.data() as PlatformPricing);
      } else {
        setPricing({ monthlyPrice: 350, yearlyPrice: 3500, currency: 'EGP', updatedAt: '', updatedBy: '' });
      }
    };
    loadPricing();
  }, []);

  const filteredSubs = filter === 'all' ? subscriptions : subscriptions.filter((s) => s.status === filter);

  // Doctors without subscriptions (pending activation)
  const doctorsWithoutSubs = doctors.filter((d) => !subscriptions.some((s) => s.doctorId === d.id));

  const getDaysLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const handleActivate = async (doctorId: string, plan: 'monthly' | 'yearly' | 'custom') => {
    if (!user || !pricing) return;
    setActivatingId(doctorId);
    try {
      const doctor = doctors.find((d) => d.id === doctorId);
      let price = plan === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice;
      let endDate: Date | undefined = undefined;

      if (plan === 'custom') {
        price = customPrice;
        endDate = new Date(customDate);
        if (isNaN(endDate.getTime())) throw new Error('Invalid date');
      }

      await activateSubscription(doctorId, plan, price, user.id, doctor?.fullName, doctor?.email, endDate);
      toast.success(labels.successActivated);
      setIsCustomMode(null);
    } catch (err: any) {
      toast.error(err.message || labels.error);
    } finally {
      setActivatingId(null);
    }
  };

  const handleSuspend = async (subId: string, doctorId: string) => {
    try {
      await suspendSubscription(subId, doctorId);
      toast.success(labels.successSuspended);
    } catch (err) {
      toast.error(labels.error);
    }
  };

  const handleRenew = async (subId: string, doctorId: string, plan: 'monthly' | 'yearly' | 'custom') => {
    if (!pricing) return;
    try {
      let price = plan === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice;
      let endDate: Date | undefined = undefined;

      if (plan === 'custom') {
        price = customPrice;
        endDate = new Date(customDate);
        if (isNaN(endDate.getTime())) throw new Error('Invalid date');
      }

      await renewSubscription(subId, doctorId, plan, price, endDate);
      toast.success(labels.successRenewed);
      setIsCustomMode(null);
    } catch (err: any) {
      toast.error(err.message || labels.error);
    }
  };

  const filters = [
    { key: 'all', label: labels.all },
    { key: 'active', label: labels.active },
    { key: 'expired', label: labels.expired },
    { key: 'suspended', label: labels.suspended },
    { key: 'pending', label: labels.pending },
  ];

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
      case 'expired': return 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20';
      case 'suspended': return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
      default: return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{labels.title}</h1>
        <p className="text-muted-foreground font-medium">{labels.subtitle}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === f.key
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Doctors without subscriptions */}
      {doctorsWithoutSubs.length > 0 && (filter === 'all' || filter === 'pending') && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {isRtl ? 'دكاترة بدون اشتراك' : 'Doctors Without Subscription'}
          </h3>
          {doctorsWithoutSubs.map((doctor) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/5 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-xs">
                    {doctor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-bold text-foreground">{doctor.fullName}</p>
                  <p className="text-xs text-muted-foreground">{doctor.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="rounded-xl text-xs gap-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={activatingId === doctor.id}
                  onClick={() => handleActivate(doctor.id, 'monthly')}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {activatingId === doctor.id ? labels.activating : `${labels.activate} - ${labels.monthly}`}
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl text-xs gap-1 bg-blue-600 hover:bg-blue-700"
                  disabled={activatingId === doctor.id}
                  onClick={() => handleActivate(doctor.id, 'yearly')}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  {`${labels.activate} - ${labels.yearly}`}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs gap-1 border-amber-500 text-amber-600"
                  onClick={() => {
                    setIsCustomMode(doctor.id);
                    setCustomPrice(pricing?.monthlyPrice || 350);
                    const future = new Date();
                    future.setMonth(future.getMonth() + 1);
                    setCustomDate(future.toISOString().split('T')[0]);
                  }}
                >
                  <Clock className="h-3.5 w-3.5" />
                  {labels.customShort}
                </Button>
              </div>

              {isCustomMode === doctor.id && (
                <div className="w-full mt-4 p-4 rounded-xl bg-background/50 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">{labels.endDate}</label>
                    <input 
                      type="date" 
                      value={customDate} 
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="w-full h-9 rounded-lg bg-card border border-border px-3 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">{labels.priceLabel}</label>
                    <input 
                      type="number" 
                      value={customPrice} 
                      onChange={(e) => setCustomPrice(Number(e.target.value))}
                      className="w-full h-9 rounded-lg bg-card border border-border px-3 text-xs"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 h-9 rounded-lg text-xs" onClick={() => handleActivate(doctor.id, 'custom')}>
                      {labels.activate}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-9 rounded-lg text-xs" onClick={() => setIsCustomMode(null)}>
                      {isRtl ? 'إلغاء' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Subscription Cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredSubs.length === 0 && doctorsWithoutSubs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-bold text-foreground">{labels.noSubs}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSubs.map((sub, i) => {
            const daysLeft = getDaysLeft(sub.endDate);
            return (
              <motion.div
                key={sub.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                      sub.status === 'active' ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
                      sub.status === 'expired' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                      sub.status === 'suspended' ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                      'bg-gradient-to-br from-blue-500 to-indigo-600'
                    }`}>
                      {sub.status === 'active' ? <CheckCircle2 className="h-6 w-6 text-white" /> :
                       sub.status === 'expired' ? <XCircle className="h-6 w-6 text-white" /> :
                       sub.status === 'suspended' ? <Pause className="h-6 w-6 text-white" /> :
                       <Clock className="h-6 w-6 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-foreground truncate">{sub.doctorName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{sub.doctorEmail}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${statusColor(sub.status)}`}>
                          {sub.status === 'active' ? labels.active :
                           sub.status === 'expired' ? labels.expired :
                           sub.status === 'suspended' ? labels.suspended :
                           labels.pending}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground uppercase">
                          {sub.plan === 'monthly' ? labels.monthly : labels.yearly}
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {sub.price} EGP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
                    {/* Dates */}
                    <div className="text-xs text-muted-foreground space-y-1 text-start">
                      <p>{labels.started}: {new Date(sub.startDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}</p>
                      <p className={daysLeft <= 7 && daysLeft > 0 && sub.status === 'active' ? 'text-amber-600 font-bold' : daysLeft <= 0 ? 'text-red-600 font-bold' : ''}>
                        {labels.expires}: {new Date(sub.endDate).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')}
                        {sub.status === 'active' && ` (${daysLeft > 0 ? `${daysLeft} ${labels.daysLeft}` : labels.expired})`}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {sub.status === 'active' && (
                        <Button size="sm" variant="destructive" className="rounded-xl text-xs gap-1" onClick={() => handleSuspend(sub.id, sub.doctorId)}>
                          <Pause className="h-3.5 w-3.5" /> {labels.suspend}
                        </Button>
                      )}
                      {(sub.status === 'expired' || sub.status === 'suspended') && (
                        <>
                          <Button size="sm" className="rounded-xl text-xs gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => handleRenew(sub.id, sub.doctorId, 'monthly')}>
                            <RefreshCw className="h-3.5 w-3.5" /> {labels.renew} ({labels.monthly})
                          </Button>
                          <Button size="sm" className="rounded-xl text-xs gap-1 bg-blue-600 hover:bg-blue-700" onClick={() => handleRenew(sub.id, sub.doctorId, 'yearly')}>
                            <RefreshCw className="h-3.5 w-3.5" /> {labels.renew} ({labels.yearly})
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="rounded-xl text-xs gap-1 border-amber-500 text-amber-600" 
                            onClick={() => {
                              setIsCustomMode(sub.id);
                              setCustomPrice(sub.price);
                              setCustomDate(new Date(sub.endDate).toISOString().split('T')[0]);
                            }}
                          >
                            <Clock className="h-3.5 w-3.5" /> {labels.customShort}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {isCustomMode === sub.id && (
                  <div className="mt-4 p-4 rounded-xl bg-background/50 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{labels.endDate}</label>
                      <input 
                        type="date" 
                        value={customDate} 
                        onChange={(e) => setCustomDate(e.target.value)}
                        className="w-full h-9 rounded-lg bg-card border border-border px-3 text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">{labels.priceLabel}</label>
                      <input 
                        type="number" 
                        value={customPrice} 
                        onChange={(e) => setCustomPrice(Number(e.target.value))}
                        className="w-full h-9 rounded-lg bg-card border border-border px-3 text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 h-9 rounded-lg text-xs" onClick={() => handleRenew(sub.id, sub.doctorId, 'custom')}>
                        {labels.renew}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9 rounded-lg text-xs" onClick={() => setIsCustomMode(null)}>
                        {isRtl ? 'إلغاء' : 'Cancel'}
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
