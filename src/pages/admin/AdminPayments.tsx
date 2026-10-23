import { useState, useEffect } from 'react';
import { CreditCard, Save, Loader2, Check, AlertCircle, ExternalLink, Link2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/types';

export default function AdminPayments() {
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setForm(data as StoreSettings);
        setLoaded(true);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      mp_enabled: form.mp_enabled ?? false,
      mp_environment: form.mp_environment ?? 'sandbox',
      mp_access_token: form.mp_access_token ?? null,
      mp_public_key: form.mp_public_key ?? null,
      mp_client_id: form.mp_client_id ?? null,
      mp_client_secret: form.mp_client_secret ?? null,
    };
    const { error } = await supabase.from('store_settings').upsert({ ...data, id: 1 });
    setSaving(false);
    if (error) {
      alert('Erro ao salvar: ' + error.message);
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[10px] uppercase tracking-[0.2em] text-muted";

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-wood animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-espresso">Pagamentos</h1>
        <p className="text-sm text-muted mt-1">Configure como você recebe pagamentos dos clientes</p>
      </div>

      {/* Status do gateway */}
      <div className={`rounded-2xl border p-5 space-y-4 ${form.mp_enabled ? 'bg-moss/5 border-moss/30' : 'bg-paper border-rim'}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wood/10 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-wood" />
            </div>
            <div>
              <p className="font-serif text-lg font-medium text-espresso">Mercado Pago</p>
              <p className="text-xs text-muted">Pix, cartão de crédito, boleto e transferência</p>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.mp_enabled ?? false}
              onChange={e => setForm({ ...form, mp_enabled: e.target.checked })}
              className="w-5 h-5 rounded border-rim text-wood focus:ring-wood"
            />
            <span className="text-sm font-medium text-espresso">{form.mp_enabled ? 'Ativado' : 'Desativado'}</span>
          </label>
        </div>

        {form.mp_enabled && (
          <div className="flex items-center gap-2 p-3 bg-moss/10 rounded-lg border border-moss/20">
            <Check className="w-4 h-4 text-moss flex-shrink-0" />
            <p className="text-xs text-moss">
              {form.mp_environment === 'production'
                ? 'Mercado Pago ativo em PRODUÇÃO. Os pagamentos dos clientes serão reais.'
                : 'Mercado Pago ativo em SANDBOX (testes). Use credenciais de teste do Mercado Pago.'}
            </p>
          </div>
        )}
      </div>

      {/* Como conectar */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-3">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Link2 className="w-5 h-5 text-wood" />
          Como conectar sua conta Mercado Pago
        </div>
        <ol className="space-y-2 text-sm text-muted">
          <li className="flex gap-2">
            <span className="font-semibold text-wood flex-shrink-0">1.</span>
            <span>
              Acesse{' '}
              <a href="https://www.mercadopago.com.br/developers/panel/app" target="_blank" rel="noopener noreferrer" className="text-wood font-medium hover:underline inline-flex items-center gap-0.5">
                o painel de desenvolvedores do Mercado Pago <ExternalLink className="w-3 h-3" />
              </a>{' '}
              e crie uma aplicação (ou use uma existente).
            </span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-wood flex-shrink-0">2.</span>
            <span>Na aba "Credenciais", copie o <strong>Access Token</strong> e a <strong>Public Key</strong>.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-wood flex-shrink-0">3.</span>
            <span>Para testar primeiro, use as credenciais de sandbox. Para receber pagamentos reais, troque para as credenciais de produção e mude o ambiente abaixo.</span>
          </li>
          <li className="flex gap-2">
            <span className="font-semibold text-wood flex-shrink-0">4.</span>
            <span>Cole as credenciais abaixo, ative o gateway e salve. Pronto — seus clientes já podem pagar via Mercado Pago.</span>
          </li>
        </ol>
      </div>

      {/* Configurações */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <CreditCard className="w-5 h-5 text-wood" />
          Credenciais do Mercado Pago
        </div>

        <div>
          <label className={labelClass}>Ambiente</label>
          <select
            value={form.mp_environment ?? 'sandbox'}
            onChange={e => setForm({ ...form, mp_environment: e.target.value })}
            className={inputClass}
          >
            <option value="sandbox">Sandbox (testes — pagamentos simulados)</option>
            <option value="production">Produção (pagamentos reais)</option>
          </select>
          <p className="text-[11px] text-muted mt-1">
            Use sandbox para testar sem cobrar de verdade. Mude para produção quando estiver pronto para vender.
          </p>
        </div>

        <div>
          <label className={labelClass}>Access Token</label>
          <input
            type="password"
            value={form.mp_access_token ?? ''}
            onChange={e => setForm({ ...form, mp_access_token: e.target.value })}
            placeholder="APP_USR-xxxx... ou TEST-xxxx..."
            className={inputClass}
          />
          <p className="text-[11px] text-muted mt-1">Encontrado em: Credenciais &gt; Access Token</p>
        </div>

        <div>
          <label className={labelClass}>Public Key</label>
          <input
            type="text"
            value={form.mp_public_key ?? ''}
            onChange={e => setForm({ ...form, mp_public_key: e.target.value })}
            placeholder="APP_USR-xxxx... ou TEST-xxxx..."
            className={inputClass}
          />
          <p className="text-[11px] text-muted mt-1">Encontrado em: Credenciais &gt; Public Key</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Client ID (opcional)</label>
            <input
              type="text"
              value={form.mp_client_id ?? ''}
              onChange={e => setForm({ ...form, mp_client_id: e.target.value })}
              placeholder="123456789..."
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Client Secret (opcional)</label>
            <input
              type="password"
              value={form.mp_client_secret ?? ''}
              onChange={e => setForm({ ...form, mp_client_secret: e.target.value })}
              placeholder="XXXXX..."
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-start gap-2 p-3 bg-cream rounded-xl border border-rim">
          <Shield className="w-4 h-4 text-wood flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted leading-relaxed">
            Suas credenciais ficam armazenadas com segurança no banco de dados da loja e nunca são expostas no navegador dos clientes. O token é usado apenas no servidor para processar pagamentos.
          </p>
        </div>
      </div>

      {/* Métodos aceitos */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-3">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <CreditCard className="w-5 h-5 text-wood" />
          Métodos de Pagamento Aceitos
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-rim">
            <div className="w-9 h-9 bg-moss/15 rounded-lg flex items-center justify-center">
              <span className="text-moss font-bold text-sm">Pix</span>
            </div>
            <div>
              <p className="text-sm font-medium text-espresso">Pix</p>
              <p className="text-[11px] text-muted">Aprovação instantânea</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-rim">
            <div className="w-9 h-9 bg-wood/15 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-wood" />
            </div>
            <div>
              <p className="text-sm font-medium text-espresso">Cartão de Crédito</p>
              <p className="text-[11px] text-muted">Até {form.max_installments ?? 12}x sem juros</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-rim">
            <div className="w-9 h-9 bg-espresso/10 rounded-lg flex items-center justify-center">
              <span className="text-espresso font-bold text-[10px]">Boleto</span>
            </div>
            <div>
              <p className="text-sm font-medium text-espresso">Boleto Bancário</p>
              <p className="text-[11px] text-muted">Compensação em 1-3 dias</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-cream rounded-xl border border-rim">
            <div className="w-9 h-9 bg-rim/30 rounded-lg flex items-center justify-center">
              <span className="text-muted font-bold text-[10px]">TED</span>
            </div>
            <div>
              <p className="text-sm font-medium text-espresso">Transferência</p>
              <p className="text-[11px] text-muted">Pix ou TED</p>
            </div>
          </div>
        </div>
        {!form.mp_enabled && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              O gateway está desativado. Ative o Mercado Pogo acima e preencha as credenciais para que os clientes possam pagar na finalização da compra.
            </p>
          </div>
        )}
      </div>

      {/* Save */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-wood text-espresso font-semibold rounded-full hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : saved ? <Check className="w-5 h-5" /> : <Save className="w-5 h-5" />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
