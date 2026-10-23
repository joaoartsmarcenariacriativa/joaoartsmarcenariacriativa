import { useEffect, useState } from 'react';
import { BookOpen, BookOpenCheck, Shield, GraduationCap, ArrowRight, Sparkles, Lock, Bell, Check, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Ebook } from '@/types';
import { formatBRL } from '@/lib/format';

interface EbooksPageProps {
  onNavigate: (path: string) => void;
}

export default function EbooksPage({ onNavigate }: EbooksPageProps) {
  const { isCustomer, user } = useAuth();
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState<Ebook[]>([]);
  const [subEmail, setSubEmail] = useState('');
  const [subStatus, setSubStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  useEffect(() => {
    supabase
      .from('ebooks')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setEbooks([]); setFeatured([]); }
        else {
          const all = data as Ebook[] ?? [];
          setEbooks(all);
          setFeatured(all.filter(e => e.featured));
        }
        setLoading(false);
      });
  }, []);

  const goToDetail = (slug: string) => {
    onNavigate(`/ebook/${slug}`);
  };

  const handleSubscribe = async () => {
    if (!subEmail.trim() || !subEmail.includes('@')) {
      setSubStatus('error');
      return;
    }
    setSubStatus('loading');
    const { error } = await supabase
      .from('ebook_launch_subscribers')
      .upsert({
        email: subEmail.trim().toLowerCase(),
        source: 'ebook_vitrine',
        user_id: user?.id ?? null,
      }, { onConflict: 'email' });
    if (error) {
      setSubStatus('error');
    } else {
      setSubStatus('done');
      setSubEmail('');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-muted">Carregando e-books...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">Vitrine de E-books</h1>
        <p className="text-sm text-muted mt-1">Guias digitais e infoprodutos para inspirar seu artesanato.</p>
      </div>

      {/* Member Area CTA */}
      <div className="mb-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-espresso via-espresso to-wood-dark p-6 sm:p-8 shadow-lift">
        <div className="absolute top-0 right-0 w-40 h-40 bg-wood/20 rounded-full blur-3xl -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-wood/10 rounded-full blur-2xl translate-y-8 -translate-x-8" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-wood rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
              <GraduationCap className="w-7 h-7 text-cream" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-wood" />
                <span className="text-[10px] uppercase tracking-[0.15em] font-bold text-wood">Área de Membros Exclusiva</span>
              </div>
              <h2 className="font-serif text-lg sm:text-xl font-medium text-cream leading-tight">
                Já comprou um e-book? Acesse seus cursos aqui.
              </h2>
              <p className="text-sm text-cream/60 mt-1 max-w-md">
                Assista às aulas, baixe os materiais e acompanhe seu progresso — tudo em um só lugar.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate(isCustomer ? '/area-de-membros' : '/entrar')}
            className="flex items-center gap-2 px-5 py-3 bg-cream hover:bg-paper text-espresso text-sm font-semibold rounded-xl transition-all hover:scale-105 flex-shrink-0 whitespace-nowrap"
          >
            {isCustomer ? (
              <>
                <GraduationCap className="w-4 h-4" /> Entrar na Área
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Entrar / Cadastrar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Featured banner */}
      {featured.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenCheck className="w-5 h-5 text-wood" />
            <h2 className="font-serif text-lg font-medium text-espresso">Destaques</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map(ebook => (
              <div
                key={ebook.id}
                onClick={() => goToDetail(ebook.slug)}
                className="bg-paper rounded-2xl shadow-soft overflow-hidden cursor-pointer group hover:shadow-lift transition-all"
              >
                <div className="relative aspect-[3/4] bg-cream overflow-hidden">
                  <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <p className="font-serif text-lg font-medium text-cream line-clamp-2">{ebook.title}</p>
                    {ebook.author && <p className="text-xs text-cream/70 mt-0.5">por {ebook.author}</p>}
                  </div>
                </div>
                <div className="p-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-wood">{ebook.price > 0 ? formatBRL(ebook.price) : 'Grátis'}</span>
                  <span className="text-xs text-muted">Ver detalhes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All ebooks */}
      {ebooks.length > 0 ? (
        <div>
          {featured.length > 0 && (
            <h2 className="font-serif text-lg font-medium text-espresso mb-3">Todos os E-books</h2>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {ebooks.map(ebook => (
              <div
                key={ebook.id}
                onClick={() => goToDetail(ebook.slug)}
                className="bg-paper rounded-xl shadow-soft overflow-hidden cursor-pointer group hover:shadow-lift transition-all"
              >
                <div className="relative aspect-[3/4] bg-cream overflow-hidden">
                  <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-3">
                  <p className="font-serif text-sm font-medium text-espresso line-clamp-2">{ebook.title}</p>
                  {ebook.author && <p className="text-[11px] text-muted mt-0.5">por {ebook.author}</p>}
                  <p className="text-sm font-bold text-wood mt-1">{ebook.price > 0 ? formatBRL(ebook.price) : 'Grátis'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-paper rounded-2xl shadow-soft p-8 text-center">
          <BookOpen className="w-16 h-16 text-rim mx-auto mb-4" />
          <p className="text-muted font-medium">Nenhum e-book disponível no momento.</p>
          <p className="text-xs text-muted mt-1">Volte em breve!</p>
        </div>
      )}

      {/* Launch notification signup */}
      <div className="mt-8 bg-paper rounded-2xl border border-wood/20 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 bg-wood/10 rounded-xl flex items-center justify-center flex-shrink-0">
              <Bell className="w-5 h-5 text-wood" />
            </div>
            <div>
              <h3 className="font-serif text-sm font-medium text-espresso">Não fique de fora dos próximos lançamentos</h3>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Digite seu e-mail e seja o primeiro a saber quando novos cursos e e-books chegarem.
              </p>
            </div>
          </div>
          {subStatus === 'done' ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-moss/10 text-moss text-xs font-semibold rounded-lg flex-shrink-0">
              <Check className="w-4 h-4" /> Inscrição confirmada!
            </div>
          ) : (
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <div className="relative flex-1 sm:w-56">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={subEmail}
                  onChange={e => { setSubEmail(e.target.value); setSubStatus('idle'); }}
                  placeholder="seu@email.com"
                  onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <button
                onClick={handleSubscribe}
                disabled={subStatus === 'loading'}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-xs font-semibold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {subStatus === 'loading' ? '...' : <>Avisar-me <ArrowRight className="w-3.5 h-3.5" /></>}
              </button>
            </div>
          )}
        </div>
        {subStatus === 'error' && (
          <p className="text-[11px] text-red-600 mt-2">Digite um e-mail válido para se inscrever.</p>
        )}
        {subStatus === 'done' && (
          <p className="text-[11px] text-muted mt-2">
            Você receberá avisos de novos lançamentos. Pode cancelar a qualquer momento. Em conformidade com a LGPD (Lei nº 13.709/2018).
          </p>
        )}
        {isCustomer && subStatus !== 'done' && (
          <p className="text-[11px] text-muted mt-2">
            Já tem conta? Acesse seus cursos na área de membros.{' '}
            <button onClick={() => onNavigate('/area-de-membros')} className="text-wood font-medium hover:underline">
              Ir para Meus Cursos
            </button>
          </p>
        )}
        {!isCustomer && subStatus !== 'done' && (
          <p className="text-[11px] text-muted mt-2">
            Quer acesso completo?{' '}
            <button onClick={() => onNavigate('/entrar')} className="text-wood font-medium hover:underline">
              Crie sua conta gratuita
            </button>
          </p>
        )}
      </div>

      {/* Hotmart transparency notice */}
      <div className="mt-4 bg-paper rounded-xl border border-rim p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-wood flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted leading-relaxed">
          O processamento de pagamento e a entrega dos infoprodutos são realizados de forma segura pela plataforma parceira Hotmart. Você recebe seu acesso imediatamente após a confirmação do pagamento, conforme o Código de Defesa do Consumidor (Lei nº 8.078/90).
        </p>
      </div>
    </div>
  );
}
