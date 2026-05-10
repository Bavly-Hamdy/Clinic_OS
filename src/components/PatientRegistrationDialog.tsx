import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { PatientFormValues, patientSchema } from '@/lib/schemas/patient';
import { Patient } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, UserPlus, Save } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/AuthProvider';

export function PatientRegistrationDialog({ 
  onCreated, 
  trigger,
  patient,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: { 
  onCreated: () => void, 
  trigger?: React.ReactNode,
  patient?: Patient,
  open?: boolean,
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange !== undefined ? externalOnOpenChange : setInternalOpen;
  
  const { toast } = useToast();
  const { t } = useTranslation();
  const isEdit = !!patient;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({ 
    resolver: zodResolver(patientSchema),
    defaultValues: patient || { gender: 'MALE' }
  });

  // Update form if patient changes
  useEffect(() => {
    if (patient) {
      reset(patient);
    }
  }, [patient, reset]);

  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      // Determine effective doctorId for this patient
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
      
      if (!effectiveDoctorId) {
        throw new Error('Authentication error: No linked doctor found');
      }

      // Remove undefined values to prevent Firebase invalid data error
      const cleanValues = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== undefined)
      );

      if (isEdit && patient?.id) {
        await updateDoc(doc(db, 'patients', patient.id), {
          ...cleanValues,
          updatedAt: serverTimestamp(),
        });
        return patient.id;
      } else {
        const patientId = `CLN-${Math.floor(10000 + Math.random() * 90000)}`;
        const docRef = await addDoc(collection(db, 'patients'), {
          ...cleanValues,
          patientId,
          doctorId: effectiveDoctorId,
          createdAt: serverTimestamp(),
        });
        return docRef.id;
      }
    },
    onSuccess: () => {
      toast({ title: isEdit ? `✅ ${t('patientDialog.updated') || 'Patient updated successfully'}` : `✅ ${t('patientDialog.success')}` });
      setOpen(false);
      if (!isEdit) reset();
      onCreated();
    },
    onError: (err) => {
      console.error(err);
      toast({ title: 'Error', description: t('patientDialog.error'), variant: 'destructive' });
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="rounded-xl shadow-lg hover:shadow-primary/30 transition-all font-bold">
            <Plus className="h-4 w-4 me-2" />
            {t('patientDialog.newPatient')}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl border-white/20 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-3xl p-0 overflow-hidden" aria-describedby={undefined}>
        <DialogHeader className="p-6 border-b border-border/10">
          <DialogTitle className="flex items-center gap-3 text-xl font-black">
             <div className="h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary shrink-0">
                {isEdit ? <Save className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
             </div>
             {isEdit ? (t('patientDialog.editPatient') || 'Edit Patient') : t('patientDialog.registerNew')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-6 p-6 bg-muted/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.fullName')} <span className="text-destructive">*</span></Label>
              <Input 
                placeholder={t('patientDialog.namePlaceholder')} 
                className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 font-semibold rounded-xl"
                {...register('fullName')} 
              />
              {errors.fullName && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.dob')} <span className="text-destructive">*</span></Label>
              <Input 
                type="date" 
                className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 font-semibold rounded-xl text-xs"
                {...register('dateOfBirth')} 
              />
              {errors.dateOfBirth && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.dateOfBirth.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.gender')} <span className="text-primary">*</span></Label>
              <Controller name="gender" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-background/80 border-border/50 focus:ring-primary/30 font-bold rounded-xl text-xs uppercase tracking-wide">
                    <SelectValue placeholder={t('patientDialog.select')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl font-medium shadow-2xl">
                    <SelectItem value="MALE" className="font-bold py-2.5 focus:bg-primary/10 cursor-pointer transition-colors text-xs">{t('patientDialog.male')}</SelectItem>
                    <SelectItem value="FEMALE" className="font-bold py-2.5 focus:bg-primary/10 cursor-pointer transition-colors text-xs">{t('patientDialog.female')}</SelectItem>
                  </SelectContent>
                </Select>
              )} />
              {errors.gender && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.gender.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.phone')} <span className="text-destructive">*</span></Label>
              <Input 
                placeholder={t('patientDialog.phonePlaceholder')} 
                className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 font-semibold rounded-xl text-end"
                {...register('phone')} 
                dir="ltr"
              />
              {errors.phone && <p className="text-xs font-bold text-destructive ps-1 animate-fade-in">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.bloodType')}</Label>
              <Controller name="bloodType" control={control} render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="h-12 bg-background/80 border-border/50 focus:ring-rose-500/30 font-bold rounded-xl text-xs uppercase tracking-wide">
                    <SelectValue placeholder={t('patientDialog.unknown')} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border/50 bg-background/95 backdrop-blur-xl font-medium shadow-2xl">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                      <SelectItem key={bt} value={bt} className="font-bold py-2.5 focus:bg-rose-500/10 cursor-pointer transition-colors text-xs">
                        {bt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            </div>

            <div className="md:col-span-2 space-y-2 group">
              <Label className="text-[11px] font-black text-foreground/80 uppercase tracking-widest ps-1">{t('patientDialog.address')}</Label>
              <Input 
                placeholder={t('patientDialog.addressPlaceholder')} 
                className="h-12 bg-background/80 border-border/50 focus-visible:ring-primary/30 font-semibold rounded-xl"
                {...register('address')} 
              />
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" className="w-full h-14 rounded-xl font-black tracking-widest uppercase bg-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300" disabled={isSubmitting}>
                {isSubmitting ? (isEdit ? t('common.saving') || 'Saving...' : t('patientDialog.registering')) : (isEdit ? t('common.save') || 'Save Changes' : t('patientDialog.completeReg'))}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
