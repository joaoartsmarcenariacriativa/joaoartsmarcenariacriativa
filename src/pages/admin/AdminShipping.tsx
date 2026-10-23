import { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Loader2, Save, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { ShippingCarrier } from '@/types';

export default function AdminShipping() {
  const [carriers, setCarriers] = useState<ShippingCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ShippingCarrier>>({});

  const load = () => {
    setLoading(true);
    supabase
      .from('shipping_carriers')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) { setCarriers([]); }
        else setCarriers((data as ShippingCarrier[]) ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { load(); }, []);

  const handleToggle = async (carrier: ShippingCarrier) => {
    setSaving(carrier.id);
    const { error } = await supabase
      .from('shipping_carriers')
      .update({ enabled: !carrier.enabled })
      .eq('id', carrier.id);
    setSaving(null);
    if (error) { alert('Erro: ' + error.message); return; }
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta transportadora?')) return;
    const { error } = await supabase.from('shipping_carriers').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    load();
  };

  const handleMove = async (carrier: ShippingCarrier, dir: 'up' | 'down') => {
    const idx = carriers.findIndex(c => c.id === carrier.id);
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= carriers.length) return;
    const other = carriers[swapIdx];
    setSaving(carrier.id);
    await Promise.all([
      supabase.from('shipping_carriers').update({ sort_order: other.sort_order }).eq('id', carrier.id),
      supabase.from('shipping_carriers').update({ sort_order: carrier.sort_order }).eq('id', other.id),
    ]);
    setSaving(null);
    load();
  };

  const handleAdd = async () => {
    if (!editForm.name || !editForm.code) return;
    setSaving('new');
    const maxOrder = carriers.reduce((max, c) => Math.max(max, c.sort_order), 0);
    const { data, error } = await supabase
      .from('shipping_carriers')
      .upsert({
        name: editForm.name,
        code: editForm.code,
        provider: editForm.provider ?? 'manual',
        api_key: editForm.api_key ?? null,
        api_url: editForm.api_url ?? null,
        environment: editForm.environment ?? 'production',
        services: editForm.services ?? null,
        enabled: editForm.enabled ?? true,
        sort_order: maxOrder + 1,
      }, { onConflict: 'code' })
      .select()
      .single();
    setSaving(null);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    if (data) {
      setShowForm(false);
      setEditForm({});
      load();
    }
  };

  const handleUpdate = async (carrier: ShippingCarrier, field: keyof ShippingCarrier, value: string) => {
    setSaving(carrier.id);
    const { error } = await supabase
      .from('shipping_carriers')
      .update({ [field]: value })
      .eq('id', carrier.id);
    setSaving(null);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Transportadoras</h1>
          <p className="text-sm text-muted mt-1">Configure as opções de frete disponíveis para seus clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" />
          Adicionar Transportadora
        </button>
      </div>

      {showForm && (
        <div className="bg-paper rounded-2xl border border-wood/30 p-5 space-y-4">
          <h2 className="font-serif text-lg font-medium text-espresso">Nova Transportadora</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Nome (ex: JadLog Express)</label>
              <input
                type="text"
                value={editForm.name ?? ''}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Código único (ex: jadlog_express)</label>
              <input
                type="text"
                value={editForm.code ?? ''}
                onChange={e => setEditForm({ ...editForm, code: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Provedor da API</label>
              <select
                value={editForm.provider ?? 'manual'}
                onChange={e => setEditForm({ ...editForm, provider: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              >
                <option value="manual">Estimativa (sem API)</option>
                <option value="correios">Correios (API direta)</option>
                <option value="melhor_envio">Melhor Envio</option>
                <option value="superfrete">SuperFrete</option>
                <option value="frenet">Frenet</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">API Key / Token (se aplicável)</label>
              <input
                type="password"
                value={editForm.api_key ?? ''}
                onChange={e => setEditForm({ ...editForm, api_key: e.target.value })}
                placeholder="Deixe vazio para estimativa"
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Ambiente</label>
              <select
                value={editForm.environment ?? 'production'}
                onChange={e => setEditForm({ ...editForm, environment: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              >
                <option value="production">Produção</option>
                <option value="sandbox">Sandbox (testes)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Serviços (Melhor Envio / SuperFrete) — códigos separados por vírgula</label>
              <input
                type="text"
                value={editForm.services ?? '1,2,3,17'}
                onChange={e => setEditForm({ ...editForm, services: e.target.value })}
                placeholder="1,2,3,17"
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
              <p className="text-[11px] text-muted mt-1">
                1 = PAC • 2 = SEDEX • 3 = JadLog Package • 4 = JadLog Express • 17 = Azul Cargo Light • 18 = Azul Cargo Express
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">URL da API (opcional, custom)</label>
              <input
                type="text"
                value={editForm.api_url ?? ''}
                onChange={e => setEditForm({ ...editForm, api_url: e.target.value })}
                placeholder="https://..."
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
          </div>
          <p className="text-xs text-muted">
            Para provedores como Melhor Envio ou Frenet, informe o token da API. Para "Estimativa", o frete é calculado com base no peso, dimensões e distância, sem necessidade de API externa.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowForm(false); setEditForm({}); }}
              className="px-4 py-2 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={saving === 'new' || !editForm.name || !editForm.code}
              className="flex items-center gap-2 px-4 py-2 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50"
            >
              {saving === 'new' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-wood animate-spin" />
        </div>
      ) : carriers.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
          <Truck className="w-12 h-12 text-rim mx-auto mb-3" />
          <p className="text-muted">Nenhuma transportadora cadastrada. Clique em "Adicionar Transportadora" para começar.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {carriers.map(carrier => (
            <div
              key={carrier.id}
              className={`bg-paper rounded-xl border p-4 flex items-center gap-4 ${
                carrier.enabled ? 'border-rim' : 'border-rim opacity-60'
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => handleMove(carrier, 'up')}
                  className="p-0.5 hover:bg-cream rounded transition-colors"
                  disabled={carriers[0].id === carrier.id}
                >
                  <ChevronUp className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={() => handleMove(carrier, 'down')}
                  className="p-0.5 hover:bg-cream rounded transition-colors"
                  disabled={carriers[carriers.length - 1].id === carrier.id}
                >
                  <ChevronDown className="w-4 h-4 text-muted" />
                </button>
              </div>

              <div className="w-10 h-10 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-wood" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-sm font-medium text-espresso">{carrier.name}</p>
                  <span className={`text-[9px] uppercase tracking-[0.1em] px-2 py-0.5 rounded ${
                    carrier.enabled
                      ? 'bg-moss/10 text-moss border border-moss/30'
                      : 'bg-rim/30 text-muted border border-rim'
                  }`}>
                    {carrier.enabled ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Código: {carrier.code} • Provedor: {carrier.provider}
                  {carrier.provider !== 'manual' && ` • ${carrier.environment === 'sandbox' ? 'Sandbox' : 'Produção'}`}
                  {carrier.provider === 'melhor_envio' && carrier.services && ` • Serviços: ${carrier.services}`}
                  {carrier.api_key ? ' • API configurada' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <input
                  type="password"
                  defaultValue={carrier.api_key ?? ''}
                  onBlur={e => {
                    if (e.target.value !== (carrier.api_key ?? '')) {
                      handleUpdate(carrier, 'api_key', e.target.value);
                    }
                  }}
                  placeholder="Token da API"
                  className="w-32 px-2 py-1.5 text-xs bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                  title="Token da API (deixe vazio para estimativa)"
                />
                <button
                  onClick={() => handleToggle(carrier)}
                  disabled={saving === carrier.id}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    carrier.enabled
                      ? 'bg-rim/30 text-muted hover:bg-rim/50'
                      : 'bg-moss/10 text-moss hover:bg-moss/20'
                  }`}
                >
                  {carrier.enabled ? 'Desativar' : 'Ativar'}
                </button>
                <button
                  onClick={() => handleDelete(carrier.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-muted hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
