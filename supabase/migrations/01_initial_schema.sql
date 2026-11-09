-- ====================================================================
-- SIPRESMA — Sistem Informasi Presensi Madrasah MAN 4 Kediri
-- Supabase PostgreSQL Initial Migration & Row Level Security (RLS)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('ADMIN', 'SEKRETARIS', 'KESISWAAN');
CREATE TYPE attendance_status AS ENUM ('H', 'S', 'I', 'A');
CREATE TYPE gender_type AS ENUM ('L', 'P');

-- 3. PROFILES TABLE (Linked with auth.users if Supabase Auth is enabled)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE,
    username VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role NOT NULL DEFAULT 'SEKRETARIS',
    assigned_class_id UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    password_hash VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. ACADEMIC YEARS TABLE
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. SEMESTERS TABLE
CREATE TABLE IF NOT EXISTS public.semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    semester_name VARCHAR(20) NOT NULL CHECK (semester_name IN ('Ganjil', 'Genap')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CLASSES TABLE
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_name VARCHAR(50) NOT NULL,
    grade_level VARCHAR(10) NOT NULL CHECK (grade_level IN ('X', 'XI', 'XII')),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
    secretary_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint back to profiles.assigned_class_id
ALTER TABLE public.profiles
    ADD CONSTRAINT fk_assigned_class
    FOREIGN KEY (assigned_class_id)
    REFERENCES public.classes(id)
    ON DELETE SET NULL;

-- 7. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nis VARCHAR(30) NOT NULL,
    nisn VARCHAR(30),
    full_name VARCHAR(150) NOT NULL,
    gender gender_type NOT NULL DEFAULT 'L',
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_student_nis_year UNIQUE (nis, academic_year_id)
);

-- 8. ATTENDANCE TABLE (Daily records with unique constraint per student & date)
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    attendance_date DATE NOT NULL,
    status attendance_status NOT NULL,
    notes TEXT,
    recorded_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_attendance_student_date UNIQUE (student_id, attendance_date)
);

-- 9. SCHOOL SETTINGS TABLE
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name VARCHAR(150) NOT NULL DEFAULT 'MAN 4 Kediri',
    school_address TEXT NOT NULL DEFAULT 'Jl. Harinjing No. 16 Bendo, Pare, Kab. Kediri, Jawa Timur 64225',
    logo_url TEXT DEFAULT '',
    principal_name VARCHAR(150) NOT NULL DEFAULT 'Drs. H. Slamet Hariyanto, M.Pd.I',
    principal_nip VARCHAR(50) NOT NULL DEFAULT '196805121994031002',
    student_affairs_name VARCHAR(150) NOT NULL DEFAULT 'Drs. Moh. Zaenal Arifin, M.Pd',
    student_affairs_nip VARCHAR(50) NOT NULL DEFAULT '197108151998031005',
    report_preparer_name VARCHAR(150) NOT NULL DEFAULT 'Sekretaris Kelas / Staf Kesiswaan',
    report_signatory_title VARCHAR(100) NOT NULL DEFAULT 'Kepala Madrasah & Waka Kesiswaan',
    report_city VARCHAR(100) NOT NULL DEFAULT 'Kediri',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. SCHOOL CALENDAR TABLE
CREATE TABLE IF NOT EXISTS public.school_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    calendar_date DATE NOT NULL UNIQUE,
    is_school_day BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255) DEFAULT 'Hari Efektif Belajar',
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE
);

-- 11. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE RECAPS & QUERIES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_class_date ON public.attendance(class_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_nis ON public.students(nis);
CREATE INDEX IF NOT EXISTS idx_students_is_active ON public.students(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_grade_level ON public.classes(grade_level);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check role from current session
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role AS $$
    SELECT role FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_user_class_id()
RETURNS UUID AS $$
    SELECT assigned_class_id FROM public.profiles WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- RLS: PROFILES
-- Admin: full access
CREATE POLICY "Admin has full access on profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.current_user_role() = 'ADMIN');

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- RLS: ATTENDANCE
-- Admin: full access
CREATE POLICY "Admin full access on attendance"
    ON public.attendance FOR ALL
    TO authenticated
    USING (public.current_user_role() = 'ADMIN');

-- Kesiswaan: read-only access for entire madrasah
CREATE POLICY "Kesiswaan view all attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'KESISWAAN');

-- Sekretaris: view attendance of assigned class
CREATE POLICY "Sekretaris view assigned class attendance"
    ON public.attendance FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

-- Sekretaris: insert/update attendance of assigned class only
CREATE POLICY "Sekretaris insert assigned class attendance"
    ON public.attendance FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

CREATE POLICY "Sekretaris update assigned class attendance"
    ON public.attendance FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

-- RLS: STUDENTS
-- Admin: full access
CREATE POLICY "Admin full access on students"
    ON public.students FOR ALL
    TO authenticated
    USING (public.current_user_role() = 'ADMIN');

-- Kesiswaan: view all students
CREATE POLICY "Kesiswaan view all students"
    ON public.students FOR SELECT
    TO authenticated
    USING (public.current_user_role() = 'KESISWAAN');

-- Sekretaris: view & manage students in assigned class
CREATE POLICY "Sekretaris view assigned class students"
    ON public.students FOR SELECT
    TO authenticated
    USING (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

CREATE POLICY "Sekretaris insert assigned class students"
    ON public.students FOR INSERT
    TO authenticated
    WITH CHECK (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

CREATE POLICY "Sekretaris update assigned class students"
    ON public.students FOR UPDATE
    TO authenticated
    USING (
        public.current_user_role() = 'SEKRETARIS'
        AND class_id = public.current_user_class_id()
    );

-- RLS: CLASSES & SETTINGS (Readable by all authenticated, manageable by Admin)
CREATE POLICY "All authenticated view classes"
    ON public.classes FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin manage classes"
    ON public.classes FOR ALL TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated view settings"
    ON public.school_settings FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin manage settings"
    ON public.school_settings FOR ALL TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated view calendar"
    ON public.school_calendar FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin manage calendar"
    ON public.school_calendar FOR ALL TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated view academic years"
    ON public.academic_years FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin manage academic years"
    ON public.academic_years FOR ALL TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "All authenticated view semesters"
    ON public.semesters FOR SELECT TO authenticated USING (TRUE);

CREATE POLICY "Admin manage semesters"
    ON public.semesters FOR ALL TO authenticated USING (public.current_user_role() = 'ADMIN');

-- RLS: AUDIT LOGS
CREATE POLICY "Admin view all audit logs"
    ON public.audit_logs FOR SELECT TO authenticated USING (public.current_user_role() = 'ADMIN');

CREATE POLICY "Authenticated users can insert audit logs"
    ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (TRUE);

-- ====================================================================
-- SEED DATA: INITIAL MADRASAH SETTINGS & BOOTSTRAP ADMIN
-- ====================================================================
INSERT INTO public.school_settings (
    school_name,
    school_address,
    principal_name,
    principal_nip,
    student_affairs_name,
    student_affairs_nip,
    report_preparer_name,
    report_signatory_title,
    report_city
) VALUES (
    'MAN 4 Kediri',
    'Jl. Harinjing No. 16 Bendo, Pare, Kab. Kediri, Jawa Timur 64225',
    'Drs. H. Slamet Hariyanto, M.Pd.I',
    '196805121994031002',
    'Drs. Moh. Zaenal Arifin, M.Pd',
    '197108151998031005',
    'Sekretaris Kelas / Waka Kesiswaan',
    'Kepala Madrasah & Waka Kesiswaan',
    'Kediri'
) ON CONFLICT DO NOTHING;
