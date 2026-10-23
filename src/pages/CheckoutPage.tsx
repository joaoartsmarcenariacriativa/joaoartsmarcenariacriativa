import { useState, useEffect } from 'react';
import { Check, QrCode, CreditCard, FileText, ArrowLeft, ShieldCheck, Lock, Truck, Loader2, AlertCircle } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useAuth } from '@/context/AuthContext';
import { formatBRL, generateOrderNumber } from '@/lib/format';
import { supabase } from '@/lib/supabase';
import { fetchShippingQuote } from '@/lib/shipping';
import type { ShippingQuoteOption, Product } from '@/types';

interface CheckoutPageProps {
  onNavigate: (path: string) => void;
}

export default function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { items, subtotal, clearCart, shippingOption, setShippingOption, customerCep, setCustomerCep } = useCart();
  const { settings } = useStoreSettings();
  const { user, isCustomer } = useAuth();
  const pixDiscountPercent = settings?.pix_discount_percent ?? 5;
  const maxInstallments = settings?.max_installments ?? 12;
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 200;
  const freeShippingEnabled = settings?.free_shipping_enabled ?? false;
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, setOrderId] = useState<string | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [checkoutShippingOptions, setCheckoutShippingOptions] = useState<ShippingQuoteOption[] | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: '', email: '', phone: '', cep: customerCep ?? '', address: '', city: '', state: '',
  });

  // Pré-preenche o e-mail do cliente logado
  useEffect(() => {
    if (isCustomer && user?.email && !customer.email) {
      setCustomer(prev => ({ ...prev, email: user.email ?? '' }));
    }
  }, [isCustomer, user, customer.email]);

  // Carrega o endereço padrão salvo do cliente logado
  const loadDefaultAddress = async () => {
    if (!isCustomer || !user) return;
    const { data } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .maybeSingle();
    if (data) {
      const addr = data as { recipient_name: string; cep: string; address: string; city: string; state: string; phone: string };
      setCustomer(prev => ({
        ...prev,
        name: addr.recipient_name || prev.name,
        phone: addr.phone || prev.phone,
        cep: addr.cep || prev.cep,
        address: addr.address || prev.address,
        city: addr.city || prev.city,
        state: addr.state || prev.state,
      }));
    }
  };

  useEffect(() => {
    loadDefaultAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCustomer, user]);

  const calculateCheckoutShipping = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    setShippingLoading(true);
    setShippingError(null);
    setCheckoutShippingOptions(null);
    setShippingOption(null);

    const productIds = items.map(i => i.product_id);
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .in('id', productIds);

    const productMap = new Map<string, Product>();
    (products as Product[] ?? []).forEach(p => productMap.set(p.id, p));

    const quoteProducts = items.map(item => {
      const p = productMap.get(item.product_id);
      return {
        weight_g: (p?.ship_weight_g ?? 500) + (p?.ship_packaging_weight_g ?? 0),
        length_cm: (p?.ship_length_cm ?? 20) + (p?.ship_packaging_cm ?? 0),
        width_cm: (p?.ship_width_cm ?? 20) + (p?.ship_packaging_cm ?? 0),
        height_cm: (p?.ship_height_cm ?? 10) + (p?.ship_packaging_cm ?? 0),
        declared_value: p?.ship_declared_value ?? item.price * item.quantity,
        quantity: item.quantity,
      };
    });

    const { options, error } = await fetchShippingQuote(cleanCep, quoteProducts);
    setShippingLoading(false);
    if (error) {
      setShippingError(error);
    } else {
      setCheckoutShippingOptions(options);
    }
  };

  // Calcula frete automaticamente quando o CEP atinge 8 dígitos
  useEffect(() => {
    const cleanCep = customer.cep.replace(/\D/g, '');
    if (cleanCep.length === 8 && !checkoutShippingOptions && !shippingLoading && !freeShipping) {
      calculateCheckoutShipping(cleanCep);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer.cep]);

  const pixDiscount = Math.round(subtotal * (pixDiscountPercent / 100) * 100) / 100;
  const freeShipping = freeShippingEnabled && subtotal >= freeShippingThreshold;
  const shippingCost = freeShipping ? 0 : (shippingOption?.price ?? 0);
  const pixTotal = (subtotal - pixDiscount) + shippingCost;
  const cardTotal = subtotal + shippingCost;
  const boletoTotal = subtotal + shippingCost;
  const finalTotal = paymentMethod === 'pix' ? pixTotal : paymentMethod === 'boleto' ? boletoTotal : cardTotal;

  const canProceedStep1 = customer.name && customer.email && customer.phone && customer.cep && customer.address && marketingOptIn && (freeShipping || !!shippingOption);

  const handleSubmit = async () => {
    setLoading(true);
    setSubmitError(null);
    const orderNum = generateOrderNumber();

    // 1. Create the order via SECURITY DEFINER function (safe insert)
    const { data: order, error: orderError } = await supabase.rpc('create_order', {
      p_payload: {
        order_number: orderNum,
        customer_name: customer.name,
        email: customer.email,
        phone: customer.phone,
        cep: customer.cep,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        total: finalTotal,
        shipping_cost: shippingCost,
        status: 'recebido',
        payment_method: paymentMethod,
        payment_status: 'pending',
        marketing_opt_in: marketingOptIn,
        customer_id: (isCustomer && user) ? user.id : '',
        shipping_carrier_name: shippingOption?.carrier ?? '',
        shipping_service_name: shippingOption?.name ?? '',
        shipping_gateway: shippingOption?.gateway ?? '',
        shipping_service_id: shippingOption?.service_id ?? '',
      } as unknown as Record<string, unknown>,
    });

    if (orderError || !order) {
      setLoading(false);
      setSubmitError('Erro ao registrar pedido. Tente novamente.');
      return;
    }

    // 2. Save order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      price: item.price,
      quantity: item.quantity,
      variation: item.variation,
    }));
    const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
    if (itemsError) {
      setSubmitError('Pedido criado mas houve erro ao salvar itens: ' + itemsError.message);
      setLoading(false);
      return;
    }

    // 3. Verifica se o Mercado Pago está ativado
    if (settings?.mp_enabled && settings.mp_access_token) {
      // Chama a edge function para criar a preferência no Mercado Pago
      const mpApiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mp-checkout`;
      const mpHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (import.meta.env.VITE_SUPABASE_ANON_KEY) {
        mpHeaders['Authorization'] = `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`;
      }

      const backUrl = `${window.location.origin}/pedido-confirmado`;

      const mpItems = items.map(item => ({
        id: item.product_id,
        title: item.product_name,
        description: item.variation ? `${item.product_name} - ${item.variation}` : item.product_name,
        picture_url: item.product_image,
        category_id: 'others',
        quantity: item.quantity,
        unit_price: item.price,
      }));

      try {
        const response = await fetch(mpApiUrl, {
          method: 'POST',
          headers: mpHeaders,
          body: JSON.stringify({
            items: mpItems,
            orderNumber: orderNum,
            customer: { name: customer.name, email: customer.email, phone: customer.phone, cep: customer.cep, address: customer.address, city: customer.city, state: customer.state },
            shippingCost,
            total: finalTotal,
            paymentMethod,
            backUrl,
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.init_point) {
          throw new Error(data.error || 'Não foi possível iniciar o pagamento no Mercado Pago. Verifique se as credenciais estão configuradas no painel admin.');
        }

        // Atualiza o pedido com o ID da preferência (via SECURITY DEFINER function)
        await supabase.rpc('set_order_notes', {
          p_order_id: order.id,
          p_notes: `MP Preference: ${data.preference_id}`,
        });

        // Redireciona o cliente para o Checkout Pro do Mercado Pago
        window.location.href = data.init_point;
        return;
      } catch (mpErr) {
        // Se o Mercado Pago falhar, o pedido já está salvo — avisa o cliente
        setSubmitError(mpErr instanceof Error ? mpErr.message : 'Erro ao conectar com o Mercado Pago. Tente novamente.');
        setLoading(false);
        return;
      }
    }

    // 4. Sem gateway configurado — marca como pendente (modo simulação)
    setOrderId(order.id);
    setOrderNumber(orderNum);
    setLoading(false);
    setOrderComplete(true);
    clearCart();
  };

  if (orderComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-20 h-20 bg-moss/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-moss" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-espresso mb-2">Pedido Confirmado!</h1>
        <p className="text-muted mb-1">Seu pedido foi registrado com sucesso.</p>
        <p className="text-muted mb-6">
          Número do pedido: <span className="font-semibold text-wood">{orderNumber}</span>
        </p>

        <div className="bg-paper rounded-2xl shadow-soft p-6 text-left space-y-3 mb-6">
          <h3 className="font-serif text-lg font-medium text-espresso">Próximos passos:</h3>
          <div className="space-y-2 text-sm text-muted">
            <p>1. Você receberá um e-mail com os detalhes do pedido</p>
            <p>2. Após a confirmação do pagamento, iniciaremos a produção artesanal</p>
            <p>3. O prazo de produção é de 3 a 15 dias úteis</p>
            <p>4. Enviaremos o código de rastreio por WhatsApp e e-mail</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => onNavigate('/')}
            className="px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
          >
            Voltar ao Início
          </button>
          <button
            onClick={() => onNavigate('/produtos')}
            className="px-8 py-3 border border-rim text-espresso font-medium rounded-lg hover:bg-paper transition-colors"
          >
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <p className="text-muted text-lg">Seu carrinho está vazio</p>
        <button
          onClick={() => onNavigate('/produtos')}
          className="mt-4 px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors"
        >
          Ver Produtos
        </button>
      </div>
    );
  }

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[11px] uppercase tracking-[0.12em] text-muted";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <button
        onClick={() => onNavigate('/produtos')}
        className="flex items-center gap-1 text-xs font-medium text-muted hover:text-wood mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Continuar comprando
      </button>

      <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso mb-6">Finalizar Compra</h1>

      <div className="flex items-center gap-2 mb-8">
        {['Dados', 'Pagamento', 'Confirmação'].map((label, idx) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step > idx + 1
                  ? 'bg-moss text-cream'
                  : step === idx + 1
                  ? 'bg-wood text-cream'
                  : 'bg-rim text-muted'
              }`}
            >
              {step > idx + 1 ? <Check className="w-4 h-4" /> : idx + 1}
            </div>
            <span className={`text-xs font-medium ${step >= idx + 1 ? 'text-espresso' : 'text-muted'}`}>
              {label}
            </span>
            {idx < 2 && <div className="w-8 h-0.5 bg-rim mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="bg-paper rounded-2xl shadow-soft p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-medium text-espresso">Dados de Entrega</h2>
              {!isCustomer && (
                <div className="flex items-center justify-between gap-2 p-3 bg-wood/5 border border-wood/20 rounded-xl">
                  <p className="text-xs text-muted">
                    Já tem conta?{' '}
                    <button onClick={() => onNavigate('/entrar')} className="text-wood font-medium hover:underline">
                      Entrar
                    </button>{' '}
                    para acompanhar seus pedidos e favoritar produtos.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Nome completo *</label>
                  <input type="text" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>E-mail *</label>
                  <input type="email" value={customer.email} onChange={e => setCustomer({ ...customer, email: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Telefone / WhatsApp *</label>
                  <input type="tel" value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="(11) 99999-9999" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>CEP *</label>
                  <input type="text" value={customer.cep} onChange={e => {
                    const cep = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setCustomer({ ...customer, cep });
                    setCheckoutShippingOptions(null);
                    setShippingError(null);
                    setShippingOption(null);
                  }} placeholder="00000000" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Cidade</label>
                  <input type="text" value={customer.city} onChange={e => setCustomer({ ...customer, city: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Endereço completo *</label>
                  <input type="text" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="Rua, número, complemento, bairro" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Estado (UF)</label>
                  <input type="text" value={customer.state} onChange={e => setCustomer({ ...customer, state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="SP" className={inputClass} />
                </div>
              </div>

              {/* Opções de Frete */}
              {customer.cep.replace(/\D/g, '').length === 8 && (
                <div className="space-y-3 p-4 bg-cream rounded-xl border border-rim">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-wood" />
                    <p className="text-sm font-medium text-espresso">Opções de Frete</p>
                  </div>

                  {freeShipping ? (
                    <div className="flex items-center gap-2 p-3 bg-moss/10 rounded-lg border border-moss/20">
                      <Check className="w-4 h-4 text-moss" />
                      <p className="text-sm text-moss font-medium">Frete grátis aplicado para este pedido!</p>
                    </div>
                  ) : shippingLoading ? (
                    <div className="flex items-center gap-2 p-3">
                      <Loader2 className="w-4 h-4 text-wood animate-spin" />
                      <p className="text-sm text-muted">Calculando frete para o CEP {customer.cep}...</p>
                    </div>
                  ) : shippingError ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700">{shippingError}</p>
                      </div>
                      <button onClick={() => calculateCheckoutShipping(customer.cep)} className="text-xs font-medium text-wood hover:underline">
                        Tentar novamente
                      </button>
                    </div>
                  ) : checkoutShippingOptions && checkoutShippingOptions.length > 0 ? (
                    <div className="space-y-2">
                      {checkoutShippingOptions.map((opt, idx) => {
                        const isSelected = shippingOption?.name === opt.name && shippingOption?.price === opt.price;
                        const viaMatch = opt.name.match(/\(via\s+([^)]+)\)/);
                        const viaLabel = viaMatch ? viaMatch[1] : null;
                        const displayName = opt.name.replace(/\s*\(via\s+[^)]+\)/, '');
                        const isSuperFrete = viaLabel === 'SuperFrete';
                        return (
                          <button
                            key={idx}
                            onClick={() => setShippingOption(opt)}
                            className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected ? 'border-wood bg-wood/10' : 'border-rim hover:border-wood/50'
                            }`}
                          >
                            <div>
                              <p className="text-sm font-medium text-espresso">{displayName}</p>
                              <p className="text-[11px] text-muted">
                                {opt.days} dias úteis{opt.carrier && opt.carrier !== displayName ? ` • ${opt.carrier}` : ''}
                                {viaLabel && ` • via `}
                                {viaLabel && (
                                  <span className={`font-semibold ${isSuperFrete ? 'text-blue-700' : 'text-wood'}`}>
                                    {viaLabel}
                                  </span>
                                )}
                              </p>
                            </div>
                            <p className="text-sm font-semibold text-wood">{formatBRL(opt.price)}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : !checkoutShippingOptions ? (
                    <button
                      onClick={() => calculateCheckoutShipping(customer.cep)}
                      className="w-full py-2.5 text-sm font-medium text-wood border border-wood/30 rounded-lg hover:bg-wood/5 transition-colors"
                    >
                      Calcular frete
                    </button>
                  ) : (
                    <p className="text-xs text-muted">Nenhuma opção de frete disponível para este CEP.</p>
                  )}
                </div>
              )}

              {/* LGPD Opt-in */}
              <label className="flex items-start gap-3 p-3 bg-cream rounded-xl border border-rim cursor-pointer hover:border-wood/50 transition-colors">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-rim text-wood focus:ring-wood flex-shrink-0"
                />
                <span className="text-xs text-muted leading-relaxed">
                  Aceito receber ofertas e comunicações via e-mail e WhatsApp. (LGPD - Lei nº 13.709/2018)
                </span>
              </label>

              <button
                onClick={() => { setCustomerCep(customer.cep); setStep(2); }}
                disabled={!canProceedStep1}
                className="w-full py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continuar para Pagamento
              </button>
              {!shippingOption && !freeShipping && customer.cep.replace(/\D/g, '').length === 8 && (
                <p className="text-xs text-amber-600 text-center">Selecione uma opção de frete para continuar</p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="bg-paper rounded-2xl shadow-soft p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-medium text-espresso">Forma de Pagamento</h2>

              <div className="space-y-2">
                {[
                  { method: 'pix' as const, icon: QrCode, title: `Pix (${pixDiscountPercent}% de desconto)`, sub: 'Aprovação instantânea com QR Code', price: pixTotal, priceColor: 'text-moss' },
                  { method: 'card' as const, icon: CreditCard, title: 'Cartão de Crédito', sub: `Em até ${maxInstallments}x sem juros`, price: cardTotal, priceColor: 'text-espresso' },
                  { method: 'boleto' as const, icon: FileText, title: 'Boleto Bancário', sub: 'Vencimento em 3 dias úteis', price: boletoTotal, priceColor: 'text-espresso' },
                ].map(opt => (
                  <button
                    key={opt.method}
                    onClick={() => setPaymentMethod(opt.method)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                      paymentMethod === opt.method ? 'border-wood bg-wood/10' : 'border-rim hover:border-wood/50'
                    }`}
                  >
                    <opt.icon className="w-6 h-6 text-wood" />
                    <div className="flex-1">
                      <p className="font-serif font-medium text-espresso text-sm">{opt.title}</p>
                      <p className="text-[11px] text-muted">{opt.sub}</p>
                    </div>
                    <p className={`text-sm font-semibold ${opt.priceColor}`}>{formatBRL(opt.price)}</p>
                  </button>
                ))}
              </div>

              {paymentMethod === 'card' && (
                <div className="p-4 bg-wood/5 rounded-xl border border-wood/20">
                  <div className="flex items-start gap-2">
                    <CreditCard className="w-5 h-5 text-wood flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-espresso">Pagamento via Cartão no Mercado Pago</p>
                      <p className="text-xs text-muted mt-1">
                        Ao confirmar o pedido, você será redirecionado para o Mercado Pago, onde poderá escolher o cartão e o número de parcelas com segurança. Em até {maxInstallments}x sem juros.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'pix' && (
                <div className="p-4 bg-moss/10 rounded-xl border border-moss/20">
                  <p className="text-sm text-muted">
                    Ao confirmar, você será redirecionado para o Mercado Pago e verá um QR Code para pagar via Pix. O pagamento é aprovado instantaneamente.
                  </p>
                </div>
              )}

              {paymentMethod === 'boleto' && (
                <div className="p-4 bg-espresso/5 rounded-xl border border-espresso/20">
                  <p className="text-sm text-muted">
                    Ao confirmar, você será redirecionado para o Mercado Pago para gerar o boleto. O vencimento é de 3 dias úteis.
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="px-4 py-3 text-xs font-medium text-muted hover:text-wood transition-colors">Voltar</button>
                <button onClick={() => setStep(3)} className="flex-1 py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors">Revisar Pedido</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-paper rounded-2xl shadow-soft p-6 sm:p-8 space-y-4">
              <h2 className="font-serif text-xl font-medium text-espresso">Revise seu Pedido</h2>

              <div className="space-y-2">
                {items.map(item => (
                  <div key={`${item.product_id}-${item.variation ?? ''}`} className="flex items-center gap-3 p-3 bg-cream/60 rounded-xl border border-rim">
                    <img src={item.product_image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-sm font-medium text-espresso truncate">{item.product_name}</p>
                      <p className="text-[10px] text-muted">Qtd: {item.quantity}{item.variation && ` • ${item.variation}`}</p>
                    </div>
                    <p className="text-sm font-semibold text-espresso">{formatBRL(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-wood/5 rounded-xl border border-wood/20">
                <p className="text-sm text-muted">
                  Pagamento via:{' '}
                  <span className="font-medium text-espresso">
                    {paymentMethod === 'pix' ? `Pix (${pixDiscountPercent}% desconto)` : paymentMethod === 'card' ? 'Cartão de Crédito' : 'Boleto'}
                  </span>
                  <span className="block text-[11px] text-muted mt-1">Processado com segurança pelo Mercado Pago</span>
                </p>
              </div>

              <div className="p-3 bg-cream/60 rounded-xl border border-rim">
                <p className="font-serif text-sm font-medium text-espresso mb-1">Entrega para:</p>
                <p className="text-sm text-muted">{customer.name}</p>
                <p className="text-sm text-muted">{customer.address}, {customer.city} - {customer.state}</p>
                <p className="text-sm text-muted">CEP: {customer.cep}</p>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setStep(2)} className="px-4 py-3 text-xs font-medium text-muted hover:text-wood transition-colors">Voltar</button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="flex-1 py-3.5 bg-moss hover:bg-moss-light text-cream font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processando...' : (<><Lock className="w-4 h-4" /> Confirmar Pedido</>)}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.12em] text-muted">
                <ShieldCheck className="w-4 h-4" />
                Pagamento processado com segurança
              </div>



              {submitError && (
                <p className="text-sm text-red-600 text-center bg-red-50 rounded-lg p-3">{submitError}</p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-paper rounded-2xl shadow-soft p-6 sticky top-24">
            <h3 className="font-serif text-lg font-medium text-espresso mb-3">Resumo do Pedido</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span>{formatBRL(subtotal)}</span>
              </div>
              {paymentMethod === 'pix' && (
                <div className="flex justify-between text-moss">
                  <span>Desconto Pix ({pixDiscountPercent}%)</span>
                  <span>-{formatBRL(pixDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted">
                <span>Frete</span>
                <span>{freeShipping ? 'Grátis' : shippingCost > 0 ? formatBRL(shippingCost) : 'A calcular'}</span>
              </div>
              <div className="border-t border-rim pt-2 flex justify-between font-semibold text-espresso">
                <span className="font-serif text-lg">Total</span>
                <span className="text-lg">{formatBRL(finalTotal)}</span>
              </div>
              {paymentMethod === 'card' && (
                <p className="text-[11px] text-muted text-center pt-1">
                  Em até {maxInstallments}x sem juros no Mercado Pago
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
