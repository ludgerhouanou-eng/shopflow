'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createProduct } from '@/app/actions/product';

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    promotionalPrice: '',
    stock: '10',
    lowStockThreshold: '5',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const priceNum = parseFloat(formData.price);
    const promoNum = formData.promotionalPrice ? parseFloat(formData.promotionalPrice) : null;
    const stockNum = parseInt(formData.stock, 10);
    const thresholdNum = parseInt(formData.lowStockThreshold, 10);

    const res = await createProduct({
      name: formData.name,
      description: formData.description || null,
      price: priceNum,
      promotionalPrice: promoNum,
      stock: stockNum,
      lowStockThreshold: thresholdNum,
      isActive: formData.isActive,
    });

    if (!res.success) {
      setError(res.error || 'Erreur lors de la création du produit.');
      setLoading(false);
      return;
    }

    router.push('/products');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Nouveau Produit</h1>
          <p className="text-sm text-slate-400 mt-1">Ajoutez un nouvel article à votre catalogue en ligne</p>
        </div>
        <Link
          href="/products"
          className="text-sm text-slate-400 hover:text-white transition"
        >
          ← Annuler
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-start gap-3">
          <span>⚠️</span>
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Nom du produit *
          </label>
          <input
            type="text"
            required
            placeholder="Ex: Pagne Bazin Riche 3 Mètres"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
            Description
          </label>
          <textarea
            rows={3}
            placeholder="Description détaillée du produit, couleurs disponibles, instructions..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Prix (FCFA) *
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder="15000"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Prix Promotionnel (FCFA, Optionnel)
            </label>
            <input
              type="number"
              min={0}
              placeholder="12000"
              value={formData.promotionalPrice}
              onChange={(e) => setFormData({ ...formData, promotionalPrice: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Stock Initial *
            </label>
            <input
              type="number"
              required
              min={0}
              placeholder="10"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Seuil d'alerte stock faible
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="5"
              value={formData.lowStockThreshold}
              onChange={(e) => setFormData({ ...formData, lowStockThreshold: e.target.value })}
              className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition text-sm"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="w-4 h-4 text-emerald-500 rounded bg-slate-800 border-slate-700"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-slate-300">
            Rendre ce produit immédiatement visible sur le catalogue public
          </label>
        </div>

        <div className="pt-4 flex justify-end gap-3">
          <Link
            href="/products"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20"
          >
            {loading ? 'Enregistrement...' : 'Enregistrer le produit'}
          </button>
        </div>
      </form>
    </div>
  );
}
