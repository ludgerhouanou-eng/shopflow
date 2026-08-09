import Link from 'next/link';
import { getDashboardMetrics } from '@/app/actions/dashboard';
import { formatFCFA } from '@/lib/utils/formatters';

export default async function DashboardPage() {
  const result = await getDashboardMetrics();
  const metrics = result.metrics || {
    totalRevenue: 0,
    totalOrdersCount: 0,
    pendingOrdersCount: 0,
    pendingPaymentsCount: 0,
    lowStockProductsCount: 0,
    estimatedProfit: 0,
    topProducts: [],
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white">Tableau de bord</h1>
          <p className="text-sm text-slate-400 mt-1">Aperçu en temps réel des performances de votre boutique</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/products/new"
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            + Ajouter un produit
          </Link>
          <Link
            href="/boutique/demo"
            target="_blank"
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold rounded-xl border border-slate-700 transition"
          >
            🔗 Voir ma vitrine
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chiffre d’affaires</p>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{formatFCFA(metrics.totalRevenue)}</p>
          <p className="text-xs text-slate-500 mt-2">Bénéfice estimé: {formatFCFA(metrics.estimatedProfit)}</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Commandes totales</p>
          <p className="text-3xl font-extrabold text-white mt-2">{metrics.totalOrdersCount}</p>
          <p className="text-xs text-amber-400 mt-2">{metrics.pendingOrdersCount} en attente de livraison</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Paiements en attente</p>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{metrics.pendingPaymentsCount}</p>
          <p className="text-xs text-slate-500 mt-2">Mobile Money & à la livraison</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Alerte Stock Faible</p>
          <p className="text-3xl font-extrabold text-red-400 mt-2">{metrics.lowStockProductsCount}</p>
          <p className="text-xs text-slate-500 mt-2">Produits sous le seuil d’alerte</p>
        </div>
      </div>

      {/* Top Sold Products & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🔥</span> Produits les plus vendus
          </h2>
          {metrics.topProducts.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">Aucune vente enregistrée pour le moment.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {metrics.topProducts.map((p, idx) => (
                <div key={idx} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-slate-200">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.totalQuantitySold} unité(s) vendue(s)</p>
                  </div>
                  <span className="font-bold text-emerald-400">{formatFCFA(p.totalRevenueGenerated)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📲</span> Partage de votre boutique
          </h2>
          <p className="text-sm text-slate-400">
            Partagez facilement votre lien de catalogue public sur vos réseaux sociaux pour recevoir des commandes sur WhatsApp :
          </p>
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
            <span className="truncate font-mono">https://shopflow.bj/boutique/demo</span>
            <button className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 font-semibold rounded-lg hover:bg-emerald-500/30 transition shrink-0 ml-2">
              Copier
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <a
              href="https://wa.me/?text=Découvrez%20notre%20catalogue%20en%20ligne%20sur%20ShopFlow"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-green-600/20 text-green-400 border border-green-600/30 font-semibold text-xs rounded-xl text-center hover:bg-green-600/30 transition"
            >
              Partager sur WhatsApp
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 bg-blue-600/20 text-blue-400 border border-blue-600/30 font-semibold text-xs rounded-xl text-center hover:bg-blue-600/30 transition"
            >
              Partager sur Facebook
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
