import { useState, useEffect } from 'react';
import {
  ArrowLeft, Send, Mail, MessageCircle, Smartphone, Users, Check, X,
  Sparkles, BookOpen, Eye, Clock, Megaphone, AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Ebook, EbookLaunchSubscriber, EbookLaunchCampaign } from '@/types';
import { formatBRL } from '@/lib/format';

interface AdminLaunchBroadcastProps {
  ebook: Ebook;
  onBack: () => void;
}

export default function AdminLaunchBroadcast({ ebook, onBack }: AdminLaunchBroadcastProps) {
  const { user } = useAuth();
  const [subscribers, setSubscribers] = useState<EbookLaunchSubscriber[]>([]);
  const [campaigns, setCampaigns] = useState<EbookLaunchCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentResult, setSentResult] = useState<{ total: number; sent: number; failed?: number; warning?: string } | null>(null);

  const [compose, setCompose] = useState({
    subject: `Novo lançamento: ${ebook.title}`,
    message: `Olá! Acabamos de lançar "${ebook.title}"!\n\n${ebook.description ?? ''}\n\nAcesse agora: ${ebook.hotmart_checkout_url}\n\n— Equipe João Art's`,
    channel: 'email' as 'email' | 'whatsapp' | 'sms',
  });

  const loadData = async () => {
    setLoading(true);
    const [subRes, campRes] = await Promise.all([
      supabase.from('ebook_launch_subscribers').select('*').order('created_at', { ascending: false }),
      supabase.from('ebook_launch_campaigns').select('*').eq('ebook_id', ebook.id).order('created_at', { ascending: false }),
    ]);
    setSubscribers((subRes.data as EbookLaunchSubscriber[]) ?? []);
    setCampaigns((campRes.data as EbookLaunchCampaign[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [ebook.id]);

  const handleSend = async () => {
    if (!compose.subject.trim() || !compose.message.trim()) {
      alert('Preencha o assunto e a mensagem.');
      return;
    }
    if (subscribers.length === 0) {
      alert('Não há assinantes para enviar. Os clientes se inscrevem na vitrine de e-books ou ao criar conta no site.');
      return;
    }
    if (!confirm(`Confirmar o envio desta campanha para ${subscribers.length} assinante(s)?`)) return;

    setSending(true);
    setSentResult(null);

    const { data: campaignData, error: campError } = await supabase
      .from('ebook_launch_campaigns')
      .insert({
        ebook_id: ebook.id,
        subject: compose.subject,
        message: compose.message,
        channel: compose.channel,
        status: 'scheduled',
        sent_count: 0,
        created_by: user?.email ?? 'admin',
      })
      .select()
      .single();

    if (campError) {
      alert('Erro ao criar campanha: ' + campError.message);
      setSending(false);
      return;
    }

    const campaign = campaignData as EbookLaunchCampaign;

    // Call edge function to actually send emails
    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-launch-broadcast`;
    const { data: { session } } = await supabase.auth.getSession();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token ?? ''}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ campaignId: campaign.id }),
    });

    const result = await response.json() as {
      sent?: number;
      failed?: number;
      total?: number;
      queued?: number;
      warning?: string;
      error?: string;
    };

    if (!response.ok) {
      alert('Erro no envio: ' + (result.error ?? `HTTP ${response.status}`));
      setSending(false);
      return;
    }

    setSentResult({
      total: result.total ?? subscribers.length,
      sent: result.sent ?? 0,
      warning: result.warning,
      failed: result.failed ?? 0,
    });
    setSending(false);
    setShowCompose(false);
    loadData();
  };

  const removeSubscriber = async (id: string) => {
    if (!confirm('Remover este assinante da lista de lançamentos?')) return;
    await supabase.from('ebook_launch_subscribers').delete().eq('id', id);
    loadData();
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[10px] uppercase tracking-[0.1em] text-muted";

  const channelIcon = (ch: string) => {
    if (ch === 'whatsapp') return MessageCircle;
    if (ch === 'sms') return Smartphone;
    return Mail;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-wood mb-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para E-books
          </button>
          <h1 className="font-serif text-xl font-semibold text-espresso flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-wood" /> Anunciar Lançamento
          </h1>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
            <img src={ebook.cover_url} alt="" className="w-7 h-9 rounded object-cover" />
            {ebook.title}
          </p>
        </div>
        <button
          onClick={() => setShowCompose(true)}
          disabled={subscribers.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Send className="w-4 h-4" /> Enviar Aviso de Lançamento
        </button>
      </div>

      {/* Success banner */}
      {sentResult && (
        <div className="bg-moss/10 border border-moss/30 rounded-xl p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-moss flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-moss">
              {sentResult.sent > 0
                ? `${sentResult.sent} e-mail(s) enviados com sucesso!`
                : 'Campanha registrada.'}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {sentResult.sent > 0
                ? `${sentResult.sent} de ${sentResult.total} mensagens entregues${sentResult.failed ? `, ${sentResult.failed} falharam` : ''}.`
                : `${sentResult.total} mensagens na fila.`}
            </p>
            {sentResult.warning && (
              <p className="text-xs text-amber-700 mt-1 bg-amber-50 border border-amber-200 rounded-lg p-2">
                {sentResult.warning}
              </p>
            )}
          </div>
          <button onClick={() => setSentResult(null)} className="ml-auto p-1 hover:bg-moss/10 rounded">
            <X className="w-4 h-4 text-muted" />
          </button>
        </div>
      )}

      {subscribers.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-800">Nenhum assinante ainda</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Os clientes se inscrevem para receber avisos de lançamento na vitrine de e-books ou ao criar conta no site.
              Aguarde novos cadastros para enviar sua primeira campanha.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper rounded-xl border border-rim p-4 text-center">
          <Users className="w-5 h-5 text-wood mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{subscribers.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Assinantes</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-4 text-center">
          <Megaphone className="w-5 h-5 text-moss mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{campaigns.length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Campanhas</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-4 text-center">
          <Send className="w-5 h-5 text-wood mx-auto mb-1" />
          <p className="text-xl font-bold text-espresso">{campaigns.filter(c => c.status === 'sent').length}</p>
          <p className="text-[10px] uppercase tracking-wide text-muted">Enviadas</p>
        </div>
      </div>

      {/* Campaigns history */}
      <div className="bg-paper rounded-xl border border-rim overflow-hidden">
        <div className="px-4 py-3 border-b border-rim">
          <h3 className="font-serif text-sm font-medium text-espresso flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted" /> Histórico de Campanhas
          </h3>
        </div>
        {campaigns.length === 0 ? (
          <div className="p-6 text-center">
            <Megaphone className="w-10 h-10 text-rim mx-auto mb-2" />
            <p className="text-xs text-muted">Nenhuma campanha enviada ainda para este e-book.</p>
          </div>
        ) : (
          <div className="divide-y divide-rim">
            {campaigns.map(camp => {
              const ChIcon = channelIcon(camp.channel);
              return (
                <div key={camp.id} className="flex items-center gap-3 px-4 py-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    camp.channel === 'email' ? 'bg-blue-100 text-blue-700' :
                    camp.channel === 'whatsapp' ? 'bg-green-100 text-green-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    <ChIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso line-clamp-1">{camp.subject}</p>
                    <p className="text-[11px] text-muted">
                      {camp.sent_count} envios • {camp.sent_at ? new Date(camp.sent_at).toLocaleString('pt-BR') : 'Não enviada'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${
                    camp.status === 'sent' ? 'bg-moss/15 text-moss' : 'bg-rim/30 text-muted'
                  }`}>
                    {camp.status === 'sent' ? 'Enviada' : camp.status === 'scheduled' ? 'Agendada' : 'Rascunho'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Subscribers list */}
      <div className="bg-paper rounded-xl border border-rim overflow-hidden">
        <div className="px-4 py-3 border-b border-rim flex items-center justify-between">
          <h3 className="font-serif text-sm font-medium text-espresso flex items-center gap-2">
            <Users className="w-4 h-4 text-muted" /> Assinantes de Lançamentos
          </h3>
          <span className="text-[10px] text-muted">{subscribers.length} cadastrados</span>
        </div>
        {loading ? (
          <div className="p-6 text-center text-muted text-sm">Carregando...</div>
        ) : subscribers.length === 0 ? (
          <div className="p-6 text-center">
            <Users className="w-10 h-10 text-rim mx-auto mb-2" />
            <p className="text-xs text-muted">Nenhum assinante ainda.</p>
          </div>
        ) : (
          <div className="divide-y divide-rim max-h-80 overflow-y-auto">
            {subscribers.map(sub => (
              <div key={sub.id} className="flex items-center gap-3 px-4 py-2.5 group">
                <div className="w-8 h-8 bg-wood/10 rounded-full flex items-center justify-center text-wood text-xs font-semibold flex-shrink-0">
                  {sub.email.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-espresso line-clamp-1">{sub.name ?? sub.email}</p>
                  <p className="text-[11px] text-muted line-clamp-1">{sub.email}</p>
                </div>
                <span className="text-[10px] text-muted bg-cream px-2 py-0.5 rounded-full flex-shrink-0">
                  {sub.source === 'site_signup' ? 'Cadastro' : sub.source === 'ebook_vitrine' ? 'Vitrine' : 'Manual'}
                </span>
                <button
                  onClick={() => removeSubscriber(sub.id)}
                  className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remover assinante"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted leading-relaxed">
        Em conformidade com a LGPD (Lei nº 13.709/2018), todos os assinantes consentiram em receber comunicações.
        O consentimento é registrado no momento da inscrição. O disparo real de e-mails usa a Resend
        (gateway configurado em Configurações da Loja {'>'} E-mail de Disparo). WhatsApp e SMS requerem gateway próprio.
      </p>

      {/* Compose modal */}
      {showCompose && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompose(false)}>
          <div className="bg-paper rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper z-10">
              <h2 className="font-serif text-lg font-bold text-espresso flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-wood" /> Comprar Aviso de Lançamento
              </h2>
              <button onClick={() => setShowCompose(false)} className="p-1.5 hover:bg-cream rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="p-5 space-y-4">
              {/* Preview card */}
              <div className="bg-cream rounded-xl p-3 flex items-center gap-3 border border-rim">
                <img src={ebook.cover_url} alt="" className="w-12 h-16 rounded object-cover flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-espresso line-clamp-1">{ebook.title}</p>
                  <p className="text-[11px] text-muted">{ebook.author ?? '—'}</p>
                  <p className="text-sm font-bold text-wood mt-0.5">{ebook.price > 0 ? formatBRL(ebook.price) : 'Grátis'}</p>
                </div>
              </div>

              <div>
                <label className={labelClass}>Canal de Envio</label>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {([
                    { value: 'email', label: 'E-mail', icon: Mail },
                    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
                    { value: 'sms', label: 'SMS', icon: Smartphone },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setCompose({ ...compose, channel: opt.value })}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        compose.channel === opt.value ? 'bg-wood text-cream border-wood' : 'bg-cream text-muted border-rim hover:border-wood/50'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>Assunto / Título</label>
                <input type="text" value={compose.subject} onChange={e => setCompose({ ...compose, subject: e.target.value })} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>Mensagem</label>
                <textarea value={compose.message} onChange={e => setCompose({ ...compose, message: e.target.value })} rows={7} className={inputClass} />
                <p className="text-[10px] text-muted mt-1">
                  Dica: Use variáveis como o link de checkout ({ebook.hotmart_checkout_url}) para direcionar os clientes.
                </p>
              </div>

              <div className="bg-wood/5 border border-wood/20 rounded-lg p-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-wood flex-shrink-0" />
                <p className="text-xs text-muted">
                  Esta campanha será enviada para <span className="font-bold text-espresso">{subscribers.length} assinante(s)</span> que consentiram em receber comunicações (LGPD).
                </p>
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-rim sticky bottom-0 bg-paper">
              <button onClick={() => setShowCompose(false)} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleSend}
                disabled={sending || subscribers.length === 0}
                className="flex-1 py-2.5 bg-wood text-cream text-sm font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>Enviando... ({subscribers.length} destinatários)</>
                ) : (
                  <><Send className="w-4 h-4" /> Enviar para {subscribers.length} Assinantes</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
