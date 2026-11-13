-- ============================================================
-- Migration 0003: Candidate Tables
-- ApplyWizz Career GPS
-- ============================================================
-- Creates: career_profiles, career_discoveries, career_discovery_roles
-- All rows are owner-restricted via RLS.
-- ============================================================

-- ── 1. career_profiles ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS career_profiles (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id         uuid,          -- Supabase Auth UID (nullable if anonymous)
  session_id            text,          -- anonymous session fallback
  resume_storage_path   text NOT NULL, -- private Supabase Storage path
  extraction_version    text,
  profile_json          jsonb,
  created_at            timestamptz DEFAULT now(),
  CONSTRAINT owner_or_session CHECK (
    owner_user_id IS NOT NULL OR session_id IS NOT NULL
  )
);

COMMENT ON TABLE career_profiles IS
  'Per-candidate resume profile. Owner-restricted. Resume path refers to private Storage bucket.';
COMMENT ON COLUMN career_profiles.resume_storage_path IS
  'Path in private "resumes" Supabase Storage bucket. Never expose publicly.';
COMMENT ON COLUMN career_profiles.profile_json IS
  'Structured extraction: titles, dates, responsibilities, tools, domain, seniority, evidence refs';

CREATE INDEX IF NOT EXISTS idx_career_profiles_owner_user_id ON career_profiles(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_career_profiles_session_id    ON career_profiles(session_id);

-- ── 2. career_discoveries ───────────────────────────────────
CREATE TABLE IF NOT EXISTS career_discoveries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id       uuid NOT NULL REFERENCES career_profiles(id) ON DELETE CASCADE,
  status           text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','processing','completed','failed')),
  model_version    text,
  taxonomy_version text,
  error_code       text,
  created_at       timestamptz DEFAULT now()
);

COMMENT ON TABLE career_discoveries IS
  'Processing lifecycle record for a Career GPS analysis run.';
COMMENT ON COLUMN career_discoveries.taxonomy_version IS
  'Version of role_catalog used for this discovery — enables reproducibility';
COMMENT ON COLUMN career_discoveries.error_code IS
  'Stable error code for failed runs e.g. "NO_TEXT_EXTRACTED" | "AI_TIMEOUT"';

CREATE INDEX IF NOT EXISTS idx_career_discoveries_profile_id ON career_discoveries(profile_id);
CREATE INDEX IF NOT EXISTS idx_career_discoveries_status     ON career_discoveries(status);

-- ── 3. career_discovery_roles ───────────────────────────────
CREATE TABLE IF NOT EXISTS career_discovery_roles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id       uuid NOT NULL REFERENCES career_discoveries(id) ON DELETE CASCADE,
  title_id           uuid NOT NULL REFERENCES role_titles(id) ON DELETE RESTRICT,
  relationship_type  text NOT NULL
                     CHECK (relationship_type IN ('core','related','conditional')),
  explanation        text,
  evidence_refs      jsonb,
  source_segment_ids jsonb,
  created_at         timestamptz DEFAULT now(),
  UNIQUE (discovery_id, title_id)
);

COMMENT ON TABLE career_discovery_roles IS
  'Deduplicated personalized role results. No numeric scores — explanation only.';
COMMENT ON COLUMN career_discovery_roles.explanation IS
  'Concise, evidence-grounded reason. Never fabricated. No match percentages.';
COMMENT ON COLUMN career_discovery_roles.evidence_refs IS
  'JSON array of resume snippets that support this role suggestion';
COMMENT ON COLUMN career_discovery_roles.source_segment_ids IS
  'JSON array of original ApplyWizz segment IDs for auditability';

CREATE INDEX IF NOT EXISTS idx_career_discovery_roles_discovery_id ON career_discovery_roles(discovery_id);
CREATE INDEX IF NOT EXISTS idx_career_discovery_roles_title_id     ON career_discovery_roles(title_id);

-- ── RLS: owner-only access via auth chain ───────────────────
ALTER TABLE career_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_discoveries     ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_discovery_roles ENABLE ROW LEVEL SECURITY;

-- career_profiles: owner reads/writes own rows
CREATE POLICY "owner_select" ON career_profiles
  FOR SELECT USING (auth.uid() = owner_user_id);

CREATE POLICY "owner_insert" ON career_profiles
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);

-- career_discoveries: access via profile ownership
CREATE POLICY "owner_select" ON career_discoveries
  FOR SELECT USING (
    profile_id IN (
      SELECT id FROM career_profiles WHERE owner_user_id = auth.uid()
    )
  );

CREATE POLICY "owner_insert" ON career_discoveries
  FOR INSERT WITH CHECK (
    profile_id IN (
      SELECT id FROM career_profiles WHERE owner_user_id = auth.uid()
    )
  );

-- career_discovery_roles: access via discovery → profile chain
CREATE POLICY "owner_select" ON career_discovery_roles
  FOR SELECT USING (
    discovery_id IN (
      SELECT cd.id FROM career_discoveries cd
      JOIN career_profiles cp ON cd.profile_id = cp.id
      WHERE cp.owner_user_id = auth.uid()
    )
  );
