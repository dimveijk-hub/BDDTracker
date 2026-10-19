import React, { useMemo, useState } from 'react';
import { type Appointment, type Profile, type SessionTarget, type Team, UserRole } from '../types';
import { COLORS, formatName, progressColor } from '../utils/format';
import { AwardIcon, FileIcon } from './icons';

interface Props {
  profiles: Profile[];
  appointments: Appointment[];
  sessionTargets: SessionTarget[];
  teams: Team[];
  activeSessionId: string | null;
}

interface Entry {
  id: string;
  name: string;
  count: number;
  target: number;
  percentage: number;
}

const byScore = (a: Entry, b: Entry) => b.percentage - a.percentage || b.count - a.count;

export const Leaderboard: React.FC<Props> = ({ profiles, appointments, sessionTargets, teams, activeSessionId }) => {
  const [viewMode, setViewMode] = useState<'personal' | 'team'>('personal');
  // NB: "quarter" telt in de productie-versie *alle* sessies met een target, niet alleen het huidige kwartaal.
  const [period, setPeriod] = useState<'quarter' | 'beldag'>('quarter');

  const entries = useMemo<Entry[]>(() => {
    if (viewMode === 'personal') {
      return profiles
        .filter((p) => p.role === UserRole.BELLER)
        .map((p) => {
          const sessionIds =
            period === 'beldag'
              ? activeSessionId
                ? [activeSessionId]
                : []
              : Array.from(new Set(sessionTargets.filter((t) => t.user_id === p.id).map((t) => t.session_id)));
          const target = sessionTargets
            .filter((t) => t.user_id === p.id && sessionIds.includes(t.session_id))
            .reduce((sum, t) => sum + t.target, 0);
          const count = appointments.filter((a) => a.beller_id === p.id && sessionIds.includes(a.session_id)).length;
          return { id: p.id, name: formatName(p.email), count, target, percentage: target > 0 ? (count / target) * 100 : 0 };
        })
        .filter((e) => e.target > 0)
        .sort(byScore);
    }

    return teams
      .map((team) => {
        const members = profiles.filter((p) => p.team_id === team.id);
        const sessionIds =
          period === 'beldag'
            ? activeSessionId
              ? [activeSessionId]
              : []
            : Array.from(new Set(sessionTargets.map((t) => t.session_id)));
        let count = 0;
        let target = 0;
        sessionIds.forEach((sessionId) => {
          members.forEach((member) => {
            const memberTarget = sessionTargets.find((t) => t.session_id === sessionId && t.user_id === member.id);
            if (memberTarget) {
              target += memberTarget.target;
              count += appointments.filter((a) => a.session_id === sessionId && a.beller_id === member.id).length;
            }
          });
        });
        return { id: team.id, name: team.name, count, target, percentage: target > 0 ? (count / target) * 100 : 0 };
      })
      .filter((e) => e.target > 0)
      .sort(byScore);
  }, [viewMode, period, appointments, profiles, sessionTargets, activeSessionId, teams]);

  const segment = (active: boolean) =>
    `flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
      active ? 'bg-white text-[#E62C48] shadow-sm' : 'text-slate-500 hover:text-slate-700'
    }`;
  const periodButton = (active: boolean) =>
    `flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border transition-all ${
      active
        ? 'bg-red-50 border-red-200 text-[#E62C48] shadow-sm'
        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
    }`;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all">
      <div className="px-6 py-5 text-white" style={{ backgroundColor: COLORS.teal }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#E62C48] p-2 rounded-lg shadow-lg shadow-red-500/20">
              <AwardIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold leading-none">Top performers</h3>
              <p className="text-slate-300 text-xs font-medium mt-1 italic">Ranking op % target</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-3xl font-black text-white leading-none">{Math.round(entries[0]?.percentage || 0)}%</span>
            <p className="text-[10px] text-slate-400 font-bold">Top Score</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex bg-slate-200/60 p-1 rounded-xl">
          <button onClick={() => setViewMode('personal')} className={segment(viewMode === 'personal')}>
            Personen
          </button>
          <button onClick={() => setViewMode('team')} className={segment(viewMode === 'team')}>
            Teams
          </button>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPeriod('quarter')} className={periodButton(period === 'quarter')}>
            Kwartaal
          </button>
          <button onClick={() => setPeriod('beldag')} className={periodButton(period === 'beldag')}>
            Vandaag
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-2">
        {entries.length > 0 ? (
          entries.map((entry, index) => {
            const percentage = Math.round(entry.percentage);
            const color = progressColor(percentage);
            const rankClass =
              index === 0
                ? 'bg-amber-400 text-white'
                : index === 1
                  ? 'bg-slate-300 text-slate-700'
                  : index === 2
                    ? 'bg-orange-300 text-white'
                    : 'bg-slate-50 text-slate-400';
            return (
              <div
                key={entry.id}
                className={`group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200 ${
                  index === 0
                    ? 'bg-amber-50/50 border-amber-100 hover:border-amber-200'
                    : 'bg-white border-slate-100 hover:border-red-100 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-sm ${rankClass}`}>
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
                      {entry.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full transition-all duration-1000"
                          style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        {entry.count} / {entry.target}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 pl-4">
                  <span className={`text-2xl font-black leading-none ${index === 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {percentage}%
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">Target</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="bg-slate-50 p-5 rounded-full border border-slate-100 opacity-30">
              <FileIcon size={40} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-bold text-center px-10 leading-relaxed opacity-60">
              Geen resultaten gevonden voor dit filter.
            </p>
          </div>
        )}
      </div>

      <div className="px-5 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Sorteer: Behaald %</span>
          <span className="text-[#E62C48]">Live sync</span>
        </div>
      </div>
    </div>
  );
};
