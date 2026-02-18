-- Migration 0002: Content tables
-- YpsiMath

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Content type enums
CREATE TYPE content_type AS ENUM ('theory', 'rule', 'example', 'exercise', 'exploration', 'flashcard');
CREATE TYPE exercise_format AS ENUM ('freeform', 'multiple_choice', 'numeric_input', 'drag_drop', 'interactive');
CREATE TYPE content_status AS ENUM ('draft', 'flagged', 'reviewed', 'published');
CREATE TYPE video_status AS ENUM ('generating', 'ready', 'failed');

-- Subjects
CREATE TABLE subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  competency_goals JSONB DEFAULT '{}'::jsonb
);

-- Seed R1
INSERT INTO subjects (id, name, description, competency_goals) VALUES (
  'r1',
  'Matematikk R1',
  'Matematikk for realfag, nivå 1 — norsk videregående skole',
  '{
    "R1-01": "Planlegge og gjennomføre selvstendig arbeid med reelle datasett",
    "R1-02": "Forstå vekstfart, grenser, deriverte, kontinuitet",
    "R1-03": "Utforske og bestemme grenseverdier for funksjoner",
    "R1-04": "Bestemme den deriverte i et punkt (geometrisk, algebraisk, numerisk)",
    "R1-05": "Analysere funksjoner ved hjelp av den deriverte",
    "R1-06": "Anvende derivasjon til å analysere matematiske modeller",
    "R1-07": "Forstå potens- og logaritmeregler; løse eksponential- og logaritmeligninger",
    "R1-08": "Modellere og analysere eksponentiell og logistisk vekst",
    "R1-09": "Bestemme kontinuitet; gi eksempler på diskontinuerlige funksjoner",
    "R1-10": "Utforske og utlede funksjoner og deres omvendte funksjoner",
    "R1-11": "Anvende parameterframstilling for linjer",
    "R1-12": "Forstå vektorer og vektoroperasjoner i planet"
  }'::jsonb
);

-- Content elements
CREATE TABLE content_elements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  chapter TEXT NOT NULL,
  topic TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  content_type content_type NOT NULL,
  exercise_format exercise_format,
  content TEXT NOT NULL,
  content_metadata JSONB DEFAULT '{}'::jsonb,
  competency_goals TEXT[] NOT NULL DEFAULT '{}',
  status content_status NOT NULL DEFAULT 'draft',
  version INT NOT NULL DEFAULT 1,
  embedding VECTOR(1536),
  fts TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ
);

-- HNSW index for vector search (cosine similarity)
CREATE INDEX content_elements_embedding_idx
  ON content_elements
  USING hnsw (embedding vector_cosine_ops);

-- GIN index for full-text search
CREATE INDEX content_elements_fts_idx
  ON content_elements
  USING gin (fts);

-- Index for common queries
CREATE INDEX content_elements_subject_topic_idx
  ON content_elements (subject_id, topic, sort_order);

CREATE INDEX content_elements_status_idx
  ON content_elements (status);

-- Auto-update FTS column on insert/update
CREATE OR REPLACE FUNCTION update_content_fts()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fts := to_tsvector('norwegian', COALESCE(NEW.content, '') || ' ' || COALESCE(NEW.chapter, '') || ' ' || COALESCE(NEW.topic, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER content_elements_fts_trigger
  BEFORE INSERT OR UPDATE OF content ON content_elements
  FOR EACH ROW
  EXECUTE FUNCTION update_content_fts();

-- Content versions (audit trail)
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_element_id UUID NOT NULL REFERENCES content_elements(id) ON DELETE CASCADE,
  version INT NOT NULL,
  content TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_note TEXT
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_element_id UUID NOT NULL REFERENCES content_elements(id) ON DELETE CASCADE,
  video_url TEXT,
  thumbnail_url TEXT,
  duration_seconds INT,
  manim_script TEXT,
  status video_status NOT NULL DEFAULT 'generating'
);

-- RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_elements ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Subjects: readable by all authenticated
CREATE POLICY "Authenticated users read subjects"
  ON subjects FOR SELECT
  USING (auth.role() = 'authenticated');

-- Content: published readable by all; draft/flagged/reviewed by teacher/admin
CREATE POLICY "All users read published content"
  ON content_elements FOR SELECT
  USING (status = 'published');

CREATE POLICY "Teachers read all content statuses"
  ON content_elements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Admins manage content"
  ON content_elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Teachers manage content"
  ON content_elements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'teacher'
    )
  );

-- Content versions: same as content
CREATE POLICY "Teachers/admins read content versions"
  ON content_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('teacher', 'admin')
    )
  );

-- Videos: readable with content
CREATE POLICY "Authenticated users read videos"
  ON videos FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins manage videos"
  ON videos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );
