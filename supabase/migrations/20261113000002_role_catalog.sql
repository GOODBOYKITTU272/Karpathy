-- ============================================================
-- Migration 0002: Role Catalog Tables
-- ApplyWizz Career GPS
-- ============================================================
-- Creates: role_segments, role_titles, role_keywords, role_aliases
-- All are READ-ONLY from the browser (public SELECT via RLS).
-- Writes happen only via server-side import scripts.
-- ============================================================

-- ── 1. role_segments ────────────────────────────────────────
-- One row per ApplyWizz operational segment.
CREATE TABLE IF NOT EXISTS role_segments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_segment_id  uuid REFERENCES raw_segments(id) ON DELETE RESTRICT,
  segment_name    text NOT NULL,
  canonical_name  text NOT NULL,
  family          text,
  geography       text NOT NULL DEFAULT 'Global',
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','inactive','paused')),
  provenance      text NOT NULL DEFAULT 'csv_import_v1',
  created_at      timestamptz DEFAULT now(),
  UNIQUE (canonical_name, geography)
);

COMMENT ON TABLE role_segments IS
  'One row per ApplyWizz operational segment. Read-only from browser.';
COMMENT ON COLUMN role_segments.canonical_name IS
  'Human-readable segment name without geography suffix e.g. "Cybersecurity"';
COMMENT ON COLUMN role_segments.geography IS
  'UK | US | Global — extracted from original segment name';
COMMENT ON COLUMN role_segments.provenance IS
  'Source identifier for auditability e.g. "csv_import_v1"';

CREATE INDEX IF NOT EXISTS idx_role_segments_geography     ON role_segments(geography);
CREATE INDEX IF NOT EXISTS idx_role_segments_family        ON role_segments(family);
CREATE INDEX IF NOT EXISTS idx_role_segments_status        ON role_segments(status);

-- ── 2. role_titles ──────────────────────────────────────────
-- Individual displayable job titles — appear as Career GPS map tiles.
CREATE TABLE IF NOT EXISTS role_titles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id        uuid NOT NULL REFERENCES role_segments(id) ON DELETE RESTRICT,
  canonical_title   text NOT NULL,
  raw_title         text NOT NULL,
  relationship_type text NOT NULL
                    CHECK (relationship_type IN ('core','related','conditional')),
  seniority_hint    text
                    CHECK (seniority_hint IN ('junior','mid','senior') OR seniority_hint IS NULL),
  requires_evidence text,
  display_order     integer NOT NULL DEFAULT 100,
  created_at        timestamptz DEFAULT now(),
  UNIQUE (segment_id, canonical_title)
);

COMMENT ON TABLE role_titles IS
  'Displayable job titles. Each row may become a tile on the Career GPS treemap.';
COMMENT ON COLUMN role_titles.relationship_type IS
  'core = directly in domain | related = adjacent | conditional = needs resume evidence';
COMMENT ON COLUMN role_titles.requires_evidence IS
  'Human-readable prerequisite e.g. "Resume must show architecture experience"';

CREATE INDEX IF NOT EXISTS idx_role_titles_segment_id        ON role_titles(segment_id);
CREATE INDEX IF NOT EXISTS idx_role_titles_relationship_type ON role_titles(relationship_type);

-- ── 3. role_keywords ────────────────────────────────────────
-- Search/retrieval terms — NEVER displayed as Career GPS tiles.
CREATE TABLE IF NOT EXISTS role_keywords (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id      uuid NOT NULL REFERENCES role_segments(id) ON DELETE RESTRICT,
  keyword         text NOT NULL,
  keyword_type    text NOT NULL
                  CHECK (keyword_type IN ('abbreviation','domain','generic','indeed')),
  created_at      timestamptz DEFAULT now(),
  UNIQUE (segment_id, keyword)
);

COMMENT ON TABLE role_keywords IS
  'Job-board retrieval terms. Never displayed as role tiles in Career GPS.';
COMMENT ON COLUMN role_keywords.keyword_type IS
  'abbreviation = SOC/IAM | domain = "risk management" | generic = "software" | indeed = indeed-specific';

CREATE INDEX IF NOT EXISTS idx_role_keywords_segment_id ON role_keywords(segment_id);
CREATE INDEX IF NOT EXISTS idx_role_keywords_type       ON role_keywords(keyword_type);

-- ── 4. role_aliases ─────────────────────────────────────────
-- Synonym/alternate-spelling map pointing to canonical titles.
CREATE TABLE IF NOT EXISTS role_aliases (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id          uuid NOT NULL REFERENCES role_titles(id) ON DELETE CASCADE,
  alias             text NOT NULL,
  alias_normalized  text NOT NULL,
  source            text NOT NULL DEFAULT 'csv_alternate_roles',
  created_at        timestamptz DEFAULT now(),
  UNIQUE (title_id, alias_normalized)
);

COMMENT ON TABLE role_aliases IS
  'Maps alternate spellings and abbreviations to canonical role_titles.';
COMMENT ON COLUMN role_aliases.alias_normalized IS
  'Lowercase, punctuation-stripped form used for dedup matching';

CREATE INDEX IF NOT EXISTS idx_role_aliases_title_id         ON role_aliases(title_id);
CREATE INDEX IF NOT EXISTS idx_role_aliases_alias_normalized ON role_aliases(alias_normalized);

-- ── RLS policies ────────────────────────────────────────────
ALTER TABLE role_segments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_titles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_keywords  ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_aliases   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read" ON role_segments  FOR SELECT USING (true);
CREATE POLICY "public_read" ON role_titles    FOR SELECT USING (true);
CREATE POLICY "public_read" ON role_keywords  FOR SELECT USING (true);
CREATE POLICY "public_read" ON role_aliases   FOR SELECT USING (true);
