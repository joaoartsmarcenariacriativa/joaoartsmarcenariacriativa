import { useEffect, useState, useCallback } from 'react';
import {
  Package, Heart, MapPin, LogOut, ShoppingBag, ChevronDown, ChevronUp,
  Truck, CheckCircle2, Clock, XCircle, ExternalLink, Plus, Trash2, Edit3,
  Star, AlertCircle, User as UserIcon, Mail, Phone, Check, X, Shield,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { formatBRL } from '@/lib/format';
import {
  ORDER_STATUS_LABELS, ORDER_PIPELINE,
  type Order, type OrderItem, type OrderStatus,
  type Product, type CustomerAddress,
} from '@/types';

interface MyAccountPageProps {
  onNavigate: (path: string) => void;
}

type Tab = 'overview' | 'orders' | 'favorites' | 'addresses' | 'profile';

const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
  recebido: Package,
  processamento: Clock,
  enviado: Truck,
  confirmado: CheckCircle2,
  entregue: CheckCircle2,
  cancelado: XCircle,
};

export default function MyAccountPage({ onNavigate }: MyAccountPageProps) {
  const { user, signOut, isCustomer } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItemsMap, setOrderItemsMap] = useState<Record<string, OrderItem[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false });
    setOrders((data as Order[]) ?? []);
  }, [user]);

  const loadFavorites = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_favorites')
      .select('product:products(*)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    const prods = (data ?? []).map((r) => (r as unknown as { product: Product }).product).filter(Boolean);
    setFavorites(prods);
  }, [user]);

  const loadAddresses = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false });
    setAddresses((data as CustomerAddress[]) ?? []);
  }, [user]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([loadOrders(), loadFavorites(), loadAddresses()]).finally(() => setLoading(false));
  }, [user, loadOrders, loadFavorites, loadAddresses]);

  if (!isCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 bg-wood/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserIcon className="w-8 h-8 text-wood" />
        </div>
        <h1 className="font-serif text-xl font-medium text-espresso mb-2">Acesse sua conta</h1>
        <p className="text-sm text-muted mb-6">Faça login ou cadastre-se para ver seus pedidos, favoritos e endereços.</p>
        <button
          onClick={() => onNavigate('/entrar')}
          className="px-6 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
        >
          Entrar / Cadastrar
        </button>
      </div>
    );
  }

  const loadOrderItems = async (orderId: string) => {
    if (orderItemsMap[orderId]) return;
    const { data } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    setOrderItemsMap(prev => ({ ...prev, [orderId]: (data as OrderItem[]) ?? [] }));
  };

  const toggleOrder = (orderId: string) => {
    if (expandedOrder === orderId) setExpandedOrder(null);
    else { setExpandedOrder(orderId); loadOrderItems(orderId); }
  };

  const removeFavorite = async (productId: string) => {
    if (!user) return;
    await supabase.from('customer_favorites').delete().eq('user_id', user.id).eq('product_id', productId);
    setFavorites(prev => prev.filter(p => p.id !== productId));
  };

  const deleteAddress = async (id: string) => {
    if (!confirm('Excluir este endereço?')) return;
    await supabase.from('customer_addresses').delete().eq('id', id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefaultAddress = async (id: string) => {
    if (!user) return;
    await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id).neq('id', id);
    await supabase.from('customer_addresses').update({ is_default: true, updated_at: new Date().toISOString() }).eq('id', id);
    await loadAddresses();
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
  };

  const tabs: { id: Tab; label: string; icon: typeof Package; count?: number }[] = [
    { id: 'overview', label: 'Visão Geral', icon: ShoppingBag },
    { id: 'orders', label: 'Meus Pedidos', icon: Package, count: orders.length },
    { id: 'favorites', label: 'Favoritos', icon: Heart, count: favorites.length },
    { id: 'addresses', label: 'Endereços', icon: MapPin, count: addresses.length },
    { id: 'profile', label: 'Meus Dados', icon: UserIcon },
  ];

  const getStepIndex = (status: OrderStatus): number => {
    if (status === 'cancelado') return -1;
    return ORDER_PIPELINE.indexOf(status);
  };

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const activeOrders = orders.filter(o => o.status !== 'cancelado' && o.status !== 'entregue').length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">Minha Conta</h1>
          <p className="text-sm text-muted mt-1">Bem-vindo(a)! Gerencie seus pedidos, favoritos e endereços.</p>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-muted hover:text-red-600 border border-rim rounded-lg hover:border-red-200 transition-colors w-fit"
        >
          <LogOut className="w-4 h-4" /> Sair
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  active ? 'bg-wood text-cream' : 'text-muted hover:bg-cream hover:text-espresso'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-cream/20 text-cream' : 'bg-wood/10 text-wood'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content */}
        <div className="min-w-0">
          {loading ? (
            <div className="p-8 text-center text-muted">Carregando...</div>
          ) : (
            <>
              {/* OVERVIEW */}
              {tab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: 'Total de Pedidos', value: orders.length, icon: Package, color: 'text-wood' },
                      { label: 'Pedidos Ativos', value: activeOrders, icon: Clock, color: 'text-amber-600' },
                      { label: 'Total Gasto', value: formatBRL(totalSpent), icon: ShoppingBag, color: 'text-moss' },
                      { label: 'Favoritos', value: favorites.length, icon: Heart, color: 'text-red-500' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-paper rounded-xl border border-rim p-4">
                        <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                        <p className="text-[10px] uppercase tracking-[0.1em] text-muted">{stat.label}</p>
                        <p className="font-serif text-lg font-bold text-espresso mt-0.5">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {orders.length > 0 ? (
                    <div className="bg-paper rounded-2xl border border-rim p-5">
                      <h2 className="font-serif text-lg font-medium text-espresso mb-3">Últimos Pedidos</h2>
                      <div className="space-y-2">
                        {orders.slice(0, 3).map(o => (
                          <div key={o.id} className="flex items-center justify-between p-3 bg-cream rounded-lg">
                            <div>
                              <p className="text-sm font-medium text-espresso">{o.order_number}</p>
                              <p className="text-xs text-muted">{new Date(o.created_at).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-espresso">{formatBRL(o.total)}</p>
                              <span className="text-[10px] font-medium text-wood">{ORDER_STATUS_LABELS[o.status]}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => setTab('orders')}
                        className="mt-3 text-xs font-medium text-wood hover:underline"
                      >
                        Ver todos os pedidos →
                      </button>
                    </div>
                  ) : (
                    <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
                      <Package className="w-12 h-12 text-rim mx-auto mb-3" />
                      <p className="text-sm text-muted mb-4">Você ainda não fez nenhum pedido.</p>
                      <button
                        onClick={() => onNavigate('/produtos')}
                        className="px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
                      >
                        Explorar Produtos
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ORDERS */}
              {tab === 'orders' && (
                <div className="space-y-3">
                  {orders.length === 0 ? (
                    <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
                      <Package className="w-12 h-12 text-rim mx-auto mb-3" />
                      <p className="text-sm text-muted mb-4">Nenhum pedido encontrado.</p>
                      <button
                        onClick={() => onNavigate('/produtos')}
                        className="px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
                      >
                        Explorar Produtos
                      </button>
                    </div>
                  ) : (
                    orders.map(order => {
                      const stepIndex = getStepIndex(order.status);
                      const items = orderItemsMap[order.id] ?? [];
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <div key={order.id} className="bg-paper rounded-2xl border border-rim overflow-hidden">
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

                          {isExpanded && (
                            <div className="border-t border-rim p-4 space-y-4">
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
                                          <span className={`text-[9px] mt-1.5 text-center leading-tight ${
                                            isCurrent ? 'font-semibold text-espresso' : 'text-muted'
                                          }`}>
                                            {ORDER_STATUS_LABELS[status]}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {order.status === 'enviado' && order.tracking_code && (
                                <a
                                  href={order.tracking_code.startsWith('http') ? order.tracking_code : `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objetos=${order.tracking_code}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-center gap-2 w-full py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
                                >
                                  <Truck className="w-5 h-5" /> Rastrear Pedido <ExternalLink className="w-4 h-4" />
                                </a>
                              )}

                              {items.length > 0 && (
                                <div>
                                  <p className="text-[10px] uppercase tracking-[0.15em] text-muted mb-2">Itens</p>
                                  <div className="space-y-2">
                                    {items.map(item => (
                                      <button
                                        key={item.id}
                                        onClick={() => item.product_id && onNavigate(`/produto/${item.product_name.toLowerCase().replace(/\s+/g, '-')}`)}
                                        className="w-full flex items-center gap-3 p-2 bg-cream rounded-lg text-left hover:bg-rim/30 transition-colors"
                                      >
                                        {item.product_image && (
                                          <img src={item.product_image} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-espresso truncate">{item.product_name}</p>
                                          <p className="text-xs text-muted">{item.quantity}x{item.variation && ` • ${item.variation}`}</p>
                                        </div>
                                        <p className="text-sm font-bold text-espresso">{formatBRL(item.price * item.quantity)}</p>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="bg-cream rounded-lg p-3 flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-wood flex-shrink-0 mt-0.5" />
                                <div className="text-xs text-muted">
                                  <p className="text-espresso font-medium">{order.address}</p>
                                  <p>{order.city} - {order.state} • CEP: {order.cep}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* FAVORITES */}
              {tab === 'favorites' && (
                <div>
                  {favorites.length === 0 ? (
                    <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
                      <Heart className="w-12 h-12 text-rim mx-auto mb-3" />
                      <p className="text-sm text-muted mb-4">Você ainda não favoritou nenhum produto.</p>
                      <button
                        onClick={() => onNavigate('/produtos')}
                        className="px-6 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
                      >
                        Explorar Produtos
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                      {favorites.map(p => (
                        <div key={p.id} className="bg-paper rounded-xl overflow-hidden border border-rim shadow-card group">
                          <button onClick={() => onNavigate(`/produto/${p.slug}`)} className="block w-full relative aspect-square overflow-hidden bg-cream">
                            {p.images.length > 0 ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : null}
                          </button>
                          <div className="p-3">
                            <p className="font-serif text-sm font-medium text-espresso line-clamp-2 min-h-[2.5rem]">{p.name}</p>
                            <div className="flex items-center gap-0.5 mt-1">
                              <Star className="w-3 h-3 fill-wood text-wood" />
                              <span className="text-xs text-muted">{p.rating.toFixed(1)}</span>
                            </div>
                            <p className="text-sm font-semibold text-espresso mt-1">{formatBRL(p.price)}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => onNavigate(`/produto/${p.slug}`)}
                                className="flex-1 py-2 bg-wood hover:bg-wood-dark text-cream text-xs font-medium rounded-lg transition-colors"
                              >
                                Ver Produto
                              </button>
                              <button
                                onClick={() => removeFavorite(p.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remover dos favoritos"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ADDRESSES */}
              {tab === 'addresses' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-lg font-medium text-espresso">Endereços Salvos</h2>
                    <button
                      onClick={() => { setEditingAddress(null); setShowAddressForm(true); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Novo Endereço
                    </button>
                  </div>

                  {addresses.length === 0 && !showAddressForm ? (
                    <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
                      <MapPin className="w-12 h-12 text-rim mx-auto mb-3" />
                      <p className="text-sm text-muted">Você ainda não salvou nenhum endereço.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {addresses.map(a => (
                        <div key={a.id} className={`bg-paper rounded-xl border p-4 ${a.is_default ? 'border-wood' : 'border-rim'}`}>
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-espresso px-2 py-0.5 bg-cream rounded">{a.label}</span>
                              {a.is_default && (
                                <span className="text-[10px] font-bold text-moss flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Padrão
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => { setEditingAddress(a); setShowAddressForm(true); }}
                                className="p-1.5 text-muted hover:text-wood hover:bg-cream rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => deleteAddress(a.id)}
                                className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <p className="text-sm font-medium text-espresso">{a.recipient_name}</p>
                          <p className="text-sm text-muted">{a.address}</p>
                          <p className="text-sm text-muted">{a.city} - {a.state} • CEP: {a.cep}</p>
                          {a.phone && <p className="text-xs text-muted mt-1">{a.phone}</p>}
                          {!a.is_default && (
                            <button
                              onClick={() => setDefaultAddress(a.id)}
                              className="mt-2 text-xs font-medium text-wood hover:underline"
                            >
                              Definir como padrão
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddressForm && (
                    <AddressForm
                      address={editingAddress}
                      onCancel={() => { setShowAddressForm(false); setEditingAddress(null); }}
                      onSaved={() => { setShowAddressForm(false); setEditingAddress(null); loadAddresses(); }}
                    />
                  )}
                </div>
              )}

              {/* PROFILE */}
              {tab === 'profile' && (
                <div className="space-y-4 max-w-2xl">
                  {/* Cartão de identidade do cliente */}
                  <div className="bg-paper rounded-2xl border border-rim overflow-hidden">
                    <div className="bg-gradient-to-br from-espresso to-wood p-6 text-cream relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-cream/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
                      <div className="relative flex items-center gap-4">
                        <div className="w-16 h-16 bg-cream/15 backdrop-blur rounded-full flex items-center justify-center text-cream font-serif text-2xl font-semibold border border-cream/20">
                          {user?.email?.charAt(0).toUpperCase() ?? '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-serif text-lg font-medium truncate">{user?.email}</p>
                          <p className="text-xs text-cream/60 mt-0.5">
                            Cliente desde {new Date(user?.created_at ?? Date.now()).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <span className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-moss/20 text-cream text-[10px] font-bold uppercase tracking-[0.12em] rounded-full border border-moss/30">
                          <span className="w-1.5 h-1.5 bg-moss-lighter rounded-full" /> Conta Ativa
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 divide-x divide-rim">
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Pedidos</p>
                        <p className="font-serif text-xl font-bold text-espresso mt-0.5">{orders.length}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Favoritos</p>
                        <p className="font-serif text-xl font-bold text-espresso mt-0.5">{favorites.length}</p>
                      </div>
                      <div className="p-4 text-center">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-muted">Endereços</p>
                        <p className="font-serif text-xl font-bold text-espresso mt-0.5">{addresses.length}</p>
                      </div>
                    </div>
                  </div>

                  {/* Dados de contato */}
                  <div className="bg-paper rounded-2xl border border-rim p-6 space-y-3">
                    <h2 className="font-serif text-lg font-medium text-espresso">Dados de Contato</h2>
                    <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl">
                      <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-wood" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">E-mail</p>
                        <p className="text-sm text-espresso truncate">{user?.email}</p>
                      </div>
                      <span className="text-[10px] font-medium text-moss bg-moss/10 px-2 py-1 rounded-full">Verificado</span>
                    </div>
                    <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl">
                      <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-wood" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] uppercase tracking-[0.12em] text-muted">Telefone</p>
                        <p className="text-sm text-muted">Adicione ao cadastrar um endereço de entrega.</p>
                      </div>
                      <button
                        onClick={() => setTab('addresses')}
                        className="text-xs font-medium text-wood hover:underline flex-shrink-0"
                      >
                        Gerenciar →
                      </button>
                    </div>
                  </div>

                  {/* Zona de segurança */}
                  <div className="bg-paper rounded-2xl border border-rim p-6 space-y-3">
                    <h2 className="font-serif text-lg font-medium text-espresso">Segurança</h2>
                    <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl">
                      <div className="w-9 h-9 bg-wood/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-4 h-4 text-wood" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-espresso">Sessão ativa</p>
                        <p className="text-xs text-muted">Você está conectado(a) neste dispositivo.</p>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" /> Sair
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AddressForm({
  address, onCancel, onSaved,
}: {
  address: CustomerAddress | null;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [form, setForm] = useState({
    label: address?.label ?? 'Casa',
    recipient_name: address?.recipient_name ?? '',
    cep: address?.cep ?? '',
    address: address?.address ?? '',
    city: address?.city ?? '',
    state: address?.state ?? '',
    phone: address?.phone ?? '',
    is_default: address?.is_default ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    if (!form.recipient_name || !form.cep || !form.address) {
      setError('Preencha nome, CEP e endereço.');
      return;
    }
    setSaving(true);
    setError(null);

    if (form.is_default) {
      await supabase.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id);
    }

    if (address) {
      await supabase.from('customer_addresses')
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq('id', address.id);
    } else {
      await supabase.from('customer_addresses')
        .insert({ ...form, user_id: user.id });
    }
    setSaving(false);
    onSaved();
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[11px] uppercase tracking-[0.12em] text-muted";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-paper rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-rim">
          <h2 className="font-serif text-lg font-bold text-espresso">{address ? 'Editar Endereço' : 'Novo Endereço'}</h2>
          <button onClick={onCancel} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className={labelClass}>Apelido (Casa, Trabalho...)</label>
            <input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Nome do destinatário *</label>
            <input value={form.recipient_name} onChange={e => setForm({ ...form, recipient_name: e.target.value })} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>CEP *</label>
              <input value={form.cep} onChange={e => setForm({ ...form, cep: e.target.value.replace(/\D/g, '').slice(0, 8) })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Estado (UF)</label>
              <input value={form.state} onChange={e => setForm({ ...form, state: e.target.value.toUpperCase().slice(0, 2) })} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Endereço completo *</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, complemento, bairro" className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cidade</label>
              <input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={e => setForm({ ...form, is_default: e.target.checked })}
              className="w-4 h-4 rounded border-rim text-wood focus:ring-wood"
            />
            Definir como endereço padrão
          </label>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button onClick={onCancel} className="px-4 py-2.5 text-sm font-medium text-muted border border-rim rounded-lg hover:bg-cream transition-colors">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? 'Salvando...' : (<><Check className="w-4 h-4" /> Salvar Endereço</>)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
