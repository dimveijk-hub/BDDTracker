import React, { useEffect, useMemo, useState } from 'react';
import { api } from './services';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  type Appointment,
  type AppSettings,
  type DashboardFilter,
  type Profile,
  type Session,
  type SessionTarget,
  type Team,
  type TeamStats,
  UserRole,
} from './types';
import { byNameNumeric, formatName, progressColor } from './utils/format';
import { AdminPanel } from './components/AdminPanel';
import { AppointmentForm } from './components/AppointmentForm';
import { AppointmentLog } from './components/AppointmentLog';
import { DashboardStats } from './components/DashboardStats';
import { Leaderboard } from './components/Leaderboard';
import { Login } from './components/Login';
import { OrganizationPanel } from './components/OrganizationPanel';
import { ResultsDashboard } from './components/ResultsDashboard';
import { ArrowRightIcon, AwardIcon } from './components/icons';

type Tab = 'dashboard' | 'sessions' | 'resultaten' | 'admin' | 'logboeken';

const Spinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#F8F5F1]">
    <div className="text-center">
      <div className="w-8 h-8 border-4 border-[#E62C48] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-xs font-bold text-slate-400">Laden...</p>
    </div>
  </div>
);

/** Ingelogd in Firebase Auth, maar er is geen document in `profiles/{uid}`. */
const ProfileNotFound: React.FC = () => {
  const { error, signOut, user } = useAuth();
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F5F1] p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 bg-red-50 text-[#E62C48] rounded-full flex items-center justify-center mx-auto text-2xl font-black">
          !
        </div>
        <h2 className="text-xl font-bold text-slate-800">Profiel niet gevonden</h2>
        <div className="text-sm text-slate-400 font-medium">
          Er is wel een account, maar nog geen profiel in de database.
          <br className="mb-2" />
          {error && (
            <div className="bg-red-50 p-3 rounded-xl border border-red-100 text-[#E62C48] text-xs font-bold my-4 text-left">
              <strong>Foutmelding:</strong> {error}
              {error.includes('permission') && (
                <span className="block mt-2 text-slate-600 font-normal">
                  Dit lijkt op een rechtenprobleem. Controleer de <strong>Firestore Security Rules</strong>.
                </span>
              )}
            </div>
          )}
          <span className="text-xs italic bg-slate-50 p-1 rounded border border-slate-100 block mt-2">
            Vraag een beheerder om een document in de 'profiles' collectie aan te maken met ID: <strong>{user?.uid}</strong>
          </span>
        </div>
        <button
          onClick={signOut}
          className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-all"
        >
          Uitloggen
        </button>
      </div>
    </div>
  );
};

const Main: React.FC<{ profile: Profile }> = ({ profile }) => {
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [dashboardFilter, setDashboardFilter] = useState<DashboardFilter>('laatste');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [settings, setSettings] = useState<AppSettings>({ active_session_id: null, blind_mode_enabled: false });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionTargets, setSessionTargets] = useState<SessionTarget[]>([]);

  useEffect(() => {
    const unsubscribers = [
      api.subscribeProfiles(setProfiles),
      api.subscribeTeams((list) => setTeams([...list].sort(byNameNumeric))),
      api.subscribeAppointments(setAppointments),
      api.subscribeSessions(setSessions),
      api.subscribeSessionTargets(setSessionTargets),
      api.subscribeSettings(setSettings),
    ];
    return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
  }, []);

  const isAdmin = profile.role === UserRole.ADMIN;
  const activeSession = useMemo(
    () => sessions.find((s) => s.id === settings.active_session_id),
    [sessions, settings],
  );
  // Bellers zien altijd de sessie-weergave; alleen admins kunnen naar kwartaal schakelen.
  const effectiveFilter: DashboardFilter = isAdmin ? dashboardFilter : 'laatste';

  const lastClosedSession = useMemo(
    () =>
      [...sessions]
        .filter((s) => s.status === 'closed')
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0],
    [sessions],
  );

  // Samenvatting van de laatste sessie voor een beller (alleen zichtbaar als er geen sessie loopt).
  const personalSummary = useMemo(() => {
    if (isAdmin || settings.active_session_id || !lastClosedSession) return null;
    const myTarget = sessionTargets.find((t) => t.session_id === lastClosedSession.id && t.user_id === profile.id);
    if (!myTarget) return null;
    const mine = appointments.filter((a) => a.session_id === lastClosedSession.id && a.beller_id === profile.id);
    return {
      sessionName: lastClosedSession.name,
      count: mine.length,
      target: myTarget.target,
      progress: myTarget.target > 0 ? (mine.length / myTarget.target) * 100 : 0,
      appointments: mine,
    };
  }, [isAdmin, settings.active_session_id, lastClosedSession, sessionTargets, appointments, profile.id]);

  const teamStats = useMemo<TeamStats[]>(
    () =>
      teams.map((team) => {
        const members = profiles.filter((p) => p.team_id === team.id);
        let sessionIds: string[];
        if (effectiveFilter === 'laatste') {
          const session = activeSession || lastClosedSession;
          sessionIds = session ? [session.id] : [];
        } else {
          const quarter = activeSession?.quarter || lastClosedSession?.quarter || '2025-Q1';
          sessionIds = sessions.filter((s) => s.quarter === quarter).map((s) => s.id);
        }
        let totalAppointments = 0;
        let totalTarget = 0;
        sessionIds.forEach((sessionId) => {
          members.forEach((member) => {
            const target = sessionTargets.find((t) => t.session_id === sessionId && t.user_id === member.id);
            if (target) {
              totalTarget += target.target;
              totalAppointments += appointments.filter(
                (a) => a.session_id === sessionId && a.beller_id === member.id,
              ).length;
            }
          });
        });
        return {
          teamName: team.name,
          totalAppointments,
          totalTarget,
          progress: totalTarget > 0 ? (totalAppointments / totalTarget) * 100 : 0,
        };
      }),
    [profiles, teams, appointments, sessionTargets, sessions, activeSession, lastClosedSession, effectiveFilter],
  );

  const handleStartSession = async (name: string, quarter: string, targets: { userId: string; target: number }[]) => {
    await api.startNewSession(name, quarter, targets);
    setActiveTab('dashboard');
  };

  const handleCloseSession = async () => {
    if (settings.active_session_id) await api.closeSession(settings.active_session_id);
  };

  const handleAddAppointment = async (customer: string, date: string) => {
    if (settings.active_session_id) {
      await api.addAppointment(profile.id, settings.active_session_id, customer, date);
    }
  };

  const handleToggleBlindMode = async () => {
    await api.setBlindMode(!settings.blind_mode_enabled);
  };

  const renderPersonalSummary = () => {
    if (!personalSummary) return null;
    const { sessionName, count, target, progress, appointments: mine } = personalSummary;
    return (
      <div className="bg-white p-8 rounded-3xl border-2 border-[#8DBC65]/20 shadow-xl shadow-green-900/5 animate-in zoom-in duration-500 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12">
          <AwardIcon size={120} strokeWidth={1} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#8DBC65] text-white px-3 py-1 rounded-full text-[10px] font-black tracking-normal">
                Sessie samenvatting
              </span>
              <span className="text-[10px] font-bold text-slate-400">{sessionName}</span>
            </div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Jouw score van de laatste sessie</h3>
            <p className="text-slate-400 font-bold text-xs mt-1">Gefeliciteerd! De sessie is succesvol afgerond.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-3xl font-black text-[#8DBC65] leading-none">{count}</p>
              <p className="text-[10px] font-black text-slate-400 mt-1">Afspraken</p>
            </div>
            <div className="w-px h-10 bg-slate-100 hidden md:block" />
            <div className="text-center">
              <p className="text-3xl font-black text-slate-800 leading-none">{target}</p>
              <p className="text-[10px] font-black text-slate-400 mt-1">Target</p>
            </div>
            <div
              className={`px-4 py-2 rounded-2xl font-black text-xs border ${
                progress >= 100 ? 'bg-green-50 border-green-100 text-green-600' : 'bg-red-50 border-red-100 text-red-600'
              }`}
            >
              {progress >= 100 ? 'Target behaald! 🏆' : 'Bijna daar...'}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-black text-slate-400">Progressie</span>
            <span className="text-sm font-black text-slate-800">{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-50">
            <div
              className="h-full transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: progressColor(progress) }}
            />
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100">
          <h4 className="text-[10px] font-black text-slate-400 mb-4">Details van jouw sessie</h4>
          <div className="space-y-3">
            {mine.length > 0 ? (
              mine.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group hover:border-[#E62C48]/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-xs text-slate-400 group-hover:text-[#E62C48] transition-colors">
                      {a.customer_name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800 leading-none">{a.customer_name}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-1">
                        Afspraak op: {new Date(a.appointment_date).toLocaleDateString('nl-NL')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400">Geregistreerd om</p>
                    <p className="text-xs font-black text-slate-600">
                      {new Date(a.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs font-bold text-slate-400 italic">Geen afspraken geregistreerd in deze sessie.</p>
            )}
          </div>
        </div>

        <button
          onClick={() => setActiveTab('logboeken')}
          className="mt-8 text-[10px] font-black text-[#E62C48] hover:underline flex items-center gap-2"
        >
          Bekijk volledig logboek
          <ArrowRightIcon size={12} strokeWidth={3} />
        </button>
      </div>
    );
  };

  const renderDashboard = () => (
    <div className={`grid grid-cols-1 ${isAdmin ? 'lg:grid-cols-12' : 'lg:grid-cols-1'} gap-8 items-start`}>
      <div className={`${isAdmin ? 'lg:col-span-8' : 'w-full max-w-4xl mx-auto'} space-y-8`}>
        {!isAdmin && (
          <>
            <AppointmentForm isLocked={!settings.active_session_id} onSubmit={handleAddAppointment} />
            {renderPersonalSummary()}
          </>
        )}
        <DashboardStats
          teamStats={teamStats}
          sessions={sessions}
          activeSessionId={settings.active_session_id}
          currentFilter={effectiveFilter}
          onFilterChange={setDashboardFilter}
          isAdmin={isAdmin}
          blindMode={settings.blind_mode_enabled}
        />

        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">Actuele inzendingen</h3>
            <button onClick={() => setActiveTab('logboeken')} className="text-[#E62C48] text-xs font-bold hover:underline">
              Bekijk alle
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {appointments.length > 0 ? (
              appointments.slice(0, 5).map((a) => (
                <div key={a.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-50 text-[#E62C48] flex items-center justify-center font-bold text-xs">
                      {a.customer_name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{a.customer_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">
                        {formatName(profiles.find((p) => p.id === a.beller_id)?.email)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400">
                    {new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400 text-sm italic">Geen afspraken gevonden</div>
            )}
          </div>
        </div>
      </div>
      {isAdmin && (
        <div className="lg:col-span-4">
          <Leaderboard
            profiles={profiles}
            appointments={appointments}
            sessionTargets={sessionTargets}
            teams={teams}
            activeSessionId={settings.active_session_id || (sessions.length > 0 ? sessions[0].id : null)}
          />
        </div>
      )}
    </div>
  );

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
          onToggleBlindMode={handleToggleBlindMode}
        />
      );
    }
    if (activeTab === 'admin' && isAdmin) {
      return <OrganizationPanel profiles={profiles} teams={teams} />;
    }
    if (activeTab === 'resultaten' && isAdmin) {
      return (
        <ResultsDashboard
          profiles={profiles}
          appointments={appointments}
          teams={teams}
          sessions={sessions}
          sessionTargets={sessionTargets}
        />
      );
    }
    if (activeTab === 'logboeken') {
      return (
        <AppointmentLog
          appointments={isAdmin ? appointments : appointments.filter((a) => a.beller_id === profile.id)}
          profiles={profiles}
          teams={teams}
          sessions={sessions}
          onBack={() => setActiveTab('dashboard')}
          isPersonalView={!isAdmin}
        />
      );
    }
    return renderDashboard();
  };

  const navButton = (tab: Tab, label: string) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
        activeTab === tab ? 'bg-white shadow-sm text-[#E62C48]' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[#F8F5F1] flex flex-col font-sans text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <img src="/logo.png" alt="Saleswise Logo" className="w-10 h-10 object-contain drop-shadow-md" />
          <div>
            <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none">SalesWise</h1>
            <p className="text-[10px] font-bold text-slate-400 mt-1">Business development day</p>
          </div>
        </div>
        <div className="hidden md:flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          {navButton('dashboard', 'Dashboard')}
          {isAdmin && (
            <>
              {navButton('sessions', 'Sessies')}
              {navButton('resultaten', 'Resultaten')}
              {navButton('admin', 'Admin')}
            </>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-slate-800 leading-none capitalize">{formatName(profile.email)}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-1 capitalize">
              {profile.role === UserRole.BELLER ? 'SalesWiser' : profile.role}
            </p>
          </div>
          <button
            onClick={signOut}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 hover:text-[#E62C48] px-4 py-2 rounded-xl text-[10px] font-bold transition-all"
          >
            Uitloggen
          </button>
        </div>
      </nav>

      <main className="flex-1 max-w-[1400px] w-full mx-auto p-8 lg:p-12">
        <div
          className={`mb-12 p-5 rounded-3xl border flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm ${
            settings.active_session_id
              ? 'bg-[#8DBC65]/10 border-[#8DBC65]/20 text-[#8DBC65]'
              : 'bg-white border-slate-200 text-slate-500'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${settings.active_session_id ? 'bg-[#8DBC65] animate-pulse' : 'bg-slate-300'}`}
            />
            <span className="text-sm font-bold">
              {settings.active_session_id
                ? `Registratie geopend voor ${activeSession?.name || 'sessie'}`
                : 'Systeem is momenteel vergrendeld'}
            </span>
          </div>
          <span className="text-[10px] font-bold opacity-40">Live status</span>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

const Gate: React.FC = () => {
  const { user, profile, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Login />;
  if (!profile) return <ProfileNotFound />;
  return <Main profile={profile} />;
};

const App: React.FC = () => (
  <AuthProvider>
    <Gate />
  </AuthProvider>
);

export default App;
