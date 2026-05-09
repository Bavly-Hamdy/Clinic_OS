import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from 'firebase/firestore';
import { User } from '@/types/clinic';

export function useAdminDoctors() {
  const [doctors, setDoctors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'DOCTOR'));
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as User[];
      setDoctors(docs);
      setIsLoading(false);
    }, (err) => {
      console.error('Admin doctors listener error:', err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const updateDoctor = async (doctorId: string, data: Partial<User>) => {
    await updateDoc(doc(db, 'users', doctorId), { ...data });
  };

  const toggleDoctorStatus = async (doctorId: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'users', doctorId), {
      isActive: !currentStatus,
    });
  };

  const deleteDoctor = async (doctorId: string, subscriptionId?: string) => {
    const { writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(db);
    
    // 1. Delete user document
    batch.delete(doc(db, 'users', doctorId));
    
    // 2. Delete subscription document if exists
    if (subscriptionId) {
      batch.delete(doc(db, 'subscriptions', subscriptionId));
    }
    
    await batch.commit();
  };

  return {
    doctors,
    isLoading,
    updateDoctor,
    toggleDoctorStatus,
    deleteDoctor,
  };
}
