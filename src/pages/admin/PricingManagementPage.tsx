import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlatformPricing } from '@/types/clinic';
import { motion } from 'framer-motion';
import { DollarSign, Save, Calendar, CalendarDays, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const t = {
  en: {
    title: 'Pricing Management',
    subtitle: 'Control subscription pricing for the platform',
    monthlyPlan: 'Monthly Plan',
    yearlyPlan: 'Yearly Plan',
    price: 'Price (EGP)',
    perMonth: '/ month',
    perYear: '/ year',
    save: 'Save Changes',
    saving: 'Saving...',
    saved: 'Prices updated successfully!',
    error: 'Failed to update prices.',
    lastUpdated: 'Last updated',
    savingPercent: 'Savings',
    previewLanding: 'This is how prices appear on your landing page.',
  },
  ar: {
    title: 'إدارة الأسعار',
    subtitle: 'التحكم في أسعار الاشتراكات على المنصة',
    monthlyPlan: 'الخطة الشهرية',
    yearlyPlan: 'الخطة السنوية',
    price: 'السعر (ج.م)',
    perMonth: '/ شهر',
    perYear: '/ سنة',
    save: 'حفظ التغييرات',
    saving: 'جاري الحفظ...',
    saved: 'تم تحديث الأسعار بنجاح!',
    error: 'فشل في تحديث الأسعار.',
    lastUpdated: 'آخر تحديث',
    savingPercent: 'التوفير',
    previewLanding: 'هذا هو شكل الأسعار على صفحة الموقع.',
  },
};

export default function PricingManagementPage() {
  const { user } = useAuth();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const labels = isRtl ? t.ar : t.en;

  const [monthlyPrice, setMonthlyPrice] = useState(350);
  const [yearlyPrice, setYearlyPrice] = useState(3500);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'platform_settings', 'pricing'));
      if (snap.exists()) {
        const data = snap.data() as PlatformPricing;
        setMonthlyPrice(data.monthlyPrice);
        setYearlyPrice(data.yearlyPrice);
        if (data.updatedAt) setLastUpdated(data.updatedAt);
      }
      setIsLoaded(true);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      await setDoc(doc(db, 'platform_settings', 'pricing'), {
        monthlyPrice,
        yearlyPrice,
        currency: 'EGP',
        updatedAt: now,
        updatedBy: user.id,
      });
      setLastUpdated(now);
      toast.success(labels.saved);
    } catch (err) {
      toast.error(labels.error);
    } finally {
      setIsSaving(false);
    }
  };

  const yearlyEquivalentMonthly = Math.round(yearlyPrice / 12);
  const savingPercent = monthlyPrice > 0 ? Math.round(((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">{labels.title}</h1>
        <p className="text-muted-foreground font-medium">{labels.subtitle}</p>
      </div>

      {/* Price Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-border/50 bg-card p-8 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Calendar className="h-32 w-32" />
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 flex items-center justify-center">
              <CalendarDays className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">{labels.monthlyPlan}</h3>
              <p className="text-xs text-muted-foreground">{labels.perMonth}</p>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {labels.price}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-auto rtl:right-4" />
              <Input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(Number(e.target.value))}
                className="h-16 rounded-2xl text-3xl font-black text-center"
              />
            </div>
          </div>
          <div className="text-center relative z-10">
            <span className="text-4xl font-black text-foreground">{monthlyPrice}</span>
            <span className="text-lg text-muted-foreground font-bold ms-1">EGP {labels.perMonth}</span>
          </div>
        </motion.div>

        {/* Yearly */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-orange-500/5 p-8 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <Calendar className="h-32 w-32" />
          </div>
          {savingPercent > 0 && (
            <div className="absolute top-4 end-4 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-lg">
              {labels.savingPercent}: {savingPercent}%
            </div>
          )}
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-foreground">{labels.yearlyPlan}</h3>
              <p className="text-xs text-muted-foreground">{labels.perYear}</p>
            </div>
          </div>
          <div className="space-y-2 relative z-10">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {labels.price}
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-auto rtl:right-4" />
              <Input
                type="number"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(Number(e.target.value))}
                className="h-16 rounded-2xl text-3xl font-black text-center"
              />
            </div>
          </div>
          <div className="text-center relative z-10">
            <span className="text-4xl font-black text-foreground">{yearlyPrice}</span>
            <span className="text-lg text-muted-foreground font-bold ms-1">EGP {labels.perYear}</span>
            <p className="text-sm text-muted-foreground mt-1">
              ≈ {yearlyEquivalentMonthly} EGP {labels.perMonth}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Save Button & Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-border/50 bg-card p-6">
        <div className="text-sm text-muted-foreground">
          {lastUpdated && (
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {labels.lastUpdated}: {new Date(lastUpdated).toLocaleString(isRtl ? 'ar-EG' : 'en-US')}
            </p>
          )}
          <p className="mt-1 text-xs opacity-70">{labels.previewLanding}</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20 px-8 h-12"
        >
          <Save className="h-4 w-4" />
          {isSaving ? labels.saving : labels.save}
        </Button>
      </div>
    </div>
  );
}
