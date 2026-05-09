import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { PlatformPricing } from '@/types/clinic';

export function usePlatformPricing() {
  const [pricing, setPricing] = useState<PlatformPricing>({
    monthlyPrice: 350,
    yearlyPrice: 3500,
    currency: 'EGP',
    updatedAt: '',
    updatedBy: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'platform_settings', 'pricing'), (snap) => {
      if (snap.exists()) {
        console.log('Pricing updated from Firestore:', snap.data());
        setPricing(snap.data() as PlatformPricing);
      } else {
        console.warn('Pricing document not found in Firestore, using defaults.');
      }
      setIsLoading(false);
    }, (err) => {
      console.error('Error fetching platform pricing:', err);
      setIsLoading(false);
    });

    return () => unsub();
  }, []);

  return { pricing, isLoading };
}
