-- Vector similarity search on published content_elements
CREATE OR REPLACE FUNCTION vector_search(
  query_embedding TEXT,
  match_count INT DEFAULT 30,
  filter_subject_ids TEXT[] DEFAULT NULL,
  filter_content_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  subject_id TEXT,
  chapter TEXT,
  topic TEXT,
  content_type TEXT,
  content TEXT,
  competency_goals TEXT[],
  sort_order INT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    ce.id,
    ce.subject_id,
    ce.chapter,
    ce.topic,
    ce.content_type::TEXT,
    ce.content,
    ce.competency_goals,
    ce.sort_order
  FROM content_elements ce
  WHERE ce.status = 'published'
    AND ce.embedding IS NOT NULL
    AND (filter_subject_ids IS NULL OR ce.subject_id = ANY(filter_subject_ids))
    AND (filter_content_types IS NULL OR ce.content_type::TEXT = ANY(filter_content_types))
  ORDER BY ce.embedding <=> query_embedding::vector
  LIMIT match_count;
$$;

-- Full-text search on published content_elements (Norwegian)
CREATE OR REPLACE FUNCTION fts_search(
  search_query TEXT,
  match_count INT DEFAULT 30,
  filter_subject_ids TEXT[] DEFAULT NULL,
  filter_content_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  subject_id TEXT,
  chapter TEXT,
  topic TEXT,
  content_type TEXT,
  content TEXT,
  competency_goals TEXT[],
  sort_order INT
)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT
    ce.id,
    ce.subject_id,
    ce.chapter,
    ce.topic,
    ce.content_type::TEXT,
    ce.content,
    ce.competency_goals,
    ce.sort_order
  FROM content_elements ce
  WHERE ce.status = 'published'
    AND ce.fts @@ plainto_tsquery('norwegian', search_query)
    AND (filter_subject_ids IS NULL OR ce.subject_id = ANY(filter_subject_ids))
    AND (filter_content_types IS NULL OR ce.content_type::TEXT = ANY(filter_content_types))
  ORDER BY ts_rank(ce.fts, plainto_tsquery('norwegian', search_query)) DESC
  LIMIT match_count;
$$;
