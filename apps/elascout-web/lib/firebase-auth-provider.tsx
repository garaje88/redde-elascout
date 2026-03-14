"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession, signOut as nextAuthSignOut } from "next-auth/react";
import {
  signInWithCredential,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

interface FirebaseAuthContextValue {
  firebaseUser: User | null;
  getFirebaseToken: () => Promise<string>;
  loading: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthContextValue>({
  firebaseUser: null,
  getFirebaseToken: () => Promise.reject(new Error("No Firebase auth")),
  loading: true,
});

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setFirebaseUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const idToken = (session as any)?.idToken;
    if (!idToken || firebaseUser) return;

    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(firebaseAuth, credential).catch((err) => {
      console.error("[firebase-auth] signInWithCredential failed:", err);
    });
  }, [session, firebaseUser]);

  async function getFirebaseToken(): Promise<string> {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error("No Firebase user signed in");
    return user.getIdToken();
  }

  return (
    <FirebaseAuthContext.Provider
      value={{ firebaseUser, getFirebaseToken, loading }}
    >
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth() {
  return useContext(FirebaseAuthContext);
}
