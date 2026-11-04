-- ============================================================================
-- EduRAG Scholar: Enable Row-Level Security (RLS) on all Public Tables
-- Version: 002_enable_rls.sql
-- Description: Resolves Supabase Security Advisor "rls_disabled_in_public"
--              Protects database against unauthorized REST API tampering.
-- ============================================================================

-- 1. Enable RLS on all 10 public tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weakness_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_briefings ENABLE ROW LEVEL SECURITY;

-- Note: The FastAPI backend connects using `SUPABASE_SERVICE_ROLE_KEY`.
-- The Postgres `service_role` super-user automatically BYPASSES Row Level Security (BYPASSRLS).
-- The policies below govern access for anonymous (anon) and authenticated (student) users.

-- 2. Profiles Table: Users can only read & update their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- 3. Units & Timetable: Public read-only for syllabus & class schedule
DROP POLICY IF EXISTS "Allow public read-only access to units" ON public.units;
CREATE POLICY "Allow public read-only access to units"
    ON public.units FOR SELECT
    TO anon, authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow public read-only access to timetable" ON public.timetable_slots;
CREATE POLICY "Allow public read-only access to timetable"
    ON public.timetable_slots FOR SELECT
    TO anon, authenticated
    USING (true);

-- 4. Documents & Past Papers: Read-only access for authenticated students
DROP POLICY IF EXISTS "Allow authenticated read access to documents" ON public.documents;
CREATE POLICY "Allow authenticated read access to documents"
    ON public.documents FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read access to document chunks" ON public.document_chunks;
CREATE POLICY "Allow authenticated read access to document chunks"
    ON public.document_chunks FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Allow authenticated read access to past papers" ON public.past_papers;
CREATE POLICY "Allow authenticated read access to past papers"
    ON public.past_papers FOR SELECT
    TO authenticated
    USING (true);

-- 5. Chat Sessions & Messages: Strict isolation per student user
DROP POLICY IF EXISTS "Students can only access own chat sessions" ON public.chat_sessions;
CREATE POLICY "Students can only access own chat sessions"
    ON public.chat_sessions FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can only access own chat messages" ON public.chat_messages;
CREATE POLICY "Students can only access own chat messages"
    ON public.chat_messages FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
              AND chat_sessions.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_sessions
            WHERE chat_sessions.id = chat_messages.session_id
              AND chat_sessions.user_id = auth.uid()
        )
    );

-- 6. Weakness Logs & Daily Briefings: Strict student isolation
DROP POLICY IF EXISTS "Students can only access own weakness logs" ON public.weakness_logs;
CREATE POLICY "Students can only access own weakness logs"
    ON public.weakness_logs FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Students can only access own daily briefings" ON public.daily_briefings;
CREATE POLICY "Students can only access own daily briefings"
    ON public.daily_briefings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
