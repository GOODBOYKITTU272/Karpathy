-- ============================================================
-- Migration 0001: Raw Segments Staging Table
-- ApplyWizz Career GPS
-- ============================================================
-- PURPOSE: Preserve original CSV data exactly as supplied.
-- This table is APPEND-ONLY. Never mutate after import.
-- ============================================================

CREATE TABLE IF NOT EXISTS raw_segments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_file     text NOT NULL,
  source_row      integer NOT NULL,
  job_role        text NOT NULL,
  alternate_roles text,
  geography       text,
  imported_at     timestamptz DEFAULT now(),
  UNIQUE (source_file, source_row)
);

COMMENT ON TABLE raw_segments IS
  'Append-only staging table. Preserves original CSV values before normalization.';

COMMENT ON COLUMN raw_segments.source_file IS
  'Original filename e.g. "Job Roles 1(Cybersecurity for UK).csv"';
COMMENT ON COLUMN raw_segments.source_row IS
  'Original 1-indexed CSV row number for traceability';
COMMENT ON COLUMN raw_segments.alternate_roles IS
  'Raw comma-separated string from CSV — never modified';
COMMENT ON COLUMN raw_segments.geography IS
  'Extracted from segment name: UK | US | Global';

-- Index for fast lookups during normalization
CREATE INDEX IF NOT EXISTS idx_raw_segments_source_file ON raw_segments(source_file);
CREATE INDEX IF NOT EXISTS idx_raw_segments_geography   ON raw_segments(geography);

-- RLS: catalog admin writes, public reads (no PII in this table)
ALTER TABLE raw_segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_read" ON raw_segments FOR SELECT USING (true);
