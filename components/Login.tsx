import React, { useState } from 'react';
import { api } from '../services';

const isDemo = import.meta.env.VITE_DEMO_MODE === 'true';

const inputClass =
  'w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-[#E62C48] transition-all';
const labelClass = 'block text-xs font-black text-slate-600 mb-1.5 uppercase tracking-wide';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.signIn(email, password);
    } catch (err) {
      console.error(err);
      setError((err as Error).message || 'Er is een fout opgetreden bij het inloggen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F5F1] flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700">
        <img src="/logo.png" alt="Saleswise Logo" className="w-16 h-16 object-contain drop-shadow-md mx-auto mb-4" />
        <h1 className="text-2xl font-black text-slate-800 tracking-tight">SalesWise</h1>
        <p className="text-xs font-bold text-slate-400 mt-1">Business development day</p>
      </div>

      <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 animate-in zoom-in duration-500">
        <h2 className="text-xl font-black text-slate-800 mb-6 text-center">Inloggen</h2>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-bold">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Email adres</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="naam@saleswise.eu"
              required
            />
          </div>
          <div>
            <label className={labelClass}>Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#E62C48] text-white font-black py-4 rounded-xl hover:bg-[#D41B39] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 shadow-lg shadow-red-900/10"
          >
            {loading ? 'Bezig met inloggen...' : 'Aanmelden'}
          </button>
        </form>

        {isDemo && (
          <p className="mt-6 text-[11px] font-bold text-slate-400 text-center">
            Demo-modus: log in met <span className="text-slate-600">admin@saleswise.eu</span> (beheerder) of{' '}
            <span className="text-slate-600">mark.visser@saleswise.eu</span> (beller), met een willekeurig wachtwoord.
          </p>
        )}
      </div>
    </div>
  );
};
