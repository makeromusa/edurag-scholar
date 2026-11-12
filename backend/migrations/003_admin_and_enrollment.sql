-- ============================================================
-- Migration 003: Admin Dashboard + Unit Enrollment Support
-- EduRAG Scholar — University of Nairobi Chiromo
-- Run in: https://supabase.com/dashboard/project/xccrkalsujefsghtuirp/sql
-- ============================================================

-- 1. Extend profiles table
ALTER TABLE IF EXISTS public.profiles
  ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enrolled_units TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS full_name     TEXT;

-- 2. Grant super admin privileges
UPDATE public.profiles
SET is_admin = TRUE
WHERE email = 'makeromusa17@gmail.com';

-- 3. Extend units table for custom student-typed units
ALTER TABLE IF EXISTS public.units
  ADD COLUMN IF NOT EXISTS created_by      UUID,
  ADD COLUMN IF NOT EXISTS is_system_unit  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status          TEXT    DEFAULT 'active';

UPDATE public.units SET is_system_unit = TRUE WHERE is_system_unit IS NULL;

-- 4. Create broadcasts table
CREATE TABLE IF NOT EXISTS public.broadcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT 'all',
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

-- 5. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enable Row-Level Security (RLS)
ALTER TABLE public.broadcasts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- 7. Safely configure RLS policies
DROP POLICY IF EXISTS "service_role_broadcasts" ON public.broadcasts;
CREATE POLICY "service_role_broadcasts" ON public.broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_audit_log" ON public.admin_audit_log;
CREATE POLICY "service_role_audit_log" ON public.admin_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_read_active_broadcasts" ON public.broadcasts;
CREATE POLICY "public_read_active_broadcasts" ON public.broadcasts
  FOR SELECT TO authenticated USING (is_active = TRUE);

DROP POLICY IF EXISTS "anon_read_active_broadcasts" ON public.broadcasts;
CREATE POLICY "anon_read_active_broadcasts" ON public.broadcasts
  FOR SELECT TO anon USING (is_active = TRUE);
