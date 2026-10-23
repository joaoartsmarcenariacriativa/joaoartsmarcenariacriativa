import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootEl = document.getElementById('root');

if (!rootEl) {
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8F5EF;font-family:system-ui,sans-serif">
      <div style="text-align:center;padding:2rem;max-width:480px">
        <h1 style="font-size:1.25rem;color:#2A2018;margin-bottom:0.5rem">Página não pôde ser carregada</h1>
        <p style="font-size:0.875rem;color:#756B61;line-height:1.6">
          O contêiner principal da aplicação não foi encontrado. Tente recarregar a página.
          Se o problema persistir, entre em contato com o suporte.
        </p>
      </div>
    </div>
  `;
  throw new Error('Root element #root not found in DOM');
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8F5EF;font-family:system-ui,sans-serif">
      <div style="text-align:center;padding:2rem;max-width:480px">
        <h1 style="font-size:1.25rem;color:#2A2018;margin-bottom:0.5rem">Configuração incompleta</h1>
        <p style="font-size:0.875rem;color:#756B61;line-height:1.6">
          As variáveis de ambiente do servidor não estão disponíveis. A loja não pode funcionar sem elas.
          Verifique a configuração de implantação e tente novamente.
        </p>
      </div>
    </div>
  `;
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables');
}

try {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
} catch (err) {
  console.error('Failed to render application:', err);
  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F8F5EF;font-family:system-ui,sans-serif">
      <div style="text-align:center;padding:2rem;max-width:480px">
        <h1 style="font-size:1.25rem;color:#2A2018;margin-bottom:0.5rem">Erro inesperado</h1>
        <p style="font-size:0.875rem;color:#756B61;line-height:1.6">
          Algo deu errado ao carregar a página. Tente recarregar — se o problema continuar,
          entre em contato com o suporte.
        </p>
        <button
          onclick="window.location.reload()"
          style="margin-top:1.25rem;padding:0.625rem 1.5rem;background:#8B6F47;color:#F8F5EF;border:none;border-radius:0.5rem;font-size:0.875rem;cursor:pointer"
        >
          Recarregar página
        </button>
      </div>
    </div>
  `;
}
