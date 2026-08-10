import Link from 'next/link';
import { logoutUser } from '@/app/actions/auth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Navigation (Desktop) & Mobile Top Nav */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-xl font-extrabold text-emerald-400">
              <span>🛍️ ShopFlow</span>
            </Link>
          </div>

          <nav className="p-4 space-y-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20"
            >
              <span>📊 Vue générale</span>
            </Link>
            <Link
              href="/products"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>📦 Produits & Stock</span>
            </Link>
            <Link
              href="/orders"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>🛒 Commandes</span>
            </Link>
            <Link
              href="/customers"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>👥 Clients</span>
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>💳 Paiements</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>⚙️ Paramètres Boutique</span>
            </Link>
            <Link
              href="/subscriptions"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              <span>⭐ Mon Abonnement</span>
            </Link>
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex justify-between items-center">
          <span>Formule : <strong className="text-emerald-400">Gratuit</strong></span>
          <form action={logoutUser}>
            <button type="submit" className="text-red-400 hover:underline">Déconnexion</button>
          </form>
        </div>
      </aside>

      {/* Main Dashboard Content Area */}
      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
