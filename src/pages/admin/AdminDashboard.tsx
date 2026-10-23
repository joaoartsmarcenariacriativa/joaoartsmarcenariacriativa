import { useEffect, useState } from 'react';
import { TrendingUp, Package, Clock, Truck, CheckCircle, AlertTriangle, DollarSign, ShoppingCart, Download, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Order, Product } from '@/types';
import { formatBRL } from '@/lib/format';
import { ORDER_STATUS_LABELS } from '@/types';

interface DashboardPeriod {
  id: number;
  period_start: string;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [periodStart, setPeriodStart] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);

    const [periodRes] = await Promise.all([
      supabase.from('dashboard_period').select('*').eq('id', 1).maybeSingle(),
    ]);
    const period = periodRes.data as DashboardPeriod | null;
    const start = period ? new Date(period.period_start) : new Date();
    setPeriodStart(start);

    const [ordersRes, productsRes] = await Promise.all([
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('products').select('*').eq('active', true).order('sales_count', { ascending: false }),
    ]);
    setOrders(ordersRes.data as Order[] ?? []);
    setProducts(productsRes.data as Product[] ?? []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Apenas pedidos dentro do período atual contam para o dashboard.
  const periodOrders = orders.filter(o => new Date(o.created_at) >= periodStart);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const yearStart = new Date(now.getFullYear(), 0, 1);

  const periodRevenue = periodOrders
    .filter(o => o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const revenueToday = periodOrders
    .filter(o => new Date(o.created_at) >= todayStart && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);
  const revenueWeek = periodOrders
    .filter(o => new Date(o.created_at) >= weekStart && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);
  const revenueMonth = periodOrders
    .filter(o => new Date(o.created_at) >= monthStart && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);
  const revenueYear = periodOrders
    .filter(o => new Date(o.created_at) >= yearStart && o.status !== 'cancelado')
    .reduce((sum, o) => sum + o.total, 0);

  const pendingProduction = periodOrders.filter(o => o.status === 'processamento').length;
  const shipped = periodOrders.filter(o => o.status === 'enviado').length;
  const delivered = periodOrders.filter(o => o.status === 'entregue').length;
  const awaitingPayment = periodOrders.filter(o => o.status === 'recebido').length;
  const totalOrders = periodOrders.length;

  const lowStockProducts = products.filter(p => p.stock <= 5);
  const topProducts = products.slice(0, 5);

  const downloadReport = () => {
    if (totalOrders === 0) {
      alert('Não há pedidos neste período para exportar.');
      return;
    }

    const headers = ['Pedido', 'Cliente', 'Email', 'Data', 'Status', 'Total'];
    const rows = periodOrders.map(o => [
      o.order_number,
      o.customer_name,
      o.email,
      new Date(o.created_at).toLocaleString('pt-BR'),
      ORDER_STATUS_LABELS[o.status],
      o.total.toFixed(2).replace('.', ','),
    ]);

    const csv = [headers, ...rows]
      .map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(';'))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dashboard-${periodStart.toLocaleDateString('pt-BR').replace(/\//g, '-')}-a-${now.toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetDashboard = async () => {
    if (!confirm(
      `Isso vai baixar o relatório atual e zerar o dashboard para um novo período. ` +
      `Faturamento do período: ${formatBRL(periodRevenue)} em ${totalOrders} pedidos. Continuar?`
    )) return;

    setActionLoading(true);
    downloadReport();

    const { error } = await supabase
      .from('dashboard_period')
      .update({ period_start: new Date().toISOString() })
      .eq('id', 1);

    setActionLoading(false);
    if (error) {
      alert('Erro ao zerar o dashboard: ' + error.message);
      return;
    }
    await loadData();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-xs uppercase tracking-[0.2em] text-muted">Carregando...</div>;
  }

  const stats = [
    { label: 'Hoje', value: formatBRL(revenueToday), icon: DollarSign, color: 'text-moss bg-green-50' },
    { label: 'Semana', value: formatBRL(revenueWeek), icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
    { label: 'Mês', value: formatBRL(revenueMonth), icon: TrendingUp, color: 'text-wood bg-wood/10' },
    { label: 'Ano', value: formatBRL(revenueYear), icon: TrendingUp, color: 'text-espresso bg-cream' },
  ];

  const orderStats = [
    { label: 'Pedidos Recebidos', value: awaitingPayment, icon: Clock, color: 'text-wood bg-wood/10' },
    { label: 'Em Processamento', value: pendingProduction, icon: Package, color: 'text-blue-600 bg-blue-50' },
    { label: 'Enviados', value: shipped, icon: Truck, color: 'text-amber-600 bg-amber-50' },
    { label: 'Entregues', value: delivered, icon: CheckCircle, color: 'text-moss bg-green-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Dashboard</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted mt-1">
            Período atual: {periodStart.toLocaleDateString('pt-BR')} — {now.toLocaleDateString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadReport}
            disabled={totalOrders === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-paper border border-rim text-espresso text-xs font-medium rounded-lg hover:border-wood transition-colors disabled:opacity-50"
            title="Baixar relatório CSV do período atual"
          >
            <Download className="w-3.5 h-3.5" />
            Baixar Relatório
          </button>
          <button
            onClick={resetDashboard}
            disabled={actionLoading}
            className="flex items-center gap-1.5 px-3 py-2 bg-wood hover:bg-wood-dark text-cream text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            title="Baixa o relatório e inicia um novo período zerado"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            {actionLoading ? 'Zerando...' : 'Zerar Dashboard'}
          </button>
        </div>
      </div>

      {/* Period summary */}
      <div className="bg-gradient-to-br from-wood to-wood-dark rounded-2xl p-5 text-cream">
        <div className="flex items-center gap-3 mb-1">
          <DollarSign className="w-5 h-5" />
          <p className="text-[10px] uppercase tracking-[0.2em] opacity-80">Faturamento do Período</p>
        </div>
        <div className="flex items-end gap-4 flex-wrap">
          <p className="font-serif text-3xl font-semibold">{formatBRL(periodRevenue)}</p>
          <p className="text-sm opacity-80">{totalOrders} pedidos neste período</p>
        </div>
      </div>

      {/* Revenue stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div key={stat.label} className="bg-paper rounded-2xl border border-rim p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">{stat.label}</p>
            <p className="font-serif text-lg font-semibold text-espresso mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Order stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {orderStats.map(stat => (
          <div key={stat.label} className="bg-paper rounded-2xl border border-rim p-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-muted">{stat.label}</p>
            <p className="font-serif text-2xl font-semibold text-espresso mt-0.5">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <div className="bg-paper rounded-2xl border border-rim p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingCart className="w-5 h-5 text-wood" />
            <h2 className="font-serif font-semibold text-espresso">Produtos Mais Vendidos</h2>
          </div>
          <div className="space-y-2">
            {topProducts.map((product, idx) => (
              <div key={product.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream transition-colors">
                <span className="text-sm font-semibold text-muted w-5">{idx + 1}</span>
                {product.images[0] && (
                  <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso truncate">{product.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{product.sales_count} vendas</p>
                </div>
                <p className="text-sm font-semibold text-wood">{formatBRL(product.price)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alerts */}
        <div className="bg-paper rounded-2xl border border-rim p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="font-serif font-semibold text-espresso">Alertas de Estoque Baixo</h2>
          </div>
          <div className="space-y-2">
            {lowStockProducts.length === 0 ? (
              <p className="text-xs text-muted text-center py-4">Todos os produtos têm estoque adequado</p>
            ) : (
              lowStockProducts.map(product => (
                <div key={product.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg">
                  {product.images[0] && (
                    <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-espresso truncate">{product.name}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded ${product.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {product.stock} un.
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent orders in period */}
      <div className="bg-paper rounded-2xl border border-rim p-5">
        <h2 className="font-serif font-semibold text-espresso mb-4">
          Pedidos do Período ({totalOrders})
        </h2>
        <div className="space-y-2">
          {periodOrders.length === 0 ? (
            <p className="text-xs text-muted text-center py-6">
              Nenhum pedido neste período. O dashboard está zerado.
            </p>
          ) : (
            periodOrders.slice(0, 8).map(order => (
              <div key={order.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-cream transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-espresso truncate">{order.customer_name}</p>
                  <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{order.order_number}</p>
                </div>
                <span className="text-[10px] text-muted hidden sm:block">
                  {new Date(order.created_at).toLocaleDateString('pt-BR')}
                </span>
                <span className="text-[10px] text-muted hidden sm:block">
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
                <p className="text-sm font-semibold text-espresso">{formatBRL(order.total)}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
