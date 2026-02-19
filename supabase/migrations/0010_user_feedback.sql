-- Migration 0010: User feedback entries for usability/user-testing
-- YpsiMath

CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  role user_role,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 10),
  comment TEXT,
  page_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX user_feedback_created_idx ON user_feedback (created_at DESC);
CREATE INDEX user_feedback_user_idx ON user_feedback (user_id, created_at DESC);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own feedback"
  ON user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users read own feedback"
  ON user_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Teachers and admins read feedback"
  ON user_feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('teacher', 'admin')
    )
  );
