-- ============================================================
-- Migration 003: Admin Dashboard + Unit Enrollment Support
-- EduRAG Scholar — University of Nairobi Chiromo
-- Run in: https://supabase.com/dashboard/project/xccrkalsujefsghtuirp/sql
-- ============================================================

-- 1. Extend profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_admin      BOOLEAN   DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enrolled_units TEXT[]   DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS full_name     TEXT;

-- 2. Set super admin
-- NOTE: Run AFTER makeromusa17@gmail.com has signed in at least once
-- (a profile row must exist). If the user doesn't exist yet, this UPDATE
-- will silently do nothing — re-run after first login.
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'makeromusa17@gmail.com';

-- 3. Extend units table
ALTER TABLE units
  ADD COLUMN IF NOT EXISTS created_by      UUID,
  ADD COLUMN IF NOT EXISTS is_system_unit  BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS status          TEXT    DEFAULT 'active';

-- Mark existing seeded units as system units
UPDATE units SET is_system_unit = TRUE WHERE is_system_unit IS NULL;

-- 4. Create broadcasts table
CREATE TABLE IF NOT EXISTS broadcasts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT 'all',
  created_by  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

-- 5. Create admin_audit_log table
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Grant service role access (required for admin client bypass of RLS)
ALTER TABLE broadcasts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log   ENABLE ROW LEVEL SECURITY;

-- Allow service role (used by backend admin client) full access
CREATE POLICY IF NOT EXISTS "service_role_broadcasts" ON broadcasts
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "service_role_audit_log" ON admin_audit_log
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Public can read active broadcasts
CREATE POLICY IF NOT EXISTS "public_read_active_broadcasts" ON broadcasts
  FOR SELECT TO authenticated USING (is_active = TRUE);
