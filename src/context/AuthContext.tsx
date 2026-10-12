import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export interface UserData {
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  status: 'active' | 'suspended' | 'pending';
  fullName?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data() as UserData);
      } else {
        // Fallback placeholder profile until user chooses role or profile finishes saving
        setUserData({
          email: auth.currentUser?.email || '',
          fullName: auth.currentUser?.displayName || 'User',
          role: 'patient',
          status: 'active'
        });
      }
    } catch (err) {
      console.error('Error fetching user profile from Firestore:', err);
      // Even if Firestore read has issues, provide default fallback so UI doesn't crash
      if (auth.currentUser) {
        setUserData({
          email: auth.currentUser.email || '',
          fullName: auth.currentUser.displayName || 'User',
          role: 'patient',
          status: 'active'
        });
      }
    }
  };

  const refreshUserData = async () => {
    if (auth.currentUser) {
      await fetchProfile(auth.currentUser.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, userData, loading, refreshUserData }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
