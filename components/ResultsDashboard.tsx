import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type Appointment, type Profile, type Session, type SessionTarget, type Team, UserRole } from '../types';
import { byNameNumeric, COLORS, currentQuarter, formatName, progressColor } from '../utils/format';

interface Props {
  profiles: Profile[];
  appointments: Appointment[];
  teams: Team[];
  sessions: Session[];
  sessionTargets: SessionTarget[];
}

interface PersonResult {
  name: string;
  percentage: number;
  count: number;
  target: number;
}

interface TeamResult extends PersonResult {
  activeParticipants: number;
  allMembersMetTarget: boolean;
}

const axisTick = { fill: '#94a3b8', fontSize: 11, fontWeight: 600 };
const yDomain: [number, (max: number) => number] = [0, (max) => Math.max(120, max + 20)];

export const ResultsDashboard: React.FC<Props> = ({ profiles, appointments, teams, sessions, sessionTargets }) => {
  const [mode, setMode] = useState<'laatste' | 'kwartaal'>('laatste');
  const [quarter, setQuarter] = useState(currentQuarter());

  const quarters = useMemo(() => {
    const all = new Set(sessions.map((s) => s.quarter));
    all.add(currentQuarter());
    return Array.from(all)
      .filter((q) => q >= '2025')
      .sort()
      .reverse();
  }, [sessions]);

  // De open sessie, anders de laatst afgesloten sessie.
  const latestSession = useMemo(
    () =>
      sessions.find((s) => s.status === 'open') ||
      [...sessions]
        .filter((s) => s.status === 'closed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [sessions],
  );

  const sessionsInScope = useMemo(
    () => (mode === 'laatste' ? (latestSession ? [latestSession] : []) : sessions.filter((s) => s.quarter === quarter)),
    [mode, latestSession, sessions, quarter],
  );

  const individuals = useMemo<PersonResult[]>(
    () =>
      profiles
        .filter((p) => p.role === UserRole.BELLER)
        .map((p) => {
          const participated = sessionsInScope.filter((s) =>
            sessionTargets.some((t) => t.session_id === s.id && t.user_id === p.id),
          );
          const count = appointments.filter(
            (a) => a.beller_id === p.id && participated.some((s) => s.id === a.session_id),
          ).length;
          const target = sessionTargets
            .filter((t) => t.user_id === p.id && participated.some((s) => s.id === t.session_id))
            .reduce((sum, t) => sum + t.target, 0);
          return { name: formatName(p.email), percentage: Math.round(target > 0 ? (count / target) * 100 : 0), count, target };
        })
        .filter((r) => r.target > 0)
        .sort((a, b) => b.percentage - a.percentage),
    [profiles, appointments, sessionTargets, sessionsInScope],
  );

  // Teamscore: inactieve teamleden (zonder target in een sessie) tellen niet mee.
  const teamResults = useMemo<TeamResult[]>(
    () =>
      teams
        .map((team) => {
          const members = profiles.filter((p) => p.team_id === team.id);
          let count = 0;
          let target = 0;
          let activeParticipants = 0;
          const perMember: Record<string, { apps: number; target: number }> = {};
          members.forEach((m) => {
            perMember[m.id] = { apps: 0, target: 0 };
          });
          sessionsInScope.forEach((session) => {
            members.forEach((member) => {
              const memberTarget = sessionTargets.find((t) => t.session_id === session.id && t.user_id === member.id);
              if (memberTarget) {
                const apps = appointments.filter(
                  (a) => a.session_id === session.id && a.beller_id === member.id,
                ).length;
                target += memberTarget.target;
                count += apps;
                activeParticipants++;
                perMember[member.id].target += memberTarget.target;
                perMember[member.id].apps += apps;
              }
            });
          });
          const active = Object.values(perMember).filter((m) => m.target > 0);
          return {
            name: team.name,
            percentage: Math.round(target > 0 ? (count / target) * 100 : 0),
            count,
            target,
            activeParticipants,
            allMembersMetTarget: active.length > 0 && active.every((m) => m.apps >= m.target),
          };
        })
        .filter((r) => r.target > 0)
        .sort(byNameNumeric),
    [teams, profiles, appointments, sessionTargets, sessionsInScope],
  );

  const modeButton = (value: 'laatste' | 'kwartaal', label: string) => (
    <button
      onClick={() => setMode(value)}
      className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all ${
        mode === value ? 'bg-[#E62C48] text-white shadow-lg' : 'text-white/60 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div
        className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden"
        style={{ backgroundColor: COLORS.teal }}
      >
        <div className="relative z-10">
          <h2 className="text-4xl font-black italic">Prestatie analyse</h2>
          <p className="text-[#E62C48] font-bold text-xs mt-2 flex items-center gap-2">
            Focus:{' '}
            {mode === 'laatste' ? `Laatste sessie (${latestSession?.name || 'geen data'})` : `Alle sessies in ${quarter}`}
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          {mode === 'kwartaal' && (
            <select
              value={quarter}
              onChange={(e) => setQuarter(e.target.value)}
              className="bg-black/20 text-white px-4 py-3 rounded-xl border border-white/10 text-xs font-black outline-none focus:ring-2 focus:ring-[#E62C48]"
            >
              {quarters.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          )}
          <div className="flex bg-black/20 p-1.5 rounded-2xl border border-white/10">
            {modeButton('laatste', 'Laatste sessie')}
            {modeButton('kwartaal', 'Kwartaal')}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800">Individuele ranking</h3>
              <p className="text-slate-400 font-bold text-sm mt-1">
                {mode === 'kwartaal'
                  ? 'Ranking op basis van gemiddelde target behaald dit kwartaal'
                  : `Resultaten van de sessie: ${latestSession?.name || 'onbekend'}`}
              </p>
            </div>
          </div>
          <div className="w-full h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={individuals} margin={{ top: 40, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 800 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} unit="%" domain={yDomain} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const row = payload[0].payload as PersonResult;
                    return (
                      <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                        <p className="font-bold text-slate-800 mb-2">{row.name}</p>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-500">
                            Gemaakt / Target:{' '}
                            <span className="text-[#E62C48]">
                              {row.count} / {row.target}
                            </span>
                          </p>
                          <p className="text-xs font-bold text-slate-500">
                            Percentage: <span className="text-[#8DBC65]">{row.percentage}%</span>
                          </p>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine
                  y={100}
                  stroke="#ef4444"
                  strokeDasharray="8 8"
                  strokeWidth={2}
                  label={{ position: 'top', value: 'Target', fill: '#ef4444', fontSize: 10, fontWeight: 900 }}
                />
                <Bar dataKey="percentage" radius={[12, 12, 0, 0]} barSize={40}>
                  {individuals.map((row, index) => (
                    <Cell key={`cell-${index}`} fill={progressColor(row.percentage)} />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="top"
                    formatter={(value: unknown) => `${value}%`}
                    style={{ fill: '#1e293b', fontWeight: 900, fontSize: '11px' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-2xl font-black text-slate-800 mb-4 text-center">Team competitie</h3>
          <p className="text-[10px] text-center font-black text-slate-400 mb-10">
            Eerlijke berekening: Inactieve teamleden in een sessie beïnvloeden de kwartaalscore niet.
          </p>
          <div className="w-full h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamResults} margin={{ top: 40, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1e293b', fontSize: 14, fontWeight: 800 }}
                />
                <YAxis axisLine={false} tickLine={false} tick={axisTick} unit="%" domain={yDomain} />
                <Bar dataKey="percentage" radius={[12, 12, 0, 0]} barSize={60}>
                  {teamResults.map((row, index) => (
                    // Groen alleen als het team de 100% haalt én elk actief teamlid zijn eigen target haalde.
                    <Cell
                      key={`cell-team-${index}`}
                      fill={row.percentage >= 100 && row.allMembersMetTarget ? COLORS.green : COLORS.red}
                    />
                  ))}
                  <LabelList
                    dataKey="percentage"
                    position="top"
                    content={(props) => {
                      const { x, y, width, index } = props as unknown as { x: number; y: number; width: number; index: number };
                      const row = teamResults[index];
                      return (
                        <text
                          x={Number(x) + Number(width) / 2}
                          y={Number(y) - 10}
                          fill="#1e293b"
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={900}
                        >
                          {row.count}/{row.target}
                        </text>
                      );
                    }}
                  />
                </Bar>
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="8 8" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
