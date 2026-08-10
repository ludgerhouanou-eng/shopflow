'use client';

import { useState } from 'react';
import { PublicStoreData } from '@/lib/services/store';
import { formatFCFA } from '@/lib/utils/formatters';
import { createPublicOrder } from '@/app/actions/order';
import { Product } from '@/types/database';

interface CartItem {
  product: Product;
  quantity: number;
}

export default function PublicStoreClient({ storeData }: { storeData: PublicStoreData }) {
  const { business, products, categories } = storeData;

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Formulaire de commande
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_delivery' | 'mobile_money_manual' | 'online'>('cash_on_delivery');
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtrage des produits
  const filteredProducts = products.filter((p) => {
    const matchesCategory = !selectedCategory || p.category_id === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.product.stock) return item;
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const subtotal = cart.reduce((acc, item) => {
    const price = item.product.promotional_price || item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const deliveryFee = Number(business.delivery_settings?.delivery_fee || 1000);
  const totalAmount = subtotal > 0 ? subtotal + deliveryFee : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setError(null);

    const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const res = await createPublicOrder({
      businessSlug: business.slug,
      customerName,
      customerPhone,
      deliveryAddress,
      paymentMethod,
      idempotencyKey,
      items: cart.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
      })),
    });

    if (!res.success) {
      setError(res.error || 'Erreur lors de la création de la commande');
      setSubmitting(false);
      return;
    }

    setOrderSuccess(`Votre commande ${res.order?.order_number} a bien été enregistrée !`);
    setCart([]);
    setSubmitting(false);
  };

  const whatsappMessage = encodeURIComponent(
    `Bonjour ${business.name}, je souhaite me renseigner sur vos produits.`
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* En-tête Boutique */}
      <header className="bg-slate-900 border-b border-slate-800 p-6 sticky top-0 z-30 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 rounded-xl flex items-center justify-center text-2xl font-bold text-emerald-400">
              🛍️
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{business.name}</h1>
              <p className="text-xs text-slate-400">📍 {business.city} • Expédition rapide</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://wa.me/${business.whatsapp_number.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex px-3.5 py-2 bg-green-600/20 text-green-400 border border-green-600/30 rounded-xl text-xs font-bold items-center gap-1.5 hover:bg-green-600/30 transition"
            >
              💬 WhatsApp
            </a>

            <button
              onClick={() => setIsCartOpen(true)}
              className="relative px-4 py-2.5 bg-emerald-500 text-slate-950 font-bold text-sm rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <span>🛒 Panier</span>
              {cart.length > 0 && (
                <span className="bg-slate-950 text-emerald-400 px-2 py-0.5 rounded-full text-xs font-extrabold">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Description & Bannière */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {business.description && (
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl text-sm text-slate-300">
            {business.description}
          </div>
        )}

        {/* Barre de Recherche et Catégories */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="🔍 Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 text-sm transition"
          />

          {categories.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  selectedCategory === null
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Tous les produits
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    selectedCategory === c.id
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Grille des Produits */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            Aucun produit ne correspond à votre recherche.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock === 0;

              return (
                <div
                  key={p.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
                >
                  <div className="space-y-3">
                    <div className="w-full h-40 bg-slate-950 rounded-xl flex items-center justify-center text-4xl border border-slate-800/80">
                      📦
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{p.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.description || ''}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                    <div>
                      {p.promotional_price ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-500 line-through">{formatFCFA(Number(p.price))}</span>
                          <span className="text-base font-extrabold text-emerald-400">
                            {formatFCFA(Number(p.promotional_price))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-base font-extrabold text-emerald-400">{formatFCFA(Number(p.price))}</span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(p)}
                      disabled={isOutOfStock}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition ${
                        isOutOfStock
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20'
                      }`}
                    >
                      {isOutOfStock ? 'Épuisé' : '+ Ajouter'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Drawer / Modal de Panier & Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🛒 Votre Panier</span>
                </h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-slate-400 hover:text-white text-xl font-bold"
                >
                  ✕
                </button>
              </div>

              {orderSuccess ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-3 my-auto">
                  <span className="text-4xl">🎉</span>
                  <h3 className="font-bold text-emerald-400 text-lg">Commande Confirmée !</h3>
                  <p className="text-xs text-slate-300">{orderSuccess}</p>
                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      setIsCartOpen(false);
                    }}
                    className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
                  >
                    Continuer mes achats
                  </button>
                </div>
              ) : cart.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  Votre panier est actuellement vide.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Articles du panier */}
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1 divide-y divide-slate-800">
                    {cart.map((item) => {
                      const itemPrice = item.product.promotional_price || item.product.price;
                      return (
                        <div key={item.product.id} className="pt-3 flex items-center justify-between text-sm">
                          <div>
                            <p className="font-bold text-white">{item.product.name}</p>
                            <p className="text-xs text-emerald-400">{formatFCFA(itemPrice)} × {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.product.id, -1)}
                              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-lg font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-white w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.product.id, 1)}
                              className="w-7 h-7 bg-slate-800 text-slate-300 rounded-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Résumé des Montants */}
                  <div className="p-4 bg-slate-950 rounded-xl space-y-2 text-xs border border-slate-800">
                    <div className="flex justify-between text-slate-400">
                      <span>Sous-total articles:</span>
                      <span>{formatFCFA(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Frais de livraison:</span>
                      <span>{formatFCFA(deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-emerald-400 border-t border-slate-800 pt-2">
                      <span>Total à payer:</span>
                      <span>{formatFCFA(totalAmount)}</span>
                    </div>
                  </div>

                  {/* Formulaire de coordonnées */}
                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleCheckout} className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Votre Nom & Prénom *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Ablawa Dossou"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Téléphone (WhatsApp) *</label>
                      <input
                        type="tel"
                        required
                        placeholder="+229 97 00 00 00"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Adresse ou Quartier de Livraison *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Haie Vive, Rue 125, Cotonou"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Moyen de Paiement *</label>
                      <select
                        value={paymentMethod}
                        onChange={(e: any) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs"
                      >
                        <option value="cash_on_delivery">💵 Paiement à la livraison</option>
                        <option value="mobile_money_manual">📲 Mobile Money (MTN / Moov)</option>
                        <option value="online">💳 Paiement en ligne sécurisé</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 mt-2"
                    >
                      {submitting ? 'Validation...' : 'Confirmer la commande'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
