import { useState } from 'react';
import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/context/AuthContext';

interface FavoriteButtonProps {
  productId: string;
  onNavigate?: (path: string) => void;
  className?: string;
  iconSize?: string;
}

export default function FavoriteButton({ productId, onNavigate, className = '', iconSize = 'w-5 h-5' }: FavoriteButtonProps) {
  const { isCustomer } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [busy, setBusy] = useState(false);
  const isFav = favoriteIds.has(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isCustomer) {
      onNavigate?.('/entrar');
      return;
    }
    setBusy(true);
    await toggleFavorite(productId);
    setBusy(false);
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      aria-label={isFav ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      className={`flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 ${className}`}
    >
      <Heart
        className={`${iconSize} ${isFav ? 'fill-red-500 text-red-500' : 'text-muted hover:text-red-500'}`}
      />
    </button>
  );
}
