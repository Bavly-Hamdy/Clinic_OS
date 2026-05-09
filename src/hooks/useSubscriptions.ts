import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDocs,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Subscription, SubscriptionPlan, SubscriptionStatus } from '@/types/clinic';

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'subscriptions'));
    const unsub = onSnapshot(q, (snap) => {
      const subs = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Subscription[];
      setSubscriptions(subs);
      setIsLoading(false);
    }, (err) => {
      console.error('Subscriptions listener error:', err);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  const activateSubscription = useCallback(async (
    doctorId: string,
    plan: SubscriptionPlan,
    price: number,
    adminId: string,
    doctorName?: string,
    doctorEmail?: string,
    customEndDate?: Date
  ) => {
    const now = new Date();
    let endDate = new Date(now);
    
    if (plan === 'monthly') {
      endDate.setDate(endDate.getDate() + 30);
    } else if (plan === 'yearly') {
      endDate.setDate(endDate.getDate() + 365);
    } else if (plan === 'custom' && customEndDate) {
      endDate = customEndDate;
    }

    const subRef = doc(collection(db, 'subscriptions'));
    const subData = {
      doctorId,
      doctorName: doctorName || '',
      doctorEmail: doctorEmail || '',
      plan,
      status: 'active' as SubscriptionStatus,
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      autoRenew: false,
      price,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      createdBy: adminId,
    };

    await setDoc(subRef, subData);

    // Update doctor's user doc
    await updateDoc(doc(db, 'users', doctorId), {
      subscriptionId: subRef.id,
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate.toISOString(),
      isActive: true,
    });

    return subRef.id;
  }, []);

  const suspendSubscription = useCallback(async (subscriptionId: string, doctorId: string) => {
    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'suspended',
      updatedAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'users', doctorId), {
      subscriptionStatus: 'suspended',
      isActive: false,
    });
  }, []);

  const renewSubscription = useCallback(async (subscriptionId: string, doctorId: string, plan: SubscriptionPlan, price: number, customEndDate?: Date) => {
    const now = new Date();
    let endDate = new Date(now);
    
    if (plan === 'monthly') {
      endDate.setDate(endDate.getDate() + 30);
    } else if (plan === 'yearly') {
      endDate.setDate(endDate.getDate() + 365);
    } else if (plan === 'custom' && customEndDate) {
      endDate = customEndDate;
    }

    await updateDoc(doc(db, 'subscriptions', subscriptionId), {
      status: 'active',
      startDate: now.toISOString(),
      endDate: endDate.toISOString(),
      price,
      updatedAt: now.toISOString(),
    });

    await updateDoc(doc(db, 'users', doctorId), {
      subscriptionStatus: 'active',
      subscriptionEndDate: endDate.toISOString(),
      isActive: true,
    });
  }, []);

  const checkAndExpireSubscriptions = useCallback(async () => {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'subscriptions'),
      where('status', '==', 'active')
    );
    const snap = await getDocs(q);
    const batch = writeBatch(db);
    let expiredCount = 0;

    snap.docs.forEach((d) => {
      const sub = d.data();
      if (sub.endDate && sub.endDate < now) {
        batch.update(d.ref, {
          status: 'expired',
          updatedAt: now,
        });
        // Also lock the doctor's account
        batch.update(doc(db, 'users', sub.doctorId), {
          subscriptionStatus: 'expired',
          isActive: false,
        });
        expiredCount++;
      }
    });

    if (expiredCount > 0) {
      await batch.commit();
    }

    return expiredCount;
  }, []);

  const getExpiringSubscriptions = useCallback((days: number = 7) => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setDate(futureDate.getDate() + days);

    return subscriptions.filter((sub) => {
      if (sub.status !== 'active') return false;
      const endDate = new Date(sub.endDate);
      return endDate <= futureDate && endDate > now;
    });
  }, [subscriptions]);

  return {
    subscriptions,
    isLoading,
    activateSubscription,
    suspendSubscription,
    renewSubscription,
    checkAndExpireSubscriptions,
    getExpiringSubscriptions,
  };
}
