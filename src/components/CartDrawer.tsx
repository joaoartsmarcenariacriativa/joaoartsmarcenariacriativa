import { useState } from 'react';
import { ShoppingBag, X, Minus, Plus, Trash2, Truck, Loader2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { formatBRL } from '@/lib/format';
import { fetchShippingQuote } from '@/lib/shipping';
import { supabase } from '@/lib/supabase';
import type { ShippingQuoteOption, Product } from '@/types';

interface CartDrawerProps {
  onNavigate: (path: string) => void;
}

export default function CartDrawer({ onNavigate }: CartDrawerProps) {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal, totalItems, setShippingOption, setCustomerCep } = useCart();
  const { settings } = useStoreSettings();
  const threshold = settings?.free_shipping_threshold ?? 200;
  const freeShippingEnabled = settings?.free_shipping_enabled ?? false;
  const [cartCep, setCartCep] = useState('');
  const [cartShippingOptions, setCartShippingOptions] = useState<ShippingQuoteOption[] | null>(null);
  const [cartShippingError, setCartShippingError] = useState<string | null>(null);
  const [cartShippingWarning, setCartShippingWarning] = useState<string | null>(null);
  const [cartShippingLoading, setCartShippingLoading] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);

  const progress = Math.min((subtotal / threshold) * 100, 100);
  const remaining = threshold - subtotal;
  const freeShipping = freeShippingEnabled && subtotal >= threshold;

  const handleCheckout = () => {
    if (cartCep) setCustomerCep(cartCep);
    closeCart();
    onNavigate('/checkout');
  };

  const calculateCartShipping = async () => {
    const cleanCep = cartCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setCartShippingError('CEP inválido.');
      setCartShippingOptions(null);
      return;
    }
    setCartShippingLoading(true);
    setCartShippingError(null);
    setCartShippingWarning(null);
    setCartShippingOptions(null);
    setSelectedShipping(null);
    setShippingOption(null);

    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productMap = new Map<string, Product>();
    (products as Product[] ?? []).forEach(p => productMap.set(p.id, p));

    const quoteProducts = items.map(item => {
      const p = productMap.get(item.product_id);
      return {
        weight_g: (p?.ship_weight_g ?? 500) + (p?.ship_packaging_weight_g ?? 0),
        length_cm: (p?.ship_length_cm ?? 20) + (p?.ship_packaging_cm ?? 0),
        width_cm: (p?.ship_width_cm ?? 20) + (p?.ship_packaging_cm ?? 0),
        height_cm: (p?.ship_height_cm ?? 10) + (p?.ship_packaging_cm ?? 0),
        declared_value: p?.ship_declared_value ?? item.price * item.quantity,
        quantity: item.quantity,
      };
    });

    const { options, error, warnings } = await fetchShippingQuote(cleanCep, quoteProducts);
    if (error) {
      setCartShippingError(error);
    } else {
      setCartShippingOptions(options);
      if (warnings && warnings.length > 0) {
        setCartShippingWarning(warnings[0]);
      }
    }
    setCartShippingLoading(false);
  };

  const selectedShippingCost = selectedShipping !== null && cartShippingOptions && cartShippingOptions[selectedShipping]
    ? cartShippingOptions[selectedShipping].price
    : 0;

  return (
    <>
      <div
        className={`fixed inset-0 bg-espresso/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeCart}
      />

      <div
        className={`fixed right-0 top-0 h-full w-full sm:w-96 bg-cream z-50 shadow-lift transform transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-5 border-b border-rim">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-wood" />
            <h2 className="font-serif text-xl font-medium text-espresso">
              Carrinho {totalItems > 0 && `(${totalItems})`}
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 hover:bg-rim/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {items.length > 0 && (
          <div className="px-5 py-3 bg-paper border-b border-rim space-y-2">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-wood flex-shrink-0" />
              <p className="text-xs font-medium text-espresso">Calcular frete do carrinho</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={cartCep}
                onChange={e => setCartCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Digite seu CEP"
                className="flex-1 px-3 py-1.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
              <button
                onClick={calculateCartShipping}
                disabled={cartShippingLoading}
                className="px-3 py-1.5 bg-espresso text-cream text-xs font-medium rounded-lg hover:bg-espresso-tint transition-colors disabled:opacity-50"
              >
                {cartShippingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'OK'}
              </button>
            </div>
            {cartShippingError && (
              <p className="text-xs text-red-600">{cartShippingError}</p>
            )}
            {cartShippingWarning && (
              <p className="text-xs text-amber-600">{cartShippingWarning}</p>
            )}
            {cartShippingOptions && cartShippingOptions.length > 0 && (
              <div className="space-y-1.5">
                {cartShippingOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedShipping(idx);
                      setShippingOption(cartShippingOptions[idx]);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all text-left ${
                      selectedShipping === idx
                        ? 'border-wood bg-wood/10'
                        : 'border-rim hover:border-wood/50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-espresso">{opt.name}</p>
                      <p className="text-[10px] text-muted">{opt.days} dias úteis</p>
                    </div>
                    <p className="text-xs font-semibold text-wood">{formatBRL(opt.price)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {items.length > 0 && freeShippingEnabled && (
          <div className="px-5 py-3 bg-wood/5 border-b border-rim">
            <div className="flex items-center gap-2 mb-2">
              <Truck className="w-4 h-4 text-wood flex-shrink-0" />
              <p className="text-xs text-muted">
                {freeShipping ? (
                  <span className="font-semibold text-moss">Você ganhou frete grátis!</span>
                ) : (
                  <>
                    Faltam <span className="font-bold text-wood">{formatBRL(remaining)}</span> para frete grátis
                  </>
                )}
              </p>
            </div>
            <div className="h-2 bg-rim/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-wood rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <ShoppingBag className="w-16 h-16 text-rim" />
              <p className="text-muted font-medium">Seu carrinho está vazio</p>
              <button
                onClick={() => {
                  closeCart();
                  onNavigate('/produtos');
                }}
                className="text-xs font-medium text-wood hover:text-espresso transition-colors"
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            items.map(item => (
              <div
                key={`${item.product_id}-${item.variation ?? ''}`}
                className="flex gap-3 p-3 bg-paper rounded-xl shadow-soft"
              >
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-medium text-espresso line-clamp-2">
                    {item.product_name}
                  </p>
                  {item.variation && (
                    <p className="text-[10px] text-muted mt-0.5">{item.variation}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variation, item.quantity - 1)
                        }
                        className="p-1 hover:bg-rim/50 rounded transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5 text-muted" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center text-espresso">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.product_id, item.variation, item.quantity + 1)
                        }
                        className="p-1 hover:bg-rim/50 rounded transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5 text-muted" />
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-wood">
                      {formatBRL(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeItem(item.product_id, item.variation)}
                  className="self-start p-1 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-muted hover:text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-rim p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.12em] text-muted">Subtotal</span>
              <span className="font-serif text-xl font-medium text-espresso">{formatBRL(subtotal)}</span>
            </div>
            {selectedShippingCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.12em] text-muted">Frete</span>
                <span className="text-sm font-medium text-espresso">{formatBRL(selectedShippingCost)}</span>
              </div>
            )}
            {selectedShippingCost > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.12em] text-muted">Total</span>
                <span className="font-serif text-lg font-semibold text-espresso">{formatBRL(subtotal + selectedShippingCost)}</span>
              </div>
            )}
            <button
              onClick={handleCheckout}
              className="w-full py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
            >
              Finalizar Compra
            </button>
            <button
              onClick={() => {
                closeCart();
                onNavigate('/produtos');
              }}
              className="w-full py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
            >
              Continuar Comprando
            </button>
          </div>
        )}
      </div>
    </>
  );
}
