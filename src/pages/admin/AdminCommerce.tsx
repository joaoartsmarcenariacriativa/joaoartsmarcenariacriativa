import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Handshake,
  Info,
  Loader2,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Store,
  Ticket,
  Trash2,
  Wallet,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/format';
import type {
  Coupon,
  CouponDiscountType,
  GatewayStatus,
  PartnerStore,
  PaymentGateway,
} from '@/types';

type Section = 'coupons' | 'gateways' | 'partners';

const inputClass =
  'mt-1 w-full rounded-lg border border-rim bg-cream px-3 py-2 text-sm focus:border-wood focus:outline-none transition-colors';
const labelClass = 'text-[10px] uppercase tracking-[0.2em] text-muted';
const todayIso = () => new Date().toISOString().slice(0, 10);

function httpsUrl(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={`Alternar ${label}`}
      onClick={onChange}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${
        checked ? 'bg-moss' : 'bg-rim'
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-paper shadow transition-all ${
          checked ? 'left-5' : 'left-0.5'
        }`}
      />
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-rim bg-paper p-10 text-center text-sm text-muted">
      {text}
    </div>
  );
}

function ErrorNote({ text }: { text: string | null }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{text}</span>
    </div>
  );
}

function Shell({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: {
  title: string;
  subtitle: string;
  actionLabel: string;
  onAction: () => void;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">{title}</h1>
          <p className="mt-1 text-sm text-muted">{subtitle}</p>
        </div>
        <button
          onClick={onAction}
          className="flex items-center gap-2 rounded-full bg-wood px-4 py-2.5 text-sm font-semibold text-espresso transition-transform hover:scale-105"
        >
          <Plus className="h-4 w-4" />
          {actionLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function Modal({
  title,
  onClose,
  onSave,
  saving,
  error,
  saveLabel,
  children,
}: {
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  error: string | null;
  saveLabel: string;
  children: ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-rim bg-paper p-5">
          <h2 className="font-serif font-bold text-espresso">{title}</h2>
          <button onClick={onClose} aria-label="Fechar" className="hover:text-espresso">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        <div className="space-y-4 p-5">
          {children}
          <ErrorNote text={error} />
        </div>
        <div className="sticky bottom-0 flex gap-2 border-t border-rim bg-paper p-5">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2.5 text-sm text-muted hover:bg-cream"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-wood py-2.5 text-sm font-semibold text-espresso disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Salvando...' : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- Cupons ----------------------------- */

function CouponForm({
  item,
  onClose,
  onSaved,
}: {
  item: Coupon | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    code: item?.code ?? '',
    type: (item?.discount_type ?? 'percent') as CouponDiscountType,
    value: item ? String(item.discount_value) : '',
    min: item ? String(item.min_order_value) : '0',
    max: item?.max_uses ? String(item.max_uses) : '',
    expires: item ? item.expires_at.slice(0, 10) : '',
    active: item?.active ?? true,
    description: item?.description ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    const value = Number(form.value);
    const max = form.max === '' ? null : Number(form.max);

    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      return setError('Código inválido: 3 a 40 letras, números, hífen ou underline.');
    }
    if (!Number.isFinite(value) || value <= 0) {
      return setError('Informe um valor de desconto válido maior que zero.');
    }
    if (form.type === 'percent' && value > 100) {
      return setError('O desconto em porcentagem não pode passar de 100%.');
    }
    if (!form.expires || (!item && form.expires < todayIso())) {
      return setError('A data de expiração é obrigatória e não pode estar no passado.');
    }
    if (max !== null && (!Number.isInteger(max) || max < 1)) {
      return setError('O limite de uso deve ser um número inteiro maior que zero.');
    }

    setSaving(true);
    const payload = {
      code,
      discount_type: form.type,
      discount_value: value,
      min_order_value: Number(form.min) || 0,
      max_uses: max,
      expires_at: `${form.expires}T23:59:59-03:00`,
      active: form.active,
      description: form.description.trim() || null,
    };
    const result = item
      ? await supabase.from('coupons').update(payload).eq('id', item.id)
      : await supabase.from('coupons').insert(payload);
    setSaving(false);

    if (result.error) {
      return setError(
        result.error.code === '23505'
          ? 'Este código de cupom já existe.'
          : 'Não foi possível salvar o cupom. Tente novamente.',
      );
    }
    onSaved();
  };

  return (
    <Modal
      title={item ? 'Editar Cupom' : 'Criar Novo Cupom'}
      onClose={onClose}
      onSave={save}
      saving={saving}
      error={error}
      saveLabel="Salvar Cupom"
    >
      <div>
        <label className={labelClass}>Código do Cupom *</label>
        <input
          className={`${inputClass} font-mono`}
          value={form.code}
          onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
          placeholder="BEMVINDO10"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Tipo de Desconto *</label>
          <select
            className={inputClass}
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value as CouponDiscountType })}
          >
            <option value="percent">Porcentagem (%)</option>
            <option value="fixed">Valor Fixo (R$)</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Valor do Desconto *</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            step="0.01"
            value={form.value}
            onChange={e => setForm({ ...form, value: e.target.value })}
            placeholder={form.type === 'percent' ? '10' : '15.90'}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Pedido Mínimo (R$)</label>
          <input
            className={inputClass}
            type="number"
            min="0"
            value={form.min}
            onChange={e => setForm({ ...form, min: e.target.value })}
            placeholder="0"
          />
        </div>
        <div>
          <label className={labelClass}>Limite de Uso</label>
          <input
            className={inputClass}
            type="number"
            min="1"
            placeholder="Ilimitado"
            value={form.max}
            onChange={e => setForm({ ...form, max: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Data de Expiração *</label>
        <input
          className={inputClass}
          type="date"
          min={item ? undefined : todayIso()}
          value={form.expires}
          onChange={e => setForm({ ...form, expires: e.target.value })}
        />
        <p className="mt-1 text-[11px] text-muted">
          Válido até 23:59 (horário de Brasília) na data escolhida. Exigido pelo CDC.
        </p>
      </div>
      <div>
        <label className={labelClass}>Regras e Restrições</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={2}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Ex: Válido apenas para a primeira compra. Não acumulável."
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-espresso">
        <input
          type="checkbox"
          checked={form.active}
          onChange={e => setForm({ ...form, active: e.target.checked })}
          className="h-4 w-4 rounded border-rim text-wood focus:ring-wood"
        />
        Cupom ativo e disponível para uso
      </label>
    </Modal>
  );
}

type CouponFilter = 'all' | 'active' | 'expired' | 'inactive';

function Coupons() {
  const [items, setItems] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<CouponFilter>('all');
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return setLoadError('Não foi possível carregar os cupons.');
    setLoadError(null);
    setItems((data ?? []) as Coupon[]);
  };

  const isExpired = (expires_at: string) => new Date(expires_at) < new Date();

  const filteredItems = items.filter(item => {
    if (search && !item.code.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'active') return item.active && !isExpired(item.expires_at);
    if (filter === 'expired') return isExpired(item.expires_at);
    if (filter === 'inactive') return !item.active;
    return true;
  });

  const filterButtons: { key: CouponFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'active', label: 'Ativos' },
    { key: 'expired', label: 'Expirados' },
    { key: 'inactive', label: 'Inativos' },
  ];

  useEffect(() => {
    load();
  }, []);

  const toggle = async (item: Coupon) => {
    const { error } = await supabase
      .from('coupons')
      .update({ active: !item.active })
      .eq('id', item.id);
    if (error) return setLoadError('Não foi possível alterar o status do cupom.');
    load();
  };

  const remove = async (item: Coupon) => {
    if (!confirm(`Excluir o cupom ${item.code}?`)) return;
    const { error } = await supabase.from('coupons').delete().eq('id', item.id);
    if (error) return setLoadError('Não foi possível excluir o cupom.');
    load();
  };

  return (
    <Shell
      title="Cupons e Ofertas"
      subtitle="Descontos com validade e limite de uso — transparência exigida pelo CDC"
      actionLabel="Criar Novo Cupom"
      onAction={() => {
        setEditing(null);
        setOpen(true);
      }}
    >
      <ErrorNote text={loadError} />
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-wood" />
        </div>
      ) : (
        <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {filterButtons.map(btn => (
            <button
              key={btn.key}
              onClick={() => setFilter(btn.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === btn.key
                  ? 'bg-wood text-espresso'
                  : 'bg-cream text-muted hover:bg-rim/40'
              }`}
            >
              {btn.label}
            </button>
          ))}
          <div className="relative ml-auto">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por código..."
              className="w-40 rounded-full border border-rim bg-cream py-1.5 pl-7 pr-3 text-xs focus:border-wood focus:outline-none sm:w-52"
            />
          </div>
        </div>
        {filteredItems.length === 0 ? (
          <Empty text="Nenhum cupom encontrado para este filtro." />
        ) : (
        <div className="overflow-x-auto rounded-2xl border border-rim bg-paper">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-cream text-left text-[10px] uppercase tracking-[0.15em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Código</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Regras / Restrições</th>
                <th className="px-4 py-3 font-medium">Expiração</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rim">
              {filteredItems.map(item => {
                const expired = new Date(item.expires_at) < new Date();
                return (
                  <tr key={item.id} className="hover:bg-cream/50">
                    <td className="px-4 py-3 font-mono font-semibold text-espresso">
                      {item.code}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.discount_type === 'percent' ? 'Porcentagem' : 'Valor Fixo'}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {item.discount_type === 'percent'
                        ? `${item.discount_value}%`
                        : formatBRL(item.discount_value)}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {item.min_order_value ? `Mín. ${formatBRL(item.min_order_value)} · ` : ''}
                      {item.uses_count}/{item.max_uses ?? '∞'} usos
                      {item.description ? ` · ${item.description}` : ''}
                    </td>
                    <td className={`px-4 py-3 ${expired ? 'text-red-600' : 'text-muted'}`}>
                      {new Date(item.expires_at).toLocaleDateString('pt-BR')}
                      {expired ? ' (expirado)' : ''}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Toggle
                          checked={item.active}
                          onChange={() => toggle(item)}
                          label={item.code}
                        />
                        <span className={item.active ? 'text-moss' : 'text-muted'}>
                          {item.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-3">
                        <button
                          aria-label="Editar cupom"
                          onClick={() => {
                            setEditing(item);
                            setOpen(true);
                          }}
                          className="hover:text-espresso"
                        >
                          <Pencil className="h-4 w-4 text-muted" />
                        </button>
                        <button
                          aria-label="Excluir cupom"
                          onClick={() => remove(item)}
                          className="hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 text-muted" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        )}
        </div>
      )}
      {open && (
        <CouponForm
          item={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </Shell>
  );
}

/* --------------------------- Gateways --------------------------- */

function GatewayForm({
  item,
  onClose,
  onSaved,
}: {
  item: PaymentGateway | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.provider_name ?? '',
    publicKey: item?.public_key ?? '',
    secret: '',
    status: (item?.status ?? 'teste') as GatewayStatus,
  });
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name.trim()) return setError('Informe o nome do provedor.');
    if (!item && !form.secret.trim()) return setError('A chave secreta é obrigatória.');

    setSaving(true);
    const payload: Record<string, unknown> = {
      provider_name: form.name.trim(),
      public_key: form.publicKey.trim() || null,
      status: form.status,
    };
    if (form.secret.trim()) payload.secret_key = form.secret.trim();

    const result = item
      ? await supabase.from('payment_gateways').update(payload).eq('id', item.id)
      : await supabase.from('payment_gateways').insert({ ...payload, enabled: false });
    setSaving(false);

    if (result.error) return setError('Não foi possível salvar o gateway. Tente novamente.');
    onSaved();
  };

  return (
    <Modal
      title={item ? 'Editar Gateway' : 'Adicionar Novo Gateway'}
      onClose={onClose}
      onSave={save}
      saving={saving}
      error={error}
      saveLabel="Salvar Gateway"
    >
      <div>
        <label className={labelClass}>Nome do Provedor *</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Nubank, Pagar.me, Mercado Pago, Stripe..."
        />
      </div>
      <div>
        <label className={labelClass}>Chave Pública / API Key</label>
        <input
          className={`${inputClass} font-mono`}
          value={form.publicKey}
          onChange={e => setForm({ ...form, publicKey: e.target.value })}
          autoComplete="off"
          placeholder="pk_live_..."
        />
      </div>
      <div>
        <label className={labelClass}>
          Chave Secreta / Token de Integração {item ? '' : '*'}
        </label>
        <div className="relative">
          <input
            className={`${inputClass} pr-10 font-mono`}
            type={showSecret ? 'text' : 'password'}
            placeholder={item ? 'Deixe vazio para manter a chave atual' : '••••••••'}
            value={form.secret}
            onChange={e => setForm({ ...form, secret: e.target.value })}
            autoComplete="new-password"
          />
          <button
            type="button"
            aria-label={showSecret ? 'Ocultar chave' : 'Exibir chave'}
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-espresso"
          >
            {showSecret ? <EyeOff className="h-4 w-4 text-muted" /> : <Eye className="h-4 w-4 text-muted" />}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-muted">
          A chave secreta é gravada com segurança e nunca é exibida novamente após salvar.
        </p>
      </div>
      <div>
        <label className={labelClass}>Status</label>
        <select
          className={inputClass}
          value={form.status}
          onChange={e => setForm({ ...form, status: e.target.value as GatewayStatus })}
        >
          <option value="ativo">Ativo</option>
          <option value="teste">Em Testes</option>
        </select>
      </div>
    </Modal>
  );
}

function Gateways() {
  const [items, setItems] = useState<PaymentGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PaymentGateway | null>(null);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; msg: string }>>({});

  const testGateway = async (item: PaymentGateway) => {
    setTestingId(item.id);
    setTestResult(prev => ({ ...prev, [item.id]: { ok: false, msg: 'Testando...' } }));
    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-checkout`;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      };
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'ping', provider: item.provider_name }),
      });
      if (response.ok || response.status === 400) {
        setTestResult(prev => ({
          ...prev,
          [item.id]: { ok: true, msg: 'Conexão estabelecida com sucesso.' },
        }));
      } else {
        setTestResult(prev => ({
          ...prev,
          [item.id]: { ok: false, msg: `Erro ${response.status}: sem resposta do servidor.` },
        }));
      }
    } catch {
      setTestResult(prev => ({
        ...prev,
        [item.id]: { ok: false, msg: 'Não foi possível conectar ao gateway.' },
      }));
    }
    setTestingId(null);
  };

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_gateways')
      .select('id, provider_name, public_key, status, enabled, created_at')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (error) return setLoadError('Não foi possível carregar os gateways.');
    setLoadError(null);
    setItems((data ?? []) as PaymentGateway[]);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (item: PaymentGateway) => {
    const { error } = await supabase
      .from('payment_gateways')
      .update({ enabled: !item.enabled })
      .eq('id', item.id);
    if (error) return setLoadError('Não foi possível alterar o gateway.');
    load();
  };

  const remove = async (item: PaymentGateway) => {
    if (!confirm(`Remover o gateway ${item.provider_name}?`)) return;
    const { error } = await supabase.from('payment_gateways').delete().eq('id', item.id);
    if (error) return setLoadError('Não foi possível remover o gateway.');
    load();
  };

  return (
    <Shell
      title="Gateways de Pagamento"
      subtitle="Cadastre e ative qualquer provedor de pagamento"
      actionLabel="Adicionar Novo Gateway"
      onAction={() => {
        setEditing(null);
        setOpen(true);
      }}
    >
      <div className="flex gap-3 rounded-2xl border border-moss/30 bg-moss/10 p-4">
        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-moss" />
        <p className="text-sm text-espresso">
          <b>Ambiente Seguro HTTPS.</b> O sistema não armazena dados de cartões de crédito,
          apenas gerencia chaves de integração via API em conformidade com o padrão PCI-DSS.
        </p>
      </div>

      <ErrorNote text={loadError} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-wood" />
        </div>
      ) : items.length === 0 ? (
        <Empty text="Nenhum gateway cadastrado ainda. Clique em 'Adicionar Novo Gateway' para começar." />
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-rim bg-paper p-4"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-cream">
                <Wallet className="h-5 w-5 text-muted" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="text-espresso">{item.provider_name}</b>
                <p className="text-xs text-muted">
                  <span
                    className={
                      item.status === 'ativo'
                        ? 'font-medium text-moss'
                        : 'font-medium text-amber-700'
                    }
                  >
                    {item.status === 'ativo' ? 'Ativo' : 'Em Testes'}
                  </span>
                  {' · '}
                  {item.public_key ? 'Chave pública cadastrada' : 'Sem chave pública'}
                </p>
              </div>
              <Toggle
                checked={item.enabled}
                onChange={() => toggle(item)}
                label={item.provider_name}
              />
              <span
                className={`hidden w-16 text-xs sm:block ${
                  item.enabled ? 'text-moss' : 'text-muted'
                }`}
              >
                {item.enabled ? 'Ligado' : 'Desligado'}
              </span>
              {testResult[item.id] && (
                <span
                  className={`hidden items-center gap-1 text-xs sm:flex ${
                    testResult[item.id].ok ? 'text-moss' : 'text-red-600'
                  }`}
                >
                  {testResult[item.id].ok ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  {testResult[item.id].msg}
                </span>
              )}
              <div className="flex gap-3">
                <button
                  aria-label="Testar conexão do gateway"
                  onClick={() => testGateway(item)}
                  disabled={testingId === item.id}
                  title="Testar conexão"
                  className="hover:text-espresso disabled:opacity-50"
                >
                  {testingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
                  ) : (
                    <Zap className="h-4 w-4 text-muted" />
                  )}
                </button>
                <button
                  aria-label="Editar gateway"
                  onClick={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                  className="hover:text-espresso"
                >
                  <Pencil className="h-4 w-4 text-muted" />
                </button>
                <button
                  aria-label="Remover gateway"
                  onClick={() => remove(item)}
                  className="hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <GatewayForm
          item={editing}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </Shell>
  );
}

/* --------------------------- Parceiros --------------------------- */

function PartnerForm({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: PartnerStore | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item?.name ?? '',
    url: item?.url ?? '',
    description: item?.description ?? '',
    logo: item?.logo_url ?? '',
    category: item?.category ?? 'Geral',
    active: item?.active ?? true,
    slug: item?.slug ?? '',
    adminEmail: item?.admin_email ?? '',
    checkoutTestUrl: item?.checkout_test_url ?? '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const save = async () => {
    const url = httpsUrl(form.url);
    const logo = form.logo.trim() ? httpsUrl(form.logo) : null;
    const checkoutTest = form.checkoutTestUrl.trim() ? httpsUrl(form.checkoutTestUrl) : null;
    if (!form.name.trim()) return setError('Informe o nome da loja.');
    if (!url) return setError('Informe uma URL válida começando com https://');
    if (form.logo.trim() && !logo)
      return setError('A URL do logotipo deve começar com https://');
    if (form.checkoutTestUrl.trim() && !checkoutTest)
      return setError('A URL de teste de checkout deve começar com https://');

    const slug = form.slug.trim() || generateSlug(form.name);
    if (!/^[a-z0-9-]{2,80}$/.test(slug)) return setError('O slug deve ter apenas letras minúsculas, números e hifens.');

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      url,
      description: form.description.trim() || null,
      logo_url: logo,
      category: form.category.trim() || 'Geral',
      active: form.active,
      slug,
      admin_email: form.adminEmail.trim() || null,
      checkout_test_url: checkoutTest,
    };
    const result = item
      ? await supabase.from('partner_stores').update(payload).eq('id', item.id)
      : await supabase.from('partner_stores').insert(payload);
    setSaving(false);

    if (result.error) return setError('Não foi possível salvar a parceria. Tente novamente.');
    onSaved();
  };

  return (
    <Modal
      title={item ? 'Editar Loja Parceira' : 'Adicionar Nova Loja Parceira'}
      onClose={onClose}
      onSave={save}
      saving={saving}
      error={error}
      saveLabel="Salvar Parceiro"
    >
      <div>
        <label className={labelClass}>Nome da Loja *</label>
        <input
          className={inputClass}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Nome da loja parceira"
        />
      </div>
      <div>
        <label className={labelClass}>URL do Link da Loja *</label>
        <input
          className={inputClass}
          value={form.url}
          onChange={e => setForm({ ...form, url: e.target.value })}
          placeholder="https://www.lojaparceira.com.br"
        />
      </div>
      <div>
        <label className={labelClass}>Slug do Portal (URL amigável)</label>
        <input
          className={`${inputClass} font-mono`}
          value={form.slug}
          onChange={e => setForm({ ...form, slug: e.target.value })}
          placeholder={generateSlug(form.name) || 'minha-loja'}
        />
        <p className="mt-1 text-[11px] text-muted">Endereço do portal: /parceiro/{form.slug || '...'}</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>E-mail do Admin do Parceiro</label>
          <input
            className={inputClass}
            type="email"
            value={form.adminEmail}
            onChange={e => setForm({ ...form, adminEmail: e.target.value })}
            placeholder="parceiro@email.com"
          />
          <p className="mt-1 text-[11px] text-muted">O parceiro usa este e-mail para entrar no portal.</p>
        </div>
        <div>
          <label className={labelClass}>URL de Teste de Checkout</label>
          <input
            className={inputClass}
            value={form.checkoutTestUrl}
            onChange={e => setForm({ ...form, checkoutTestUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Categoria</label>
          <input
            list="partner-categories"
            className={inputClass}
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            placeholder="Geral"
          />
          <datalist id="partner-categories">
            {categories.map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelClass}>URL do Logotipo</label>
          <input
            className={inputClass}
            value={form.logo}
            onChange={e => setForm({ ...form, logo: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Descrição Curta</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={3}
          maxLength={240}
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder="Breve descrição da loja parceira (máx. 240 caracteres)"
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-rim bg-cream p-3">
        <span className="text-sm text-espresso">Exibir no site imediatamente</span>
        <Toggle
          checked={form.active}
          onChange={() => setForm({ ...form, active: !form.active })}
          label="exibição do parceiro"
        />
      </div>
    </Modal>
  );
}

function Partners() {
  const [items, setItems] = useState<PartnerStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PartnerStore | null>(null);
  const [open, setOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('partner_stores')
      .select('*')
      .order('sort_order')
      .order('name');
    setLoading(false);
    if (error) return setLoadError('Não foi possível carregar as lojas parceiras.');
    setLoadError(null);
    setItems((data ?? []) as PartnerStore[]);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (item: PartnerStore) => {
    const { error } = await supabase
      .from('partner_stores')
      .update({ active: !item.active })
      .eq('id', item.id);
    if (error) return setLoadError('Não foi possível alterar a exibição do parceiro.');
    load();
  };

  const remove = async (item: PartnerStore) => {
    if (!confirm(`Remover a loja parceira ${item.name}?`)) return;
    const { error } = await supabase.from('partner_stores').delete().eq('id', item.id);
    if (error) return setLoadError('Não foi possível remover o parceiro.');
    load();
  };

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <Shell
      title="Lojas Parceiras"
      subtitle="Links de lojas externas exibidos no site"
      actionLabel="Adicionar Nova Loja Parceira"
      onAction={() => {
        setEditing(null);
        setOpen(true);
      }}
    >
      <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <Info className="h-5 w-5 flex-shrink-0 text-amber-800" />
        <p className="text-sm text-espresso">
          <b>Aviso:</b> Este site exibe links de parceiros comerciais e pode receber comissões
          por vendas geradas.
        </p>
      </div>

      <ErrorNote text={loadError} />

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-wood" />
        </div>
      ) : items.length === 0 ? (
        <Empty text="Nenhuma loja parceira cadastrada ainda. Clique em 'Adicionar Nova Loja Parceira' para começar." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map(item => (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-2xl border border-rim bg-paper p-4 transition-opacity ${
                item.active ? '' : 'opacity-60'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream">
                  {item.logo_url ? (
                    <img
                      src={item.logo_url}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <Store className="h-6 w-6 text-muted" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <b className="font-serif text-espresso">{item.name}</b>
                  <p className="text-[10px] uppercase tracking-wide text-wood">{item.category}</p>
                </div>
                <Toggle
                  checked={item.active}
                  onChange={() => toggle(item)}
                  label={item.name}
                />
              </div>
              <p className="min-h-[2.5rem] text-sm text-muted">
                {item.description || 'Sem descrição'}
              </p>
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer sponsored"
                className="flex items-center gap-1 truncate text-xs text-wood hover:underline"
              >
                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                {item.url}
              </a>
              {item.slug && (
                <a
                  href={`/parceiro/${item.slug}`}
                  onClick={(e) => { e.preventDefault(); window.open(`/parceiro/${item.slug}`, '_blank'); }}
                  className="flex items-center gap-1 text-xs text-moss hover:underline"
                >
                  <ShieldCheck className="h-3 w-3 flex-shrink-0" />
                  Portal do parceiro → /parceiro/{item.slug}
                </a>
              )}
              <div className="flex justify-end gap-3 border-t border-rim pt-2">
                <button
                  aria-label="Editar parceiro"
                  onClick={() => {
                    setEditing(item);
                    setOpen(true);
                  }}
                  className="hover:text-espresso"
                >
                  <Pencil className="h-4 w-4 text-muted" />
                </button>
                <button
                  aria-label="Remover parceiro"
                  onClick={() => remove(item)}
                  className="hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4 text-muted" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <PartnerForm
          item={editing}
          categories={categories}
          onClose={() => setOpen(false)}
          onSaved={() => {
            setOpen(false);
            load();
          }}
        />
      )}
    </Shell>
  );
}

/* --------------------------- Export --------------------------- */

export default function AdminCommerce({ section }: { section: Section }) {
  if (section === 'coupons') return <Coupons />;
  if (section === 'gateways') return <Gateways />;
  return <Partners />;
}
