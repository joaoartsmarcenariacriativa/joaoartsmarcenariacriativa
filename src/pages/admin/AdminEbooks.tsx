import { useEffect, useState } from 'react';
import { BookOpen, Plus, X, Trash2, Edit3, Star, GraduationCap, Users, Megaphone } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Ebook } from '@/types';
import AdminCourseBuilder from './AdminCourseBuilder';
import AdminAccessManager from './AdminAccessManager';
import AdminLaunchBroadcast from './AdminLaunchBroadcast';
import { formatBRL } from '@/lib/format';

function slugify(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function AdminEbooks() {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Ebook | null>(null);
  const [saving, setSaving] = useState(false);
  const [courseBuilderEbook, setCourseBuilderEbook] = useState<Ebook | null>(null);
  const [accessManagerEbook, setAccessManagerEbook] = useState<Ebook | null>(null);
  const [launchBroadcastEbook, setLaunchBroadcastEbook] = useState<Ebook | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    cover_url: '',
    price: '',
    hotmart_checkout_url: '',
    author: '',
    category: '',
    pages: '',
    preview_url: '',
    featured: false,
    active: true,
    sort_order: '0',
  });

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = () => {
    setLoading(true);
    supabase
      .from('ebooks')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) { setEbooks([]); }
        else setEbooks(data as Ebook[] ?? []);
        setLoading(false);
      });
  };

  const openNew = () => {
    setEditing(null);
    setForm({
      title: '', description: '', cover_url: '', price: '', hotmart_checkout_url: '',
      author: '', category: '', pages: '', preview_url: '', featured: false, active: true, sort_order: '0',
    });
    setShowForm(true);
  };

  const openEdit = (ebook: Ebook) => {
    setEditing(ebook);
    setForm({
      title: ebook.title,
      description: ebook.description ?? '',
      cover_url: ebook.cover_url,
      price: String(ebook.price),
      hotmart_checkout_url: ebook.hotmart_checkout_url,
      author: ebook.author ?? '',
      category: ebook.category ?? '',
      pages: ebook.pages ? String(ebook.pages) : '',
      preview_url: ebook.preview_url ?? '',
      featured: ebook.featured,
      active: ebook.active,
      sort_order: String(ebook.sort_order),
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.cover_url || !form.hotmart_checkout_url) {
      alert('Preencha os campos obrigatórios: Título, Capa e URL de Checkout da Hotmart.');
      return;
    }
    setSaving(true);
    const payload = {
      title: form.title,
      slug: slugify(form.title) + '-' + Math.random().toString(36).slice(2, 6),
      description: form.description || null,
      cover_url: form.cover_url,
      price: parseFloat(form.price) || 0,
      hotmart_checkout_url: form.hotmart_checkout_url,
      author: form.author || null,
      category: form.category || null,
      pages: form.pages ? parseInt(form.pages) : null,
      preview_url: form.preview_url || null,
      featured: form.featured,
      active: form.active,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editing) {
      const { error } = await supabase.from('ebooks').update({
        ...payload,
        slug: editing.slug,
      }).eq('id', editing.id);
      if (error) { alert('Erro ao atualizar: ' + error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('ebooks').insert(payload);
      if (error) { alert('Erro ao criar: ' + error.message); setSaving(false); return; }
    }
    setSaving(false);
    setShowForm(false);
    loadEbooks();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este e-book?')) return;
    const { error } = await supabase.from('ebooks').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadEbooks();
  };

  const toggleFeatured = async (ebook: Ebook) => {
    const { error } = await supabase.from('ebooks').update({ featured: !ebook.featured }).eq('id', ebook.id);
    if (error) return;
    loadEbooks();
  };

  const toggleActive = async (ebook: Ebook) => {
    const { error } = await supabase.from('ebooks').update({ active: !ebook.active }).eq('id', ebook.id);
    if (error) return;
    loadEbooks();
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[10px] uppercase tracking-[0.1em] text-muted";

  if (courseBuilderEbook) {
    return <AdminCourseBuilder ebook={courseBuilderEbook} onBack={() => { setCourseBuilderEbook(null); loadEbooks(); }} />;
  }

  if (accessManagerEbook) {
    return <AdminAccessManager ebook={accessManagerEbook} onBack={() => { setAccessManagerEbook(null); loadEbooks(); }} />;
  }

  if (launchBroadcastEbook) {
    return <AdminLaunchBroadcast ebook={launchBroadcastEbook} onBack={() => { setLaunchBroadcastEbook(null); loadEbooks(); }} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">E-books</h1>
          <p className="text-sm text-muted mt-1">{ebooks.length} infoprodutos cadastrados</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo E-book
        </button>
      </div>

      {/* Ebooks grid */}
      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : ebooks.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
          <BookOpen className="w-12 h-12 text-rim mx-auto mb-3" />
          <p className="text-muted">Nenhum e-book cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ebooks.map(ebook => (
            <div key={ebook.id} className="bg-paper rounded-xl border border-rim overflow-hidden group">
              <div className="relative aspect-[3/4] bg-cream overflow-hidden">
                <img src={ebook.cover_url} alt={ebook.title} className="w-full h-full object-cover" />
                <div className="absolute top-2 left-2 flex gap-1">
                  {ebook.featured && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-wood text-cream rounded-full flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-cream" /> Destaque
                    </span>
                  )}
                  {!ebook.active && (
                    <span className="text-[9px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Inativo</span>
                  )}
                </div>
              </div>
              <div className="p-3 space-y-2">
                <p className="font-serif text-sm font-medium text-espresso line-clamp-2">{ebook.title}</p>
                {ebook.author && <p className="text-[11px] text-muted">por {ebook.author}</p>}
                <p className="text-sm font-bold text-wood">{ebook.price > 0 ? formatBRL(ebook.price) : 'Grátis'}</p>
                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    onClick={() => openEdit(ebook)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-medium text-espresso bg-cream border border-rim rounded-lg hover:border-wood transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Editar
                  </button>
                  <button
                    onClick={() => setCourseBuilderEbook(ebook)}
                    className="p-1.5 rounded-lg transition-colors text-wood hover:bg-wood/10"
                    title="Montar Curso (módulos e aulas)"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setAccessManagerEbook(ebook)}
                    className="p-1.5 rounded-lg transition-colors text-blue-600 hover:bg-blue-50"
                    title="Gerenciar Acessos"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setLaunchBroadcastEbook(ebook)}
                    className="p-1.5 rounded-lg transition-colors text-amber-600 hover:bg-amber-50"
                    title="Anunciar Lançamento"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleFeatured(ebook)}
                    className={`p-1.5 rounded-lg transition-colors ${ebook.featured ? 'text-wood bg-wood/10' : 'text-muted hover:bg-cream'}`}
                    title="Destacar"
                  >
                    <Star className={`w-3.5 h-3.5 ${ebook.featured ? 'fill-wood' : ''}`} />
                  </button>
                  <button
                    onClick={() => toggleActive(ebook)}
                    className={`p-1.5 rounded-lg transition-colors text-xs font-bold ${ebook.active ? 'text-moss bg-moss/10' : 'text-muted hover:bg-cream'}`}
                    title={ebook.active ? 'Ativo' : 'Inativo'}
                  >
                    {ebook.active ? 'ON' : 'OFF'}
                  </button>
                  <button
                    onClick={() => handleDelete(ebook.id)}
                    className="p-1.5 text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div
            className="bg-paper rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper">
              <h2 className="font-serif text-lg font-bold text-espresso">
                {editing ? 'Editar E-book' : 'Novo E-book'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
                <X className="w-5 h-5 text-muted" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div>
                <label className={labelClass}>Título *</label>
                <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Guia de Marcenaria para Iniciantes" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Sinopse do e-book..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>URL da Capa *</label>
                <input type="text" value={form.cover_url} onChange={e => setForm({ ...form, cover_url: e.target.value })} placeholder="https://..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Preço (R$)</label>
                  <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Páginas</label>
                  <input type="number" value={form.pages} onChange={e => setForm({ ...form, pages: e.target.value })} placeholder="Ex: 120" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>URL de Checkout da Hotmart *</label>
                <input type="text" value={form.hotmart_checkout_url} onChange={e => setForm({ ...form, hotmart_checkout_url: e.target.value })} placeholder="https://pay.hotmart.com/..." className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Autor</label>
                  <input type="text" value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} placeholder="Nome do autor" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Categoria</label>
                  <input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Artesanato" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass}>URL de Preview (opcional)</label>
                <input type="text" value={form.preview_url} onChange={e => setForm({ ...form, preview_url: e.target.value })} placeholder="https://..." className={inputClass} />
              </div>
              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 text-sm text-espresso">
                  <input type="checkbox" checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} className="w-4 h-4 rounded border-rim text-wood focus:ring-wood" />
                  Destacar na vitrine
                </label>
                <label className="flex items-center gap-2 text-sm text-espresso">
                  <input type="checkbox" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} className="w-4 h-4 rounded border-rim text-wood focus:ring-wood" />
                  Ativo
                </label>
              </div>
            </div>

            <div className="flex gap-2 p-5 border-t border-rim sticky bottom-0 bg-paper">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title || !form.cover_url || !form.hotmart_checkout_url}
                className="flex-1 py-2.5 bg-wood text-cream text-sm font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {saving ? 'Salvando...' : 'Salvar E-book'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
