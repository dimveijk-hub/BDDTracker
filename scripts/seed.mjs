// Vult een TEST-Firebase-project met voorbeelddata en testgebruikers.
//
//   export GOOGLE_APPLICATION_CREDENTIALS=/pad/naar/service-account.json   (uit de Firebase Console, TEST-project)
//   SEED_PASSWORD='min-8-tekens' npm run seed
//
// Weigert te draaien op het productieproject.
import { readFileSync } from 'node:fs';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const PRODUCTION_PROJECT_ID = 'saleswisetracker';

const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const password = process.env.SEED_PASSWORD;
if (!credentialsPath || !password || password.length < 8) {
  console.error('Zet GOOGLE_APPLICATION_CREDENTIALS (service-account.json) en SEED_PASSWORD (min. 8 tekens).');
  process.exit(1);
}

const projectId = JSON.parse(readFileSync(credentialsPath, 'utf8')).project_id;
if (projectId === PRODUCTION_PROJECT_ID) {
  console.error(`Geweigerd: "${projectId}" is het PRODUCTIE-project. Gebruik een apart test-project.`);
  process.exit(1);
}

initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth();
const db = getFirestore();
console.log(`Seeden van test-project "${projectId}"...`);

const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@saleswise.eu';

const teams = [
  { id: 't1', name: 'Team 1' },
  { id: 't2', name: 'Team 2' },
  { id: 't3', name: 'Team 3' },
];

const people = [
  { email: adminEmail, role: 'admin', team_id: null },
  { email: 'mark.visser@saleswise.eu', role: 'beller', team_id: 't1' },
  { email: 'lisa.de-vries@saleswise.eu', role: 'beller', team_id: 't1' },
  { email: 'emma.bakker@saleswise.eu', role: 'beller', team_id: 't1' },
  { email: 'daan.smit@saleswise.eu', role: 'beller', team_id: 't2' },
  { email: 'sophie.mulder@saleswise.eu', role: 'beller', team_id: 't2' },
  { email: 'stefan.bos@saleswise.eu', role: 'beller', team_id: 't2' },
  { email: 'lars.dekker@saleswise.eu', role: 'beller', team_id: 't3' },
  { email: 'tessa.jansen@saleswise.eu', role: 'beller', team_id: 't3' },
  { email: 'rick.peters@saleswise.eu', role: 'beller', team_id: null },
];

const sessions = [
  { id: 's1', date: '2026-01-14', status: 'closed', name: 'Januari', quarter: '2026-Q1' },
  { id: 's2', date: '2026-02-11', status: 'closed', name: 'Februari', quarter: '2026-Q1' },
];

// [target, behaald] per beller (op volgorde van `people`, zonder admin)
const scores = {
  s1: [[15, 16], [15, 15], [15, 18], [15, 22], [15, 6], [15, 5], [20, 8], [20, 12], [15, 9]],
  s2: [[15, 15], [15, 17], [15, 15], [15, 40], [15, 5], [15, 5], [20, 5], [20, 20], [15, 11]],
};
const customers = ['Philips', 'ASML', 'Shell', 'Coolblue', 'Adyen', 'Booking.com', 'Just Eat', 'KPN', 'Rabobank', 'ING'];

// Auth-gebruikers + profielen
const uids = [];
for (const person of people) {
  let user;
  try {
    user = await auth.getUserByEmail(person.email);
    await auth.updateUser(user.uid, { password });
  } catch {
    user = await auth.createUser({ email: person.email, password });
  }
  uids.push(user.uid);
  await db.doc(`profiles/${user.uid}`).set({ email: person.email, role: person.role, team_id: person.team_id });
}

for (const team of teams) await db.doc(`teams/${team.id}`).set({ name: team.name });

for (const session of sessions) {
  const { id, ...data } = session;
  await db.doc(`sessions/${id}`).set(data);
  for (const [index, [target, actual]] of scores[id].entries()) {
    const userId = uids[index + 1];
    await db.doc(`session_targets/${id}-${userId}`).set({ session_id: id, user_id: userId, target });
    for (let i = 0; i < actual; i++) {
      await db.collection('appointments').add({
        beller_id: userId,
        session_id: id,
        customer_name: `${customers[(i + index) % customers.length]} ${i + 1}`,
        appointment_date: session.date,
        created_at: `${session.date}T${String(10 + (i % 6)).padStart(2, '0')}:${String((i * 7) % 60).padStart(2, '0')}:00.000Z`,
      });
    }
  }
}

await db.doc('settings/global').set({ active_session_id: null, blind_mode_enabled: false });
console.log(`Klaar: ${people.length} gebruikers, ${teams.length} teams, ${sessions.length} sessies. Admin: ${adminEmail}`);
