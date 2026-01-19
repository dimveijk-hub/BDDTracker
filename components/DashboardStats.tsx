
import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, CartesianGrid, Cell } from 'recharts';
import { TeamStats, Session } from '../types';

interface DashboardStatsProps {
  teamStats: TeamStats[];
  sessions: Session[];
  activeSessionId: string | null;
  onFilterChange: (type: 'laatste' | 'kwartaal') => void;
  currentFilter: 'laatste' | 'kwartaal';
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ 
  teamStats, 
  sessions, 
  activeSessionId, 
  onFilterChange, 
  currentFilter 
}) => {
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const lastClosedSession = [...sessions]
    .filter(s => s.status === 'closed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const relevantSessionName = activeSession ? activeSession.name : (lastClosedSession ? lastClosedSession.name : 'Geen actieve sessie');

  return (
    <div className="grid grid-cols-1 gap-6 mb-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Team Performance Index</h3>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">
              {currentFilter === 'laatste' ? `Focus: ${relevantSessionName}` : 'Focus: Volledig Kwartaal (Cumulatief)'}
            </p>
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start">
            <button 
              onClick={() => onFilterChange('laatste')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === 'laatste' ? 'bg-white text-[#e72b47] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Sessie
            </button>
            <button 
              onClick={() => onFilterChange('kwartaal')}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${currentFilter === 'kwartaal' ? 'bg-white text-[#e72b47] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Kwartaal
            </button>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={teamStats} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="teamName" 
                axisLine={false}
                tickLine={false}
                tick={{fill: '#1e293b', fontSize: 11, fontWeight: 800}}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{fill: '#94a3b8', fontSize: 10}}
                unit="%"
                domain={[0, (dataMax: number) => Math.max(110, dataMax + 10)]}
              />
              <Tooltip 
                cursor={{fill: '#f8fafc'}}
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                formatter={(value: number, name: string) => {
                  if (name === 'Voortgang') return [`${Math.round(value)}%`, 'Status'];
                  return [value, name];
                }}
                labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#1e293b' }}
                itemStyle={{fontSize: '11px', fontWeight: 700, textTransform: 'uppercase'}}
              />
              <ReferenceLine 
                y={100} 
                stroke="#cbd5e1" 
                strokeDasharray="5 5" 
                label={{ position: 'right', value: 'TARGET', fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
              />
              <Bar 
                dataKey="progress" 
                name="Voortgang" 
                radius={[8, 8, 0, 0]} 
                barSize={50}
              >
                {teamStats.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.progress >= 100 ? '#10b981' : '#e72b47'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6 flex flex-wrap gap-6 justify-center border-t border-slate-50 pt-6">
          {teamStats.map((team, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${team.progress >= 100 ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black text-slate-500 uppercase">
                {team.teamName}: {team.totalAppointments}/{team.totalTarget} ({Math.round(team.progress)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
