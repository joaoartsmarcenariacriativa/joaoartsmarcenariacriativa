import { useState } from 'react';
import { LayoutDashboard, Package, ShoppingBag, LogOut, Hammer, Menu, X, Image, Tag, Settings, FileText, Truck, BookOpen, Megaphone, Users, Star, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AdminDashboard from './admin/AdminDashboard';
import AdminProducts from './admin/AdminProducts';
import AdminOrders from './admin/AdminOrders';
import AdminBanners from './admin/AdminBanners';
import AdminCategories from './admin/AdminCategories';
import AdminSettings from './admin/AdminSettings';
import AdminContent from './admin/AdminContent';
import AdminShipping from './admin/AdminShipping';
import AdminEbooks from './admin/AdminEbooks';
import AdminAutomations from './admin/AdminAutomations';
import AdminContacts from './admin/AdminContacts';
import AdminReviews from './admin/AdminReviews';
import AdminPayments from './admin/AdminPayments';

type AdminTab = 'dashboard' | 'products' | 'orders' | 'ebooks' | 'reviews' | 'banners' | 'categories' | 'settings' | 'shipping' | 'payments' | 'content' | 'automations' | 'contacts';

interface AdminPanelProps {
  onNavigate: (path: string) => void;
}

export default function AdminPanel({ onNavigate }: AdminPanelProps) {
  const { signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products' as const, label: 'Produtos', icon: Package },
    { id: 'orders' as const, label: 'Pedidos', icon: ShoppingBag },
    { id: 'ebooks' as const, label: 'E-books', icon: BookOpen },
    { id: 'reviews' as const, label: 'Avaliações', icon: Star },
    { id: 'banners' as const, label: 'Banners', icon: Image },
    { id: 'categories' as const, label: 'Categorias', icon: Tag },
    { id: 'shipping' as const, label: 'Transportadoras', icon: Truck },
    { id: 'payments' as const, label: 'Pagamentos', icon: CreditCard },
    { id: 'automations' as const, label: 'Automações', icon: Megaphone },
    { id: 'contacts' as const, label: 'Contatos', icon: Users },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
    { id: 'content' as const, label: 'Conteúdo', icon: FileText },
  ];

  const handleSignOut = async () => {
    await signOut();
    onNavigate('/');
  };

  return (
    <div className="min-h-screen bg-cream flex">
      <aside
        className={`${
          sidebarOpen ? 'fixed inset-0 z-40' : 'hidden'
        } lg:static lg:z-auto lg:block`}
      >
        {sidebarOpen && (
          <div
            className="absolute inset-0 bg-espresso/60 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <div
          className={`${
            sidebarOpen ? 'fixed left-0 top-0 h-full' : ''
          } w-64 bg-espresso text-cream min-h-screen flex flex-col lg:relative lg:translate-x-0 transition-transform`}
        >
          <div className="p-5 border-b border-espresso-tint">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-espresso-tint border border-espresso-tint rounded-lg flex items-center justify-center">
                  <Hammer className="w-5 h-5 text-cream" />
                </div>
                <div className="leading-tight">
                  <p className="font-serif text-base font-medium text-cream">João Art's</p>
                  <p className="text-[9px] uppercase tracking-[0.15em] text-cream/40">Painel Admin</p>
                </div>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-cream/40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === item.id
                    ? 'bg-wood text-cream'
                    : 'text-cream/40 hover:bg-espresso-tint hover:text-wood'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-3 border-t border-espresso-tint space-y-1">
            <button
              onClick={() => onNavigate('/')}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/40 hover:bg-espresso-tint hover:text-wood transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              Ver Loja
            </button>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-cream/40 hover:bg-red-900/30 hover:text-red-400 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="lg:hidden bg-paper border-b border-rim px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 hover:bg-rim/50 rounded-lg">
            <Menu className="w-5 h-5 text-espresso" />
          </button>
          <p className="font-serif font-medium text-espresso">Painel Admin</p>
          <div className="w-7" />
        </div>

        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {tab === 'dashboard' && <AdminDashboard />}
          {tab === 'products' && <AdminProducts />}
          {tab === 'orders' && <AdminOrders />}
          {tab === 'ebooks' && <AdminEbooks />}
          {tab === 'reviews' && <AdminReviews />}
          {tab === 'banners' && <AdminBanners />}
          {tab === 'categories' && <AdminCategories />}
          {tab === 'settings' && <AdminSettings />}
          {tab === 'shipping' && <AdminShipping />}
          {tab === 'payments' && <AdminPayments />}
          {tab === 'automations' && <AdminAutomations />}
          {tab === 'contacts' && <AdminContacts />}
          {tab === 'content' && <AdminContent />}
        </div>
      </div>
    </div>
  );
}
