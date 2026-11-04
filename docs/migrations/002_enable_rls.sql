-- ============================================================================
-- EduRAG Scholar: Bulletproof Row-Level Security (RLS) Enablement
-- Version: 002_enable_rls.sql
-- Description: Automatically loops over all tables that exist in `public`,
--              enables Row-Level Security on each one, and safely creates policies.
-- ============================================================================

-- 1. Dynamically enable Row-Level Security on EVERY table present in the public schema
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
        RAISE NOTICE 'Enabled RLS on public.%', tbl;
    END LOOP;
END $$;

-- 2. Safely create policies ONLY on tables that actually exist in your database
DO $$
BEGIN
    -- PROFILES
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'profiles') THEN
        DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
        CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
        
        DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
    END IF;

    -- UNITS (Public syllabus catalog)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'units') THEN
        DROP POLICY IF EXISTS "Allow public read-only access to units" ON public.units;
        CREATE POLICY "Allow public read-only access to units" ON public.units FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- TIMETABLE SLOTS (Public lecture timetable)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'timetable_slots') THEN
        DROP POLICY IF EXISTS "Allow public read-only access to timetable" ON public.timetable_slots;
        CREATE POLICY "Allow public read-only access to timetable" ON public.timetable_slots FOR SELECT TO anon, authenticated USING (true);
    END IF;

    -- DOCUMENTS (Course documents metadata)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'documents') THEN
        DROP POLICY IF EXISTS "Allow authenticated read access to documents" ON public.documents;
        CREATE POLICY "Allow authenticated read access to documents" ON public.documents FOR SELECT TO authenticated USING (true);
    END IF;

    -- DOCUMENT CHUNKS (Vector chunks for lecture slides/textbooks)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'document_chunks') THEN
        DROP POLICY IF EXISTS "Allow authenticated read access to document chunks" ON public.document_chunks;
        CREATE POLICY "Allow authenticated read access to document chunks" ON public.document_chunks FOR SELECT TO authenticated USING (true);
    END IF;

    -- PAST PAPERS (Chiromo past papers)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'past_papers') THEN
        DROP POLICY IF EXISTS "Allow authenticated read access to past papers" ON public.past_papers;
        CREATE POLICY "Allow authenticated read access to past papers" ON public.past_papers FOR SELECT TO authenticated USING (true);
    END IF;

    -- CHAT SESSIONS (If present in Supabase)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_sessions') THEN
        DROP POLICY IF EXISTS "Students can only access own chat sessions" ON public.chat_sessions;
        CREATE POLICY "Students can only access own chat sessions" ON public.chat_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    -- CHAT MESSAGES (If present in Supabase)
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'chat_messages') THEN
        DROP POLICY IF EXISTS "Students can only access own chat messages" ON public.chat_messages;
        CREATE POLICY "Students can only access own chat messages" ON public.chat_messages FOR ALL TO authenticated USING (
            EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
        ) WITH CHECK (
            EXISTS (SELECT 1 FROM public.chat_sessions WHERE chat_sessions.id = chat_messages.session_id AND chat_sessions.user_id = auth.uid())
        );
    END IF;

    -- WEAKNESS LOGS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'weakness_logs') THEN
        DROP POLICY IF EXISTS "Students can only access own weakness logs" ON public.weakness_logs;
        CREATE POLICY "Students can only access own weakness logs" ON public.weakness_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;

    -- DAILY BRIEFINGS
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'daily_briefings') THEN
        DROP POLICY IF EXISTS "Students can only access own daily briefings" ON public.daily_briefings;
        CREATE POLICY "Students can only access own daily briefings" ON public.daily_briefings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
