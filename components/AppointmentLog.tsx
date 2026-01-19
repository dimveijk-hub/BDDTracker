
import React, { useState } from 'react';
import { Appointment, Profile } from '../types';

interface AppointmentLogProps {
  appointments: Appointment[];
  profiles: Profile[];
  onBack: () => void;
}

export const AppointmentLog: React.FC<AppointmentLogProps> = ({ appointments, profiles, onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAppointments = appointments.filter(app => 
    app.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profiles.find(p => p.id === app.beller_id)?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <button 
            onClick={onBack}
            className="text-[#e72b47] flex items-center gap-2 text-sm font-bold hover:underline mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Terug naar Dashboard
          </button>
          <h2 className="text-2xl font-bold text-slate-800">Volledig Afspraken Logboek</h2>
        </div>
        <div className="relative">
          <input 
            type="text" 
            placeholder="Zoek klant of beller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-[#e72b47] outline-none w-64 text-sm"
          />
          <svg className="absolute left-3 top-2.5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4">Datum Ingevoerd</th>
                <th className="px-6 py-4">Klantnaam</th>
                <th className="px-6 py-4">Afspraakdatum</th>
                <th className="px-6 py-4">Beller</th>
                <th className="px-6 py-4 text-right">ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length > 0 ? filteredAppointments.map(app => (
                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(app.created_at).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{app.customer_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-red-50 text-[#e72b47] rounded text-xs font-bold">
                      {new Date(app.appointment_date).toLocaleDateString('nl-NL')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {profiles.find(p => p.id === app.beller_id)?.email}
                  </td>
                  <td className="px-6 py-4 text-right text-[10px] font-mono text-slate-400">
                    {app.id}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">
                    Geen afspraken gevonden die voldoen aan je zoekopdracht.
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
