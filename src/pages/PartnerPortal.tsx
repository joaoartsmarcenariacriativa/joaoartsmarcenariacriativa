import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { PartnerStore, PartnerShowcaseItem, PartnerAuditLog } from '@/types';

const inputClass =
  'mt-1 w-full rounded-lg border border-rim bg-cream px-3 py-2 text-sm focus:border-wood focus:outline-none transition-colors';
const labelClass = 'text-[10px] uppercase tracking-[0.2em] text-muted';

function httpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function logAudit(partnerStoreId: string, email: string, action: string, detail: string) {
  supabase.from('partner_audit_logs').insert({
    partner_store_id: partnerStoreId,
    actor_email: email,
    action,
    detail,
  }).then(() => {});
}

export default function PartnerPortal({ slug, onNavigate }: { slug: string; onNavigate: (path: string) => void }) {
  const { user, signInWithEmail, signOut } = useAuth();
  const [store, setStore] = useState<PartnerStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPartner, setIsPartner] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [showcaseItems, setShowcaseItems] = useState<PartnerShowcaseItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<PartnerAuditLog[]>([]);
  const [showcaseModal, setShowcaseModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PartnerShowcaseItem | null>(null);

  const loadStore = async () => {
    setLoading(true);
    const { data, error: storeError } = await supabase
      .from('partner_stores')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (storeError || !data) {
      setError('Loja parceira não encontrada.');
      setLoading(false);
      return;
    }
    setStore(data as PartnerStore);
    setLoading(false);
  };

  const checkAccess = async () => {
    if (!user || !store) return;
    const { data } = await supabase
      .from('partner_accounts')
      .select('id')
      .eq('partner_store_id', store.id)
      .eq('user_id', user.id)
      .maybeSingle();
    setIsPartner(!!data);
  };

  const loadShowcase = async () => {
    if (!store) return;
    const { data } = await supabase
      .from('partner_showcase_items')
      .select('*')
      .eq('partner_store_id', store.id)
      .order('sort_order')
      .order('created_at', { ascending: false });
    setShowcaseItems((data ?? []) as PartnerShowcaseItem[]);
  };

  const loadLogs = async () => {
    if (!store) return;
    const { data } = await supabase
      .from('partner_audit_logs')
      .select('*')
      .eq('partner_store_id', store.id)
      .order('created_at', { ascending: false })
      .limit(50);
    setAuditLogs((data ?? []) as PartnerAuditLog[]);
  };

  useEffect(() => {
    loadStore();
  }, [slug]);

  useEffect(() => {
    checkAccess();
  }, [user, store]);

  useEffect(() => {
    if (isPartner && store) {
      loadShowcase();
      loadLogs();
      logAudit(store.id, user?.email ?? '?', 'login', 'Acessou o portal do parceiro');
    }
  }, [isPartner, store]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!email.trim() || !password) return setLoginError('Preencha e-mail e senha.');
    setLoggingIn(true);
    const { error: signInError } = await signInWithEmail(email, password);
    setLoggingIn(false);
    if (signInError) return setLoginError('Credenciais inválidas. Verifique com o administrador da loja.');
  };

  const handleSignOut = async () => {
    await signOut();
    setIsPartner(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <Loader2 className="h-8 w-8 animate-spin text-wood" />
      </div>
    );
  }

  if (error || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream px-4">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted" />
          <p className="text-sm text-muted">{error ?? 'Loja não encontrada.'}</p>
          <button onClick={() => onNavigate('/')} className="mt-4 text-sm text-wood hover:underline">
            Voltar para a loja
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header bar */}
      <div className="bg-espresso text-cream">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button onClick={() => onNavigate('/')} className="flex items-center gap-1.5 text-xs text-cream/60 hover:text-cream">
            <ArrowLeft className="h-4 w-4" /> Voltar para a loja
          </button>
          {isPartner && (
            <button onClick={handleSignOut} className="text-xs text-cream/60 hover:text-cream">
              Sair do portal
            </button>
          )}
        </div>
      </div>

      {/* Store banner */}
      <div className="bg-paper border-b border-rim">
        <div className="max-w-5xl mx-auto px-4 py-8 flex items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-cream">
            {store.logo_url ? (
              <img src={store.logo_url} alt={store.name} className="h-full w-full object-contain" />
            ) : (
              <Store className="h-8 w-8 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            <h1 className="font-serif text-2xl font-semibold text-espresso">{store.name}</h1>
            <p className="text-xs uppercase tracking-wide text-wood">{store.category}</p>
            {store.description && <p className="mt-1 text-sm text-muted line-clamp-2">{store.description}</p>}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {!isPartner ? (
          /* Login form */
          <div className="mx-auto max-w-md">
            <div className="rounded-2xl border border-rim bg-paper p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-2">
                <Lock className="h-5 w-5 text-wood" />
                <h2 className="font-serif text-lg font-semibold text-espresso">Acesso do Parceiro</h2>
              </div>
              {user && !isPartner && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>Você está logado mas não tem permissão para este portal. Solicite acesso ao administrador da loja.</span>
                </div>
              )}
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className={labelClass}>E-mail</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      required
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Senha</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>
                {loginError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full rounded-full bg-wood py-2.5 text-sm font-semibold text-espresso transition-transform hover:scale-105 disabled:opacity-50"
                >
                  {loggingIn ? 'Entrando...' : 'Entrar no Portal'}
                </button>
              </form>
            </div>
            <p className="mt-4 text-center text-[11px] text-muted">
              Não tem uma conta? Solicite acesso ao administrador da loja.
            </p>
          </div>
        ) : (
          /* Partner dashboard */
          <div className="space-y-6">
            {/* Quick actions */}
            <div className="grid gap-3 sm:grid-cols-2">
              <a
                href={store.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-3 rounded-2xl border border-rim bg-paper p-4 transition-transform hover:scale-[1.02]"
              >
                <ExternalLink className="h-5 w-5 text-wood" />
                <div>
                  <p className="text-sm font-semibold text-espresso">Visitar Loja Parceira</p>
                  <p className="truncate text-xs text-muted">{store.url}</p>
                </div>
              </a>
              {store.checkout_test_url && (
                <a
                  href={store.checkout_test_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => logAudit(store.id, user?.email ?? '?', 'checkout_test', 'Testou o checkout da loja')}
                  className="flex items-center gap-3 rounded-2xl border border-rim bg-paper p-4 transition-transform hover:scale-[1.02]"
                >
                  <Zap className="h-5 w-5 text-wood" />
                  <div>
                    <p className="text-sm font-semibold text-espresso">Testar Checkout</p>
                    <p className="truncate text-xs text-muted">{store.checkout_test_url}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Showcase portfolio */}
            <div className="rounded-2xl border border-rim bg-paper p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-espresso">Portfólio de Pré-visualização</h2>
                <button
                  onClick={() => { setEditingItem(null); setShowcaseModal(true); }}
                  className="flex items-center gap-1.5 rounded-full bg-wood px-3 py-1.5 text-xs font-semibold text-espresso hover:scale-105 transition-transform"
                >
                  <Plus className="h-3.5 w-3.5" /> Adicionar Item
                </button>
              </div>
              {showcaseItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted">
                  Nenhum item no portfólio ainda. Adicione produtos ou links para pré-visualização.
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {showcaseItems.map(item => (
                    <div key={item.id} className={`rounded-xl border border-rim bg-cream p-3 ${!item.active ? 'opacity-60' : ''}`}>
                      <div className="mb-2 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-paper">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                        ) : (
                          <ImageIcon className="h-8 w-8 text-muted" />
                        )}
                      </div>
                      <p className="text-sm font-semibold text-espresso">{item.title}</p>
                      {item.price_label && <p className="text-xs text-wood">{item.price_label}</p>}
                      {item.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{item.description}</p>}
                      {item.link_url && (
                        <a
                          href={item.link_url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="mt-2 flex items-center gap-1 text-xs text-wood hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" /> Ver produto
                        </a>
                      )}
                      <div className="mt-2 flex gap-2 border-t border-rim pt-2">
                        <button
                          onClick={() => { setEditingItem(item); setShowcaseModal(true); }}
                          className="hover:text-espresso"
                        >
                          <Pencil className="h-3.5 w-3.5 text-muted" />
                        </button>
                        <button
                          onClick={async () => {
                            if (!confirm(`Excluir "${item.title}"?`)) return;
                            await supabase.from('partner_showcase_items').delete().eq('id', item.id);
                            logAudit(store.id, user?.email ?? '?', 'showcase_delete', `Removeu o item "${item.title}"`);
                            loadShowcase();
                          }}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit logs */}
            <div className="rounded-2xl border border-rim bg-paper p-5">
              <div className="mb-3 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-wood" />
                <h2 className="font-serif text-lg font-semibold text-espresso">Logs de Auditoria</h2>
              </div>
              {auditLogs.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Nenhuma atividade registrada ainda.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border border-rim bg-cream p-3 text-xs">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-moss" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-espresso">
                          {log.action} <span className="text-muted">— {log.actor_email}</span>
                        </p>
                        {log.detail && <p className="text-muted">{log.detail}</p>}
                        <p className="text-[10px] text-muted">{new Date(log.created_at).toLocaleString('pt-BR')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Showcase item modal */}
      {showcaseModal && store && (
        <ShowcaseItemModal
          item={editingItem}
          partnerStoreId={store.id}
          actorEmail={user?.email ?? '?'}
          onClose={() => setShowcaseModal(false)}
          onSaved={() => {
            setShowcaseModal(false);
            loadShowcase();
            loadLogs();
          }}
        />
      )}
    </div>
  );
}

function ShowcaseItemModal({
  item,
  partnerStoreId,
  actorEmail,
  onClose,
  onSaved,
}: {
  item: PartnerShowcaseItem | null;
  partnerStoreId: string;
  actorEmail: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: item?.title ?? '',
    description: item?.description ?? '',
    image: item?.image_url ?? '',
    link: item?.link_url ?? '',
    price: item?.price_label ?? '',
    active: item?.active ?? true,
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.title.trim()) return setError('Informe o título do item.');
    const imgUrl = form.image.trim() ? httpsUrl(form.image) : null;
    const linkUrl = form.link.trim() ? httpsUrl(form.link) : null;
    if (form.image.trim() && !imgUrl) return setError('A URL da imagem deve começar com https://');
    if (form.link.trim() && !linkUrl) return setError('A URL do link deve começar com https://')

    setSaving(true);
    const payload = {
      partner_store_id: partnerStoreId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      image_url: imgUrl,
      link_url: linkUrl,
      price_label: form.price.trim() || null,
      active: form.active,
    };
    const result = item
      ? await supabase.from('partner_showcase_items').update(payload).eq('id', item.id)
      : await supabase.from('partner_showcase_items').insert(payload);
    setSaving(false);
    if (result.error) return setError('Não foi possível salvar o item.');
    logAudit(partnerStoreId, actorEmail, 'showcase_edit', `${item ? 'Editou' : 'Adicionou'} o item "${form.title}"`);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-rim bg-paper p-5">
          <h2 className="font-serif font-bold text-espresso">{item ? 'Editar Item' : 'Adicionar Item ao Portfólio'}</h2>
          <button onClick={onClose}><Eye className="h-5 w-5 text-muted" /></button>
        </div>
        <div className="space-y-4 p-5">
          <div>
            <label className={labelClass}>Título *</label>
            <input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Nome do produto" />
          </div>
          <div>
            <label className={labelClass}>Descrição</label>
            <textarea className={`${inputClass} resize-none`} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>URL da Imagem</label>
              <input className={inputClass} value={form.image} onChange={e => setForm({ ...form, image: e.target.value })} placeholder="https://..." />
            </div>
            <div>
              <label className={labelClass}>URL do Link</label>
              <input className={inputClass} value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://..." />
            </div>
          </div>
          <div>
            <label className={labelClass}>Preço (texto livre)</label>
            <input className={inputClass} value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="R$ 199,90" />
          </div>
          <label className="flex items-center gap-2 text-sm text-espresso">
            <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="h-4 w-4 rounded border-rim text-wood" />
            Item ativo na pré-visualização
          </label>
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t border-rim bg-paper p-5">
          <button onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-cream">Cancelar</button>
          <button onClick={save} disabled={saving} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-wood py-2.5 text-sm font-semibold text-espresso disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Item'}
          </button>
        </div>
      </div>
    </div>
  );
}
