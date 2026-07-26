import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loginMock: (email: string) => void;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null,
  loginMock: () => {}, 
  loading: true,
  logout: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const mockEmail = localStorage.getItem('mockUserEmail');
    if (mockEmail) {
       setUser({ uid: 'mock-' + btoa(mockEmail).substring(0, 10), email: mockEmail } as User);
       setLoading(false);
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
      } else if (!localStorage.getItem('mockUserEmail')) {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginMock = (email: string) => {
    localStorage.setItem('mockUserEmail', email);
    setUser({ uid: 'mock-' + btoa(email).substring(0, 10), email: email } as User);
  };

  const logout = () => {
    localStorage.removeItem('mockUserEmail');
    signOut(auth).catch(console.error);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginMock, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
