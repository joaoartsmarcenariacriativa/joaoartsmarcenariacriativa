import { useState, useEffect, useCallback } from 'react';
import {
  Plus, X, Trash2, Edit3, ChevronDown, ChevronUp, GripVertical,
  Video, FileText as FileIcon, AlignLeft, MonitorPlay, Save
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Ebook, EbookModule, EbookLesson, LessonContentType } from '@/types';

interface AdminCourseBuilderProps {
  ebook: Ebook;
  onBack: () => void;
}

export default function AdminCourseBuilder({ ebook, onBack }: AdminCourseBuilderProps) {
  const [modules, setModules] = useState<EbookModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [editingModule, setEditingModule] = useState<EbookModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: '', description: '', sort_order: '0' });
  const [savingModule, setSavingModule] = useState(false);

  const [showLessonForm, setShowLessonForm] = useState<string | null>(null);
  const [editingLesson, setEditingLesson] = useState<EbookLesson | null>(null);
  const [lessonForm, setLessonForm] = useState({
    title: '', content_type: 'video' as LessonContentType,
    video_url: '', pdf_url: '', text_content: '', embed_url: '',
    duration_minutes: '', is_free_preview: false, sort_order: '0',
  });
  const [savingLesson, setSavingLesson] = useState(false);

  const loadModules = useCallback(async () => {
    setLoading(true);
    const { data: mods } = await supabase
      .from('ebook_modules')
      .select('*')
      .eq('ebook_id', ebook.id)
      .order('sort_order', { ascending: true });

    const moduleIds = (mods ?? []).map(m => m.id);
    let allLessons: EbookLesson[] = [];
    if (moduleIds.length > 0) {
      const { data: lessons } = await supabase
        .from('ebook_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true });
      allLessons = (lessons as EbookLesson[]) ?? [];
    }

    const modulesWithLessons = (mods as EbookModule[] ?? []).map(m => ({
      ...m,
      lessons: allLessons.filter(l => l.module_id === m.id),
    }));
    setModules(modulesWithLessons);
    if (modulesWithLessons.length > 0) {
      setExpandedModules(new Set([modulesWithLessons[0].id]));
    }
    setLoading(false);
  }, [ebook.id]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  const toggleModule = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // --- Module CRUD ---
  const openNewModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', sort_order: String(modules.length) });
    setShowModuleForm(true);
  };

  const openEditModule = (mod: EbookModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description ?? '', sort_order: String(mod.sort_order) });
    setShowModuleForm(true);
  };

  const saveModule = async () => {
    if (!moduleForm.title.trim()) { alert('Digite o título do módulo.'); return; }
    setSavingModule(true);
    const payload = {
      ebook_id: ebook.id,
      title: moduleForm.title.trim(),
      description: moduleForm.description || null,
      sort_order: parseInt(moduleForm.sort_order) || 0,
    };
    if (editingModule) {
      const { error } = await supabase.from('ebook_modules').update(payload).eq('id', editingModule.id);
      if (error) { alert('Erro: ' + error.message); setSavingModule(false); return; }
    } else {
      const { error } = await supabase.from('ebook_modules').insert(payload);
      if (error) { alert('Erro: ' + error.message); setSavingModule(false); return; }
    }
    setSavingModule(false);
    setShowModuleForm(false);
    loadModules();
  };

  const deleteModule = async (id: string) => {
    if (!confirm('Excluir este módulo e todas as suas aulas?')) return;
    const { error } = await supabase.from('ebook_modules').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    loadModules();
  };

  // --- Lesson CRUD ---
  const openNewLesson = (moduleId: string) => {
    setEditingLesson(null);
    const mod = modules.find(m => m.id === moduleId);
    setLessonForm({
      title: '', content_type: 'video',
      video_url: '', pdf_url: '', text_content: '', embed_url: '',
      duration_minutes: '', is_free_preview: false, sort_order: String(mod?.lessons?.length ?? 0),
    });
    setShowLessonForm(moduleId);
  };

  const openEditLesson = (lesson: EbookLesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title,
      content_type: lesson.content_type,
      video_url: lesson.video_url ?? '',
      pdf_url: lesson.pdf_url ?? '',
      text_content: lesson.text_content ?? '',
      embed_url: lesson.embed_url ?? '',
      duration_minutes: lesson.duration_minutes ? String(lesson.duration_minutes) : '',
      is_free_preview: lesson.is_free_preview,
      sort_order: String(lesson.sort_order),
    });
    setShowLessonForm(lesson.module_id);
  };

  const saveLesson = async () => {
    const moduleId = showLessonForm;
    if (!moduleId) return;
    if (!lessonForm.title.trim()) { alert('Digite o título da aula.'); return; }
    setSavingLesson(true);
    const payload = {
      module_id: moduleId,
      title: lessonForm.title.trim(),
      content_type: lessonForm.content_type,
      video_url: lessonForm.video_url || null,
      pdf_url: lessonForm.pdf_url || null,
      text_content: lessonForm.text_content || null,
      embed_url: lessonForm.embed_url || null,
      duration_minutes: lessonForm.duration_minutes ? parseInt(lessonForm.duration_minutes) : null,
      is_free_preview: lessonForm.is_free_preview,
      sort_order: parseInt(lessonForm.sort_order) || 0,
    };
    if (editingLesson) {
      const { error } = await supabase.from('ebook_lessons').update(payload).eq('id', editingLesson.id);
      if (error) { alert('Erro: ' + error.message); setSavingLesson(false); return; }
    } else {
      const { error } = await supabase.from('ebook_lessons').insert(payload);
      if (error) { alert('Erro: ' + error.message); setSavingLesson(false); return; }
    }
    setSavingLesson(false);
    setShowLessonForm(null);
    setEditingLesson(null);
    loadModules();
  };

  const deleteLesson = async (id: string) => {
    if (!confirm('Excluir esta aula?')) return;
    const { error } = await supabase.from('ebook_lessons').delete().eq('id', id);
    if (error) { alert('Erro: ' + error.message); return; }
    loadModules();
  };

  const lessonIcon = (type: LessonContentType) => {
    switch (type) {
      case 'video': return Video;
      case 'pdf': return FileIcon;
      case 'embed': return MonitorPlay;
      case 'text': return AlignLeft;
      default: return FileIcon;
    }
  };

  const inputClass = "w-full mt-1 px-3 py-2 text-sm bg-paper border border-rim rounded-lg focus:outline-none focus:border-wood transition-colors";
  const labelClass = "text-[10px] uppercase tracking-[0.1em] text-muted";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted hover:text-wood mb-1 transition-colors">
            <ChevronUp className="w-3.5 h-3.5 rotate-[-90deg]" /> Voltar para E-books
          </button>
          <h1 className="font-serif text-xl font-semibold text-espresso">Montar Curso</h1>
          <p className="text-sm text-muted mt-0.5 flex items-center gap-2">
            <img src={ebook.cover_url} alt="" className="w-8 h-10 rounded object-cover" />
            {ebook.title}
          </p>
        </div>
        <button
          onClick={openNewModule}
          className="flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Módulo
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-muted">Carregando...</div>
      ) : modules.length === 0 ? (
        <div className="bg-paper rounded-2xl border border-rim p-8 text-center">
          <p className="text-muted mb-1">Nenhum módulo cadastrado.</p>
          <p className="text-xs text-muted">Crie o primeiro módulo para começar a adicionar aulas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((mod, mIdx) => {
            const isExpanded = expandedModules.has(mod.id);
            const lessons = mod.lessons ?? [];
            return (
              <div key={mod.id} className="bg-paper rounded-xl border border-rim overflow-hidden">
                {/* Module header */}
                <div className="flex items-center gap-3 px-4 py-3 bg-cream/50 border-b border-rim">
                  <button onClick={() => toggleModule(mod.id)} className="p-1 hover:bg-rim/50 rounded transition-colors">
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                  </button>
                  <span className="text-[10px] font-bold text-wood bg-wood/10 px-2 py-0.5 rounded">M{mIdx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-espresso line-clamp-1">{mod.title}</h3>
                    <p className="text-[11px] text-muted">{lessons.length} aula(s)</p>
                  </div>
                  <button onClick={() => openEditModule(mod)} className="p-1.5 hover:bg-rim/50 rounded-lg transition-colors" title="Editar módulo">
                    <Edit3 className="w-3.5 h-3.5 text-muted" />
                  </button>
                  <button onClick={() => deleteModule(mod.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir módulo">
                    <Trash2 className="w-3.5 h-3.5 text-muted" />
                  </button>
                </div>

                {/* Lessons list */}
                {isExpanded && (
                  <div className="p-3 space-y-2">
                    {lessons.length === 0 ? (
                      <p className="text-xs text-muted px-2 py-3 text-center">Sem aulas. Adicione a primeira.</p>
                    ) : (
                      lessons.map((lesson, lIdx) => {
                        const Icon = lessonIcon(lesson.content_type);
                        return (
                          <div key={lesson.id} className="flex items-center gap-3 px-3 py-2.5 bg-cream/30 rounded-lg group">
                            <GripVertical className="w-4 h-4 text-rim flex-shrink-0" />
                            <Icon className="w-4 h-4 text-muted flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-espresso line-clamp-1">{lIdx + 1}. {lesson.title}</p>
                              <p className="text-[10px] text-muted">
                                {lesson.content_type === 'video' && 'Vídeo'}
                                {lesson.content_type === 'pdf' && 'PDF'}
                                {lesson.content_type === 'text' && 'Texto'}
                                {lesson.content_type === 'embed' && 'Incorporado'}
                                {lesson.duration_minutes ? ` • ${lesson.duration_minutes} min` : ''}
                                {lesson.is_free_preview && ' • Prévia grátis'}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditLesson(lesson)} className="p-1.5 hover:bg-rim/50 rounded-lg transition-colors" title="Editar aula">
                                <Edit3 className="w-3.5 h-3.5 text-muted" />
                              </button>
                              <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Excluir aula">
                                <Trash2 className="w-3.5 h-3.5 text-muted" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <button
                      onClick={() => openNewLesson(mod.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-wood hover:bg-wood/10 rounded-lg transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Adicionar Aula
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Module form modal */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModuleForm(false)}>
          <div className="bg-paper rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-rim">
              <h2 className="font-serif text-lg font-bold text-espresso">{editingModule ? 'Editar Módulo' : 'Novo Módulo'}</h2>
              <button onClick={() => setShowModuleForm(false)} className="p-1.5 hover:bg-cream rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={labelClass}>Título *</label>
                <input type="text" value={moduleForm.title} onChange={e => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="Ex: Módulo 1 — Fundamentos" className={inputClass} autoFocus />
              </div>
              <div>
                <label className={labelClass}>Descrição</label>
                <textarea value={moduleForm.description} onChange={e => setModuleForm({ ...moduleForm, description: e.target.value })} rows={2} placeholder="O que será abordado neste módulo..." className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Ordem</label>
                <input type="number" value={moduleForm.sort_order} onChange={e => setModuleForm({ ...moduleForm, sort_order: e.target.value })} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-2 p-5 border-t border-rim">
              <button onClick={() => setShowModuleForm(false)} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors">Cancelar</button>
              <button onClick={saveModule} disabled={savingModule} className="flex-1 py-2.5 bg-wood text-cream text-sm font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {savingModule ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson form modal */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowLessonForm(null); setEditingLesson(null); }}>
          <div className="bg-paper rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-rim sticky top-0 bg-paper z-10">
              <h2 className="font-serif text-lg font-bold text-espresso">{editingLesson ? 'Editar Aula' : 'Nova Aula'}</h2>
              <button onClick={() => { setShowLessonForm(null); setEditingLesson(null); }} className="p-1.5 hover:bg-cream rounded-lg"><X className="w-5 h-5 text-muted" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className={labelClass}>Título da Aula *</label>
                <input type="text" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="Ex: Introdução às Ferramentas" className={inputClass} autoFocus />
              </div>

              <div>
                <label className={labelClass}>Tipo de Conteúdo</label>
                <div className="grid grid-cols-4 gap-2 mt-1">
                  {([
                    { value: 'video', label: 'Vídeo', icon: Video },
                    { value: 'pdf', label: 'PDF', icon: FileIcon },
                    { value: 'text', label: 'Texto', icon: AlignLeft },
                    { value: 'embed', label: 'Embed', icon: MonitorPlay },
                  ] as const).map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setLessonForm({ ...lessonForm, content_type: opt.value })}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-[11px] font-medium transition-colors ${
                        lessonForm.content_type === opt.value
                          ? 'bg-wood text-cream border-wood'
                          : 'bg-cream text-muted border-rim hover:border-wood/50'
                      }`}
                    >
                      <opt.icon className="w-4 h-4" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {lessonForm.content_type === 'video' && (
                <div>
                  <label className={labelClass}>URL do Vídeo (MP4, YouTube ou Vimeo)</label>
                  <input type="text" value={lessonForm.video_url} onChange={e => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://..." className={inputClass} />
                </div>
              )}
              {lessonForm.content_type === 'pdf' && (
                <div>
                  <label className={labelClass}>URL do PDF</label>
                  <input type="text" value={lessonForm.pdf_url} onChange={e => setLessonForm({ ...lessonForm, pdf_url: e.target.value })} placeholder="https://...pdf" className={inputClass} />
                </div>
              )}
              {lessonForm.content_type === 'embed' && (
                <div>
                  <label className={labelClass}>URL de Embed (iframe)</label>
                  <input type="text" value={lessonForm.embed_url} onChange={e => setLessonForm({ ...lessonForm, embed_url: e.target.value })} placeholder="https://..." className={inputClass} />
                </div>
              )}
              {lessonForm.content_type === 'text' && (
                <div>
                  <label className={labelClass}>Conteúdo da Aula</label>
                  <textarea value={lessonForm.text_content} onChange={e => setLessonForm({ ...lessonForm, text_content: e.target.value })} rows={6} placeholder="Escreva o conteúdo da aula..." className={inputClass} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Duração (min)</label>
                  <input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm({ ...lessonForm, duration_minutes: e.target.value })} placeholder="Ex: 15" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Ordem</label>
                  <input type="number" value={lessonForm.sort_order} onChange={e => setLessonForm({ ...lessonForm, sort_order: e.target.value })} className={inputClass} />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-espresso pt-1">
                <input type="checkbox" checked={lessonForm.is_free_preview} onChange={e => setLessonForm({ ...lessonForm, is_free_preview: e.target.checked })} className="w-4 h-4 rounded border-rim text-wood focus:ring-wood" />
                Aula de prévia gratuita (visível sem compra)
              </label>
            </div>
            <div className="flex gap-2 p-5 border-t border-rim sticky bottom-0 bg-paper">
              <button onClick={() => { setShowLessonForm(null); setEditingLesson(null); }} className="px-4 py-2.5 text-sm font-medium text-muted hover:bg-cream rounded-lg transition-colors">Cancelar</button>
              <button onClick={saveLesson} disabled={savingLesson} className="flex-1 py-2.5 bg-wood text-cream text-sm font-semibold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> {savingLesson ? 'Salvando...' : 'Salvar Aula'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
