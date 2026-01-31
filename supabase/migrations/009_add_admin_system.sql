-- Add admin system with role-based access control and audit logging
-- This migration creates tables and policies for admin users and audit logs

-- ============================================================================
-- 1. CREATE ADMIN_USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'program_editor', 'course_editor', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role);

COMMENT ON TABLE public.admin_users IS 
'Tracks admin users and their permission levels. Only users in this table can access admin features.';

COMMENT ON COLUMN public.admin_users.role IS 
'super_admin: full access; program_editor: edit program templates; course_editor: edit courses; viewer: read-only';

-- ============================================================================
-- 2. CREATE AUDIT_LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin_user ON public.audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(table_name, record_id);

COMMENT ON TABLE public.audit_log IS 
'Comprehensive audit trail of all admin actions. Stores before/after data for all changes.';

-- ============================================================================
-- 3. ENABLE RLS ON NEW TABLES
-- ============================================================================
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. CREATE HELPER FUNCTION TO CHECK ADMIN STATUS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_admin_role()
RETURNS TEXT AS $$
DECLARE
  admin_role TEXT;
BEGIN
  SELECT role INTO admin_role
  FROM public.admin_users
  WHERE user_id = auth.uid();
  
  RETURN admin_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (SELECT role FROM public.admin_users WHERE user_id = auth.uid()) = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. RLS POLICIES FOR ADMIN_USERS
-- ============================================================================
-- Admins can view all admin users
CREATE POLICY "Admins can view admin users"
  ON public.admin_users FOR SELECT
  USING (public.is_admin());

-- Only super admins can insert admin users
CREATE POLICY "Super admins can create admin users"
  ON public.admin_users FOR INSERT
  WITH CHECK (public.is_super_admin());

-- Only super admins can update admin users
CREATE POLICY "Super admins can update admin users"
  ON public.admin_users FOR UPDATE
  USING (public.is_super_admin());

-- Only super admins can delete admin users
CREATE POLICY "Super admins can delete admin users"
  ON public.admin_users FOR DELETE
  USING (public.is_super_admin());

-- ============================================================================
-- 6. RLS POLICIES FOR AUDIT_LOG
-- ============================================================================
-- Admins can view audit logs
CREATE POLICY "Admins can view audit log"
  ON public.audit_log FOR SELECT
  USING (public.is_admin());

-- System can insert audit logs (no user check needed for inserts)
CREATE POLICY "System can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (true);

-- No updates or deletes allowed on audit log (immutable)

-- ============================================================================
-- 7. UPDATE EXISTING TABLES TO ALLOW ADMIN ACCESS
-- ============================================================================
-- Allow admins to manage program templates
CREATE POLICY "Admins can manage program templates"
  ON public.program_templates FOR ALL
  USING (public.is_admin() AND get_admin_role() IN ('super_admin', 'program_editor'));

-- Allow admins to manage courses (super_admin and course_editor)
-- Note: Courses table doesn't have RLS yet, so we'll enable it
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- Public can read courses (existing functionality)
CREATE POLICY "Anyone can view courses"
  ON public.courses FOR SELECT
  USING (true);

-- Admins can insert/update/delete courses
CREATE POLICY "Admins can manage courses"
  ON public.courses FOR ALL
  USING (public.is_admin() AND get_admin_role() IN ('super_admin', 'course_editor'));

-- Allow admins to view all plans (for support/validation)
CREATE POLICY "Admins can view all plans"
  ON public.plans FOR SELECT
  USING (public.is_admin());

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- ============================================================================
-- 8. CREATE AUDIT LOGGING TRIGGER FUNCTION
-- ============================================================================
CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  admin_id UUID;
  action_type TEXT;
BEGIN
  -- Get admin user ID
  SELECT id INTO admin_id FROM public.admin_users WHERE user_id = auth.uid();
  
  -- Skip if not an admin action
  IF admin_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type := 'insert';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type := 'delete';
  END IF;
  
  -- Insert audit record
  INSERT INTO public.audit_log (
    admin_user_id,
    action_type,
    table_name,
    record_id,
    old_data,
    new_data,
    description
  ) VALUES (
    admin_id,
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.id::text, OLD.id::text),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    format('%s on %s by admin', TG_OP, TG_TABLE_NAME)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 9. ADD AUDIT TRIGGERS TO KEY TABLES
-- ============================================================================
-- Audit program template changes
CREATE TRIGGER audit_program_templates
  AFTER INSERT OR UPDATE OR DELETE ON public.program_templates
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Audit course changes
CREATE TRIGGER audit_courses
  AFTER INSERT OR UPDATE OR DELETE ON public.courses
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- Audit admin user changes
CREATE TRIGGER audit_admin_users
  AFTER INSERT OR UPDATE OR DELETE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ============================================================================
-- 10. ADD UPDATED_AT TRIGGER TO ADMIN_USERS
-- ============================================================================
CREATE TRIGGER update_admin_users_updated_at
  BEFORE UPDATE ON public.admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 11. GRANT NECESSARY PERMISSIONS
-- ============================================================================
-- Grant execute permissions on admin functions
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;
