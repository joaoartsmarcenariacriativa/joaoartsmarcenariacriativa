import { useEffect, useState } from 'react';
import { ArrowLeft, ExternalLink, BookOpen, Shield, Check, FileText, Download, GraduationCap, ArrowRight, Lock, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Ebook } from '@/types';
import { formatBRL } from '@/lib/format';

interface EbookDetailPageProps {
  slug: string;
  onNavigate: (path: string) => void;
}

export default function EbookDetailPage({ slug, onNavigate }: EbookDetailPageProps) {
  const { user, isCustomer } = useAuth();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);

  useEffect(() => {
    supabase
      .from('ebooks')
      .select('*')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('E-book não encontrado.');
          setEbook(null);
        } else {
          setEbook(data as Ebook);
        }
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (!ebook || !user) { setCheckingAccess(false); return; }
    supabase
      .from('ebook_access')
      .select('id, expires_at')
      .eq('ebook_id', ebook.id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const expired = data.expires_at && new Date(data.expires_at) <= new Date();
          setHasAccess(!expired);
        } else {
          setHasAccess(false);
        }
        setCheckingAccess(false);
      });
  }, [ebook, user]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-muted">Carregando...</p>
      </div>
    );
  }

  if (error || !ebook) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <BookOpen className="w-16 h-16 text-rim mx-auto mb-4" />
        <h1 className="font-serif text-xl font-medium text-espresso mb-2">{error}</h1>
        <button
          onClick={() => onNavigate('/ebooks')}
          className="mt-4 px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
        >
          Ver todos os e-books
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => onNavigate('/ebooks')}
        className="flex items-center gap-1 text-xs font-medium text-muted hover:text-wood mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para vitrine
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12">
        {/* Cover */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] bg-cream rounded-2xl overflow-hidden shadow-soft">
            <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
          </div>
          {ebook.preview_url && (
            <a
              href={ebook.preview_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 border-2 border-rim text-muted text-sm font-medium rounded-lg hover:border-wood hover:text-wood transition-colors"
            >
              <FileText className="w-4 h-4" /> Visualizar prévia gratuita
            </a>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            {ebook.category && (
              <span className="text-[10px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-full bg-wood/10 text-wood border border-wood/30 font-medium">
                {ebook.category}
              </span>
            )}
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso mt-3 leading-tight">
              {ebook.title}
            </h1>
            {ebook.author && (
              <p className="text-sm text-muted mt-2">por <span className="font-medium text-espresso">{ebook.author}</span></p>
            )}
          </div>

          {/* Price */}
          <div className="bg-paper rounded-xl p-4 shadow-soft">
            <p className="text-3xl font-semibold text-espresso">
              {ebook.price > 0 ? formatBRL(ebook.price) : 'Grátis'}
            </p>
            {ebook.pages && (
              <p className="text-sm text-muted mt-1 flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> {ebook.pages} páginas
              </p>
            )}
          </div>

          {/* Description */}
          {ebook.description && (
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted mb-2">Sobre este e-book</h3>
              <p className="text-sm text-muted leading-relaxed whitespace-pre-line">{ebook.description}</p>
            </div>
          )}

          {/* Features */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Check className="w-4 h-4 text-moss" /> Acesso imediato após a compra
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Check className="w-4 h-4 text-moss" /> Conteúdo digital (PDF / EPUB)
            </div>
            <div className="flex items-center gap-2 text-sm text-muted">
              <Check className="w-4 h-4 text-moss" /> Compra segura via Hotmart
            </div>
          </div>

          {/* Access status / Member area CTA */}
          {!checkingAccess && hasAccess && (
            <div className="bg-moss/10 border border-moss/30 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-moss/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-moss" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-espresso">Você já tem acesso a este curso</p>
                  <p className="text-xs text-muted">Acesse a área de membros para assistir e baixar o conteúdo.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/area-de-membros')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-moss hover:bg-moss-light text-cream text-xs font-semibold rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
              >
                <PlayCircle className="w-4 h-4" /> Ir para o Curso
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hotmart checkout button */}
          {(!hasAccess || checkingAccess) && (
            <a
              href={ebook.hotmart_checkout_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-4 bg-wood hover:bg-wood-dark text-cream font-medium rounded-xl transition-colors text-base shadow-soft hover:shadow-lift"
            >
              <Download className="w-5 h-5" />
              Comprar Agora
              <ExternalLink className="w-4 h-4" />
            </a>
          )}

          {/* Member area CTA for non-logged-in users */}
          {!isCustomer && !checkingAccess && (
            <div className="bg-paper rounded-xl border border-wood/20 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lock className="w-4 h-4 text-wood" />
                </div>
                <div>
                  <p className="text-sm font-medium text-espresso">Já comprou? Crie sua conta gratuita</p>
                  <p className="text-xs text-muted mt-0.5">Cadastre-se com o mesmo e-mail usado na compra para acessar seus cursos.</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('/entrar')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-wood/10 hover:bg-wood hover:text-cream text-wood text-xs font-semibold rounded-lg transition-colors flex-shrink-0 whitespace-nowrap"
              >
                Entrar / Cadastrar
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hotmart transparency notice */}
          <div className="bg-paper rounded-xl border border-rim p-4 flex items-start gap-3">
            <Shield className="w-5 h-5 text-wood flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted leading-relaxed">
              O processamento de pagamento e a entrega dos infoprodutos são realizados de forma segura pela plataforma parceira Hotmart. Você recebe seu acesso imediatamente após a confirmação do pagamento, conforme o Código de Defesa do Consumidor (Lei nº 8.078/90).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
