import { getBusinessOrders } from '@/app/actions/order';
import { formatFCFA, formatDate } from '@/lib/utils/formatters';

export default async function OrdersPage() {
  const result = await getBusinessOrders();
  const orders = result.orders || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Gestion des Commandes</h1>
        <p className="text-sm text-slate-400 mt-1">Consultez et gérez l'état de traitement de toutes vos commandes</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">🛒</span>
          <h3 className="text-lg font-bold text-white">Aucune commande enregistrée</h3>
          <p className="text-sm text-slate-400">
            Les commandes passées par vos clients sur votre catalogue public apparaîtront ici en temps réel.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">N° Commande</th>
                  <th className="px-6 py-4">Client</th>
                  <th className="px-6 py-4">Téléphone</th>
                  <th className="px-6 py-4">Montant Total</th>
                  <th className="px-6 py-4">Statut Commande</th>
                  <th className="px-6 py-4">Statut Paiement</th>
                  <th className="px-6 py-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-bold text-emerald-400 font-mono">
                      {o.order_number}
                    </td>
                    <td className="px-6 py-4 font-medium text-white">{o.customer_name}</td>
                    <td className="px-6 py-4 text-slate-400">{o.customer_phone}</td>
                    <td className="px-6 py-4 font-bold text-white">
                      {formatFCFA(Number(o.total_amount))}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        o.payment_status === 'succeeded'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">{formatDate(o.created_at)}</td>
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
