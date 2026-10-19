import React, { useMemo, useState } from 'react';
import { type Appointment, type Profile, type Session, type Team, UserRole } from '../types';
import { formatName } from '../utils/format';
import { CalendarIcon, ChevronLeftIcon, FileIcon, SearchIcon } from './icons';

interface Props {
  appointments: Appointment[];
  profiles: Profile[];
  teams: Team[];
  sessions: Session[];
  onBack: () => void;
  isPersonalView: boolean;
}

const filterClass =
  'w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none cursor-pointer hover:bg-slate-100 transition-colors';

export const AppointmentLog: React.FC<Props> = ({ appointments, profiles, teams, sessions, onBack, isPersonalView }) => {
  const [search, setSearch] = useState('');
  const [bellerId, setBellerId] = useState('');
  const [teamId, setTeamId] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [date, setDate] = useState('');

  const filtered = useMemo(
    () =>
      appointments.filter((a) => {
        const beller = profiles.find((p) => p.id === a.beller_id);
        return (
          a.customer_name.toLowerCase().includes(search.toLowerCase()) &&
          (!bellerId || a.beller_id === bellerId) &&
          (!teamId || beller?.team_id === teamId) &&
          (!sessionId || a.session_id === sessionId) &&
          (!date || a.appointment_date === date)
        );
      }),
    [appointments, search, bellerId, teamId, sessionId, date, profiles],
  );

  const resetFilters = () => {
    setSearch('');
    setBellerId('');
    setTeamId('');
    setSessionId('');
    setDate('');
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1400px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <button
            onClick={onBack}
            className="text-[#E62C48] flex items-center gap-2 text-sm font-bold hover:underline mb-2 group"
          >
            <ChevronLeftIcon className="group-hover:-translate-x-1 transition-transform" />
            Terug naar dashboard
          </button>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">
            {isPersonalView ? 'Mijn afspraken' : 'Volledig logboek'}
            <span className="ml-4 text-sm font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
              {filtered.length} resultaten
            </span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Zoek op klantnaam..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-4 focus:ring-red-50 outline-none w-64 text-sm font-bold shadow-sm transition-all"
            />
            <SearchIcon size={18} className="absolute left-3 top-3 text-slate-400" />
          </div>
        </div>
      </div>

      {!isPersonalView && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-4 gap-6 animate-in slide-in-from-top-4 duration-300">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1">Beller</label>
            <select value={bellerId} onChange={(e) => setBellerId(e.target.value)} className={filterClass}>
              <option value="">Alle bellers</option>
              {profiles
                .filter((p) => p.role === UserRole.BELLER)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatName(p.email)}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1">Team</label>
            <select value={teamId} onChange={(e) => setTeamId(e.target.value)} className={filterClass}>
              <option value="">Alle teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1">Sessie / Bel-dag</label>
            <select value={sessionId} onChange={(e) => setSessionId(e.target.value)} className={filterClass}>
              <option value="">Alle sessies</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.quarter})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 ml-1">Afspraakdatum</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold outline-none"
              />
              <button
                onClick={resetFilters}
                className="bg-red-50 text-[#E62C48] px-4 py-2.5 rounded-xl text-[10px] font-black hover:bg-red-100 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-400 text-[10px] font-black">
                <th className="px-8 py-5 border-b border-slate-100">Registratie</th>
                <th className="px-8 py-5 border-b border-slate-100">Klant / bedrijf</th>
                <th className="px-8 py-5 border-b border-slate-100">Afspraak op</th>
                {!isPersonalView && <th className="px-8 py-5 border-b border-slate-100">Team</th>}
                <th className="px-8 py-5 border-b border-slate-100">Beller</th>
                <th className="px-8 py-5 border-b border-slate-100 text-right">Referentie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length > 0 ? (
                filtered.map((a) => {
                  const beller = profiles.find((p) => p.id === a.beller_id);
                  const team = teams.find((t) => t.id === beller?.team_id);
                  const session = sessions.find((s) => s.id === a.session_id);
                  return (
                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-700">
                            {new Date(a.created_at).toLocaleDateString('nl-NL')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {new Date(a.created_at).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-red-50 text-[#E62C48] flex items-center justify-center font-black text-sm border border-red-100 shadow-sm group-hover:scale-110 transition-transform">
                            {a.customer_name[0].toUpperCase()}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-sm tracking-tight">{a.customer_name}</span>
                            <span className="text-[10px] font-bold text-slate-400">{session?.name || 'onbekende sessie'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-[#8DBC65] rounded-xl text-xs font-black border border-green-100">
                          <CalendarIcon size={12} strokeWidth={3} />
                          {new Date(a.appointment_date).toLocaleDateString('nl-NL')}
                        </div>
                      </td>
                      {!isPersonalView && (
                        <td className="px-8 py-5">
                          <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                            {team?.name || 'los'}
                          </span>
                        </td>
                      )}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#E62C48]" />
                          <span className="text-sm font-bold text-slate-600">{formatName(beller?.email)}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <span className="text-[10px] font-mono font-bold text-slate-300">#{a.id.slice(0, 8)}</span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isPersonalView ? 5 : 6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center opacity-40">
                      <FileIcon size={48} strokeWidth={1.5} className="mb-4" />
                      <p className="text-lg font-black tracking-widest">Geen resultaten gevonden</p>
                      <p className="text-xs font-bold mt-2">Pas je filters aan of zoek op een andere klantnaam.</p>
                      <button onClick={resetFilters} className="mt-6 text-[#E62C48] font-black text-[10px] hover:underline">
                        Alle filters wissen
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
