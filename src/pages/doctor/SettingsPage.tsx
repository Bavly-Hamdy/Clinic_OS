import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { ClinicSettings, VisitType } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Settings, Save, Upload, DollarSign, Users, Plus,
  Trash2, UserCog, Building2, Printer, ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';

import { useTranslation } from 'react-i18next';

// ─── Visit type labels + defaults ─────────────────────────────────────────────

const VISIT_TYPES: VisitType[] = [
  'NEW_EXAM', 'CONSULTATION_FREE', 'CONSULTATION_PAID', 'URGENT', 'SONAR', 'ECG',
];
const VISIT_LABELS: Record<VisitType, string> = {
  NEW_EXAM: 'New Examination',
  CONSULTATION_FREE: 'Free Consultation',
  CONSULTATION_PAID: 'Paid Consultation',
  URGENT: 'Urgent Visit',
  SONAR: 'Sonar / Ultrasound',
  ECG: 'ECG',
};
const DEFAULT_PRICES: Record<VisitType, number> = {
  NEW_EXAM: 200,
  CONSULTATION_FREE: 0,
  CONSULTATION_PAID: 150,
  URGENT: 300,
  SONAR: 250,
  ECG: 100,
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  clinicName: z.string().min(2, 'Required'),
  doctorName: z.string().min(2, 'Required'),
  doctorTitle: z.string().min(2, 'Required'),
  specialty: z.string().min(2, 'Required'),
  address: z.string().min(5, 'Required'),
  phone: z.string().min(7, 'Required'),
  workingHours: z.string().min(3, 'Required'),
  defaultPrintSize: z.enum(['A4', 'A5']),
});
type SettingsForm = z.infer<typeof settingsSchema>;

const staffSchema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type StaffForm = z.infer<typeof staffSchema>;

// ─── Add staff dialog ─────────────────────────────────────────────────────────

function AddStaffDialog({ onAdded }: { onAdded: () => void }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } =
    useForm<StaffForm>({ resolver: zodResolver(staffSchema) });

  const onSubmit = async (v: StaffForm) => {
    try {
      // Create Firebase Auth account using a secondary app instance to avoid logging out the doctor
      const secondaryApp = initializeApp(auth.app.options, 'SecondaryApp');
      const secondaryAuth = getAuth(secondaryApp);
      
      const cred = await createUserWithEmailAndPassword(secondaryAuth, v.email, v.password);
      await updateProfile(cred.user, { displayName: v.fullName });

      // Store staff record in Firestore (STRICTLY role = RECEPTIONIST)
      await addDoc(collection(db, 'staff'), {
        uid: cred.user.uid,
        doctorId: auth.currentUser?.uid,
        fullName: v.fullName,
        email: v.email,
        role: 'RECEPTIONIST',
        isActive: true,
        createdAt: new Date().toISOString(),
      });

      // Also create the user document (STRICTLY role = RECEPTIONIST)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: v.email,
        fullName: v.fullName,
        role: 'RECEPTIONIST',
        doctorId: auth.currentUser?.uid,
        isActive: true,
        createdAt: new Date().toISOString()
      });

      // Sign out and delete the secondary app instance
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);

      toast({ title: '✅ Receptionist account created' });
      setOpen(false);
      reset();
      onAdded();
    } catch (err: any) {
      console.error(err);
      const msg = err?.code === 'auth/email-already-in-use'
        ? 'Email is already in use'
        : 'Error creating account';
      toast({ title: msg, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 font-bold tracking-wide transition-all">
          <Plus className="h-4 w-4 me-2" />{t('settingsPage.staff.addStaffBtn')}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md border-white/20 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl overflow-hidden p-0" aria-describedby={undefined}>
        <DialogHeader className="p-6 pb-0 border-b border-border/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-black pb-4">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                <UserCog className="h-5 w-5" />
             </div>
             {t('settingsPage.staff.newAccount')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6 bg-muted/10">
          <div className="space-y-2 group">
            <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.staff.fullName')} <span className="text-destructive">*</span></Label>
            <Input 
               placeholder="e.g. Sara Mohamed" 
               className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all font-semibold rounded-xl"
               {...register('fullName')} 
            />
            {errors.fullName && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.fullName.message}</p>}
          </div>
          <div className="space-y-2 group">
            <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.staff.email')} <span className="text-destructive">*</span></Label>
            <Input 
               type="email" 
               placeholder="sara@clinic.com" 
               className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all font-semibold rounded-xl"
               {...register('email')} 
            />
            {errors.email && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.email.message}</p>}
          </div>
          <div className="space-y-2 group">
            <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.staff.password')} <span className="text-destructive">*</span></Label>
            <Input 
               type="password" 
               placeholder="Min 8 characters" 
               className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all font-semibold rounded-xl"
               {...register('password')} 
            />
            {errors.password && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.password.message}</p>}
          </div>
          <div className="pt-2">
             <Button type="submit" className="w-full h-12 rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" disabled={isSubmitting}>
               {isSubmitting ? t('settingsPage.staff.provisioningBtn') : t('settingsPage.staff.createBtn')}
             </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Staff tab ────────────────────────────────────────────────────────────────

function StaffTab() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'staff'), where('doctorId', '==', auth.currentUser.uid));
      const snap = await getDocs(q);
      setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'staff', id));
      toast({ title: '✅ Staff record removed' });
      load();
    } catch {
      toast({ title: 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/20 p-5 rounded-2xl border border-border/50">
        <div>
          <h3 className="font-black text-lg tracking-tight flex items-center gap-2">
             <Users className="h-5 w-5 text-primary" />
             {t('settingsPage.staff.title')}
          </h3>
          <p className="text-sm font-medium text-muted-foreground mt-1">{t('settingsPage.staff.description')}</p>
        </div>
        <AddStaffDialog onAdded={load} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
        </div>
      ) : staff.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center rounded-3xl border border-dashed border-border/50 bg-muted/10">
          <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
             <Users className="h-8 w-8 text-muted-foreground/30" />
          </div>
          <p className="font-bold text-foreground">{t('settingsPage.staff.noAccounts')}</p>
          <p className="text-muted-foreground text-sm font-medium mt-1 max-w-[250px]">{t('settingsPage.staff.grantAccess')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {staff.map(s => (
            <div key={s.id} className="group flex items-center gap-4 rounded-2xl border border-white/20 bg-background/60 dark:bg-black/40 backdrop-blur-md px-5 py-4 hover:shadow-lg transition-all duration-300">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-black text-lg shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                {s.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold truncate">{s.fullName}</p>
                <p className="text-sm font-medium text-muted-foreground truncate">{s.email}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary py-1 px-2.5 shadow-sm bg-primary/5 uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 me-1.5" />{s.role === 'RECEPTIONIST' ? t('common.receptionist') : s.role}
                </Badge>
                {s.createdAt && (
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 hidden md:block">
                    {t('settingsPage.staff.addedDate', { date: format(new Date(s.createdAt), 'dd MMM yyyy') })}
                  </span>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="border-white/20 bg-background/95 backdrop-blur-xl shadow-2xl rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-black text-xl flex items-center gap-2">
                         <div className="h-8 w-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                            <Trash2 className="h-4 w-4" />
                         </div>
                         {t('settingsPage.staff.revokeAccess')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="font-medium text-base pt-2">
                        {t('settingsPage.staff.removeConfirm').replace('{{name}}', s.fullName)}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                      <AlertDialogCancel className="rounded-xl font-bold border-border/50 hover:bg-muted/50">{t('settingsPage.staff.keepBtn')}</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg shadow-destructive/20"
                        onClick={() => deactivate(s.id)}
                      >
                        {t('settingsPage.staff.removeBtn')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ClinicSettingsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [pricing, setPricing] = useState<Partial<Record<VisitType, number>>>(DEFAULT_PRICES);

  const SETTINGS_DOC = doc(db, 'clinic_settings', 'main');

  const { data, isLoading } = useQuery<ClinicSettings>({
    queryKey: ['clinic-settings'],
    queryFn: async () => {
      const snap = await getDoc(SETTINGS_DOC);
      if (snap.exists()) return snap.data() as ClinicSettings;
      return null as unknown as ClinicSettings;
    },
  });

  const {
    register, handleSubmit, control, reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<SettingsForm>({ resolver: zodResolver(settingsSchema) });

  useEffect(() => {
    if (data) {
      reset({ ...data });
      if (data.pricing) setPricing({ ...DEFAULT_PRICES, ...data.pricing });
      if (data.logoBase64) setLogoPreview(data.logoBase64);
    }
  }, [data, reset]);

  // Handle logo file selection → convert to base64
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 100 * 1024) {
      toast({ title: t('settingsPage.print.logoTooLarge'), description: t('settingsPage.print.logoSizeDesc'), variant: 'destructive' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Save clinic info + pricing + logo together
  const mutation = useMutation({
    mutationFn: async (v: SettingsForm) => {
      await setDoc(SETTINGS_DOC, {
        ...v,
        pricing,
        logoBase64: logoPreview ?? data?.logoBase64 ?? null,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    },
    onSuccess: () => {
      toast({ title: '✅ Settings saved' });
      queryClient.invalidateQueries({ queryKey: ['clinic-settings'] });
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error saving settings', variant: 'destructive' });
    },
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in pb-10 max-w-4xl mx-auto">
      {/* Header & Controls Container */}
      <div className="relative glass-panel rounded-3xl p-6 md:p-8 flex flex-col gap-6 overflow-hidden border border-white/20">
        <div className="absolute -top-24 -end-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute -bottom-24 -start-24 w-64 h-64 bg-info/20 rounded-full blur-3xl opacity-50 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
             <div className="hidden sm:flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary border border-primary/20 shadow-inner shrink-0 mt-1">
                <Settings className="h-7 w-7" />
             </div>
             <div>
               <h1 className="text-3xl md:text-4xl font-black tracking-tight bg-gradient-to-r from-primary to-info bg-clip-text text-transparent mb-1">
                 {t('settingsPage.title')}
               </h1>
               <p className="text-sm md:text-base font-medium text-muted-foreground max-w-lg">
                  {t('settingsPage.description')}
               </p>
             </div>
          </div>
          
          {data?.updatedAt && (
            <div className="flex flex-col items-end gap-1 bg-muted/30 px-4 py-2 rounded-xl border border-border/50 shrink-0">
               <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80">{t('settingsPage.lastSynchronized')}</span>
               <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                 <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
                 {format(new Date(data.updatedAt), 'dd MMM yyyy, HH:mm')}
               </span>
            </div>
          )}
        </div>
      </div>

      <Tabs defaultValue="clinic" className="space-y-6">
        <div className="relative">
          <div className="absolute inset-x-0 bottom-0 h-px bg-border/50" />
          <TabsList className="relative h-auto p-0 bg-transparent flex flex-wrap gap-2 w-full justify-start overflow-visible border-none bg-none shadow-none">
            {[
               { id: 'clinic', label: t('settingsPage.tabs.clinicInfo'), icon: Building2 },
               { id: 'pricing', label: t('settingsPage.tabs.pricing'), icon: DollarSign },
               { id: 'staff', label: t('settingsPage.tabs.staffAccts'), icon: Users },
               { id: 'print', label: t('settingsPage.tabs.printPdf'), icon: Printer },
            ].map((tab) => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="relative pb-3 pt-2 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all font-semibold rounded-t-lg"
              >
                <tab.icon className="h-4 w-4 me-2" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* ── Clinic Info tab ── */}
        <TabsContent value="clinic" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
              <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-10 bg-muted/20">
                 <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Building2 className="h-5 w-5" />
                 </div>
                 <div>
                   <h2 className="text-lg font-black tracking-tight text-foreground">{t('settingsPage.clinic.identity')}</h2>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('settingsPage.clinic.coreDetails')}</p>
                 </div>
              </div>
              <div className="p-6 md:p-8 space-y-6 relative z-10">
                <div className="space-y-2 group">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.clinicName')} <span className="text-destructive">*</span></Label>
                  <Input 
                     placeholder={t('settingsPage.clinic.clinicPlaceholder')} 
                     className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                     {...register('clinicName')} 
                  />
                  {errors.clinicName && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.clinicName.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.doctorName')} <span className="text-destructive">*</span></Label>
                    <Input 
                       placeholder={t('settingsPage.clinic.doctorPlaceholder')} 
                       className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                       {...register('doctorName')} 
                    />
                    {errors.doctorName && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.doctorName.message}</p>}
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.doctorTitle')} <span className="text-destructive">*</span></Label>
                    <Input 
                       placeholder={t('settingsPage.clinic.titlePlaceholder')} 
                       className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                       {...register('doctorTitle')} 
                    />
                    {errors.doctorTitle && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.doctorTitle.message}</p>}
                  </div>
                </div>
                
                <div className="space-y-2 group">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.specialty')} <span className="text-destructive">*</span></Label>
                  <Input 
                     placeholder={t('settingsPage.clinic.specialtyPlaceholder')} 
                     className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                     {...register('specialty')} 
                  />
                  {errors.specialty && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.specialty.message}</p>}
                </div>
                
                <div className="space-y-2 group">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.address')} <span className="text-destructive">*</span></Label>
                  <Textarea 
                     rows={3} 
                     placeholder={t('settingsPage.clinic.addressPlaceholder')} 
                     className="resize-none bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl py-3"
                     {...register('address')} 
                  />
                  {errors.address && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.address.message}</p>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 group">
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.phone')} <span className="text-destructive">*</span></Label>
                    <Input 
                       placeholder={t('settingsPage.clinic.phonePlaceholder')} 
                       className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                       {...register('phone')} 
                    />
                    {errors.phone && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.phone.message}</p>}
                  </div>
                  <div className="space-y-2 group">
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.clinic.workingHours')} <span className="text-destructive">*</span></Label>
                    <Input 
                       placeholder={t('settingsPage.clinic.hoursPlaceholder')} 
                       className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 transition-all text-base font-semibold group-hover:border-primary/40 rounded-xl"
                       {...register('workingHours')} 
                    />
                    {errors.workingHours && <p className="text-xs font-bold text-destructive animate-fade-in">{errors.workingHours.message}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
               <Button 
                 type="submit" 
                 disabled={isSubmitting || !isDirty}
                 size="lg"
                 className="rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto"
               >
                 <Save className="h-5 w-5 me-2" />
                 {isSubmitting ? t('settingsPage.clinic.savingBtn') : t('settingsPage.clinic.saveBtn')}
               </Button>
            </div>
          </form>
        </TabsContent>

        {/* ── Pricing tab ── */}
        <TabsContent value="pricing" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
            <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-10 bg-muted/20">
               <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-success/10 text-success shrink-0">
                  <DollarSign className="h-5 w-5" />
               </div>
               <div>
                 <h2 className="text-lg font-black tracking-tight text-foreground">{t('settingsPage.pricingTab.title')}</h2>
                 <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('settingsPage.pricingTab.description')}</p>
               </div>
            </div>
            <div className="p-6 md:p-8 space-y-4 relative z-10">
              {VISIT_TYPES.map((type) => (
                <div key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-background/60 border border-border/50 hover:bg-muted/30 transition-colors group">
                  <div className="flex-1">
                    <p className="text-base font-bold text-foreground/90 group-hover:text-foreground transition-colors">
                      {t(`common.visitTypes.${type}`) || VISIT_LABELS[type]}
                    </p>
                    <p className="text-[10px] font-black uppercase text-muted-foreground/60 tracking-widest mt-0.5">{type.replace('_', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full sm:w-56 bg-muted/20 p-2 rounded-xl border border-border/50 focus-within:ring-2 ring-primary/20 transition-all">
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-wider ps-2 shrink-0">{t('common.egp')}</span>
                    <Input
                      type="number"
                      min={0}
                      step={5}
                      value={pricing[type] ?? 0}
                      onChange={(e) =>
                        setPricing((prev) => ({ ...prev, [type]: Number(e.target.value) }))
                      }
                      className="text-end font-black text-lg h-10 bg-transparent border-none focus-visible:ring-0 shadow-none px-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button
              size="lg"
              className="rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto"
              onClick={() => mutation.mutate({
                clinicName: data?.clinicName ?? '',
                doctorName: data?.doctorName ?? '',
                doctorTitle: data?.doctorTitle ?? '',
                specialty: data?.specialty ?? '',
                address: data?.address ?? '',
                phone: data?.phone ?? '',
                workingHours: data?.workingHours ?? '',
                defaultPrintSize: data?.defaultPrintSize ?? 'A4',
              })}
              disabled={mutation.isPending}
            >
              <Save className="h-5 w-5 me-2" />
              {mutation.isPending ? t('settingsPage.pricingTab.syncingBtn') : t('settingsPage.pricingTab.syncBtn')}
            </Button>
          </div>
        </TabsContent>

        {/* ── Staff tab ── */}
        <TabsContent value="staff" className="mt-4">
          <StaffTab />
        </TabsContent>

        {/* ── Print settings tab ── */}
        <TabsContent value="print" className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-4 duration-500">
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
            <div className="rounded-3xl border border-white/20 bg-background/50 dark:bg-black/40 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden relative">
              <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-10 bg-muted/20">
                 <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-info/10 text-info shrink-0">
                    <Printer className="h-5 w-5" />
                 </div>
               <div>
                   <h2 className="text-lg font-black tracking-tight text-foreground">{t('settingsPage.print.title')}</h2>
                   <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-0.5">{t('settingsPage.print.description')}</p>
                 </div>
              </div>
              
              <div className="p-6 md:p-8 space-y-10 relative z-10">
                {/* Default print size */}
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider">{t('settingsPage.print.defaultFormat')}</Label>
                  <Controller name="defaultPrintSize" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="w-full sm:w-72 h-14 rounded-xl border-border/50 bg-background/80 font-bold focus:ring-primary/30 transition-all text-base">
                        <SelectValue placeholder={t('settingsPage.print.selectPaperSize')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl font-medium shadow-2xl">
                        <SelectItem value="A4" className="focus:bg-primary/10 py-3 cursor-pointer transition-colors"><span className="font-bold me-2">A4 {t('settingsPage.print.defaultFormat')}</span></SelectItem>
                        <SelectItem value="A5" className="focus:bg-primary/10 py-3 cursor-pointer transition-colors"><span className="font-bold me-2">A5 {t('settingsPage.print.defaultFormat')}</span></SelectItem>
                      </SelectContent>
                    </Select>
                  )} />
                </div>

                <div className="h-px bg-border/40 w-full" />

                {/* Logo upload */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-bold text-foreground/80 uppercase tracking-wider block mb-1">{t('settingsPage.print.brandLogo')}</Label>
                    <p className="text-sm font-medium text-muted-foreground mb-4 max-w-lg">
                      {t('settingsPage.print.logoDesc')}
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-5 rounded-2xl bg-muted/10 border border-border/50 border-dashed">
                    {logoPreview ? (
                      <div className="relative group shrink-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-info/20 rounded-2xl blur opacity-75 group-hover:opacity-100 transition-opacity" />
                        <div className="relative h-28 w-28 rounded-xl bg-white flex items-center justify-center p-2 shadow-sm border border-border/50 overflow-hidden">
                          <img
                            src={logoPreview}
                            alt="Clinic brand representation"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="h-28 w-28 rounded-xl bg-muted/50 flex flex-col items-center justify-center p-2 border border-border/30 border-dashed text-muted-foreground shrink-0">
                         <Printer className="h-8 w-8 mb-2 opacity-20" />
                         <span className="text-[10px] uppercase font-bold tracking-wider opacity-50">{t('settingsPage.print.empty')}</span>
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-3">
                      <input
                        ref={logoInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml"
                        className="hidden"
                        onChange={handleLogoChange}
                      />
                      <Button
                        type="button"
                        variant={logoPreview ? "outline" : "default"}
                        className={`rounded-xl font-bold transition-all w-full sm:w-auto ${logoPreview ? 'border-primary/30 hover:bg-primary/10 hover:text-primary' : 'shadow-lg shadow-primary/20'}`}
                        onClick={() => logoInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 me-2" />
                        {logoPreview ? t('settingsPage.print.replaceLogo') : t('settingsPage.print.selectDoc')}
                      </Button>
                      
                      {logoPreview && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl w-full sm:w-auto font-bold justify-start sm:justify-center"
                          onClick={() => setLogoPreview(null)}
                        >
                          <Trash2 className="h-4 w-4 me-2" />{t('settingsPage.print.eraseLogo')}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
               <Button 
                 type="submit" 
                 disabled={isSubmitting}
                 size="lg"
                 className="rounded-xl font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 w-full sm:w-auto"
               >
                 <Save className="h-5 w-5 me-2" />
                 {isSubmitting ? t('settingsPage.print.publishingBtn') : t('settingsPage.print.publishBtn')}
               </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  );
}
