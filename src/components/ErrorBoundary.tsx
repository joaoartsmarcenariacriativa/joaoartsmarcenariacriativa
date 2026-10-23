import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  onNavigate: (path: string) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Application error boundary caught:', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    this.setState({ hasError: false, error: null });
    this.props.onNavigate('/');
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-cream flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="font-serif text-xl font-medium text-espresso mb-2">
            Algo deu errado
          </h1>
          <p className="text-sm text-muted leading-relaxed mb-6">
            Ocorreu um erro inesperado ao carregar esta página. Tente recarregar
            ou volte para a página inicial. Se o problema persistir, entre em
            contato com o suporte.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-5 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Recarregar
            </button>
            <button
              onClick={this.handleHome}
              className="flex items-center gap-2 px-5 py-2.5 bg-paper hover:bg-cream text-espresso text-sm font-medium border border-rim rounded-lg transition-colors"
            >
              <Home className="w-4 h-4" /> Página Inicial
            </button>
          </div>
        </div>
      </div>
    );
  }
}
