/**
 * useRegistrationRequests
 * -----------------------
 * Real-time listener on the `registration_requests` Firestore collection.
 * Accessible to admin only (guarded by Firestore rules).
 *
 * Provides:
 *  - `requests`       — sorted list of RegistrationRequest (newest first)
 *  - `isLoading`      — initial fetch state
 *  - `newCount`       — number of requests with status === 'new'
 *  - `updateStatus`   — mark a request as 'contacted' or 'activated'
 *  - `deleteRequest`  — remove a request document
 */

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/lib/constants';
import { RegistrationRequest } from '@/types/clinic';

export function useRegistrationRequests() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, COLLECTIONS.REGISTRATION_REQUESTS),
      orderBy('submittedAt', 'desc')
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as RegistrationRequest[];
        setRequests(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useRegistrationRequests] listener error:', err);
        setIsLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const newCount = requests.filter((r) => r.status === 'new').length;

  const updateStatus = useCallback(
    async (id: string, status: RegistrationRequest['status']) => {
      await updateDoc(doc(db, COLLECTIONS.REGISTRATION_REQUESTS, id), { status });
    },
    []
  );

  const deleteRequest = useCallback(async (id: string) => {
    await deleteDoc(doc(db, COLLECTIONS.REGISTRATION_REQUESTS, id));
  }, []);

  return { requests, isLoading, newCount, updateStatus, deleteRequest };
}
