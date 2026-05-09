import { useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, CheckCircle2, AlertTriangle } from 'lucide-react';

/**
 * ONE-TIME SETUP PAGE — Create the initial admin account.
 * 
 * IMPORTANT: Remove this route from App.tsx after creating the admin account!
 * Route: /setup-admin
 */
export default function SetupAdminPage() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [createdUid, setCreatedUid] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
      await updateProfile(cred.user, { displayName: form.fullName });

      // 2. Create Firestore user doc with ADMIN role
      await setDoc(doc(db, 'users', cred.user.uid), {
        email: form.email,
        fullName: form.fullName,
        role: 'ADMIN',
        isActive: true,
        createdAt: serverTimestamp(),
      });

      // 3. Create default pricing document
      await setDoc(doc(db, 'platform_settings', 'pricing'), {
        monthlyPrice: 350,
        yearlyPrice: 3500,
        currency: 'EGP',
        updatedAt: new Date().toISOString(),
        updatedBy: cred.user.uid,
      });

      setCreatedUid(cred.user.uid);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create admin account');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/30 flex items-center justify-center">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">ClinicOS Setup</h1>
            <p className="text-sm text-white/50">Create Admin Account</p>
          </div>
        </div>

        {status === 'success' ? (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-black text-white">Admin Account Created!</h2>
            <p className="text-white/60 text-sm">UID: <code className="text-amber-400">{createdUid}</code></p>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-start">
              <p className="text-amber-400 text-sm font-bold mb-2">⚠️ Important Next Steps:</p>
              <ol className="text-white/70 text-sm space-y-1 list-decimal list-inside">
                <li>Remove <code className="text-amber-300">/setup-admin</code> route from App.tsx</li>
                <li>Go to <a href="/login" className="text-amber-400 underline">/login</a> and sign in</li>
              </ol>
            </div>
            <a href="/login" className="inline-block mt-4 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors">
              Go to Login →
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {status === 'error' && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-white/50">Full Name</Label>
              <Input
                required
                value={form.fullName}
                onChange={(e) => setForm(p => ({ ...p, fullName: e.target.value }))}
                className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="Admin Name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-white/50">Email</Label>
              <Input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))}
                className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="admin@clinicos.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-white/50">Password</Label>
              <Input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                className="h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30"
                placeholder="Min 6 characters"
              />
            </div>

            <Button
              type="submit"
              disabled={status === 'loading'}
              className="w-full h-14 rounded-2xl text-lg font-black bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-lg shadow-amber-500/20"
            >
              {status === 'loading' ? 'Creating...' : 'Create Admin Account'}
            </Button>

            <p className="text-xs text-white/30 text-center">
              This page should be removed after creating the admin account.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
