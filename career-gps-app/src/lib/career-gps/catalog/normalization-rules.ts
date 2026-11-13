// ============================================================
// lib/career-gps/catalog/normalization-rules.ts
// Pure normalization functions — no Supabase dependency
// All functions are independently testable
// ============================================================

// ── Types ────────────────────────────────────────────────────

export type RelationshipType = 'core' | 'related' | 'conditional'
export type KeywordType = 'abbreviation' | 'domain' | 'generic' | 'indeed'

export interface ClassifiedTerm {
  raw: string
  canonical: string
  normalized: string
  type: 'title' | 'keyword'
  relationship_type?: RelationshipType
  keyword_type?: KeywordType
  seniority_hint?: 'junior' | 'mid' | 'senior'
  requires_evidence?: string
  aliases: string[]
}

// ── Rule N-01: Parse Alternate Roles column ──────────────────
/**
 * Split a raw CSV alternate-roles string into individual terms.
 * Handles comma separation and trims whitespace.
 */
export function parseAlternateRoles(raw: string): string[] {
  if (!raw || !raw.trim()) return []
  return raw
    .split(',')
    .map(t => t.trim())
    .filter(t => t.length > 0)
}

// ── Rule N-02: Normalize text for deduplication ──────────────
/**
 * Returns a lowercase, punctuation-stripped key for deduplication.
 * front-end → frontend | Back End → backend | IAM → iam
 */
export function normalizeForDedup(term: string): string {
  return term
    .toLowerCase()
    .replace(/[-_\/\s]+/g, '')
    .replace(/[^a-z0-9]/g, '')
}

// ── Rule N-03: Deduplication ─────────────────────────────────
/**
 * Given a list of raw terms, group by normalized key.
 * Returns Map<normalizedKey, { canonical: string, aliases: string[] }>
 * The longest variant is chosen as canonical for readability.
 */
/**
 * Explicit synonym map: normalized key → preferred normalized key.
 * Applied before dedup so phrasing variants always collapse.
 */
const SYNONYM_MAP: Record<string, string> = {
  techconsultant:        'technologyconsultant',
  softwareprogrammer:    'softwaredeveloper',
  platformtechnologist:  'platformengineer',
  cyberengineer:         'cybersecurityengineer',
}

function applySynonymMap(normalized: string): string {
  return SYNONYM_MAP[normalized] ?? normalized
}

export function deduplicateTerms(
  terms: string[]
): Map<string, { canonical: string; aliases: string[] }> {
  const groups = new Map<string, { canonical: string; aliases: string[] }>()

  for (const term of terms) {
    const rawKey = normalizeForDedup(term)
    const key = applySynonymMap(rawKey)   // Rule N-03: collapse synonyms
    if (!key) continue

    if (!groups.has(key)) {
      groups.set(key, { canonical: term, aliases: [] })
    } else {
      const existing = groups.get(key)!
      existing.aliases.push(term)
      // Keep the longest / most readable variant as canonical
      if (term.length > existing.canonical.length) {
        existing.aliases.push(existing.canonical)
        existing.aliases = existing.aliases.filter(a => a !== term)
        existing.canonical = term
      }
    }
  }

  return groups
}

// ── Rule N-04: Title vs Keyword classification ───────────────

/** Terms that are abbreviations of titles already expanded */
const KNOWN_ABBREVIATIONS = new Set([
  'soc', 'iam', 'infosec', 'grc', 'sde', 'it'
])

/** Single-word non-occupational terms */
const KNOWN_GENERIC_SINGLES = new Set([
  'cyber', 'software', 'developer', 'web', 'application',
  'frontend', 'backend', 'fullstack', 'tech', 'digital'
])

/** Multi-word domain/function phrases — not job titles */
const KNOWN_DOMAIN_PHRASES = new Set([
  'riskmanagement', 'cyberthreat', 'incidentmanagement',
  'threatanalysis', 'vulnerabilitymanagement'
])

/**
 * Rule N-04: Determine if a normalized term is a keyword (retrieval-only)
 * or a displayable title.
 */
export function classifyTermType(
  normalized: string,
  raw: string
): { type: 'title' | 'keyword'; keyword_type?: KeywordType } {
  if (KNOWN_ABBREVIATIONS.has(normalized)) {
    return { type: 'keyword', keyword_type: 'abbreviation' }
  }
  if (KNOWN_GENERIC_SINGLES.has(normalized)) {
    return { type: 'keyword', keyword_type: 'generic' }
  }
  if (KNOWN_DOMAIN_PHRASES.has(normalized)) {
    return { type: 'keyword', keyword_type: 'domain' }
  }
  // Heuristic: single-word terms are keywords unless explicitly mapped
  const wordCount = raw.trim().split(/\s+/).length
  if (wordCount === 1 && !isSingleWordTitle(normalized)) {
    return { type: 'keyword', keyword_type: 'generic' }
  }
  return { type: 'title' }
}

/** Known single-word legitimate job titles */
const SINGLE_WORD_TITLES = new Set([
  'cybersecurity', 'architect', 'analyst', 'developer',
  'engineer', 'consultant', 'administrator', 'specialist'
])

function isSingleWordTitle(normalized: string): boolean {
  return SINGLE_WORD_TITLES.has(normalized)
}

// ── Rule N-05: Relationship type classification ───────────────

export interface RelationshipRule {
  pattern: RegExp
  relationship_type: RelationshipType
  seniority_hint?: 'junior' | 'mid' | 'senior'
  requires_evidence?: string
}

/**
 * Ordered rules — first match wins.
 * Override or extend per segment in the import script.
 */
export const DEFAULT_RELATIONSHIP_RULES: RelationshipRule[] = [
  // Conditional — seniority-gated
  {
    pattern: /architect/i,
    relationship_type: 'conditional',
    seniority_hint: 'senior',
    requires_evidence: 'Resume must show architecture, design leadership, or systems design experience',
  },
  // Conditional — domain cross-over
  {
    pattern: /software\s*(developer|engineer|programmer|development)/i,
    relationship_type: 'conditional',
    requires_evidence: 'Resume must show security-focused software development (AppSec, SecDevOps)',
  },
  {
    pattern: /platform\s*(engineer|technologist)/i,
    relationship_type: 'conditional',
    requires_evidence: 'Resume must show infrastructure or platform security experience',
  },
  {
    pattern: /risk\s*analyst/i,
    relationship_type: 'conditional',
    requires_evidence: 'Resume must show risk assessment within a security or compliance context',
  },
  {
    pattern: /compliance\s*analyst/i,
    relationship_type: 'conditional',
    requires_evidence: 'Resume must show regulatory or compliance responsibilities',
  },
  // Related — adjacent domain, specific evidence needed
  {
    pattern: /security\s*(architect|operations\s*center)/i,
    relationship_type: 'related',
  },
  {
    pattern: /governance|risk\s*&?\s*compliance|grc/i,
    relationship_type: 'related',
  },
  // Core — directly within primary domain
  {
    pattern: /.*/,
    relationship_type: 'core',
  },
]

export function classifyRelationship(
  canonical: string,
  rules: RelationshipRule[] = DEFAULT_RELATIONSHIP_RULES
): { relationship_type: RelationshipType; seniority_hint?: string; requires_evidence?: string } {
  for (const rule of rules) {
    if (rule.pattern.test(canonical)) {
      return {
        relationship_type: rule.relationship_type,
        seniority_hint: rule.seniority_hint,
        requires_evidence: rule.requires_evidence,
      }
    }
  }
  return { relationship_type: 'core' }
}

// ── Rule N-06: Geography extraction ──────────────────────────
/**
 * Extract geography from segment name.
 * "Cybersecurity for UK" → "UK"
 * "Data Analyst for US" → "US"
 * Others → "Global"
 */
export function extractGeography(segmentName: string): string {
  const match = segmentName.match(/\bfor\s+(UK|US|Canada|Australia|India|Global)\b/i)
  return match ? match[1].toUpperCase() : 'Global'
}

// ── Rule N-07: Canonical title formatting ────────────────────
/**
 * Format a raw title into a display-ready canonical form.
 * - Title case
 * - Expand known abbreviations inline
 */
const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  'iam': 'Identity & Access Management',
  'soc': 'Security Operations Center',
  'grc': 'Governance, Risk & Compliance',
  'infosec': 'Information Security',
  'sde': 'Software Development Engineer',
  'it': 'IT',
}

export function toCanonicalTitle(raw: string): string {
  const normalized = normalizeForDedup(raw)
  if (ABBREVIATION_EXPANSIONS[normalized]) {
    return ABBREVIATION_EXPANSIONS[normalized]
  }
  // Title-case the raw string
  return raw
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

// ── Full pipeline ─────────────────────────────────────────────
/**
 * Run the complete normalization pipeline on a list of raw terms.
 * Returns classified terms ready for DB insert.
 */
export function normalizeTerms(
  rawTerms: string[],
  segmentFamily?: string
): ClassifiedTerm[] {
  const deduped = deduplicateTerms(rawTerms)
  const results: ClassifiedTerm[] = []

  for (const [normalized, { canonical, aliases }] of deduped) {
    const { type, keyword_type } = classifyTermType(normalized, canonical)

    if (type === 'keyword') {
      results.push({
        raw: canonical,
        canonical,
        normalized,
        type: 'keyword',
        keyword_type,
        aliases,
      })
    } else {
      const canonicalTitle = toCanonicalTitle(canonical)
      const { relationship_type, seniority_hint, requires_evidence } =
        classifyRelationship(canonicalTitle)

      results.push({
        raw: canonical,
        canonical: canonicalTitle,
        normalized,
        type: 'title',
        relationship_type,
        seniority_hint: seniority_hint as ClassifiedTerm['seniority_hint'],
        requires_evidence,
        aliases,
      })
    }
  }

  return results
}
