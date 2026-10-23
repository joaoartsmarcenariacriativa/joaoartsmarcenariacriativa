/*
# Área de Membros para E-books (tipo Hotmart)

## Explicação em português simples
Transforma os e-books em cursos com área de membros. O cliente que compra
um e-book ganha acesso a módulos e aulas dentro de uma área exclusiva —
como a "área de aluno" da Hotmart. O administrador monta o curso (módulos
e aulas) e gerencia quem tem acesso.

## Novas tabelas
- `ebook_modules`: módulos/seções de um e-book (ex: "Módulo 1 — Fundamentos").
  - `id` (uuid, PK), `ebook_id` (FK → ebooks), `title`, `description`,
    `sort_order`, `created_at`.
- `ebook_lessons`: aulas dentro de cada módulo.
  - `id` (uuid, PK), `module_id` (FK → ebook_modules), `title`,
    `content_type` (video | pdf | text | embed),
    `video_url` (url do vídeo mp4, YouTube, Vimeo etc.),
    `pdf_url` (url do PDF para download/visualização),
    `text_content` (texto/markdown da aula),
    `embed_url` (iframe embed, ex. Hotmart, YouTube embed),
    `duration_minutes` (duração estimada), `is_free_preview` (aula grátis),
    `sort_order`, `created_at`.
- `ebook_access`: quem comprou/tem acesso a qual e-book.
  - `id` (uuid, PK), `ebook_id` (FK → ebooks),
    `user_id` (uuid, FK → auth.users, default auth.uid()),
    `granted_by` (email do admin ou 'system'), `order_id` (FK → orders, nullable),
    `granted_at` (timestamp), `expires_at` (nullable, para acesso temporário).
  - UNIQUE (ebook_id, user_id) — um acesso por usuário por e-book.
- `ebook_lesson_progress`: progresso do aluno por aula.
  - `id` (uuid, PK), `lesson_id` (FK → ebook_lessons),
    `user_id` (uuid, default auth.uid()),
    `completed` (bool), `last_position_seconds` (int, para retomar vídeo),
    `updated_at`.
  - UNIQUE (lesson_id, user_id).

## Segurança (RLS)
- `ebook_modules`: leitura pública para任何人 (visitante vê estrutura do curso
  na página de vendas), escrita só admin.
- `ebook_lessons`: SELECT público (mas aulas sem is_free_preview só mostram
  o título para não-autorizados — controlado no frontend), escrita só admin.
- `ebook_access`: só o próprio usuário vê seus acessos (auth.uid() = user_id).
  Admin lê via service role. INSERT/UPDATE/DELETE só admin (service role).
- `ebook_lesson_progress`: só o próprio usuário lê e edita seu progresso.

## Notas
- O `DEFAULT auth.uid()` em ebook_access e ebook_lesson_progress garante
  que inserts do frontend funcionem sem passar user_id explicitamente.
- Políticas de escrita em modules/lessons são TO authenticated (admin logado).
*/

-- ============================================================
-- ebook_modules
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ebook_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ebook_modules" ON ebook_modules;
CREATE POLICY "select_ebook_modules" ON ebook_modules FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_ebook_modules" ON ebook_modules;
CREATE POLICY "insert_ebook_modules" ON ebook_modules FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_ebook_modules" ON ebook_modules;
CREATE POLICY "update_ebook_modules" ON ebook_modules FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_ebook_modules" ON ebook_modules;
CREATE POLICY "delete_ebook_modules" ON ebook_modules FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ebook_modules_ebook ON ebook_modules(ebook_id);
CREATE INDEX IF NOT EXISTS idx_ebook_modules_sort ON ebook_modules(ebook_id, sort_order);

-- ============================================================
-- ebook_lessons
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES ebook_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_type text NOT NULL DEFAULT 'video' CHECK (content_type IN ('video','pdf','text','embed')),
  video_url text,
  pdf_url text,
  text_content text,
  embed_url text,
  duration_minutes integer,
  is_free_preview boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ebook_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_ebook_lessons" ON ebook_lessons;
CREATE POLICY "select_ebook_lessons" ON ebook_lessons FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "insert_ebook_lessons" ON ebook_lessons;
CREATE POLICY "insert_ebook_lessons" ON ebook_lessons FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "update_ebook_lessons" ON ebook_lessons;
CREATE POLICY "update_ebook_lessons" ON ebook_lessons FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "delete_ebook_lessons" ON ebook_lessons;
CREATE POLICY "delete_ebook_lessons" ON ebook_lessons FOR DELETE
  TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_ebook_lessons_module ON ebook_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_ebook_lessons_sort ON ebook_lessons(module_id, sort_order);

-- ============================================================
-- ebook_access
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ebook_id uuid NOT NULL REFERENCES ebooks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_by text DEFAULT 'system',
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE ebook_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_ebook_access" ON ebook_access;
CREATE POLICY "select_own_ebook_access" ON ebook_access FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_ebook_access" ON ebook_access;
CREATE POLICY "insert_ebook_access" ON ebook_access FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_ebook_access" ON ebook_access;
CREATE POLICY "update_own_ebook_access" ON ebook_access FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_ebook_access" ON ebook_access;
CREATE POLICY "delete_own_ebook_access" ON ebook_access FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ebook_access_unique ON ebook_access(ebook_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ebook_access_user ON ebook_access(user_id);

-- ============================================================
-- ebook_lesson_progress
-- ============================================================
CREATE TABLE IF NOT EXISTS ebook_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES ebook_lessons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  last_position_seconds integer NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ebook_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_lesson_progress" ON ebook_lesson_progress;
CREATE POLICY "select_own_lesson_progress" ON ebook_lesson_progress FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_lesson_progress" ON ebook_lesson_progress;
CREATE POLICY "insert_own_lesson_progress" ON ebook_lesson_progress FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_lesson_progress" ON ebook_lesson_progress;
CREATE POLICY "update_own_lesson_progress" ON ebook_lesson_progress FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_lesson_progress" ON ebook_lesson_progress;
CREATE POLICY "delete_own_lesson_progress" ON ebook_lesson_progress FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_progress_unique ON ebook_lesson_progress(lesson_id, user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON ebook_lesson_progress(user_id);