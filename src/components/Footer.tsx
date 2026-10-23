import { Hammer, Instagram, Facebook, Mail, Phone, MessageCircle, Shield } from 'lucide-react';
import { useStoreSettings } from '@/context/StoreSettingsContext';

interface FooterProps {
  onNavigate: (path: string) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const { settings, getText } = useStoreSettings();

  const storeName = settings?.store_name || 'João Art\'s';
  const storeTagline = settings?.store_tagline || 'Marcenaria Criativa';
  const footerAbout = settings?.footer_about || 'Peças artesanais em madeira, feitas com dedicação e amor. Tábuas, móveis, decorações e muito mais para sua casa.';
  const emailContact = settings?.email_contact || 'joaoartsmarcenariacriativa@gmail.com';
  const cnpj = settings?.cnpj || '00.000.000/0001-00';
  const whatsappNumber = settings?.whatsapp_number || '5511999999999';
  const whatsappMessage = settings?.whatsapp_message || 'Olá, vim pelo site da João Art\'s';
  const instagramUrl = settings?.instagram_url;
  const facebookUrl = settings?.facebook_url;
  const logoUrl = settings?.logo_url;

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

  const navTitle = getText('footer_nav_title', 'Navegação');
  const policiesTitle = getText('footer_policies_title', 'Políticas');
  const contactTitle = getText('footer_contact_title', 'Atendimento');

  return (
    <footer className="bg-espresso text-cream mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="w-10 h-10 rounded-lg border border-espresso-tint object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-espresso-tint rounded-lg flex items-center justify-center border border-espresso-tint">
                  <Hammer className="w-5 h-5 text-cream" />
                </div>
              )}
              <div className="leading-tight">
                <p className="font-serif text-xl font-medium text-cream">{storeName}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-cream/40">{storeTagline}</p>
              </div>
            </div>
            <p className="text-sm text-cream/60 leading-relaxed">
              {footerAbout}
            </p>
            <div className="flex gap-2 mt-4">
              {instagramUrl && (
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-espresso-tint border border-espresso-tint hover:border-wood hover:text-wood rounded-lg transition-colors"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {facebookUrl && (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-espresso-tint border border-espresso-tint hover:border-wood hover:text-wood rounded-lg transition-colors"
                >
                  <Facebook className="w-4 h-4" />
                </a>
              )}
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-espresso-tint border border-espresso-tint hover:border-wood hover:text-wood rounded-lg transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/40 mb-4">{navTitle}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('/')} className="text-cream/70 hover:text-wood transition-colors">
                  Início
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/produtos')} className="text-cream/70 hover:text-wood transition-colors">
                  Todos os Produtos
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/produtos?cat=cozinha-churrasco')} className="text-cream/70 hover:text-wood transition-colors">
                  Cozinha & Churrasco
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/produtos?cat=natal')} className="text-cream/70 hover:text-wood transition-colors">
                  Coleção de Natal
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/ebooks')} className="text-cream/70 hover:text-wood transition-colors">
                  Vitrine de E-books
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/40 mb-4">{policiesTitle}</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button onClick={() => onNavigate('/politica/privacidade')} className="text-cream/70 hover:text-wood transition-colors">
                  Política de Privacidade
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/politica/trocas')} className="text-cream/70 hover:text-wood transition-colors">
                  Trocas e Devoluções
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/politica/entregas')} className="text-cream/70 hover:text-wood transition-colors">
                  Envio e Entregas
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/politica/termos')} className="text-cream/70 hover:text-wood transition-colors">
                  Termos de Uso
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-cream/40 mb-4">{contactTitle}</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-wood flex-shrink-0" />
                <a href={`mailto:${emailContact}`} className="text-cream/70 hover:text-wood transition-colors break-all">
                  {emailContact}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-wood flex-shrink-0" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-wood transition-colors">
                  WhatsApp
                </a>
              </li>
              <li className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-wood flex-shrink-0" />
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-wood transition-colors">
                  Chat Online
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-espresso-tint mt-8 pt-6 space-y-3">
          <div className="flex items-start gap-2 max-w-2xl">
            <Shield className="w-4 h-4 text-wood flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-cream/40 leading-relaxed">
              O processamento de pagamento e a entrega dos infoprodutos são realizados de forma segura pela plataforma parceira Hotmart.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] tracking-[0.12em] text-cream/40">
              © {new Date().getFullYear()} {storeName}. Todos os direitos reservados.
            </p>
            <p className="text-[11px] tracking-[0.12em] text-cream/40">
              CNPJ: {cnpj} • Made with wood and love
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
