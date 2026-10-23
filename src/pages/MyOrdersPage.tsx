import { useState } from 'react';
import { Package, Truck, CheckCircle2, Clock, XCircle, MapPin, ExternalLink, AlertCircle, ChevronDown, ChevronUp, Search, Mail } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderStatus } from '@/types';
import { formatBRL } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_PIPELINE } from '@/types';

interface MyOrdersPageProps {
  onNavigate: (path: string) => void;
}

const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
  recebido: Package,
  processamento: Clock,
  enviado: Truck,
  confirmado: CheckCircle2,
  entregue: CheckCircle2,
  cancelado: XCircle,
};

export default function MyOrdersPage({ onNavigate }: MyOrdersPageProps) {
  const [emailInput, setEmailInput] = useState('');
  const [searchedEmail, setSearchedEmail] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setHasSearched(true);
    setSearchedEmail(trimmed);
    setExpandedOrder(null);
    setOrderItemsMap({});

    const { data, error: err } = await supabase.rpc('get_my_orders', { p_email: trimmed });

    if (err) {
      setError('Não foi possível buscar seus pedidos. Tente novamente.');
      setOrders([]);
      setLoading(false);
      return;
    }
    setOrders((data as Order[]) ?? []);
    setLoading(false);
  };

  const loadOrderItems = async (orderId: string) => {
    if (orderItemsMap[orderId]) return;
    const { data } = await supabase.rpc('get_my_order_items', {
      p_order_id: orderId,
      p_email: searchedEmail,
    });
    setOrderItemsMap(prev => ({ ...prev, [orderId]: (data as OrderItem[]) ?? [] }));
  };

  const toggleOrder = (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      loadOrderItems(orderId);
    }
  };

  const requestRefund = async (order: Order) => {
    if (!confirm('Tem certeza que deseja solicitar o cancelamento/devolução deste pedido?')) return;
    const { error: err } = await supabase.rpc('request_order_refund', {
      p_order_id: order.id,
      p_email: searchedEmail,
    });
    if (err) {
      alert('Erro ao solicitar cancelamento: ' + err.message);
      return;
    }
    setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'cancelado' } : o));
  };

  const canRequestRefund = (order: Order): boolean => {
    if (order.status === 'entregue' && order.delivered_at) {
      const deliveredDate = new Date(order.delivered_at);
      const now = new Date();
      const diffDays = (now.getTime() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 7;
    }
    return false;
  };

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'cancelado') return -1;
    return ORDER_PIPELINE.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso mb-2">Meus Pedidos</h1>
      <p className="text-sm text-muted mb-6">Digite o e-mail usado na compra para acompanhe seus pedidos.</p>

      {/* Email search form */}
      <form onSubmit={handleSearch} className="bg-paper rounded-2xl shadow-soft p-4 sm:p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="email"
              required
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Buscando...' : (<><Search className="w-4 h-4" /> Buscar Pedidos</>)}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {hasSearched && !loading && orders.length === 0 && !error && (
        <div className="bg-paper rounded-2xl shadow-soft p-8 text-center">
          <Package className="w-16 h-16 text-rim mx-auto mb-4" />
          <p className="text-muted font-medium mb-2">Nenhum pedido encontrado para este e-mail.</p>
          <p className="text-xs text-muted mb-4">Verifique se o e-mail está correto ou se você já fez uma compra.</p>
          <button
            onClick={() => onNavigate('/produtos')}
            className="px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
          >
            Explorar Produtos
          </button>
        </div>
      )}

      {orders.length > 0 && (
        <div className="space-y-3">
          {orders.map(order => {
            const stepIndex = getStepIndex(order.status);
            const items = orderItemsMap[order.id] ?? [];
            const isExpanded = expandedOrder === order.id;

            return (
              <div key={order.id} className="bg-paper rounded-2xl shadow-soft overflow-hidden">
                {/* Order header */}
                <button
                  onClick={() => toggleOrder(order.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-cream/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      order.status === 'cancelado' ? 'bg-red-100' : 'bg-wood/10'
                    }`}>
                      {(() => {
                        const Icon = STATUS_ICONS[order.status];
                        return <Icon className={`w-5 h-5 ${order.status === 'cancelado' ? 'text-red-600' : 'text-wood'}`} />;
                      })()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-espresso text-sm">{order.order_number}</p>
                      <p className="text-xs text-muted">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')} • {formatBRL(order.total)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full border hidden sm:inline-block ${
                      order.status === 'cancelado'
                        ? 'bg-red-100 text-red-700 border-red-200'
                        : 'bg-wood/10 text-wood border-wood/30'
                    }`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-rim p-4 space-y-4">
                    {/* Progress Stepper */}
                    {order.status !== 'cancelado' && (
                      <div>
                        <div className="flex items-center justify-between">
                          {ORDER_PIPELINE.map((status, idx) => {
                            const Icon = STATUS_ICONS[status];
                            const isCompleted = stepIndex >= idx;
                            const isCurrent = stepIndex === idx;
                            return (
                              <div key={status} className="flex flex-col items-center flex-1 relative">
                                {idx > 0 && (
                                  <div className={`absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 ${
                                    isCompleted ? 'bg-moss' : 'bg-rim'
                                  }`} />
                                )}
                                <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                  isCompleted ? 'bg-moss text-cream' : isCurrent ? 'bg-wood text-cream ring-4 ring-wood/20' : 'bg-rim text-muted'
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[9px] mt-1.5 text-center leading-tight ${isCurrent ? 'font-semibold text-espresso' : 'text-muted'}`}>
                                  {ORDER_STATUS_LABELS[status]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {order.status === 'cancelado' && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
                        <XCircle className="w-6 h-6 text-red-600 mx-auto mb-1" />
                        <p className="text-sm font-medium text-red-700">Pedido Cancelado/Reembolsado</p>
                      </div>
                    )}

                    {/* Tracking button */}
                    {order.status === 'enviado' && order.tracking_code && (
                      <a
                        href={order.tracking_code.startsWith('http') ? order.tracking_code : `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objetos=${order.tracking_code}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
                      >
                        <Truck className="w-5 h-5" />
                        Rastrear Meu Pedido
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {/* Order items */}
                    {items.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Itens</p>
                        <div className="space-y-2">
                          {items.map(item => (
                            <div key={item.id} className="flex items-center gap-3 p-2 bg-cream rounded-lg">
                              {item.product_image && (
                                <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-espresso truncate">{item.product_name}</p>
                                <p className="text-xs text-muted">{item.quantity}x {item.variation && `• ${item.variation}`}</p>
                              </div>
                              <p className="text-sm font-bold text-espresso">{formatBRL(item.price * item.quantity)}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Delivery address */}
                    <div className="bg-cream rounded-lg p-3 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-wood flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-muted">
                        <p className="text-espresso font-medium">{order.address}</p>
                        <p>{order.city} - {order.state} • CEP: {order.cep}</p>
                      </div>
                    </div>

                    {/* 7-day refund button (Art. 49 CDC) */}
                    {canRequestRefund(order) && (
                      <div className="space-y-2">
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <p className="text-xs text-amber-700 leading-relaxed">
                            Você tem até 7 dias após a entrega para solicitar cancelamento ou devolução, conforme o Art. 49 do Código de Defesa do Consumidor.
                          </p>
                        </div>
                        <button
                          onClick={() => requestRefund(order)}
                          className="w-full py-2.5 border-2 border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Solicitar Cancelamento / Devolução
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
