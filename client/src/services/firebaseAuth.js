import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/config/firebase';

/**
 * Sign in with Google popup.
 * @returns {{ user: { email: string, name: string, photoURL: string, uid: string }, idToken: string }}
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();

  return {
    user: {
      email: result.user.email,
      name: result.user.displayName,
      photoURL: result.user.photoURL,
      uid: result.user.uid,
    },
    idToken,
  };
}

/**
 * Sign out from Firebase client SDK.
 */
export async function signOutFromFirebase() {
  await signOut(auth);
}
