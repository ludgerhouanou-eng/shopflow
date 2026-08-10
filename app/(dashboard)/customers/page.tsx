import { getBusinessCustomers } from '@/app/actions/customer';
import { formatFCFA } from '@/lib/utils/formatters';

export default async function CustomersPage() {
  const result = await getBusinessCustomers();
  const customers = result.customers || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Gestion des Clients</h1>
        <p className="text-sm text-slate-400 mt-1">Fiches clients, historique d'achats et volumes dépensés</p>
      </div>

      {customers.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">👥</span>
          <h3 className="text-lg font-bold text-white">Aucun client enregistré</h3>
          <p className="text-sm text-slate-400">
            Les clients ayant passé commande sur votre boutique seront répertoriés ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Nom Complet</th>
                  <th className="px-6 py-4">Téléphone</th>
                  <th className="px-6 py-4">Commandes</th>
                  <th className="px-6 py-4">Total Dépensé</th>
                  <th className="px-6 py-4">Adresse</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-white">{c.full_name}</td>
                    <td className="px-6 py-4 text-emerald-400 font-mono">{c.phone}</td>
                    <td className="px-6 py-4 font-bold text-slate-200">{c.total_orders}</td>
                    <td className="px-6 py-4 font-bold text-emerald-400">
                      {formatFCFA(Number(c.total_spent))}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-xs truncate max-w-xs">
                      {c.delivery_address || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
