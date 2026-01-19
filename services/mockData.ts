
import { UserRole, Profile, Team, Appointment, AppSettings, Session, SessionTarget } from '../types';

export const MOCK_TEAMS: Team[] = [
  { id: 't1', name: 'Team Alpha' },
  { id: 't2', name: 'Team Beta' },
  { id: 't3', name: 'Team Gamma' }
];

// 3 Bellers per team + 1 Admin
export let MOCK_PROFILES: Profile[] = [
  { id: 'admin', email: 'admin@salesflow.nl', role: UserRole.ADMIN, team_id: null },
  // Team Alpha (Perfecte score scenario)
  { id: 'u1', email: 'mark@alpha.nl', role: UserRole.BELLER, team_id: 't1' },
  { id: 'u2', email: 'lisa@alpha.nl', role: UserRole.BELLER, team_id: 't1' },
  { id: 'u3', email: 'emma@alpha.nl', role: UserRole.BELLER, team_id: 't1' },
  // Team Beta (Team gehaald, individu niet scenario)
  { id: 'u4', email: 'daan@beta.nl', role: UserRole.BELLER, team_id: 't2' },
  { id: 'u5', email: 'sophie@beta.nl', role: UserRole.BELLER, team_id: 't2' },
  { id: 'u6', email: 'stefan@beta.nl', role: UserRole.BELLER, team_id: 't2' },
  // Team Gamma (Onder target scenario)
  { id: 'u7', email: 'lars@gamma.nl', role: UserRole.BELLER, team_id: 't3' },
  { id: 'u8', email: 'tessa@gamma.nl', role: UserRole.BELLER, team_id: 't3' },
  { id: 'u9', email: 'rick@gamma.nl', role: UserRole.BELLER, team_id: 't3' },
];

// Historie van 3 sessies in Q4 2024
export let MOCK_SESSIONS: Session[] = [
  { id: 's-q4-1', date: '2024-10-12', status: 'closed', name: 'Oktober Blitz', quarter: '2024-Q4' },
  { id: 's-q4-2', date: '2024-11-15', status: 'closed', name: 'November Focus', quarter: '2024-Q4' },
  { id: 's-q4-3', date: '2024-12-10', status: 'closed', name: 'Eindejaars Sprint', quarter: '2024-Q4' }
];

export let MOCK_SESSION_TARGETS: SessionTarget[] = [];
export let MOCK_APPOINTMENTS: Appointment[] = [];
const customers = ['Philips', 'ASML', 'Shell', 'Coolblue', 'Adyen', 'Booking.com', 'Just Eat', 'KPN', 'Rabobank', 'ING'];

// We configureren de laatste sessie (Eindejaars Sprint) specifiek voor de demo
MOCK_SESSIONS.forEach(session => {
  const isDemoSession = session.id === 's-q4-3';

  MOCK_PROFILES.filter(p => p.role === UserRole.BELLER).forEach(p => {
    let target = 15;
    let actual = 10;

    if (isDemoSession) {
      if (p.team_id === 't1') {
        // Team Alpha: Iedereen haalt exact target (15/15)
        target = 15;
        actual = 16; 
      } else if (p.team_id === 't2') {
        // Team Beta: Daan compenseert voor Sophie en Stefan
        if (p.id === 'u4') { target = 15; actual = 40; } // Daan knalt
        if (p.id === 'u5') { target = 15; actual = 5; }  // Sophie mist
        if (p.id === 'u6') { target = 15; actual = 5; }  // Stefan mist
        // Totaal team: 50 behaald op 45 target (GEHAALD), maar niet alle individuen.
      } else {
        target = 20;
        actual = 5;
      }
    } else {
      // Willekeurige data voor oudere sessies
      target = 15 + Math.floor(Math.random() * 5);
      actual = Math.floor(target * (0.5 + Math.random() * 0.7));
    }

    // Voeg targets toe
    MOCK_SESSION_TARGETS.push({
      session_id: session.id,
      user_id: p.id,
      target: target
    });

    // Voeg afspraken toe
    for (let i = 0; i < actual; i++) {
      MOCK_APPOINTMENTS.push({
        id: `a-${session.id}-${p.id}-${i}`,
        beller_id: p.id,
        session_id: session.id,
        customer_name: customers[Math.floor(Math.random() * customers.length)] + ' ' + (i + 1),
        appointment_date: new Date(new Date(session.date).getTime() + (7 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
        created_at: `${session.date}T${10 + Math.floor(Math.random() * 6)}:${Math.floor(Math.random() * 60)}:00Z`
      });
    }
  });
});

export let MOCK_SETTINGS: AppSettings = {
  active_session_id: null
};

export const startNewSession = (name: string, quarter: string, targets: {userId: string, target: number}[]) => {
  const sessionId = 's' + (MOCK_SESSIONS.length + 1);
  const newSession: Session = {
    id: sessionId,
    date: new Date().toISOString().split('T')[0],
    status: 'open',
    name,
    quarter
  };
  
  MOCK_SESSIONS.push(newSession);
  targets.forEach(t => {
    MOCK_SESSION_TARGETS.push({ session_id: sessionId, user_id: t.userId, target: t.target });
  });
  
  MOCK_SETTINGS.active_session_id = sessionId;
  return { session: newSession, settings: MOCK_SETTINGS };
};

export const closeActiveSession = () => {
  if (MOCK_SETTINGS.active_session_id) {
    const session = MOCK_SESSIONS.find(s => s.id === MOCK_SETTINGS.active_session_id);
    if (session) session.status = 'closed';
    MOCK_SETTINGS.active_session_id = null;
  }
  return MOCK_SETTINGS;
};

export const addAppointment = (bellerId: string, sessionId: string, customer: string, date: string) => {
  const newApp: Appointment = {
    id: Math.random().toString(36).substr(2, 9),
    beller_id: bellerId,
    session_id: sessionId,
    customer_name: customer,
    appointment_date: date,
    created_at: new Date().toISOString()
  };
  MOCK_APPOINTMENTS = [newApp, ...MOCK_APPOINTMENTS];
  return newApp;
};
