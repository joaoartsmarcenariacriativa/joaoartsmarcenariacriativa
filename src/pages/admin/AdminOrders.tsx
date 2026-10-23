import { useEffect, useState } from 'react';
import { Search, Package, Printer, X, Eye, Kanban, Table as TableIcon, Truck, CheckCircle2, XCircle, Clock, PackageCheck, AlertTriangle, Download, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, OrderItem, OrderStatus } from '@/types';
import { formatBRL } from '@/lib/format';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, ORDER_PIPELINE } from '@/types';

const STATUS_OPTIONS: OrderStatus[] = [
  'recebido',
  'processamento',
  'enviado',
  'confirmado',
  'entregue',
  'cancelado',
];

const COLUMN_ICONS: Record<OrderStatus, typeof Package> = {
  recebido: Package,
  processamento: Clock,
  enviado: Truck,
  confirmado: PackageCheck,
  entregue: CheckCircle2,
  cancelado: XCircle,
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [trackingInput, setTrackingInput] = useState('');
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [periodStart, setPeriodStart] = useState<Date>(new Date());
  const [showPeriodOnly, setShowPeriodOnly] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    const [ordersRes, periodRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }),
      supabase.from('dashboard_period').select('*').eq('id', 1).maybeSingle(),
    ]);
    if (periodRes.data) {
      setPeriodStart(new Date(periodRes.data.period_start));
    }
    if (ordersRes.error) { setOrders([]); }
    else setOrders(ordersRes.data as Order[] ?? []);
    setLoading(false);
  };

  const viewOrder = async (order: Order) => {
    setSelectedOrder(order);
    setTrackingInput(order.tracking_code ?? '');
    setOrderItems([]);
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);
    if (error) { setOrderItems([]); return; }
    setOrderItems(data as OrderItem[] ?? []);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'entregue') {
      updates.delivered_at = new Date().toISOString();
    }
    const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
    if (error) { alert('Erro ao atualizar status: ' + error.message); return; }
    loadOrders();
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status, delivered_at: status === 'entregue' ? new Date().toISOString() : selectedOrder.delivered_at });
    }
  };

  const updateTracking = async (orderId: string, trackingCode: string) => {
    const currentOrder = orders.find(o => o.id === orderId);
    const newStatus: OrderStatus = currentOrder?.status === 'entregue' || currentOrder?.status === 'cancelado'
      ? currentOrder.status
      : 'enviado';
    const { error } = await supabase.from('orders').update({
      tracking_code: trackingCode,
      status: newStatus,
      manual_label_required: false,
      updated_at: new Date().toISOString(),
    }).eq('id', orderId);
    if (error) { alert('Erro ao salvar rastreio: ' + error.message); return; }
    loadOrders();
    if (selectedOrder) {
      setSelectedOrder({ ...selectedOrder, tracking_code: trackingCode, status: newStatus });
    }
  };

  const filtered = orders.filter(o => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesPeriod = !showPeriodOnly || new Date(o.created_at) >= periodStart;
    return matchesSearch && matchesStatus && matchesPeriod;
  });

  const downloadReport = () => {
    if (filtered.length === 0) {
      alert('Não há pedidos para exportar neste filtro.');
      return;
    }
    const headers = ['Pedido', 'Cliente', 'Email', 'Telefone', 'Status', 'Total', 'Data', 'CEP', 'Cidade', 'Estado'];
    const rows = filtered.map(o => [
      o.order_number,
      o.customer_name,
      o.email,
      o.phone,
      ORDER_STATUS_LABELS[o.status],
      o.total.toFixed(2).replace('.', ','),
      new Date(o.created_at).toLocaleString('pt-BR'),
      o.cep,
      o.city,
      o.state,
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const label = showPeriodOnly
      ? `pedidos-periodo-${periodStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}`
      : `pedidos-todos`;
    a.download = `${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetPeriod = async () => {
    const periodOrders = orders.filter(o => new Date(o.created_at) >= periodStart);
    const periodRevenue = periodOrders.filter(o => o.status !== 'cancelado').reduce((s, o) => s + o.total, 0);
    if (!confirm(
      `Isso vai baixar o relatório do período atual e iniciar um novo período zerado. ` +
      `${periodOrders.length} pedidos, ${formatBRL(periodRevenue)} em faturamento. Continuar?`
    )) return;
    setActionLoading(true);
    setShowPeriodOnly(true);
    downloadReport();
    const { error } = await supabase
      .from('dashboard_period')
      .update({ period_start: new Date().toISOString() })
      .eq('id', 1);
    setActionLoading(false);
    if (error) { alert('Erro ao zerar período: ' + error.message); return; }
    await loadOrders();
  };

  const esc = (s: string | null | undefined) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const printLabel = (order: Order) => {
    const printWindow = window.open('', '_blank', 'width=600,height=400');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
      <head>
        <title>Etiqueta - ${esc(order.order_number)}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; }
          .label { max-width: 400px; margin: 0 auto; border: 2px solid #333; padding: 20px; }
          .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 16px; }
          .header p { font-size: 12px; color: #666; }
          .info { margin: 5px 0; font-size: 13px; }
          .info strong { display: inline-block; width: 80px; }
          .barcode { text-align: center; margin: 15px 0; font-family: monospace; font-size: 18px; letter-spacing: 2px; }
          .footer { margin-top: 15px; font-size: 11px; color: #666; text-align: center; border-top: 1px solid #ccc; padding-top: 10px; }
          @media print { .label { border: 2px solid #000; } }
        </style>
      </head>
      <body>
        <div class="label">
          <div class="header">
            <h1>João Art's Marcenaria Criativa</h1>
            <p>Etiqueta de Envio</p>
          </div>
          <div class="info"><strong>Pedido:</strong> ${esc(order.order_number)}</div>
          <div class="info"><strong>Cliente:</strong> ${esc(order.customer_name)}</div>
          <div class="info"><strong>Endereço:</strong> ${esc(order.address)}</div>
          <div class="info"><strong>Cidade:</strong> ${esc(order.city)} - ${esc(order.state)}</div>
          <div class="info"><strong>CEP:</strong> ${esc(order.cep)}</div>
          <div class="info"><strong>Telefone:</strong> ${esc(order.phone)}</div>
          <div class="barcode">${esc(order.tracking_code) || 'Rastreio pendente'}</div>
          <div class="footer">
            Declaração de Conteúdo: Peças artesanais em madeira<br/>
            Conteúdo: Produtos de marcenaria<br/>
            ${new Date().toLocaleDateString('pt-BR')}
          </div>
        </div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const onDragStart = (id: string) => setDraggedId(id);
  const onDrop = (status: OrderStatus) => {
    if (draggedId) {
      updateStatus(draggedId, status);
      setDraggedId(null);
    }
  };

  const ordersByStatus = (status: OrderStatus) => filtered.filter(o => o.status === status);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Pedidos</h1>
          <p className="text-sm text-muted mt-1">
            {showPeriodOnly
              ? `${filtered.length} pedidos no período (desde ${periodStart.toLocaleDateString('pt-BR')})`
              : `${filtered.length} de ${orders.length} pedidos no total`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowPeriodOnly(!showPeriodOnly)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${showPeriodOnly ? 'bg-wood/10 text-wood border-wood/30' : 'bg-paper text-muted border-rim hover:border-wood'}`}
            title="Alternar entre pedidos do período atual ou todos os pedidos"
          >
            {showPeriodOnly ? 'Período Atual' : 'Todos os Pedidos'}
          </button>
          <div className="flex items-center gap-1 bg-paper border border-rim rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'kanban' ? 'bg-wood text-cream' : 'text-muted hover:text-espresso'}`}
            >
              <Kanban className="w-4 h-4" /> Kanban
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${view === 'table' ? 'bg-wood text-cream' : 'text-muted hover:text-espresso'}`}
            >
              <TableIcon className="w-4 h-4" /> Tabela
            </button>
          </div>
          <button
            onClick={downloadReport}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-paper border border-rim text-espresso text-xs font-medium rounded-lg hover:border-wood transition-colors disabled:opacity-50"
            title="Baixar relatório CSV dos pedidos exibidos"
          >
            <Download className="w-3.5 h-3.5" /> Baixar
          </button>
          <button
            onClick={resetPeriod}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-wood hover:bg-wood-dark text-cream text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            title="Baixa o relatório do período e inicia um novo período zerado"
          >
            <RotateCcw className="w-3.5 h-3.5" /> {actionLoading ? 'Zerando...' : 'Zerar Período'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por cliente ou número do pedido..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
        >
          <option value="all">Todos os status</option>
          {STATUS_OPTIONS.map(status => (
            <option key={status} value={status}>
              {ORDER_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && !loading && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3 min-w-max">
            {ORDER_PIPELINE.map(status => {
              const Icon = COLUMN_ICONS[status];
              const columnOrders = ordersByStatus(status);
              return (
                <div
                  key={status}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => onDrop(status)}
                  className="w-72 flex-shrink-0 bg-paper rounded-xl border border-rim overflow-hidden"
                >
                  <div className={`px-3 py-2.5 border-b border-rim flex items-center justify-between ${ORDER_STATUS_COLORS[status]}`}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs font-semibold">{ORDER_STATUS_LABELS[status]}</span>
                    </div>
                    <span className="text-xs font-bold">{columnOrders.length}</span>
                  </div>
                  <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                    {columnOrders.map(order => (
                      <div
                        key={order.id}
                        draggable
                        onDragStart={() => onDragStart(order.id)}
                        onClick={() => viewOrder(order)}
                        className="bg-cream rounded-lg border border-rim p-3 cursor-pointer hover:border-wood hover:shadow-soft transition-all"
                      >
                        <p className="text-xs font-semibold text-espresso">{order.order_number}</p>
                        <p className="text-[11px] text-muted mt-0.5 truncate">{order.customer_name}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs font-bold text-wood">{formatBRL(order.total)}</span>
                          {order.manual_label_required && (
                            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full" title={order.label_purchase_error ?? 'Sem saldo na transportadora'}>
                              <AlertTriangle className="w-3 h-3" /> Emitir Manualmente
                            </span>
                          )}
                          {order.tracking_code && !order.manual_label_required && (
                            <span className="text-[10px] text-muted truncate max-w-[80px]" title={order.tracking_code}>
                              {order.tracking_code}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {columnOrders.length === 0 && (
                      <p className="text-center text-[11px] text-muted py-4">Arraste pedidos aqui</p>
                    )}
                  </div>
                </div>
              );
            })}
            {/* Cancelado column */}
            <div
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDrop('cancelado')}
              className="w-72 flex-shrink-0 bg-paper rounded-xl border border-rim overflow-hidden"
            >
              <div className="px-3 py-2.5 border-b border-rim flex items-center justify-between bg-red-100 text-red-800 border-red-200">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  <span className="text-xs font-semibold">Cancelado/Reembolsado</span>
                </div>
                <span className="text-xs font-bold">{ordersByStatus('cancelado').length}</span>
              </div>
              <div className="p-2 space-y-2 min-h-[120px] max-h-[60vh] overflow-y-auto">
                {ordersByStatus('cancelado').map(order => (
                  <div
                    key={order.id}
                    draggable
                    onDragStart={() => onDragStart(order.id)}
                    onClick={() => viewOrder(order)}
                    className="bg-cream rounded-lg border border-rim p-3 cursor-pointer hover:border-wood transition-all opacity-75"
                  >
                    <p className="text-xs font-semibold text-espresso">{order.order_number}</p>
                    <p className="text-[11px] text-muted mt-0.5 truncate">{order.customer_name}</p>
                    <p className="text-xs font-bold text-red-600 mt-1">{formatBRL(order.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table View */}
      {view === 'table' && (
        <div className="bg-paper rounded-2xl border border-rim overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-muted">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="w-12 h-12 text-rim mx-auto mb-3" />
              <p className="text-muted">Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-cream text-muted text-xs uppercase">
                  <tr>
                    <th className="px-3 py-3 text-left font-medium">Pedido</th>
                    <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Cliente</th>
                    <th className="px-3 py-3 text-left font-medium">Status</th>
                    <th className="px-3 py-3 text-right font-medium">Total</th>
                    <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Data</th>
                    <th className="px-3 py-3 text-center font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rim">
                  {filtered.map(order => (
                    <tr key={order.id} className="hover:bg-cream transition-colors">
                      <td className="px-3 py-3">
                        <p className="font-medium text-espresso text-xs">{order.order_number}</p>
                        <p className="text-xs text-muted sm:hidden">{order.customer_name}</p>
                      </td>
                      <td className="px-3 py-3 text-espresso hidden sm:table-cell">{order.customer_name}</td>
                      <td className="px-3 py-3">
                        <select
                          value={order.status}
                          onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                          className={`text-xs font-medium px-2 py-1 rounded border ${ORDER_STATUS_COLORS[order.status]} cursor-pointer focus:outline-none`}
                        >
                          {STATUS_OPTIONS.map(status => (
                            <option key={status} value={status}>
                              {ORDER_STATUS_LABELS[status]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-right font-bold text-espresso">
                        {formatBRL(order.total)}
                      </td>
                      <td className="px-3 py-3 text-muted text-xs hidden sm:table-cell">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => viewOrder(order)}
                              className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4 text-muted" />
                            </button>
                            <button
                              onClick={() => printLabel(order)}
                              className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                              title="Imprimir etiqueta"
                            >
                              <Printer className="w-4 h-4 text-muted" />
                            </button>
                          </div>
                          {order.manual_label_required && (
                            <span className="flex items-center gap-0.5 text-[9px] font-semibold text-amber-700 bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded-full whitespace-nowrap" title={order.label_purchase_error ?? ''}>
                              <AlertTriangle className="w-3 h-3" /> Emitir Manualmente
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div
            className="bg-paper rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper">
              <div>
                <h2 className="font-serif font-bold text-espresso">Pedido {selectedOrder.order_number}</h2>
                <p className="text-xs text-muted">
                  {new Date(selectedOrder.created_at).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Status do Pedido</p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUS_OPTIONS.map(status => (
                    <button
                      key={status}
                      onClick={() => updateStatus(selectedOrder.id, status)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                        selectedOrder.status === status
                          ? ORDER_STATUS_COLORS[status] + ' ring-2 ring-offset-1 ring-wood/30'
                          : 'bg-cream text-muted border-rim hover:border-wood/50'
                      }`}
                    >
                      {ORDER_STATUS_LABELS[status]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual label alert */}
              {selectedOrder.manual_label_required && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-800">Atenção: Emitir etiqueta manualmente</p>
                    <p className="text-amber-700 text-xs mt-0.5">
                      A compra automática da etiqueta falhou
                      {selectedOrder.label_purchase_error ? ` (${selectedOrder.label_purchase_error})` : ''}.
                      Pague a etiqueta no painel da transportadora, cole o código de rastreio abaixo e clique em Salvar.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer info */}
              <div className="bg-cream rounded-lg p-4 space-y-1.5 text-sm">
                <p><strong className="text-espresso">Cliente:</strong> {selectedOrder.customer_name}</p>
                <p><strong className="text-espresso">E-mail:</strong> {selectedOrder.email}</p>
                <p><strong className="text-espresso">Telefone:</strong> {selectedOrder.phone}</p>
                <p><strong className="text-espresso">Endereço:</strong> {selectedOrder.address}</p>
                <p><strong className="text-espresso">CEP:</strong> {selectedOrder.cep}</p>
                <p><strong className="text-espresso">Pagamento:</strong> {selectedOrder.payment_method}</p>
                {selectedOrder.marketing_opt_in && (
                  <p className="text-moss text-xs font-medium pt-1">Cliente aceitou receber ofertas e comunicações</p>
                )}
              </div>

              {/* Items */}
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2">Itens do Pedido</p>
                <div className="space-y-2">
                  {orderItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-cream rounded-lg">
                      {item.product_image && (
                        <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-espresso truncate">{item.product_name}</p>
                        <p className="text-xs text-muted">
                          {item.quantity}x {item.variation && `• ${item.variation}`}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-espresso">{formatBRL(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-3 pt-3 border-t border-rim">
                  <span className="font-semibold text-espresso">Total</span>
                  <span className="font-bold text-espresso">{formatBRL(selectedOrder.total)}</span>
                </div>
              </div>

              {/* Tracking code */}
              <div>
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted mb-1 block">Link / Código de Rastreio</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={e => setTrackingInput(e.target.value)}
                    placeholder="Ex: https://link追踪.com/SS123 ou SS123456789BR"
                    className="flex-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                  />
                  <button
                    onClick={() => {
                      if (trackingInput !== (selectedOrder.tracking_code ?? '')) {
                        updateTracking(selectedOrder.id, trackingInput);
                      }
                    }}
                    className="px-3 py-2 bg-wood text-cream text-sm font-medium rounded-lg hover:bg-wood-dark transition-colors"
                  >
                    Salvar
                  </button>
                </div>
                <p className="text-xs text-muted mt-1">
                  Ao salvar o rastreio, o status muda para "Pedido Enviado" automaticamente.
                </p>
                {selectedOrder.tracking_code && (
                  <a
                    href={selectedOrder.tracking_code.startsWith('http') ? selectedOrder.tracking_code : `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objetos=${selectedOrder.tracking_code}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-wood hover:underline mt-1 inline-block"
                  >
                    Abrir rastreio em nova aba
                  </a>
                )}
              </div>

              {/* Print label */}
              <button
                onClick={() => printLabel(selectedOrder)}
                className="flex items-center gap-2 px-4 py-2.5 bg-espresso text-cream text-sm font-medium rounded-lg hover:scale-105 transition-transform w-full justify-center"
              >
                <Printer className="w-4 h-4" /> Imprimir Etiqueta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
