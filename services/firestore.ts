import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  type Query,
} from 'firebase/firestore';
import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import { auth, db, firebaseConfig } from '../firebase';
import type {
  Appointment,
  AppSettings,
  DraftTargets,
  Profile,
  Session,
  SessionTarget,
  Team,
  UserRole,
} from '../types';

/**
 * Firestore-implementatie van de data-API (zie services/index.ts).
 *
 * Collecties: teams, profiles (doc-id = Firebase Auth uid), sessions,
 * session_targets, appointments en settings (docs "global" en "drafts").
 */

const teamsCol = collection(db, 'teams');
const profilesCol = collection(db, 'profiles');
const sessionsCol = collection(db, 'sessions');
const targetsCol = collection(db, 'session_targets');
const appointmentsCol = collection(db, 'appointments');

const globalSettingsDoc = () => doc(db, 'settings', 'global');
const draftsDoc = () => doc(db, 'settings', 'drafts');

const DEFAULT_SETTINGS: AppSettings = { active_session_id: null, blind_mode_enabled: false };

function subscribeList<T>(source: Query, callback: (items: T[]) => void) {
  return onSnapshot(source, (snapshot) => {
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }) as T));
  });
}

// ---------- Auth ----------

export const onAuthChange = (callback: (user: { uid: string } | null) => void) =>
  onAuthStateChanged(auth, callback);

export const signIn = async (email: string, password: string) => {
  await signInWithEmailAndPassword(auth, email, password);
};

export const signOut = () => firebaseSignOut(auth);

export const getCurrentUid = () => auth.currentUser?.uid ?? null;

export const fetchProfile = async (uid: string): Promise<Profile | null> => {
  const snapshot = await getDoc(doc(db, 'profiles', uid));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Profile) : null;
};

// ---------- Live data ----------

export const subscribeTeams = (callback: (teams: Team[]) => void) => subscribeList<Team>(teamsCol, callback);

export const subscribeProfiles = (callback: (profiles: Profile[]) => void) =>
  subscribeList<Profile>(profilesCol, callback);

export const subscribeSessions = (callback: (sessions: Session[]) => void) =>
  subscribeList<Session>(query(sessionsCol, orderBy('date', 'desc')), callback);

export const subscribeSessionTargets = (callback: (targets: SessionTarget[]) => void) =>
  subscribeList<SessionTarget>(targetsCol, callback);

export const subscribeAppointments = (callback: (appointments: Appointment[]) => void) =>
  subscribeList<Appointment>(query(appointmentsCol, orderBy('created_at', 'desc')), callback);

export const subscribeSettings = (callback: (settings: AppSettings) => void) =>
  onSnapshot(globalSettingsDoc(), (snapshot) => {
    callback(snapshot.exists() ? { ...DEFAULT_SETTINGS, ...(snapshot.data() as Partial<AppSettings>) } : DEFAULT_SETTINGS);
  });

export const subscribeDraftTargets = (callback: (drafts: DraftTargets) => void) =>
  onSnapshot(draftsDoc(), (snapshot) => {
    callback(snapshot.exists() ? ((snapshot.data().targets as DraftTargets) ?? {}) : {});
  });

// ---------- Appointments ----------

export const addAppointment = async (
  bellerId: string,
  sessionId: string,
  customerName: string,
  appointmentDate: string,
) => {
  await addDoc(appointmentsCol, {
    beller_id: bellerId,
    session_id: sessionId,
    customer_name: customerName,
    appointment_date: appointmentDate,
    created_at: new Date().toISOString(),
  });
};

// ---------- Sessions ----------

/** Maakt een sessie + targets aan en zet de sessie actief. Geeft het nieuwe sessie-id terug. */
export const startNewSession = async (
  name: string,
  quarter: string,
  targets: { userId: string; target: number }[],
) => {
  const sessionRef = await addDoc(sessionsCol, {
    date: new Date().toISOString().split('T')[0],
    status: 'open',
    name,
    quarter,
  });
  await Promise.all(
    targets.map((t) => addDoc(targetsCol, { session_id: sessionRef.id, user_id: t.userId, target: t.target })),
  );
  await setDoc(globalSettingsDoc(), { active_session_id: sessionRef.id, blind_mode_enabled: false }, { merge: true });
  return sessionRef.id;
};

export const closeSession = async (sessionId: string) => {
  await updateDoc(doc(db, 'sessions', sessionId), { status: 'closed' });
  await updateDoc(globalSettingsDoc(), { active_session_id: null, blind_mode_enabled: false });
};

export const setBlindMode = async (enabled: boolean) => {
  await updateDoc(globalSettingsDoc(), { blind_mode_enabled: enabled });
};

export const updateSessionTarget = async (targetId: string, target: number) => {
  await updateDoc(doc(db, 'session_targets', targetId), { target });
};

export const saveDraftTargets = async (targets: DraftTargets) => {
  await setDoc(draftsDoc(), { targets }, { merge: true });
};

// ---------- Organisatie ----------

export const createTeam = async (name: string) => {
  await addDoc(teamsCol, { name });
};

export const updateProfile = async (profileId: string, data: Partial<Pick<Profile, 'team_id' | 'role'>>) => {
  await updateDoc(doc(db, 'profiles', profileId), data);
};

/** Verwijdert alleen het profiel (toegang tot de app); het Auth-account blijft bestaan. */
export const deleteProfile = async (profileId: string) => {
  await deleteDoc(doc(db, 'profiles', profileId));
};

const randomPassword = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, '0')).join('').slice(0, 16) + 'Aa1!';
};

/**
 * Maakt een Firebase Auth-account + profiel aan en mailt een wachtwoord-reset-link.
 * Gebruikt een tweede, tijdelijke Firebase-app zodat de admin ingelogd blijft.
 */
export const inviteUser = async (email: string, role: UserRole, teamId: string | null) => {
  const secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, randomPassword());
    const uid = credential.user.uid;
    await setDoc(doc(db, 'profiles', uid), {
      email: email.toLowerCase(),
      role,
      team_id: teamId || null,
    });
    try {
      await sendPasswordResetEmail(secondaryAuth, email);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
    }
    await firebaseSignOut(secondaryAuth);
    return uid;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw new Error((error as Error).message || 'Could not invite user');
  } finally {
    await deleteApp(secondaryApp);
  }
};
