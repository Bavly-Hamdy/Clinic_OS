import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { auth, db, secondaryAuth } from '@/lib/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, UserRole } from '@/types/clinic';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface CreateDoctorData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  specialty?: string;
  clinicName?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  registerAccount: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  createDoctorAccount: (data: CreateDoctorData) => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_CACHE_KEY = 'clinicos_user_cache';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  });
  const [isLoading, setIsLoading] = useState(!user);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            const localUser: User = {
              id: firebaseUser.uid,
              fullName: data.fullName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: data.role as UserRole,
              doctorId: data.doctorId,
              isActive: data.isActive ?? true,
              subscriptionStatus: data.subscriptionStatus,
              subscriptionEndDate: data.subscriptionEndDate,
              createdAt: data.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString()
            };
            setUser(localUser);
            localStorage.setItem(USER_CACHE_KEY, JSON.stringify(localUser));
          } else {
            console.warn("User document not found in Firestore. Denying access.");
            localStorage.removeItem(USER_CACHE_KEY);
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
        }
      } catch (error) {
        console.error("Error signing in", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const registerAccount = useCallback(async (email: string, password: string, fullName: string, role: UserRole) => {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Update display name
    await updateProfile(user, { displayName: fullName });

    // 3. Save role & profile to Firestore
    await setDoc(doc(db, 'users', user.uid), {
      email,
      fullName,
      role,
      isActive: true,
      createdAt: serverTimestamp()
    });

    // onAuthStateChanged will automatically trigger and pick up the new user & firestore doc.
  }, []);

  /**
   * Creates a doctor account using a SECONDARY Firebase Auth instance
   * so the admin stays logged in. Returns the new doctor's UID.
   */
  const createDoctorAccount = useCallback(async (data: CreateDoctorData): Promise<string> => {
    // Create user on secondary auth (does NOT affect the admin's session)
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    const newUser = userCredential.user;

    // Update display name
    await updateProfile(newUser, { displayName: data.fullName });

    // Generate a 9-digit short ID
    const displayId = Math.floor(100000000 + Math.random() * 900000000).toString();

    // Save to Firestore
    await setDoc(doc(db, 'users', newUser.uid), {
      email: data.email,
      fullName: data.fullName,
      role: 'DOCTOR' as UserRole,
      isActive: true,
      phone: data.phone || '',
      specialty: data.specialty || '',
      clinicName: data.clinicName || '',
      subscriptionStatus: 'pending',
      displayId,
      createdAt: serverTimestamp()
    });

    // Sign out from secondary auth immediately
    await firebaseSignOut(secondaryAuth);

    return displayId; // Return the short ID for display/whatsapp
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerAccount,
        createDoctorAccount,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
