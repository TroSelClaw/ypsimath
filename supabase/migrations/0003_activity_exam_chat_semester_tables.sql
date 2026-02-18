-- Migration 0003: Activity, exam, chat, and semester plan tables
-- YpsiMath

-- Enums
CREATE TYPE activity_type AS ENUM ('wiki_view', 'exercise_attempt', 'chat_message', 'exam_graded', 'video_watched', 'flashcard_session');
CREATE TYPE check_method AS ENUM ('self_report', 'auto_check', 'image_check');
CREATE TYPE self_report_result AS ENUM ('correct', 'partial', 'incorrect');
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE exam_status AS ENUM ('draft', 'ready', 'completed');
CREATE TYPE submission_status AS ENUM ('scanned', 'grading', 'graded', 'reviewed');
CREATE TYPE entry_type AS ENUM ('topic', 'assessment', 'revision', 'holiday', 'event');
CREATE TYPE assessment_type AS ENUM ('full_day_exam', 'half_day_exam', 'short_quiz');

-- ==========================================
-- Activity & Progress
-- ==========================================

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  subject_id TEXT,
  topic TEXT,
  competency_goals TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX activity_log_user_created_idx ON activity_log (user_id, created_at DESC);

CREATE TABLE exercise_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_element_id UUID NOT NULL REFERENCES content_elements(id) ON DELETE CASCADE,
  check_method check_method NOT NULL,
  self_report self_report_result,
  auto_result BOOLEAN,
  answer TEXT,
  image_url TEXT,
  image_feedback TEXT,
  hints_used INT NOT NULL DEFAULT 0,
  viewed_solution BOOLEAN NOT NULL DEFAULT false,
  time_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX exercise_attempts_user_idx ON exercise_attempts (user_id, created_at DESC);

CREATE TABLE flashcard_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content_element_id UUID NOT NULL REFERENCES content_elements(id) ON DELETE CASCADE,
  ease_factor DECIMAL NOT NULL DEFAULT 2.5,
  interval_days INT NOT NULL DEFAULT 1,
  repetitions INT NOT NULL DEFAULT 0,
  next_review DATE NOT NULL DEFAULT CURRENT_DATE,
  last_reviewed TIMESTAMPTZ,
  UNIQUE(user_id, content_element_id)
);

-- ==========================================
-- Chat
-- ==========================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  subject_context TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX conversations_user_idx ON conversations (user_id, updated_at DESC);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role message_role NOT NULL,
  content TEXT NOT NULL,
  sources JSONB,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX messages_conversation_idx ON messages (conversation_id, created_at);

-- ==========================================
-- Exams
-- ==========================================

CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  total_duration_minutes INT NOT NULL,
  part1_duration_minutes INT NOT NULL,
  part2_duration_minutes INT NOT NULL,
  competency_goals TEXT[] NOT NULL DEFAULT '{}',
  exam_pdf_url TEXT,
  solution_pdf_url TEXT,
  status exam_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  part INT NOT NULL CHECK (part IN (1, 2)),
  question_number INT NOT NULL,
  content TEXT NOT NULL,
  max_points DECIMAL NOT NULL,
  solution TEXT NOT NULL,
  grading_criteria TEXT NOT NULL
);

CREATE TABLE exam_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ,
  scan_pdf_url TEXT,
  total_score_percent DECIMAL,
  status submission_status NOT NULL DEFAULT 'scanned'
);

CREATE TABLE exam_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES exam_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  student_answer_text TEXT,
  score_percent DECIMAL,
  error_analysis JSONB,
  confidence_score DECIMAL,
  llm_feedback TEXT,
  teacher_override BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE teacher_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  note_type TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================
-- Semester Plans
-- ==========================================

CREATE TABLE semester_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  schedule JSONB NOT NULL DEFAULT '{"days": []}'::jsonb,
  holidays JSONB NOT NULL DEFAULT '[]'::jsonb,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE semester_plan_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_plan_id UUID NOT NULL REFERENCES semester_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  entry_type entry_type NOT NULL,
  topic TEXT,
  assessment_type assessment_type,
  exam_id UUID REFERENCES exams(id),
  title TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  duration_minutes INT NOT NULL
);

CREATE TABLE semester_plan_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  semester_plan_id UUID NOT NULL REFERENCES semester_plans(id) ON DELETE CASCADE,
  version INT NOT NULL,
  snapshot JSONB NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  change_note TEXT
);

-- ==========================================
-- RLS for all new tables
-- ==========================================

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE flashcard_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_plan_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE semester_plan_versions ENABLE ROW LEVEL SECURITY;

-- Activity: students write own, teachers read class
CREATE POLICY "Students write own activity" ON activity_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students read own activity" ON activity_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers read class activity" ON activity_log FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c JOIN class_memberships cm ON cm.class_id = c.id WHERE c.teacher_id = auth.uid() AND cm.student_id = activity_log.user_id)
);

-- Exercise attempts: students write/read own, teachers read class
CREATE POLICY "Students write own attempts" ON exercise_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students read own attempts" ON exercise_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers read class attempts" ON exercise_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c JOIN class_memberships cm ON cm.class_id = c.id WHERE c.teacher_id = auth.uid() AND cm.student_id = exercise_attempts.user_id)
);

-- Flashcard progress: students own
CREATE POLICY "Students manage own flashcards" ON flashcard_progress FOR ALL USING (auth.uid() = user_id);

-- Conversations: students own
CREATE POLICY "Students manage own conversations" ON conversations FOR ALL USING (auth.uid() = user_id);

-- Messages: students own conversations
CREATE POLICY "Students manage own messages" ON messages FOR ALL USING (
  EXISTS (SELECT 1 FROM conversations c WHERE c.id = messages.conversation_id AND c.user_id = auth.uid())
);

-- Exams: teachers create/manage, students read when in class
CREATE POLICY "Teachers manage own exams" ON exams FOR ALL USING (created_by = auth.uid());
CREATE POLICY "Students read class exams" ON exams FOR SELECT USING (
  EXISTS (SELECT 1 FROM classes c JOIN class_memberships cm ON cm.class_id = c.id WHERE c.teacher_id = exams.created_by AND cm.student_id = auth.uid())
);

-- Exam questions: follow exam access
CREATE POLICY "Teachers manage exam questions" ON exam_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_questions.exam_id AND e.created_by = auth.uid())
);
CREATE POLICY "Students read exam questions" ON exam_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM exams e JOIN classes c ON c.teacher_id = e.created_by JOIN class_memberships cm ON cm.class_id = c.id WHERE e.id = exam_questions.exam_id AND cm.student_id = auth.uid())
);

-- Exam submissions: teacher manages, student reads own
CREATE POLICY "Teachers manage submissions" ON exam_submissions FOR ALL USING (
  EXISTS (SELECT 1 FROM exams e WHERE e.id = exam_submissions.exam_id AND e.created_by = auth.uid())
);
CREATE POLICY "Students read own submissions" ON exam_submissions FOR SELECT USING (student_id = auth.uid());

-- Exam answers: follow submission access
CREATE POLICY "Teachers manage answers" ON exam_answers FOR ALL USING (
  EXISTS (SELECT 1 FROM exam_submissions es JOIN exams e ON e.id = es.exam_id WHERE es.id = exam_answers.submission_id AND e.created_by = auth.uid())
);
CREATE POLICY "Students read own answers" ON exam_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM exam_submissions es WHERE es.id = exam_answers.submission_id AND es.student_id = auth.uid())
);

-- Teacher notes: teacher owns
CREATE POLICY "Teachers manage own notes" ON teacher_notes FOR ALL USING (teacher_id = auth.uid());

-- Semester plans: teacher manages, students in class read
CREATE POLICY "Teachers manage semester plans" ON semester_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM classes c WHERE c.id = semester_plans.class_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Students read class semester plans" ON semester_plans FOR SELECT USING (
  EXISTS (SELECT 1 FROM class_memberships cm WHERE cm.class_id = semester_plans.class_id AND cm.student_id = auth.uid())
);

-- Semester plan entries: follow plan access
CREATE POLICY "Teachers manage plan entries" ON semester_plan_entries FOR ALL USING (
  EXISTS (SELECT 1 FROM semester_plans sp JOIN classes c ON c.id = sp.class_id WHERE sp.id = semester_plan_entries.semester_plan_id AND c.teacher_id = auth.uid())
);
CREATE POLICY "Students read plan entries" ON semester_plan_entries FOR SELECT USING (
  EXISTS (SELECT 1 FROM semester_plans sp JOIN class_memberships cm ON cm.class_id = sp.class_id WHERE sp.id = semester_plan_entries.semester_plan_id AND cm.student_id = auth.uid())
);

-- Semester plan versions: teacher only
CREATE POLICY "Teachers manage plan versions" ON semester_plan_versions FOR ALL USING (
  EXISTS (SELECT 1 FROM semester_plans sp JOIN classes c ON c.id = sp.class_id WHERE sp.id = semester_plan_versions.semester_plan_id AND c.teacher_id = auth.uid())
);
