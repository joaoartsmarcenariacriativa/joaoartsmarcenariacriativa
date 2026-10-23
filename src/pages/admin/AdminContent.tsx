import { useState, useEffect } from 'react';
import { Save, Loader2, Type, FileText, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { SiteContent } from '@/types';

export default function AdminContent() {
  const [items, setItems] = useState<SiteContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'home' | 'footer' | 'trust' | 'policy'>('home');
  const [saved, setSaved] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => { loadItems(); }, []);

  const loadItems = () => {
    setLoading(true);
    supabase
      .from('site_content')
      .select('*')
      .order('category')
      .order('key')
      .then(({ data, error }) => {
        if (error) { setItems([]); }
        else setItems(data as SiteContent[] ?? []);
        setLoading(false);
      });
  };

  const handleUpdate = async (key: string, value: string) => {
    const { error } = await supabase.from('site_content').update({ value, updated_at: new Date().toISOString() }).eq('key', key);
    if (error) { alert('Erro ao salvar: ' + error.message); return; }
    loadItems();
  };

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return;
    const { error } = await supabase.from('site_content').insert({
      key: newKey.trim(),
      value: newValue.trim(),
      category: activeSection,
    });
    if (error) { alert('Erro ao adicionar: ' + error.message); return; }
    setNewKey('');
    setNewValue('');
    loadItems();
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Excluir este texto?')) return;
    const { error } = await supabase.from('site_content').delete().eq('key', key);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadItems();
  };

  const handleSaveAll = async () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    { id: 'home' as const, label: 'Página Inicial', icon: Type },
    { id: 'trust' as const, label: 'Selos de Confiança', icon: Type },
    { id: 'footer' as const, label: 'Rodapé', icon: Type },
    { id: 'policy' as const, label: 'Políticas', icon: FileText },
  ];

  const sectionItems = items.filter(i => i.category === activeSection);

  if (loading) return <div className="p-8 text-center text-muted">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-espresso">Conteúdo do Site</h1>
        <p className="text-sm text-muted mt-1">Edite todos os textos, títulos e políticas da loja</p>
      </div>

      {/* Section tabs */}
      <div className="flex flex-wrap gap-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
              activeSection === s.id
                ? 'bg-wood text-espresso'
                : 'bg-paper text-muted border border-rim hover:bg-cream'
            }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Policy section has special editor */}
      {activeSection === 'policy' ? (
        <div className="space-y-4">
          <div className="bg-wood/10 border border-wood/30 rounded-lg p-3 text-xs text-muted">
            <p className="font-medium text-wood mb-1">Como editar as políticas:</p>
            <p>Cada seção tem um título e um texto, separados por <code className="bg-paper px-1 rounded">|</code>. Seções diferentes são separadas por <code className="bg-paper px-1 rounded">||</code>.</p>
            <p className="mt-1">Exemplo: <code className="bg-paper px-1 rounded">Título 1|Texto da seção 1||Título 2|Texto da seção 2</code></p>
          </div>
          {sectionItems.map(item => (
            <PolicyEditor
              key={item.key}
              item={item}
              onSave={value => handleUpdate(item.key, value)}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Existing items */}
          {sectionItems.map(item => (
            <div key={item.key} className="bg-paper rounded-2xl border border-rim p-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted">{item.key}</label>
                <button
                  onClick={() => handleDelete(item.key)}
                  className="p-1 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-muted hover:text-red-500" />
                </button>
              </div>
              <textarea
                defaultValue={item.value}
                onBlur={e => {
                  if (e.target.value !== item.value) {
                    handleUpdate(item.key, e.target.value);
                  }
                }}
                rows={item.value.length > 80 ? 3 : 1}
                className="w-full px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
              />
            </div>
          ))}

          {/* Add new */}
          <div className="bg-cream rounded-2xl border-2 border-dashed border-rim p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted">Adicionar novo texto</p>
            <input
              type="text"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              placeholder="Chave (ex: home_custom_title)"
              className="w-full px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
            <input
              type="text"
              value={newValue}
              onChange={e => setNewValue(e.target.value)}
              placeholder="Texto..."
              className="w-full px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newKey.trim() || !newValue.trim()}
              className="flex items-center gap-1 text-sm text-wood font-medium hover:underline disabled:opacity-50"
            >
              <Plus className="w-4 h-4" /> Adicionar
            </button>
          </div>
        </div>
      )}

      <div className="sticky bottom-4 flex justify-end">
        <button
          onClick={handleSaveAll}
          className="flex items-center gap-2 px-6 py-3 bg-wood text-espresso font-semibold rounded-full hover:scale-105 transition-transform shadow-lg"
        >
          <Save className="w-5 h-5" />
          {saved ? 'Tudo salvo!' : 'Concluído'}
        </button>
      </div>
    </div>
  );
}

function PolicyEditor({ item, onSave }: { item: SiteContent; onSave: (value: string) => void }) {
  const policyNames: Record<string, string> = {
    policy_privacidade: 'Política de Privacidade',
    policy_trocas: 'Trocas e Devoluções',
    policy_entregas: 'Envio e Entregas',
    policy_termos: 'Termos de Uso',
  };

  const sections = item.value.split('||').map(s => {
    const [heading, ...textParts] = s.split('|');
    return { heading: heading ?? '', text: textParts.join('|') };
  });

  const [editedSections, setEditedSections] = useState(sections);
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    const value = editedSections
      .map(s => `${s.heading}|${s.text}`)
      .join('||');
    onSave(value);
    setSaving(false);
  };

  return (
    <div className="bg-paper rounded-2xl border border-rim p-4 space-y-3">
      <h3 className="font-serif font-semibold text-espresso">{policyNames[item.key] ?? item.key}</h3>
      {editedSections.map((section, idx) => (
        <div key={idx} className="space-y-1.5 p-3 bg-cream rounded-lg">
          <input
            type="text"
            value={section.heading}
            onChange={e => {
              const newArr = [...editedSections];
              newArr[idx] = { ...section, heading: e.target.value };
              setEditedSections(newArr);
            }}
            placeholder="Título da seção"
            className="w-full px-3 py-2 text-sm font-medium bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
          />
          <textarea
            value={section.text}
            onChange={e => {
              const newArr = [...editedSections];
              newArr[idx] = { ...section, text: e.target.value };
              setEditedSections(newArr);
            }}
            rows={3}
            placeholder="Texto da seção"
            className="w-full px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
          />
          <button
            onClick={() => setEditedSections(editedSections.filter((_, i) => i !== idx))}
            className="text-xs text-red-500 hover:underline"
          >
            Remover seção
          </button>
        </div>
      ))}
      <div className="flex gap-2">
        <button
          onClick={() => setEditedSections([...editedSections, { heading: '', text: '' }])}
          className="text-sm text-wood font-medium hover:underline"
        >
          + Adicionar seção
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto flex items-center gap-1 px-4 py-2 bg-wood text-espresso text-sm font-medium rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
