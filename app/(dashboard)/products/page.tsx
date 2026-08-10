import Link from 'next/link';
import { getBusinessProducts } from '@/app/actions/product';
import { formatFCFA } from '@/lib/utils/formatters';

export default async function ProductsPage() {
  const result = await getBusinessProducts();
  const products = result.products || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Gestion des Produits</h1>
          <p className="text-sm text-slate-400 mt-1">Gérez votre catalogue, vos prix et vos niveaux de stock</p>
        </div>
        <Link
          href="/products/new"
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <span>+ Ajouter un produit</span>
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
          <span className="text-4xl">📦</span>
          <h3 className="text-lg font-bold text-white">Aucun produit dans votre catalogue</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            Commencez à ajouter vos articles avec leurs prix, photos et stocks pour constituer votre boutique en ligne.
          </p>
          <Link
            href="/products/new"
            className="inline-block px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm"
          >
            Créer mon premier produit
          </Link>
        </div>
      ) : (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Produit</th>
                  <th className="px-6 py-4">Prix</th>
                  <th className="px-6 py-4">Prix Promo</th>
                  <th className="px-6 py-4">Stock</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {products.map((p) => {
                  const isLowStock = p.stock <= (p.low_stock_threshold || 5);
                  const isOutOfStock = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-lg shrink-0">
                          🛍️
                        </div>
                        <div>
                          <p className="font-bold text-slate-100">{p.name}</p>
                          <p className="text-xs text-slate-500 truncate max-w-xs">{p.description || 'Pas de description'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-400">
                        {formatFCFA(Number(p.price))}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {p.promotional_price ? (
                          <span className="text-emerald-300 font-semibold">{formatFCFA(Number(p.promotional_price))}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            isOutOfStock
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : isLowStock
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {isOutOfStock ? 'Rupture (0)' : isLowStock ? `Stock Faible (${p.stock})` : `${p.stock} unités`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-semibold ${p.is_active ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {p.is_active ? '● Actif' : '○ Masqué'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-xs font-semibold text-slate-400 hover:text-white transition">
                          Modifier
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
