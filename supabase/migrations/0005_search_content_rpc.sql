-- RPC function for full-text search on published content
CREATE OR REPLACE FUNCTION search_content(
  search_query TEXT,
  result_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  subject_id TEXT,
  chapter TEXT,
  topic TEXT,
  content_type TEXT,
  content TEXT,
  competency_goals TEXT[],
  rank REAL
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
    LEFT(ce.content, 300) AS content,
    ce.competency_goals,
    ts_rank(ce.fts, plainto_tsquery('norwegian', search_query)) AS rank
  FROM content_elements ce
  WHERE ce.status = 'published'
    AND ce.fts @@ plainto_tsquery('norwegian', search_query)
  ORDER BY rank DESC
  LIMIT result_limit;
$$;
