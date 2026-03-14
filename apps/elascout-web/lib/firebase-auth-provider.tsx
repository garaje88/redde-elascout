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
    // Esperar a que Firebase determine el estado actual antes de intentar sign-in
    // Evita la race condition donde onAuthStateChanged aún no resolvió
    if (loading) return;

    // Si Auth.js no pudo refrescar el token, forzar re-login
    if ((session as any)?.error === "RefreshAccessTokenError") {
      nextAuthSignOut({ callbackUrl: "/auth/signin" });
      return;
    }

    const idToken = (session as any)?.idToken;
    // Si no hay token o Firebase ya autenticó (persistencia), no hacer nada
    if (!idToken || firebaseUser) return;

    const credential = GoogleAuthProvider.credential(idToken);
    signInWithCredential(firebaseAuth, credential).catch((err) => {
      if (err.code === "auth/invalid-credential") {
        // Token de Google stale — forzar re-autenticación con token fresco
        nextAuthSignOut({ callbackUrl: "/auth/signin" });
      } else {
        console.error("[firebase-auth] signInWithCredential failed:", err);
      }
    });
  }, [session, firebaseUser, loading]);

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
