export default function PaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Suivi des Paiements</h1>
        <p className="text-sm text-slate-400 mt-1">Historique des encaissements Mobile Money, cartes et paiements à la livraison</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 space-y-4 text-center">
        <span className="text-4xl">💳</span>
        <h3 className="text-lg font-bold text-white">Configuration des Encaisssements</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          ShopFlow prend en charge les paiements Mobile Money (MTN / Moov) et les paiements à la livraison avec vérification d'idempotence.
        </p>
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl inline-block text-xs text-emerald-400 font-mono">
          Fournisseur actif : Mode Sandbox (Paiements simulés sécurisés)
        </div>
      </div>
    </div>
  );
}
