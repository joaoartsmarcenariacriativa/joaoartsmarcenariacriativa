import { useState, useEffect, useCallback } from 'react';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import HomePage from '@/pages/HomePage';
import ProductsPage from '@/pages/ProductsPage';
import ProductDetailPage from '@/pages/ProductDetailPage';
import CheckoutPage from '@/pages/CheckoutPage';
import OrderReturnPage from '@/pages/OrderReturnPage';
import PolicyPage from '@/pages/PolicyPage';
import AdminLogin from '@/pages/AdminLogin';
import AdminPanel from '@/pages/AdminPanel';
import EbooksPage from '@/pages/EbooksPage';
import EbookDetailPage from '@/pages/EbookDetailPage';
import MemberAreaPage from '@/pages/MemberAreaPage';
import MyOrdersPage from '@/pages/MyOrdersPage';
import CustomerLogin from '@/pages/CustomerLogin';
import MyAccountPage from '@/pages/MyAccountPage';
import PartnerPortal from '@/pages/PartnerPortal';

function AppContent() {
  const [path, setPath] = useState(window.location.pathname + window.location.search);
  const { isAdmin, loading: authLoading } = useAuth();

  useEffect(() => {
    const handlePopState = () => {
      setPath(window.location.pathname + window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((newPath: string) => {
    window.history.pushState({}, '', newPath);
    setPath(newPath);
    window.scrollTo(0, 0);
  }, []);

  const [pathname, search] = path.split('?');
  const searchParams = new URLSearchParams(search);

  // Admin routes
  if (pathname === '/admin/login') {
    return <AdminLogin onNavigate={navigate} />;
  }

  if (pathname.startsWith('/admin')) {
    if (authLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-espresso">
          <p className="text-xs font-medium text-cream/40">Carregando...</p>
        </div>
      );
    }
    if (!isAdmin) {
      return <AdminLogin onNavigate={navigate} />;
    }
    return <AdminPanel onNavigate={navigate} />;
  }

  // Partner portal
  if (pathname.startsWith('/parceiro/')) {
    const partnerSlug = pathname.split('/')[2];
    return <PartnerPortal slug={partnerSlug} onNavigate={navigate} />;
  }

  // Policy routes
  if (pathname.startsWith('/politica/')) {
    const policyType = pathname.split('/')[2] as 'privacidade' | 'trocas' | 'entregas' | 'termos';
    if (['privacidade', 'trocas', 'entregas', 'termos'].includes(policyType)) {
      return (
        <div className="min-h-screen bg-cream flex flex-col">
          <Header onNavigate={navigate} currentPath={pathname} />
          <main className="flex-1">
            <PolicyPage type={policyType} onNavigate={navigate} />
          </main>
          <Footer onNavigate={navigate} />
          <CartDrawer onNavigate={navigate} />
        </div>
      );
    }
  }

  // Product detail
  if (pathname.startsWith('/produto/')) {
    const slug = pathname.split('/')[2];
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <ProductDetailPage slug={slug} onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // E-book detail
  if (pathname.startsWith('/ebook/')) {
    const slug = pathname.split('/')[2];
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <EbookDetailPage slug={slug} onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // E-books vitrine
  if (pathname === '/ebooks') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <EbooksPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Member area (logged-in customers)
  if (pathname === '/area-de-membros') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <MemberAreaPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Customer login / signup
  if (pathname === '/entrar') {
    return <CustomerLogin onNavigate={navigate} />;
  }

  // My Account (logged-in customers)
  if (pathname === '/minha-conta') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <MyAccountPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // My Orders (no-auth order lookup by email)
  if (pathname === '/meus-pedidos') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <MyOrdersPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Checkout
  if (pathname === '/checkout') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <CheckoutPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Checkout return (Mercado Pago callback) — handles multiple URL aliases
  if (pathname === '/pedido-confirmado' || pathname === '/order-success' || pathname === '/order-confirmation' || pathname === '/order-pending' || pathname === '/order-failure') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <OrderReturnPage onNavigate={navigate} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Products
  if (pathname === '/produtos') {
    return (
      <div className="min-h-screen bg-cream flex flex-col">
        <Header onNavigate={navigate} currentPath={pathname} />
        <main className="flex-1">
          <ProductsPage onNavigate={navigate} searchParams={searchParams} />
        </main>
        <Footer onNavigate={navigate} />
        <CartDrawer onNavigate={navigate} />
      </div>
    );
  }

  // Home (default)
  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header onNavigate={navigate} currentPath={pathname} />
      <main className="flex-1">
        <HomePage onNavigate={navigate} />
      </main>
      <Footer onNavigate={navigate} />
      <CartDrawer onNavigate={navigate} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary onNavigate={(path) => window.location.assign(path)}>
      <AuthProvider>
        <StoreSettingsProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </StoreSettingsProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
