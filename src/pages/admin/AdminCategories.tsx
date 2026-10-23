import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category } from '@/types';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = () => {
    setLoading(true);
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) { setCategories([]); }
        else setCategories(data as Category[] ?? []);
        setLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria? Produtos vinculados ficarão sem categoria.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadCategories();
  };

  const moveCategory = async (cat: Category, direction: 'up' | 'down') => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const swap = categories[swapIdx];
    await Promise.all([
      supabase.from('categories').update({ sort_order: swap.sort_order }).eq('id', cat.id),
      supabase.from('categories').update({ sort_order: cat.sort_order }).eq('id', swap.id),
    ]);
    loadCategories();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Categorias</h1>
          <p className="text-sm text-muted mt-1">{categories.length} categorias cadastradas</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Nova Categoria
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : (
        <div className="bg-paper rounded-2xl border border-rim overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-muted text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 text-left font-medium w-10">Ordem</th>
                  <th className="px-3 py-3 text-left font-medium">Nome</th>
                  <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Slug</th>
                  <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Ícone</th>
                  <th className="px-3 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rim">
                {categories.map(cat => (
                  <tr key={cat.id} className="hover:bg-cream transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => moveCategory(cat, 'up')} className="p-0.5 hover:bg-rim rounded transition-colors">
                          <ArrowUp className="w-3.5 h-3.5 text-muted" />
                        </button>
                        <button onClick={() => moveCategory(cat, 'down')} className="p-0.5 hover:bg-rim rounded transition-colors">
                          <ArrowDown className="w-3.5 h-3.5 text-muted" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3 font-medium text-espresso">{cat.name}</td>
                    <td className="px-3 py-3 text-muted text-xs hidden sm:table-cell">{cat.slug}</td>
                    <td className="px-3 py-3 text-muted text-xs hidden sm:table-cell">{cat.icon ?? '-'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(cat); setShowForm(true); }}
                          className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-muted hover:text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showForm && (
        <CategoryForm
          category={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); loadCategories(); }}
        />
      )}
    </div>
  );
}

interface CategoryFormProps {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

function CategoryForm({ category, onClose, onSave }: CategoryFormProps) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    icon: category?.icon ?? '',
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const data = {
      name: form.name,
      slug,
      icon: form.icon || null,
    };

    let error;
    if (category) {
      ({ error } = await supabase.from('categories').update(data).eq('id', category.id));
    } else {
      ({ error } = await supabase.from('categories').insert({ ...data, sort_order: 99 }));
    }

    setSaving(false);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    onSave();
  };

  const iconOptions = [
    'Utensils', 'Home', 'Bird', 'Baby', 'TreePine', 'Sparkles',
    'Hammer', 'Heart', 'Gift', 'Leaf', 'Flower', 'Sun',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper rounded-3xl shadow-2xl max-w-md w-full"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-rim">
          <h2 className="font-serif font-bold text-espresso">{category ? 'Editar Categoria' : 'Nova Categoria'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Nome *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Slug (URL)</label>
            <input
              type="text"
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              placeholder="auto-gerado se vazio"
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Ícone (lucide-react)</label>
            <select
              value={form.icon}
              onChange={e => setForm({ ...form, icon: e.target.value })}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            >
              <option value="">Nenhum</option>
              {iconOptions.map(icon => (
                <option key={icon} value={icon}>{icon}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t border-rim">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name}
            className="flex-1 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? 'Salvando...' : 'Salvar Categoria'}
          </button>
        </div>
      </div>
    </div>
  );
}
