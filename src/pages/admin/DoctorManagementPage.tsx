import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useAdminDoctors } from '@/hooks/useAdminDoctors';
import { useLanguage } from '@/providers/LanguageProvider';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Shield,
  ShieldOff,
  User,
  Mail,
  Lock,
  Phone,
  Stethoscope,
  Building2,
  X,
  CheckCircle2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const t = {
  en: {
    title: 'Doctor Management',
    subtitle: 'Create and manage doctor accounts',
    createDoctor: 'Create Doctor',
    search: 'Search by name or email...',
    name: 'Full Name',
    email: 'Email Address',
    password: 'Password',
    phone: 'Phone Number',
    specialty: 'Specialty',
    clinicName: 'Clinic Name',
    create: 'Create Account',
    creating: 'Creating...',
    active: 'Active',
    inactive: 'Inactive',
    noDoctors: 'No doctors found.',
    createFirst: 'Create your first doctor account to get started.',
    successCreated: 'Doctor account created successfully!',
    errorCreate: 'Failed to create doctor account.',
    activate: 'Activate',
    deactivate: 'Deactivate',
    subscription: 'Subscription',
    pending: 'Pending',
    edit: 'Edit',
    cancel: 'Cancel',
    delete: 'Delete',
    deleteConfirm: 'Are you sure you want to delete this doctor? This action cannot be undone and will also remove their subscription.',
    successDeleted: 'Doctor account deleted successfully from database.',
  },
  ar: {
    title: 'إدارة الدكاترة',
    subtitle: 'إنشاء وإدارة حسابات الدكاترة',
    createDoctor: 'إنشاء دكتور',
    search: 'بحث بالاسم أو الإيميل...',
    name: 'الاسم بالكامل',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    phone: 'رقم الهاتف',
    specialty: 'التخصص',
    clinicName: 'اسم العيادة',
    create: 'إنشاء حساب',
    creating: 'جاري الإنشاء...',
    active: 'نشط',
    inactive: 'غير نشط',
    noDoctors: 'لا يوجد دكاترة.',
    createFirst: 'أنشئ أول حساب دكتور للبدء.',
    successCreated: 'تم إنشاء حساب الدكتور بنجاح!',
    errorCreate: 'فشل في إنشاء حساب الدكتور.',
    activate: 'تفعيل',
    deactivate: 'إيقاف',
    subscription: 'الاشتراك',
    pending: 'في الانتظار',
    edit: 'تعديل',
    cancel: 'إلغاء',
    delete: 'حذف',
    deleteConfirm: 'هل أنت متأكد من حذف هذا الدكتور؟ هذا الإجراء لا يمكن التراجع عنه وسيؤدي أيضاً لحذف اشتراكه.',
    successDeleted: 'تم حذف حساب الدكتور من قاعدة البيانات بنجاح.',
  },
};

export default function DoctorManagementPage() {
  const { createDoctorAccount } = useAuth();
  const { doctors, isLoading, toggleDoctorStatus, deleteDoctor } = useAdminDoctors();
  const { dir } = useLanguage();
  const isRtl = dir === 'rtl';
  const labels = isRtl ? t.ar : t.en;

  const [showDialog, setShowDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
    clinicName: '',
  });

  const filteredDoctors = doctors.filter((d) =>
    d.fullName.toLowerCase().includes(search.toLowerCase()) ||
    d.email.toLowerCase().includes(search.toLowerCase()) ||
    d.displayId?.includes(search)
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const displayId = await createDoctorAccount({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        specialty: form.specialty,
        clinicName: form.clinicName,
      });
      toast.success(labels.successCreated);

      // --- Automatic WhatsApp Credential Delivery ---
      if (form.phone) {
        const baseUrl = window.location.origin;
        const msg = isRtl
          ? `*ClinicOS | نظام إدارة العيادات*\n--------------------------------------------\nمرحباً د. *${form.fullName}*\n\nتم تفعيل حسابكم بنجاح على المنصة.\nيمكنكم البدء في استخدام النظام ببيانات الدخول التالية:\n\n*تفاصيل الحساب:*\n- البريد الإلكتروني: ${form.email}\n- كلمة المرور: ${form.password}\n- كود التعريف (ID): ${displayId}\n\n*رابط الدخول:*\n${baseUrl}/login\n\n--------------------------------------------\n_نتمنى لكم تجربة موفقة._`
          : `*ClinicOS | Clinic Management System*\n--------------------------------------------\nHello Dr. *${form.fullName}*\n\nYour account has been successfully activated.\nYou can start using the system with the following credentials:\n\n*Account Details:*\n- Email: ${form.email}\n- Password: ${form.password}\n- ID: ${displayId}\n\n*Login Link:*\n${baseUrl}/login\n\n--------------------------------------------\n_We wish you a successful experience._`;
        
        const url = `https://wa.me/2${form.phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
      }

      setShowDialog(false);
      setForm({ fullName: '', email: '', password: '', phone: '', specialty: '', clinicName: '' });
    } catch (err: any) {
      toast.error(err.message || labels.errorCreate);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (doctorId: string, subscriptionId?: string) => {
    if (!window.confirm(labels.deleteConfirm)) return;
    
    try {
      await deleteDoctor(doctorId, subscriptionId);
      toast.success(labels.successDeleted);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete doctor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">{labels.title}</h1>
          <p className="text-muted-foreground font-medium">{labels.subtitle}</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20 shrink-0">
          <Plus className="h-4 w-4" />
          {labels.createDoctor}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground rtl:left-auto rtl:right-4" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={labels.search}
          className="h-12 rounded-xl px-12 text-base font-medium"
        />
      </div>

      {/* Doctor List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <User className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="font-bold text-foreground">{labels.noDoctors}</p>
          <p className="text-sm text-muted-foreground mt-1">{labels.createFirst}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDoctors.map((doctor, i) => (
            <motion.div
              key={doctor.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl border border-border/50 bg-card p-5 hover:shadow-md transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                    doctor.isActive
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                      : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {doctor.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-lg text-foreground leading-tight">{doctor.fullName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground font-medium">{doctor.email}</p>
                      {doctor.displayId && (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="text-[10px] font-black bg-muted px-1.5 py-0.5 rounded text-muted-foreground tracking-wider uppercase">
                            ID: {doctor.displayId}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {doctor.specialty && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          {doctor.specialty}
                        </span>
                      )}
                      {doctor.clinicName && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {doctor.clinicName}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        doctor.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-red-500/10 text-red-600 dark:text-red-400'
                      }`}>
                        {doctor.isActive ? labels.active : labels.inactive}
                      </span>
                      {doctor.subscriptionStatus && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          doctor.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-600' :
                          doctor.subscriptionStatus === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          'bg-red-500/10 text-red-600'
                        }`}>
                          {labels.subscription}: {doctor.subscriptionStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={doctor.isActive ? 'destructive' : 'default'}
                    className="rounded-xl text-xs gap-1"
                    onClick={() => toggleDoctorStatus(doctor.id, doctor.isActive)}
                  >
                    {doctor.isActive ? <ShieldOff className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                    {doctor.isActive ? labels.deactivate : labels.activate}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-xl text-xs gap-1 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    onClick={() => handleDelete(doctor.id, doctor.subscriptionId)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {labels.delete}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Doctor Dialog */}
      <AnimatePresence>
        {showDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShowDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card rounded-3xl border border-border shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-foreground">{labels.createDoctor}</h2>
                <button onClick={() => setShowDialog(false)} className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> {labels.name} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    className="h-12 rounded-xl"
                    placeholder={isRtl ? 'د. أحمد محمد' : 'Dr. John Doe'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" /> {labels.email} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="doctor@clinic.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5" /> {labels.password} <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      required
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="••••••••"
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> {labels.phone}
                    </Label>
                    <Input
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder="01xxxxxxxxx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <Stethoscope className="h-3.5 w-3.5" /> {labels.specialty}
                    </Label>
                    <Input
                      value={form.specialty}
                      onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))}
                      className="h-12 rounded-xl"
                      placeholder={isRtl ? 'أسنان / باطنة' : 'Dental / Internal'}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {labels.clinicName}
                  </Label>
                  <Input
                    value={form.clinicName}
                    onChange={(e) => setForm((p) => ({ ...p, clinicName: e.target.value }))}
                    className="h-12 rounded-xl"
                    placeholder={isRtl ? 'عيادة الأمل' : 'Hope Clinic'}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isCreating} className="flex-1 h-12 rounded-xl gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-lg">
                    {isCreating ? labels.creating : labels.create}
                    {!isCreating && <CheckCircle2 className="h-4 w-4" />}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDialog(false)} className="rounded-xl">
                    {labels.cancel}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
