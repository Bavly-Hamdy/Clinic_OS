import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import {
  collection, addDoc, getDocs, query, where, orderBy,
  onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { Expense, Payment, ExpenseCategory, VisitType } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DollarSign, TrendingUp, TrendingDown, Plus, Printer,
  Receipt, FileText, Wallet, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { ShiftClosePDFButton } from '@/components/ShiftClosePDF';
import { useTranslation } from 'react-i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedPayment extends Payment {
  patientName?: string;
  visitType?: VisitType;
  createdAt?: string;
}

interface ShiftData {
  payments: EnrichedPayment[];
  expenses: Expense[];
  totalRevenue: number;
  totalExpenses: number;
  netCash: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  NEW_EXAM: 'New Exam',
  CONSULTATION_FREE: 'Free Consult',
  CONSULTATION_PAID: 'Paid Consult',
  URGENT: 'Urgent',
  SONAR: 'Sonar',
  ECG: 'ECG',
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  SUPPLIES: 'bg-blue-100 text-blue-700',
  MAINTENANCE: 'bg-orange-100 text-orange-700',
  UTILITIES: 'bg-purple-100 text-purple-700',
  OTHER: 'bg-muted text-muted-foreground',
};

// ─── Expense form ─────────────────────────────────────────────────────────────

const expenseSchema = z.object({
  description: z.string().min(2, 'Required'),
  amount: z.coerce.number().positive('Must be > 0'),
  category: z.enum(['SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'OTHER']),
});
type ExpenseForm = z.infer<typeof expenseSchema>;

function AddExpenseDialog({ onAdded }: { onAdded: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<ExpenseForm>({
      resolver: zodResolver(expenseSchema),
      defaultValues: { category: 'SUPPLIES' },
    });

  const onSubmit = async (v: ExpenseForm) => {
    try {
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
      await addDoc(collection(db, 'expenses'), {
        ...v,
        doctorId: effectiveDoctorId,
        expenseDate: new Date().toISOString().slice(0, 10),
        loggedById: user?.id ?? '',
        createdAt: new Date().toISOString(),
      });
      toast({ title: t('shiftClosePage.expenseLogged') });
      setOpen(false);
      reset();
      onAdded();
    } catch (err) {
      console.error(err);
      toast({ title: t('shiftClosePage.expenseError'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl shadow-lg shadow-destructive/10 hover:shadow-destructive/30 transition-all group font-bold bg-background/50 border-destructive/20 text-destructive hover:bg-destructive hover:text-white border">
          <Plus className="h-4 w-4 me-2 group-hover:scale-110 transition-transform" />
          {t('shiftClosePage.logExpense')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/20 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="p-6 border-b border-border/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-destructive/10 text-destructive shrink-0">
                <Receipt className="h-5 w-5" />
             </div>
             {t('shiftClosePage.newExpense')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-muted/5">
          <div className="space-y-2 group">
            <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('shiftClosePage.description')} <span className="text-destructive">*</span></Label>
            <Input 
              placeholder={t('shiftClosePage.descriptionPlaceholder')} 
              className="h-12 bg-background/80 border-border/50 focus-visible:ring-destructive/30 font-semibold rounded-xl"
              {...register('description')} 
            />
            {errors.description && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('shiftClosePage.amount')} <span className="text-destructive">*</span></Label>
              <div className="relative">
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase">{t('common.egp')}</span>
                <Input 
                   type="number" 
                   step={0.5} 
                   min={0} 
                   placeholder="0.00" 
                   className="ps-12 h-12 bg-background/80 border-border/50 focus-visible:ring-destructive/30 font-black text-lg rounded-xl"
                   {...register('amount', { valueAsNumber: true })} 
                />
              </div>
              {errors.amount && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.amount.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('shiftClosePage.category')} <span className="text-info">*</span></Label>
              <Controller name="category" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-background/80 border-border/50 focus:ring-info/30 font-bold rounded-xl text-xs uppercase tracking-wide">
                    <SelectValue placeholder={t('shiftClosePage.selectCategory')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl font-medium shadow-2xl">
                    {(['SUPPLIES', 'MAINTENANCE', 'UTILITIES', 'OTHER'] as ExpenseCategory[]).map((c) => (
                      <SelectItem key={c} value={c} className="font-bold py-2.5 focus:bg-info/10 cursor-pointer transition-colors text-xs">
                        {t(`shiftClosePage.categories.${c}`) || c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold tracking-widest uppercase bg-destructive text-white shadow-lg shadow-destructive/20 hover:shadow-destructive/40 transition-all duration-300" disabled={isSubmitting}>
                {isSubmitting ? t('shiftClosePage.savingBtn') : t('shiftClosePage.finalizeBtn')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  label, value, icon, accent, glow, trend,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  glow: string;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const { t } = useTranslation();
  return (
    <div className="glass-card relative overflow-hidden rounded-3xl border border-white/10 bg-background/40 backdrop-blur-xl p-6 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 group">
      <div className={`absolute -end-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${glow}`} />
      
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${accent}`}>
          {icon}
        </div>
        {trend && (
           <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
             trend === 'up' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
           }`}>
             {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
             {trend === 'up' ? t('shiftClosePage.gain') || 'Gain' : t('shiftClosePage.loss') || 'Loss'}
           </div>
        )}
      </div>

      <div className="relative z-10">
        <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest">
            {label}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <span className="text-xs font-black text-muted-foreground/40 uppercase tracking-widest">{t('common.egp')}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ShiftClosePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftData, setShiftData] = useState<ShiftData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch shift data for the selected date
  useEffect(() => {
    setIsLoading(true);

    const fetchShift = async () => {
      try {
        const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
        if (!effectiveDoctorId) return;

        const dayStart = `${date}T00:00:00.000Z`;
        const dayEnd = `${date}T23:59:59.999Z`;

        // Fetch payments for the doctor then filter in-memory
        const paymentsSnap = await getDocs(query(
          collection(db, 'payments'),
          where('doctorId', '==', effectiveDoctorId),
        ));

        const paymentsMapped = paymentsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Payment))
          .filter(p => p.createdAt && p.createdAt >= dayStart && p.createdAt <= dayEnd)
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        // Fetch appointments to enrich payments
        const appointmentsSnap = await getDocs(query(
          collection(db, 'appointments'),
          where('doctorId', '==', effectiveDoctorId),
        ));
        
        const apptMap = new Map<string, any>(
          appointmentsSnap.docs
            .map(d => [d.id, d.data()] as [string, any])
            .filter(([_, data]) => {
              const scheduledAt = (data as any).scheduledAt;
              return scheduledAt && scheduledAt >= dayStart && scheduledAt <= dayEnd;
            })
        );

        const payments: EnrichedPayment[] = paymentsMapped.map(p => {
          const appt = apptMap.get(p.appointmentId);
          return {
            ...p,
            patientName: (appt as any)?.patientName ?? '—',
            visitType: (appt as any)?.visitType,
          };
        });

        // Fetch expenses
        // Fetch expenses by doctor and filter by date in-memory
        const expensesSnap = await getDocs(query(
          collection(db, 'expenses'),
          where('doctorId', '==', effectiveDoctorId),
        ));
        
        const expenses: Expense[] = expensesSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as Expense))
          .filter(e => e.expenseDate === date)
          .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));

        const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
        const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
        const netCash = totalRevenue - totalExpenses;

        setShiftData({ payments, expenses, totalRevenue, totalExpenses, netCash });
      } catch (err) {
        console.error('Shift data fetch error:', err);
        toast({ title: 'Could not load shift data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchShift();
  }, [date]);

  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t('shiftClosePage.title')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isToday ? t('shiftClosePage.today') : format(new Date(`${date}T12:00:00`), 'EEEE, d MMMM yyyy')} {t('shiftClosePage.financialSummary')}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44 h-11 bg-background/50 border-white/10 rounded-xl font-bold focus:ring-primary/20"
          />
          <AddExpenseDialog onAdded={() => {
            setIsLoading(true);
            const fetchShiftManual = async () => {
              const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
              const dayStart = `${date}T00:00:00.000Z`;
              const dayEnd = `${date}T23:59:59.999Z`;
              
              const [pSnap, eSnap] = await Promise.all([
                getDocs(query(
                  collection(db, 'payments'), 
                  where('doctorId', '==', effectiveDoctorId),
                )),
                getDocs(query(
                  collection(db, 'expenses'), 
                  where('doctorId', '==', effectiveDoctorId),
                ))
              ]);

              const payments = pSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Payment))
                .filter(p => p.createdAt && p.createdAt >= dayStart && p.createdAt <= dayEnd);

              const expenses = eSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as Expense))
                .filter(e => e.expenseDate === date)
                .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
              setShiftData(prev => {
                if (!prev) return null;
                const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
                return { ...prev, expenses, totalExpenses, netCash: prev.totalRevenue - totalExpenses };
              });
              setIsLoading(false);
            };
            fetchShiftManual();
          }} />
          {shiftData && (
            <ShiftClosePDFButton date={date} shiftData={shiftData} />
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : shiftData ? (
        <>
          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-fade-in-up">
            <KpiCard
              label={t('shiftClosePage.totalRevenue')}
              value={shiftData.totalRevenue}
              icon={<TrendingUp className="h-6 w-6 text-success" />}
              accent="bg-success/10"
              glow="bg-success"
              trend="up"
            />
            <KpiCard
              label={t('shiftClosePage.totalExpenses')}
              value={shiftData.totalExpenses}
              icon={<TrendingDown className="h-6 w-6 text-destructive" />}
              accent="bg-destructive/10"
              glow="bg-destructive"
              trend="down"
            />
            <KpiCard
              label={t('shiftClosePage.netCash')}
              value={shiftData.netCash}
              icon={<Wallet className={`h-6 w-6 ${shiftData.netCash >= 0 ? 'text-primary' : 'text-warning'}`} />}
              accent={shiftData.netCash >= 0 ? 'bg-primary/10' : 'bg-warning/10'}
              glow={shiftData.netCash >= 0 ? 'bg-primary' : 'bg-warning'}
              trend={shiftData.netCash >= 0 ? 'up' : 'down'}
            />
          </div>

          {/* Net cash summary strip */}
          <div className={`rounded-3xl px-6 py-5 flex items-center justify-between backdrop-blur-md animate-fade-in-up ${shiftData.netCash >= 0
            ? 'bg-success/5 border border-success/20 shadow-lg shadow-success/5'
            : 'bg-warning/5 border border-warning/20 shadow-lg shadow-warning/5'
            }`} style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-5">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${shiftData.netCash >= 0 ? 'bg-success/10' : 'bg-warning/10'}`}>
                <DollarSign className={`h-7 w-7 ${shiftData.netCash >= 0 ? 'text-success' : 'text-warning'}`} />
              </div>
              <div>
                <p className="font-extrabold text-xl tracking-tight">
                  {t('shiftClosePage.settlement')}: {shiftData.netCash >= 0 ? '+' : ''}{shiftData.netCash.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-xs opacity-60">{t('common.egp')}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                   <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-[10px] font-bold p-0 px-2 h-5 rounded-lg border-white/5">{shiftData.payments.length} {t('shiftClosePage.payments')}</Badge>
                   <Badge variant="outline" className="bg-muted/50 text-muted-foreground text-[10px] font-bold p-0 px-2 h-5 rounded-lg border-white/5">{shiftData.expenses.length} {t('shiftClosePage.expenses')}</Badge>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
               <span className={`text-[10px] font-black uppercase tracking-widest ${shiftData.netCash >= 0 ? 'text-success' : 'text-warning'}`}>{t('shiftClosePage.currentStatus')}</span>
                <Badge
                variant="outline"
                className={`rounded-xl px-4 py-1 text-xs font-black uppercase tracking-wider ${shiftData.netCash >= 0 ? 'bg-success/10 border-success/30 text-success' : 'bg-warning/10 border-warning/30 text-warning'}`}
                >
                {shiftData.netCash >= 0 ? t('shiftClosePage.profitableShift') : t('shiftClosePage.deficitShift')}
                </Badge>
            </div>
          </div>

          {/* Payments table */}
          <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {/* Payments Card */}
            <div className="glass-panel rounded-3xl border border-white/10 bg-background/20 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-success/5">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-success" />
                   </div>
                   <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-foreground/80">{t('shiftClosePage.shiftRevenue')}</h3>
                      <p className="text-xs text-success font-bold mt-0.5">{t('shiftClosePage.recordsFound').replace('{{count}}', shiftData.payments.length.toString())}</p>
                   </div>
                </div>
                <div className="text-end">
                   <p className="text-xl font-black text-success tracking-tight">+{shiftData.totalRevenue.toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{t('common.egp')}</p>
                </div>
              </div>

              <div className="p-6 flex-1">
                {shiftData.payments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                       <DollarSign className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-black text-muted-foreground/50 uppercase text-xs tracking-widest">{t('shiftClosePage.noEntries')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shiftData.payments.map((p, i) => (
                      <div key={p.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-success/30 transition-all">
                        <div className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center font-black text-xs text-muted-foreground shadow-inner group-hover:bg-success group-hover:text-white transition-colors">
                           {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm truncate">{p.patientName}</p>
                           <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate mt-0.5">
                              {p.visitType ? t(`shiftClosePage.visitTypes.${p.visitType}`) || VISIT_TYPE_LABELS[p.visitType] : 'Unknown'} · {p.createdAt ? format(new Date(p.createdAt), 'HH:mm') : '—'}
                           </p>
                        </div>
                        <div className="text-end flex flex-col items-end">
                           <p className="font-black text-success text-base tracking-tight">+{p.amount}</p>
                           <Badge variant="outline" className={`h-4 text-[9px] px-1.5 rounded-md font-black italic tracking-tighter mt-1 ${p.method === 'CASH' ? 'bg-success/10 text-success' : 'bg-muted/50 text-muted-foreground'}`}>{t(`shiftClosePage.${p.method.toLowerCase()}`) || p.method}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Expenses Card */}
            <div className="glass-panel rounded-3xl border border-white/10 bg-background/20 backdrop-blur-xl overflow-hidden shadow-2xl flex flex-col">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-destructive/5">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-destructive" />
                   </div>
                   <div>
                      <h3 className="font-black text-sm uppercase tracking-widest text-foreground/80">{t('shiftClosePage.clinicExpenses')}</h3>
                      <p className="text-xs text-destructive font-bold mt-0.5">{t('shiftClosePage.recordsFound').replace('{{count}}', shiftData.expenses.length.toString())}</p>
                   </div>
                </div>
                <div className="text-end">
                   <p className="text-xl font-black text-destructive tracking-tight">-{shiftData.totalExpenses.toLocaleString()}</p>
                   <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-50">{t('common.egp')}</p>
                </div>
              </div>

              <div className="p-6 flex-1">
                {shiftData.expenses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                       <Receipt className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                    <p className="font-black text-muted-foreground/50 uppercase text-xs tracking-widest">{t('shiftClosePage.emptyLedger')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shiftData.expenses.map((e, i) => (
                      <div key={e.id} className="group flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-destructive/30 transition-all">
                        <div className="h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center font-black text-xs text-muted-foreground shadow-inner group-hover:bg-destructive group-hover:text-white transition-colors">
                           {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-sm truncate">{e.description}</p>
                           <Badge variant="outline" className="h-4 text-[9px] px-1.5 rounded-md font-black bg-muted/50 text-muted-foreground border-white/5 uppercase tracking-tighter mt-1">{t(`shiftClosePage.categories.${e.category}`) || e.category}</Badge>
                        </div>
                        <div className="text-end flex flex-col justify-center">
                           <p className="font-black text-destructive text-base tracking-tight">-{e.amount}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card py-24 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
          <p className="text-muted-foreground font-medium">{t('shiftClosePage.noData')}</p>
        </div>
      )}
    </div>
  );
}
