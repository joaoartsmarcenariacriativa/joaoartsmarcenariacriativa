import { ShieldCheck, Package, Truck } from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface PolicyPageProps {
  type: 'privacidade' | 'trocas' | 'entregas' | 'termos';
  onNavigate: (path: string) => void;
}

const POLICY_META = {
  privacidade: { icon: ShieldCheck, title: 'Política de Privacidade', contentKey: 'policy_privacidade' },
  trocas: { icon: Package, title: 'Política de Trocas e Devoluções', contentKey: 'policy_trocas' },
  entregas: { icon: Truck, title: 'Política de Envio e Entregas', contentKey: 'policy_entregas' },
  termos: { icon: ShieldCheck, title: 'Termos de Uso', contentKey: 'policy_termos' },
};

function parsePolicySections(value: string): { heading: string; text: string }[] {
  return value
    .split('||')
    .map(s => {
      const [heading, ...textParts] = s.split('|');
      return { heading: heading ?? '', text: textParts.join('|') };
    })
    .filter(s => s.heading.trim() || s.text.trim());
}

const DEFAULT_POLICIES: Record<string, string> = {
  policy_privacidade: 'Coleta de Dados|A João Art\'s Marcenaria Criativa coleta apenas os dados necessários para processar seus pedidos, incluindo nome, e-mail, telefone e endereço de entrega. Não compartilhamos seus dados com terceiros, exceto quando necessário para a entrega (transportadoras) ou por obrigação legal.||Uso dos Dados|Seus dados são utilizados exclusivamente para: processamento de pedidos, comunicação sobre o status do pedido, envio de código de rastreio e suporte ao cliente. Não enviamos spam nem vendemos seus dados.||LGPD|Em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), você tem direito a acessar, corrigir ou solicitar a exclusão de seus dados a qualquer momento. Para isso, entre em contato pelo e-mail joaoartsmarcenariacriativa@gmail.com.||Cookies|Utilizamos cookies essenciais para o funcionamento da loja, como carrinho de compras e preferências. Você pode gerenciar os cookies nas configurações do seu navegador.',
  policy_trocas: 'Prazo para Devolução|Você tem até 7 dias corridos após o recebimento para solicitar a devolução de produtos não personalizados, conforme o Código de Defesa do Consumidor. Produtos personalizados não podem ser devolvidos, exceto em caso de defeito de fabricação.||Condições|O produto deve ser devolvido em sua embalagem original, sem sinais de uso e com todos os acessórios. O custo de envio da devolução é por nossa conta em caso de defeito, e por conta do cliente em caso de desistência.||Reembolso|O reembolso será processado em até 10 dias úteis após o recebimento e conferência do produto. O valor será estornado no mesmo método de pagamento utilizado na compra.||Garantia de Fábrica|Todos os nossos produtos possuem garantia de 90 dias contra defeitos de fabricação. Não cobrimos danos causados por mau uso, exposição excessiva à umidade ou falta de manutenção conforme as instruções de cuidados.',
  policy_entregas: 'Prazo de Produção|Cada peça é feita à mão e possui um prazo de produção artesanal específico, que varia de 2 a 15 dias úteis conforme o produto. Este prazo está indicado em cada página de produto.||Prazo de Entrega|O prazo total de entrega é a soma do prazo de produção + prazo de transporte. O transporte varia conforme a região, geralmente entre 3 a 10 dias úteis. O prazo total é calculado no momento da compra.||Frete Grátis|Oferecemos frete grátis para compras acima de R$ 200,00 para todo o Brasil. Para compras menores, o valor do frete é calculado no carrinho com base no CEP de destino.||Rastreamento|Após o envio, você receberá o código de rastreio por e-mail e WhatsApp. Você pode acompanhar seu pedido diretamente no site dos Correios ou da transportadora.',
  policy_termos: 'Aceitação|Ao acessar e utilizar este site, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.||Produtos|Por se tratarem de produtos artesanais em madeira, pode haver variação natural de cor, veios e textura entre as peças. As imagens são ilustrativas e cada peça é única.||Preços e Disponibilidade|Os preços e a disponibilidade dos produtos podem sofrer alterações sem aviso prévio. O pedido só é confirmado após a aprovação do pagamento.||Propriedade Intelectual|Todo o conteúdo deste site, incluindo textos, imagens, logotipos e designs, é propriedade da João Art\'s Marcenaria Criativa e protegido por leis de direitos autorais.',
};

export default function PolicyPage({ type, onNavigate }: PolicyPageProps) {
  const { content, settings } = useStoreSettings();
  const meta = POLICY_META[type];
  const Icon = meta.icon;

  const rawValue = content[meta.contentKey] ?? DEFAULT_POLICIES[meta.contentKey] ?? '';
  const sections = parsePolicySections(rawValue);
  const emailContact = settings?.email_contact || 'joaoartsmarcenariacriativa@gmail.com';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <button
        onClick={() => onNavigate('/')}
        className="text-xs font-medium text-muted hover:text-wood mb-6 transition-colors"
      >
        ← Voltar ao início
      </button>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-wood/10 rounded-xl flex items-center justify-center">
          <Icon className="w-6 h-6 text-wood" />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">{meta.title}</h1>
      </div>

      <div className="rounded-2xl border border-rim bg-paper shadow-soft p-6 sm:p-8 space-y-6">
        {sections.length > 0 ? (
          sections.map((section, idx) => (
            <div key={idx}>
              <h2 className="font-serif text-lg font-medium text-espresso mb-2">{section.heading}</h2>
              <p className="text-sm text-muted leading-relaxed">{section.text}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted text-center">Conteúdo desta política ainda não foi cadastrado.</p>
        )}
      </div>

      <div className="mt-8 p-4 bg-paper rounded-xl shadow-soft text-center">
        <p className="text-sm text-muted">
          Em caso de dúvidas, entre em contato:{' '}
          <a href={`mailto:${emailContact}`} className="text-wood font-medium hover:underline">
            {emailContact}
          </a>
        </p>
      </div>
    </div>
  );
}
