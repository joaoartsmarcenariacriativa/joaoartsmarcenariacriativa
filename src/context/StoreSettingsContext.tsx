import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { StoreSettings, SiteContent } from '@/types';

interface StoreSettingsContextType {
  settings: StoreSettings | null;
  content: Record<string, string>;
  loading: boolean;
  getText: (key: string, fallback: string) => string;
  refresh: () => void;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

export function StoreSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([
      supabase.from('store_settings').select('id, store_name, store_short_name, store_tagline, logo_url, primary_color, announcement_text, announcement_enabled, whatsapp_number, whatsapp_message, email_contact, instagram_url, facebook_url, free_shipping_enabled, free_shipping_threshold, pix_discount_percent, max_installments, cnpj, footer_about, origin_cep, mp_enabled, mp_environment').eq('id', 1).maybeSingle(),
      supabase.from('site_content').select('*'),
    ]).then(([settingsRes, contentRes]) => {
      setSettings(settingsRes.data as StoreSettings | null);
      const contentMap: Record<string, string> = {};
      (contentRes.data as SiteContent[] ?? []).forEach(item => {
        contentMap[item.key] = item.value;
      });
      setContent(contentMap);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const getText = (key: string, fallback: string) => content[key] ?? fallback;

  return (
    <StoreSettingsContext.Provider value={{ settings, content, loading, getText, refresh: load }}>
      {children}
    </StoreSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStoreSettings() {
  const ctx = useContext(StoreSettingsContext);
  if (!ctx) throw new Error('useStoreSettings must be used within StoreSettingsProvider');
  return ctx;
}
