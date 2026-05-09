import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { VisitType } from '@/types/clinic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Download,
  CalendarDays,
  Stethoscope,
  Wallet,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
} from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';

// ─── Constants ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2'];

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  NEW_EXAM: 'New Exam',
  CONSULTATION_FREE: 'Free Consult',
  CONSULTATION_PAID: 'Paid Consult',
  URGENT: 'Urgent',
  SONAR: 'Sonar',
  ECG: 'ECG',
};

type Period = 'today' | '7d' | '30d' | '90d' | 'custom';

// ─── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({
  icon, label, value, sub, iconClass = '',
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  iconClass?: string;
}) {
  return (
    <div className="relative group overflow-hidden rounded-3xl border border-white/20 bg-white/40 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Subtle background glow effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:opacity-100 opacity-0 transition-opacity duration-500 blur-xl" />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">{label}</p>
          <div className={`flex h-11 w-11 items-center justify-center rounded-2xl shadow-inner transition-transform duration-300 group-hover:scale-110 ${iconClass}`}>
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-4xl font-black tracking-tight tabular-nums text-foreground animate-fade-in-up">{value}</p>
          {sub && <p className="text-sm font-medium text-muted-foreground animate-fade-in-up opacity-80">{sub}</p>}
        </div>
      </CardContent>
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl border border-white/20 bg-background/80 backdrop-blur-xl shadow-2xl p-4 text-sm min-w-[160px] animate-fade-in">
      <p className="font-extrabold mb-3 text-xs uppercase tracking-widest text-muted-foreground border-b pb-2">
        {label ? format(new Date(`${label}T12:00:00`), 'dd MMM yyyy') : ''}
      </p>
      <div className="space-y-2">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-2 font-medium">
              <span className="h-3 w-3 rounded-full shadow-inner" style={{ backgroundColor: entry.color }} />
              <span className="text-foreground/80">{entry.name}</span>
            </span>
            <span className="font-bold text-foreground">{entry.value.toFixed(0)} <span className="text-[10px] text-muted-foreground">EGP</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CSV export helper ────────────────────────────────────────────────────────

function exportCSV(rows: object[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map(r =>
      headers.map(h => {
        const v = (r as any)[h];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : v;
      }).join(',')
    ),
  ].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [from, setFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));

  function applyPreset(p: Period) {
    setPeriod(p);
    const now = new Date();
    const fmt = (d: Date) => format(d, 'yyyy-MM-dd');
    if (p === 'today') { setFrom(fmt(now)); setTo(fmt(now)); }
    else if (p === '7d') { setFrom(fmt(subDays(now, 7))); setTo(fmt(now)); }
    else if (p === '30d') { setFrom(fmt(subDays(now, 30))); setTo(fmt(now)); }
    else if (p === '90d') { setFrom(fmt(subDays(now, 90))); setTo(fmt(now)); }
  }

  // ── Fetch appointments ────────────────────────────────────────────────────
  const { data: apptData, isLoading: apptLoading } = useQuery({
    queryKey: ['analytics-appts', from, to],
    queryFn: async () => {
      const fromISO = new Date(`${from}T00:00:00.000Z`).toISOString();
      const toISO = new Date(`${to}T23:59:59.999Z`).toISOString();
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

      const snap = await getDocs(query(
        collection(db, 'appointments'),
        where('doctorId', '==', effectiveDoctorId),
      ));

      // Filter in-memory to bypass index requirement and enforce isolation
      const appts = snap.docs
        .map(d => d.data())
        .filter(a => {
          const scheduledAt = a.scheduledAt;
          return scheduledAt >= fromISO && scheduledAt <= toISO;
        });
        
      const byType: Record<string, number> = {};
      const dailyCounts: Record<string, number> = {};

      appts.forEach(a => {
        // by type
        const t = a.visitType as string;
        byType[t] = (byType[t] || 0) + 1;
        // by day
        const day = (a.scheduledAt as string)?.slice(0, 10);
        if (day) dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });

      const completedCount = appts.filter(a => a.status === 'COMPLETED').length;
      const cancelledCount = appts.filter(a => a.status === 'CANCELLED').length;

      return { total: appts.length, byType, dailyCounts, completedCount, cancelledCount };
    },
  });

  // ── Fetch payments + expenses ─────────────────────────────────────────────
  const { data: finData, isLoading: finLoading } = useQuery({
    queryKey: ['analytics-fin', from, to],
    queryFn: async () => {
      const fromISO = new Date(`${from}T00:00:00.000Z`).toISOString();
      const toISO = new Date(`${to}T23:59:59.999Z`).toISOString();
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

      const [paySnap, expSnap] = await Promise.all([
        getDocs(query(
          collection(db, 'payments'),
          where('doctorId', '==', effectiveDoctorId),
        )),
        getDocs(query(
          collection(db, 'expenses'),
          where('doctorId', '==', effectiveDoctorId),
        )),
      ]);

      // Filter in-memory
      const payments = paySnap.docs
        .map(d => d.data())
        .filter(p => {
          const createdAt = p.createdAt;
          return createdAt >= fromISO && createdAt <= toISO;
        });
        
      const expenses = expSnap.docs
        .map(d => d.data())
        .filter(e => {
          const expenseDate = e.expenseDate;
          return expenseDate >= from && expenseDate <= to;
        });

      // Daily revenue + expense map
      const days = eachDayOfInterval({
        start: new Date(`${from}T12:00:00`),
        end: new Date(`${to}T12:00:00`),
      });
      const dailyMap: Record<string, { revenue: number; expenses: number; net: number }> = {};
      days.forEach(d => {
        const key = format(d, 'yyyy-MM-dd');
        dailyMap[key] = { revenue: 0, expenses: 0, net: 0 };
      });

      payments.forEach(p => {
        const d = (p.createdAt as string)?.slice(0, 10) ?? from;
        if (dailyMap[d]) dailyMap[d].revenue += p.amount ?? 0;
      });
      expenses.forEach(e => {
        const d = (e.expenseDate as string)?.slice(0, 10) ?? from;
        if (dailyMap[d]) dailyMap[d].expenses += e.amount ?? 0;
      });

      const chartData = Object.entries(dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({
          date,
          revenue: v.revenue,
          expenses: v.expenses,
          net: v.revenue - v.expenses,
        }));

      const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
      const totalExpenses = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
      const rawPayments = paySnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const rawExpenses = expSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      return {
        chartData,
        totalRevenue,
        totalExpenses,
        net: totalRevenue - totalExpenses,
        rawPayments,
        rawExpenses,
      };
    },
  });

  // ── Derived ───────────────────────────────────────────────────────────────
  const pieData = useMemo(() =>
    apptData
      ? Object.entries(apptData.byType).map(([k, v]) => ({
        name: VISIT_TYPE_LABELS[k as VisitType] ?? k,
        value: v as number,
      }))
      : [],
    [apptData]
  );

  const visitTypeTable = useMemo(() =>
    apptData
      ? Object.entries(apptData.byType)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([type, count]) => ({
          type: VISIT_TYPE_LABELS[type as VisitType] ?? type,
          count: count as number,
          pct: apptData.total ? Math.round(((count as number) / apptData.total) * 100) : 0,
        }))
      : [],
    [apptData]
  );

  const isLoading = apptLoading || finLoading;

  // ── CSV Exports ───────────────────────────────────────────────────────────
  function exportRevenue() {
    if (!finData) return;
    exportCSV(
      finData.chartData.map(r => ({
        Date: r.date,
        Revenue_EGP: r.revenue.toFixed(2),
        Expenses_EGP: r.expenses.toFixed(2),
        Net_EGP: r.net.toFixed(2),
      })),
      `revenue_${from}_to_${to}.csv`
    );
  }

  function exportPayments() {
    if (!finData) return;
    exportCSV(
      (finData.rawPayments as any[]).map(p => ({
        Date: (p.createdAt as string)?.slice(0, 10) ?? '',
        Amount: p.amount,
        Method: p.method,
        PatientId: p.patientId,
      })),
      `payments_${from}_to_${to}.csv`
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header & Controls Container */}
      <div className="relative glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden border border-white/20">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-info/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent mb-2">
              {t('analyticsPage.title')}
            </h1>
            <p className="text-sm md:text-base font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {format(new Date(`${from}T12:00:00`), 'dd MMM')} – {format(new Date(`${to}T12:00:00`), 'dd MMM yyyy')}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={exportRevenue} disabled={!finData} className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold">
              <Download className="h-4 w-4 me-2" />
              {t('analyticsPage.exportRev')}
            </Button>
            <Button variant="outline" size="sm" onClick={exportPayments} disabled={!finData} className="rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all font-semibold">
              <Download className="h-4 w-4 me-2" />
              {t('analyticsPage.exportPay')}
            </Button>
          </div>
        </div>

        {/* Period selector */}
        <div className="relative z-10 flex flex-wrap items-center gap-2 bg-background/50 p-2 rounded-2xl backdrop-blur-md border border-border/50 self-start">
          {(['today', '7d', '30d', '90d', 'custom'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              className={`rounded-xl px-5 py-2 text-sm font-bold capitalize transition-all duration-300 ${period === p
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                  : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                }`}
            >
              {t(`analyticsPage.presets.${p}` as any)}
            </button>
          ))}
          {period === 'custom' && (
            <div className="flex flex-wrap items-center gap-2 ms-2 ps-2 border-s border-border/50 animate-fade-in-right">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-auto rounded-xl bg-background/80 border-border/50 font-medium" />
              <span className="text-muted-foreground/60 text-sm font-bold mx-1">{t('analyticsPage.to')}</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-auto rounded-xl bg-background/80 border-border/50 font-medium" />
            </div>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          label={t('analyticsPage.totalAppts')}
          value={isLoading ? '—' : (apptData?.total ?? 0)}
          sub={<span className="flex items-center gap-3 mt-1"><span className="flex items-center text-success gap-1"><span className="h-1.5 w-1.5 rounded-full bg-success"/>{apptData?.completedCount ?? 0} {t('analyticsPage.done')}</span> <span className="flex items-center text-destructive gap-1"><span className="h-1.5 w-1.5 rounded-full bg-destructive"/>{apptData?.cancelledCount ?? 0} {t('analyticsPage.canc')}</span></span> as any}
          icon={<CalendarDays className="h-6 w-6 text-primary" />}
          iconClass="bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-inner"
        />
        <KpiCard
          label={t('analyticsPage.visitTypes')}
          value={isLoading ? '—' : Object.keys(apptData?.byType ?? {}).length}
          sub={t('analyticsPage.variety')}
          icon={<Stethoscope className="h-6 w-6 text-info" />}
          iconClass="bg-gradient-to-br from-info/20 to-info/5 text-info border border-info/20 shadow-inner"
        />
        <KpiCard
          label={t('analyticsPage.totalRev')}
          value={isLoading ? '—' : `${(finData?.totalRevenue ?? 0).toFixed(0)} EGP`}
          sub={`${t('analyticsPage.cost')}: ${(finData?.totalExpenses ?? 0).toFixed(0)} EGP`}
          icon={<TrendingUp className="h-6 w-6 text-success" />}
          iconClass="bg-gradient-to-br from-success/20 to-success/5 text-success border border-success/20 shadow-inner"
        />
        <KpiCard
          label={t('analyticsPage.netEarnings')}
          value={isLoading ? '—' : `${(finData?.net ?? 0).toFixed(0)} EGP`}
          sub={(finData?.net ?? 0) >= 0 ? <span className="text-success font-bold">▲ {t('analyticsPage.profit')}</span> as any : <span className="text-destructive font-bold">▼ {t('analyticsPage.loss')}</span> as any}
          icon={<Wallet className={`h-6 w-6 ${(finData?.net ?? 0) >= 0 ? 'text-primary' : 'text-destructive'}`} />}
          iconClass={(finData?.net ?? 0) >= 0 ? 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-inner' : 'bg-gradient-to-br from-destructive/20 to-destructive/5 text-destructive border border-destructive/20 shadow-inner'}
        />
      </div>

      {/* Revenue vs Expenses area chart */}
      <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
        <div className="p-6 border-b border-white/10 flex items-center justify-between pb-6">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5 rtl:-scale-x-100" />
             </div>
             <div>
               <h2 className="text-lg font-black tracking-tight text-foreground">{t('analyticsPage.revVsExp')}</h2>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('analyticsPage.finTraj')}</p>
             </div>
          </div>
          {finData && (
            <div className="hidden sm:flex items-center gap-4 text-sm font-bold bg-muted/30 px-4 py-2 rounded-xl border border-border/50">
              <span className="flex items-center gap-2 text-success">
                <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                +{finData.totalRevenue.toFixed(0)} EGP
              </span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-2 text-destructive">
                <span className="h-2 w-2 rounded-full bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                -{finData.totalExpenses.toFixed(0)} EGP
              </span>
            </div>
          )}
        </div>
        <div className="p-6">
          {finLoading ? (
            <div className="flex items-center justify-center h-[320px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
          ) : finData?.chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[320px] text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
              <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                 <TrendingUp className="h-8 w-8 text-muted-foreground/30 rtl:-scale-x-100" />
              </div>
              <p className="font-bold text-foreground">{t('analyticsPage.noFinData')}</p>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">{t('analyticsPage.noFinDataDesc')}</p>
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={finData?.chartData ?? []} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(`${v}T12:00:00`), 'dd MMM')}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16a34a" fill="url(#gradRev)" strokeWidth={3} dot={{ r: 4, fill: '#16a34a', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" fill="url(#gradExp)" strokeWidth={3} dot={{ r: 4, fill: '#dc2626', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area type="monotone" dataKey="net" name="Net" stroke="#2563eb" fill="url(#gradNet)" strokeWidth={3} dot={{ r: 4, fill: '#2563eb', strokeWidth: 0 }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row: Pie + Visit breakdown table */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie chart */}
        <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-info/10 text-info">
                <PieChartIcon className="h-5 w-5" />
             </div>
             <div>
               <h2 className="text-lg font-black tracking-tight text-foreground">{t('analyticsPage.servicesOverview')}</h2>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('analyticsPage.visitsByType')}</p>
             </div>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            {apptLoading ? (
              <div className="flex items-center justify-center flex-1 min-h-[250px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
            ) : pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 min-h-[250px] text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-muted-foreground/30 rtl:-scale-x-100" />
                </div>
                <p className="font-bold text-foreground">{t('analyticsPage.noAppts')}</p>
                <p className="text-muted-foreground text-sm mt-1 max-w-[200px]">{t('analyticsPage.noApptsDesc')}</p>
              </div>
            ) : (
              <div className="h-[280px] w-full flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={55}
                      stroke="none"
                      paddingAngle={4}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} className="drop-shadow-md hover:opacity-80 transition-opacity outline-none" style={{filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.15))'}} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(v: number) => [`${v} visits`, 'Count']} 
                      contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(var(--background), 0.8)', backdropFilter: 'blur(12px)' }} 
                      itemStyle={{ fontWeight: 'bold' }} 
                    />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Visit type breakdown table */}
        <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Stethoscope className="h-5 w-5" />
             </div>
             <div>
               <h2 className="text-lg font-black tracking-tight text-foreground">{t('analyticsPage.servicesRatio')}</h2>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('analyticsPage.breakdownDetails')}</p>
             </div>
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            {apptLoading ? (
              <div className="flex items-center justify-center flex-1 min-h-[250px]">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
              </div>
            ) : visitTypeTable.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 min-h-[250px] text-center bg-muted/20 rounded-2xl border border-dashed border-border/50">
                <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-muted-foreground/30" />
                </div>
                <p className="font-bold text-foreground">{t('analyticsPage.noVisitData')}</p>
              </div>
            ) : (
              <div className="space-y-5">
                {visitTypeTable.map((row, i) => (
                  <div key={i} className="space-y-2 group">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold flex items-center gap-3 text-foreground/80 group-hover:text-foreground transition-colors">
                        <span
                          className="h-3.5 w-3.5 rounded-full shrink-0 shadow-inner ring-2 ring-transparent group-hover:ring-border transition-all"
                          style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                        {row.type}
                      </span>
                      <span className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs font-black shadow-sm py-1 border-border/50">{row.count} <span className="text-[10px] ms-1 opacity-50 font-medium">Vol</span></Badge>
                        <span className="text-xs font-black w-10 text-end opacity-80">{row.pct}%</span>
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 rounded-full bg-muted overflow-hidden shadow-inner">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-in-out relative"
                        style={{
                          width: `${row.pct}%`,
                          backgroundColor: PIE_COLORS[i % PIE_COLORS.length],
                        }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full" />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-base font-black uppercase tracking-wider">
                  <span className="text-muted-foreground">{t('analyticsPage.totalServices')}</span>
                  <span className="text-primary bg-primary/10 px-3 py-1 rounded-lg">{apptData?.total ?? 0}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily appointments bar chart */}
      <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
        <div className="absolute top-0 end-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-10">
           <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-success/10 text-success">
              <BarChartIcon className="h-5 w-5" />
           </div>
           <div>
             <h2 className="text-lg font-black tracking-tight text-foreground">{t('analyticsPage.dailyComp')}</h2>
             <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('analyticsPage.revVsExpDetails')}</p>
           </div>
        </div>
        <div className="p-6 relative z-10">
          {finLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
            </div>
          ) : (
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={finData?.chartData ?? []}
                  margin={{ top: 10, right: 10, bottom: 0, left: -20 }}
                  barCategoryGap="25%"
                  barGap={4}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => format(new Date(`${v}T12:00:00`), 'ddMMM')}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    tickMargin={12}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))', fontWeight: 600 }} axisLine={false} tickLine={false} tickMargin={12} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.5)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontWeight: 600, fontSize: '13px' }} />
                  <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Expenses" fill="#dc2626" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
