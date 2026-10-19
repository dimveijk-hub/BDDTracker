export const COLORS = {
  red: '#E62C48',
  teal: '#074750',
  green: '#8DBC65',
  yellow: '#F6EC3A',
} as const;

/** "jan.jansen@saleswise.eu" -> "Jan Jansen" */
export const formatName = (email?: string): string =>
  email
    ? email
        .split('@')[0]
        .split(/[._-]/)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ')
    : 'Onbekend';

/** Groen vanaf 100%, geel vanaf 50%, anders rood. */
export const progressColor = (percentage: number): string =>
  percentage >= 100 ? COLORS.green : percentage >= 50 ? COLORS.yellow : COLORS.red;

/** Huidig kwartaal als "2026-Q1" (vóór 2025 wordt 2025 gebruikt). */
export const currentQuarter = (): string => {
  const now = new Date();
  const year = now.getFullYear() < 2025 ? 2025 : now.getFullYear();
  return `${year}-Q${Math.floor(now.getMonth() / 3) + 1}`;
};

export const MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December',
];

export const currentMonthName = (): string => MONTHS[new Date().getMonth()];

export const byNameNumeric = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
