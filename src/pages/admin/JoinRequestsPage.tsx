/**
 * JoinRequestsPage
 * ─────────────────
 * Admin page that displays all incoming subscription requests submitted
 * from the public registration form. Allows admin to:
 *   - View full request details (name, specialty, phone, plan, date)
 *   - Open WhatsApp for BOTH support numbers simultaneously (one click)
 *   - Mark a request as 'contacted'
 *   - Delete a request
 */

import { useState } from 'react';
import { useRegistrationRequests } from '@/hooks/useRegistrationRequests';
import { useSubscriptions } from '@/hooks/useSubscriptions';
import { useAdminDoctors } from '@/hooks/useAdminDoctors';
import { useAuth } from '@/providers/AuthProvider';
import { useLanguage } from '@/providers/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Trash2,
  CheckCircle2,
  Clock,
  PhoneCall,
  User,
  Stethoscope,
  Building2,
  Tag,
  Briefcase,
  CalendarDays,
  UserCheck,
  Inbox,
  Loader2,
  BadgeCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlatformPricing } from '@/types/clinic';
import { useEffect } from 'react';
import { RegistrationRequest } from '@/types/clinic';

const SUPPORT_NUMBERS = ['201111835471', '201153762560'];

const labels = {
  en: {
    title: 'Join Requests',
    subtitle: 'Incoming subscription requests from prospective doctors',
    empty: 'No pending join requests yet.',
    emptyHint: 'New requests will appear here in real-time as they come in.',
    new: 'New',
    contacted: 'Contacted',
    activated: 'Activated',
    monthly: 'Monthly',
    yearly: 'Yearly',
    contact: 'Contact via WhatsApp',
    markContacted: 'Mark as Contacted',
    activate: 'Activate Account',
    activating: 'Activating...',
    delete: 'Delete',
    deleting: 'Deleting...',
    phone: 'Phone',
    specialty: 'Specialty',
    clinic: 'Clinic',
    job: 'Profession',
    promo: 'Promo Code',
    plan: 'Plan',
    submittedAt: 'Submitted',
    whatsappMsg: (name: string) =>
      `Hello Dr. ${name}, your Clinic Hub subscription request has been received. We are ready to activate your account. Please confirm to proceed.`,
    whatsappMsgAr: (name: string) =>
      `مرحباً د. ${name}، تم استلام طلب اشتراكك في Clinic Hub. نحن جاهزون لتفعيل حسابك. يرجى التأكيد للمتابعة.`,
    successContacted: 'Marked as contacted.',
    successDeleted: 'Request deleted.',
    successActivated: 'Account activated successfully!',
    errorActivate: 'Could not activate account.',
    errorDelete: 'Could not delete request.',
  },
  ar: {
    title: 'طلبات الانضمام',
    subtitle: 'طلبات الاشتراك الواردة من الأطباء الجدد',
    empty: 'لا توجد طلبات انضمام حتى الآن.',
    emptyHint: 'ستظهر الطلبات الجديدة هنا بشكل فوري عند ورودها.',
    new: 'جديد',
    contacted: 'تم التواصل',
    activated: 'مُفعَّل',
    monthly: 'شهري',
    yearly: 'سنوي',
    contact: 'تواصل عبر الواتساب',
    markContacted: 'تحديد كـ "تم التواصل"',
    activate: 'تفعيل الحساب',
    activating: 'جاري التفعيل...',
    delete: 'حذف',
    deleting: 'جاري الحذف...',
    phone: 'الهاتف',
    specialty: 'التخصص',
    clinic: 'العيادة',
    job: 'المهنة',
    promo: 'كود الخصم',
    plan: 'الخطة',
    submittedAt: 'تاريخ الطلب',
    whatsappMsg: (name: string) =>
      `مرحباً د. ${name}، تم استلام طلب اشتراكك في Clinic Hub. نحن جاهزون لتفعيل حسابك. يرجى التأكيد للمتابعة.`,
    whatsappMsgAr: (name: string) =>
      `مرحباً د. ${name}، تم استلام طلب اشتراكك في Clinic Hub. نحن جاهزون لتفعيل حسابك. يرجى التأكيد للمتابعة.`,
    successContacted: 'تم تحديده كـ "تم التواصل".',
    successDeleted: 'تم حذف الطلب.',
    successActivated: 'تم تفعيل الحساب بنجاح!',
    errorActivate: 'تعذّر تفعيل الحساب.',
    errorDelete: 'تعذّر حذف الطلب.',
  },
};

const statusStyle: Record<RegistrationRequest['status'], string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  contacted: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  activated: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
};

function formatDate(iso: string, isRtl: boolean) {
  try {
    return new Date(iso).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function JoinRequestsPage() {
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const L = isRtl ? labels.ar : labels.en;

  const { requests, isLoading, updateStatus, deleteRequest } = useRegistrationRequests();
  const { activateSubscription } = useSubscriptions();
  const { doctors } = useAdminDoctors();
  const { user } = useAuth();

  const [filter, setFilter] = useState<'all' | RegistrationRequest['status']>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [pricing, setPricing] = useState<PlatformPricing | null>(null);

  useEffect(() => {
    const load = async () => {
      const snap = await getDoc(doc(db, 'platform_settings', 'pricing'));
      if (snap.exists()) setPricing(snap.data() as PlatformPricing);
      else setPricing({ monthlyPrice: 350, yearlyPrice: 3500, currency: 'EGP', updatedAt: '', updatedBy: '' });
    };
    load();
  }, []);

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  // Open WhatsApp for both support numbers at once
  const handleWhatsApp = (req: RegistrationRequest) => {
    const planName = req.plan === 'monthly'
      ? (isRtl ? 'الخطة الشهرية' : 'Monthly Plan')
      : (isRtl ? 'الخطة السنوية' : 'Yearly Plan');

    const check = '\u2705';
    const list = '\uD83D\uDCCB';
    const bullet = '\u25AB\uFE0F'; // White small square
    const rocket = '\uD83D\uDE80';
    const gear = '\u2699\uFE0F';
    const globe = '\uD83C\uDF10';

    const msg = isRtl
      ? `*CLINIC HUB | Support*\n` +
        `───────────────────\n\n` +
        `*سعادة الدكتور الموقر / ${req.name} المحترم،*\n` +
        `السلام عليكم ورحمة الله وبركاته،\n\n` +
        `يسعدنا في *منصة Clinic Hub* أن نرحب بانضمامكم إلينا لتطوير عيادتكم الموقرة. نود إعلامكم بأنه تم استلام طلبكم بنجاح ومراجعته من قِبل قسم علاقات الأطباء ${check}.\n\n` +
        `${list} *تفاصيل الطلب المُسجّل:*\n` +
        `${bullet} *الاسم:* د. ${req.name}` +
        (req.specialty ? `\n${bullet} *التخصص:* ${req.specialty}` : '') +
        (req.clinicName ? `\n${bullet} *العيادة:* ${req.clinicName}` : '') +
        `\n${bullet} *باقة الاشتراك:* ${planName}\n\n` +
        `${rocket} *خطوات تفعيل بيئة العمل الخاصة بكم:*\n` +
        `يرجى التكرم بالرد على هذه الرسالة لتأكيد رغبتكم بالبدء، ليقوم مهندسونا بتجهيز النظام وتفعيل لوحة التحكم الخاصة بكم فوراً ${gear}.\n\n` +
        `فريق الدعم الفني متواجد دائماً لخدمتكم والإجابة على أي استفسارات على مدار الساعة.\n\n` +
        `شاكرين لثقتكم الغالية بـ *Clinic Hub*،\n` +
        `*إدارة علاقات الأطباء والعملاء*\n` +
        `${globe} clinic-os-beige.vercel.app/`
      : `*CLINIC HUB | Support*\n` +
        `───────────────────\n\n` +
        `*Dear Dr. ${req.name},*\n` +
        `Greetings from the Clinic Hub Support Relations Team.\n\n` +
        `We are delighted to welcome you to the *Clinic Hub* network. This is to confirm that your registration request has been successfully processed and approved by our relations board ${check}.\n\n` +
        `${list} *Subscription Summary:*\n` +
        `${bullet} *Doctor:* Dr. ${req.name}` +
        (req.specialty ? `\n${bullet} *Specialty:* ${req.specialty}` : '') +
        (req.clinicName ? `\n${bullet} *Clinic:* ${req.clinicName}` : '') +
        `\n${bullet} *Plan:* ${planName}\n\n` +
        `${rocket} *Workspace Activation:*\n` +
        `Please reply to this message to confirm your starting preference. Our systems engineers will instantly configure and activate your dedicated clinical environment ${gear}.\n\n` +
        `We are fully committed to your success and available 24/7 for any assistance.\n\n` +
        `Sincerely,\n` +
        `*Customer & Physician Relations*\n` +
        `${globe} clinic-os-beige.vercel.app/`;

    SUPPORT_NUMBERS.forEach((num) => {
      // الحل السحري: استخدام API الواتساب المباشر وبناء الرابط بـ URLSearchParams
      const whatsappUrl = new URL('https://api.whatsapp.com/send');
      whatsappUrl.searchParams.append('phone', num);
      whatsappUrl.searchParams.append('text', msg);
      
      window.open(whatsappUrl.toString(), '_blank');
    });
    
    if (req.status === 'new') {
      updateStatus(req.id, 'contacted').catch(console.error);
    }
  };

  const handleMarkContacted = async (req: RegistrationRequest) => {
    try {
      await updateStatus(req.id, 'contacted');
      toast.success(L.successContacted);
    } catch {
      toast.error(L.errorDelete);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteRequest(id);
      toast.success(L.successDeleted);
    } catch {
      toast.error(L.errorDelete);
    } finally {
      setDeletingId(null);
    }
  };

  const handleActivate = async (req: RegistrationRequest) => {
    if (!user || !pricing) return;
    setActivatingId(req.id);
    try {
      // Find doctor by phone (if already created as user)
      const doctor = doctors.find(
        (d) => d.phone === req.phone || d.fullName === req.name
      );
      const price = req.plan === 'monthly' ? pricing.monthlyPrice : pricing.yearlyPrice;

      if (doctor) {
        await activateSubscription(
          doctor.id,
          req.plan,
          price,
          user.id,
          doctor.fullName,
          doctor.email
        );
        await updateStatus(req.id, 'activated');
        toast.success(L.successActivated);
      } else {
        // Doctor not created yet — mark as contacted and open WhatsApp
        toast.info(
          isRtl
            ? 'الطبيب لم يُنشأ بعد في النظام. أنشئ حسابه أولاً من صفحة "الدكاترة" ثم فعّله من صفحة "الاشتراكات".'
            : 'Doctor account not found. Create the account from "Doctors" page first, then activate from "Subscriptions".'
        );
      }
    } catch (err: unknown) {
      console.error(err);
      toast.error(L.errorActivate);
    } finally {
      setActivatingId(null);
    }
  };

  const filterTabs: { key: 'all' | RegistrationRequest['status']; label: string }[] = [
    { key: 'all', label: isRtl ? 'الكل' : 'All' },
    { key: 'new', label: L.new },
    { key: 'contacted', label: L.contacted },
    { key: 'activated', label: L.activated },
  ];

  return (
    <div className="space-y-6" dir={dir}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{L.title}</h1>
          <p className="text-muted-foreground font-medium mt-1">{L.subtitle}</p>
        </div>
        {/* New badge */}
        {requests.filter((r) => r.status === 'new').length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500/10 border border-blue-500/20">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {requests.filter((r) => r.status === 'new').length}{' '}
              {isRtl ? 'طلب جديد' : 'new request(s)'}
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              filter === tab.key
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {tab.label}
            {tab.key !== 'all' && (
              <span className={`ms-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                filter === tab.key ? 'bg-white/20' : 'bg-muted-foreground/10'
              }`}>
                {requests.filter((r) => r.status === tab.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground font-medium">{isRtl ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-3xl border border-dashed border-border bg-card p-16 text-center"
        >
          <Inbox className="h-14 w-14 mx-auto mb-4 text-muted-foreground/20" />
          <p className="font-bold text-foreground text-lg">{L.empty}</p>
          <p className="text-sm text-muted-foreground mt-1">{L.emptyHint}</p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          <AnimatePresence>
            {filtered.map((req, i) => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: i * 0.04, duration: 0.25 }}
                className="rounded-3xl border border-border/60 bg-card p-5 sm:p-6 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-5">

                  {/* Avatar + Name */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ${
                      req.status === 'new' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                      req.status === 'contacted' ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
                      'bg-gradient-to-br from-emerald-500 to-green-600'
                    }`}>
                      {req.name.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-lg text-foreground truncate">{req.name}</p>
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${statusStyle[req.status]}`}>
                          {req.status === 'new' ? L.new : req.status === 'contacted' ? L.contacted : L.activated}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {req.plan === 'monthly' ? L.monthly : L.yearly}
                        </span>
                      </div>

                      {/* Details row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-bold text-foreground">{req.phone}</span>
                        </span>
                        {req.specialty && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                            {req.specialty}
                          </span>
                        )}
                        {req.job && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5 shrink-0" />
                            {req.job}
                          </span>
                        )}
                        {req.clinicName && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0" />
                            {req.clinicName}
                          </span>
                        )}
                        {req.promoCode && (
                          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Tag className="h-3.5 w-3.5 shrink-0" />
                            <span className="font-bold text-primary">{req.promoCode}</span>
                          </span>
                        )}
                        {req.submittedAt && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                            <CalendarDays className="h-3 w-3 shrink-0" />
                            {formatDate(req.submittedAt, isRtl)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:shrink-0">
                    {/* WhatsApp — both numbers */}
                    <Button
                      size="sm"
                      className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 shadow-lg shadow-emerald-500/20 text-white font-bold"
                      onClick={() => handleWhatsApp(req)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      {L.contact}
                    </Button>

                    {/* Mark contacted */}
                    {req.status === 'new' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs gap-1.5 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 font-bold"
                        onClick={() => handleMarkContacted(req)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {L.markContacted}
                      </Button>
                    )}

                    {/* Activate account */}
                    {req.status !== 'activated' && (
                      <Button
                        size="sm"
                        className="rounded-xl text-xs gap-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold shadow-lg shadow-blue-500/20"
                        disabled={activatingId === req.id}
                        onClick={() => handleActivate(req)}
                      >
                        {activatingId === req.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                        {activatingId === req.id ? L.activating : L.activate}
                      </Button>
                    )}

                    {req.status === 'activated' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                        <BadgeCheck className="h-4 w-4" />
                        {L.activated}
                      </div>
                    )}

                    {/* Delete */}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="rounded-xl text-xs gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive font-bold"
                      disabled={deletingId === req.id}
                      onClick={() => handleDelete(req.id)}
                    >
                      {deletingId === req.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      {deletingId === req.id ? L.deleting : L.delete}
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
