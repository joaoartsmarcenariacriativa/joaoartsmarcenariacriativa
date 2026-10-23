import { useEffect, useState } from 'react';
import { Star, Check, X, Trash2, MessageSquare, Search, Play } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ProductReview } from '@/types';

interface ReviewWithProduct extends ProductReview {
  product_name?: string;
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<ReviewWithProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'approved' | 'all'>('pending');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadReviews = () => {
    setLoading(true);
    let query = supabase
      .from('product_reviews')
      .select('*, products!product_reviews_product_id_fkey(name)')
      .order('created_at', { ascending: false });

    if (filter === 'pending') {
      query = query.eq('approved', false);
    } else if (filter === 'approved') {
      query = query.eq('approved', true);
    }

    query.then(({ data, error }) => {
      if (error || !data) {
        setReviews([]);
        setLoading(false);
        return;
      }
      const mapped = (data as Array<Record<string, unknown>>).map(r => ({
        ...r,
        product_name: (r.products as Record<string, unknown> | null)?.name as string | undefined,
      })) as ReviewWithProduct[];
      setReviews(mapped);
      setLoading(false);
    });
  };

  const approveReview = async (id: string) => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ approved: true })
      .eq('id', id);
    if (error) { alert('Erro ao aprovar: ' + error.message); return; }
    loadReviews();
  };

  const unapproveReview = async (id: string) => {
    const { error } = await supabase
      .from('product_reviews')
      .update({ approved: false })
      .eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    loadReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Excluir esta avaliação permanentemente?')) return;
    const { error } = await supabase
      .from('product_reviews')
      .delete()
      .eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadReviews();
  };

  const filtered = reviews.filter(r => {
    const matchesSearch =
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.product_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (r.comment ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = reviews.filter(r => !r.approved).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-espresso">Avaliações de Produtos</h1>
        <p className="text-sm text-muted mt-1">
          {pendingCount} aguardando aprovação • {reviews.length} no total
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2">
        {([
          { key: 'pending' as const, label: 'Aguardando Aprovação' },
          { key: 'approved' as const, label: 'Aprovadas' },
          { key: 'all' as const, label: 'Todas' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-wood text-cream'
                : 'bg-cream text-muted border border-rim hover:border-wood/50'
            }`}
          >
            {tab.label}
            {tab.key === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por cliente, produto ou comentário..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
        />
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
          <MessageSquare className="w-12 h-12 text-rim mx-auto mb-3" />
          <p className="text-muted">Nenhuma avaliação encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <div
              key={review.id}
              className={`bg-paper rounded-xl border p-4 ${
                review.approved ? 'border-rim' : 'border-amber-300 bg-amber-50/30'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-wood/10 rounded-full flex items-center justify-center text-wood font-semibold flex-shrink-0">
                  {review.customer_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-serif text-sm font-medium text-espresso">{review.customer_name}</p>
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating
                              ? 'fill-wood text-wood'
                              : 'text-rim'
                          }`}
                        />
                      ))}
                    </div>
                    {!review.approved && (
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>
                  {review.product_name && (
                    <p className="text-[11px] text-muted mt-0.5">
                      Produto: <span className="font-medium text-espresso">{review.product_name}</span>
                    </p>
                  )}
                  {review.comment && (
                    <p className="text-sm text-muted leading-relaxed mt-2">{review.comment}</p>
                  )}
                  {(review.photos?.length > 0 || (review.videos?.length ?? 0) > 0) && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.photos?.map((photo, idx) => (
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
                  <p className="text-[10px] text-muted mt-2">
                    {new Date(review.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {!review.approved ? (
                    <button
                      onClick={() => approveReview(review.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-moss hover:bg-moss-light text-cream text-xs font-medium rounded-lg transition-colors"
                      title="Aprovar"
                    >
                      <Check className="w-3.5 h-3.5" /> Aprovar
                    </button>
                  ) : (
                    <button
                      onClick={() => unapproveReview(review.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-cream border border-rim text-muted text-xs font-medium rounded-lg hover:border-wood/50 transition-colors"
                      title="Desaprovar"
                    >
                      <X className="w-3.5 h-3.5" /> Ocultar
                    </button>
                  )}
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
