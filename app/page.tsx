import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-6">
      <header className="max-w-6xl mx-auto w-full flex justify-between items-center py-4">
        <div className="flex items-center gap-2 font-bold text-2xl text-emerald-400">
          <span>🛍️ ShopFlow</span>
        </div>
        <div className="flex gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-lg transition"
          >
            Créer ma boutique
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto text-center my-auto py-12">
        <span className="inline-block px-3 py-1 mb-4 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
          Spécialement conçu pour le Bénin et l’Afrique Francophone 🇧🇯
        </span>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Lancez votre boutique en ligne et vendez sur <span className="text-emerald-400">WhatsApp</span> en 5 minutes
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
          Gérez votre catalogue, vos stocks, vos commandes et vos paiements Mobile Money (MTN & Moov) et à la livraison sur une seule plateforme simple et rapide sur mobile.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
          <Link
            href="/register"
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-lg shadow-lg shadow-emerald-500/20 transition"
          >
            Démarrer gratuitement
          </Link>
          <Link
            href="/boutique/demo"
            className="px-6 py-3.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-semibold rounded-xl text-lg transition"
          >
            Voir une boutique démo
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 text-left border-t border-slate-800 pt-8">
          <div>
            <h3 className="font-bold text-emerald-400 text-lg">⚡ Ultra Rapide</h3>
            <p className="text-sm text-slate-400 mt-1">Fonctionne parfaitement même avec une connexion internet moyenne.</p>
          </div>
          <div>
            <h3 className="font-bold text-emerald-400 text-lg">💰 FCFA & MoMo</h3>
            <p className="text-sm text-slate-400 mt-1">Prix en FCFA et encaissements Mobile Money & à la livraison.</p>
          </div>
          <div>
            <h3 className="font-bold text-emerald-400 text-lg">📲 WhatsApp Direct</h3>
            <p className="text-sm text-slate-400 mt-1">Recevez vos commandes directement sur WhatsApp en un clic.</p>
          </div>
          <div>
            <h3 className="font-bold text-emerald-400 text-lg">📦 Stock Atomique</h3>
            <p className="text-sm text-slate-400 mt-1">Mise à jour automatique pour ne jamais vendre d’invendus.</p>
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-slate-600 py-4 border-t border-slate-900">
        © 2026 ShopFlow. Tous droits réservés.
      </footer>
    </div>
  );
}
