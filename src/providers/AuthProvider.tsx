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
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, UserRole } from '@/types/clinic';
import { USER_CACHE_KEY } from '@/lib/constants';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface CreateDoctorData {
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

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Reads a safe subset of user data from localStorage. */
function readCachedUser(): User | null {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? (JSON.parse(cached) as User) : null;
  } catch {
    localStorage.removeItem(USER_CACHE_KEY);
    return null;
  }
}

/** Persists a safe subset of user data (no tokens, no sensitive fields). */
function writeCachedUser(user: User): void {
  const safe: User = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    doctorId: user.doctorId,
    isActive: user.isActive,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndDate: user.subscriptionEndDate,
    createdAt: user.createdAt,
  };
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(safe));
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [isLoading, setIsLoading] = useState(!readCachedUser());

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
              createdAt: data.createdAt || firebaseUser.metadata.creationTime || new Date().toISOString(),
            };
            setUser(localUser);
            writeCachedUser(localUser);
          } else {
            // User exists in Auth but not in Firestore — deny access.
            console.warn('[Auth] User document not found in Firestore. Denying access.');
            localStorage.removeItem(USER_CACHE_KEY);
            await firebaseSignOut(auth);
            setUser(null);
          }
        } else {
          localStorage.removeItem(USER_CACHE_KEY);
          setUser(null);
        }
      } catch (error) {
        console.error('[Auth] Error resolving user state:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  /**
   * Signs in an existing user with email and password.
   * The `onAuthStateChanged` listener will handle updating the user state.
   */
  const login = useCallback(async (email: string, password: string): Promise<void> => {
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  /**
   * Registers a new account (receptionist self-registration).
   */
  const registerAccount = useCallback(
    async (email: string, password: string, fullName: string, role: UserRole): Promise<void> => {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName: fullName });
      await setDoc(doc(db, 'users', newUser.uid), {
        email,
        fullName,
        role,
        isActive: true,
        createdAt: serverTimestamp(),
      });
    },
    []
  );

  /**
   * Creates a doctor account using a SECONDARY Firebase Auth instance so the
   * admin stays logged in. `createUserWithEmailAndPassword` auto-signs-in the
   * new user — the secondary instance isolates that side effect.
   * @returns The short displayId assigned to the new doctor.
   */
  const createDoctorAccount = useCallback(async (data: CreateDoctorData): Promise<string> => {
    const { user: newUser } = await createUserWithEmailAndPassword(secondaryAuth, data.email, data.password);
    await updateProfile(newUser, { displayName: data.fullName });

    // Generate a 9-digit short display ID for admin search
    const displayId = Math.floor(100_000_000 + Math.random() * 900_000_000).toString();

    await setDoc(doc(db, 'users', newUser.uid), {
      email:      data.email,
      fullName:   data.fullName,
      role:       'DOCTOR' as UserRole,
      isActive:   true,
      phone:      data.phone || '',
      specialty:  data.specialty || '',
      clinicName: data.clinicName || '',
      subscriptionStatus: 'pending',
      displayId,
      createdAt: serverTimestamp(),
    });

    // Sign out from secondary auth immediately — admin session is unaffected.
    await firebaseSignOut(secondaryAuth);

    return displayId;
  }, []);

  /**
   * Signs out the current user and clears all local state.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      localStorage.removeItem(USER_CACHE_KEY);
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
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
