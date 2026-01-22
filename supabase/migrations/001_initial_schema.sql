-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create courses table (public read)
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT NOT NULL,
    catalog_number TEXT NOT NULL,
    code TEXT,
    title TEXT NOT NULL,
    description TEXT,
    units NUMERIC,
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(subject, catalog_number)
);

-- Create index on code for faster searches
CREATE INDEX IF NOT EXISTS idx_courses_code ON public.courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_subject_catalog ON public.courses(subject, catalog_number);

-- Create profiles table (1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    program TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Create plans table
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on user_id for plans
CREATE INDEX IF NOT EXISTS idx_plans_user_id ON public.plans(user_id);

-- Create plan_terms table
CREATE TABLE IF NOT EXISTS public.plan_terms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    term_index INTEGER NOT NULL,
    label TEXT NOT NULL,
    UNIQUE(plan_id, term_index)
);

-- Create plan_term_courses table
CREATE TABLE IF NOT EXISTS public.plan_term_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_term_id UUID NOT NULL REFERENCES public.plan_terms(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id),
    position INTEGER NOT NULL DEFAULT 0,
    UNIQUE(plan_term_id, course_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_terms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_term_courses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (user_id = auth.uid());

-- RLS Policies for plans
CREATE POLICY "Users can view own plans"
    ON public.plans FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own plans"
    ON public.plans FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own plans"
    ON public.plans FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own plans"
    ON public.plans FOR DELETE
    USING (user_id = auth.uid());

-- RLS Policies for plan_terms
CREATE POLICY "Users can view own plan terms"
    ON public.plan_terms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_terms.plan_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own plan terms"
    ON public.plan_terms FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_terms.plan_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own plan terms"
    ON public.plan_terms FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_terms.plan_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own plan terms"
    ON public.plan_terms FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.plans
            WHERE plans.id = plan_terms.plan_id
            AND plans.user_id = auth.uid()
        )
    );

-- RLS Policies for plan_term_courses
CREATE POLICY "Users can view own plan term courses"
    ON public.plan_term_courses FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.plan_terms
            JOIN public.plans ON plans.id = plan_terms.plan_id
            WHERE plan_terms.id = plan_term_courses.plan_term_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own plan term courses"
    ON public.plan_term_courses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.plan_terms
            JOIN public.plans ON plans.id = plan_terms.plan_id
            WHERE plan_terms.id = plan_term_courses.plan_term_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own plan term courses"
    ON public.plan_term_courses FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM public.plan_terms
            JOIN public.plans ON plans.id = plan_terms.plan_id
            WHERE plan_terms.id = plan_term_courses.plan_term_id
            AND plans.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own plan term courses"
    ON public.plan_term_courses FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM public.plan_terms
            JOIN public.plans ON plans.id = plan_terms.plan_id
            WHERE plan_terms.id = plan_term_courses.plan_term_id
            AND plans.user_id = auth.uid()
        )
    );

-- Courses table is public read (no RLS needed, but we can add a policy for clarity)
-- Note: courses table doesn't have RLS enabled, so it's public read by default

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for courses table
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for plans table
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON public.plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email)
    VALUES (NEW.id, NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();