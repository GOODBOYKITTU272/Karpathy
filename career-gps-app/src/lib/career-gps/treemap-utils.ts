// ============================================================
// src/lib/career-gps/treemap-utils.ts
// D3 layout computation — pure functions, no DOM manipulation
// React handles rendering; D3 handles math only
// ============================================================

import * as d3 from 'd3'
import type {
  SegmentData,
  AlternateRole,
  UniverseNode,
  RoleNode,
} from '@/types/career-gps'
import { getRoleValue } from '@/types/career-gps'

// ── Universe-level layout (all segments) ─────────────────────

export interface ComputedTile {
  x0: number
  y0: number
  x1: number
  y1: number
  width: number
  height: number
}

export interface SegmentTile extends ComputedTile {
  segment: SegmentData
  value: number
  labelVisible: boolean
  badgeVisible: boolean
}

export interface RoleTile extends ComputedTile {
  role: AlternateRole
  value: number
  labelVisible: boolean
}

interface HierarchySegmentDatum {
  name: string
  children: Array<{ name: string; value: number; segment: SegmentData }>
}

interface HierarchyRoleDatum {
  name: string
  children: Array<{ name: string; value: number; role: AlternateRole }>
}

/**
 * Compute D3 treemap layout for the full career universe.
 * Each segment = one tile. Size = number of alternate roles (actual data).
 * Tile size represents search term breadth, NOT vacancy count or fit score.
 */
export function computeUniverseLayout(
  segments: SegmentData[],
  width: number,
  height: number
): SegmentTile[] {
  if (width <= 0 || height <= 0 || segments.length === 0) return []

  const data: HierarchySegmentDatum = {
    name: 'universe',
    children: segments.map(s => ({
      name: s.id,
      value: s.alternateRoles.length,
      segment: s,
    })),
  }

  const root = d3
    .hierarchy<HierarchySegmentDatum | HierarchySegmentDatum['children'][0]>(data)
    .sum(d => ('value' in d ? (d.value as number) : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  d3.treemap<HierarchySegmentDatum | HierarchySegmentDatum['children'][0]>()
    .size([width, height])
    .paddingOuter(4)
    .paddingInner(3)
    .round(true)(root)

  return (root.leaves() as d3.HierarchyRectangularNode<HierarchySegmentDatum['children'][0]>[]).map(leaf => {
    const d = leaf.data
    const w = leaf.x1 - leaf.x0
    const h = leaf.y1 - leaf.y0
    return {
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
      width: w,
      height: h,
      segment: d.segment,
      value: d.value,
      labelVisible: w > 80 && h > 40,
      badgeVisible: w > 100 && h > 60,
    }
  })
}

/**
 * Compute D3 treemap layout for a single segment's alternate roles.
 * Tiles grouped and sized by role type (core > related > conditional > keyword).
 * Size = factual role-type weight, NOT invented market data.
 */
export function computeSegmentLayout(
  segment: SegmentData,
  width: number,
  height: number
): RoleTile[] {
  if (width <= 0 || height <= 0) return []

  const data: HierarchyRoleDatum = {
    name: segment.id,
    children: segment.alternateRoles.map(role => ({
      name: role.id,
      value: getRoleValue(role),
      role,
    })),
  }

  const root = d3
    .hierarchy<HierarchyRoleDatum | HierarchyRoleDatum['children'][0]>(data)
    .sum(d => ('value' in d ? (d.value as number) : 0))
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))

  d3.treemap<HierarchyRoleDatum | HierarchyRoleDatum['children'][0]>()
    .size([width, height])
    .paddingOuter(3)
    .paddingInner(2)
    .round(true)(root)

  return (root.leaves() as d3.HierarchyRectangularNode<HierarchyRoleDatum['children'][0]>[]).map(leaf => {
    const d = leaf.data
    const w = leaf.x1 - leaf.x0
    const h = leaf.y1 - leaf.y0
    return {
      x0: leaf.x0,
      y0: leaf.y0,
      x1: leaf.x1,
      y1: leaf.y1,
      width: w,
      height: h,
      role: d.role,
      value: d.value,
      labelVisible: w > 50 && h > 28,
    }
  })
}

/**
 * Truncate a label to fit within a tile width.
 * Approximate: 7px per character for Noto Sans 13px.
 */
export function truncateLabel(label: string, maxWidth: number): string {
  const charsPerPx = 1 / 7.5
  const maxChars = Math.floor(maxWidth * charsPerPx) - 2
  if (maxChars <= 3) return ''
  if (label.length <= maxChars) return label
  return label.slice(0, maxChars - 1) + '…'
}

/** Stats for the legend / info bar */
export function segmentStats(segment: SegmentData) {
  const titles = segment.alternateRoles.filter(r => r.type === 'title')
  const keywords = segment.alternateRoles.filter(r => r.type === 'keyword')
  const core = titles.filter(r => r.relationship_type === 'core')
  const related = titles.filter(r => r.relationship_type === 'related')
  const conditional = titles.filter(r => r.relationship_type === 'conditional')
  return { titles: titles.length, keywords: keywords.length, core: core.length, related: related.length, conditional: conditional.length }
}
