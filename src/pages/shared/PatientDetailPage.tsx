import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import {
  doc, getDoc, collection, addDoc, deleteDoc,
  getDocs, query, where, orderBy, serverTimestamp, limit,
} from 'firebase/firestore';
import { Patient, MedicalHistory, DrugAllergy, Appointment, Visit, Prescription } from '@/types/clinic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft, User, Phone, MapPin, Heart, Plus, AlertTriangle,
  Calendar, FileText, Pill, Stethoscope, Trash2, ShieldAlert,
  ChevronDown, ChevronUp, Activity, Clock,
} from 'lucide-react';
import { differenceInYears, parseISO, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

// ─── Schemas ──────────────────────────────────────────────────────────────────

const historySchema = z.object({
  condition: z.string().min(2, 'Required'),
  type: z.enum(['CHRONIC_DISEASE', 'SURGERY']),
  dateRecorded: z.string().min(1, 'Required'),
  notes: z.string().optional(),
});
const allergySchema = z.object({
  drugName: z.string().min(2, 'Required'),
  severity: z.enum(['MILD', 'MODERATE', 'SEVERE']),
  reaction: z.string().min(2, 'Required'),
});
type HistoryForm = z.infer<typeof historySchema>;
type AllergyForm = z.infer<typeof allergySchema>;

// ─── Add history dialog ───────────────────────────────────────────────────────

function AddHistoryDialog({ patientId, onAdded }: { patientId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<HistoryForm>({ resolver: zodResolver(historySchema) });

  const mutation = useMutation({
    mutationFn: async (v: HistoryForm) => {
      await addDoc(collection(db, 'patients', patientId, 'history'), {
        ...v, createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => { toast({ title: `✅ ${t('patientProfile.medicalHistory')} ${t('patientProfile.addedSuccess', { defaultValue: 'added successfully' })}` }); setOpen(false); reset(); onAdded(); },
    onError: () => toast({ title: t('common.error', { defaultValue: 'Error' }), variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 me-1" />{t('common.add', { defaultValue: 'Add' })}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('common.add', { defaultValue: 'Add' })} {t('patientProfile.medicalHistory')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('patientProfile.condition', { defaultValue: 'Condition' })} *</Label>
            <Input placeholder={t('patientProfile.conditionPlaceholder', { defaultValue: 'e.g. Hypertension' })} {...register('condition')} />
            {errors.condition && <p className="text-xs text-destructive">{errors.condition.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('common.type', { defaultValue: 'Type' })} *</Label>
              <Controller name="type" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder={t('patientDialog.select')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHRONIC_DISEASE">{t('patientProfile.chronic')}</SelectItem>
                    <SelectItem value="SURGERY">{t('patientProfile.surgery')}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('common.date', { defaultValue: 'Date' })} *</Label>
              <Input type="date" {...register('dateRecorded')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>{t('workspace.vitals.notes')}</Label>
            <Textarea rows={3} placeholder={t('workspace.additionalNotesDesc')} {...register('notes')} />
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('settingsPage.clinic.savingBtn') : t('settingsPage.clinic.saveBtn')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Add allergy dialog ───────────────────────────────────────────────────────

function AddAllergyDialog({ patientId, onAdded }: { patientId: string; onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { register, handleSubmit, control, reset, formState: { errors, isSubmitting } } =
    useForm<AllergyForm>({ resolver: zodResolver(allergySchema) });

  const mutation = useMutation({
    mutationFn: async (v: AllergyForm) => {
      await addDoc(collection(db, 'patients', patientId, 'allergies'), {
        ...v, createdAt: serverTimestamp(),
      });
    },
    onSuccess: () => { toast({ title: `✅ ${t('patientProfile.allergies')} ${t('patientProfile.addedSuccess', { defaultValue: 'added successfully' })}` }); setOpen(false); reset(); onAdded(); },
    onError: () => toast({ title: t('common.error', { defaultValue: 'Error' }), variant: 'destructive' }),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline"><Plus className="h-4 w-4 me-1" />{t('common.add', { defaultValue: 'Add' })}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('common.add', { defaultValue: 'Add' })} {t('patientProfile.allergies')}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="space-y-1.5">
            <Label>{t('patientProfile.drugName', { defaultValue: 'Drug Name' })} *</Label>
            <Input placeholder={t('patientProfile.drugPlaceholder', { defaultValue: 'e.g. Penicillin, Aspirin' })} {...register('drugName')} />
            {errors.drugName && <p className="text-xs text-destructive">{errors.drugName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>{t('patientProfile.severity')} *</Label>
              <Controller name="severity" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger><SelectValue placeholder={t('patientDialog.select')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MILD">{t('patientDialog.mild', { defaultValue: 'Mild' })}</SelectItem>
                    <SelectItem value="MODERATE">{t('patientDialog.moderate', { defaultValue: 'Moderate' })}</SelectItem>
                    <SelectItem value="SEVERE">{t('patientDialog.severe', { defaultValue: 'Severe' })}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('patientProfile.reaction')} *</Label>
              <Input placeholder={t('patientProfile.reactionPlaceholder', { defaultValue: 'e.g. Rash, swelling' })} {...register('reaction')} />
              {errors.reaction && <p className="text-xs text-destructive">{errors.reaction.message}</p>}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('settingsPage.clinic.savingBtn') : t('settingsPage.clinic.saveBtn')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Visit detail card (expanded with clinical notes + prescription) ──────────

function VisitDetailCard({ visit }: { visit: Visit & { appointment?: Appointment; prescription?: Prescription } }) {
  const [expanded, setExpanded] = useState(false);
  const { t } = useTranslation();

  const statusColor = {
    COMPLETED: 'border-success/40 text-success bg-success/5',
    CANCELLED: 'border-muted text-muted-foreground bg-muted/30',
    ACTIVE: 'border-warning/40 text-warning bg-warning/5',
    WAITING: 'border-primary/40 text-primary bg-primary/5',
  }[visit.appointment?.status ?? 'WAITING'] ?? 'border-muted text-muted-foreground';

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm hover:shadow-md transition-all overflow-hidden glass-card">
      <button
        className={`w-full flex items-center gap-4 px-5 py-4 transition-colors text-start ${expanded ? 'bg-primary/5 border-b border-primary/10' : 'hover:bg-muted/40'}`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shrink-0 transition-colors ${expanded ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-primary/10 text-primary'}`}>
          <Stethoscope className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-foreground">
            {visit.appointment?.visitType
              ? t(`common.visitTypes.${visit.appointment.visitType}`, { defaultValue: visit.appointment.visitType.replace(/_/g, ' ') })
              : t('patientProfile.clinicalVisit', { defaultValue: 'Clinical Visit' })}
          </p>
          <p className="text-sm font-medium text-muted-foreground truncate mt-0.5">
            {visit.startedAt
              ? format(new Date(visit.startedAt), 'dd MMM yyyy · hh:mm a')
              : visit.appointment?.scheduledAt
                ? format(new Date(visit.appointment.scheduledAt), 'dd MMM yyyy · hh:mm a')
                : 'Unknown date'}
            {visit.chiefComplaint ? <span className="text-foreground/70"> · {visit.chiefComplaint}</span> : ''}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {visit.prescription && (
            <Badge variant="outline" className="text-xs font-bold bg-primary/10 text-primary border-primary/30 py-1">
              <Pill className="h-3.5 w-3.5 me-1" />{t('patientProfile.rxAttached')}
            </Badge>
          )}
          <Badge variant="outline" className={`text-xs font-bold py-1 ${statusColor}`}>
            {visit.appointment?.status ? t(`common.status.${visit.appointment.status.toLowerCase()}`, { defaultValue: visit.appointment.status }) : ''}
          </Badge>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted/50 text-muted-foreground">
             {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-6 pt-5 bg-gradient-to-b from-primary/5 to-transparent space-y-6">
          <div className="grid sm:grid-cols-2 gap-6 bg-card rounded-2xl p-5 border shadow-sm">
            {visit.chiefComplaint && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5"/> {t('workspace.chiefComplaint')}</p>
                <p className="text-sm font-medium text-foreground">{visit.chiefComplaint}</p>
              </div>
            )}
            {visit.diagnosis && (
              <div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><Heart className="h-3.5 w-3.5"/> {t('workspace.diagnosis')}</p>
                <p className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg inline-block">{visit.diagnosis}</p>
              </div>
            )}
            {visit.notes && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5"/> {t('workspace.clinicalNotes')}</p>
                <p className="text-sm text-foreground/80 leading-relaxed bg-muted/30 p-4 rounded-xl border border-border/50">{visit.notes}</p>
              </div>
            )}
            {visit.vitalSigns && Object.keys(visit.vitalSigns).length > 0 && (
              <div className="sm:col-span-2">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2 flex items-center gap-1.5"><Activity className="h-3.5 w-3.5" /> {t('workspace.vitalsTab')}</p>
                <div className="flex flex-wrap gap-2">
                  {visit.vitalSigns.bp && (
                    <span className="rounded-xl bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                      {t('workspace.vitals.bloodPressure', { defaultValue: 'BP' })}: {visit.vitalSigns.bp}
                    </span>
                  )}
                  {visit.vitalSigns.heartRate && (
                    <span className="rounded-xl bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                      {t('workspace.vitals.pulse')}: {visit.vitalSigns.heartRate} {t('trackPage.minsApx', { defaultValue: 'bpm' })}
                    </span>
                  )}
                  {visit.vitalSigns.temperature && (
                    <span className="rounded-xl bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                      {t('workspace.vitals.temp', { defaultValue: 'Temp' })}: {visit.vitalSigns.temperature}°C
                    </span>
                  )}
                  {visit.vitalSigns.weight && (
                    <span className="rounded-xl bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                      {t('workspace.vitals.weight')}: {visit.vitalSigns.weight} {t('common.kg', { defaultValue: 'kg' })}
                    </span>
                  )}
                  {visit.vitalSigns.o2Sat && (
                    <span className="rounded-xl bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-1.5 text-xs font-bold shadow-sm">
                      O₂: {visit.vitalSigns.o2Sat}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {visit.prescription?.items && visit.prescription.items.length > 0 && (
            <div className="bg-card rounded-2xl p-5 border shadow-sm border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Pill className="h-4 w-4" />
                </div>
                <p className="text-sm font-bold text-primary uppercase tracking-widest">{t('patientProfile.rxDraft')}</p>
              </div>
              <div className="grid gap-2">
                {visit.prescription.items.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm rounded-xl bg-muted/30 border border-border/50 px-4 py-3 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-background text-xs font-bold text-muted-foreground shadow-sm">{i + 1}</span>
                      <span className="font-bold text-foreground">{item.drugName} <span className="text-muted-foreground font-medium">{item.concentration}</span></span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-muted-foreground ms-8 sm:ms-0">
                      <Badge variant="secondary" className="bg-background">{item.dose}</Badge>
                      <Badge variant="secondary" className="bg-background">{item.frequency}</Badge>
                      <Badge variant="secondary" className="bg-background">{item.duration}</Badge>
                    </div>
                    {item.customNotes && (
                      <span className="text-xs text-muted-foreground ms-8 sm:ms-auto italic bg-background px-2 py-1 rounded-md border text-center sm:text-end">
                        {t('patientProfile.note')}: {item.customNotes}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {visit.prescription.notes && (
                <div className="mt-4 p-3 bg-warning/5 rounded-xl border border-warning/20">
                   <p className="text-xs font-bold text-warning mb-1">{t('patientProfile.doctorNote')}:</p>
                   <p className="text-sm text-foreground/80 italic">{visit.prescription.notes}</p>
                </div>
              )}
            </div>
          )}

          {/* No clinical details */}
          {!visit.chiefComplaint && !visit.diagnosis && !visit.notes && !visit.prescription && (
            <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed rounded-2xl bg-muted/20">
              <Stethoscope className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm font-medium text-muted-foreground">{t('patientProfile.noVisitNotes')}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Patient, history, allergies
  const { data: patient, isLoading } = useQuery<Patient>({
    queryKey: ['patient', id],
    queryFn: async () => {
      if (!id) throw new Error('No patient ID');
      const snap = await getDoc(doc(db, 'patients', id));
      if (!snap.exists()) throw new Error('Patient not found');

      const [histSnap, algSnap] = await Promise.all([
        getDocs(query(collection(db, 'patients', id, 'history'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'patients', id, 'allergies'), orderBy('createdAt', 'desc'))),
      ]);
      return {
        id: snap.id,
        ...snap.data(),
        medicalHistory: histSnap.docs.map(h => ({ id: h.id, ...h.data() })) as MedicalHistory[],
        drugAllergies: algSnap.docs.map(a => ({ id: a.id, ...a.data() })) as DrugAllergy[],
      } as Patient;
    },
    enabled: !!id,
  });

  // Full visit history — from visits collection enriched with appointments + prescriptions
  const { data: visitHistory, isLoading: visitsLoading } = useQuery({
    queryKey: ['patient-visits-full', id],
    queryFn: async () => {
      if (!id) return [];

      try {
        // Fetch visits for this patient (from visits collection)
        // NOTE: We omit 'orderBy' here to avoid requiring a composite index. We'll sort via JS.
        const visitsSnap = await getDocs(query(
          collection(db, 'visits'),
          where('patientId', '==', id)
        ));

        // Fetch appointments for context
        // NOTE: Omit 'orderBy' to avoid composite index requirement.
        const apptSnap = await getDocs(query(
          collection(db, 'appointments'),
          where('patientId', '==', id)
        ));
        const apptMap = new Map(apptSnap.docs.map(d => [d.id, { id: d.id, ...d.data() }]));

        // Fetch prescriptions for each visit in parallel
        const visits = await Promise.all(
          visitsSnap.docs.map(async (d) => {
            const visit = { id: d.id, ...d.data() } as Visit;
            const rxSnap = await getDocs(query(
              collection(db, 'prescriptions'),
              where('visitId', '==', d.id),
              limit(1),
            ));
            const prescription = rxSnap.docs[0]
              ? ({ id: rxSnap.docs[0].id, ...rxSnap.docs[0].data() } as Prescription)
              : undefined;
            const appointment = apptMap.get(visit.appointmentId) as Appointment | undefined;
            return { ...visit, prescription, appointment };
          })
        );

        // Sort visits client-side by startedAt descending
        visits.sort((a, b) => {
          const tA = a.startedAt || '';
          const tB = b.startedAt || '';
          return tB.localeCompare(tA);
        });

        // If no visits in visits collection, fall back to appointments list
        if (visits.length === 0) {
          const appts = apptSnap.docs.map(d => ({
            id: d.id,
            patientId: id,
            appointmentId: d.id,
            appointment: { id: d.id, ...d.data() } as Appointment,
            startedAt: d.data().scheduledAt || '',
          } as Visit & { appointment: Appointment }));

          appts.sort((a, b) => {
            const tA = (a.startedAt as string) || '';
            const tB = (b.startedAt as string) || '';
            return tB.localeCompare(tA);
          });
          return appts;
        }

        return visits;
      } catch (err) {
        console.error("Error fetching patient visit history:", err);
        toast({ title: "Error", description: "Could not load full patient history.", variant: "destructive" });
        return [];
      }
    },
    enabled: !!id,
  });

  // Delete allergy
  const deleteAllergyMutation = useMutation({
    mutationFn: async (allergyId: string) => {
      await deleteDoc(doc(db, 'patients', id!, 'allergies', allergyId));
    },
    onSuccess: () => {
      toast({ title: `✅ ${t('patientProfile.allergies')} ${t('common.deleted', { defaultValue: 'removed' })}` });
      invalidate();
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  // Delete medical history
  const deleteHistoryMutation = useMutation({
    mutationFn: async (histId: string) => {
      await deleteDoc(doc(db, 'patients', id!, 'history', histId));
    },
    onSuccess: () => {
      toast({ title: `✅ ${t('patientProfile.medicalHistory')} ${t('common.deleted', { defaultValue: 'removed' })}` });
      invalidate();
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['patient', id] });

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-xl" /></div>;

  if (!patient) return (
    <div className="flex flex-col items-center py-20 text-center">
      <User className="h-12 w-12 text-muted-foreground/30 mb-3" />
      <p className="text-muted-foreground font-medium">{t('patientProfile.notFound', { defaultValue: 'Patient not found' })}</p>
      <Button variant="ghost" size="sm" className="mt-4" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 me-2" />{t('common.back')}
      </Button>
    </div>
  );

  const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth));
  const initials = patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="-ms-2 mb-3">
          <ArrowLeft className="h-4 w-4 me-2" />{t('common.back')}
        </Button>

        {/* Patient hero */}
        <div className="glass-card rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-md group">
          <div className="absolute top-0 end-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full mix-blend-multiply filter blur-3xl opacity-70 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="relative z-10 flex items-start gap-6 flex-wrap">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info text-white text-3xl font-black shadow-lg ring-4 ring-primary/20">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground">{patient.fullName}</h1>
                <Badge variant="outline" className="text-sm font-mono text-primary border-border bg-muted/50 rounded-lg">
                  {patient.patientId}
                </Badge>
                {patient.drugAllergies && patient.drugAllergies.length > 0 && (
                  <Badge variant="outline" className="text-xs border-destructive text-destructive bg-destructive/10 rounded-lg animate-pulse py-1">
                    <ShieldAlert className="h-3.5 w-3.5 me-1" />
                    {patient.drugAllergies.length} {t('patientProfile.allergies')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-5 text-sm text-muted-foreground flex-wrap font-medium">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" />
                  {age} {t('patientProfile.years')} · {patient.gender === 'MALE' ? t('patientProfile.male') : t('patientProfile.female')}
                </span>
                {patient.bloodType && (
                  <Badge variant="secondary" className="text-xs font-bold bg-rose-100 text-rose-700 hover:bg-rose-200">
                    <Heart className="h-3 w-3 me-1" />
                    {patient.bloodType}
                  </Badge>
                )}
                <span className="flex items-center gap-1.5">
                  <Phone className="h-4 w-4" />{patient.phone}
                </span>
                {patient.address && (
                  <span className="flex items-center gap-1.5 truncate max-w-sm">
                    <MapPin className="h-4 w-4 shrink-0" />{patient.address}
                  </span>
                )}
              </div>
            </div>
            {/* Quick stats */}
            <div className="flex gap-6 flex-wrap bg-background/50 rounded-2xl p-4 border border-border/50 shadow-inner">
              <div className="text-center">
                <p className="text-2xl font-black text-primary">{visitHistory?.length ?? '-'}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('patientProfile.visits')}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-black text-warning">{patient.drugAllergies?.length ?? 0}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('patientProfile.allergies')}</p>
              </div>
              <Separator orientation="vertical" className="h-10" />
              <div className="text-center">
                <p className="text-2xl font-black text-success">{patient.medicalHistory?.length ?? 0}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t('patientProfile.conditions')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full h-14 bg-muted/50 p-1 rounded-2xl overflow-x-auto flex justify-start sm:justify-center no-scrollbar">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all px-6 whitespace-nowrap">{t('patientProfile.overview')}</TabsTrigger>
          <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all px-6 whitespace-nowrap">
            {t('patientProfile.medicalHistory')}
            {patient.medicalHistory?.length ? (
              <span className="ms-2 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-black">
                {patient.medicalHistory.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="allergies" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all px-6 whitespace-nowrap">
            {t('patientProfile.allergies')}
            {patient.drugAllergies?.length ? (
              <span className="ms-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white text-xs font-black animate-pulse">
                {patient.drugAllergies.length}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="visits" className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm text-sm font-bold transition-all px-6 whitespace-nowrap">
            {t('patientProfile.visitHistory')}
            {visitHistory?.length ? (
              <span className="ms-2 rounded-full bg-primary/20 text-primary px-2 py-0.5 text-xs font-black">
                {visitHistory.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-6 mt-6 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-6">
            <Card className="rounded-3xl border-border/50 shadow-sm glass-card">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20"><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('patientProfile.personalInfo')}</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-5 text-sm">
                {[
                  [t('patientProfile.dob'), format(parseISO(patient.dateOfBirth), 'dd MMM yyyy')],
                  [t('patientProfile.age'), `${age} ${t('patientProfile.years')}`],
                  [t('patientProfile.gender'), patient.gender === 'MALE' ? t('patientProfile.male') : t('patientProfile.female')],
                  [t('patientProfile.bloodType'), patient.bloodType ?? '—'],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center border-b border-border/30 last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground/80 font-medium">{label}</span>
                    <span className="font-bold text-foreground">{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-border/50 shadow-sm glass-card">
              <CardHeader className="pb-3 border-b border-border/50 bg-muted/20"><CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t('patientProfile.contactReg')}</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-5 text-sm">
                {[
                  [t('patientProfile.phone'), patient.phone],
                  [t('patientProfile.address'), patient.address || '—'],
                  [t('patientProfile.registered'), (patient.createdAt as any)?.toDate ? format((patient.createdAt as any).toDate(), 'dd MMM yyyy') : typeof patient.createdAt === 'string' && patient.createdAt ? format(parseISO(patient.createdAt), 'dd MMM yyyy') : '—'],
                  [t('patientProfile.patientId'), patient.patientId],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center gap-4 border-b border-border/30 last:border-0 pb-2 last:pb-0">
                    <span className="text-muted-foreground/80 font-medium">{label}</span>
                    <span className={`font-bold text-end truncate text-foreground ${label === t('patientProfile.patientId') ? 'px-2 py-0.5 bg-primary/10 text-primary rounded-md tracking-wider' : ''}`}>{val}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Drug allergy alert */}
          {patient.drugAllergies && patient.drugAllergies.length > 0 && (
            <div className="flex items-start gap-4 rounded-2xl border-2 border-destructive/40 bg-gradient-to-r from-destructive/10 to-transparent p-5 animate-pulse-glow hover:shadow-md transition-shadow">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive text-white shadow-lg shadow-destructive/20">
                 <ShieldAlert className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-destructive tracking-tight">{t('patientProfile.caution')}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {patient.drugAllergies.map((a) => (
                    <Badge key={a.id} variant="outline" className={`text-xs py-1 px-3 ${a.severity === 'SEVERE'
                      ? 'border-destructive text-destructive bg-destructive/10'
                      : a.severity === 'MODERATE'
                         ? 'border-orange-400 text-orange-600 bg-orange-50'
                         : 'border-yellow-400 text-yellow-700 bg-yellow-50'
                      }`}>
                      <span className="font-black me-1">{a.drugName}</span> · {t(`patientDialog.${a.severity.toLowerCase()}`, { defaultValue: a.severity })}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── Medical History ── */}
        <TabsContent value="history" className="mt-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
            <h3 className="font-black text-lg">{t('patientProfile.medicalHistory')}</h3>
            <AddHistoryDialog patientId={patient.id} onAdded={invalidate} />
          </div>
          {!patient.medicalHistory?.length ? (
            <div className="flex flex-col items-center py-16 text-center glass-card rounded-3xl border-dashed">
              <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <Activity className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-foreground text-base font-bold">{t('patientProfile.noConditions', { defaultValue: 'No medical history recorded' })}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t('patientProfile.noConditionsDesc', { defaultValue: 'Add chronic diseases, surgeries, or past conditions to keep the patient\'s record up to date.' })}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {patient.medicalHistory.map((h) => (
                <div key={h.id} className="relative group rounded-2xl border border-border/50 bg-card p-5 shadow-sm hover:shadow-md transition-shadow glass-card overflow-hidden">
                  <div className={`absolute top-0 end-0 w-2 h-full ${h.type === 'SURGERY' ? 'bg-destructive/60' : 'bg-primary/60'}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 pe-4">
                      <p className="font-bold text-base text-foreground mb-1">{h.condition}</p>
                      {h.notes && <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{h.notes}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${h.type === 'SURGERY' ? 'text-destructive border-destructive/30' : 'text-primary border-primary/30'}`}>
                          {h.type === 'CHRONIC_DISEASE' ? t('patientProfile.chronic', { defaultValue: 'Chronic Disease' }) : t('patientProfile.surgery', { defaultValue: 'Surgery' })}
                        </Badge>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('common.deleteConfirm', { defaultValue: 'Delete history entry?' })}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t('common.deleteDesc', { defaultValue: 'This will permanently remove "{{name}}" from the patient\'s medical history.', name: h.condition })}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('common.cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive hover:bg-destructive/90"
                                onClick={() => deleteHistoryMutation.mutate(h.id)}
                              >
                                {t('common.delete', { defaultValue: 'Delete' })}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {format(parseISO(h.dateRecorded), 'MMM yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Allergies ── */}
        <TabsContent value="allergies" className="mt-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
            <h3 className="font-black text-lg">{t('patientProfile.allergies')}</h3>
            <AddAllergyDialog patientId={patient.id} onAdded={invalidate} />
          </div>
          {!patient.drugAllergies?.length ? (
            <div className="flex flex-col items-center py-16 text-center glass-card rounded-3xl border-dashed">
              <div className="h-16 w-16 bg-muted/30 rounded-full flex items-center justify-center mb-4">
                <ShieldAlert className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <p className="text-foreground text-base font-bold">{t('patientProfile.noAllergies', { defaultValue: 'No known drug allergies' })}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">{t('patientProfile.noAllergiesDesc', { defaultValue: 'Add any drug allergies to prevent prescription errors and maintain safety.' })}</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {patient.drugAllergies.map((a) => (
                <div
                  key={a.id}
                  className={`group relative flex items-start gap-4 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all ${a.severity === 'SEVERE'
                    ? 'border-destructive/40 bg-gradient-to-br from-destructive/10 to-transparent'
                    : a.severity === 'MODERATE'
                      ? 'border-orange-300/50 bg-gradient-to-br from-orange-500/10 to-transparent'
                      : 'border-yellow-300/50 bg-gradient-to-br from-yellow-500/10 to-transparent'
                    }`}
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-inner ${a.severity === 'SEVERE' ? 'bg-destructive/20 text-destructive' : a.severity === 'MODERATE' ? 'bg-orange-500/20 text-orange-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 pe-2">
                    <p className="font-bold text-base text-foreground">{a.drugName}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{t('patientProfile.reaction')}: {a.reaction}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase font-bold tracking-widest ${a.severity === 'SEVERE'
                        ? 'border-destructive text-destructive'
                        : a.severity === 'MODERATE'
                          ? 'border-orange-500 text-orange-600'
                          : 'border-yellow-500 text-yellow-700'
                        }`}
                    >
                      {t(`patientDialog.${a.severity.toLowerCase()}`, { defaultValue: a.severity })}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('common.deleteConfirm')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('common.deleteDesc', { name: a.drugName })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteAllergyMutation.mutate(a.id)}
                            className="bg-destructive text-white hover:bg-destructive/90"
                          >
                            {t('common.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── Visit History ── */}
        <TabsContent value="visits" className="mt-6 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between bg-muted/20 p-4 rounded-2xl border border-border/50">
            <h3 className="font-black text-lg">{t('patientProfile.visitHistory')}</h3>
            {visitHistory?.length ? (
              <Badge variant="outline" className="text-xs bg-background/50 border-border">
                {visitHistory.length} {t('patientProfile.visits')}
              </Badge>
            ) : null}
          </div>

          {visitsLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : !visitHistory?.length ? (
            <div className="flex flex-col items-center py-12 text-center">
              <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm font-medium">{t('patientProfile.noVisitsRecorded')}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">{t('patientProfile.noVisitsRecordedDesc')}</p>
            </div>
          ) : (
            visitHistory.map((v) => (
              <VisitDetailCard key={v.id} visit={v as any} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
