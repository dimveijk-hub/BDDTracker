
import React, { useState } from 'react';

interface AppointmentFormProps {
  onSubmit: (customer: string, date: string) => void;
  isLocked: boolean;
}

export const AppointmentForm: React.FC<AppointmentFormProps> = ({ onSubmit, isLocked }) => {
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
      <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-amber-100 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-amber-900 mb-2">Beller-omgeving is op slot</h3>
        <p className="text-amber-700">De admin heeft de Bel-dag momenteel niet geactiveerd. Je kunt pas weer data invoeren wanneer de status wijzigt.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h3 className="text-lg font-semibold mb-4 text-slate-800">Nieuwe Afspraak Toevoegen</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Klantnaam</label>
          <input
            type="text"
            required
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#e72b47] focus:border-[#e72b47] outline-none transition"
            placeholder="Bedrijfsnaam..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Datum Afspraak</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-[#e72b47] focus:border-[#e72b47] outline-none transition"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#e72b47] hover:bg-[#d1263f] text-white font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Opslaan
        </button>
      </form>
    </div>
  );
};
