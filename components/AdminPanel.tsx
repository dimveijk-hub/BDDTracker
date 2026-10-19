import React, { useEffect, useState } from 'react';
import { api } from '../services';
import {
  type Appointment,
  type AppSettings,
  type DraftTargets,
  type Profile,
  type Session,
  type SessionTarget,
  type Team,
  UserRole,
} from '../types';
import { COLORS, currentMonthName, currentQuarter, formatName, MONTHS } from '../utils/format';
import { CheckCircleIcon, EyeIcon, EyeOffIcon, FileTextIcon, GaugeIcon, SaveIcon } from './icons';

interface Props {
  settings: AppSettings;
  profiles: Profile[];
  teams: Team[];
  sessions: Session[];
  sessionTargets: SessionTarget[];
  appointments: Appointment[];
  onStartSession: (name: string, quarter: string, targets: { userId: string; target: number }[]) => void;
  onCloseSession: () => void;
  onToggleBlindMode: () => void;
}

type SaveState = 'idle' | 'saving' | 'saved';

const QUARTER_OPTIONS = (() => {
  const lastYear = Math.max(new Date().getFullYear() + 1, 2026);
  const options: string[] = [];
  for (let year = 2025; year <= lastYear; year++) {
    for (let q = 1; q <= 4; q++) options.push(`${year}-Q${q}`);
  }
  return options;
})();

const selectClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-red-100 font-bold cursor-pointer transition-all';

const Avatar: React.FC<{ email: string }> = ({ email }) => (
  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-xs text-slate-500">
    {email[0].toUpperCase()}
  </div>
);

/** Rij waarin een target van de lopende sessie direct aangepast kan worden (opslaan bij blur). */
const LiveTargetRow: React.FC<{ target: SessionTarget; profile: Profile }> = ({ target, profile }) => (
  <div className="flex items-center justify-between px-6 py-4 bg-white">
    <div className="flex items-center gap-4">
      <Avatar email={profile.email} />
      <p className="font-bold">{formatName(profile.email)}</p>
    </div>
    <div className="flex items-center gap-3">
      <label className="text-[10px] font-bold text-slate-400">Target:</label>
      <input
        type="number"
        // key: opnieuw opbouwen als de waarde elders gewijzigd wordt (uncontrolled input)
        key={`${target.id}-${target.target}`}
        defaultValue={target.target}
        onBlur={(e) => {
          const value = parseInt(e.target.value);
          if (!isNaN(value) && value !== target.target && target.id) {
            api.updateSessionTarget(target.id, value).catch((err) => alert('Fout bij updaten: ' + err.message));
          }
        }}
        className="w-24 bg-slate-100 border-none rounded-xl px-4 py-2 font-bold text-center focus:ring-2 focus:ring-[#E62C48] outline-none"
      />
    </div>
  </div>
);

/** Rij in het "nieuwe sessie"-formulier: aanwezigheid-toggle + target. */
const DraftRow: React.FC<{
  profile: Profile;
  draft: { active: boolean; target: number } | undefined;
  showNoTeam?: boolean;
  onToggle: () => void;
  onTargetChange: (target: number) => void;
}> = ({ profile, draft, showNoTeam, onToggle, onTargetChange }) => (
  <div className={`flex items-center justify-between px-6 py-4 transition-all ${draft?.active ? 'bg-white' : 'opacity-40'}`}>
    <div className="flex items-center gap-4">
      <button
        onClick={onToggle}
        className={`w-12 h-6 rounded-full transition-all relative ${draft?.active ? 'bg-[#E62C48]' : 'bg-slate-300'}`}
      >
        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full transition-all ${draft?.active ? 'left-7' : 'left-1'}`} />
      </button>
      {showNoTeam ? (
        <div>
          <p className="font-bold">{formatName(profile.email)}</p>
          <p className="text-[9px] font-bold text-red-400 italic">Geen team</p>
        </div>
      ) : (
        <p className="font-bold">{formatName(profile.email)}</p>
      )}
    </div>
    <div className="flex items-center gap-3">
      <label className="text-[10px] font-bold text-slate-400">Target:</label>
      <input
        type="number"
        disabled={!draft?.active}
        value={draft?.target ?? ''}
        onChange={(e) => onTargetChange(parseInt(e.target.value) || 0)}
        className="w-24 bg-slate-100 border-none rounded-xl px-4 py-3 font-bold text-center"
      />
    </div>
  </div>
);

const TeamBadge: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <span className="bg-white border border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold text-slate-500 shadow-sm">
    {label} <span className="text-[#E62C48] ml-1">{value}</span>
  </span>
);

export const AdminPanel: React.FC<Props> = ({
  settings,
  profiles,
  teams,
  sessions,
  sessionTargets,
  appointments,
  onStartSession,
  onCloseSession,
  onToggleBlindMode,
}) => {
  const [view, setView] = useState<'current' | 'history'>('current');
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [month, setMonth] = useState(currentMonthName());
  const [quarter, setQuarter] = useState(currentQuarter());
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [savedDrafts, setSavedDrafts] = useState<DraftTargets>({});
  const [draft, setDraft] = useState<DraftTargets>({});

  // Alle bellers starten actief met target 15; opgeslagen concepten overschrijven dat.
  useEffect(() => {
    const defaults: DraftTargets = {};
    profiles
      .filter((p) => p.role === UserRole.BELLER)
      .forEach((p) => {
        defaults[p.id] = { active: true, target: 15 };
      });
    const merged = { ...defaults };
    Object.entries(savedDrafts).forEach(([id, value]) => {
      if (merged[id]) merged[id] = value;
    });
    setDraft(merged);
  }, [profiles, savedDrafts]);

  useEffect(() => api.subscribeDraftTargets(setSavedDrafts), []);

  const activeSession = sessions.find((s) => s.id === settings.active_session_id);
  const closedSessions = sessions
    .filter((s) => s.status === 'closed')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const toggleActive = (id: string) => setDraft((prev) => ({ ...prev, [id]: { ...prev[id], active: !prev[id].active } }));
  const setTarget = (id: string, target: number) => setDraft((prev) => ({ ...prev, [id]: { ...prev[id], target } }));

  const saveDrafts = async () => {
    setSaveState('saving');
    try {
      await api.saveDraftTargets(draft);
      setSaveState('saved');
    } catch (error) {
      console.error('Error saving drafts:', error);
      setSaveState('idle');
      return;
    }
    setTimeout(() => setSaveState('idle'), 2000);
  };

  const openSession = () => {
    const targets = Object.entries(draft)
      .filter(([, value]) => value.active)
      .map(([userId, value]) => ({ userId, target: value.target }));
    onStartSession(month, quarter, targets);
  };

  const totalTarget = Object.values(draft).reduce((sum, d) => sum + (d.active ? d.target : 0), 0);

  const sessionScore = (sessionId: string) => ({
    totalTarget: sessionTargets.filter((t) => t.session_id === sessionId).reduce((sum, t) => sum + t.target, 0),
    totalActual: appointments.filter((a) => a.session_id === sessionId).length,
  });

  const profileOf = (id: string) => profiles.find((p) => p.id === id);
  const bellers = profiles.filter((p) => p.role === UserRole.BELLER);
  const unassignedBellers = bellers.filter((p) => !p.team_id || !teams.find((t) => t.id === p.team_id));

  const tabButton = (value: 'current' | 'history', label: string) => (
    <button
      onClick={() => setView(value)}
      className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
        view === value ? 'bg-[#E62C48] text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  );

  // ---------- Historie ----------
  const renderHistory = () => {
    const selected = sessions.find((s) => s.id === selectedHistoryId);
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-slate-900">
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold tracking-tight">Afgesloten sessies</h3>
          <div className="space-y-2">
            {closedSessions.map((session) => {
              const { totalTarget: target, totalActual: actual } = sessionScore(session.id);
              return (
                <button
                  key={session.id}
                  onClick={() => setSelectedHistoryId(session.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedHistoryId === session.id
                      ? 'bg-red-50 border-red-200 ring-2 ring-red-100'
                      : 'bg-white border-slate-200 hover:border-red-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold">{session.name}</p>
                    <span className="text-[9px] font-bold text-[#E62C48] bg-red-50 px-1.5 py-0.5 rounded">
                      {session.quarter}
                    </span>
                  </div>
                  <div className="flex justify-between items-end mt-2">
                    <p className="text-[10px] text-slate-400 font-bold">
                      {new Date(session.date).toLocaleDateString('nl-NL')}
                    </p>
                    <p className="text-[10px] font-black text-slate-600">
                      Score: {actual}/{target}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm min-h-[400px]">
          {selectedHistoryId ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b pb-4">
                <div>
                  <h4 className="text-xl font-bold text-slate-800">{selected?.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold">Sessie resultaten archief</p>
                </div>
                <div className="text-right">
                  <span className="bg-slate-800 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider block">
                    Totaal Target: {sessionScore(selectedHistoryId).totalTarget}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {teams.map((team) => {
                  const teamTargets = sessionTargets.filter(
                    (t) => t.session_id === selectedHistoryId && profileOf(t.user_id)?.team_id === team.id,
                  );
                  if (teamTargets.length === 0) return null;
                  const teamTarget = teamTargets.reduce((sum, t) => sum + t.target, 0);
                  const teamActual = appointments.filter(
                    (a) => a.session_id === selectedHistoryId && profileOf(a.beller_id)?.team_id === team.id,
                  ).length;
                  return (
                    <div key={team.id} className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                      <div className="px-5 py-3 bg-slate-100/50 border-b border-slate-100 flex justify-between items-center">
                        <h5 className="font-bold text-xs text-[#E62C48] uppercase tracking-wide">{team.name}</h5>
                        <span className="text-[10px] font-black text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                          Team Target: {teamTarget}
                        </span>
                      </div>
                      <div className="p-5 space-y-3">
                        <div className="grid grid-cols-12 text-[10px] font-bold text-slate-400 pb-2 border-b border-slate-200/60">
                          <div className="col-span-6">Beller</div>
                          <div className="col-span-3 text-center">Score</div>
                          <div className="col-span-3 text-right">Target</div>
                        </div>
                        {teamTargets.map((t) => {
                          const actual = appointments.filter(
                            (a) => a.beller_id === t.user_id && a.session_id === selectedHistoryId,
                          ).length;
                          return (
                            <div key={t.user_id} className="grid grid-cols-12 items-center py-1">
                              <div className="col-span-6">
                                <p className="font-bold text-sm text-slate-700">{formatName(profileOf(t.user_id)?.email)}</p>
                              </div>
                              <div className="col-span-3 text-center">
                                <span
                                  className={`font-black text-sm ${actual >= t.target ? 'text-[#8DBC65]' : 'text-slate-800'}`}
                                >
                                  {actual}
                                </span>
                              </div>
                              <div className="col-span-3 text-right">
                                <span className="text-xs font-bold text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded">
                                  {t.target}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="pt-3 border-t border-slate-200 mt-2 flex justify-between items-center">
                          <span className="text-[10px] font-black text-slate-400 uppercase">Team Totaal</span>
                          <span
                            className={`text-sm font-black ${teamActual >= teamTarget ? 'text-[#8DBC65]' : 'text-slate-800'}`}
                          >
                            {teamActual} / {teamTarget}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 py-20">
              <div className="bg-slate-50 p-6 rounded-full mb-4">
                <FileTextIcon size={40} strokeWidth={1.5} />
              </div>
              <p className="text-sm font-bold">Selecteer een sessie uit de lijst</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ---------- Lopende sessie ----------
  const renderActiveSession = (session: Session) => {
    const targetsInSession = sessionTargets.filter((t) => t.session_id === session.id);
    const withoutTeam = targetsInSession.filter((t) => !profileOf(t.user_id)?.team_id);
    return (
      <>
        <div className="bg-white p-8 rounded-3xl border border-[#8DBC65]/20 shadow-xl shadow-[#8DBC65]/5 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-[#8DBC65]/10 rounded-2xl flex items-center justify-center text-[#8DBC65]">
                <CheckCircleIcon size={32} />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#8DBC65]/20 text-[#8DBC65] px-3 py-1 rounded-full text-[10px] font-bold">
                    Sessie actief
                  </span>
                  <span className="bg-red-100 text-[#E62C48] px-3 py-1 rounded-full text-[10px] font-bold">
                    {session.quarter}
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-800">{session.name}</h3>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={onToggleBlindMode}
                className={`flex items-center gap-2 px-6 py-4 rounded-2xl font-bold text-xs transition-all border-2 ${
                  settings.blind_mode_enabled
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                    : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'
                }`}
              >
                {settings.blind_mode_enabled ? <EyeOffIcon /> : <EyeIcon />}
                {settings.blind_mode_enabled ? 'Blind-modus AAN' : 'Grafiek uitzetten'}
              </button>
              <button
                onClick={onCloseSession}
                className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-red-200 transition-all flex items-center gap-3"
              >
                Bevriezen & archiveren
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between border-b pb-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-slate-800">Targets Beheren</h3>
              <p className="text-slate-400 font-medium mt-1">Pas targets aan voor de lopende sessie.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6">
            {teams.map((team) => {
              const teamTargets = targetsInSession.filter((t) => profileOf(t.user_id)?.team_id === team.id);
              if (teamTargets.length === 0) return null;
              return (
                <div key={team.id} className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-100">
                    <span className="font-bold text-[#E62C48] text-xs">{team.name}</span>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {teamTargets.map((t) => {
                      const profile = profileOf(t.user_id);
                      return profile ? <LiveTargetRow key={t.user_id} target={t} profile={profile} /> : null;
                    })}
                  </div>
                </div>
              );
            })}
            {withoutTeam.length > 0 && (
              <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-100">
                  <span className="font-bold text-slate-400 text-xs italic">Geen Team</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {withoutTeam.map((t) => {
                    const profile = profileOf(t.user_id);
                    return profile ? <LiveTargetRow key={t.user_id} target={t} profile={profile} /> : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  // ---------- Nieuwe sessie ----------
  const renderNewSession = () => (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
      <div className="flex items-center justify-between border-b pb-6">
        <div>
          <h3 className="text-2xl font-bold tracking-tight text-slate-800">Nieuwe sessie</h3>
          <p className="text-slate-400 font-medium mt-1">Selecteer een maand en stel targets in voor de nieuwe sessie.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-white px-6 py-4 rounded-2xl text-right shadow-lg" style={{ backgroundColor: COLORS.teal }}>
            <p className="text-[10px] font-bold text-slate-300 leading-none uppercase tracking-widest">Totaal target</p>
            <p className="text-2xl font-black mt-1 leading-none">{totalTarget}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400">Selecteer Maand</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)} className={selectClass}>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400">Kwartaal</label>
          <select value={quarter} onChange={(e) => setQuarter(e.target.value)} className={selectClass}>
            {QUARTER_OPTIONS.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-400">Aanwezigheid & targets</h4>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {teams.map((team) => {
            const members = bellers.filter((p) => p.team_id === team.id);
            if (members.length === 0) return null;
            const teamTarget = members.reduce((sum, p) => sum + (draft[p.id]?.active ? draft[p.id].target : 0), 0);
            return (
              <div key={team.id} className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden">
                <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <span className="font-bold text-[#E62C48] text-xs">{team.name}</span>
                  <TeamBadge label="Team target:" value={teamTarget} />
                </div>
                <div className="divide-y divide-slate-100">
                  {members.map((p) => (
                    <DraftRow
                      key={p.id}
                      profile={p}
                      draft={draft[p.id]}
                      onToggle={() => toggleActive(p.id)}
                      onTargetChange={(target) => setTarget(p.id, target)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
          {unassignedBellers.length > 0 && (
            <div className="bg-slate-50 rounded-3xl border border-slate-100 overflow-hidden mt-6">
              <div className="bg-slate-100/50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-500 text-xs italic">Geen Team Toegewezen</span>
                <TeamBadge
                  label="Target:"
                  value={unassignedBellers.reduce((sum, p) => sum + (draft[p.id]?.active ? draft[p.id].target : 0), 0)}
                />
              </div>
              <div className="divide-y divide-slate-100">
                {unassignedBellers.map((p) => (
                  <DraftRow
                    key={p.id}
                    profile={p}
                    draft={draft[p.id]}
                    showNoTeam
                    onToggle={() => toggleActive(p.id)}
                    onTargetChange={(target) => setTarget(p.id, target)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-4 items-center">
        <button
          onClick={saveDrafts}
          disabled={saveState !== 'idle'}
          className={`flex-1 w-full md:w-auto flex items-center justify-center gap-3 px-10 py-5 rounded-3xl font-bold text-sm shadow-sm transition-all border ${
            saveState === 'saved'
              ? 'bg-green-50 border-green-200 text-green-600'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50'
          }`}
        >
          {saveState === 'saving' ? (
            <span className="flex items-center gap-2 italic">Opslaan...</span>
          ) : saveState === 'saved' ? (
            <span className="flex items-center gap-2">✓ Targets opgeslagen</span>
          ) : (
            <>
              <SaveIcon size={18} />
              Targets opslaan
            </>
          )}
        </button>
        <button
          onClick={openSession}
          className="flex-[2] w-full md:w-auto bg-[#E62C48] hover:bg-[#d1263f] text-white py-5 rounded-3xl font-bold shadow-2xl shadow-red-100 transition-all flex items-center justify-center gap-3"
        >
          <GaugeIcon size={20} />
          Sessie openen ({totalTarget} totaal)
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex gap-1">
          {tabButton('current', 'Actuele sessie')}
          {tabButton('history', 'Historie')}
        </div>
      </div>
      {view === 'history' ? (
        renderHistory()
      ) : (
        <div className="space-y-8 text-slate-900">{activeSession ? renderActiveSession(activeSession) : renderNewSession()}</div>
      )}
    </div>
  );
};
