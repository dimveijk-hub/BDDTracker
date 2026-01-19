
import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, LabelList, CartesianGrid, Cell } from 'recharts';
import { Profile, Appointment, Team, Session, SessionTarget } from '../types';

interface ResultsDashboardProps {
  profiles: Profile[];
  appointments: Appointment[];
  teams: Team[];
  sessions: Session[];
  sessionTargets: SessionTarget[];
}

const getCurrentQuarter = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
};

export const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ profiles, appointments, teams, sessions, sessionTargets }) => {
  const [timeFrame, setTimeFrame] = useState<'laatste' | 'kwartaal'>('laatste');
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());

  const availableQuarters = useMemo(() => {
    const qs = new Set(sessions.map(s => s.quarter));
    qs.add(getCurrentQuarter());
    return Array.from(qs).sort().reverse();
  }, [sessions]);

  const lastRelevantSession = useMemo(() => {
    const active = sessions.find(s => s.status === 'open');
    if (active) return active;
    
    return [...sessions]
      .filter(s => s.status === 'closed')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [sessions]);

  const bellerData = useMemo(() => {
    return profiles.filter(p => p.role === 'beller').map(p => {
      let relevantSessions: Session[] = [];
      
      if (timeFrame === 'laatste') {
        relevantSessions = lastRelevantSession ? [lastRelevantSession] : [];
      } else {
        relevantSessions = sessions.filter(s => s.quarter === selectedQuarter);
      }

      const totalAppointments = appointments.filter(a => 
        a.beller_id === p.id && relevantSessions.some(s => s.id === a.session_id)
      ).length;

      const totalTarget = sessionTargets
        .filter(st => st.user_id === p.id && relevantSessions.some(s => s.id === st.session_id))
        .reduce((sum, st) => sum + st.target, 0);

      const percentage = totalTarget > 0 ? (totalAppointments / totalTarget) * 100 : 0;
      
      return {
        name: p.email.split('@')[0],
        percentage: Math.round(percentage),
        count: totalAppointments,
        target: totalTarget
      };
    }).filter(d => d.target > 0).sort((a, b) => b.percentage - a.percentage);
  }, [profiles, appointments, sessions, sessionTargets, timeFrame, selectedQuarter, lastRelevantSession]);

  const teamData = useMemo(() => {
    return teams.map(team => {
      let relevantSessions: Session[] = [];
      
      if (timeFrame === 'laatste') {
        relevantSessions = lastRelevantSession ? [lastRelevantSession] : [];
      } else {
        relevantSessions = sessions.filter(s => s.quarter === selectedQuarter);
      }

      const teamBellers = profiles.filter(p => p.team_id === team.id);
      
      const totalAppointments = appointments.filter(a => 
        teamBellers.some(b => b.id === a.beller_id) && relevantSessions.some(s => s.id === a.session_id)
      ).length;

      const totalTarget = sessionTargets
        .filter(st => teamBellers.some(b => b.id === st.user_id) && relevantSessions.some(s => s.id === st.session_id))
        .reduce((sum, st) => sum + st.target, 0);

      const allIndividualsMetTarget = teamBellers.every(beller => {
        const bellerAppts = appointments.filter(a => 
          a.beller_id === beller.id && relevantSessions.some(s => s.id === a.session_id)
        ).length;
        const bellerTarget = sessionTargets
          .filter(st => st.user_id === beller.id && relevantSessions.some(s => s.id === st.session_id))
          .reduce((sum, st) => sum + st.target, 0);
        
        return bellerTarget === 0 || bellerAppts >= bellerTarget;
      });

      const teamTargetMet = totalTarget > 0 && totalAppointments >= totalTarget;
      const isPerfectScore = teamTargetMet && allIndividualsMetTarget;

      const percentage = totalTarget > 0 ? (totalAppointments / totalTarget) * 100 : 0;

      return {
        name: team.name,
        percentage: Math.round(percentage),
        count: totalAppointments,
        target: totalTarget,
        isPerfectScore
      };
    }).filter(d => d.target > 0).sort((a, b) => b.percentage - a.percentage);
  }, [teams, profiles, appointments, sessions, sessionTargets, timeFrame, selectedQuarter, lastRelevantSession]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">Prestatie Analyse</h2>
          <p className="text-red-400 font-bold uppercase tracking-[0.3em] text-xs mt-2 flex items-center gap-2">
            Focus: {timeFrame === 'laatste' 
              ? `Laatste Sessie (${lastRelevantSession?.name || 'Geen data'})` 
              : `Alle Sessies in ${selectedQuarter}`}
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 relative z-10">
          {timeFrame === 'kwartaal' && (
            <select 
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className="bg-slate-800 text-white px-4 py-3 rounded-xl border border-slate-700 text-xs font-black uppercase outline-none focus:ring-2 focus:ring-[#e72b47]"
            >
              {availableQuarters.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
          )}
          <div className="flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700">
            <button onClick={() => setTimeFrame('laatste')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFrame === 'laatste' ? 'bg-[#e72b47] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Laatste Sessie</button>
            <button onClick={() => setTimeFrame('kwartaal')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${timeFrame === 'kwartaal' ? 'bg-[#e72b47] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Kwartaal</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12">
        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
           <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Performance Ranking</h3>
              <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">
                {timeFrame === 'kwartaal' ? 'Gecumuleerde score op basis van bevroren targets' : `Resultaten van de sessie: ${lastRelevantSession?.name || 'Onbekend'}`}
              </p>
            </div>
          </div>
          
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bellerData} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 14, fontWeight: 800}} dy={20} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} unit="%" />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
                />
                <ReferenceLine y={100} stroke="#ef4444" strokeDasharray="8 8" strokeWidth={2} />
                <Bar dataKey="percentage" radius={[12, 12, 0, 0]} barSize={60}>
                  {bellerData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.percentage >= 100 ? '#10b981' : '#e72b47'} />
                  ))}
                  <LabelList dataKey="percentage" position="top" formatter={(val: number) => `${val}%`} style={{ fill: '#1e293b', fontWeight: 900 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm">
           <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 text-center">Team Competitie</h3>
           <p className="text-[10px] text-center font-black uppercase tracking-widest text-slate-400 mb-8">
             Balk kleurt groen als <span className="text-emerald-600">team target</span> + <span className="text-emerald-600">elk beller target</span> is behaald.
           </p>
           <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={teamData} layout="vertical" margin={{ left: 20, right: 50 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#1e293b', fontSize: 14, fontWeight: 800}} width={120} />
                <Bar dataKey="percentage" radius={[0, 12, 12, 0]} barSize={40}>
                  {teamData.map((entry, index) => (
                    <Cell key={`cell-team-${index}`} fill={entry.isPerfectScore ? '#059669' : '#e72b47'} />
                  ))}
                  <LabelList dataKey="percentage" position="right" formatter={(val: number) => `${val}%`} style={{ fill: '#1e293b', fontWeight: 900 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>
    </div>
  );
};
