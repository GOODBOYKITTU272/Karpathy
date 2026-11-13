// ============================================================
// src/types/career-gps.ts
// Shared TypeScript types for Career GPS
// ============================================================

export type RelationshipType = 'core' | 'related' | 'conditional'
export type TermType = 'title' | 'keyword'
export type KeywordType = 'abbreviation' | 'domain' | 'generic' | 'indeed'
export type Geography = 'UK' | 'US' | 'Global'
export type ViewMode = 'universe' | 'segment'

// ── Individual role / keyword within a segment ───────────────
export interface AlternateRole {
  id: string
  raw: string                          // original string from source
  canonical: string                    // display-ready normalized form
  type: TermType
  relationship_type?: RelationshipType // only for type=title
  keyword_type?: KeywordType           // only for type=keyword
  seniority_hint?: 'junior' | 'mid' | 'senior'
  requires_evidence?: string
  aliases: string[]
}

// ── A single ApplyWizz operational segment ───────────────────
export interface SegmentData {
  id: string
  slug: string
  segmentName: string                  // original e.g. "Cybersecurity for UK"
  canonicalName: string               // e.g. "Cybersecurity"
  geography: Geography
  family: string
  status: 'active' | 'inactive' | 'paused'
  alternateRoles: AlternateRole[]
  isMatched: boolean                   // true = resume-matched segment
  sourceFile: string
}

// ── D3 treemap node data ──────────────────────────────────────
export interface UniverseNode {
  id: string
  name: string
  geography: Geography
  family: string
  value: number                        // number of alternate roles (actual data)
  isMatched: boolean
  segment: SegmentData
}

export interface RoleNode {
  id: string
  name: string
  raw: string
  type: TermType
  relationship_type?: RelationshipType
  keyword_type?: KeywordType
  seniority_hint?: string
  requires_evidence?: string
  aliases: string[]
  value: number                        // determines tile size (by role type)
}

// ── Tooltip state ─────────────────────────────────────────────
export interface TooltipState {
  visible: boolean
  x: number
  y: number
  content: TooltipContent | null
}

export interface TooltipContent {
  title: string
  subtitle?: string
  body: string
  badge?: string
  badgeColor?: string
  caution?: string
}

// ── API response shapes ───────────────────────────────────────
export interface SegmentsApiResponse {
  segments: SegmentData[]
  totalSegments: number
  totalRoles: number
  totalKeywords: number
  matchedSegmentId?: string
}

// ── Color palette (brand-compliant) ──────────────────────────
export const BRAND_COLORS = {
  jetBlack:          '#1E1E1E',
  navy:              '#0B1D33',
  brightBlue:        '#2C76FF',
  fluorescentGreen:  '#29FE29',
  softGray:          '#F5F5F5',
  blueTint:          '#EFFBFF',
  deepGray:          '#1A1A1A',
  yellow:            '#FFDE59',
  coralRed:          '#FF5C5C',
} as const

// Family → tile background color mapping
export const FAMILY_TILE_COLORS: Record<string, string> = {
  'Technology – Security':    '#1a3a6c',   // dark navy-blue
  'Technology – Engineering': '#0d3d1a',   // deep forest green
  'Technology – Data':        '#0a2a4a',   // deep ocean blue
  'Finance & Risk':           '#3d2e00',   // dark amber
  'Technology':               '#1E2A3A',   // slate
}

// Relationship type → tile color in drill-down view
export const RELATIONSHIP_COLORS: Record<RelationshipType, string> = {
  core:        '#2C76FF',   // Bright Blue
  related:     '#1a4a7a',   // darker blue
  conditional: '#7a4a00',   // amber
}

export const KEYWORD_TILE_COLOR = '#2a2a2a'   // near-black for keywords

export function getFamilyColor(family: string): string {
  return FAMILY_TILE_COLORS[family] ?? FAMILY_TILE_COLORS['Technology']
}

export function getRoleColor(role: AlternateRole): string {
  if (role.type === 'keyword') return KEYWORD_TILE_COLOR
  return RELATIONSHIP_COLORS[role.relationship_type ?? 'core']
}

// Role value for tile sizing (factual, not invented)
export function getRoleValue(role: AlternateRole): number {
  if (role.type === 'keyword') return 1
  if (role.relationship_type === 'core') return 3
  if (role.relationship_type === 'related') return 2
  return 1.5  // conditional
}
