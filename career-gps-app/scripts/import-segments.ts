#!/usr/bin/env tsx
// ============================================================
// scripts/import-segments.ts
// CSV → Supabase import pipeline for ApplyWizz role segments
// ============================================================
// Usage:
//   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   npx tsx scripts/import-segments.ts <path-to-csv>
//
// Safe to re-run — uses ON CONFLICT DO NOTHING (idempotent)
// ============================================================

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import {
  parseAlternateRoles,
  normalizeTerms,
  extractGeography,
  normalizeForDedup,
  type ClassifiedTerm,
} from '../src/lib/career-gps/catalog/normalization-rules'

// ── Config ───────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CSV_PATH = process.argv[2] ?? path.join(__dirname, '../data/Job Roles 1(Cybersecurity for UK).csv')
const PROVENANCE = 'csv_import_v1'

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── CSV Parser ───────────────────────────────────────────────

interface CsvRow {
  rowIndex: number
  jobRole: string
  alternateRoles: string
}

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content
    .split(/\r?\n/)
    .map(l => l.replace(/\r$/, ''))

  const results: CsvRow[] = []
  let inQuote = false
  let currentRow: string[] = []
  let currentField = ''

  // Skip header row
  let isHeader = true

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (isHeader) {
      isHeader = false
      continue
    }

    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        inQuote = !inQuote
      } else if (ch === ',' && !inQuote) {
        currentRow.push(currentField)
        currentField = ''
      } else {
        currentField += ch
      }
    }

    if (!inQuote) {
      currentRow.push(currentField)
      currentField = ''
      const jobRole = (currentRow[0] ?? '').trim()
      const alternateRoles = (currentRow[1] ?? '').trim()
      if (jobRole) {
        results.push({ rowIndex: i + 1, jobRole, alternateRoles })
      }
      currentRow = []
    } else {
      currentField += '\n'
    }
  }

  return results
}

// ── Import report ─────────────────────────────────────────────

interface ImportReport {
  sourceFile: string
  segmentsImported: number
  segmentsSkipped: number
  titlesImported: number
  keywordsImported: number
  aliasesImported: number
  warnings: string[]
  errors: string[]
}

// ── Main import ───────────────────────────────────────────────

async function importCsv(csvPath: string): Promise<ImportReport> {
  const sourceFile = path.basename(csvPath)
  const report: ImportReport = {
    sourceFile,
    segmentsImported: 0,
    segmentsSkipped: 0,
    titlesImported: 0,
    keywordsImported: 0,
    aliasesImported: 0,
    warnings: [],
    errors: [],
  }

  console.log(`\n📂  Reading: ${csvPath}`)
  const rows = parseCsv(csvPath)
  console.log(`   Found ${rows.length} data rows`)

  for (const row of rows) {
    console.log(`\n🔄  Processing row ${row.rowIndex}: "${row.jobRole}"`)

    // ── Step 1: Insert raw_segments (preserve original) ──────
    const { data: rawRow, error: rawError } = await supabase
      .from('raw_segments')
      .upsert(
        {
          source_file: sourceFile,
          source_row: row.rowIndex,
          job_role: row.jobRole,
          alternate_roles: row.alternateRoles,
          geography: extractGeography(row.jobRole),
        },
        { onConflict: 'source_file,source_row', ignoreDuplicates: true }
      )
      .select('id')
      .single()

    if (rawError) {
      report.errors.push(`Row ${row.rowIndex}: raw_segments insert failed — ${rawError.message}`)
      continue
    }

    const rawSegmentId = rawRow?.id
    const geography = extractGeography(row.jobRole)
    const canonicalName = row.jobRole
      .replace(/\s+for\s+(UK|US|Canada|Australia|India|Global)$/i, '')
      .trim()

    // ── Step 2: Insert role_segments ──────────────────────────
    const { data: segmentRow, error: segError } = await supabase
      .from('role_segments')
      .upsert(
        {
          raw_segment_id: rawSegmentId,
          segment_name: row.jobRole,
          canonical_name: canonicalName,
          family: inferFamily(canonicalName),
          geography,
          status: 'active',
          provenance: PROVENANCE,
        },
        { onConflict: 'canonical_name,geography', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (segError) {
      report.errors.push(`Row ${row.rowIndex}: role_segments insert failed — ${segError.message}`)
      continue
    }
    report.segmentsImported++
    const segmentId = segmentRow!.id
    console.log(`   ✅  Segment: "${row.jobRole}" → id ${segmentId}`)

    // ── Step 3: Normalize and classify terms ──────────────────
    const rawTerms = parseAlternateRoles(row.alternateRoles)
    const classified = normalizeTerms(rawTerms)

    console.log(`   📊  ${rawTerms.length} raw terms → ${classified.length} unique`)

    for (const term of classified) {
      if (term.type === 'title') {
        // ── Insert role_titles ──────────────────────────────
        const { data: titleRow, error: titleError } = await supabase
          .from('role_titles')
          .upsert(
            {
              segment_id: segmentId,
              canonical_title: term.canonical,
              raw_title: term.raw,
              relationship_type: term.relationship_type ?? 'core',
              seniority_hint: term.seniority_hint ?? null,
              requires_evidence: term.requires_evidence ?? null,
              display_order: displayOrder(term.relationship_type ?? 'core'),
            },
            { onConflict: 'segment_id,canonical_title', ignoreDuplicates: true }
          )
          .select('id')
          .single()

        if (titleError) {
          report.warnings.push(`Title "${term.canonical}": ${titleError.message}`)
          continue
        }
        report.titlesImported++

        // ── Insert role_aliases ─────────────────────────────
        for (const alias of term.aliases) {
          const { error: aliasError } = await supabase
            .from('role_aliases')
            .upsert(
              {
                title_id: titleRow!.id,
                alias,
                alias_normalized: normalizeForDedup(alias),
                source: 'csv_alternate_roles',
              },
              { onConflict: 'title_id,alias_normalized', ignoreDuplicates: true }
            )

          if (aliasError) {
            report.warnings.push(`Alias "${alias}" for "${term.canonical}": ${aliasError.message}`)
          } else {
            report.aliasesImported++
          }
        }
      } else {
        // ── Insert role_keywords ────────────────────────────
        const { error: kwError } = await supabase
          .from('role_keywords')
          .upsert(
            {
              segment_id: segmentId,
              keyword: term.canonical,
              keyword_type: term.keyword_type ?? 'generic',
            },
            { onConflict: 'segment_id,keyword', ignoreDuplicates: true }
          )

        if (kwError) {
          report.warnings.push(`Keyword "${term.canonical}": ${kwError.message}`)
        } else {
          report.keywordsImported++
        }
      }
    }
  }

  return report
}

// ── Helpers ───────────────────────────────────────────────────

function inferFamily(canonicalName: string): string {
  const name = canonicalName.toLowerCase()
  if (/cyber|security|infosec|network|incident|iam/.test(name)) return 'Technology – Security'
  if (/data|analyst|bi|business\s*intelligence/.test(name)) return 'Technology – Data'
  if (/java|software|developer|engineer|fullstack|frontend|backend/.test(name)) return 'Technology – Engineering'
  if (/finance|accounting|risk|compliance/.test(name)) return 'Finance & Risk'
  return 'Technology'
}

function displayOrder(relationship: string): number {
  if (relationship === 'core') return 10
  if (relationship === 'related') return 50
  return 100 // conditional
}

// ── Print report ──────────────────────────────────────────────

function printReport(report: ImportReport) {
  console.log('\n' + '='.repeat(55))
  console.log('  ApplyWizz Career GPS — Import Validation Report')
  console.log('='.repeat(55))
  console.log(`  Source file  : ${report.sourceFile}`)
  console.log(`  Segments     : ${report.segmentsImported} imported`)
  console.log(`  Titles       : ${report.titlesImported}`)
  console.log(`  Keywords     : ${report.keywordsImported}`)
  console.log(`  Aliases      : ${report.aliasesImported}`)

  if (report.warnings.length > 0) {
    console.log(`\n  ⚠  Warnings (${report.warnings.length}):`)
    report.warnings.forEach(w => console.log(`     • ${w}`))
  }

  if (report.errors.length > 0) {
    console.log(`\n  ❌  Errors (${report.errors.length}):`)
    report.errors.forEach(e => console.log(`     • ${e}`))
  } else {
    console.log('\n  ✅  No errors — ready for Phase 2 approval')
  }
  console.log('='.repeat(55) + '\n')
}

// ── Entry point ───────────────────────────────────────────────

;(async () => {
  try {
    const report = await importCsv(CSV_PATH)
    printReport(report)
    process.exit(report.errors.length > 0 ? 1 : 0)
  } catch (err) {
    console.error('Fatal error:', err)
    process.exit(1)
  }
})()
