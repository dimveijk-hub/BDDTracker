import React, { useState } from 'react';
import { LockIcon, PlusIcon } from './icons';

interface Props {
  isLocked: boolean;
  onSubmit: (customer: string, date: string) => void;
}

export const AppointmentForm: React.FC<Props> = ({ isLocked, onSubmit }) => {
  const [customer, setCustomer] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !date) return;
    onSubmit(customer, date);
    setCustomer('');
    setDate('');
  };

  if (isLocked) {
    return (
      <div
        className="p-8 rounded-3xl text-center border shadow-sm animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: '#F8F5BE', borderColor: '#E5E1A0' }}
      >
        <div className="flex justify-center mb-4">
          <div className="bg-white/50 p-4 rounded-2xl shadow-inner">
            <LockIcon className="h-10 w-10 text-amber-700" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-amber-900 tracking-tight mb-2">Beller-omgeving is op slot</h3>
        <p className="text-amber-800 font-medium text-sm max-w-md mx-auto leading-relaxed">
          De administrator heeft de registratie momenteel gesloten. Je kunt weer data invoeren zodra er een nieuwe
          sessie wordt gestart.
        </p>
      </div>
    );
  }

  const inputClass =
    'w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:ring-4 focus:ring-red-100 transition-all';

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-4">Nieuwe afspraak toevoegen</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 ml-1">Klantnaam</label>
          <input
            type="text"
            required
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className={inputClass}
            placeholder="Bedrijfsnaam..."
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-400 ml-1">Datum afspraak</label>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </div>
        <button
          type="submit"
          className="w-full bg-[#E62C48] hover:bg-[#d1263f] text-white py-4 rounded-2xl font-bold text-sm shadow-xl shadow-red-100 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
        >
          <PlusIcon size={18} strokeWidth={3} />
          Afspraak registreren
        </button>
      </form>
    </div>
  );
};
