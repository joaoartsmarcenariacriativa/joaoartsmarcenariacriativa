import { useState, useEffect } from 'react';
import { Hammer, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export default function AdminLogin({ onNavigate }: AdminLoginProps) {
  const { signInWithEmail, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      onNavigate('/admin');
    }
  }, [isAdmin, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await signInWithEmail(email, password);
    if (signInError) {
      setError('E-mail ou senha incorretos. Verifique suas credenciais.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-cream/40 hover:text-wood text-xs font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a loja
        </button>

        <div className="bg-cream rounded-2xl shadow-lift overflow-hidden">
          <div className="bg-espresso px-6 py-8 text-center">
            <div className="w-16 h-16 bg-espresso-tint border border-espresso-tint rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Hammer className="w-8 h-8 text-cream" />
            </div>
            <h1 className="font-serif text-xl font-medium text-cream">Área do João</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-cream/40 mt-1">Painel Administrativo Restrito</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted">E-mail</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase tracking-[0.12em] text-muted">Senha</label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Painel'}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-rim" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-cream px-2 text-muted">ou</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.location.href = `${import.meta.env.VITE_SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${window.location.origin}/admin`;
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-rim rounded-lg text-sm font-medium text-espresso hover:bg-paper transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continuar com o Google
            </button>
          </form>

          <div className="px-6 pb-6 text-center">
            <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
              Acesso restrito ao administrador autorizado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
