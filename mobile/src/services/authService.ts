import AsyncStorage from '@react-native-async-storage/async-storage';

export type AuthUser = {
  email?: string;
  getIdToken: () => Promise<string>;
};

export type AuthCredential = {
  user: AuthUser;
};

export const auth = {
  provider: 'local',
  currentUser: null as AuthUser | null,
};

const tokenFor = (email: string) => `local-token:${email}:${Date.now()}`;

const buildUser = (email: string, token: string): AuthUser => ({
  email,
  getIdToken: async () => token,
});

export async function signInWithEmailAndPassword(_: typeof auth, email: string, password: string): Promise<AuthCredential> {
  if (!email.includes('@')) {
    const error: any = new Error('Invalid email');
    error.code = 'auth/invalid-email';
    throw error;
  }
  if (password.length < 1) {
    const error: any = new Error('Wrong password');
    error.code = 'auth/wrong-password';
    throw error;
  }

  const token = tokenFor(email);
  await AsyncStorage.setItem('userEmail', email);
  await AsyncStorage.setItem('userToken', token);
  const user = buildUser(email, token);
  auth.currentUser = user;
  return { user };
}

export async function createUserWithEmailAndPassword(_: typeof auth, email: string, password: string): Promise<AuthCredential> {
  if (!email.includes('@')) {
    const error: any = new Error('Invalid email');
    error.code = 'auth/invalid-email';
    throw error;
  }
  if (password.length < 6) {
    const error: any = new Error('Weak password');
    error.code = 'auth/weak-password';
    throw error;
  }

  const token = tokenFor(email);
  await AsyncStorage.setItem('userEmail', email);
  await AsyncStorage.setItem('userToken', token);
  const user = buildUser(email, token);
  auth.currentUser = user;
  return { user };
}

export async function signInWithGoogle(): Promise<AuthCredential> {
  const email = 'google-user@example.com';
  const token = tokenFor(email);
  await AsyncStorage.setItem('userEmail', email);
  await AsyncStorage.setItem('userToken', token);
  const user = buildUser(email, token);
  auth.currentUser = user;
  return { user };
}

export async function sendPasswordResetEmail(_: typeof auth, email: string): Promise<void> {
  if (!email.includes('@')) {
    const error: any = new Error('Invalid email');
    error.code = 'auth/invalid-email';
    throw error;
  }
}

export function onAuthStateChanged(_: typeof auth, callback: (user: AuthUser | null) => void): () => void {
  let active = true;

  AsyncStorage.multiGet(['userToken', 'userEmail']).then((pairs) => {
    if (!active) return;
    const token = pairs.find(([key]) => key === 'userToken')?.[1];
    const email = pairs.find(([key]) => key === 'userEmail')?.[1] || undefined;
    const user = token ? buildUser(email || 'local@user.app', token) : null;
    auth.currentUser = user;
    callback(user);
  });

  return () => {
    active = false;
  };
}
