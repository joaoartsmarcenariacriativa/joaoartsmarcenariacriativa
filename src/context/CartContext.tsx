import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { CartItem, ShippingQuoteOption } from '@/types';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (product_id: string, variation: string | null) => void;
  updateQuantity: (product_id: string, variation: string | null, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  shippingOption: ShippingQuoteOption | null;
  setShippingOption: (opt: ShippingQuoteOption | null) => void;
  customerCep: string;
  setCustomerCep: (cep: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_KEY = 'joao-arts-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [shippingOption, setShippingOption] = useState<ShippingQuoteOption | null>(null);
  const [customerCep, setCustomerCep] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore quota errors in private browsing
    }
  }, [items]);

  const addItem = useCallback((item: CartItem) => {
    setItems(prev => {
      const existing = prev.find(
        i => i.product_id === item.product_id && i.variation === item.variation
      );
      if (existing) {
        return prev.map(i =>
          i.product_id === item.product_id && i.variation === item.variation
            ? { ...i, quantity: Math.min(i.quantity + item.quantity, item.stock) }
            : i
        );
      }
      return [...prev, item];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((product_id: string, variation: string | null) => {
    setItems(prev => prev.filter(i => !(i.product_id === product_id && i.variation === variation)));
  }, []);

  const updateQuantity = useCallback(
    (product_id: string, variation: string | null, quantity: number) => {
      if (quantity <= 0) {
        removeItem(product_id, variation);
        return;
      }
      setItems(prev =>
        prev.map(i => {
          if (i.product_id === product_id && i.variation === variation) {
            const max = i.max_per_customer ? Math.min(i.stock, i.max_per_customer) : i.stock;
            return { ...i, quantity: Math.min(quantity, max) };
          }
          return i;
        })
      );
    },
    [removeItem]
  );

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart,
        closeCart,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shippingOption,
        setShippingOption,
        customerCep,
        setCustomerCep,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
