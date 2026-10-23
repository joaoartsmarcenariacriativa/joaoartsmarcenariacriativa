import { useState, useRef, useEffect } from 'react';
import { Search, X, Package2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product } from '@/types';
import { formatBRL } from '@/lib/format';

interface SearchBarProps {
  onNavigate: (path: string) => void;
}

export default function SearchBar({ onNavigate }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const reqId = ++requestIdRef.current;
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*')
        .ilike('name', `%${query}%`)
        .eq('active', true)
        .limit(6);
      if (reqId !== requestIdRef.current) return;
      setResults(data as Product[] ?? []);
      setLoading(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (slug: string) => {
    onNavigate(`/produto/${slug}`);
    setQuery('');
    setShowResults(false);
  };

  return (
    <div ref={containerRef} className="relative flex-1 max-w-md hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
          placeholder="Buscar produtos..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-cream border border-rim rounded-full focus:outline-none focus:border-wood transition-all text-espresso placeholder:text-muted"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-espresso"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {showResults && query.trim().length >= 2 && (
        <div className="absolute top-full mt-2 w-full bg-paper rounded-xl shadow-lift border border-rim overflow-hidden z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted">Buscando...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">Nenhum produto encontrado</div>
          ) : (
            results.map(product => (
              <button
                key={product.id}
                onClick={() => handleSelect(product.slug)}
                className="w-full flex items-center gap-3 p-3 hover:bg-cream transition-colors text-left border-b border-rim last:border-0"
              >
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
                    <Package2 className="w-5 h-5 text-muted" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-sm font-medium text-espresso truncate">{product.name}</p>
                  <p className="text-sm text-wood font-semibold">{formatBRL(product.price)}</p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
