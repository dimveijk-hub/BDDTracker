import React from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { DashboardFilter, Session, TeamStats } from '../types';
import { progressColor } from '../utils/format';
import { EyeOffIcon } from './icons';

interface Props {
  teamStats: TeamStats[];
  sessions: Session[];
  activeSessionId: string | null;
  currentFilter: DashboardFilter;
  onFilterChange: (filter: DashboardFilter) => void;
  isAdmin: boolean;
  blindMode: boolean;
}

export const DashboardStats: React.FC<Props> = ({
  teamStats,
  sessions,
  activeSessionId,
  currentFilter,
  onFilterChange,
  isAdmin,
  blindMode,
}) => {
  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const lastClosed = [...sessions]
    .filter((s) => s.status === 'closed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const sessionLabel = activeSession ? activeSession.name : lastClosed ? lastClosed.name : 'geen actieve sessie';

  // Tijdens "blind modus" ziet alleen de admin de grafiek.
  const showChart = !blindMode || isAdmin;

  const filterButton = (value: DashboardFilter, label: string) => (
    <button
      onClick={() => onFilterChange(value)}
      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
        currentFilter === value ? 'bg-white shadow-sm text-[#E62C48]' : 'text-slate-400'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="grid grid-cols-1 gap-6 mb-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Team performance index</h3>
            <p className="text-[10px] text-slate-400 font-bold mt-1">
              {currentFilter === 'laatste' ? `Sessie resultaten: ${sessionLabel}` : 'Kwartaaloverzicht'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {blindMode && (
              <span className="bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-2">
                <EyeOffIcon size={12} strokeWidth={3} />
                Blind modus
              </span>
            )}
            {isAdmin ? (
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 ml-2">
                {filterButton('laatste', 'Sessie')}
                {filterButton('kwartaal', 'Kwartaal')}
              </div>
            ) : (
              <span className="bg-red-50 text-[#E62C48] px-3 py-1.5 rounded-xl text-[10px] font-black border border-red-100">
                Sessie weergave
              </span>
            )}
          </div>
        </div>

        {showChart ? (
          <div className="h-[350px] w-full animate-in fade-in duration-700">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="teamName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#1e293b', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  unit="%"
                  domain={[0, (max: number) => Math.max(110, max + 10)]}
                />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                    padding: '12px',
                  }}
                  formatter={(value, name) =>
                    (name === 'voortgang' ? [`${Math.round(Number(value))}%`, 'Status'] : [value, name]) as [
                      React.ReactNode,
                      React.ReactNode,
                    ]
                  }
                  labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                />
                <ReferenceLine
                  y={100}
                  stroke="#cbd5e1"
                  strokeDasharray="5 5"
                  label={{ position: 'right', value: 'Target', fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                />
                <Bar dataKey="progress" name="voortgang" radius={[8, 8, 0, 0]} barSize={50}>
                  {teamStats.map((stat, index) => (
                    <Cell key={`cell-${index}`} fill={progressColor(stat.progress)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[350px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-dashed border-slate-200 animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center text-white mb-6 shadow-2xl animate-pulse">
              <EyeOffIcon size={32} strokeWidth={2.5} />
            </div>
            <h4 className="text-xl font-black text-slate-800 tracking-tight">Eindsprint in gang!</h4>
            <p className="text-slate-400 text-sm font-bold mt-2 text-center px-12">
              Resultaten tijdelijk verborgen voor extra spanning. <br /> Blijf knallen tot de bel!
            </p>
          </div>
        )}

        {showChart && (
          <div className="mt-6 flex flex-wrap gap-6 justify-center border-t border-slate-50 pt-6">
            {teamStats.map((stat, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: progressColor(stat.progress) }} />
                <span className="text-[10px] font-bold text-slate-500">
                  {stat.teamName}: {stat.totalAppointments}/{stat.totalTarget} ({Math.round(stat.progress)}%)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
