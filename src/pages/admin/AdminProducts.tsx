import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Search, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Product, Category, ProductVariation } from '@/types';
import { formatBRL } from '@/lib/format';
import ImageUploader from '@/components/ImageUploader';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadProducts();
    supabase
      .from('categories')
      .select('*')
      .order('sort_order')
      .then(({ data, error }) => {
        if (!error) setCategories(data as Category[] ?? []);
      });
  }, []);

  const loadProducts = () => {
    setLoading(true);
    supabase
      .from('products')
      .select('*, category:categories(*)')
      .order('sort_order')
      .then(({ data, error }) => {
        if (error) { setProducts([]); }
        else setProducts(data as Product[] ?? []);
        setLoading(false);
      });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert('Erro ao excluir: ' + error.message); return; }
    loadProducts();
  };

  const moveProduct = async (product: Product, direction: 'up' | 'down') => {
    const idx = products.findIndex(p => p.id === product.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= products.length) return;
    const swapProduct = products[swapIdx];

    await Promise.all([
      supabase.from('products').update({ sort_order: swapProduct.sort_order }).eq('id', product.id),
      supabase.from('products').update({ sort_order: product.sort_order }).eq('id', swapProduct.id),
    ]);
    loadProducts();
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-espresso">Produtos</h1>
          <p className="text-sm text-muted mt-1">{products.length} produtos cadastrados</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform"
        >
          <Plus className="w-4 h-4" /> Novo Produto
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar produto..."
          className="w-full pl-10 pr-4 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
        />
      </div>

      {/* Products table */}
      <div className="bg-paper rounded-2xl border border-rim overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted">Carregando...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream text-muted text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 text-left font-medium w-10">Ordem</th>
                  <th className="px-3 py-3 text-left font-medium">Produto</th>
                  <th className="px-3 py-3 text-left font-medium hidden sm:table-cell">Categoria</th>
                  <th className="px-3 py-3 text-right font-medium">Preço</th>
                  <th className="px-3 py-3 text-center font-medium">Estoque</th>
                  <th className="px-3 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rim">
                {filtered.map(product => (
                  <tr key={product.id} className="hover:bg-cream transition-colors">
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <GripVertical className="w-4 h-4 text-rim" />
                        <button onClick={() => moveProduct(product, 'up')} className="p-0.5 hover:bg-rim rounded transition-colors">
                          <ArrowUp className="w-3.5 h-3.5 text-muted" />
                        </button>
                        <button onClick={() => moveProduct(product, 'down')} className="p-0.5 hover:bg-rim rounded transition-colors">
                          <ArrowDown className="w-3.5 h-3.5 text-muted" />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        {product.images[0] && (
                          <img src={product.images[0]} alt={product.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-espresso truncate max-w-[200px]">{product.name}</p>
                          {product.featured && (
                            <span className="text-[10px] text-wood font-medium">Destaque</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-muted hidden sm:table-cell">
                      {product.category?.name ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-right font-bold text-espresso">
                      {formatBRL(product.price)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        product.stock === 0 ? 'bg-red-100 text-red-700' :
                        product.stock <= 5 ? 'bg-orange-100 text-orange-700' :
                        'bg-moss/15 text-moss'
                      }`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => { setEditing(product); setShowForm(true); }}
                          className="p-1.5 hover:bg-cream rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4 text-muted" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
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
        )}
      </div>

      {showForm && (
        <ProductForm
          product={editing}
          categories={categories}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={() => { setShowForm(false); setEditing(null); loadProducts(); }}
        />
      )}
    </div>
  );
}

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

function ProductForm({ product, categories, onClose, onSave }: ProductFormProps) {
  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    care_instructions: product?.care_instructions ?? '',
    price: product?.price?.toString() ?? '',
    compare_price: product?.compare_price?.toString() ?? '',
    category_id: product?.category_id ?? '',
    images: product?.images ?? [],
    video_url: product?.video_url ?? '',
    stock: product?.stock?.toString() ?? '0',
    production_days: product?.production_days?.toString() ?? '7',
    max_per_customer: product?.max_per_customer?.toString() ?? '10',
    badges: product?.badges?.join(', ') ?? '',
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    ship_weight_g: product?.ship_weight_g?.toString() ?? '',
    ship_length_cm: product?.ship_length_cm?.toString() ?? '',
    ship_width_cm: product?.ship_width_cm?.toString() ?? '',
    ship_height_cm: product?.ship_height_cm?.toString() ?? '',
    ship_packaging_weight_g: product?.ship_packaging_weight_g?.toString() ?? '0',
    ship_packaging_cm: product?.ship_packaging_cm?.toString() ?? '0',
    ship_declared_value: product?.ship_declared_value?.toString() ?? '',
  });
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(product?.specs ?? []);
  const [variations, setVariations] = useState<ProductVariation[]>(product?.variations ?? []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product?.id) {
      supabase
        .from('product_variations')
        .select('*')
        .eq('product_id', product.id)
        .order('price_adjustment')
        .then(({ data }) => {
          if (data) setVariations(data as ProductVariation[]);
        });
    }
  }, [product?.id]);

  const handleSave = async () => {
    setSaving(true);
    const slug = form.slug || form.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    const data = {
      name: form.name,
      slug,
      description: form.description,
      care_instructions: form.care_instructions,
      price: parseFloat(form.price) || 0,
      compare_price: form.compare_price ? parseFloat(form.compare_price) : null,
      category_id: form.category_id || null,
      images: form.images,
      video_url: form.video_url || null,
      stock: parseInt(form.stock) || 0,
      production_days: parseInt(form.production_days) || 7,
      max_per_customer: parseInt(form.max_per_customer) || 10,
      badges: form.badges.split(',').map(s => s.trim()).filter(Boolean),
      featured: form.featured,
      active: form.active,
      ship_weight_g: form.ship_weight_g ? parseInt(form.ship_weight_g) : null,
      ship_length_cm: form.ship_length_cm ? parseFloat(form.ship_length_cm) : null,
      ship_width_cm: form.ship_width_cm ? parseFloat(form.ship_width_cm) : null,
      ship_height_cm: form.ship_height_cm ? parseFloat(form.ship_height_cm) : null,
      ship_packaging_weight_g: form.ship_packaging_weight_g ? parseInt(form.ship_packaging_weight_g) : 0,
      ship_packaging_cm: form.ship_packaging_cm ? parseInt(form.ship_packaging_cm) : 0,
      ship_declared_value: form.ship_declared_value ? parseFloat(form.ship_declared_value) : null,
      specs: specs,
    };

    let productId = product?.id;

    if (product) {
      const { error: updateErr } = await supabase.from('products').update({
        name: data.name, slug: data.slug, description: data.description,
        care_instructions: data.care_instructions, price: data.price,
        compare_price: data.compare_price, category_id: data.category_id,
        images: data.images, video_url: data.video_url, stock: data.stock,
        production_days: data.production_days, max_per_customer: data.max_per_customer,
        badges: data.badges, featured: data.featured, active: data.active,
        ship_weight_g: data.ship_weight_g, ship_length_cm: data.ship_length_cm,
        ship_width_cm: data.ship_width_cm, ship_height_cm: data.ship_height_cm,
        ship_packaging_weight_g: data.ship_packaging_weight_g, ship_packaging_cm: data.ship_packaging_cm,
        ship_declared_value: data.ship_declared_value,
        specs: specs,
      }).eq('id', product.id);
      if (updateErr) { setSaving(false); alert('Erro ao salvar: ' + updateErr.message); return; }
    } else {
      const { data: newProduct, error: insertErr } = await supabase.from('products').insert({
        name: data.name, slug: data.slug, description: data.description,
        care_instructions: data.care_instructions, price: data.price,
        compare_price: data.compare_price, category_id: data.category_id,
        images: data.images, video_url: data.video_url, stock: data.stock,
        production_days: data.production_days, max_per_customer: data.max_per_customer,
        badges: data.badges, featured: data.featured, active: data.active,
        ship_weight_g: data.ship_weight_g, ship_length_cm: data.ship_length_cm,
        ship_width_cm: data.ship_width_cm, ship_height_cm: data.ship_height_cm,
        ship_packaging_weight_g: data.ship_packaging_weight_g, ship_packaging_cm: data.ship_packaging_cm,
        ship_declared_value: data.ship_declared_value,
        specs: specs,
      }).select().single();
      if (insertErr || !newProduct) { setSaving(false); alert('Erro ao criar produto: ' + (insertErr?.message ?? 'unknown')); return; }
      productId = newProduct.id;
    }

    // Save variations
    if (productId) {
      // Delete existing
      await supabase.from('product_variations').delete().eq('product_id', productId);
      // Insert new
      const validVars = variations.filter(v => v.wood_type || v.dimensions || v.finish);
      if (validVars.length > 0) {
        await supabase.from('product_variations').insert(
          validVars.map(v => ({
            product_id: productId,
            wood_type: v.wood_type || null,
            dimensions: v.dimensions || null,
            finish: v.finish || null,
            stock: v.stock ?? 0,
            price_adjustment: v.price_adjustment ?? 0,
          }))
        );
      }
    }

    setSaving(false);
    onSave();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper z-10">
          <h2 className="font-serif font-bold text-espresso">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream rounded-lg transition-colors">
            <X className="w-5 h-5 text-muted" />
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          {/* Image Upload */}
          <ImageUploader
            images={form.images}
            onChange={imgs => setForm({ ...form, images: imgs })}
            label="Fotos e Vídeos do Produto"
            maxImages={8}
            acceptVideos
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Descrição</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">URL do Vídeo (YouTube/Vimeo)</label>
            <input
              type="text"
              value={form.video_url}
              onChange={e => setForm({ ...form, video_url: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Preço *</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Preço Antigo</label>
              <input
                type="number"
                step="0.01"
                value={form.compare_price}
                onChange={e => setForm({ ...form, compare_price: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Categoria</label>
              <select
                value={form.category_id}
                onChange={e => setForm({ ...form, category_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Estoque</label>
              <input
                type="number"
                value={form.stock}
                onChange={e => setForm({ ...form, stock: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Dias de Produção</label>
              <input
                type="number"
                value={form.production_days}
                onChange={e => setForm({ ...form, production_days: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Máx por Cliente</label>
              <input
                type="number"
                value={form.max_per_customer}
                onChange={e => setForm({ ...form, max_per_customer: e.target.value })}
                className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Selos/Badges (separados por vírgula)</label>
            <input
              type="text"
              value={form.badges}
              onChange={e => setForm({ ...form, badges: e.target.value })}
              placeholder="Feito à Mão, Madeira Nobre, Pronta Entrega"
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
            />
          </div>

          {/* Variations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Variações do Produto</label>
              <button
                onClick={() => setVariations([...variations, {
                  id: `temp-${Date.now()}`,
                  product_id: product?.id ?? '',
                  wood_type: '',
                  dimensions: '',
                  finish: '',
                  stock: 0,
                  price_adjustment: 0,
                }])}
                className="text-xs text-wood font-medium hover:underline"
              >
                + Adicionar variação
              </button>
            </div>
            <div className="space-y-2">
              {variations.length === 0 && (
                <p className="text-xs text-muted py-2">Nenhuma variação cadastrada. O produto usará o estoque e preço principal.</p>
              )}
              {variations.map((v, idx) => (
                <div key={idx} className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 p-2 bg-cream rounded-lg">
                  <input
                    type="text"
                    value={v.wood_type ?? ''}
                    onChange={e => {
                      const newArr = [...variations];
                      newArr[idx] = { ...v, wood_type: e.target.value };
                      setVariations(newArr);
                    }}
                    placeholder="Madeira"
                    className="px-2 py-1.5 text-xs bg-paper border border-rim rounded focus:outline-none focus:border-wood transition-colors"
                  />
                  <input
                    type="text"
                    value={v.dimensions ?? ''}
                    onChange={e => {
                      const newArr = [...variations];
                      newArr[idx] = { ...v, dimensions: e.target.value };
                      setVariations(newArr);
                    }}
                    placeholder="Dimensões"
                    className="px-2 py-1.5 text-xs bg-paper border border-rim rounded focus:outline-none focus:border-wood transition-colors"
                  />
                  <input
                    type="text"
                    value={v.finish ?? ''}
                    onChange={e => {
                      const newArr = [...variations];
                      newArr[idx] = { ...v, finish: e.target.value };
                      setVariations(newArr);
                    }}
                    placeholder="Acabamento"
                    className="px-2 py-1.5 text-xs bg-paper border border-rim rounded focus:outline-none focus:border-wood transition-colors"
                  />
                  <input
                    type="number"
                    value={v.stock}
                    onChange={e => {
                      const newArr = [...variations];
                      newArr[idx] = { ...v, stock: parseInt(e.target.value) || 0 };
                      setVariations(newArr);
                    }}
                    placeholder="Estoque"
                    className="px-2 py-1.5 text-xs bg-paper border border-rim rounded focus:outline-none focus:border-wood transition-colors"
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.01"
                      value={v.price_adjustment}
                      onChange={e => {
                        const newArr = [...variations];
                        newArr[idx] = { ...v, price_adjustment: parseFloat(e.target.value) || 0 };
                        setVariations(newArr);
                      }}
                      placeholder="+ R$"
                      className="w-full px-2 py-1.5 text-xs bg-paper border border-rim rounded focus:outline-none focus:border-wood transition-colors"
                    />
                    <button
                      onClick={() => setVariations(variations.filter((_, i) => i !== idx))}
                      className="p-1.5 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-muted hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Especificações Técnicas</label>
              <button
                onClick={() => setSpecs([...specs, { label: '', value: '' }])}
                className="text-xs text-wood font-medium hover:underline"
              >
                + Adicionar
              </button>
            </div>
            <div className="space-y-2">
              {specs.map((spec, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={spec.label}
                    onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[idx].label = e.target.value;
                      setSpecs(newSpecs);
                    }}
                    placeholder="Rótulo (ex: Material)"
                    className="flex-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={e => {
                      const newSpecs = [...specs];
                      newSpecs[idx].value = e.target.value;
                      setSpecs(newSpecs);
                    }}
                    placeholder="Valor (ex: Cedro Branco)"
                    className="flex-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                  />
                  <button
                    onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-muted hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping specs */}
          <div className="bg-cream rounded-xl border border-rim p-4 space-y-3">
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted block">Especificações de Envio (Frete)</label>
            <p className="text-xs text-muted -mt-1">Usado para calcular frete real nas transportadoras</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Peso (g)</label>
                <input
                  type="number"
                  value={form.ship_weight_g}
                  onChange={e => setForm({ ...form, ship_weight_g: e.target.value })}
                  placeholder="ex: 500"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Comprimento (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ship_length_cm}
                  onChange={e => setForm({ ...form, ship_length_cm: e.target.value })}
                  placeholder="ex: 30"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Largura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ship_width_cm}
                  onChange={e => setForm({ ...form, ship_width_cm: e.target.value })}
                  placeholder="ex: 20"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Altura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={form.ship_height_cm}
                  onChange={e => setForm({ ...form, ship_height_cm: e.target.value })}
                  placeholder="ex: 10"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Peso Embalagem (g)</label>
                <input
                  type="number"
                  value={form.ship_packaging_weight_g}
                  onChange={e => setForm({ ...form, ship_packaging_weight_g: e.target.value })}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Margem Embalagem (cm)</label>
                <input
                  type="number"
                  value={form.ship_packaging_cm}
                  onChange={e => setForm({ ...form, ship_packaging_cm: e.target.value })}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-[0.1em] text-muted">Valor Declarado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.ship_declared_value}
                  onChange={e => setForm({ ...form, ship_declared_value: e.target.value })}
                  placeholder="Usa preço se vazio"
                  className="w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-[0.2em] text-muted">Cuidados com a Madeira</label>
            <textarea
              value={form.care_instructions}
              onChange={e => setForm({ ...form, care_instructions: e.target.value })}
              rows={2}
              className="w-full mt-1 px-3 py-2 text-sm bg-cream border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors resize-none"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-espresso">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={e => setForm({ ...form, featured: e.target.checked })}
                className="w-4 h-4 rounded border-rim text-wood focus:ring-wood"
              />
              Destaque na home
            </label>
            <label className="flex items-center gap-2 text-sm text-espresso">
              <input
                type="checkbox"
                checked={form.active}
                onChange={e => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 rounded border-rim text-wood focus:ring-wood"
              />
              Produto ativo
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2 p-5 border-t border-rim sticky bottom-0 bg-paper">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name || !form.price}
            className="flex-1 py-2.5 bg-wood text-espresso text-sm font-semibold rounded-full hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </div>
    </div>
  );
}
