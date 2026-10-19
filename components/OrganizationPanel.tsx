import React, { useMemo, useState } from 'react';
import { api } from '../services';
import { type Profile, type Team, UserRole } from '../types';
import { formatName } from '../utils/format';
import { TrashIcon } from './icons';

interface Props {
  profiles: Profile[];
  teams: Team[];
}

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-red-100 transition-all';
const labelClass = 'text-[10px] font-black text-slate-400 ml-1';

export const OrganizationPanel: React.FC<Props> = ({ profiles, teams }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>(UserRole.BELLER);
  const [teamName, setTeamName] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const sortedProfiles = useMemo(
    () => [...profiles].sort((a, b) => formatName(a.email).localeCompare(formatName(b.email), undefined, { sensitivity: 'base' })),
    [profiles],
  );

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    try {
      await api.inviteUser(inviteEmail, inviteRole, null);
      setInviteSuccess(`Uitnodiging verstuurd naar ${inviteEmail}`);
      setInviteEmail('');
      setTimeout(() => setInviteSuccess(null), 5000);
    } catch (err) {
      setInviteError((err as Error).message || 'Kon gebruiker niet uitnodigen');
    } finally {
      setInviting(false);
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    try {
      await api.createTeam(teamName.trim());
      setTeamName('');
    } catch (err) {
      console.error('Error creating team:', err);
      alert('Kon team niet aanmaken: ' + (err as Error).message);
    }
  };

  const handleTeamChange = async (profileId: string, teamId: string) => {
    try {
      await api.updateProfile(profileId, { team_id: teamId || null });
    } catch (err) {
      console.error('Error updating user team:', err);
      alert('Kon team niet updaten: ' + (err as Error).message);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (
      !confirm(
        `Weet je zeker dat je deze gebruiker wilt verwijderen? Hun toegang tot de app wordt direct geblokkeerd.\n\nLet op: Ze blijven zichtbaar in Firebase Auth totdat je ze daar handmatig verwijdert.`,
      )
    )
      return;
    try {
      await api.deleteProfile(profileId);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Kon gebruiker niet verwijderen: ' + (err as Error).message);
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 text-slate-900">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-800">Gebruikersbeheer</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-0.5">Organisatie structuur</p>
            </div>
            <span className="text-[10px] font-black bg-red-50 text-[#E62C48] px-3 py-1 rounded-full">
              {profiles.length} accounts
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-400 border-b">
                <tr>
                  <th className="px-6 py-4">Gebruiker</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Team toewijzing</th>
                  <th className="px-6 py-4 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sortedProfiles.map((profile) => {
                  const isAdmin = profile.role === UserRole.ADMIN;
                  return (
                    <tr key={profile.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                              isAdmin ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-[#E62C48]'
                            }`}
                          >
                            {profile.email[0].toUpperCase()}
                          </div>
                          <span className="font-bold text-sm text-slate-700">{formatName(profile.email)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-[9px] font-black px-2 py-1 rounded-md ${
                            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-[#E62C48]'
                          }`}
                        >
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {profile.role === UserRole.BELLER ? (
                          <select
                            value={profile.team_id || ''}
                            onChange={(e) => handleTeamChange(profile.id, e.target.value)}
                            className="text-xs font-bold bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#E62C48] outline-none cursor-pointer text-slate-600"
                          >
                            <option value="">Geen team</option>
                            {teams.map((team) => (
                              <option key={team.id} value={team.id}>
                                {team.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-[10px] font-black text-slate-300 italic">n.v.t.</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(profile.id)}
                          className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h4 className="font-black text-slate-800 text-sm">Nieuwe gebruiker</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Voeg account toe aan de lijst</p>
          </div>
          <form onSubmit={handleInvite} className="space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>E-mailadres</label>
              <input
                type="email"
                required
                placeholder="naam@saleswise.eu"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label className={labelClass}>Rol</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
              >
                <option value={UserRole.BELLER}>Beller</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
            </div>
            {inviteError && (
              <p className="text-xs font-bold text-[#E62C48] bg-red-50 p-3 rounded-xl border border-red-100">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="text-xs font-bold text-green-600 bg-green-50 p-3 rounded-xl border border-green-100">
                {inviteSuccess}
              </p>
            )}
            <button
              type="submit"
              disabled={inviting}
              className={`w-full py-4 rounded-2xl font-black text-[10px] shadow-xl transition-all active:scale-95 mt-4 ${
                inviting
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#E62C48] text-white shadow-red-100 hover:bg-[#d1263f] hover:-translate-y-0.5'
              }`}
            >
              {inviting ? 'Versturen...' : 'Gebruiker uitnodigen & aanmaken'}
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-red-500">
          <div className="mb-6">
            <h4 className="font-black text-slate-800 text-sm">Nieuw team</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-1">Breid de organisatie uit</p>
          </div>
          <form onSubmit={handleCreateTeam} className="space-y-5">
            <div className="space-y-1.5">
              <label className={labelClass}>Team naam</label>
              <input
                type="text"
                required
                placeholder="Bijv. Team Gamma"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className={inputClass}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] shadow-xl shadow-slate-200 hover:bg-black transition-all"
            >
              Team toevoegen
            </button>
          </form>
        </div>

        <div className="p-8 rounded-3xl text-white" style={{ backgroundColor: '#074750' }}>
          <h4 className="font-black text-xs text-[#E62C48] mb-6 italic">Team overzicht</h4>
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#E62C48] group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-black tracking-tight">{team.name}</span>
                </div>
                <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded text-white/60">
                  {profiles.filter((p) => p.team_id === team.id).length} beller(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
