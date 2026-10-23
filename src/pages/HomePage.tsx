import { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Truck, ShieldCheck, Hammer, TreePine, BookOpen } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import type { Product, Category, Ebook } from '@/types';
import { formatBRL } from '@/lib/format';
import HeroBanner from '@/components/HeroBanner';
import ProductCard from '@/components/ProductCard';

interface HomePageProps {
  onNavigate: (path: string) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const { getText } = useStoreSettings();

  useEffect(() => {
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('active', true)
      .eq('featured', true)
      .order('sort_order')
      .limit(8)
      .then(({ data, error }) => { if (!error) setFeatured(data as Product[] ?? []); });

    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data, error }) => { if (!error) setNewArrivals(data as Product[] ?? []); });

    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => { if (!error) setCategories(data as Category[] ?? []); });

    supabase
      .from('ebooks')
      .select('*')
      .eq('active', true)
      .eq('featured', true)
      .order('sort_order')
      .limit(4)
      .then(({ data, error }) => { if (!error) setEbooks(data as Ebook[] ?? []); });
  }, []);

  const categoryIcons: Record<string, typeof Hammer> = {
    'cozinha-churrasco': Hammer,
    'decoracao': Sparkles,
    'pet-jardim': TreePine,
    'infantil': Sparkles,
    'natal': TreePine,
    'lancamentos': Sparkles,
  };

  const trustBadges = [
    { icon: Hammer, title: getText('trust_badge_1_title', 'Feito à Mão'), desc: getText('trust_badge_1_desc', 'Cada peça única e artesanal') },
    { icon: ShieldCheck, title: getText('trust_badge_2_title', 'Garantia de Fábrica'), desc: getText('trust_badge_2_desc', 'Qualidade garantida em todas as peças') },
    { icon: Truck, title: getText('trust_badge_3_title', 'Entrega Segura'), desc: getText('trust_badge_3_desc', 'Envio para todo o Brasil') },
    { icon: TreePine, title: getText('trust_badge_4_title', 'Madeira Sustentável'), desc: getText('trust_badge_4_desc', 'Matéria-prima de origem responsável') },
  ];

  const categoriesTitle = getText('home_categories_title', 'Categorias');
  const featuredTitle = getText('home_featured_title', 'Destaques');
  const newArrivalsTitle = getText('home_new_arrivals_title', 'Novidades');
  const ctaTitle = getText('home_cta_title', 'Presenteie com arte em madeira');
  const ctaText = getText('home_cta_text', 'Peças exclusivas e personalizadas para tornar cada momento especial. Feitas à mão com materiais nobres.');
  const ctaButton = getText('home_cta_button', 'Explorar Coleção');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-10 sm:space-y-16">
      <HeroBanner onNavigate={onNavigate} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {trustBadges.map(badge => (
          <div
            key={badge.title}
            className="flex items-center gap-3 p-3 sm:p-4 bg-paper rounded-xl shadow-soft"
          >
            <div className="w-10 h-10 sm:w-11 sm:h-11 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <badge.icon className="w-5 h-5 text-wood" />
            </div>
            <div className="min-w-0">
              <p className="font-serif text-sm font-medium text-espresso truncate">{badge.title}</p>
              <p className="text-[11px] text-muted leading-tight">{badge.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {categories.length > 0 && (
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso mb-5">{categoriesTitle}</h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {categories.map(cat => {
              const Icon = categoryIcons[cat.slug] ?? Sparkles;
              return (
                <button
                  key={cat.id}
                  onClick={() => onNavigate(`/produtos?cat=${cat.slug}`)}
                  className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-paper rounded-xl shadow-soft hover:shadow-card transition-all group"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-cream rounded-xl flex items-center justify-center group-hover:bg-wood/10 transition-colors">
                    <Icon className="w-6 h-6 text-wood" />
                  </div>
                  <span className="text-[11px] uppercase tracking-[0.08em] text-muted text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {featured.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">{featuredTitle}</h2>
            <button
              onClick={() => onNavigate('/produtos')}
              className="flex items-center gap-1 text-sm font-medium text-wood hover:text-espresso transition-colors"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {featured.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigate(`/produto/${product.slug}`)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {newArrivals.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">{newArrivalsTitle}</h2>
            <button
              onClick={() => onNavigate('/produtos?cat=lancamentos')}
              className="flex items-center gap-1 text-sm font-medium text-wood hover:text-espresso transition-colors"
            >
              Ver mais <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {newArrivals.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => onNavigate(`/produto/${product.slug}`)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}

      {ebooks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-wood" />
              <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">E-books em Destaque</h2>
            </div>
            <button
              onClick={() => onNavigate('/ebooks')}
              className="flex items-center gap-1 text-sm font-medium text-wood hover:text-espresso transition-colors"
            >
              Ver todos <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {ebooks.map(ebook => (
              <button
                key={ebook.id}
                onClick={() => onNavigate(`/ebook/${ebook.slug}`)}
                className="group bg-paper rounded-2xl shadow-soft overflow-hidden text-left hover:shadow-card transition-all"
              >
                <div className="aspect-[3/4] bg-cream overflow-hidden">
                  {ebook.cover_url ? (
                    <img
                      src={ebook.cover_url}
                      alt={ebook.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-rim" />
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="font-serif text-sm font-medium text-espresso line-clamp-2 leading-tight">{ebook.title}</p>
                  {ebook.author && (
                    <p className="text-[10px] text-muted mt-0.5">{ebook.author}</p>
                  )}
                  <p className="text-sm font-semibold text-wood mt-1">{formatBRL(ebook.price)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative overflow-hidden rounded-2xl bg-espresso shadow-lift">
        <div className="absolute top-0 right-0 w-64 h-64 bg-wood/15 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3" />
        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-12">
          <div>
            <h3 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-cream mb-2">
              {ctaTitle}
            </h3>
            <p className="text-cream/60 max-w-md">
              {ctaText}
            </p>
          </div>
          <button
            onClick={() => onNavigate('/produtos')}
            className="px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            {ctaButton}
          </button>
        </div>
      </div>
    </div>
  );
}
