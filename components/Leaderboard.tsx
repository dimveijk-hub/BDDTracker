
import React, { useState, useMemo } from 'react';
import { Profile, Appointment, Team, SessionTarget } from '../types';
import { MOCK_TEAMS } from '../services/mockData';

interface LeaderboardProps {
  profiles: Profile[];
  appointments: Appointment[];
  sessionTargets: SessionTarget[];
}

type ViewType = 'personal' | 'team';
type TimeFrame = 'quarter' | 'beldag';

export const Leaderboard: React.FC<LeaderboardProps> = ({ profiles, appointments, sessionTargets }) => {
  const [viewType, setViewType] = useState<ViewType>('personal');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('quarter');

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = useMemo(() => {
    if (timeFrame === 'beldag') {
      return appointments.filter(a => a.created_at.startsWith(todayStr));
    }
    return appointments;
  }, [appointments, timeFrame, todayStr]);

  const stats = useMemo(() => {
    if (viewType === 'personal') {
      return profiles
        .filter(p => p.role === 'beller')
        .map(p => {
          const count = filteredAppointments.filter(a => a.beller_id === p.id).length;
          
          const relevantSessionIds = Array.from(new Set(filteredAppointments.map(a => a.session_id)));
          const target = sessionTargets
            .filter(st => st.user_id === p.id && (timeFrame === 'quarter' ? true : relevantSessionIds.includes(st.session_id)))
            .reduce((sum, st) => sum + st.target, 0) || 1;

          return { id: p.id, name: p.email.split('@')[0], count, target };
        })
        .sort((a, b) => b.count - a.count);
    } else {
      return MOCK_TEAMS.map(team => {
        const teamBellers = profiles.filter(p => p.team_id === team.id);
        const count = filteredAppointments.filter(a => 
          teamBellers.some(b => b.id === a.beller_id)
        ).length;
        
        const relevantSessionIds = Array.from(new Set(filteredAppointments.map(a => a.session_id)));
        const teamTarget = sessionTargets
          .filter(st => teamBellers.some(b => b.id === st.user_id) && (timeFrame === 'quarter' ? true : relevantSessionIds.includes(st.session_id)))
          .reduce((sum, st) => sum + st.target, 0) || 1;

        return { id: team.id, name: team.name, count, target: teamTarget };
      })
      .sort((a, b) => b.count - a.count);
    }
  }, [viewType, filteredAppointments, profiles, sessionTargets, timeFrame]);

  // Helper om de kleur van de voortgangsbalk te bepalen
  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-emerald-500'; // Groen
    if (percent >= 75) return 'bg-orange-500';  // Oranje (zoals gevraagd 75-99%)
    if (percent >= 50) return 'bg-orange-400';  // Lichter oranje voor 50-74%
    return 'bg-red-500';                         // Rood (< 50%)
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all">
      <div className="bg-slate-900 px-6 py-5 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#e72b47] p-2 rounded-lg shadow-lg shadow-red-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none tracking-tight">Top Performers</h3>
              <p className="text-slate-400 text-xs font-medium mt-1 uppercase tracking-wider italic">Real-time Ranking</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-red-400 leading-none">{filteredAppointments.length}</span>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Hits</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex bg-slate-200/60 p-1 rounded-xl">
          <button 
            onClick={() => setViewType('personal')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${viewType === 'personal' ? 'bg-white text-[#e72b47] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Personen
          </button>
          <button 
            onClick={() => setViewType('team')}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${viewType === 'team' ? 'bg-white text-[#e72b47] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Teams
          </button>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setTimeFrame('quarter')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${timeFrame === 'quarter' ? 'bg-red-50 border-red-200 text-[#e72b47] shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
          >
            Kwartaal
          </button>
          <button 
            onClick={() => setTimeFrame('beldag')}
            className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${timeFrame === 'beldag' ? 'bg-red-50 border-red-200 text-[#e72b47] shadow-sm' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'}`}
          >
            Vandaag
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-2">
        {stats.length > 0 ? stats.map((stat, index) => {
          const progressPercent = Math.round((stat.count / stat.target) * 100);
          const barColorClass = getProgressColor(progressPercent);
          
          return (
            <div 
              key={stat.id} 
              className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                index === 0 ? 'bg-amber-50/50 border-amber-100 hover:border-amber-200' : 'bg-white border-slate-100 hover:border-red-100 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base shadow-sm ${
                    index === 0 ? 'bg-amber-400 text-white' : 
                    index === 1 ? 'bg-slate-300 text-slate-700' : 
                    index === 2 ? 'bg-orange-300 text-white' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-2 -left-2 rotate-[-15deg] drop-shadow-sm">
                      <span className="text-lg">👑</span>
                    </div>
                  )}
                </div>
                
                <div className="min-w-0">
                  <p className={`font-bold text-base truncate capitalize ${index === 0 ? 'text-amber-900' : 'text-slate-800'}`}>
                    {stat.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                      <div 
                        className={`h-full transition-all duration-1000 ${barColorClass}`}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase">{progressPercent}%</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end shrink-0 pl-4">
                <span className={`text-2xl font-black leading-none ${index === 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                  {stat.count}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">Afspraken</span>
              </div>
            </div>
          );
        }) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="bg-slate-50 p-5 rounded-full border border-slate-100">
              <svg className="opacity-30" xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <p className="text-sm font-bold text-center px-10 leading-relaxed opacity-60">
              Geen resultaten gevonden voor dit filter.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
          <span>Focus: Target {timeFrame === 'quarter' ? 'Q4' : 'Vandaag'}</span>
          <span className="text-[#e72b47]">Live Sync</span>
        </div>
      </div>
    </div>
  );
};
