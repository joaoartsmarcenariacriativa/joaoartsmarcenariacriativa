import { useState, useEffect } from 'react';
import { Check, Loader2, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatBRL } from '@/lib/format';
import { useCart } from '@/context/CartContext';

interface OrderReturnPageProps {
  onNavigate: (path: string) => void;
}

export default function OrderReturnPage({ onNavigate }: OrderReturnPageProps) {
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'success' | 'pending' | 'failure' | 'loading'>('loading');
  const [order, setOrder] = useState<{ order_number: string; total: number; customer_name: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('status');
    const orderNumber = params.get('order');

    if (!orderNumber) {
      setStatus('failure');
      return;
    }

    const updateOrder = async () => {
      const { data } = await supabase
        .rpc('process_payment_return', {
          p_order_number: orderNumber,
          p_payment_status: paymentStatus ?? 'failure',
        });

      if (data && data.length > 0) {
        const row = data[0];
        setOrder({ order_number: row.order_number, total: row.total, customer_name: row.customer_name });
      }

      if (paymentStatus === 'success') {
        setStatus('success');
        clearCart();
      } else if (paymentStatus === 'pending') {
        setStatus('pending');
      } else {
        setStatus('failure');
      }
    };

    updateOrder();
  }, []);

  if (status === 'loading') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-20 text-center">
        <Loader2 className="w-12 h-12 text-wood animate-spin mx-auto mb-4" />
        <p className="text-muted">Processando retorno do pagamento...</p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-20 h-20 bg-moss/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-moss" />
        </div>

        {/* Banner verde de aprovação */}
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
          <Check className="w-6 h-6 text-green-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-green-800 text-base">Pagamento Aprovado! Seu pedido já está em processamento.</p>
            <p className="text-xs text-green-700 mt-1">Confirmação registrada pelo Mercado Pago.</p>
          </div>
        </div>

        <h1 className="font-serif text-2xl font-medium text-espresso mb-2">Oba! Seu pagamento foi confirmado!</h1>
        <p className="text-muted mb-1">Seu pedido já está na nossa área de preparação e estamos organizando o envio.</p>
        {order && (
          <>
            <p className="text-muted mb-1">
              Número do pedido: <span className="font-semibold text-wood">{order.order_number}</span>
            </p>
            <p className="text-muted mb-6">Valor: <span className="font-semibold text-espresso">{formatBRL(order.total)}</span></p>
          </>
        )}

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
          <button onClick={() => onNavigate('/')} className="px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors">
            Voltar ao Início
          </button>
          <button onClick={() => onNavigate('/produtos')} className="px-8 py-3 border border-rim text-espresso font-medium rounded-lg hover:bg-paper transition-colors">
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
        {/* Banner amarelo de pendência */}
        <div className="bg-amber-50 border-2 border-amber-500 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-800 text-base">Pagamento Pendente. Aguardando confirmação do banco.</p>
            <p className="text-xs text-amber-700 mt-1">Seu pedido só entra em produção após a aprovação do pagamento.</p>
          </div>
        </div>

        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-10 h-10 text-amber-600" />
        </div>
        <h1 className="font-serif text-2xl font-medium text-espresso mb-2">Pagamento em Processamento</h1>
        <p className="text-muted mb-6">Seu pagamento está sendo processado. Assim que for confirmado, enviaremos um e-mail com os detalhes.</p>
        {order && (
          <p className="text-muted mb-6">
            Número do pedido: <span className="font-semibold text-wood">{order.order_number}</span>
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button onClick={() => onNavigate('/')} className="px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors">
            Voltar ao Início
          </button>
          <button onClick={() => onNavigate('/produtos')} className="px-8 py-3 border border-rim text-espresso font-medium rounded-lg hover:bg-paper transition-colors">
            Continuar Comprando
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 text-center">
      {/* Banner vermelho de recusa */}
      <div className="bg-red-50 border-2 border-red-500 rounded-xl p-4 mb-6 text-left flex items-start gap-3">
        <X className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-800 text-base">Pagamento Recusado pelo Banco. Por favor, tente novamente ou altere a forma de pagamento.</p>
          <p className="text-xs text-red-700 mt-1">Seu pedido permanece pendente e não entrará em separação.</p>
        </div>
      </div>

      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <X className="w-10 h-10 text-red-600" />
      </div>
      <h1 className="font-serif text-2xl font-medium text-espresso mb-2">Pagamento Não Concluído</h1>
      <p className="text-muted mb-6">O pagamento não foi finalizado. Você pode tentar novamente a qualquer momento.</p>
      {order && (
        <p className="text-muted mb-6">
          Número do pedido: <span className="font-semibold text-wood">{order.order_number}</span>
        </p>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={() => onNavigate('/checkout')} className="px-8 py-3 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Tentar Novamente
        </button>
        <button onClick={() => onNavigate('/produtos')} className="px-8 py-3 border border-rim text-espresso font-medium rounded-lg hover:bg-paper transition-colors">
          Continuar Comprando
        </button>
      </div>
    </div>
  );
}
