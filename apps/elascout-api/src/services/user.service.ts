import { db } from "../config/firebase";
import { FieldValue } from "firebase-admin/firestore";

interface CreateUserInput {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  mode: "individual" | "organization" | null;
  organizationId: string | null;
  role: string | null;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

export async function findOrCreateUser(input: CreateUserInput): Promise<UserDoc> {
  const userRef = db.collection("users").doc(input.uid);
  const doc = await userRef.get();

  if (doc.exists) {
    const data = doc.data() as UserDoc;
    await userRef.update({ updatedAt: FieldValue.serverTimestamp() });
    return data;
  }

  const newUser: Omit<UserDoc, "createdAt" | "updatedAt"> & {
    createdAt: FirebaseFirestore.FieldValue;
    updatedAt: FirebaseFirestore.FieldValue;
  } = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    photoURL: input.photoURL,
    mode: null,
    organizationId: null,
    role: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(newUser);

  const created = await userRef.get();
  return created.data() as UserDoc;
}
