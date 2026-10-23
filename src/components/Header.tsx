import { useState } from 'react';
import { Menu, X, ShoppingBag, Hammer, User, Heart, GraduationCap } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useStoreSettings } from '@/context/StoreSettingsContext';
import { useFavorites } from '@/hooks/useFavorites';
import SearchBar from './SearchBar';

interface HeaderProps {
  onNavigate: (path: string) => void;
  currentPath: string;
}

export default function Header({ onNavigate, currentPath }: HeaderProps) {
  const { totalItems, openCart } = useCart();
  const { isAdmin, isCustomer, user, signOut } = useAuth();
  const { favoriteIds } = useFavorites();
  const { settings } = useStoreSettings();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const storeName = settings?.store_short_name || 'João Art\'s';
  const storeTagline = settings?.store_tagline || 'Marcenaria Criativa';
  const announcementEnabled = settings?.announcement_enabled ?? true;
  const announcement = settings?.announcement_text || 'Parcelamos em até 12x sem juros • Produtos artesanais feitos à mão';
  const logoUrl = settings?.logo_url;

  const navLinks = [
    { label: 'Início', path: '/' },
    { label: 'Produtos', path: '/produtos' },
    { label: 'Cozinha & Churrasco', path: '/produtos?cat=cozinha-churrasco' },
    { label: 'Decoração', path: '/produtos?cat=decoracao' },
    { label: 'E-books', path: '/ebooks' },
    { label: 'Natal', path: '/produtos?cat=natal' },
  ];

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <>
      {announcementEnabled && (
        <div className="bg-espresso text-cream text-center py-2 text-[11px] tracking-wide px-4 font-medium">
          {announcement}
        </div>
      )}

      <header className="bg-paper border-b border-rim sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-4 h-16">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 -ml-1.5 hover:bg-rim/50 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-espresso" />
              ) : (
                <Menu className="w-5 h-5 text-espresso" />
              )}
            </button>

            <button
              onClick={() => handleNavigate('/')}
              className="flex items-center gap-3 flex-shrink-0"
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={storeName}
                  className="w-10 h-10 rounded-lg border border-rim object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-wood rounded-lg flex items-center justify-center">
                  <Hammer className="w-5 h-5 text-cream" />
                </div>
              )}
              <div className="hidden sm:block leading-tight">
                <p className="font-serif text-xl font-medium text-espresso">{storeName}</p>
                <p className="text-[10px] tracking-[0.15em] uppercase text-muted">
                  {storeTagline}
                </p>
              </div>
            </button>

            <SearchBar onNavigate={handleNavigate} />

            <div className="flex items-center gap-2 ml-auto">
              {isCustomer && (
                <button
                  onClick={() => handleNavigate('/area-de-membros')}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
                  title="Área de Membros"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Meus Cursos</span>
                </button>
              )}

              {isCustomer && (
                <button
                  onClick={() => handleNavigate('/minha-conta')}
                  className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
                  title="Meus Favoritos"
                >
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Favoritos</span>
                  {favoriteIds.size > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-cream text-[10px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full px-1">
                      {favoriteIds.size}
                    </span>
                  )}
                </button>
              )}

              {isCustomer ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleNavigate('/minha-conta')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
                    title="Minha Conta"
                  >
                    <User className="w-4 h-4" />
                    <span className="hidden sm:inline max-w-[100px] truncate">
                      {user?.email?.split('@')[0] ?? 'Minha Conta'}
                    </span>
                  </button>
                  <button
                    onClick={async () => { await signOut(); handleNavigate('/'); }}
                    className="px-2 py-2 text-xs font-medium text-muted hover:text-red-600 transition-colors"
                    title="Sair"
                  >
                    <span className="hidden sm:inline">Sair</span>
                  </button>
                </div>
              ) : !isAdmin ? (
                <button
                  onClick={() => handleNavigate('/entrar')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
                  title="Entrar / Cadastrar"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Entrar</span>
                </button>
              ) : null}

              {isAdmin && (
                <button
                  onClick={() => handleNavigate('/admin')}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted hover:text-wood transition-colors"
                  title="Área do João"
                >
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">Área do João</span>
                </button>
              )}

              <button
                onClick={openCart}
                className="relative p-2 hover:bg-rim/50 rounded-lg transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-espresso" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-wood text-cream text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-1 h-11">
            {navLinks.map(link => {
              const isActive =
                currentPath === link.path ||
                (link.path === '/produtos' && currentPath.startsWith('/produtos'));
              return (
                <button
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-wood'
                      : 'text-muted hover:text-wood'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-rim bg-paper">
            <nav className="max-w-7xl mx-auto px-4 py-3 space-y-1">
              {navLinks.map(link => (
                <button
                  key={link.path}
                  onClick={() => handleNavigate(link.path)}
                  className="block w-full text-left px-3 py-2 text-sm font-medium text-muted hover:text-wood transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-2">
                <div className="relative md:hidden">
                  <input
                    type="text"
                    placeholder="Buscar produtos..."
                    onChange={e => {
                      if (e.target.value.length >= 2) {
                        handleNavigate(`/produtos?q=${encodeURIComponent(e.target.value)}`);
                      }
                    }}
                    className="w-full px-4 py-2 text-sm bg-cream border border-rim rounded-full focus:outline-none focus:border-wood transition-colors"
                  />
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
