
export enum UserRole {
  ADMIN = 'admin',
  BELLER = 'beller'
}

export interface Team {
  id: string;
  name: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  team_id: string | null;
}

export interface Session {
  id: string;
  date: string;
  status: 'open' | 'closed';
  name: string;
  quarter: string; // Bijv: "2024-Q1"
}

export interface SessionTarget {
  session_id: string;
  user_id: string;
  target: number;
}

export interface Appointment {
  id: string;
  beller_id: string;
  session_id: string;
  customer_name: string;
  appointment_date: string;
  created_at: string;
}

export interface AppSettings {
  active_session_id: string | null;
}

export interface TeamStats {
  teamName: string;
  totalAppointments: number;
  totalTarget: number;
  progress: number;
}
