-- Migration: Source RAG database for internal content pipeline
-- These chunks are NEVER served to students — only used during content generation.

-- Source chunks table
CREATE TABLE IF NOT EXISTS src_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'text',
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  competency_goals TEXT[] DEFAULT '{}',
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_file, chunk_index)
);

-- HNSW index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS idx_src_chunks_embedding
  ON src_chunks USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- GIN index for competency goal filtering
CREATE INDEX IF NOT EXISTS idx_src_chunks_competency_goals
  ON src_chunks USING gin (competency_goals);

-- Index for source file lookups
CREATE INDEX IF NOT EXISTS idx_src_chunks_source_file
  ON src_chunks (source_file);

-- RLS: source chunks readable only by service role (never by student/teacher JWT)
ALTER TABLE src_chunks ENABLE ROW LEVEL SECURITY;

-- No RLS policies = no access via anon/authenticated JWT.
-- Only service_role key bypasses RLS.

COMMENT ON TABLE src_chunks IS 'Internal source RAG database for content generation. Never exposed to end users.';
