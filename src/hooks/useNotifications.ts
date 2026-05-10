import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { AppNotification } from '@/types/clinic';
import { COLLECTIONS } from '@/lib/constants';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, COLLECTIONS.NOTIFICATIONS),
      where('userId', '==', userId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AppNotification[];
        // Sort in-memory to avoid a composite Firestore index requirement
        data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(data);
        setIsLoading(false);
      },
      (err) => {
        console.error('[useNotifications] Listener error:', err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string): Promise<void> => {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId), { isRead: true });
  }, []);

  const deleteNotification = useCallback(async (notificationId: string): Promise<void> => {
    await deleteDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notificationId));
  }, []);

  const sendNotification = useCallback(
    async (data: Omit<AppNotification, 'id' | 'createdAt'>): Promise<void> => {
      const ref = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
      await setDoc(ref, {
        ...data,
        // Use serverTimestamp for consistency — avoids client clock drift issues
        createdAt: serverTimestamp(),
      });
    },
    []
  );

  const sendBulkNotifications = useCallback(
    async (
      userIds: string[],
      title: string,
      message: string,
      type: AppNotification['type'] = 'warning'
    ): Promise<void> => {
      const batch = writeBatch(db);

      userIds.forEach((uid) => {
        const ref = doc(collection(db, COLLECTIONS.NOTIFICATIONS));
        batch.set(ref, {
          userId: uid,
          title,
          message,
          type,
          isRead: false,
          createdAt: serverTimestamp(),
        });
      });

      await batch.commit();
    },
    []
  );

  return {
    notifications,
    isLoading,
    markAsRead,
    deleteNotification,
    sendNotification,
    sendBulkNotifications,
  };
}
