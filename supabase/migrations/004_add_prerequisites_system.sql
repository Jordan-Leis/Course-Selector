-- Add prerequisites and program requirements system
-- This migration adds tables for course prerequisites, antirequisites, 
-- and program-specific requirements

-- 1. Add prerequisites column to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS prerequisites_raw TEXT,
ADD COLUMN IF NOT EXISTS has_prerequisites BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_courses_has_prerequisites ON public.courses(has_prerequisites);

-- 2. Create course_prerequisites table for structured prerequisite data
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  prerequisite_type TEXT NOT NULL, -- 'course', 'level', 'corequisite', 'antirequisite'
  required_course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  required_course_code TEXT, -- e.g., 'ECE 250' (fallback if course not in DB)
  required_level TEXT, -- e.g., '2A', '3B'
  operator TEXT, -- 'AND', 'OR', 'ONE_OF', null for single requirement
  group_id INTEGER, -- for grouping related prerequisites (e.g., (A OR B) AND C)
  raw_text TEXT, -- original requirement text for reference
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course ON public.course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_required ON public.course_prerequisites(required_course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_type ON public.course_prerequisites(prerequisite_type);

-- 3. Create program_templates table for major-specific requirements
CREATE TABLE IF NOT EXISTS public.program_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_code TEXT NOT NULL UNIQUE, -- 'ECE_COMPUTER', 'ECE_ELECTRICAL', 'BME', etc.
  program_name TEXT NOT NULL,
  description TEXT,
  degree_type TEXT, -- 'BASc', 'BSE', etc.
  required_courses JSONB, -- structured list of required courses by term
  elective_requirements JSONB, -- rules for CSEs, TEs, etc.
  minimum_units NUMERIC DEFAULT 20.0, -- typical 5 years * 4 terms/year * 0.5 units/course * 2 courses
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_program_templates_code ON public.program_templates(program_code);

-- 4. Create user_programs table to link users to their selected program
CREATE TABLE IF NOT EXISTS public.user_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES public.program_templates(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT true,
  selected_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_user_programs_user ON public.user_programs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_programs_program ON public.user_programs(program_id);

-- 5. Add RLS policies for new tables

-- course_prerequisites: public read, no user writes (managed by sync)
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view course prerequisites"
  ON public.course_prerequisites FOR SELECT
  TO PUBLIC
  USING (true);

-- program_templates: public read, no user writes
ALTER TABLE public.program_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view program templates"
  ON public.program_templates FOR SELECT
  TO PUBLIC
  USING (true);

-- user_programs: users can manage their own program selections
ALTER TABLE public.user_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own program selections"
  ON public.user_programs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own program selections"
  ON public.user_programs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own program selections"
  ON public.user_programs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own program selections"
  ON public.user_programs FOR DELETE
  USING (user_id = auth.uid());

-- 6. Seed initial program templates for ECE

INSERT INTO public.program_templates (program_code, program_name, description, degree_type, required_courses, elective_requirements) VALUES
(
  'ECE_COMPUTER',
  'Computer Engineering',
  'Computer Engineering program at the University of Waterloo',
  'BASc',
  '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 200", "ECE 205", "ECE 222", "ECE 240", "ECE 250"],
    "2B": ["ECE 207", "ECE 224", "ECE 252", "ECE 290"]
  }'::jsonb,
  '{
    "CSE": {"required": 4, "description": "Complementary Studies Electives"},
    "TE": {"required": 5, "description": "Technical Electives"}
  }'::jsonb
),
(
  'ECE_ELECTRICAL',
  'Electrical Engineering',
  'Electrical Engineering program at the University of Waterloo',
  'BASc',
  '{
    "1A": ["ECE 105", "ECE 150", "ECE 190", "MATH 115", "MATH 117"],
    "1B": ["ECE 106", "ECE 108", "ECE 124", "ECE 140", "ECE 192", "MATH 119"],
    "2A": ["ECE 200", "ECE 205", "ECE 240", "ECE 209"],
    "2B": ["ECE 207", "ECE 290", "ECE 206"]
  }'::jsonb,
  '{
    "CSE": {"required": 4, "description": "Complementary Studies Electives"},
    "TE": {"required": 5, "description": "Technical Electives"}
  }'::jsonb
);

-- 7. Add trigger to update program_templates updated_at
CREATE OR REPLACE FUNCTION update_program_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_program_templates_updated_at_trigger
  BEFORE UPDATE ON public.program_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_program_templates_updated_at();
