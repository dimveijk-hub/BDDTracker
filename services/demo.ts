import type {
  Appointment,
  AppSettings,
  DraftTargets,
  Profile,
  Session,
  SessionTarget,
  Team,
} from '../types';
import { UserRole } from '../types';

/**
 * In-memory implementatie van de data-API, alleen voor lokaal ontwikkelen/testen
 * (`npm run dev:demo`). Heeft dezelfde exports als services/firestore.ts.
 * Inloggen kan met een van de demo-adressen en een willekeurig wachtwoord.
 */

type Listener<T> = (value: T) => void;

class Store<T> {
  private listeners = new Set<Listener<T>>();
  constructor(private value: T) {}
  get() {
    return this.value;
  }
  set(next: T) {
    this.value = next;
    this.listeners.forEach((l) => l(next));
  }
  subscribe(listener: Listener<T>) {
    this.listeners.add(listener);
    queueMicrotask(() => this.listeners.has(listener) && listener(this.value));
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// ---------- Seed ----------

const seedTeams: Team[] = [
  { id: 't1', name: 'Team 1' },
  { id: 't2', name: 'Team 2' },
  { id: 't3', name: 'Team 3' },
];

const seedProfiles: Profile[] = [
  { id: 'admin', email: 'admin@saleswise.eu', role: UserRole.ADMIN, team_id: null },
  { id: 'u1', email: 'mark.visser@saleswise.eu', role: UserRole.BELLER, team_id: 't1' },
  { id: 'u2', email: 'lisa.de-vries@saleswise.eu', role: UserRole.BELLER, team_id: 't1' },
  { id: 'u3', email: 'emma.bakker@saleswise.eu', role: UserRole.BELLER, team_id: 't1' },
  { id: 'u4', email: 'daan.smit@saleswise.eu', role: UserRole.BELLER, team_id: 't2' },
  { id: 'u5', email: 'sophie.mulder@saleswise.eu', role: UserRole.BELLER, team_id: 't2' },
  { id: 'u6', email: 'stefan.bos@saleswise.eu', role: UserRole.BELLER, team_id: 't2' },
  { id: 'u7', email: 'lars.dekker@saleswise.eu', role: UserRole.BELLER, team_id: 't3' },
  { id: 'u8', email: 'tessa.jansen@saleswise.eu', role: UserRole.BELLER, team_id: 't3' },
  { id: 'u9', email: 'rick.peters@saleswise.eu', role: UserRole.BELLER, team_id: null },
];

const seedSessions: Session[] = [
  { id: 's1', date: '2026-01-14', status: 'closed', name: 'Januari', quarter: '2026-Q1' },
  { id: 's2', date: '2026-02-11', status: 'closed', name: 'Februari', quarter: '2026-Q1' },
];

const customers = ['Philips', 'ASML', 'Shell', 'Coolblue', 'Adyen', 'Booking.com', 'Just Eat', 'KPN', 'Rabobank', 'ING'];

const seedTargets: SessionTarget[] = [];
const seedAppointments: Appointment[] = [];

// Vaste "resultaten" per beller per sessie, zodat de demo reproduceerbaar is.
const seedScores: Record<string, Record<string, [target: number, actual: number]>> = {
  s1: { u1: [15, 16], u2: [15, 15], u3: [15, 18], u4: [15, 22], u5: [15, 6], u6: [15, 5], u7: [20, 8], u8: [20, 12], u9: [15, 9] },
  s2: { u1: [15, 15], u2: [15, 17], u3: [15, 15], u4: [15, 40], u5: [15, 5], u6: [15, 5], u7: [20, 5], u8: [20, 20], u9: [15, 11] },
};

for (const session of seedSessions) {
  for (const [userId, [target, actual]] of Object.entries(seedScores[session.id])) {
    seedTargets.push({ id: `st-${session.id}-${userId}`, session_id: session.id, user_id: userId, target });
    for (let i = 0; i < actual; i++) {
      seedAppointments.push({
        id: `a-${session.id}-${userId}-${i}`,
        beller_id: userId,
        session_id: session.id,
        customer_name: `${customers[(i + userId.length * 3) % customers.length]} ${i + 1}`,
        appointment_date: session.date,
        created_at: `${session.date}T${String(10 + (i % 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00.000Z`,
      });
    }
  }
}

// ---------- State ----------

const teams = new Store<Team[]>(seedTeams);
const profiles = new Store<Profile[]>(seedProfiles);
const sessions = new Store<Session[]>(seedSessions);
const targets = new Store<SessionTarget[]>(seedTargets);
const appointments = new Store<Appointment[]>(seedAppointments);
const settings = new Store<AppSettings>({ active_session_id: null, blind_mode_enabled: false });
const drafts = new Store<DraftTargets>({});
const currentUid = new Store<string | null>(null);

const newId = () => Math.random().toString(36).slice(2, 11);
const sortSessions = (list: Session[]) => [...list].sort((a, b) => b.date.localeCompare(a.date));
const sortAppointments = (list: Appointment[]) => [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));

// ---------- Auth ----------

export const onAuthChange = (callback: (user: { uid: string } | null) => void) =>
  currentUid.subscribe((uid) => callback(uid ? { uid } : null));

export const signIn = async (email: string) => {
  const profile = profiles.get().find((p) => p.email === email.trim().toLowerCase());
  if (!profile) throw new Error('Demo-modus: onbekend e-mailadres (probeer admin@saleswise.eu).');
  currentUid.set(profile.id);
};

export const signOut = async () => currentUid.set(null);

export const getCurrentUid = () => currentUid.get();

export const fetchProfile = async (uid: string) => profiles.get().find((p) => p.id === uid) ?? null;

// ---------- Live data ----------

export const subscribeTeams = (cb: Listener<Team[]>) => teams.subscribe(cb);
export const subscribeProfiles = (cb: Listener<Profile[]>) => profiles.subscribe(cb);
export const subscribeSessions = (cb: Listener<Session[]>) => sessions.subscribe((v) => cb(sortSessions(v)));
export const subscribeSessionTargets = (cb: Listener<SessionTarget[]>) => targets.subscribe(cb);
export const subscribeAppointments = (cb: Listener<Appointment[]>) =>
  appointments.subscribe((v) => cb(sortAppointments(v)));
export const subscribeSettings = (cb: Listener<AppSettings>) => settings.subscribe(cb);
export const subscribeDraftTargets = (cb: Listener<DraftTargets>) => drafts.subscribe(cb);

// ---------- Mutaties ----------

export const addAppointment = async (bellerId: string, sessionId: string, customerName: string, appointmentDate: string) => {
  appointments.set([
    ...appointments.get(),
    {
      id: newId(),
      beller_id: bellerId,
      session_id: sessionId,
      customer_name: customerName,
      appointment_date: appointmentDate,
      created_at: new Date().toISOString(),
    },
  ]);
};

export const startNewSession = async (name: string, quarter: string, newTargets: { userId: string; target: number }[]) => {
  const id = newId();
  sessions.set([
    ...sessions.get(),
    { id, date: new Date().toISOString().split('T')[0], status: 'open', name, quarter },
  ]);
  targets.set([
    ...targets.get(),
    ...newTargets.map((t) => ({ id: newId(), session_id: id, user_id: t.userId, target: t.target })),
  ]);
  settings.set({ active_session_id: id, blind_mode_enabled: false });
  return id;
};

export const closeSession = async (sessionId: string) => {
  sessions.set(sessions.get().map((s) => (s.id === sessionId ? { ...s, status: 'closed' as const } : s)));
  settings.set({ active_session_id: null, blind_mode_enabled: false });
};

export const setBlindMode = async (enabled: boolean) => {
  settings.set({ ...settings.get(), blind_mode_enabled: enabled });
};

export const updateSessionTarget = async (targetId: string, target: number) => {
  targets.set(targets.get().map((t) => (t.id === targetId ? { ...t, target } : t)));
};

export const saveDraftTargets = async (value: DraftTargets) => {
  drafts.set(value);
};

export const createTeam = async (name: string) => {
  teams.set([...teams.get(), { id: newId(), name }]);
};

export const updateProfile = async (profileId: string, data: Partial<Pick<Profile, 'team_id' | 'role'>>) => {
  profiles.set(profiles.get().map((p) => (p.id === profileId ? { ...p, ...data } : p)));
};

export const deleteProfile = async (profileId: string) => {
  profiles.set(profiles.get().filter((p) => p.id !== profileId));
};

export const inviteUser = async (email: string, role: UserRole, teamId: string | null) => {
  const id = newId();
  profiles.set([...profiles.get(), { id, email: email.toLowerCase(), role, team_id: teamId || null }]);
  return id;
};
