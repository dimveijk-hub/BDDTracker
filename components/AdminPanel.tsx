
import React, { useState } from 'react';
import { Profile, AppSettings, Team, UserRole, Session, SessionTarget, Appointment } from '../types';

interface AdminPanelProps {
  settings: AppSettings;
  profiles: Profile[];
  teams: Team[];
  sessions: Session[];
  sessionTargets: SessionTarget[];
  appointments: Appointment[]; 
  onStartSession: (name: string, quarter: string, targets: {userId: string, target: number}[]) => void;
  onCloseSession: () => void;
}

const getCurrentQuarter = () => {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3) + 1;
  return `${now.getFullYear()}-Q${quarter}`;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  settings, profiles, teams, sessions, sessionTargets, appointments, onStartSession, onCloseSession 
}) => {
  const [viewMode, setViewMode] = useState<'current' | 'history'>('current');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState(`Bel-dag ${new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}`);
  const [sessionQuarter, setSessionQuarter] = useState(getCurrentQuarter());
  
  const [setupParticipants, setSetupParticipants] = useState<Record<string, { active: boolean, target: number }>>(
    profiles.filter(p => p.role === UserRole.BELLER).reduce((acc, p) => ({
      ...acc, [p.id]: { active: true, target: 15 }
    }), {})
  );

  const activeSession = sessions.find(s => s.id === settings.active_session_id);
  const closedSessions = sessions.filter(s => s.status === 'closed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleToggleParticipant = (id: string) => {
    setSetupParticipants(prev => ({
      ...prev,
      [id]: { ...prev[id], active: !prev[id].active }
    }));
  };

  const handleTargetChange = (id: string, val: number) => {
    setSetupParticipants(prev => ({
      ...prev,
      [id]: { ...prev[id], target: val }
    }));
  };

  const handleStart = () => {
    const targets = (Object.entries(setupParticipants) as [string, { active: boolean, target: number }][])
      .filter(([_, data]) => data.active)
      .map(([userId, data]) => ({ userId, target: data.target }));
    onStartSession(sessionName, sessionQuarter, targets);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-1">
          <button onClick={() => setViewMode('current')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'current' ? 'bg-[#e72b47] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Actuele Sessie</button>
          <button onClick={() => setViewMode('history')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'history' ? 'bg-[#e72b47] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}>Historie</button>
        </div>
      </div>

      {viewMode === 'history' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-black uppercase tracking-tight">Afgesloten Sessies</h3>
            <div className="space-y-2">
              {closedSessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => setSelectedHistoryId(s.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${selectedHistoryId === s.id ? 'bg-red-50 border-red-200 ring-2 ring-red-100' : 'bg-white border-slate-200 hover:border-red-200'}`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold">{s.name}</p>
                    <span className="text-[9px] font-black text-[#e72b47] bg-red-50 px-1.5 py-0.5 rounded">{s.quarter}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 uppercase font-black mt-1">{new Date(s.date).toLocaleDateString('nl-NL')}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
            {selectedHistoryId ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <h4 className="text-xl font-bold text-slate-800">{sessions.find(s => s.id === selectedHistoryId)?.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Sessie Resultaten</p>
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-xs font-black uppercase">Archief</span>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  {teams.map(team => {
                    const teamTargets = sessionTargets.filter(st => st.session_id === selectedHistoryId && profiles.find(p => p.id === st.user_id)?.team_id === team.id);
                    if (teamTargets.length === 0) return null;
                    return (
                      <div key={team.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                        <h5 className="font-black text-xs text-[#e72b47] uppercase mb-4 tracking-widest">{team.name}</h5>
                        <div className="space-y-3">
                          <div className="grid grid-cols-12 text-[10px] font-black text-slate-400 uppercase tracking-tighter pb-2 border-b border-slate-200">
                            <div className="col-span-6">Beller</div>
                            <div className="col-span-3 text-center">Score</div>
                            <div className="col-span-3 text-right">Target</div>
                          </div>
                          {teamTargets.map(st => {
                            const actualCount = appointments.filter(a => a.beller_id === st.user_id && a.session_id === selectedHistoryId).length;
                            const isMet = actualCount >= st.target;
                            return (
                              <div key={st.user_id} className="grid grid-cols-12 items-center py-1">
                                <div className="col-span-6">
                                  <p className="font-bold text-sm text-slate-700">{profiles.find(p => p.id === st.user_id)?.email.split('@')[0]}</p>
                                </div>
                                <div className="col-span-3 text-center">
                                  <span className={`font-black text-sm ${isMet ? 'text-emerald-600' : 'text-slate-800'}`}>{actualCount}</span>
                                </div>
                                <div className="col-span-3 text-right">
                                  <span className="text-xs font-bold text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded">Target: {st.target}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                </div>
                <p className="text-sm font-bold uppercase tracking-widest">Selecteer een sessie uit de lijst</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 text-slate-900">
          {activeSession ? (
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-xl shadow-emerald-50 relative overflow-hidden">
               <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Sessie Actief</span>
                      <span className="bg-red-100 text-[#e72b47] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{activeSession.quarter}</span>
                    </div>
                    <h3 className="text-2xl font-black text-slate-800">{activeSession.name}</h3>
                  </div>
                </div>
                <button onClick={onCloseSession} className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-red-200 transition-all flex items-center gap-3">
                  Bevriezen & Archiveren
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b pb-6">
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tight text-slate-800">Nieuwe Bel-dag Sessie</h3>
                  <p className="text-slate-400 font-medium mt-1">Stel targets in voor vandaag.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sessie Naam</label>
                  <input type="text" value={sessionName} onChange={e => setSessionName(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-red-100 font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kwartaal</label>
                  <select 
                    value={sessionQuarter} 
                    onChange={e => setSessionQuarter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-red-100 font-bold cursor-pointer"
                  >
                    {[2024, 2025].flatMap(y => [1,2,3,4].map(q => `${y}-Q${q}`)).map(q => (
                      <option key={q} value={q}>{q}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Aanwezigheid & Targets</h4>
                <div className="grid grid-cols-1 gap-6">
                  {teams.map(team => {
                    const teamBellers = profiles.filter(p => p.role === UserRole.BELLER && p.team_id === team.id);
                    if (teamBellers.length === 0) return null;
                    return (
                      <div key={team.id} className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                        <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-100">
                          <span className="font-black text-[#e72b47] uppercase text-xs tracking-widest">{team.name}</span>
                        </div>
                        <div className="divide-y divide-slate-100">
                          {teamBellers.map(p => (
                            <div key={p.id} className={`flex items-center justify-between px-6 py-4 transition-all ${!setupParticipants[p.id]?.active ? 'opacity-40' : 'bg-white'}`}>
                              <div className="flex items-center gap-4">
                                <button onClick={() => handleToggleParticipant(p.id)} className={`w-12 h-6 rounded-full transition-all relative ${setupParticipants[p.id]?.active ? 'bg-[#e72b47]' : 'bg-slate-300'}`}>
                                  <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${setupParticipants[p.id]?.active ? 'left-7' : 'left-1'}`} />
                                </button>
                                <p className="font-bold">{p.email.split('@')[0]}</p>
                              </div>
                              <input type="number" disabled={!setupParticipants[p.id]?.active} value={setupParticipants[p.id]?.target} onChange={e => handleTargetChange(p.id, parseInt(e.target.value) || 0)} className="w-24 bg-slate-100 border-none rounded-xl px-4 py-3 font-black text-center" />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <button onClick={handleStart} className="w-full bg-[#e72b47] hover:bg-[#d1263f] text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-red-100 transition-all">
                  Targets Vastzetten & Sessie Openen
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
