import { getCurrentSubscription, PLAN_CONFIGS } from '@/app/actions/subscription';
import { formatFCFA } from '@/lib/utils/formatters';

export default async function SubscriptionsPage() {
  const result = await getCurrentSubscription();
  const plan = result.planDetails || PLAN_CONFIGS.free;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-white">Mon Abonnement ShopFlow</h1>
        <p className="text-sm text-slate-400 mt-1">Gérez votre formule SaaS et consultez vos limites de produits et commandes</p>
      </div>

      {/* Formule Actuelle */}
      <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Formule Actuelle</span>
          <h2 className="text-2xl font-extrabold text-white mt-1">{plan.name}</h2>
          <p className="text-xs text-slate-400 mt-1">
            Jusqu'à {plan.maxProducts} produits • {plan.maxOrdersPerMonth} commandes/mois • {plan.maxUsers} utilisateur(s)
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-extrabold text-emerald-400">{formatFCFA(plan.priceFCFA)} <span className="text-xs text-slate-400 font-normal">/ mois</span></p>
          <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-full mt-2 border border-emerald-500/20">
            ● Actif
          </span>
        </div>
      </div>

      {/* Grille des Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PLAN_CONFIGS).map((p) => {
          const isCurrent = p.code === plan.code;
          return (
            <div
              key={p.code}
              className={`p-6 rounded-2xl border flex flex-col justify-between space-y-6 ${
                isCurrent
                  ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-900/50 border-slate-800'
              }`}
            >
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-white">{p.name}</h3>
                <p className="text-2xl font-extrabold text-emerald-400">
                  {formatFCFA(p.priceFCFA)} <span className="text-xs text-slate-400 font-normal">/ mois</span>
                </p>
                <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-800">
                  <li className="flex items-center gap-2">
                    <span>✓</span> Jusqu'à {p.maxProducts} produits
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> {p.maxOrdersPerMonth} commandes / mois
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> {p.maxUsers} accès utilisateur(s)
                  </li>
                  <li className="flex items-center gap-2">
                    <span>✓</span> Support WhatsApp prioritaire
                  </li>
                </ul>
              </div>

              <button
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition ${
                  isCurrent
                    ? 'bg-slate-800 text-slate-500 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                }`}
              >
                {isCurrent ? 'Formule Actuelle' : 'Choisir cette formule'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
