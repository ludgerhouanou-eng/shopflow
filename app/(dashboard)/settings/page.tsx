import { getCurrentUserBusiness } from '@/app/actions/business';

export default async function SettingsPage() {
  const result = await getCurrentUserBusiness();
  const business = result.business;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Paramètres de la Boutique</h1>
        <p className="text-sm text-slate-400 mt-1">Configurez le nom, vos informations de livraison et vos modes de paiement</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Informations Générales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Nom de la boutique
            </label>
            <input
              type="text"
              readOnly
              value={business?.name || 'Ma Boutique ShopFlow'}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Slug URL publique
            </label>
            <input
              type="text"
              readOnly
              value={business?.slug || 'boutique-demo'}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-emerald-400 font-mono text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Numéro WhatsApp Commandes
            </label>
            <input
              type="text"
              readOnly
              value={business?.whatsapp_number || '+229 97 00 00 00'}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Ville Principale
            </label>
            <input
              type="text"
              readOnly
              value={business?.city || 'Cotonou'}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3 pt-4">Livraison & Paiement</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Frais de Livraison par Défaut (FCFA)
            </label>
            <input
              type="text"
              readOnly
              value={`${business?.delivery_settings?.delivery_fee || 1000} FCFA`}
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-emerald-400 font-bold text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Devise
            </label>
            <input
              type="text"
              readOnly
              value="XOF / FCFA"
              className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-white text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <p className="text-xs text-slate-500">Pour modifier ces paramètres avancés, contactez le support ShopFlow.</p>
        </div>
      </div>
    </div>
  );
}
