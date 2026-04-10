import AsyncStorage from '@react-native-async-storage/async-storage';

type Session = {
  userId: string | null;
  username: string | null;
};

const SESSION_KEY = 'mindorbit.session';

const session: Session = {
  userId: null,
  username: null,
};

export async function setSession(userId: string | null, username: string | null) {
  session.userId = userId;
  session.username = username;
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export async function clearSession() {
  session.userId = null;
  session.username = null;
  await AsyncStorage.removeItem(SESSION_KEY);
}

export async function loadSession() {
  const raw = await AsyncStorage.getItem(SESSION_KEY);
  if (!raw) {
    return session;
  }
  try {
    const parsed = JSON.parse(raw) as Session;
    session.userId = parsed.userId ?? null;
    session.username = parsed.username ?? null;
  } catch {
    session.userId = null;
    session.username = null;
  }
  return session;
}

export function getSession() {
  return session;
}
