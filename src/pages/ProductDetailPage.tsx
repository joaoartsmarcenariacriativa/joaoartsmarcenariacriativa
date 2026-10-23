import { useEffect, useState } from 'react';
import { ZoomIn, Star, ShoppingCart, Truck, ShieldCheck, Hammer, TreePine, ChevronRight, Check, Minus, Plus, MessageSquarePlus, Send, Lock, Play, Video } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, ProductReview, ProductVariation, ShippingQuoteOption } from '@/types';
import { formatBRL, formatParcela } from '@/lib/format';
import { fetchShippingQuote } from '@/lib/shipping';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import FavoriteButton from '@/components/FavoriteButton';
import ImageUploader from '@/components/ImageUploader';

const isVideoUrl = (url: string) =>
  /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

interface ProductDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export default function ProductDetailPage({ slug, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [variations, setVariations] = useState<ProductVariation[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [cep, setCep] = useState('');
  const [shippingOptions, setShippingOptions] = useState<ShippingQuoteOption[] | null>(null);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const { addItem } = useCart();
  const { user, isCustomer } = useAuth();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ name: '', rating: 5, comment: '' });
  const [reviewPhotos, setReviewPhotos] = useState<string[]>([]);
  const [reviewVideos, setReviewVideos] = useState<string[]>([]);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [purchaseCheckLoading, setPurchaseCheckLoading] = useState(true);

  const loadReviews = (productId: string) => {
    supabase
      .from('product_reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data: revs }) => setReviews(revs as ProductReview[] ?? []));
  };

  const submitReview = async () => {
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) {
      alert('Preencha seu nome e comentário.');
      return;
    }
    if (!product) return;

    // Confirma novamente que o cliente comprou o produto antes de registrar.
    const { data: purchase } = await supabase
      .from('order_items')
      .select('order_id, orders!inner(id, customer_id, status)')
      .eq('product_id', product.id)
      .eq('orders.customer_id', user!.id)
      .in('orders.status', ['recebido', 'processamento', 'enviado', 'confirmado', 'entregue'])
      .limit(1)
      .maybeSingle();

    const orderRow = purchase as { order_id: string } | null;
    if (!orderRow) {
      alert('Apenas clientes que compraram este produto podem avaliá-lo.');
      return;
    }

    setReviewSubmitting(true);
    const { error } = await supabase.from('product_reviews').insert({
      product_id: product.id,
      customer_name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      photos: reviewPhotos,
      videos: reviewVideos,
      approved: false,
      customer_id: user!.id,
      order_id: orderRow.order_id,
    });
    setReviewSubmitting(false);
    if (error) {
      alert('Erro ao enviar avaliação: ' + error.message);
      return;
    }
    setReviewSuccess(true);
    setAlreadyReviewed(true);
    setReviewForm({ name: '', rating: 5, comment: '' });
    setReviewPhotos([]);
    setReviewVideos([]);
    setShowReviewForm(false);
  };

  // Verifica se o cliente logado já comprou este produto e se já o avaliou.
  const checkPurchaseStatus = async (productId: string, userId: string) => {
    setPurchaseCheckLoading(true);

    const { data: purchase } = await supabase
      .from('order_items')
      .select('order_id, orders!inner(id, customer_id, status)')
      .eq('product_id', productId)
      .eq('orders.customer_id', userId)
      .in('orders.status', ['recebido', 'processamento', 'enviado', 'confirmado', 'entregue'])
      .limit(1)
      .maybeSingle();
    const didPurchase = !!purchase;
    setHasPurchased(didPurchase);

    if (didPurchase) {
      const { data: existing } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('customer_id', userId)
        .limit(1)
        .maybeSingle();
      setAlreadyReviewed(!!existing);
    } else {
      setAlreadyReviewed(false);
    }

    setPurchaseCheckLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setSelectedImage(0);
    setQuantity(1);
    setShippingOptions(null);
    setShippingError(null);
    setSelectedVariation(null);

    supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('slug', slug)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) { setProduct(null); setLoading(false); return; }
        setProduct(data as Product | null);
        setLoading(false);

        if (data) {
          supabase
            .from('product_variations')
            .select('*')
            .eq('product_id', data.id)
            .order('price_adjustment')
            .then(({ data: vars }) => {
              setVariations(vars as ProductVariation[] ?? []);
            });

          loadReviews(data.id);

          if (isCustomer && user) {
            checkPurchaseStatus(data.id, user.id);
          } else {
            setPurchaseCheckLoading(false);
          }

          if ((data as Product).category_id) {
            supabase
              .from('products')
              .select('*, category:categories(*)')
              .eq('active', true)
              .eq('category_id', (data as Product).category_id)
              .neq('id', (data as Product).id)
              .limit(4)
              .then(({ data: rel }) => setRelated(rel as Product[] ?? []));
          }
        }
      });
  }, [slug, isCustomer, user]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="aspect-square bg-rim/40 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-rim/40 rounded animate-pulse w-3/4" />
            <div className="h-6 bg-rim/40 rounded animate-pulse w-1/2" />
            <div className="h-32 bg-rim/40 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 text-center">
        <p className="text-muted text-lg">Produto não encontrado</p>
        <button
          onClick={() => onNavigate('/produtos')}
          className="mt-4 text-sm font-medium text-wood hover:text-espresso transition-colors"
        >
          Ver todos os produtos
        </button>
      </div>
    );
  }

  const currentPrice = selectedVariation
    ? product.price + selectedVariation.price_adjustment
    : product.price;

  const effectiveStock = selectedVariation?.stock ?? product.stock;
  const maxQty = product.max_per_customer
    ? Math.min(effectiveStock, product.max_per_customer)
    : effectiveStock;

  const variationLabel = selectedVariation
    ? [selectedVariation.wood_type, selectedVariation.dimensions, selectedVariation.finish]
        .filter(Boolean)
        .join(' • ')
    : null;

  const handleAddToCart = () => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_image: product.images[0] ?? '',
      price: currentPrice,
      quantity,
      variation: variationLabel,
      max_per_customer: product.max_per_customer,
      stock: effectiveStock,
    });
  };

  const calculateShipping = async () => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      setShippingError('CEP inválido. Digite 8 dígitos.');
      setShippingOptions(null);
      return;
    }
    setShippingLoading(true);
    setShippingError(null);
    setShippingOptions(null);

    const declaredValue = product.ship_declared_value ?? currentPrice * quantity;
    const { options, error } = await fetchShippingQuote(cleanCep, [{
      weight_g: (product.ship_weight_g ?? 500) + (product.ship_packaging_weight_g ?? 0),
      length_cm: (product.ship_length_cm ?? 20) + (product.ship_packaging_cm ?? 0),
      width_cm: (product.ship_width_cm ?? 20) + (product.ship_packaging_cm ?? 0),
      height_cm: (product.ship_height_cm ?? 10) + (product.ship_packaging_cm ?? 0),
      declared_value: declaredValue,
      quantity,
    }]);

    if (error) {
      setShippingError(error);
    } else {
      setShippingOptions(options);
    }
    setShippingLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-muted mb-6 flex-wrap">
        <button onClick={() => onNavigate('/')} className="hover:text-wood transition-colors">Início</button>
        <ChevronRight className="w-3 h-3" />
        <button onClick={() => onNavigate('/produtos')} className="hover:text-wood transition-colors">Produtos</button>
        {product.category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <button
              onClick={() => onNavigate(`/produtos?cat=${product.category!.slug}`)}
              className="hover:text-wood transition-colors"
            >
              {product.category.name}
            </button>
          </>
        )}
        <ChevronRight className="w-3 h-3" />
        <span className="text-espresso font-medium truncate">{product.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        <div className="space-y-3">
          <div
            className="relative aspect-square bg-cream rounded-2xl overflow-hidden cursor-zoom-in group shadow-soft"
            onClick={() => setZoom(!zoom)}
          >
            {product.images.length > 0 ? (
              isVideoUrl(product.images[selectedImage]) ? (
                <video
                  src={product.images[selectedImage]}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className={`w-full h-full object-cover transition-transform duration-500 ${
                    zoom ? 'scale-150' : 'group-hover:scale-110'
                  }`}
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Hammer className="w-16 h-16 text-rim" />
              </div>
            )}
            <div className="absolute top-3 right-3 p-2 bg-paper/80 backdrop-blur rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn className="w-4 h-4 text-espresso" />
            </div>
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {product.images.map((img, idx) => {
                const video = isVideoUrl(img);
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                      selectedImage === idx
                        ? 'border-wood'
                        : 'border-rim hover:border-wood/50'
                    }`}
                  >
                    {video ? (
                      <>
                        <video src={img} className="w-full h-full object-cover" preload="metadata" muted />
                        <div className="absolute inset-0 bg-espresso/30 flex items-center justify-center">
                          <Play className="w-4 h-4 text-paper" />
                        </div>
                      </>
                    ) : (
                      <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {product.video_url && (
            <div className="mt-2">
              <div className="aspect-video bg-espresso rounded-xl overflow-hidden">
                {product.video_url.includes('youtube') || product.video_url.includes('youtu.be') ? (
                  <iframe
                    src={product.video_url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    title="Vídeo do produto"
                    className="w-full h-full"
                    allowFullScreen
                  />
                ) : (
                  <video src={product.video_url} controls className="w-full h-full object-cover" />
                )}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.badges.map(badge => (
                <span
                  key={badge}
                  className="text-[9px] uppercase tracking-[0.08em] px-2 py-1 rounded bg-wood/10 text-wood border border-wood/30"
                >
                  {badge}
                </span>
              ))}
            </div>
            <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight text-espresso leading-tight">
              {product.name}
            </h1>
            <FavoriteButton
              productId={product.id}
              onNavigate={onNavigate}
              className="mt-3 inline-flex p-2.5 rounded-full border border-rim hover:border-red-200 bg-paper"
              iconSize="w-5 h-5"
            />

            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating)
                        ? 'fill-wood text-wood'
                        : 'text-rim'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium text-espresso">
                {product.rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted">
                ({product.review_count} avaliações)
              </span>
              {product.sales_count > 0 && (
                <span className="text-xs text-moss font-medium ml-2">
                  {product.sales_count} vendidos
                </span>
              )}
            </div>
          </div>

          <div className="bg-paper rounded-xl p-4 shadow-soft">
            {product.compare_price && (
              <p className="text-sm text-muted line-through">
                {formatBRL(product.compare_price)}
              </p>
            )}
            <p className="text-3xl font-semibold text-espresso">{formatBRL(currentPrice)}</p>
            <p className="text-sm text-muted mt-1">
              ou {formatParcela(currentPrice)} no cartão
            </p>
            <p className="text-[11px] text-moss font-medium mt-1.5">
              5% de desconto no Pix
            </p>
          </div>

          {variations.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted">Escolha sua variação:</h3>
              <div className="space-y-2">
                {variations.map(v => {
                  const label = [v.wood_type, v.dimensions, v.finish].filter(Boolean).join(' • ');
                  const vPrice = product.price + v.price_adjustment;
                  const isSelected = selectedVariation?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariation(v)}
                      disabled={v.stock === 0}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-wood bg-wood/10'
                          : 'border-rim hover:border-wood/50'
                      } ${v.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-wood' : 'border-rim'
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 text-wood" />}
                        </div>
                        <span className="text-sm text-espresso">{label}</span>
                      </div>
                      <span className="text-sm font-semibold text-espresso">
                        {formatBRL(vPrice)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center border-2 border-rim rounded-lg">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="p-2.5 hover:bg-rim/50 rounded-l-lg transition-colors"
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4 text-muted" />
              </button>
              <span className="w-10 text-center font-semibold text-espresso">{quantity}</span>
              <button
                onClick={() => setQuantity(q => Math.min(maxQty, q + 1))}
                className="p-2.5 hover:bg-rim/50 rounded-r-lg transition-colors"
                disabled={quantity >= maxQty}
              >
                <Plus className="w-4 h-4 text-muted" />
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={effectiveStock === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-5 h-5" />
              {effectiveStock === 0 ? 'Esgotado' : 'Adicionar ao Carrinho'}
            </button>
          </div>
          {effectiveStock > 0 && effectiveStock <= 5 && (
            <p className="text-xs text-orange-600 font-medium">
              Apenas {effectiveStock} em estoque!
            </p>
          )}

          <div className="bg-paper rounded-xl p-4 shadow-soft">
            <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted mb-2 flex items-center gap-2">
              <Truck className="w-4 h-4 text-wood" />
              Calcular Frete e Prazo
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={cep}
                onChange={e => setCep(e.target.value.replace(/\D/g, '').slice(0, 8))}
                placeholder="Digite seu CEP"
                className="flex-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
              <button
                onClick={calculateShipping}
                disabled={shippingLoading}
                className="px-4 py-2 bg-espresso text-cream text-sm font-medium rounded-lg hover:bg-espresso-tint transition-colors disabled:opacity-50"
              >
                {shippingLoading ? '...' : 'Calcular'}
              </button>
            </div>
            {shippingError && (
              <p className="text-xs text-red-600 mt-2 leading-relaxed">{shippingError}</p>
            )}
            {shippingOptions && shippingOptions.length > 0 && (
              <div className="mt-3 space-y-2">
                {shippingOptions.map((opt, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-cream rounded-lg border border-rim"
                  >
                    <div>
                      <p className="text-sm font-medium text-espresso">{opt.name}</p>
                      <p className="text-[11px] text-muted">
                        {opt.days} dias úteis{product.production_days > 0 ? ` + ${product.production_days} de produção` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-wood">{formatBRL(opt.price)}</p>
                  </div>
                ))}
              </div>
            )}
            {shippingOptions && shippingOptions.length === 0 && (
              <p className="text-xs text-muted mt-2">Nenhuma opção de frete encontrada para este CEP.</p>
            )}
            <a
              href="https://buscacepinter.correios.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-wood hover:underline mt-1 inline-block"
            >
              Não sei meu CEP
            </a>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: ShieldCheck, label: 'Garantia de Fábrica' },
              { icon: TreePine, label: 'Madeira Sustentável' },
              { icon: Hammer, label: 'Feito à Mão' },
            ].map(badge => (
              <div
                key={badge.label}
                className="flex flex-col items-center gap-1 p-2 bg-paper rounded-xl shadow-soft"
              >
                <badge.icon className="w-5 h-5 text-wood" />
                <span className="text-[9px] uppercase tracking-[0.08em] text-muted text-center leading-tight">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-12">
        <div className="space-y-4">
          <h2 className="font-serif text-xl font-medium text-espresso">Descrição</h2>
          <p className="text-sm text-muted leading-relaxed whitespace-pre-line">
            {product.description}
          </p>
          {product.care_instructions && (
            <div className="mt-4 p-4 bg-wood/5 rounded-xl border border-wood/20">
              <h3 className="font-serif text-sm font-medium text-wood mb-1">Cuidados com a madeira</h3>
              <p className="text-xs text-muted leading-relaxed whitespace-pre-line">
                {product.care_instructions}
              </p>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-serif text-xl font-medium text-espresso mb-4">Especificações Técnicas</h2>
          <div className="rounded-xl border border-rim overflow-hidden">
            {product.specs && product.specs.length > 0 ? (
              product.specs.map((spec, idx) => (
                <div
                  key={idx}
                  className={`flex items-center ${idx % 2 === 0 ? 'bg-paper' : 'bg-cream/60'}`}
                >
                  <span className="py-3 px-4 text-xs uppercase tracking-[0.08em] text-muted w-1/3 border-b border-rim">
                    {spec.label}
                  </span>
                  <span className="py-3 px-4 text-sm text-espresso flex-1 border-b border-rim">
                    {spec.value}
                  </span>
                </div>
              ))
            ) : (
              <p className="py-4 px-4 text-sm text-muted text-center">Sem especificações cadastradas.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-medium text-espresso">
            Avaliações de Clientes ({reviews.length})
          </h2>
          {!reviewSuccess && !alreadyReviewed && (
            isCustomer ? (
              hasPurchased ? (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Avaliar este produto
                </button>
              ) : purchaseCheckLoading ? (
                <span className="text-xs text-muted">Verificando sua compra...</span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-muted bg-cream border border-rim rounded-lg px-3 py-2">
                  <Lock className="w-3.5 h-3.5" />
                  Compre este produto para avaliá-lo
                </span>
              )
            ) : (
              <button
                onClick={() => onNavigate('/entrar')}
                className="flex items-center gap-1.5 px-4 py-2 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4" />
                Entre e compre para avaliar
              </button>
            )
          )}
        </div>

        {/* Review success message */}
        {reviewSuccess && (
          <div className="bg-moss/10 border border-moss/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-moss flex-shrink-0" />
            <p className="text-sm text-moss font-medium">
              Sua avaliação foi enviada! Ela aparecerá aqui após ser aprovada pela nossa equipe.
            </p>
          </div>
        )}

        {/* Already reviewed notice */}
        {reviewSuccess && alreadyReviewed && !showReviewForm && (
          <div className="bg-moss/10 border border-moss/30 rounded-xl p-4 mb-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-moss flex-shrink-0" />
            <p className="text-sm text-moss font-medium">
              Você já avaliou este produto. Obrigado pelo seu feedback!
            </p>
          </div>
        )}

        {/* Review form */}
        {showReviewForm && (
          <div className="bg-paper rounded-2xl shadow-soft p-5 sm:p-6 mb-4 space-y-4">
            <h3 className="font-serif text-lg font-medium text-espresso">Deixe sua avaliação</h3>
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted block mb-1">Seu nome *</label>
              <input
                type="text"
                value={reviewForm.name}
                onChange={e => setReviewForm({ ...reviewForm, name: e.target.value })}
                placeholder="Como deseja ser identificado"
                className="w-full px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted block mb-1">Sua nota *</label>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewForm({ ...reviewForm, rating: i + 1 })}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-7 h-7 ${
                        i < reviewForm.rating
                          ? 'fill-wood text-wood'
                          : 'text-rim'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-sm font-medium text-espresso ml-2">{reviewForm.rating} de 5</span>
              </div>
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted block mb-1">Comentário *</label>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                placeholder="Conte sobre sua experiência com o produto..."
                className="w-full px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
              />
            </div>
            <ImageUploader
              images={reviewPhotos}
              onChange={setReviewPhotos}
              label="Fotos da sua avaliação"
              maxImages={4}
            />
            <ImageUploader
              images={reviewVideos}
              onChange={setReviewVideos}
              label="Vídeos da sua avaliação"
              maxImages={2}
              acceptVideos
              maxVideoSizeMB={50}
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReviewForm(false)}
                className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={submitReview}
                disabled={reviewSubmitting || !reviewForm.name.trim() || !reviewForm.comment.trim()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                {reviewSubmitting ? 'Enviando...' : (<><Send className="w-4 h-4" /> Enviar Avaliação</>)}
              </button>
            </div>
          </div>
        )}

        {reviews.length === 0 ? (
          <div className="bg-paper rounded-xl border border-rim p-6 text-center">
            <Star className="w-10 h-10 text-rim mx-auto mb-2" />
            <p className="text-sm text-muted">Ainda não há avaliações para este produto.</p>
            <p className="text-xs text-muted mt-1">Compre e seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <div
                key={review.id}
                className="p-4 bg-paper rounded-xl shadow-soft"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-wood/10 rounded-full flex items-center justify-center text-wood font-semibold text-sm">
                    {review.customer_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-serif text-sm font-medium text-espresso">{review.customer_name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < review.rating
                              ? 'fill-wood text-wood'
                              : 'text-rim'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="ml-auto text-[10px] text-muted">
                    {new Date(review.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-muted leading-relaxed">{review.comment}</p>
                )}
                {(review.photos.length > 0 || (review.videos?.length ?? 0) > 0) && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {review.photos.map((photo, idx) => (
                      <a
                        key={`p${idx}`}
                        href={photo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-16 h-16 rounded-lg overflow-hidden border border-rim hover:border-wood transition-colors"
                      >
                        <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                    {review.videos?.map((video, idx) => (
                      <a
                        key={`v${idx}`}
                        href={video}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="relative block w-16 h-16 rounded-lg overflow-hidden border border-rim bg-espresso hover:border-wood transition-colors"
                      >
                        <video src={video} className="w-full h-full object-cover" preload="metadata" muted />
                        <div className="absolute inset-0 bg-espresso/30 flex items-center justify-center">
                          <Play className="w-4 h-4 text-paper" />
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {related.length > 0 && (
        <div className="mt-12">
          <h2 className="font-serif text-xl font-medium text-espresso mb-4">Compre Junto / Recomendados</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {related.map(p => (
              <ProductCard
                key={p.id}
                product={p}
                onClick={() => onNavigate(`/produto/${p.slug}`)}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
