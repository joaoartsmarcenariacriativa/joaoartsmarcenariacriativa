import { useState, useEffect } from 'react';
import { Mail, Lock, User as UserIcon, ArrowLeft, AlertCircle, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

interface CustomerLoginProps {
  onNavigate: (path: string) => void;
}

export default function CustomerLogin({ onNavigate }: CustomerLoginProps) {
  const { signInWithEmail, signUpWithEmail, isCustomer, isAdmin } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCustomer) onNavigate('/minha-conta');
    else if (isAdmin) onNavigate('/admin');
  }, [isCustomer, isAdmin, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (mode === 'signup' && password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    if (mode === 'signup') {
      if (!marketingOptIn) {
        setError('É necessário aceitar receber comunicações para criar sua conta (LGPD Lei 13.709/2018).');
        setLoading(false);
        return;
      }
      const { error: signUpError } = await signUpWithEmail(email, password, {
        marketing_opt_in: marketingOptIn,
      });
      if (signUpError) {
        setError(signUpError);
        setLoading(false);
        return;
      }
      // Register as launch subscriber automatically (LGPD opt-in already collected)
      await supabase
        .from('ebook_launch_subscribers')
        .upsert({
          email: email.trim().toLowerCase(),
          source: 'site_signup',
        }, { onConflict: 'email' });
      // Try immediate sign-in (email confirmation is off)
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) {
        setInfo('Conta criada! Faça login para continuar.');
        setMode('login');
        setLoading(false);
        return;
      }
    } else {
      const { error: signInError } = await signInWithEmail(email, password);
      if (signInError) {
        setError('E-mail ou senha incorretos. Se não tem conta, cadastre-se.');
        setLoading(false);
        return;
      }
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-muted hover:text-wood text-xs font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para a loja
        </button>

        <div className="bg-paper rounded-2xl shadow-lift overflow-hidden border border-rim">
          <div className="bg-wood px-6 py-8 text-center">
            <div className="w-16 h-16 bg-wood-dark border border-wood-dark rounded-2xl flex items-center justify-center mx-auto mb-3">
              <UserIcon className="w-8 h-8 text-cream" />
            </div>
            <h1 className="font-serif text-xl font-medium text-cream">Minha Conta</h1>
            <p className="text-[10px] uppercase tracking-[0.15em] text-cream/70 mt-1">
              {mode === 'login' ? 'Acesse sua conta' : 'Crie sua conta'}
            </p>
          </div>

          <div className="flex border-b border-rim">
            <button
              onClick={() => { setMode('login'); setError(null); setInfo(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                mode === 'login' ? 'text-wood border-b-2 border-wood bg-wood/5' : 'text-muted hover:text-espresso'
              }`}
            >
              <LogIn className="w-4 h-4" /> Entrar
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setInfo(null); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'text-wood border-b-2 border-wood bg-wood/5' : 'text-muted hover:text-espresso'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Cadastrar
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {info && (
              <div className="p-3 bg-moss/10 border border-moss/30 rounded-lg text-sm text-moss">
                {info}
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
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
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] uppercase tracking-[0.12em] text-muted">Confirmar senha</label>
                <div className="relative mt-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3 py-2.5 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted leading-relaxed bg-cream border border-rim rounded-lg p-3">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={e => setMarketingOptIn(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-wood flex-shrink-0"
                />
                <span>
                  Aceito receber ofertas e cookies/comunicações via e-mail e WhatsApp (LGPD Lei 13.709/2018).
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-wood hover:bg-wood-dark text-cream font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading
                ? 'Aguarde...'
                : mode === 'login'
                ? (<><LogIn className="w-4 h-4" /> Entrar</>)
                : (<><UserPlus className="w-4 h-4" /> Criar Conta</>)}
            </button>

            <p className="text-[11px] text-muted text-center leading-relaxed">
              {mode === 'login' ? (
                <>Ainda não tem conta?{' '}
                  <button type="button" onClick={() => setMode('signup')} className="text-wood font-medium hover:underline">
                    Cadastre-se
                  </button>
                </>
              ) : (
                <>Já tem conta?{' '}
                  <button type="button" onClick={() => setMode('login')} className="text-wood font-medium hover:underline">
                    Faça login
                  </button>
                </>
              )}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
