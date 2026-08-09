'use client';

import { useState } from 'react';
import Link from 'next/link';
import { resetPassword } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const res = await resetPassword(email);

    if (!res.success) {
      setError(res.error || 'Erreur lors de la réinitialisation.');
      setLoading(false);
      return;
    }

    setSuccessMessage(res.message || 'Un lien de réinitialisation vous a été envoyé par e-mail.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-400 mb-2">
            <span>🛍️ ShopFlow</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Mot de passe oublié</h1>
          <p className="text-sm text-slate-400 mt-1">Entrez votre adresse email pour recevoir un lien de réinitialisation</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
            <span>⚠️</span>
            <div>{error}</div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-start gap-3">
            <span>✉️</span>
            <div>{successMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-base shadow-lg shadow-emerald-500/20 transition duration-200 mt-2 flex items-center justify-center gap-2"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 mt-6">
          <Link href="/login" className="text-emerald-400 font-semibold hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}
