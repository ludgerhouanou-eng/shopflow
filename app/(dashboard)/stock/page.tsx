import { getInventoryMovements } from '@/app/actions/product';
import { formatDate } from '@/lib/utils/formatters';

export default async function StockPage() {
  const result = await getInventoryMovements();
  const movements = result.movements || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Historique des Mouvements de Stock</h1>
        <p className="text-sm text-slate-400 mt-1">Suivi détaillé de tous les réapprovisionnements, ventes et ajustements d'inventaire</p>
      </div>

      {movements.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <span className="text-4xl">📊</span>
          <h3 className="text-lg font-bold text-white">Aucun mouvement de stock enregistré</h3>
          <p className="text-sm text-slate-400">
            Les ajustements de stock lors des ventes ou réapprovisionnements apparaîtront ici automatiquement.
          </p>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Variation</th>
                  <th className="px-6 py-4">Ancien Stock</th>
                  <th className="px-6 py-4">Nouveau Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-6 py-4 font-semibold uppercase text-xs">
                      <span className={`px-2 py-1 rounded-md ${
                        m.movement_type === 'sale'
                          ? 'bg-blue-500/10 text-blue-400'
                          : m.movement_type === 'restock'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {m.movement_type}
                      </span>
                    </td>
                    <td className={`px-6 py-4 font-bold ${m.quantity_change > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {m.quantity_change > 0 ? `+${m.quantity_change}` : m.quantity_change}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{m.previous_stock}</td>
                    <td className="px-6 py-4 font-bold text-white">{m.new_stock}</td>
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
