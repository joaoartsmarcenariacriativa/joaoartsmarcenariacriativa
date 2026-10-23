import { Star, BadgeCheck, Hammer } from 'lucide-react';
import type { Product } from '@/types';
import { formatBRL, formatParcela } from '@/lib/format';
import FavoriteButton from '@/components/FavoriteButton';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
  onNavigate?: (path: string) => void;
}

const BADGE_STYLES: Record<string, string> = {
  'Feito à Mão': 'bg-wood/10 text-wood border-wood/30',
  'Madeira Nobre': 'bg-espresso text-cream border-espresso',
  'Pronta Entrega': 'bg-moss-light/20 text-moss border-moss-light/30',
  'Pet Friendly': 'bg-moss/15 text-moss border-moss/30',
  'Bordas Seguras': 'bg-clay-light/20 text-wood-dark border-clay-light/30',
  'Coleção Natal': 'bg-red-50 text-red-700 border-red-200',
  'Personalizado': 'bg-clay-light/20 text-clay border-clay/30',
};

export default function ProductCard({ product, onClick, onNavigate }: ProductCardProps) {
  const discount = product.compare_price
    ? Math.round(((product.compare_price - product.price) / product.compare_price) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="group bg-paper rounded-xl overflow-hidden shadow-card hover:shadow-lift transition-all duration-300 text-left flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-cream">
        {product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Hammer className="w-12 h-12 text-rim" />
          </div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.badges.slice(0, 2).map(badge => (
            <span
              key={badge}
              className={`text-[9px] uppercase tracking-[0.08em] px-2 py-1 rounded border ${
                BADGE_STYLES[badge] ?? 'bg-cream text-muted border-rim'
              }`}
            >
              {badge}
            </span>
          ))}
        </div>
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-wood text-cream text-xs font-semibold px-2 py-1 rounded">
            -{discount}%
          </span>
        )}
        {onNavigate && (
          <div className="absolute bottom-2 right-2 bg-paper/90 backdrop-blur rounded-full p-1.5 shadow-sm">
            <FavoriteButton productId={product.id} onNavigate={onNavigate} iconSize="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1 gap-1.5">
        <h3 className="font-serif text-lg font-medium text-espresso line-clamp-2 group-hover:text-wood transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 fill-wood text-wood" />
          <span className="text-xs font-medium text-espresso">{product.rating.toFixed(1)}</span>
          <span className="text-xs text-muted">({product.review_count})</span>
          {product.sales_count > 50 && (
            <span className="ml-auto text-[10px] text-muted flex items-center gap-0.5">
              <BadgeCheck className="w-3 h-3 text-moss" />
              {product.sales_count} vendidos
            </span>
          )}
        </div>

        <div className="mt-auto pt-1.5">
          {product.compare_price && (
            <p className="text-xs text-muted line-through">
              {formatBRL(product.compare_price)}
            </p>
          )}
          <p className="text-lg font-semibold text-espresso">{formatBRL(product.price)}</p>
          <p className="text-[11px] text-muted">{formatParcela(product.price)}</p>
        </div>
      </div>
    </button>
  );
}
