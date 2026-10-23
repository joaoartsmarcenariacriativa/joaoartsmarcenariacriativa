import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useFavorites() {
  const { user, isCustomer } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    if (!user || !isCustomer) {
      setFavoriteIds(new Set());
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('customer_favorites')
      .select('product_id')
      .eq('user_id', user.id);
    setFavoriteIds(new Set((data ?? []).map(r => (r as { product_id: string }).product_id)));
    setLoading(false);
  }, [user, isCustomer]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggleFavorite = useCallback(async (productId: string): Promise<boolean> => {
    if (!user || !isCustomer) return false;
    const isFav = favoriteIds.has(productId);
    if (isFav) {
      await supabase.from('customer_favorites').delete().eq('user_id', user.id).eq('product_id', productId);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
      return false;
    } else {
      await supabase.from('customer_favorites').insert({ user_id: user.id, product_id: productId });
      setFavoriteIds(prev => new Set(prev).add(productId));
      return true;
    }
  }, [user, isCustomer, favoriteIds]);

  return { favoriteIds, toggleFavorite, loading };
}
