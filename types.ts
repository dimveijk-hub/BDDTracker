export enum UserRole {
  ADMIN = 'admin',
  BELLER = 'beller',
}

export interface Team {
  id: string;
  name: string;
}

/** Document in `profiles/{auth uid}`. */
export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'open' | 'closed';
  name: string;
  quarter: string; // bijv. "2026-Q1"
}

export interface SessionTarget {
  id?: string;
  session_id: string;
  user_id: string;
  target: number;
}

export interface Appointment {
  id: string;
  beller_id: string;
  session_id: string;
  customer_name: string;
  appointment_date: string; // YYYY-MM-DD
  created_at: string; // ISO timestamp
}

/** Document `settings/global`. */
export interface AppSettings {
  active_session_id: string | null;
  blind_mode_enabled: boolean;
}

/** Concept-targets voor een nieuwe sessie, document `settings/drafts`. */
export type DraftTargets = Record<string, { active: boolean; target: number }>;

export interface TeamStats {
  teamName: string;
  totalAppointments: number;
  totalTarget: number;
  progress: number;
}

export type DashboardFilter = 'laatste' | 'kwartaal';
