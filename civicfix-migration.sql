-- CivicFix Severity Scoring System Migration
-- Created: 2026-09-16
-- Description: Adds severity scoring, SLA tracking, categories, and community engagement features

-- ============================================================================
-- 1. ADD SEVERITY COLUMNS TO ISSUES TABLE
-- ============================================================================

ALTER TABLE issues
ADD COLUMN IF NOT EXISTS severity_score NUMERIC(5,2) CHECK (severity_score >= 0 AND severity_score <= 100),
ADD COLUMN IF NOT EXISTS severity_level TEXT CHECK (severity_level IN ('S1', 'S2', 'S3', 'S4', 'S5')),
ADD COLUMN IF NOT EXISTS category_weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS location_weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS community_weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS time_weight NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS sla_target_hours INTEGER,
ADD COLUMN IF NOT EXISTS sla_breach_at TIMESTAMPTZ;

-- Add index for severity-based queries
CREATE INDEX IF NOT EXISTS idx_issues_severity_level ON issues(severity_level);
CREATE INDEX IF NOT EXISTS idx_issues_severity_score ON issues(severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_issues_sla_breach ON issues(sla_breach_at) WHERE sla_breach_at IS NOT NULL;

-- ============================================================================
-- 2. CREATE CATEGORIES TABLE (REPLACES ENUM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name_en TEXT NOT NULL,
    name_hi TEXT NOT NULL,
    icon TEXT NOT NULL,
    base_severity NUMERIC(5,2) DEFAULT 50 CHECK (base_severity >= 0 AND base_severity <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- ============================================================================
-- 3. SEED CATEGORIES (20+ ISSUE TYPES)
-- ============================================================================

INSERT INTO categories (slug, name_en, name_hi, icon, base_severity) VALUES
-- Existing categories
('pothole', 'Pothole', 'गड्ढा', '🕳️', 65),
('street_light', 'Street Light', 'स्ट्रीट लाइट', '💡', 55),
('garbage_dump', 'Garbage Dump', 'कचरे का ढेर', '🗑️', 70),
('water_leakage', 'Water Leakage', 'पानी का रिसाव', '💧', 60),

-- New categories
('broken_sidewalk', 'Broken Sidewalk', 'टूटा फुटपाथ', '🚶', 50),
('drainage_blocked', 'Drainage Blocked', 'नाली बंद', '🚰', 65),
('traffic_signal_broken', 'Traffic Signal Broken', 'ट्रैफिक सिग्नल खराब', '🚦', 80),
('manhole_open', 'Open Manhole', 'खुला मैनहोल', '⚠️', 90),
('stray_animals', 'Stray Animals', 'आवारा जानवर', '🐕', 40),
('illegal_construction', 'Illegal Construction', 'अवैध निर्माण', '🏗️', 55),
('tree_fallen', 'Fallen Tree', 'गिरा पेड़', '🌳', 75),
('noise_pollution', 'Noise Pollution', 'ध्वनि प्रदूषण', '🔊', 35),
('air_pollution', 'Air Pollution', 'वायु प्रदूषण', '💨', 45),
('graffiti', 'Graffiti/Vandalism', 'भित्तिचित्र', '🎨', 30),
('illegal_parking', 'Illegal Parking', 'अवैध पार्किंग', '🚗', 40),
('road_sign_missing', 'Road Sign Missing', 'रोड साइन गायब', '🚸', 50),
('public_toilet_broken', 'Public Toilet Broken', 'सार्वजनिक शौचालय खराब', '🚻', 60),
('park_maintenance', 'Park Maintenance', 'पार्क रखरखाव', '🌳', 35),
('electric_wire_hanging', 'Hanging Electric Wire', 'लटकती बिजली की तार', '⚡', 85),
('building_collapse_risk', 'Building Collapse Risk', 'इमारत गिरने का खतरा', '🏚️', 95),
('bridge_damage', 'Bridge Damage', 'पुल क्षतिग्रस्त', '🌉', 80),
('waterlogging', 'Waterlogging', 'जलभराव', '🌊', 70),
('sewer_overflow', 'Sewer Overflow', 'सीवर ओवरफ्लो', '🚽', 75),
('road_cave_in', 'Road Cave-in', 'सड़क धंसाव', '⚠️', 90)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 4. CREATE COMMUNITY ENGAGEMENT TABLES
-- ============================================================================

-- Issue Upvotes (for community priority)
CREATE TABLE IF NOT EXISTS issue_upvotes (
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (issue_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_issue_upvotes_issue ON issue_upvotes(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_upvotes_user ON issue_upvotes(user_id);

-- Issue Comments (for community discussion)
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_comments_issue ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_comments_user ON issue_comments(user_id);

-- Issue Verifications (citizen verification with photos)
CREATE TABLE IF NOT EXISTS issue_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    verification_type TEXT CHECK (verification_type IN ('confirmed', 'resolved', 'worsened', 'duplicate')),
    image_url TEXT,
    notes TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_issue_verifications_issue ON issue_verifications(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_verifications_type ON issue_verifications(verification_type);

-- Issue Recurrences (historical pattern tracking)
CREATE TABLE IF NOT EXISTS issue_recurrences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    category TEXT NOT NULL,
    occurrences INTEGER DEFAULT 1,
    first_reported_at TIMESTAMPTZ DEFAULT NOW(),
    last_reported_at TIMESTAMPTZ DEFAULT NOW(),
    auto_escalated BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_issue_recurrences_location ON issue_recurrences USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_issue_recurrences_category ON issue_recurrences(category);
CREATE INDEX IF NOT EXISTS idx_issue_recurrences_occurrences ON issue_recurrences(occurrences DESC);

-- ============================================================================
-- 5. SEVERITY CALCULATION RPC FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_severity(p_issue_id UUID)
RETURNS TABLE(
    severity_score NUMERIC,
    severity_level TEXT,
    category_weight NUMERIC,
    location_weight NUMERIC,
    community_weight NUMERIC,
    time_weight NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_category TEXT;
    v_location GEOGRAPHY;
    v_created_at TIMESTAMPTZ;
    v_base_severity NUMERIC;

    -- Weight factors (0-100 scale)
    v_category_score NUMERIC := 0;
    v_location_score NUMERIC := 0;
    v_community_score NUMERIC := 0;
    v_time_score NUMERIC := 0;

    -- Weighted contributions (percentages)
    v_category_weight NUMERIC := 0.30;
    v_location_weight NUMERIC := 0.25;
    v_community_weight NUMERIC := 0.25;
    v_time_weight NUMERIC := 0.20;

    -- Calculated values
    v_final_score NUMERIC;
    v_final_level TEXT;

    -- Community metrics
    v_upvote_count INTEGER;
    v_comment_count INTEGER;
    v_verification_count INTEGER;
    v_recurrence_count INTEGER;

    -- Time metrics
    v_hours_old NUMERIC;
BEGIN
    -- Fetch issue data
    SELECT i.category, i.location, i.created_at
    INTO v_category, v_location, v_created_at
    FROM issues i
    WHERE i.id = p_issue_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Issue not found: %', p_issue_id;
    END IF;

    -- ========================================================================
    -- CATEGORY WEIGHT (30%): Base severity from category
    -- ========================================================================
    SELECT c.base_severity INTO v_base_severity
    FROM categories c
    WHERE c.slug = v_category;

    v_category_score := COALESCE(v_base_severity, 50);

    -- ========================================================================
    -- LOCATION WEIGHT (25%): Recurrence patterns + proximity to critical areas
    -- ========================================================================

    -- Count nearby recurrences (within 100m)
    SELECT COUNT(*) INTO v_recurrence_count
    FROM issue_recurrences ir
    WHERE ir.category = v_category
    AND ST_DWithin(ir.location, v_location, 100);

    -- Base score 40, +10 per recurrence (max 100)
    v_location_score := LEAST(40 + (v_recurrence_count * 15), 100);

    -- ========================================================================
    -- COMMUNITY WEIGHT (25%): Engagement metrics
    -- ========================================================================

    -- Count upvotes
    SELECT COUNT(*) INTO v_upvote_count
    FROM issue_upvotes
    WHERE issue_id = p_issue_id;

    -- Count comments
    SELECT COUNT(*) INTO v_comment_count
    FROM issue_comments
    WHERE issue_id = p_issue_id;

    -- Count verifications (weight confirmed/worsened higher)
    SELECT COUNT(*) INTO v_verification_count
    FROM issue_verifications
    WHERE issue_id = p_issue_id
    AND verification_type IN ('confirmed', 'worsened');

    -- Community score formula: engagement drives urgency
    -- Base 30, +3 per upvote, +5 per comment, +10 per verification
    v_community_score := LEAST(
        30 + (v_upvote_count * 3) + (v_comment_count * 5) + (v_verification_count * 10),
        100
    );

    -- ========================================================================
    -- TIME WEIGHT (20%): Age of issue
    -- ========================================================================

    v_hours_old := EXTRACT(EPOCH FROM (NOW() - v_created_at)) / 3600;

    -- Exponential decay: newer issues get higher time scores
    -- 0-24h: 80-100, 24-72h: 60-80, 72h-1w: 40-60, 1w+: 20-40
    v_time_score := CASE
        WHEN v_hours_old <= 24 THEN 100 - (v_hours_old * 0.833) -- 80-100
        WHEN v_hours_old <= 72 THEN 80 - ((v_hours_old - 24) * 0.417) -- 60-80
        WHEN v_hours_old <= 168 THEN 60 - ((v_hours_old - 72) * 0.208) -- 40-60
        ELSE GREATEST(20, 40 - ((v_hours_old - 168) / 168 * 10)) -- 20-40, floor at 20
    END;

    -- ========================================================================
    -- FINAL CALCULATION
    -- ========================================================================

    v_final_score := (
        (v_category_score * v_category_weight) +
        (v_location_score * v_location_weight) +
        (v_community_score * v_community_weight) +
        (v_time_score * v_time_weight)
    );

    -- Map to severity levels (S1-S5)
    v_final_level := CASE
        WHEN v_final_score >= 80 THEN 'S5' -- Critical
        WHEN v_final_score >= 65 THEN 'S4' -- High
        WHEN v_final_score >= 50 THEN 'S3' -- Medium
        WHEN v_final_score >= 35 THEN 'S2' -- Low
        ELSE 'S1' -- Minimal
    END;

    -- ========================================================================
    -- UPDATE ISSUE RECORD
    -- ========================================================================

    UPDATE issues
    SET
        severity_score = v_final_score,
        severity_level = v_final_level,
        category_weight = v_category_score * v_category_weight,
        location_weight = v_location_score * v_location_weight,
        community_weight = v_community_score * v_community_weight,
        time_weight = v_time_score * v_time_weight
    WHERE id = p_issue_id;

    -- Return calculated values
    RETURN QUERY
    SELECT
        v_final_score,
        v_final_level,
        v_category_score * v_category_weight,
        v_location_score * v_location_weight,
        v_community_score * v_community_weight,
        v_time_score * v_time_weight;
END;
$$;

-- ============================================================================
-- 6. SLA BREACH TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION set_sla_breach_time()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_target_hours INTEGER;
BEGIN
    -- Map severity level to SLA hours
    v_target_hours := CASE NEW.severity_level
        WHEN 'S5' THEN 4      -- Critical: 4 hours
        WHEN 'S4' THEN 12     -- High: 12 hours
        WHEN 'S3' THEN 48     -- Medium: 2 days
        WHEN 'S2' THEN 168    -- Low: 1 week
        WHEN 'S1' THEN 336    -- Minimal: 2 weeks
        ELSE 168              -- Default: 1 week
    END;

    -- Set SLA target hours and breach timestamp
    NEW.sla_target_hours := v_target_hours;
    NEW.sla_breach_at := NEW.created_at + (v_target_hours || ' hours')::INTERVAL;

    RETURN NEW;
END;
$$;

-- Create trigger for new issues
DROP TRIGGER IF EXISTS trigger_set_sla_breach_time ON issues;
CREATE TRIGGER trigger_set_sla_breach_time
    BEFORE INSERT OR UPDATE OF severity_level
    ON issues
    FOR EACH ROW
    WHEN (NEW.severity_level IS NOT NULL)
    EXECUTE FUNCTION set_sla_breach_time();

-- ============================================================================
-- 7. ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_recurrences ENABLE ROW LEVEL SECURITY;

-- Categories: Public read access
CREATE POLICY "Categories are publicly readable"
    ON categories FOR SELECT
    USING (true);

-- Issue Upvotes: Users can upvote, view own upvotes
CREATE POLICY "Users can insert own upvotes"
    ON issue_upvotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all upvotes"
    ON issue_upvotes FOR SELECT
    USING (true);

CREATE POLICY "Users can delete own upvotes"
    ON issue_upvotes FOR DELETE
    USING (auth.uid() = user_id);

-- Issue Comments: Users can comment, view all comments
CREATE POLICY "Users can insert own comments"
    ON issue_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all comments"
    ON issue_comments FOR SELECT
    USING (true);

CREATE POLICY "Users can update own comments"
    ON issue_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
    ON issue_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Issue Verifications: Users can verify, admins see all
CREATE POLICY "Users can insert verifications"
    ON issue_verifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view all verifications"
    ON issue_verifications FOR SELECT
    USING (true);

-- Issue Recurrences: Public read, system/admin write
CREATE POLICY "Anyone can view recurrences"
    ON issue_recurrences FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage recurrences"
    ON issue_recurrences FOR ALL
    USING (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- 8. OFFICER APPOINTMENTS TABLE & RLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS officer_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    citizen_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_time TIMESTAMPTZ NOT NULL,
    escalation_reason TEXT,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'rescheduled', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_officer_appointments_issue ON officer_appointments(issue_id);
CREATE INDEX IF NOT EXISTS idx_officer_appointments_citizen ON officer_appointments(citizen_id);

ALTER TABLE officer_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own appointments"
    ON officer_appointments FOR INSERT
    WITH CHECK (auth.uid() = citizen_id);

CREATE POLICY "Users and admins can view appointments"
    ON officer_appointments FOR SELECT
    USING (true);

CREATE POLICY "Users and admins can update appointments"
    ON officer_appointments FOR UPDATE
    USING (true);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_issues_severity_status ON issues(severity_level, status);
CREATE INDEX IF NOT EXISTS idx_issues_category_severity ON issues(category, severity_score DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_created ON issue_comments(issue_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_verifications_created ON issue_verifications(issue_id, verified_at DESC);

-- ============================================================================
-- 9. PERMISSIONS & HELPER FUNCTIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION calculate_severity(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_sla_breach_risks(INTEGER) TO authenticated;
