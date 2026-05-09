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
  orderBy
} from 'firebase/firestore';
import { AppNotification } from '@/types/clinic';

export function useNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() })) as AppNotification[];
      
      // Sort in memory to avoid needing a composite index
      const sortedData = data.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setNotifications(sortedData);
      setIsLoading(false);
    }, (err) => {
      console.error('Notifications listener error:', err);
      setIsLoading(false);
    });

    return () => unsub();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    await updateDoc(doc(db, 'notifications', notificationId), { isRead: true });
  };

  const deleteNotification = async (notificationId: string) => {
    await deleteDoc(doc(db, 'notifications', notificationId));
  };

  const sendNotification = async (data: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const ref = doc(collection(db, 'notifications'));
    await setDoc(ref, {
      ...data,
      createdAt: new Date().toISOString()
    });
  };

  const sendBulkNotifications = async (userIds: string[], title: string, message: string, type: AppNotification['type'] = 'warning') => {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    userIds.forEach(uid => {
      const ref = doc(collection(db, 'notifications'));
      batch.set(ref, {
        userId: uid,
        title,
        message,
        type,
        isRead: false,
        createdAt: now
      });
    });

    await batch.commit();
  };

  return {
    notifications,
    isLoading,
    markAsRead,
    deleteNotification,
    sendNotification,
    sendBulkNotifications
  };
}
