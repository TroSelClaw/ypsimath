-- Migration 0001: User and class tables
-- YpsiMath

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role enum
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  auth_provider TEXT NOT NULL DEFAULT 'email',
  provider_user_id TEXT,
  school_org_id TEXT,
  settings JSONB DEFAULT '{"theme": "dark"}'::jsonb,
  deactivated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Student profiles (extended student data)
CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  current_subject TEXT NOT NULL DEFAULT 'r1',
  goals JSONB DEFAULT '{}'::jsonb,
  learning_style_prefs JSONB DEFAULT '{}'::jsonb,
  mastered_competency_goals TEXT[] DEFAULT '{}',
  struggling_competency_goals TEXT[] DEFAULT '{}',
  total_exercises_completed INT NOT NULL DEFAULT 0,
  total_time_spent_minutes INT NOT NULL DEFAULT 0
);

-- Classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  subject_id TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_year TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Class memberships
CREATE TABLE class_memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- Trigger: auto-create profiles row on new auth.users signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'student')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_memberships ENABLE ROW LEVEL SECURITY;

-- Profiles: users read/update own; teachers read class members; admins read all
CREATE POLICY "Users read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers read class members"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN class_memberships cm ON cm.class_id = c.id
      WHERE c.teacher_id = auth.uid() AND cm.student_id = profiles.id
    )
  );

CREATE POLICY "Admins read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Student profiles: own + teacher of class + admin
CREATE POLICY "Students read own student_profile"
  ON student_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Students update own student_profile"
  ON student_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Teachers read class student_profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN class_memberships cm ON cm.class_id = c.id
      WHERE c.teacher_id = auth.uid() AND cm.student_id = student_profiles.id
    )
  );

CREATE POLICY "Admins read all student_profiles"
  ON student_profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Classes: teacher owns; students see their classes; admins see all
CREATE POLICY "Teachers manage own classes"
  ON classes FOR ALL
  USING (teacher_id = auth.uid());

CREATE POLICY "Students see enrolled classes"
  ON classes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM class_memberships cm
      WHERE cm.class_id = classes.id AND cm.student_id = auth.uid()
    )
  );

CREATE POLICY "Admins see all classes"
  ON classes FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );

-- Class memberships: teacher of class + the student + admin
CREATE POLICY "Teachers manage class memberships"
  ON class_memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM classes c WHERE c.id = class_memberships.class_id AND c.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students see own memberships"
  ON class_memberships FOR SELECT
  USING (student_id = auth.uid());

CREATE POLICY "Admins see all memberships"
  ON class_memberships FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
