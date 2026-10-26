-- ============================================================================
-- EduRAG Scholar: Supabase PostgreSQL + pgvector Initial Schema Migration
-- Version: 001_initial_schema.sql
-- Description: Sets up 7-unit metadata tables, pgvector index, timetable, and RAG schemas.
-- ============================================================================

-- 1. Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 2. Clean teardown if rebuilding (comment out in production)
-- DROP TABLE IF EXISTS daily_briefings CASCADE;
-- DROP TABLE IF EXISTS weakness_logs CASCADE;
-- DROP TABLE IF EXISTS chat_messages CASCADE;
-- DROP TABLE IF EXISTS chat_sessions CASCADE;
-- DROP TABLE IF EXISTS past_papers CASCADE;
-- DROP TABLE IF EXISTS document_chunks CASCADE;
-- DROP TABLE IF EXISTS documents CASCADE;
-- DROP TABLE IF EXISTS timetable_slots CASCADE;
-- DROP TABLE IF EXISTS units CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- 3. Profiles / RBAC table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'student_peer' CHECK (role IN ('admin_owner', 'student_peer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. Units Catalog (Strict 7 Units)
CREATE TABLE IF NOT EXISTS public.units (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    lecturer TEXT NOT NULL,
    venue TEXT NOT NULL DEFAULT 'LG01',
    semester INTEGER NOT NULL DEFAULT 1,
    academic_year TEXT NOT NULL DEFAULT '2026/2027',
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. Timetable Slots (Directly feeds 3 AM Abstractor)
CREATE TABLE IF NOT EXISTS public.timetable_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 5=Friday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue TEXT NOT NULL DEFAULT 'LG01',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Documents Metadata Catalog
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'pptx', 'docx', 'scanned_image', 'past_paper')),
    storage_url TEXT NOT NULL,
    file_size_bytes BIGINT,
    page_count INTEGER DEFAULT 0,
    is_processed BOOLEAN NOT NULL DEFAULT false,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. Document Chunks & Vector Store (1536-dim for text-embedding-3-small)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    page_number INTEGER NOT NULL DEFAULT 1,
    slide_title TEXT,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Azure OpenAI text-embedding-3-small
    token_count INTEGER,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Fast HNSW cosine index for unit-isolated vector search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding_hnsw 
ON public.document_chunks USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_document_chunks_unit_code 
ON public.document_chunks(unit_code);

-- 8. Past Papers Specialized Catalog
CREATE TABLE IF NOT EXISTS public.past_papers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    exam_year INTEGER NOT NULL,
    exam_month TEXT NOT NULL DEFAULT 'December',
    paper_type TEXT NOT NULL DEFAULT 'Main' CHECK (paper_type IN ('Main', 'Supplementary', 'Special', 'CAT')),
    topic_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 9. Chat Sessions & Messages
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Study Session',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    web_search_used BOOLEAN NOT NULL DEFAULT false,
    external_sources JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 10. Student Weakness Tracking (Feeds 3 AM Nightly Abstractor Remediation)
CREATE TABLE IF NOT EXISTS public.weakness_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_code TEXT NOT NULL REFERENCES public.units(code) ON DELETE CASCADE,
    topic_name TEXT NOT NULL,
    question_context TEXT,
    error_pattern TEXT,
    difficulty_score INTEGER DEFAULT 3 CHECK (difficulty_score BETWEEN 1 AND 5),
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 11. Daily Morning Briefings (Generated by 3 AM Abstractor)
CREATE TABLE IF NOT EXISTS public.daily_briefings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    briefing_date DATE NOT NULL,
    markdown_content TEXT NOT NULL,
    scheduled_units TEXT[] NOT NULL DEFAULT '{}',
    emailed BOOLEAN NOT NULL DEFAULT false,
    email_delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(user_id, briefing_date)
);

-- 12. Seed the 7 UoN Units
INSERT INTO public.units (code, name, lecturer, venue, semester, academic_year, description)
VALUES
    ('SMA 2114', 'Differential and Integral Calculus', 'Dr. Okeyo', 'LG01', 1, '2026/2027', 'Calculus, differentiation, integration, series, and analytical applications.'),
    ('SCS 3201', 'Systems Analysis and Design', 'Mr. Shonyela Ochukut', 'LG01', 1, '2026/2027', 'Information systems planning, UML modeling, system lifecycles, and architectural design.'),
    ('SCS 3203', 'Computer Architecture', 'Dr. Yohanna', 'LG01', 1, '2026/2027', 'Instruction set architectures, CPU pipeline design, register transfer, memory hierarchies.'),
    ('SCS 3205', 'Knowledge-Based Systems & Programming', 'Dr. Mutemi', 'LG01', 1, '2026/2027', 'Expert systems, propositional logic, inference engines, semantic networks.'),
    ('SCS 3207', 'Operating Systems', 'Dr. Miriti', 'LG01', 1, '2026/2027', 'Process management, concurrency, deadlock prevention, virtual memory, paging.'),
    ('SCS 3209', 'Software Engineering', 'Mr. Gordon', 'LG01', 1, '2026/2027', 'Agile principles, design patterns, testing frameworks, CI/CD, software quality metrics.'),
    ('CSC 3211', 'Computer Networks', 'Ms. Ronge', 'LG01', 1, '2026/2027', 'OSI model, TCP/IP, IP addressing, subnetting, routing protocols, physical transmission.')
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name, lecturer = EXCLUDED.lecturer, venue = EXCLUDED.venue;

-- 13. Seed the Chiromo Timetable (Mon=1 ... Fri=5)
INSERT INTO public.timetable_slots (unit_code, day_of_week, start_time, end_time, venue)
VALUES
    -- Monday
    ('SCS 3201', 1, '09:00:00', '10:45:00', 'LG01'),
    ('SCS 3207', 1, '11:15:00', '13:00:00', 'LG01'),
    ('CSC 3211', 1, '14:00:00', '15:45:00', 'LG01'),
    -- Tuesday
    ('SMA 2114', 2, '09:00:00', '10:45:00', 'LG01'),
    ('SCS 3203', 2, '11:15:00', '13:00:00', 'LG01'),
    ('SCS 3205', 2, '14:00:00', '15:45:00', 'LG01'),
    -- Wednesday
    ('SCS 3207', 3, '09:00:00', '10:45:00', 'LG01'),
    ('SCS 3201', 3, '11:15:00', '13:00:00', 'LG01'),
    -- Thursday
    ('SCS 3209', 4, '09:00:00', '10:45:00', 'LG01'),
    ('SCS 3203', 4, '11:15:00', '13:00:00', 'LG01'),
    ('SCS 3205', 4, '14:00:00', '15:45:00', 'LG01'),
    -- Friday
    ('SMA 2114', 5, '09:00:00', '10:45:00', 'LG01'),
    ('CSC 3211', 5, '11:15:00', '13:00:00', 'LG01'),
    ('SCS 3209', 5, '14:00:00', '15:45:00', 'LG01');

-- 14. Vector Search Function for Unit Isolation
CREATE OR REPLACE FUNCTION match_unit_chunks(
    p_unit_code TEXT,
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.65,
    match_count INT DEFAULT 6
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    unit_code TEXT,
    page_number INT,
    slide_title TEXT,
    content TEXT,
    similarity FLOAT,
    metadata JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_id,
        dc.unit_code,
        dc.page_number,
        dc.slide_title,
        dc.content,
        1 - (dc.embedding <=> query_embedding) AS similarity,
        dc.metadata
    FROM public.document_chunks dc
    WHERE dc.unit_code = p_unit_code
      AND 1 - (dc.embedding <=> query_embedding) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
