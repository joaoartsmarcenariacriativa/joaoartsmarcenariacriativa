import { useState, useEffect, useCallback } from 'react';
import {
  BookOpen, Lock, PlayCircle, FileText, Eye, CheckCircle2, Circle,
  Clock, ArrowLeft, Download, ChevronDown, ChevronUp, GraduationCap,
  Video, FileText as FileIcon, AlignLeft, MonitorPlay
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Ebook, EbookModule, EbookLesson, EbookLessonProgress, LessonContentType } from '@/types';

interface MemberAreaPageProps {
  onNavigate: (path: string) => void;
}

interface CourseWithAccess {
  ebook: Ebook;
  modules: EbookModule[];
  progressMap: Record<string, EbookLessonProgress>;
}

export default function MemberAreaPage({ onNavigate }: MemberAreaPageProps) {
  const { user, isCustomer, loading: authLoading } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<CourseWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCourse, setActiveCourse] = useState<CourseWithAccess | null>(null);
  const [activeLesson, setActiveLesson] = useState<EbookLesson | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [accessError, setAccessError] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!isCustomer || !user) {
      setLoading(false);
      setAccessError(true);
      return;
    }
    loadEnrolledCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isCustomer, user]);

  const loadEnrolledCourses = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const { data: accessRows } = await supabase
      .from('ebook_access')
      .select('ebook_id')
      .eq('user_id', user.id)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (!accessRows || accessRows.length === 0) {
      setEnrolledCourses([]);
      setLoading(false);
      return;
    }

    const ebookIds = accessRows.map(a => a.ebook_id);
    const { data: ebooks } = await supabase
      .from('ebooks')
      .select('*')
      .in('id', ebookIds)
      .eq('active', true);

    if (!ebooks || ebooks.length === 0) {
      setEnrolledCourses([]);
      setLoading(false);
      return;
    }

    const { data: modules } = await supabase
      .from('ebook_modules')
      .select('*')
      .in('ebook_id', ebookIds)
      .order('sort_order', { ascending: true });

    const moduleIds = (modules ?? []).map(m => m.id);
    let allLessons: EbookLesson[] = [];
    if (moduleIds.length > 0) {
      const { data: lessons } = await supabase
        .from('ebook_lessons')
        .select('*')
        .in('module_id', moduleIds)
        .order('sort_order', { ascending: true });
      allLessons = (lessons as EbookLesson[]) ?? [];
    }

    const { data: progressRows } = await supabase
      .from('ebook_lesson_progress')
      .select('*')
      .eq('user_id', user.id);

    const progressMap: Record<string, EbookLessonProgress> = {};
    for (const p of (progressRows as EbookLessonProgress[]) ?? []) {
      progressMap[p.lesson_id] = p;
    }

    const courses: CourseWithAccess[] = (ebooks as Ebook[]).map(ebook => {
      const courseModules = (modules ?? [])
        .filter(m => m.ebook_id === ebook.id)
        .map(m => ({
          ...m,
          lessons: allLessons.filter(l => l.module_id === m.id),
        }));
      return { ebook, modules: courseModules, progressMap };
    });

    setEnrolledCourses(courses);
    setLoading(false);
  }, [user]);

  const totalLessons = (course: CourseWithAccess) =>
    course.modules.reduce((sum, m) => sum + (m.lessons?.length ?? 0), 0);

  const completedLessons = (course: CourseWithAccess) =>
    (course.modules.flatMap(m => m.lessons ?? [])).filter(l => course.progressMap[l.id]?.completed).length;

  const progressPercent = (course: CourseWithAccess) => {
    const total = totalLessons(course);
    if (total === 0) return 0;
    return Math.round((completedLessons(course) / total) * 100);
  };

  const openCourse = (course: CourseWithAccess) => {
    setActiveCourse(course);
    setActiveLesson(null);
    const firstModule = course.modules[0];
    if (firstModule) {
      setExpandedModules(new Set([firstModule.id]));
    }
    window.scrollTo(0, 0);
  };

  const backToCourses = () => {
    setActiveCourse(null);
    setActiveLesson(null);
  };

  const selectLesson = (lesson: EbookLesson) => {
    setActiveLesson(lesson);
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const toggleLessonComplete = async (lessonId: string, currentCompleted: boolean) => {
    if (!user) return;
    const existing = activeCourse?.progressMap[lessonId];
    const newCompleted = !currentCompleted;

    if (existing) {
      await supabase
        .from('ebook_lesson_progress')
        .update({ completed: newCompleted, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('ebook_lesson_progress')
        .insert({
          lesson_id: lessonId,
          user_id: user.id,
          completed: newCompleted,
        });
    }

    if (activeCourse) {
      const updatedCourse = {
        ...activeCourse,
        progressMap: {
          ...activeCourse.progressMap,
          [lessonId]: {
            ...(existing ?? { id: '', lesson_id: lessonId, user_id: user.id, last_position_seconds: 0, updated_at: '' }),
            completed: newCompleted,
            updated_at: new Date().toISOString(),
          },
        },
      };
      setActiveCourse(updatedCourse);
      const updatedCourses = enrolledCourses.map(c =>
        c.ebook.id === updatedCourse.ebook.id ? updatedCourse : c
      );
      setEnrolledCourses(updatedCourses);
    }
  };

  const renderLessonContent = (lesson: EbookLesson) => {
    switch (lesson.content_type) {
      case 'video': {
        if (!lesson.video_url) return <p className="text-muted text-sm">Vídeo não disponível.</p>;
        const isYouTube = lesson.video_url.includes('youtube.com') || lesson.video_url.includes('youtu.be');
        const isVimeo = lesson.video_url.includes('vimeo.com');
        if (isYouTube || isVimeo) {
          let embedUrl = lesson.video_url;
          if (isYouTube) {
            const ytId = lesson.video_url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
            embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : lesson.video_url;
          } else if (isVimeo) {
            const vimeoId = lesson.video_url.match(/vimeo\.com\/(\d+)/)?.[1];
            embedUrl = vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : lesson.video_url;
          }
          return (
            <div className="relative w-full aspect-video bg-espresso rounded-xl overflow-hidden">
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                title={lesson.title}
              />
            </div>
          );
        }
        return (
          <video
            src={lesson.video_url}
            controls
            className="w-full rounded-xl bg-espresso"
            controlsList="nodownload"
          />
        );
      }

      case 'pdf': {
        if (!lesson.pdf_url) return <p className="text-muted text-sm">PDF não disponível.</p>;
        return (
          <div className="space-y-3">
            <div className="relative w-full aspect-[3/4] sm:aspect-[4/3] bg-rim/30 rounded-xl overflow-hidden">
              <iframe
                src={lesson.pdf_url}
                className="absolute inset-0 w-full h-full"
                title={lesson.title}
              />
            </div>
            <a
              href={lesson.pdf_url}
              download
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" /> Baixar PDF
            </a>
          </div>
        );
      }

      case 'embed': {
        if (!lesson.embed_url) return <p className="text-muted text-sm">Conteúdo incorporado não disponível.</p>;
        return (
          <div className="relative w-full aspect-video bg-espresso rounded-xl overflow-hidden">
            <iframe
              src={lesson.embed_url}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </div>
        );
      }

      case 'text':
        return (
          <div className="prose prose-sm max-w-none">
            <div className="text-sm text-muted leading-relaxed whitespace-pre-line">
              {lesson.text_content || 'Conteúdo textual não disponível.'}
            </div>
          </div>
        );

      default:
        return <p className="text-muted text-sm">Tipo de conteúdo não suportado.</p>;
    }
  };

  const lessonIcon = (type: LessonContentType) => {
    switch (type) {
      case 'video': return Video;
      case 'pdf': return FileIcon;
      case 'embed': return MonitorPlay;
      case 'text': return AlignLeft;
      default: return FileText;
    }
  };

  // --- Loading ---
  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 text-center">
        <div className="w-16 h-16 bg-wood/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <GraduationCap className="w-8 h-8 text-wood" />
        </div>
        <p className="text-muted">Carregando sua área de membros...</p>
      </div>
    );
  }

  // --- Not logged in ---
  if (accessError || !isCustomer) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 bg-espresso rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-cream" />
        </div>
        <h1 className="font-serif text-xl font-medium text-espresso mb-2">Área de Membros</h1>
        <p className="text-sm text-muted mb-6">
          Faça login com a conta usada na compra para acessar seus cursos.
        </p>
        <button
          onClick={() => onNavigate('/entrar')}
          className="px-6 py-3 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-xl transition-colors"
        >
          Entrar / Cadastrar
        </button>
      </div>
    );
  }

  // --- No enrolled courses ---
  if (!activeCourse && enrolledCourses.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16 text-center">
        <div className="w-16 h-16 bg-wood/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-wood" />
        </div>
        <h1 className="font-serif text-xl font-medium text-espresso mb-2">Nenhum curso ainda</h1>
        <p className="text-sm text-muted mb-6">
          Quando você comprar um e-book, ele aparece aqui para você assistir e baixar.
        </p>
        <button
          onClick={() => onNavigate('/ebooks')}
          className="px-6 py-3 bg-wood hover:bg-wood-dark text-cream text-sm font-medium rounded-xl transition-colors"
        >
          Ver E-books Disponíveis
        </button>
      </div>
    );
  }

  // --- Course list view ---
  if (!activeCourse) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <GraduationCap className="w-6 h-6 text-wood" />
            <h1 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-espresso">Minha Área de Membros</h1>
          </div>
          <p className="text-sm text-muted">Bem-vindo! Continue de onde parou nos seus cursos.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {enrolledCourses.map(course => {
            const pct = progressPercent(course);
            const total = totalLessons(course);
            const completed = completedLessons(course);
            return (
              <div
                key={course.ebook.id}
                onClick={() => openCourse(course)}
                className="bg-paper rounded-2xl shadow-soft overflow-hidden cursor-pointer group hover:shadow-lift transition-all"
              >
                <div className="flex gap-4 p-4">
                  <div className="relative w-24 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-cream">
                    <img src={course.ebook.cover_url} alt={course.ebook.title} className="w-full h-full object-cover" />
                    {pct === 100 && (
                      <div className="absolute inset-0 bg-moss/80 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-cream" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-base font-medium text-espresso line-clamp-2">{course.ebook.title}</h3>
                      {course.ebook.author && <p className="text-[11px] text-muted mt-0.5">por {course.ebook.author}</p>}
                      <p className="text-xs text-muted mt-1">{total} aulas • {completed} concluídas</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[10px] font-medium text-muted mb-1">
                        <span>Progresso</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 bg-rim/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-wood rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <div className="flex items-center justify-center gap-2 py-2 bg-wood/10 text-wood text-xs font-medium rounded-lg group-hover:bg-wood group-hover:text-cream transition-colors">
                    <PlayCircle className="w-4 h-4" />
                    {pct > 0 ? 'Continuar Curso' : 'Começar Curso'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Course detail / player view ---
  const pct = progressPercent(activeCourse);
  const total = totalLessons(activeCourse);
  const completed = completedLessons(activeCourse);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
      <button
        onClick={backToCourses}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-wood mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Meus Cursos
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <img src={activeCourse.ebook.cover_url} alt={activeCourse.ebook.title} className="w-16 h-20 rounded-lg object-cover flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h1 className="font-serif text-xl sm:text-2xl font-medium text-espresso leading-tight">{activeCourse.ebook.title}</h1>
          {activeCourse.ebook.author && <p className="text-xs text-muted mt-0.5">por {activeCourse.ebook.author}</p>}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex-1 max-w-xs">
              <div className="flex items-center justify-between text-[10px] font-medium text-muted mb-1">
                <span>{completed} de {total} aulas</span>
                <span>{pct}%</span>
              </div>
              <div className="h-1.5 bg-rim/50 rounded-full overflow-hidden">
                <div className="h-full bg-wood rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* Player area */}
        <div className="space-y-4">
          {activeLesson ? (
            <>
              <div className="bg-paper rounded-2xl shadow-soft p-4 sm:p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <h2 className="font-serif text-lg font-medium text-espresso">{activeLesson.title}</h2>
                    {activeLesson.duration_minutes && (
                      <p className="text-xs text-muted mt-0.5 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> {activeLesson.duration_minutes} min
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleLessonComplete(activeLesson.id, activeCourse.progressMap[activeLesson.id]?.completed ?? false)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg transition-colors flex-shrink-0 ${
                      activeCourse.progressMap[activeLesson.id]?.completed
                        ? 'bg-moss text-cream hover:bg-moss-light'
                        : 'bg-wood/10 text-wood hover:bg-wood hover:text-cream'
                    }`}
                  >
                    {activeCourse.progressMap[activeLesson.id]?.completed ? (
                      <><CheckCircle2 className="w-4 h-4" /> Concluído</>
                    ) : (
                      <><Circle className="w-4 h-4" /> Marcar como concluído</>
                    )}
                  </button>
                </div>
                {renderLessonContent(activeLesson)}
              </div>
            </>
          ) : (
            <div className="bg-paper rounded-2xl shadow-soft p-8 text-center">
              <PlayCircle className="w-16 h-16 text-rim mx-auto mb-3" />
              <h2 className="font-serif text-lg font-medium text-espresso mb-1">Selecione uma aula</h2>
              <p className="text-sm text-muted">Escolha uma aula no menu ao lado para começar a assistir.</p>
            </div>
          )}
        </div>

        {/* Sidebar: modules and lessons */}
        <div className="space-y-2">
          <div className="bg-paper rounded-xl shadow-soft overflow-hidden lg:max-h-[calc(100vh-200px)] lg:sticky lg:top-20">
            <div className="px-4 py-3 border-b border-rim">
              <h3 className="font-serif text-sm font-medium text-espresso flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-wood" /> Conteúdo do Curso
              </h3>
            </div>
            <div className="overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-260px)]">
              {activeCourse.modules.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-xs text-muted">Nenhum módulo cadastrado ainda.</p>
                  <p className="text-[11px] text-muted mt-1">O conteúdo será disponibilizado em breve.</p>
                </div>
              ) : (
                activeCourse.modules.map((module, mIdx) => {
                  const isExpanded = expandedModules.has(module.id);
                  const moduleLessons = module.lessons ?? [];
                  const moduleCompleted = moduleLessons.filter(l => activeCourse.progressMap[l.id]?.completed).length;
                  return (
                    <div key={module.id} className="border-b border-rim last:border-b-0">
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full flex items-center justify-between px-4 py-3 hover:bg-cream transition-colors text-left"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-muted flex-shrink-0">M{mIdx + 1}</span>
                          <span className="text-sm font-medium text-espresso line-clamp-1">{module.title}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-muted">{moduleCompleted}/{moduleLessons.length}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted" /> : <ChevronDown className="w-4 h-4 text-muted" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="bg-cream/50">
                          {moduleLessons.length === 0 ? (
                            <p className="px-4 py-2 text-xs text-muted">Sem aulas neste módulo.</p>
                          ) : (
                            moduleLessons.map((lesson, lIdx) => {
                              const Icon = lessonIcon(lesson.content_type);
                              const isActive = activeLesson?.id === lesson.id;
                              const isCompleted = activeCourse.progressMap[lesson.id]?.completed;
                              return (
                                <button
                                  key={lesson.id}
                                  onClick={() => selectLesson(lesson)}
                                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                                    isActive
                                      ? 'bg-wood/10 border-l-2 border-wood'
                                      : 'hover:bg-cream border-l-2 border-transparent'
                                  }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-moss flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-rim flex-shrink-0" />
                                  )}
                                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-wood' : 'text-muted'}`} />
                                  <div className="min-w-0 flex-1">
                                    <p className={`text-xs line-clamp-1 ${isActive ? 'font-medium text-wood' : 'text-muted'}`}>
                                      {lIdx + 1}. {lesson.title}
                                    </p>
                                    {lesson.duration_minutes && (
                                      <p className="text-[10px] text-muted">{lesson.duration_minutes} min</p>
                                    )}
                                  </div>
                                  {lesson.is_free_preview && (
                                    <Eye className="w-3.5 h-3.5 text-wood/60 flex-shrink-0" />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
