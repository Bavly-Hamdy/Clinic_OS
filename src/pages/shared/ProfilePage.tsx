import { useAuth } from '@/providers/AuthProvider';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  User, Mail, Shield, Calendar, Clock, MapPin, Phone, Award, LogOut, CheckCircle2, Zap, Star 
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  if (!user) return null;

  const currentLang = i18n.language?.split('-')[0] || 'en';
  const locale = currentLang === 'ar' ? ar : enUS;

  const initials = user.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Decorative Background Mesh */}
      <div className="absolute top-0 start-0 w-full h-96 overflow-hidden -z-10 pointer-events-none">
        <div className="absolute -top-24 -start-24 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" />
        <div className="absolute top-10 -end-24 w-96 h-96 bg-info/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className={`flex flex-col md:flex-row items-start md:items-end justify-between gap-6 ${currentLang === 'ar' ? 'md:flex-row-reverse' : ''}`}>
        <div className={currentLang === 'ar' ? 'text-end' : ''}>
          <h1 className={`text-4xl font-black tracking-tight text-foreground flex items-center gap-3 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
             <User className="h-10 w-10 text-primary" />
             {t('profile.title')}
          </h1>
          <p className="text-muted-foreground font-medium mt-1 uppercase tracking-widest text-[11px]">{t('profile.subtitle')}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className={`rounded-xl border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all font-bold ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}
        >
          <LogOut className={`h-4 w-4 ${currentLang === 'ar' ? 'ms-2' : 'me-2'}`} />
          {t('common.logout')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Avatar & Basic Info */}
        <Card className="lg:col-span-1 rounded-3xl border-white/10 glass-card overflow-hidden h-fit">
          <div className="h-32 bg-gradient-to-br from-primary via-info to-primary animate-gradient-x relative">
            <div className="absolute inset-0 bg-black/10" />
          </div>
          <CardContent className="relative pt-0 px-6 pb-8">
            <div className="flex justify-center -mt-16 mb-6">
              <div className="h-32 w-32 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 border-4 border-background flex items-center justify-center shadow-elevated relative overflow-hidden group">
                 <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                 <span className="text-white font-black text-4xl relative z-10 transition-transform group-hover:scale-110 duration-500">
                   {initials}
                 </span>
                 <div className="absolute bottom-0 inset-x-0 h-1 bg-primary shadow-[0_0_15px_rgba(37,99,235,0.8)]" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black tracking-tight text-foreground">{user.fullName}</h2>
              <div className="flex justify-center">
                <Badge 
                  variant="outline" 
                  className={`px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase border-primary/30 bg-primary/5 text-primary shadow-sm ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}
                >
                  <Shield className={`h-3 w-3 ${currentLang === 'ar' ? 'ms-1.5' : 'me-1.5'}`} />
                  {user.role}
                </Badge>
              </div>
            </div>

            <Separator className="my-8 opacity-50" />

            <div className="space-y-6">
              <div className={`flex items-center gap-4 text-sm ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className={`min-w-0 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{t('profile.email')}</p>
                  <p className="font-bold text-foreground truncate">{user.email}</p>
                </div>
              </div>

              <div className={`flex items-center gap-4 text-sm ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className={`min-w-0 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{t('profile.role')}</p>
                  <p className="font-bold text-foreground">{user.role === 'DOCTOR' ? t('profile.practitioner') : t('profile.receptionist')}</p>
                </div>
              </div>
              
              <div className={`flex items-center gap-4 text-sm ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className={`min-w-0 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">{t('profile.memberSince')}</p>
                  <p className="font-bold text-foreground">{format(new Date(), 'MMMM yyyy', { locale })}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Role Details & Status */}
        <div className="lg:col-span-2 space-y-8">
          <Card className="rounded-3xl border-white/10 glass-card">
            <CardHeader className="border-b border-white/5 py-6">
              <CardTitle className={`text-xl font-black flex items-center gap-3 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                <Award className="h-5 w-5 text-primary" />
                {t('profile.professionalIdentity')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                   <div className={`space-y-2 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                     <p className={`text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <CheckCircle2 className="h-3 w-3 text-success" />
                       {t('profile.legalName')}
                     </p>
                     <p className="text-lg font-bold text-foreground border-b border-border/30 pb-2">{user.fullName}</p>
                   </div>
                   
                   <div className={`space-y-2 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                     <p className={`text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <Shield className="h-3 w-3 text-primary" />
                       {t('profile.workspace')}
                     </p>
                     <p className="text-lg font-bold text-foreground border-b border-border/30 pb-2">Clinic Hub Management System</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className={`space-y-2 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                     <p className={`text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                       <Award className="h-3 w-3 text-info" />
                       {t('profile.accessLevel')}
                     </p>
                     <div className={`flex flex-wrap gap-2 pt-1 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Badge className="bg-success/20 text-success border-success/30 font-bold">{t('profile.authenticated')}</Badge>
                        <Badge className="bg-primary/20 text-primary border-primary/30 font-bold">{t('profile.secure')}</Badge>
                        {user.role === 'DOCTOR' && <Badge className="bg-info/20 text-info border-info/30 font-bold">{t('profile.admin')}</Badge>}
                     </div>
                   </div>

                   <div className={`space-y-2 ${currentLang === 'ar' ? 'text-end' : ''}`}>
                     <p className={`text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 ${currentLang === 'ar' ? 'flex-row-reverse' : ''}`}>
                        <Zap className="h-3 w-3 text-warning" />
                        {t('profile.status')}
                     </p>
                     <div className={`flex items-center gap-2 text-success font-bold text-lg ${currentLang === 'ar' ? 'flex-row-reverse mt-1' : ''}`}>
                        <span className="h-3 w-3 rounded-full bg-success animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.6)]" />
                        {t('profile.active')}
                     </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Mini Stats */}
          <div className="grid sm:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-white/10 glass-card p-6 flex flex-col items-center text-center group hover:border-primary/30 transition-all">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Star className="h-6 w-6" />
               </div>
               <p className="text-2xl font-black text-foreground">{user.role === 'DOCTOR' ? t('profile.pro') : t('profile.standard')}</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('profile.tier')}</p>
            </div>

            <div className="rounded-3xl border border-white/10 glass-card p-6 flex flex-col items-center text-center group hover:border-info/30 transition-all">
               <div className="h-12 w-12 rounded-2xl bg-info/10 text-info flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6" />
               </div>
               <p className="text-2xl font-black text-foreground">{format(new Date(), 'HH:mm')}</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('profile.localTime')}</p>
            </div>

            <div className="rounded-3xl border border-white/10 glass-card p-6 flex flex-col items-center text-center group hover:border-success/30 transition-all">
               <div className="h-12 w-12 rounded-2xl bg-success/10 text-success flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="h-6 w-6" />
               </div>
               <p className="text-2xl font-black text-foreground">v2.1.0</p>
               <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{t('profile.version')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
