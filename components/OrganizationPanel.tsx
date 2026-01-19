
import React, { useState } from 'react';
import { Profile, Team, UserRole } from '../types';

interface OrganizationPanelProps {
  profiles: Profile[];
  teams: Team[];
  onUpdateProfiles: (profiles: Profile[]) => void;
  onUpdateTeams: (teams: Team[]) => void;
}

export const OrganizationPanel: React.FC<OrganizationPanelProps> = ({ profiles, teams, onUpdateProfiles, onUpdateTeams }) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.BELLER);
  const [selectedTeamId, setSelectedTeamId] = useState(teams[0]?.id || '');
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail) return;
    const newUser: Profile = {
      id: Math.random().toString(36).substr(2, 9),
      email: newUserEmail,
      role: newUserRole,
      team_id: newUserRole === UserRole.BELLER ? selectedTeamId : null
    };
    onUpdateProfiles([...profiles, newUser]);
    setNewUserEmail('');
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;
    const newTeam: Team = {
      id: 't' + (teams.length + 1) + Math.random().toString(36).substr(2, 4),
      name: newTeamName.trim()
    };
    onUpdateTeams([...teams, newTeam]);
    setNewTeamName('');
    if (!selectedTeamId) setSelectedTeamId(newTeam.id);
  };

  const updateUserTeam = (userId: string, teamId: string) => {
    onUpdateProfiles(profiles.map(p => p.id === userId ? { ...p, team_id: teamId } : p));
  };

  const deleteUser = (userId: string) => {
    if (confirm('Gebruiker definitief verwijderen?')) {
      onUpdateProfiles(profiles.filter(p => p.id !== userId));
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500 text-slate-900">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h3 className="font-black uppercase tracking-tight text-slate-800">Gebruikersbeheer</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Organisatie structuur</p>
            </div>
            <span className="text-[10px] font-black bg-red-50 text-[#e72b47] px-3 py-1 rounded-full uppercase">{profiles.length} Accounts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                <tr>
                  <th className="px-6 py-4">Gebruiker</th>
                  <th className="px-6 py-4">Rol</th>
                  <th className="px-6 py-4">Team Toewijzing</th>
                  <th className="px-6 py-4 text-right">Actie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {profiles.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${p.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-600' : 'bg-red-50 text-[#e72b47]'}`}>
                          {p.email[0].toUpperCase()}
                        </div>
                        <span className="font-bold text-sm text-slate-700">{p.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${p.role === UserRole.ADMIN ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-[#e72b47]'}`}>
                        {p.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {p.role === UserRole.BELLER ? (
                        <select 
                          value={p.team_id || ''} 
                          onChange={(e) => updateUserTeam(p.id, e.target.value)}
                          className="text-xs font-bold bg-slate-50 border border-slate-100 rounded-lg px-2 py-1 focus:ring-2 focus:ring-[#e72b47] outline-none cursor-pointer text-slate-600"
                        >
                          <option value="">Geen team</option>
                          {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 uppercase italic">N.v.t.</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteUser(p.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="mb-6">
            <h4 className="font-black uppercase tracking-tight text-slate-800 text-sm">Nieuwe Gebruiker</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Direct toevoegen aan team</p>
          </div>
          <form onSubmit={handleAddUser} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mailadres</label>
              <input 
                type="email" 
                required
                placeholder="naam@bedrijf.nl" 
                value={newUserEmail} 
                onChange={e => setNewUserEmail(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-red-100 transition-all" 
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol</label>
              <select 
                value={newUserRole} 
                onChange={e => setNewUserRole(e.target.value as UserRole)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
              >
                <option value={UserRole.BELLER}>Beller</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
            </div>

            {newUserRole === UserRole.BELLER && (
              <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Standaard Team</label>
                <select 
                  value={selectedTeamId} 
                  onChange={e => setSelectedTeamId(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none cursor-pointer"
                >
                  <option value="">Selecteer een team...</option>
                  {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-[#e72b47] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-red-100 hover:bg-[#d1263f] hover:-translate-y-0.5 transition-all active:scale-95 mt-4">
              Gebruiker Aanmaken
            </button>
          </form>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm border-t-4 border-t-red-500">
          <div className="mb-6">
            <h4 className="font-black uppercase tracking-tight text-slate-800 text-sm">Nieuw Team</h4>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Breid de organisatie uit</p>
          </div>
          <form onSubmit={handleAddTeam} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Team Naam</label>
              <input 
                type="text" 
                required
                placeholder="Bijv. Team Gamma" 
                value={newTeamName} 
                onChange={e => setNewTeamName(e.target.value)} 
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-red-100 transition-all" 
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:bg-black transition-all">
              Team Toevoegen
            </button>
          </form>
        </div>

        <div className="bg-slate-900 p-8 rounded-3xl text-white">
          <h4 className="font-black uppercase text-xs tracking-[0.2em] text-red-400 mb-6 italic">Team Overzicht</h4>
          <div className="space-y-4">
            {teams.map(t => (
              <div key={t.id} className="flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#e72b47] group-hover:scale-150 transition-transform" />
                  <span className="text-sm font-black uppercase tracking-tight">{t.name}</span>
                </div>
                <span className="text-[10px] font-black bg-white/10 px-2 py-1 rounded text-white/60">
                  {profiles.filter(p => p.team_id === t.id).length} beller(s)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
