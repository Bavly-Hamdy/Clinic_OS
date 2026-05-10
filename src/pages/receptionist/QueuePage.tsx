import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import {
  collection, onSnapshot, query, where, orderBy,
  doc, addDoc, getDocs, updateDoc, serverTimestamp, getDoc
} from 'firebase/firestore';
import {
  Appointment,
  AppointmentStatus,
  QueueStats,
  Patient,
  VisitType,
  ClinicSettings,
} from '@/types/clinic';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  Plus,
  Search,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  Wifi,
  DollarSign,
  CalendarPlus,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';
import { PatientRegistrationDialog } from '@/components/PatientRegistrationDialog';
import { UserPlus } from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────

const VISIT_TYPE_LABELS: Record<VisitType, string> = {
  NEW_EXAM: 'New Examination',
  CONSULTATION_FREE: 'Consultation (Free)',
  CONSULTATION_PAID: 'Consultation (Paid)',
  URGENT: 'Urgent',
  SONAR: 'Sonar',
  ECG: 'ECG',
};

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; className: string; icon: React.ReactNode }> = {
  WAITING: { label: 'Waiting', className: 'bg-warning/15 text-warning border-warning/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]', icon: <Clock className="h-3 w-3" /> },
  IN_CLINIC: { label: 'In Clinic', className: 'bg-info/15 text-info border-info/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]', icon: <UserCheck className="h-3 w-3" /> },
  COMPLETED: { label: 'Completed', className: 'bg-success/15 text-success border-success/30 shadow-[0_0_15px_rgba(34,197,94,0.2)]', icon: <CheckCircle2 className="h-3 w-3" /> },
  CANCELLED: { label: 'Cancelled', className: 'bg-muted/50 text-muted-foreground border-border/50', icon: <XCircle className="h-3 w-3" /> },
};

// ─── Booking form schema ──────────────────────────────────────────────────────

const bookingSchema = z.object({
  patientId: z.string().min(1, 'Select a patient'),
  visitType: z.enum(['NEW_EXAM', 'CONSULTATION_FREE', 'CONSULTATION_PAID', 'URGENT', 'SONAR', 'ECG']),
  fee: z.coerce.number().min(0, 'Fee cannot be negative'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-white/10 bg-background/40 backdrop-blur-xl p-6 hover:-translate-y-1 hover:shadow-2xl hover:shadow-${accent.split('/')[0].split('-')[1]}/20 transition-all duration-300 group`}>
      <div className={`absolute -end-4 -top-4 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none transition-opacity group-hover:opacity-40 ${accent}`} />
      
      <div className="flex items-center gap-5 relative z-10">
        <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${accent}`}>
          {icon}
        </div>
        <div>
          <p className="text-4xl font-black tracking-tighter bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            {value}
          </p>
          <p className="text-sm font-bold text-muted-foreground/80 uppercase tracking-widest mt-1">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Booking dialog ───────────────────────────────────────────────────────────

function BookingDialog({ onCreated }: { onCreated: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch pricing from Settings
  const { data: settings } = useQuery<ClinicSettings>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const snap = await getDoc(doc(db, 'clinic_settings', 'main'));
      return snap.exists() ? (snap.data() as ClinicSettings) : {} as ClinicSettings;
    },
  });

  const getPriceForRole = (type: VisitType) => {
    return settings?.pricing?.[type] ?? 0;
  };

  // Search patients from Firestore
  useEffect(() => {
    if (patientSearch.length < 2 || selectedPatient) {
      setPatients([]);
      return;
    }

    const fetchPatients = async () => {
      const searchDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
      if (!searchDoctorId) return;

      const qSnap = query(
        collection(db, 'patients'),
        where('doctorId', '==', searchDoctorId),
      );
      const snap = await getDocs(qSnap);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Patient[];
      
      // In-memory sort by fullName since we removed orderBy
      all.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

      const q = patientSearch.toLowerCase();
      setPatients(
        all.filter(p =>
          p.fullName.toLowerCase().includes(q) ||
          p.phone.includes(q) ||
          p.patientId.toLowerCase().includes(q)
        ).slice(0, 8)
      );
    };

    fetchPatients();
  }, [patientSearch, selectedPatient]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: { visitType: 'NEW_EXAM', fee: 0 },
  });

  const watchedVisitType = watch('visitType');

  // Auto-fill fee based on visit type from Settings
  useEffect(() => {
    if (watchedVisitType && settings) {
      setValue('fee', getPriceForRole(watchedVisitType as VisitType));
    }
  }, [watchedVisitType, setValue, settings]);

  const handleClose = () => {
    setOpen(false);
    reset();
    setSelectedPatient(null);
    setPatientSearch('');
    setPatients([]);
  };

  const onSubmit = async (values: BookingFormValues) => {
    try {
      const today = new Date();
      const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

      const bookingDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;

      // Count today's appointments for queue number
      const todaySnap = await getDocs(query(
        collection(db, 'appointments'),
        where('doctorId', '==', bookingDoctorId),
      ));
      
      // Filter today's in memory to avoid indexing issues with multiple where clauses
      const todayCount = todaySnap.docs.filter(d => {
        const scheduledAt = d.data().scheduledAt;
        return scheduledAt >= todayStart.toISOString() && scheduledAt <= todayEnd.toISOString();
      }).length;

      const queueNumber = todayCount + 1;

      // Get patient name for denormalized display
      const patient = selectedPatient;

      await addDoc(collection(db, 'appointments'), {
        patientId: values.patientId,
        doctorId: bookingDoctorId,
        patientName: patient?.fullName ?? '',
        patientPhone: patient?.phone ?? '',
        visitType: values.visitType,
        fee: values.fee,
        isPaid: false,
        status: 'WAITING',
        queueNumber,
        scheduledAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        createdById: user?.id ?? '',
      });

      toast({ title: `✅ Added to queue as #${queueNumber}` });
      handleClose();
      onCreated();
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not book appointment.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        <Button size="lg" className="rounded-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all group font-bold tracking-wide">
          <CalendarPlus className="h-5 w-5 me-2 group-hover:scale-110 transition-transform" />
          {t('queuePage.newBooking')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/20 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-0" aria-describedby={undefined}>
        <DialogHeader className="p-6 border-b border-border/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <Plus className="h-5 w-5" />
             </div>
             {t('queuePage.addPatient')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-muted/10">
          {/* Patient search */}
          <div className="space-y-2 group">
            <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('queuePage.searchPatient')} <span className="text-destructive">*</span></Label>
            <div className="relative group">
              <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary z-10" />
              <Input
                placeholder={t('queuePage.searchPatient')}
                className="ps-12 pe-32 h-14 bg-background/50 border-border/50 focus-visible:ring-primary/30 font-semibold rounded-2xl text-base transition-all shadow-inner group-focus-within:bg-background"
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  if (selectedPatient) setSelectedPatient(null);
                }}
              />
              <div className="absolute end-1.5 top-1/2 -translate-y-1/2 z-20">
                <PatientRegistrationDialog 
                  onCreated={onCreated} 
                  trigger={
                    <Button type="button" variant="secondary" size="sm" className="h-10 text-[11px] font-black uppercase tracking-tight bg-primary/10 hover:bg-primary/20 text-primary border-none rounded-xl transition-all shadow-sm">
                      <UserPlus className="h-3.5 w-3.5 me-1.5" />
                      {t('queuePage.quickRegister')}
                    </Button>
                  }
                />
              </div>
            </div>
            {patients.length > 0 && !selectedPatient && (
              <div className="absolute z-50 w-[calc(100%-3rem)] mt-2 rounded-xl border border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl max-h-56 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2">
                {patients.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/50 text-start transition-colors border-b border-border/5 last:border-0"
                    onClick={() => {
                      setSelectedPatient(p);
                      setValue('patientId', p.id);
                      setPatientSearch(p.fullName);
                      setPatients([]);
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-bold shadow-inner">
                      {p.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.fullName}</p>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground truncate">{p.patientId} · {p.phone}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 shrink-0 rtl:rotate-180 transition-transform" />
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="flex items-center gap-4 rounded-2xl bg-success/10 border border-success/20 px-4 py-4 mt-4 animate-in slide-in-from-top-4 duration-500 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success text-success-foreground text-sm font-black shadow-lg shadow-success/20">
                  {selectedPatient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-black text-foreground truncate">{selectedPatient.fullName}</p>
                  <p className="text-[11px] font-black text-success/80 uppercase tracking-widest mt-0.5">{selectedPatient.patientId}</p>
                </div>
                <button
                  type="button"
                  className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0 hover:rotate-90 active:scale-95"
                  onClick={() => { setSelectedPatient(null); setValue('patientId', ''); setPatientSearch(''); }}
                >
                  <XCircle className="h-5 w-5 text-destructive/70" />
                </button>
              </div>
            )}
            {errors.patientId && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.patientId.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Visit type */}
            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('queuePage.reason')} <span className="text-destructive">*</span></Label>
              <Controller
                name="visitType"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-14 bg-background/50 border-border/50 focus:ring-primary/30 font-bold text-sm rounded-2xl transition-all shadow-inner">
                      <SelectValue placeholder={t('patientDialog.select')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl font-medium shadow-2xl">
                      {Object.keys(VISIT_TYPE_LABELS).map((k) => (
                        <SelectItem key={k} value={k} className="font-semibold py-2.5 focus:bg-primary/10 cursor-pointer transition-colors">
                           {t(`common.visitTypes.${k}`) || VISIT_TYPE_LABELS[k as keyof typeof VISIT_TYPE_LABELS]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.visitType && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.visitType.message}</p>}
            </div>

            {/* Fee — auto-filled, editable */}
            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1 text-end block">{t('queuePage.pricing')}</Label>
              <div className="relative group">
                <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">{t('common.egp')}</span>
                <Input 
                   type="number" 
                   min={0} 
                   step={5} 
                   className="ps-16 h-14 bg-background/50 border-border/50 focus-visible:ring-primary/30 font-black text-xl rounded-2xl transition-all shadow-inner group-focus-within:bg-background" 
                   {...register('fee', { valueAsNumber: true })} 
                />
              </div>
              {errors.fee && <p className="text-xs font-bold text-destructive text-end pe-1 animate-fade-in">{errors.fee.message}</p>}
            </div>
          </div>
          
          <div className="pt-2">
            <Button type="submit" className="w-full h-12 rounded-xl font-bold tracking-widest uppercase shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300" disabled={isSubmitting || !selectedPatient}>
              {isSubmitting ? t('queuePage.processing') : t('queuePage.finalizeBooking')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Payment dialog ───────────────────────────────────────────────────────────

function MarkPaidButton({ appt }: { appt: Appointment }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();

  const handlePay = async (method: 'CASH' | 'FREE') => {
    try {
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
      await updateDoc(doc(db, 'appointments', appt.id), { isPaid: true });
      await addDoc(collection(db, 'payments'), {
        appointmentId: appt.id,
        patientId: appt.patientId,
        doctorId: effectiveDoctorId,
        amount: method === 'FREE' ? 0 : appt.fee,
        method,
        collectedById: user?.id ?? '',
        createdAt: new Date().toISOString(),
      });
      toast({ title: t('queuePage.paymentRecorded').replace('{{method}}', method) });
    } catch (err) {
      console.error(err);
      toast({ title: t('queuePage.paymentError'), variant: 'destructive' });
    }
  };

  if (appt.isPaid) {
    return <span className="text-xs font-black text-success uppercase tracking-widest px-2 py-1 bg-success/10 rounded-lg">{t('queuePage.paid')}</span>;
  }

  if (appt.fee === 0) {
    return (
      <Button size="sm" variant="ghost" className="text-[11px] h-8 px-3 font-bold uppercase tracking-wider text-muted-foreground hover:bg-muted/50 rounded-lg" onClick={() => handlePay('FREE')}>
        {t('queuePage.markFree')}
      </Button>
    );
  }

  return (
    <Button size="sm" variant="outline" className="text-[11px] h-8 px-3 font-bold uppercase tracking-wider text-success hover:text-success border-success/30 hover:bg-success/10 rounded-lg shadow-sm shadow-success/10 transition-all" onClick={() => handlePay('CASH')}>
      {t('queuePage.collectEgp').replace('{{fee}}', appt.fee.toString())}
    </Button>
  );
}

// ─── Queue row ────────────────────────────────────────────────────────────────

function QueueRow({ appt, onStatusChange }: { appt: Appointment; onStatusChange: (id: string, status: AppointmentStatus) => void }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[appt.status];

  return (
    <div className={`relative overflow-hidden flex items-center gap-4 px-6 py-5 cursor-pointer hover:-translate-y-1 transition-all duration-300 animate-fade-in-up group rounded-3xl border ${appt.status === 'IN_CLINIC' ? 'bg-info/5 border-info/30 shadow-[0_8px_30px_rgba(59,130,246,0.15)] ring-1 ring-info/50' : appt.status === 'COMPLETED' ? 'bg-background/40 border-success/10 opacity-70 hover:opacity-100' : 'bg-background/60 dark:bg-black/40 backdrop-blur-md border-white/10 hover:shadow-xl hover:shadow-primary/5'}`}>
      
      {appt.status === 'IN_CLINIC' && (
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-info/0 via-info to-info/0 blur-sm opacity-50" />
      )}

      {/* Queue number */}
      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl font-black text-xl shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${appt.status === 'IN_CLINIC' ? 'bg-info text-info-foreground shadow-info/20' : appt.status === 'COMPLETED' ? 'bg-success/20 text-success' : 'bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20'}`}>
        #{appt.queueNumber}
      </div>

      {/* Patient info */}
      <div className="flex-1 min-w-0">
        <p className={`font-black tracking-tight text-lg truncate transition-colors ${appt.status === 'IN_CLINIC' ? 'text-info' : 'text-foreground'}`}>
          {(appt as any).patientName || appt.patient?.fullName || 'Unknown Patient'}
        </p>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
          <span className="text-foreground/70">{t(`common.visitTypes.${appt.visitType}`) || VISIT_TYPE_LABELS[appt.visitType]}</span> <span className="mx-1.5 opacity-30">•</span> {format(new Date(appt.scheduledAt), 'hh:mm a')}
        </p>
      </div>

      {/* Payment */}
      <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 px-4 border-e border-border/50">
        <span className="text-[15px] font-black">{appt.fee > 0 ? `${appt.fee} ${t('common.egp') || 'EGP'}` : t('queuePage.markFree').replace('Mark ', '').replace('تسجيل ', '')}</span>
        <MarkPaidButton appt={appt} />
      </div>

      {/* Status badge */}
      <div className="hidden md:flex flex-col items-end shrink-0 min-w-[120px]">
        <Badge variant="outline" className={`items-center gap-1.5 px-3 py-1 font-bold tracking-wider uppercase text-[10px] ${cfg.className}`}>
          {cfg.icon}
          {t(`queuePage.status.${appt.status}`) || cfg.label}
        </Badge>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 shrink-0 min-w-[140px]">
        {appt.status === 'WAITING' && (
          <Button size="sm" className="bg-info text-info-foreground hover:bg-info/90 font-bold uppercase tracking-wider text-[11px] h-9 px-4 rounded-xl shadow-lg shadow-info/20 hover:shadow-info/40 transition-all"
            onClick={(e) => { e.stopPropagation(); onStatusChange(appt.id, 'IN_CLINIC'); }}>
            {t('queuePage.callIn')}
          </Button>
        )}
        {appt.status === 'IN_CLINIC' && (
          <Button size="sm" className="bg-success text-success-foreground hover:bg-success/90 font-bold uppercase tracking-wider text-[11px] h-9 px-4 rounded-xl shadow-lg shadow-success/20 hover:shadow-success/40 transition-all"
            onClick={(e) => { e.stopPropagation(); onStatusChange(appt.id, 'COMPLETED'); }}>
            {t('queuePage.markDone')}
          </Button>
        )}
        {(appt.status === 'WAITING' || appt.status === 'IN_CLINIC') && (
          <Button size="icon" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 w-9 rounded-xl transition-colors shrink-0"
            onClick={(e) => { e.stopPropagation(); onStatusChange(appt.id, 'CANCELLED'); }}>
            <XCircle className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ReceptionistQueuePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<AppointmentStatus | 'ALL'>('ALL');

  // ── Real-time Firestore listener ──────────────────────────────────────────
  useEffect(() => {
    // Auth Guard: Only attach listener if user is logged in
    if (!user || !user.id) return;

    const today = new Date();
    const todayStart = new Date(today); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today); todayEnd.setHours(23, 59, 59, 999);

    const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
    if (!effectiveDoctorId) return;

    // Aggressive Index Bypass: Query ONLY by doctorId
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', effectiveDoctorId)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const allAppts = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Appointment[];
      
      // Client-Side Filtering (Instead of Firestore where clause)
      const appts = allAppts.filter(a => {
        const dateStr = a.scheduledAt;
        return dateStr >= todayStart.toISOString() && dateStr <= todayEnd.toISOString();
      });

      // Client-Side Sorting (Instead of Firestore orderBy)
      const sorted = [...appts].sort((a, b) => 
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
      );
      
      setAppointments(sorted);
      setIsLoading(false);
    }, (err) => {
      console.error('Queue listener error:', err);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Function to trigger re-fetch/re-evaluation of appointments
  const refetch = () => {
    // Rely on onSnapshot to update `appointments` state.
  };

  // ── Status mutation ───────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, status: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {}),
        ...(status === 'IN_CLINIC' ? { calledAt: new Date().toISOString() } : {}),
      });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Could not update status.', variant: 'destructive' });
    }
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  const stats: QueueStats = {
    waiting: appointments.filter(a => a.status === 'WAITING').length,
    inClinic: appointments.filter(a => a.status === 'IN_CLINIC').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  };

  const filtered = filter === 'ALL' ? appointments : appointments.filter(a => a.status === filter);

  const inClinicNow = appointments.find(a => a.status === 'IN_CLINIC');

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto animate-fade-in">
      {/* Page header */}
      <div className="relative glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden border border-white/20">
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-info/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
             <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-inner shrink-0 mt-1">
                <Users className="h-7 w-7" />
             </div>
             <div>
               <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent mb-1">
                 {t('queuePage.title')}
               </h1>
               <p className="text-sm md:text-base font-medium text-muted-foreground max-w-lg flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                  </span>
                  {t('queuePage.liveMonitor')} · {format(new Date(), 'EEEE, MMMM d, yyyy')}
               </p>
             </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              size="lg" 
              variant="outline" 
              className="rounded-xl border-info/20 bg-info/5 text-info hover:bg-info/10 transition-all font-bold"
              onClick={() => {
                const url = `${window.location.origin}/track`;
                navigator.clipboard.writeText(url);
                toast({ title: t('common.linkCopied', { defaultValue: 'Link Copied!' }), description: url });
              }}
            >
              <Wifi className="h-5 w-5 me-2" />
              {t('queuePage.shareLink', { defaultValue: 'Share Link' })}
            </Button>
            <PatientRegistrationDialog 
              onCreated={refetch} 
              trigger={
                <Button size="lg" variant="outline" className="rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold">
                  <UserPlus className="h-5 w-5 me-2" />
                  {t('queuePage.registerPatient')}
                </Button>
              }
            />
            <BookingDialog onCreated={refetch} />
          </div>
        </div>
      </div>

      {/* Current In-Clinic banner */}
      {inClinicNow && (
        <div className="relative overflow-hidden flex items-center gap-5 rounded-3xl border border-info/30 bg-info/10 px-6 py-5 shadow-[0_8px_30px_rgba(59,130,246,0.15)] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-info/0 via-info to-info/0 blur-sm opacity-50" />
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-info text-info-foreground font-bold shadow-inner shrink-0">
            <UserCheck className="h-8 w-8" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
            <p className="text-[11px] font-black text-info/80 uppercase tracking-widest mb-0.5 animate-pulse">{t('queuePage.status.IN_CLINIC')}</p>
            <p className="font-black tracking-tight text-xl text-foreground truncate">{(inClinicNow as any).patientName || 'Patient'}</p>
            <p className="text-sm font-bold text-muted-foreground mt-0.5">{t(`queuePage.visitTypes.${inClinicNow.visitType}`) || VISIT_TYPE_LABELS[inClinicNow.visitType]} <span className="opacity-50 mx-2">•</span> #{inClinicNow.queueNumber}</p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard label={t('queuePage.status.WAITING')} value={stats.waiting} icon={<Clock className="h-6 w-6 text-warning" />} accent="bg-warning/15 border-warning/20 text-warning" />
        <StatCard label={t('queuePage.status.IN_CLINIC')} value={stats.inClinic} icon={<UserCheck className="h-6 w-6 text-info" />} accent="bg-info/15 border-info/20 text-info" />
        <StatCard label={t('queuePage.status.COMPLETED')} value={stats.completed} icon={<CheckCircle2 className="h-6 w-6 text-success" />} accent="bg-success/15 border-success/20 text-success" />
        <StatCard label={t('queuePage.status.CANCELLED')} value={stats.cancelled} icon={<XCircle className="h-6 w-6 text-muted-foreground" />} accent="bg-muted/50 border-border/50 text-muted-foreground" />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap bg-muted/20 p-2 rounded-2xl border border-white/10 w-fit">
        {(['ALL', 'WAITING', 'IN_CLINIC', 'COMPLETED', 'CANCELLED'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-xl px-5 py-2 text-[13px] font-bold tracking-wide uppercase transition-all duration-300 ${filter === s
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105'
                : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
          >
            {s === 'ALL' ? `${t('queuePage.allStatus')} (${appointments.length})` :
              s === 'WAITING' ? `${t('queuePage.status.WAITING')} (${stats.waiting})` :
                s === 'IN_CLINIC' ? `${t('queuePage.status.IN_CLINIC')} (${stats.inClinic})` :
                  s === 'COMPLETED' ? `${t('queuePage.status.COMPLETED')} (${stats.completed})` :
                    `${t('queuePage.status.CANCELLED')} (${stats.cancelled})`}
          </button>
        ))}
      </div>

      {/* Queue list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl py-24 text-center flex flex-col items-center justify-center animate-fade-in mt-6 shadow-xl">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center mb-6 shadow-inner relative">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-20" />
            <Users className="h-12 w-12 text-primary opacity-80" />
          </div>
          <p className="text-2xl font-black text-foreground tracking-tight">{t('queuePage.noAppointments')}</p>
          <p className="text-base font-medium text-muted-foreground mt-2 max-w-sm">
            {filter === 'ALL' ? t('queuePage.noAppointmentsDesc') : t('queuePage.noMatchingAppointments')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((appt) => (
            <QueueRow
              key={appt.id}
              appt={appt}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
