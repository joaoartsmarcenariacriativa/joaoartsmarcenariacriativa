import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Banner } from '@/types';
import ImageUploader from '@/components/ImageUploader';

export default function AdminBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Banner | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadBanners(); }, []);

  const loadBanners = () => {
    setLoading(true);
    supabase
      .from('banners')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) { setBanners([]); }
        else setBanners(data as Banner[] ?? []);
        setLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este banner?')) return;
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadBanners();
  };

  const moveBanner = async (banner: Banner, direction: 'up' | 'down') => {
    const idx = banners.findIndex(b => b.id === banner.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;
    const swap = banners[swapIdx];
    await Promise.all([
      supabase.from('banners').update({ sort_order: swap.sort_order }).eq('id', banner.id),
      supabase.from('banners').update({ sort_order: banner.sort_order }).eq('id', swap.id),
    ]);
    loadBanners();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Banners da Home</h1>
          <p className="text-sm text-muted mt-1">Banners rotativos na página inicial</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Novo Banner
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {banners.map(banner => (
            <div
              key={banner.id}
              className={`bg-paper rounded-2xl border border-rim p-3 flex items-center gap-3 ${
                !banner.active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveBanner(banner, 'up')} className="p-0.5 hover:bg-rim rounded transition-colors">
                  <ArrowUp className="w-3.5 h-3.5 text-muted" />
                </button>
                <button onClick={() => moveBanner(banner, 'down')} className="p-0.5 hover:bg-rim rounded transition-colors">
                  <ArrowDown className="w-3.5 h-3.5 text-muted" />
                </button>
              </div>
              <img
                src={banner.image_url}
                alt={banner.title}
                className="w-24 h-14 sm:w-32 sm:h-16 rounded-lg object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-espresso truncate">{banner.title}</p>
                {banner.subtitle && (
                  <p className="text-xs text-muted truncate hidden sm:block">{banner.subtitle}</p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                  {banner.cta_text && (
                    <span className="text-[10px] bg-wood/10 text-wood px-1.5 py-0.5 rounded">{banner.cta_text}</span>
                  )}
                  {!banner.active && (
                    <span className="text-[10px] bg-rim text-muted px-1.5 py-0.5 rounded">Inativo</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditing(banner); setShowForm(true); }}
                  className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4 text-muted" />
                </button>
                <button
                  onClick={() => handleDelete(banner.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-muted hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <BannerForm
          banner={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); loadBanners(); }}
        />
      )}
    </div>
  );
}

interface BannerFormProps {
  banner: Banner | null;
  onClose: () => void;
  onSave: () => void;
}

function BannerForm({ banner, onClose, onSave }: BannerFormProps) {
  const [form, setForm] = useState({
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    image_url: banner?.image_url ?? '',
    cta_text: banner?.cta_text ?? '',
    cta_link: banner?.cta_link ?? '',
    active: banner?.active ?? true,
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const data = {
      title: form.title,
      subtitle: form.subtitle || null,
      image_url: form.image_url,
      cta_text: form.cta_text || null,
      cta_link: form.cta_link || null,
      active: form.active,
    };

    let error;
    if (banner) {
      ({ error } = await supabase.from('banners').update(data).eq('id', banner.id));
    } else {
      ({ error } = await supabase.from('banners').insert({ ...data, sort_order: 99 }));
    }

    setSaving(false);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper z-10">
          <h2 className="font-serif font-bold text-espresso">{banner ? 'Editar Banner' : 'Novo Banner'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <ImageUploader
            images={form.image_url ? [form.image_url] : []}
            onChange={imgs => setForm({ ...form, image_url: imgs[0] ?? '' })}
            label="Imagem do Banner"
            maxImages={1}
          />

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Subtítulo</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={e => setForm({ ...form, subtitle: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Texto do Botão</label>
              <input
                type="text"
                value={form.cta_text}
                onChange={e => setForm({ ...form, cta_text: e.target.value })}
                placeholder="Ver Coleção"
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Link do Botão</label>
              <input
                type="text"
                value={form.cta_link}
                onChange={e => setForm({ ...form, cta_link: e.target.value })}
                placeholder="/produtos"
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-espresso">
            <input
              type="checkbox"
              checked={form.active}
              onChange={e => setForm({ ...form, active: e.target.checked })}
              className="w-4 h-4 rounded border-rim text-wood focus:ring-wood"
            />
            Banner ativo (exibir na loja)
          </label>
        </div>

        <div className="flex gap-2 p-5 border-t border-rim sticky bottom-0 bg-paper">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.title || !form.image_url}
            className="flex-1 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? 'Salvando...' : 'Salvar Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}
