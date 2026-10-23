import { useEffect, useState, useMemo } from 'react';
import { SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category } from '@/types';
import ProductCard from '@/components/ProductCard';

interface ProductsPageProps {
  onNavigate: (path: string) => void;
  searchParams: URLSearchParams;
}

export default function ProductsPage({ onNavigate, searchParams }: ProductsPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const selectedCat = searchParams.get('cat') ?? '';
  const query = searchParams.get('q') ?? '';
  const [sortBy, setSortBy] = useState('relevance');

  useEffect(() => {
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => { if (!error) setCategories(data as Category[] ?? []); });
  }, []);

  useEffect(() => {
    setLoading(true);
    let dbQuery = supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('active', true);

    if (selectedCat && selectedCat !== 'lancamentos') {
      const catId = categories.find(c => c.slug === selectedCat)?.id;
      if (catId) {
        dbQuery = dbQuery.eq('category_id', catId);
      }
    }

    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }

    if (sortBy === 'price_asc') dbQuery = dbQuery.order('price', { ascending: true });
    else if (sortBy === 'price_desc') dbQuery = dbQuery.order('price', { ascending: false });
    else if (sortBy === 'best_selling') dbQuery = dbQuery.order('sales_count', { ascending: false });
    else dbQuery = dbQuery.order('sort_order');

    dbQuery.then(({ data, error }) => {
      if (error) { setProducts([]); setLoading(false); return; }
      let result = data as Product[] ?? [];
      if (selectedCat === 'lancamentos') {
        result = result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 12);
      }
      setProducts(result);
      setLoading(false);
    });
  }, [selectedCat, query, sortBy, categories]);

  const currentCategoryName = useMemo(() => {
    if (query) return `Resultados para "${query}"`;
    if (selectedCat) return categories.find(c => c.slug === selectedCat)?.name ?? 'Produtos';
    return 'Todos os Produtos';
  }, [selectedCat, query, categories]);

  const handleCatChange = (slug: string) => {
    const params = new URLSearchParams();
    if (slug) params.set('cat', slug);
    onNavigate(`/produtos${params.toString() ? `?${params.toString()}` : ''}`);
    setShowFilters(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">{currentCategoryName}</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted bg-paper border border-rim rounded-full"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
            </button>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-3 py-2 text-xs font-medium text-muted bg-paper border border-rim rounded-full focus:outline-none focus:border-wood transition-colors"
            >
              <option value="relevance">Mais Relevantes</option>
              <option value="price_asc">Menor Preço</option>
              <option value="price_desc">Maior Preço</option>
              <option value="best_selling">Mais Vendidos</option>
            </select>
          </div>
        </div>
        <p className="text-[11px] uppercase tracking-[0.12em] text-muted">
          {loading ? 'Carregando...' : `${products.length} produto${products.length !== 1 ? 's' : ''} encontrado${products.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="flex gap-6">
        <aside
          className={`${
            showFilters
              ? 'fixed inset-0 z-40 bg-espresso/60 lg:bg-transparent lg:static lg:z-auto'
              : 'hidden lg:block'
          }`}
          onClick={() => showFilters && setShowFilters(false)}
        >
          <div
            className={`${
              showFilters
                ? 'fixed left-0 top-0 h-full w-72 bg-cream p-4 overflow-y-auto lg:static lg:w-auto lg:p-0'
                : 'w-56'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <h3 className="font-serif text-lg font-medium text-espresso">Filtros</h3>
              <button onClick={() => setShowFilters(false)}>
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted mb-3 hidden lg:block">Categorias</h3>
            <div className="space-y-1">
              <button
                onClick={() => handleCatChange('')}
                className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  !selectedCat
                    ? 'bg-espresso text-cream'
                    : 'text-muted hover:text-wood'
                }`}
              >
                Todos os Produtos
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCatChange(cat.slug)}
                  className={`block w-full text-left px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    selectedCat === cat.slug
                      ? 'bg-espresso text-cream'
                      : 'text-muted hover:text-wood'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-paper rounded-xl overflow-hidden animate-pulse shadow-soft"
                >
                  <div className="aspect-square bg-rim/40" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-rim/40 rounded w-3/4" />
                    <div className="h-6 bg-rim/40 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <PackageSearch className="w-16 h-16 text-rim mb-4" />
              <p className="text-muted font-medium">Nenhum produto encontrado</p>
              <button
                onClick={() => onNavigate('/produtos')}
                className="mt-4 text-xs font-medium text-wood hover:text-espresso transition-colors"
              >
                Ver todos os produtos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => onNavigate(`/produto/${product.slug}`)}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
