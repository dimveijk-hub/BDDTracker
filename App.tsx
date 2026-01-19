
import React, { useState, useMemo } from 'react';
import { UserRole, Profile, Team, Appointment, AppSettings, Session, SessionTarget, TeamStats } from './types';
import { MOCK_PROFILES, MOCK_TEAMS, MOCK_APPOINTMENTS, MOCK_SETTINGS, MOCK_SESSIONS, MOCK_SESSION_TARGETS, startNewSession, closeActiveSession, addAppointment } from './services/mockData';
import { DashboardStats } from './components/DashboardStats';
import { AppointmentForm } from './components/AppointmentForm';
import { AdminPanel } from './components/AdminPanel';
import { Leaderboard } from './components/Leaderboard';
import { AppointmentLog } from './components/AppointmentLog';
import { ResultsDashboard } from './components/ResultsDashboard';
import { OrganizationPanel } from './components/OrganizationPanel';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Profile>(MOCK_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sessions' | 'resultaten' | 'admin' | 'logboeken'>('dashboard');
  const [dashboardFilter, setDashboardFilter] = useState<'laatste' | 'kwartaal'>('laatste');
  
  const [profiles, setProfiles] = useState<Profile[]>(MOCK_PROFILES);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);
  const [settings, setSettings] = useState<AppSettings>(MOCK_SETTINGS);
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [sessionTargets, setSessionTargets] = useState<SessionTarget[]>(MOCK_SESSION_TARGETS);

  const activeSession = useMemo(() => sessions.find(s => s.id === settings.active_session_id), [sessions, settings]);

  const teamStats: TeamStats[] = useMemo(() => {
    return teams.map(team => {
      const teamBellers = profiles.filter(p => p.team_id === team.id);
      
      let relevantSessionIds: string[] = [];
      if (dashboardFilter === 'laatste') {
        const lastSession = activeSession || [...sessions].filter(s => s.status === 'closed').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
        relevantSessionIds = lastSession ? [lastSession.id] : [];
      } else {
        // Huidig kwartaal logica (vereenvoudigd voor demo naar alle sessies van huidig jaar kwartaal)
        const currentQuarter = sessions.find(s => s.id === settings.active_session_id)?.quarter || '2024-Q4';
        relevantSessionIds = sessions.filter(s => s.quarter === currentQuarter).map(s => s.id);
      }
      
      const count = appointments.filter(a => 
        teamBellers.some(b => b.id === a.beller_id) && 
        relevantSessionIds.includes(a.session_id)
      ).length;

      const target = sessionTargets
        .filter(st => teamBellers.some(b => b.id === st.user_id) && relevantSessionIds.includes(st.session_id))
        .reduce((sum, st) => sum + st.target, 0);
      
      return {
        teamName: team.name,
        totalAppointments: count,
        totalTarget: target,
        progress: target > 0 ? (count / target) * 100 : 0
      };
    });
  }, [profiles, teams, appointments, sessionTargets, sessions, settings, dashboardFilter, activeSession]);

  const handleStartSession = (name: string, quarter: string, targets: {userId: string, target: number}[]) => {
    const result = startNewSession(name, quarter, targets);
    setSessions([...MOCK_SESSIONS]);
    setSessionTargets([...MOCK_SESSION_TARGETS]);
    setSettings({ ...result.settings });
    setActiveTab('dashboard');
  };

  const handleCloseSession = () => {
    const newSettings = closeActiveSession();
    setSessions([...MOCK_SESSIONS]);
    setSettings({ ...newSettings });
  };

  const handleAddAppointment = (customer: string, date: string) => {
    if (!settings.active_session_id) return;
    const newApp = addAppointment(currentUser.id, settings.active_session_id, customer, date);
    setAppointments([newApp, ...appointments]);
  };

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const renderContent = () => {
    if (activeTab === 'sessions' && isAdmin) {
      return (
        <AdminPanel 
          settings={settings} 
          profiles={profiles} 
          teams={teams}
          sessions={sessions}
          sessionTargets={sessionTargets}
          appointments={appointments}
          onStartSession={handleStartSession}
          onCloseSession={handleCloseSession}
        />
      );
    }

    if (activeTab === 'admin' && isAdmin) {
      return (
        <OrganizationPanel 
          profiles={profiles} 
          teams={teams}
          onUpdateProfiles={setProfiles}
          onUpdateTeams={setTeams}
        />
      );
    }

    if (activeTab === 'resultaten' && isAdmin) {
      return <ResultsDashboard profiles={profiles} appointments={appointments} teams={teams} sessions={sessions} sessionTargets={sessionTargets} />;
    }

    if (activeTab === 'logboeken') {
      return <AppointmentLog appointments={appointments} profiles={profiles} onBack={() => setActiveTab('dashboard')} />;
    }

    return (
      <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-8 items-start`}>
        <div className={`${isAdmin ? 'lg:col-span-8' : 'w-full max-w-4xl mx-auto'} space-y-8`}>
          {!isAdmin && (
            <AppointmentForm isLocked={!settings.active_session_id} onSubmit={handleAddAppointment} />
          )}
          <DashboardStats 
            teamStats={teamStats} 
            sessions={sessions}
            activeSessionId={settings.active_session_id}
            currentFilter={dashboardFilter}
            onFilterChange={setDashboardFilter}
          />
          
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Actuele Inzendingen</h3>
              <button onClick={() => setActiveTab('logboeken')} className="text-[#e72b47] text-[10px] font-black uppercase tracking-widest hover:underline">Full Log</button>
            </div>
            <div className="divide-y divide-slate-100">
               {appointments.length > 0 ? appointments.slice(0, 5).map(app => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#e72b47] flex items-center justify-center font-black text-xs">
                      {app.customer_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{app.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{profiles.find(p => p.id === app.beller_id)?.email.split('@')[0]}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{new Date(app.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              )) : (
                <div className="p-12 text-center text-slate-400 text-sm italic">Geen afspraken gevonden</div>
              )}
            </div>
          </div>
        </div>
        {isAdmin && (
          <div className="lg:col-span-4">
            <Leaderboard profiles={profiles} appointments={appointments} sessionTargets={sessionTargets} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-inter text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-[#e72b47] text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-xl shadow-lg shadow-red-200">S</div>
          <div><h1 className="text-lg font-black text-slate-800 tracking-tight uppercase leading-none">SalesWise</h1><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Business Development Day</p></div>
        </div>
        <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button onClick={() => setActiveTab('dashboard')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-[#e72b47]' : 'text-slate-500 hover:text-slate-800'}`}>Dashboard</button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('sessions')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'sessions' ? 'bg-white shadow-sm text-[#e72b47]' : 'text-slate-500 hover:text-slate-800'}`}>Sessies</button>
              <button onClick={() => setActiveTab('resultaten')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'resultaten' ? 'bg-white shadow-sm text-[#e72b47]' : 'text-slate-500 hover:text-slate-800'}`}>Resultaten</button>
              <button onClick={() => setActiveTab('admin')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'admin' ? 'bg-white shadow-sm text-[#e72b47]' : 'text-slate-500 hover:text-slate-800'}`}>Admin</button>
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-black text-slate-800 leading-none capitalize">{currentUser.email.split('@')[0]}</p>
            <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">{currentUser.role}</p>
          </div>
          <select 
            onChange={(e) => {
              const selected = profiles.find(p => p.id === e.target.value);
              if (selected) setCurrentUser(selected);
            }} 
            value={currentUser.id} 
            className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-black uppercase outline-none focus:ring-2 focus:ring-[#e72b47] transition-all cursor-pointer"
          >
            {profiles.map(p => <option key={p.id} value={p.id}>{p.email.split('@')[0]}</option>)}
          </select>
        </div>
      </nav>
      <main className="flex-1 max-w-[1400px] w-full mx-auto p-8 lg:p-12">
        <div className={`mb-12 p-5 rounded-3xl border flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm ${
          settings.active_session_id 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-white border-slate-200 text-slate-500'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${settings.active_session_id ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
            <span className="text-sm font-bold">
              {settings.active_session_id ? `Registratie geopend voor ${activeSession?.name || 'sessie'}` : 'Systeem is momenteel vergrendeld'}
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">Live Status</span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
