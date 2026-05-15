import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, deleteDoc, doc, limit as firestoreLimit } from 'firebase/firestore';
import { Patient } from '@/types/clinic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PatientRegistrationDialog } from '@/components/PatientRegistrationDialog';
import { 
  Plus, 
  Search, 
  Users, 
  ChevronLeft, 
  ChevronRight, 
  Edit, 
  Trash2, 
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { differenceInYears, parseISO } from 'date-fns';
import { useAuth } from '@/providers/AuthProvider';
import { useTranslation } from 'react-i18next';

// ─── Patient row ──────────────────────────────────────────────────────────────

function PatientRow({ 
  patient, 
  onView, 
  onEdit, 
  onDelete 
}: { 
  patient: Patient; 
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const age = differenceInYears(new Date(), parseISO(patient.dateOfBirth));
  const { t } = useTranslation();

  return (
    <div className="group relative bg-card/40 backdrop-blur-sm border border-border/40 rounded-[1.5rem] p-4 flex items-center gap-4 hover:bg-card hover:border-primary/30 hover:shadow-xl transition-all duration-300">
      <div 
        onClick={onView}
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary text-sm font-black shadow-inner group-hover:scale-105 group-hover:from-primary group-hover:to-primary/80 group-hover:text-white transition-all duration-500 cursor-pointer"
      >
        {patient.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
      </div>
      
      <div className="flex-1 min-w-0 cursor-pointer space-y-0.5" onClick={onView}>
        <h4 className="font-bold text-base text-foreground tracking-tight group-hover:text-primary transition-colors">{patient.fullName}</h4>
        <div className="flex items-center gap-3">
           <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">{patient.patientId}</span>
           <span className="h-1 w-1 rounded-full bg-muted-foreground/30" />
           <span className="text-[10px] font-bold text-muted-foreground/60">{patient.phone}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-4 px-4 border-x border-border/10">
        <div className="text-center min-w-[40px]">
           <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{t('patientsPage.age')}</p>
           <p className="text-sm font-black text-foreground">{age}</p>
        </div>
        <div className="text-center min-w-[40px]">
           <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{t('patientsPage.gender')}</p>
           <Badge variant="outline" className="text-[9px] font-black h-4 px-1 border-primary/20 text-primary bg-primary/5">
             {patient.gender === 'MALE' ? t('patientDialog.male').charAt(0) : t('patientDialog.female').charAt(0)}
           </Badge>
        </div>
        {patient.bloodType && (
           <div className="text-center min-w-[40px]">
              <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter">{t('patientsPage.blood')}</p>
              <span className="text-xs font-black text-rose-600">{patient.bloodType}</span>
           </div>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 hover:bg-primary/10 hover:text-primary transition-colors">
            <MoreHorizontal className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="rounded-2xl p-1.5 min-w-[180px] border-border/40 shadow-2xl glass-card">
          <DropdownMenuItem onClick={onView} className="rounded-xl px-3 py-2.5 cursor-pointer gap-3 font-bold text-xs focus:bg-primary/10 focus:text-primary">
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
               <ExternalLink className="h-3.5 w-3.5" />
            </div>
            {t('common.view')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="rounded-xl px-3 py-2.5 cursor-pointer gap-3 font-bold text-xs focus:bg-amber-500/10 focus:text-amber-600">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
               <Edit className="h-3.5 w-3.5" />
            </div>
            {t('common.edit')}
          </DropdownMenuItem>
          <div className="my-1 border-t border-border/10" />
          <DropdownMenuItem onClick={onDelete} className="rounded-xl px-3 py-2.5 cursor-pointer gap-3 font-bold text-xs text-destructive focus:bg-destructive/10 focus:text-destructive">
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center">
               <Trash2 className="h-3.5 w-3.5" />
            </div>
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PatientsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = i18n.dir() === 'rtl';
  const { toast } = useToast();
  
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: async () => {
      const effectiveDoctorId = user?.role === 'DOCTOR' ? user?.id : user?.doctorId;
      
      let q = query(
        collection(db, 'patients'),
        where('doctorId', '==', effectiveDoctorId),
        firestoreLimit(200)
      );

      const snapshot = await getDocs(q);
      let allPatients = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];

      allPatients.sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      if (search.trim() !== '') {
        const lowerSearch = search.toLowerCase();
        allPatients = allPatients.filter(p =>
          p.fullName.toLowerCase().includes(lowerSearch) ||
          p.phone.includes(lowerSearch) ||
          p.patientId.toLowerCase().includes(lowerSearch)
        );
      }

      const total = allPatients.length;
      const startIndex = (page - 1) * limit;
      const paginatedData = allPatients.slice(startIndex, startIndex + limit);

      return {
        data: paginatedData,
        total,
        hasMore: startIndex + limit < total
      };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (patientId: string) => {
      await deleteDoc(doc(db, 'patients', patientId));
    },
    onSuccess: () => {
      toast({ title: t('common.success') || 'Deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      setPatientToDelete(null);
    },
    onError: () => {
      toast({ title: 'Error', variant: 'destructive' });
    }
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{t('patientsPage.title')}</h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-60">
            {data?.total ?? 0} {t('patientsPage.totalRegistered')}
          </p>
        </div>
        <div className="w-full sm:w-auto">
          <PatientRegistrationDialog
            onCreated={() => queryClient.invalidateQueries({ queryKey: ['patients'] })}
          />
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-sm group">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder={t('patientsPage.search')}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ps-10 h-12 rounded-2xl bg-card border-border/50 shadow-sm focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-xl" />
          <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">{t('common.generating')}</p>
        </div>
      ) : data?.data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center glass-card rounded-[2rem] border-dashed">
          <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-bold text-foreground">{t('patientsPage.notFound')}</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">{t('patientsPage.notFoundDesc')}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {data?.data.map((patient) => (
              <PatientRow
                key={patient.id}
                patient={patient}
                onView={() => navigate(`/patients/${patient.id}`)}
                onEdit={() => setPatientToEdit(patient)}
                onDelete={() => setPatientToDelete(patient)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-border/50">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                {t('patientsPage.pageOf', { page, totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-xl h-9 w-9"
                >
                  <ChevronLeft className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-xl h-9 w-9"
                >
                  <ChevronRight className={`h-4 w-4 ${isRtl ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!patientToDelete} onOpenChange={(o) => !o && setPatientToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] border-border/50 glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black">{t('common.deleteConfirm')}</AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              {t('common.deleteDesc', { name: patientToDelete?.fullName })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 sm:gap-0">
            <AlertDialogCancel className="rounded-2xl font-bold">{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => patientToDelete && deleteMutation.mutate(patientToDelete.id)}
              className="rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90 font-bold"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden triggered edit dialog trick */}
      {patientToEdit && (
        <div className="hidden">
           {/* The dialog is rendered above, but we need a way to open it without a trigger click */}
           {/* Actually, since PatientRegistrationDialog is a Dialog, I can just control the 'open' prop */}
        </div>
      )}
    </div>
  );
}
