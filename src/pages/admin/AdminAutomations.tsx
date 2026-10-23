import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Smartphone, Bell, ShoppingCart, Gift, UserPlus, Settings2, X, Play, Pause, FileText, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { MarketingAutomation, AutomationChannel, AutomationTrigger, AutomationStatus } from '@/types';

const CHANNEL_ICONS: Record<AutomationChannel, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Smartphone,
};

const CHANNEL_COLORS: Record<AutomationChannel, string> = {
  email: 'bg-blue-100 text-blue-700 border-blue-200',
  whatsapp: 'bg-green-100 text-green-700 border-green-200',
  sms: 'bg-purple-100 text-purple-700 border-purple-200',
};

const TRIGGER_ICONS: Record<AutomationTrigger, typeof Bell> = {
  order_status: Bell,
  new_offer: Gift,
  cart_recovery: ShoppingCart,
  welcome: UserPlus,
  custom: Zap,
};

const TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  order_status: 'Alteração de Status do Pedido',
  new_offer: 'Nova Oferta / Campanha',
  cart_recovery: 'Recuperação de Carrinho Abandonado',
  welcome: 'Boas-vindas / Cadastro',
  custom: 'Personalizado',
};

const STATUS_LABELS: Record<AutomationStatus, string> = {
  active: 'Ativa',
  paused: 'Pausada',
  draft: 'Rascunho',
};

export default function AdminAutomations() {
  const [automations, setAutomations] = useState<MarketingAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFlow, setShowFlow] = useState<MarketingAutomation | null>(null);
  const [recentRuns, setRecentRuns] = useState<Array<{
    id: string;
    trigger_type: string;
    recipient_email: string | null;
    customer_name: string | null;
    order_number: string | null;
    status: string;
    created_at: string;
  }>>([]);

  useEffect(() => {
    loadAutomations();
  }, []);

  const loadAutomations = () => {
    setLoading(true);
    supabase
      .from('marketing_automations')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setAutomations([]); }
        else setAutomations(data as MarketingAutomation[] ?? []);
        setLoading(false);
      });
  };

  const loadRecentRuns = () => {
    supabase
      .from('automation_runs')
      .select('id, trigger_type, recipient_email, customer_name, order_number, status, created_at')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setRecentRuns((data as Array<{
          id: string;
          trigger_type: string;
          recipient_email: string | null;
          customer_name: string | null;
          order_number: string | null;
          status: string;
          created_at: string;
        }>) ?? []);
      });
  };

  const toggleStatus = async (auto: MarketingAutomation) => {
    const newStatus: AutomationStatus = auto.status === 'active' ? 'paused' : 'active';
    const { error } = await supabase
      .from('marketing_automations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', auto.id);
    if (error) return;
    loadAutomations();
  };

  const stats = {
    total: automations.length,
    active: automations.filter(a => a.status === 'active').length,
    sent: automations.reduce((sum, a) => sum + a.stats_sent, 0),
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-espresso">Automações de Mensagens</h1>
        <p className="text-sm text-muted mt-1">Réguas de relacionamento por E-mail, SMS e WhatsApp</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-paper rounded-xl border border-rim p-4">
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Total de Fluxos</p>
          <p className="font-serif text-2xl font-bold text-espresso mt-1">{stats.total}</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-4">
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Fluxos Ativos</p>
          <p className="font-serif text-2xl font-bold text-moss mt-1">{stats.active}</p>
        </div>
        <div className="bg-paper rounded-xl border border-rim p-4">
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Mensagens Enviadas</p>
          <p className="font-serif text-2xl font-bold text-wood mt-1">{stats.sent}</p>
        </div>
      </div>

      {/* Channels overview */}
      <div className="bg-paper rounded-xl border border-rim p-4">
        <h3 className="text-[11px] uppercase tracking-[0.15em] text-muted mb-3">Canais Integrados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {([
            { channel: 'email' as const, label: 'E-mail', desc: 'SMTP / API de e-mail', icon: Mail },
            { channel: 'whatsapp' as const, label: 'WhatsApp API', desc: 'WhatsApp Business API', icon: MessageCircle },
            { channel: 'sms' as const, label: 'SMS', desc: 'Gateway de SMS', icon: Smartphone },
          ]).map(ch => {
            const Icon = ch.icon;
            const count = automations.filter(a => a.channel === ch.channel).length;
            return (
              <div key={ch.channel} className={`rounded-lg border p-3 ${CHANNEL_COLORS[ch.channel]}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{ch.label}</span>
                </div>
                <p className="text-[11px] opacity-70">{ch.desc}</p>
                <p className="text-xs font-bold mt-1">{count} automação(ões)</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Automations list */}
      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {automations.map(auto => {
            const ChannelIcon = CHANNEL_ICONS[auto.channel];
            const TriggerIcon = TRIGGER_ICONS[auto.trigger_type];
            return (
              <div key={auto.id} className="bg-paper rounded-xl border border-rim overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${CHANNEL_COLORS[auto.channel]}`}>
                    <ChannelIcon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-serif text-sm font-medium text-espresso">{auto.name}</p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        auto.status === 'active' ? 'bg-moss/15 text-moss' : auto.status === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-rim/50 text-muted'
                      }`}>
                        {STATUS_LABELS[auto.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TriggerIcon className="w-3.5 h-3.5 text-muted" />
                      <span className="text-[11px] text-muted">{TRIGGER_LABELS[auto.trigger_type]}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-bold text-espresso">{auto.stats_sent}</p>
                      <p className="text-[10px] text-muted">envios</p>
                    </div>
                    <button
                      onClick={() => toggleStatus(auto)}
                      className={`p-2 rounded-lg transition-colors ${
                        auto.status === 'active'
                          ? 'text-moss hover:bg-moss/10'
                          : 'text-muted hover:bg-cream'
                      }`}
                      title={auto.status === 'active' ? 'Pausar' : 'Ativar'}
                    >
                      {auto.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => { setShowFlow(auto); loadRecentRuns(); }}
                      className="p-2 text-muted hover:text-wood hover:bg-cream rounded-lg transition-colors"
                      title="Ver fluxo"
                    >
                      <Settings2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {/* Flow visualization bar */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted bg-cream rounded-lg p-2 overflow-x-auto">
                    <span className="font-medium text-espresso flex items-center gap-1 flex-shrink-0">
                      <Zap className="w-3 h-3 text-wood" /> Gatilho:
                    </span>
                    <span className="flex-shrink-0">{TRIGGER_LABELS[auto.trigger_type]}</span>
                    <span className="text-rim">→</span>
                    <span className="font-medium text-espresso flex items-center gap-1 flex-shrink-0">
                      <ChannelIcon className="w-3 h-3" /> Canal:
                    </span>
                    <span className="flex-shrink-0">{auto.channel === 'email' ? 'E-mail' : auto.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}</span>
                    <span className="text-rim">→</span>
                    <span className="flex-shrink-0 text-muted truncate">{auto.message_template?.slice(0, 50) ?? 'Sem template'}...</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Flow detail modal */}
      {showFlow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowFlow(null)}>
          <div
            className="bg-paper rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper">
              <h2 className="font-serif text-lg font-bold text-espresso">Fluxo da Automação</h2>
              <button onClick={() => setShowFlow(null)} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center">
                <p className="font-serif text-xl font-medium text-espresso">{showFlow.name}</p>
                <p className="text-sm text-muted mt-1">{TRIGGER_LABELS[showFlow.trigger_type]}</p>
              </div>

              {/* Flow steps visualization */}
              <div className="space-y-3">
                {/* Step 1: Trigger */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-wood/10 rounded-full flex items-center justify-center flex-shrink-0">
                    {(() => {
                      const Icon = TRIGGER_ICONS[showFlow.trigger_type];
                      return <Icon className="w-5 h-5 text-wood" />;
                    })()}
                  </div>
                  <div className="flex-1 bg-cream rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Etapa 1: Gatilho</p>
                    <p className="text-sm font-medium text-espresso mt-0.5">{TRIGGER_LABELS[showFlow.trigger_type]}</p>
                    {showFlow.trigger_type === 'order_status' && (
                      <p className="text-[11px] text-muted mt-1">
                        Status monitorados: {(showFlow.trigger_config as Record<string, unknown>).statuses
                          ? ((showFlow.trigger_config as Record<string, string[]>).statuses ?? []).join(', ')
                          : 'todos'}
                      </p>
                    )}
                    {showFlow.trigger_type === 'cart_recovery' && (
                      <p className="text-[11px] text-muted mt-1">
                        Atraso: {Number((showFlow.trigger_config as Record<string, unknown>).delay_hours ?? 3)} horas após abandono
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-6 bg-rim" />
                </div>

                {/* Step 2: Channel */}
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${CHANNEL_COLORS[showFlow.channel]}`}>
                    {(() => {
                      const Icon = CHANNEL_ICONS[showFlow.channel];
                      return <Icon className="w-5 h-5" />;
                    })()}
                  </div>
                  <div className="flex-1 bg-cream rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Etapa 2: Envio</p>
                    <p className="text-sm font-medium text-espresso mt-0.5">
                      {showFlow.channel === 'email' ? 'E-mail' : showFlow.channel === 'whatsapp' ? 'WhatsApp API' : 'SMS'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="w-px h-6 bg-rim" />
                </div>

                {/* Step 3: Message */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-wood/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-wood" />
                  </div>
                  <div className="flex-1 bg-cream rounded-lg p-3">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Etapa 3: Mensagem</p>
                    <p className="text-sm text-muted mt-1 leading-relaxed italic">
                      "{showFlow.message_template ?? 'Sem template definido'}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-cream rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-espresso">{showFlow.stats_sent}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Mensagens Enviadas</p>
                </div>
                <div className="bg-cream rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-espresso">{showFlow.stats_opened}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Mensagens Abertas</p>
                </div>
              </div>

              {/* Recent executions */}
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Execuções Recentes (tempo real)</p>
                {recentRuns.length === 0 ? (
                  <p className="text-xs text-muted bg-cream rounded-lg p-3 text-center">
                    Nenhuma execução registrada ainda. As automações disparam automaticamente quando o gatilho ocorre (ex.: mudança de status de pedido).
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {recentRuns.map(run => (
                      <div key={run.id} className="flex items-center gap-2 bg-cream rounded-lg p-2 text-xs">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          run.status === 'sent' ? 'bg-moss' : run.status === 'queued' ? 'bg-amber-400' : run.status === 'failed' ? 'bg-red-500' : 'bg-rim'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-espresso truncate">
                            {run.customer_name ?? 'Cliente'} {run.order_number && `• ${run.order_number}`}
                          </p>
                          <p className="text-muted text-[10px]">
                            {run.trigger_type} • {new Date(run.created_at).toLocaleString('pt-BR')}
                          </p>
                        </div>
                        <span className="text-[10px] text-muted capitalize flex-shrink-0">{run.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[11px] text-muted text-center bg-amber-50 border border-amber-200 rounded-lg p-3">
                Esta é uma visualização do fluxo. A integração ativa com gateways de e-mail, SMS e WhatsApp API requer configuração das credenciais de API de cada provedor.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
