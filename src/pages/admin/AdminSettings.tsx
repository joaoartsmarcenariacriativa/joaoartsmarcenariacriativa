import { useState, useEffect } from 'react';
import { Save, Loader2, Store, Palette, Phone, Truck, Mail, ExternalLink, Check, AlertCircle, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { StoreSettings } from '@/types';
import ImageUploader from '@/components/ImageUploader';

export default function AdminSettings() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [form, setForm] = useState<Partial<StoreSettings>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoImages, setLogoImages] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from('store_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        const s = data as StoreSettings | null;
        setSettings(s);
        setForm(s ?? {});
        if (s?.logo_url) setLogoImages([s.logo_url]);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      store_name: form.store_name ?? null,
      store_short_name: form.store_short_name ?? null,
      store_tagline: form.store_tagline ?? null,
      logo_url: logoImages[0] ?? null,
      primary_color: form.primary_color ?? null,
      announcement_text: form.announcement_text ?? null,
      announcement_enabled: form.announcement_enabled ?? true,
      whatsapp_number: form.whatsapp_number ?? null,
      whatsapp_message: form.whatsapp_message ?? null,
      email_contact: form.email_contact ?? null,
      instagram_url: form.instagram_url ?? null,
      facebook_url: form.facebook_url ?? null,
      free_shipping_enabled: form.free_shipping_enabled ?? false,
      free_shipping_threshold: form.free_shipping_threshold ?? 200,
      pix_discount_percent: form.pix_discount_percent ?? 5,
      max_installments: form.max_installments ?? 12,
      cnpj: form.cnpj ?? null,
      footer_about: form.footer_about ?? null,
      origin_cep: form.origin_cep ?? null,
      email_gateway_enabled: form.email_gateway_enabled ?? false,
      resend_api_key: form.resend_api_key ?? null,
      email_from_name: form.email_from_name ?? null,
      email_from_address: form.email_from_address ?? null,
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

  if (!settings && !form.store_name) {
    return <div className="p-8 text-center text-muted">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-espresso">Configurações da Loja</h1>
        <p className="text-sm text-muted mt-1">Identidade visual, contato, frete e pagamento</p>
      </div>

      {/* Identity */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Store className="w-5 h-5 text-wood" />
          Identidade da Loja
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Logo da Loja</label>
          <p className="text-[11px] text-muted mb-2">Se vazio, sera usado o icone de martelo padrao</p>
          <ImageUploader
            images={logoImages}
            onChange={setLogoImages}
            label=""
            maxImages={1}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Nome Completo da Loja</label>
            <input
              type="text"
              value={form.store_name ?? ''}
              onChange={e => setForm({ ...form, store_name: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Nome Curto (cabeçalho)</label>
            <input
              type="text"
              value={form.store_short_name ?? ''}
              onChange={e => setForm({ ...form, store_short_name: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Slogan / Tagline</label>
            <input
              type="text"
              value={form.store_tagline ?? ''}
              onChange={e => setForm({ ...form, store_tagline: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">CNPJ</label>
            <input
              type="text"
              value={form.cnpj ?? ''}
              onChange={e => setForm({ ...form, cnpj: e.target.value })}
              placeholder="00.000.000/0001-00"
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Texto do Rodapé (sobre a loja)</label>
          <textarea
            value={form.footer_about ?? ''}
            onChange={e => setForm({ ...form, footer_about: e.target.value })}
            rows={3}
            className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Barra de Anúncio (topo do site)</label>
          <input
            type="text"
            value={form.announcement_text ?? ''}
            onChange={e => setForm({ ...form, announcement_text: e.target.value })}
            className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
          />
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.announcement_enabled ?? true}
              onChange={e => setForm({ ...form, announcement_enabled: e.target.checked })}
              className="w-4 h-4 rounded border-rim text-wood focus:ring-wood"
            />
            <span className="text-sm text-espresso">Exibir barra de anúncio no topo do site</span>
          </label>
        </div>
      </div>

      {/* Colors */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Palette className="w-5 h-5 text-wood" />
          Cor Principal
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={form.primary_color ?? '#b45309'}
            onChange={e => setForm({ ...form, primary_color: e.target.value })}
            className="w-12 h-12 rounded-lg border border-rim cursor-pointer"
          />
          <div>
            <p className="text-sm text-espresso font-medium">Cor de destaque da loja</p>
            <p className="text-xs text-muted">Usada em botões, links e elementos destacados</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Phone className="w-5 h-5 text-wood" />
          Contato e Redes Sociais
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">WhatsApp (com DDI)</label>
            <input
              type="text"
              value={form.whatsapp_number ?? ''}
              onChange={e => setForm({ ...form, whatsapp_number: e.target.value })}
              placeholder="5511999999999"
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Mensagem do WhatsApp</label>
            <input
              type="text"
              value={form.whatsapp_message ?? ''}
              onChange={e => setForm({ ...form, whatsapp_message: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">E-mail de Contato</label>
            <input
              type="email"
              value={form.email_contact ?? ''}
              onChange={e => setForm({ ...form, email_contact: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Instagram (URL)</label>
            <input
              type="text"
              value={form.instagram_url ?? ''}
              onChange={e => setForm({ ...form, instagram_url: e.target.value })}
              placeholder="https://instagram.com/..."
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Facebook (URL)</label>
            <input
              type="text"
              value={form.facebook_url ?? ''}
              onChange={e => setForm({ ...form, facebook_url: e.target.value })}
              placeholder="https://facebook.com/..."
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Shipping & Payment */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Truck className="w-5 h-5 text-wood" />
          Frete e Pagamento
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">CEP de Origem (Loja)</label>
            <input
              type="text"
              value={form.origin_cep ?? ''}
              onChange={e => setForm({ ...form, origin_cep: e.target.value.replace(/\D/g, '').slice(0, 8) })}
              placeholder="CEP do estoque (ex: 01310100)"
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
            <p className="text-[11px] text-muted mt-1">Usado para calcular o frete nas transportadoras</p>
          </div>
          <div className="sm:col-span-3">
            <label className="flex items-center justify-between gap-3 p-3.5 bg-cream rounded-xl border border-rim cursor-pointer hover:border-wood/40 transition-colors">
              <div>
                <p className="text-sm font-medium text-espresso">Oferecer frete grátis acima de um valor</p>
                <p className="text-[11px] text-muted mt-0.5">Quando ativado, compras que atingirem o valor abaixo não pagam frete. Desligue se não quiser oferecer frete grátis no momento.</p>
              </div>
              <input
                type="checkbox"
                checked={form.free_shipping_enabled ?? false}
                onChange={e => setForm({ ...form, free_shipping_enabled: e.target.checked })}
                className="w-5 h-5 rounded border-rim text-wood focus:ring-wood flex-shrink-0"
              />
            </label>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Frete Grátis a partir de (R$)</label>
            <input
              type="number"
              step="0.01"
              value={form.free_shipping_threshold ?? ''}
              onChange={e => setForm({ ...form, free_shipping_threshold: parseFloat(e.target.value) || 0 })}
              disabled={!form.free_shipping_enabled}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            />
            {!form.free_shipping_enabled && (
              <p className="text-[11px] text-amber-600 mt-1">Frete grátis desativado — o valor acima é ignorado no checkout.</p>
            )}
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Desconto Pix (%)</label>
            <input
              type="number"
              step="0.01"
              value={form.pix_discount_percent ?? ''}
              onChange={e => setForm({ ...form, pix_discount_percent: parseFloat(e.target.value) || 0 })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Máx. Parcelas sem Juros</label>
            <input
              type="number"
              value={form.max_installments ?? ''}
              onChange={e => setForm({ ...form, max_installments: parseInt(e.target.value) || 12 })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Email gateway */}
      <div className="bg-paper rounded-2xl border border-rim p-5 space-y-4">
        <div className="flex items-center gap-2 text-espresso font-serif font-semibold">
          <Mail className="w-5 h-5 text-wood" />
          E-mail de Disparo (Campanhas e Lançamentos)
        </div>

        <div className="flex items-center justify-between gap-3 p-3.5 bg-cream rounded-xl border border-rim">
          <div>
            <p className="text-sm font-medium text-espresso">Ativar disparo de e-mails</p>
            <p className="text-[11px] text-muted mt-0.5">Quando ativado, as campanhas de lançamento enviam e-mails reais para os assinantes.</p>
          </div>
          <input
            type="checkbox"
            checked={form.email_gateway_enabled ?? false}
            onChange={e => setForm({ ...form, email_gateway_enabled: e.target.checked })}
            className="w-5 h-5 rounded border-rim text-wood focus:ring-wood flex-shrink-0"
          />
        </div>

        {form.email_gateway_enabled && (
          <div className="space-y-3">
            <div className="flex items-start gap-2 p-3 bg-wood/5 rounded-lg border border-wood/20">
              <Shield className="w-4 h-4 text-wood flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted leading-relaxed">
                A chave de API fica armazenada com segurança no banco de dados e é usada apenas no servidor (edge function). Nunca é exposta no navegador dos clientes.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <p className="text-xs text-blue-700 leading-relaxed">
                Usamos a <strong>Resend</strong> como gateway de e-mail — gratuito até 3.000 e-mails/mês.
                Crie uma conta em{' '}
                <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-700 font-medium underline inline-flex items-center gap-0.5">
                  resend.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                e gere uma chave de API. Verifique seu domínio de remetente quando tiver um.
              </p>
            </div>

            <div className="flex items-start gap-2 p-3 bg-moss/5 rounded-lg border border-moss/20">
              <Check className="w-4 h-4 text-moss flex-shrink-0 mt-0.5" />
              <p className="text-xs text-moss leading-relaxed">
                <strong>Sem domínio ainda? Sem problema.</strong> Para testar agora mesmo, use o remetente de teste{' '}
                <code className="bg-moss/10 px-1 py-0.5 rounded text-[11px]">onboarding@resend.dev</code>{' '}
                no campo de e-mail remetente. Ele só entrega no e-mail da sua conta Resend, mas já mostra o sistema funcionando.
                Quando verificar seu domínio no futuro, é só trocar o remetente aqui e salvar.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Nome do Remetente</label>
                <input
                  type="text"
                  value={form.email_from_name ?? ''}
                  onChange={e => setForm({ ...form, email_from_name: e.target.value })}
                  placeholder="João Art's"
                  className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted">E-mail Remetente (verificado)</label>
                <input
                  type="email"
                  value={form.email_from_address ?? ''}
                  onChange={e => setForm({ ...form, email_from_address: e.target.value })}
                  placeholder="contato@seu-dominio.com.br"
                  className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
                <p className="text-[11px] text-muted mt-1">Domínio verificado no painel da Resend</p>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Chave de API da Resend</label>
              <input
                type="password"
                value={form.resend_api_key ?? ''}
                onChange={e => setForm({ ...form, resend_api_key: e.target.value })}
                placeholder="re_xxxxxxxxxxxxx..."
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
              <p className="text-[11px] text-muted mt-1">{'Encontrada em: Resend > API Keys > Create API Key'}</p>
            </div>
          </div>
        )}

        {!form.email_gateway_enabled && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              O gateway de e-mail está desativado. As campanhas de lançamento serão registradas mas não enviarão e-mails reais. Ative e configure a Resend para disparar.
            </p>
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-wood text-espresso font-semibold rounded-full hover:scale-105 transition-transform shadow-lg disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saved ? 'Salvo com sucesso!' : 'Salvar Configurações'}
        </button>
      </div>
    </div>
  );
}
