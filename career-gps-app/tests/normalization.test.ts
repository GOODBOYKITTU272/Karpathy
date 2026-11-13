// ============================================================
// tests/normalization.test.ts
// Unit tests for normalization rules N-01 → N-07
// Run: npx tsx --test tests/normalization.test.ts
// ============================================================

import { strict as assert } from 'assert'
import { test, describe } from 'node:test'

import {
  parseAlternateRoles,
  normalizeForDedup,
  deduplicateTerms,
  classifyTermType,
  classifyRelationship,
  extractGeography,
  toCanonicalTitle,
  normalizeTerms,
} from '../src/lib/career-gps/catalog/normalization-rules'

// ── N-01: Parse ───────────────────────────────────────────────
describe('N-01: parseAlternateRoles', () => {
  test('splits on commas and trims', () => {
    const result = parseAlternateRoles('Security Analyst, SOC, IAM')
    assert.deepStrictEqual(result, ['Security Analyst', 'SOC', 'IAM'])
  })
  test('handles empty string', () => {
    assert.deepStrictEqual(parseAlternateRoles(''), [])
  })
  test('handles quoted CSV with commas', () => {
    const result = parseAlternateRoles('Cyber,  InfoSec ,GRC')
    assert.deepStrictEqual(result, ['Cyber', 'InfoSec', 'GRC'])
  })
})

// ── N-02: Normalize ───────────────────────────────────────────
describe('N-02: normalizeForDedup', () => {
  test('lowercases and strips hyphens', () => {
    assert.strictEqual(normalizeForDedup('front-end'), 'frontend')
  })
  test('strips spaces', () => {
    assert.strictEqual(normalizeForDedup('Back End'), 'backend')
  })
  test('strips slashes', () => {
    assert.strictEqual(normalizeForDedup('Risk/Compliance'), 'riskcompliance')
  })
  test('IAM abbreviation', () => {
    assert.strictEqual(normalizeForDedup('IAM'), 'iam')
  })
})

// ── N-03: Dedup ───────────────────────────────────────────────
describe('N-03: deduplicateTerms', () => {
  test('collapses frontend variants into one canonical', () => {
    const result = deduplicateTerms(['frontend', 'front-end', 'Front End'])
    assert.strictEqual(result.size, 1)
    const entry = result.get('frontend')!
    assert.ok(entry.canonical, 'canonical exists')
    assert.strictEqual(entry.aliases.length, 2)
  })
  test('collapses Tech Consultant and Technology Consultant', () => {
    const result = deduplicateTerms(['Tech Consultant', 'Technology Consultant'])
    assert.strictEqual(result.size, 1)
    const [, entry] = [...result.entries()][0]
    assert.strictEqual(entry.canonical, 'Technology Consultant') // longest wins
  })
})

// ── N-04: Title vs Keyword ────────────────────────────────────
describe('N-04: classifyTermType', () => {
  test('SOC → abbreviation keyword', () => {
    const r = classifyTermType('soc', 'SOC')
    assert.strictEqual(r.type, 'keyword')
    assert.strictEqual(r.keyword_type, 'abbreviation')
  })
  test('IAM → abbreviation keyword', () => {
    const r = classifyTermType('iam', 'IAM')
    assert.strictEqual(r.type, 'keyword')
  })
  test('"cyber" single word → generic keyword', () => {
    const r = classifyTermType('cyber', 'Cyber')
    assert.strictEqual(r.type, 'keyword')
    assert.strictEqual(r.keyword_type, 'generic')
  })
  test('Security Analyst → title', () => {
    const r = classifyTermType('securityanalyst', 'Security Analyst')
    assert.strictEqual(r.type, 'title')
  })
  test('Incident Response → title', () => {
    const r = classifyTermType('incidentresponse', 'Incident Response')
    assert.strictEqual(r.type, 'title')
  })
})

// ── N-05: Relationship type ───────────────────────────────────
describe('N-05: classifyRelationship', () => {
  test('Security Architect → conditional + senior', () => {
    const r = classifyRelationship('Security Architect')
    assert.strictEqual(r.relationship_type, 'conditional')
    assert.strictEqual(r.seniority_hint, 'senior')
  })
  test('Risk Analyst → conditional', () => {
    const r = classifyRelationship('Risk Analyst')
    assert.strictEqual(r.relationship_type, 'conditional')
  })
  test('Security Operations Center → related', () => {
    const r = classifyRelationship('Security Operations Center')
    assert.strictEqual(r.relationship_type, 'related')
  })
  test('Cybersecurity Analyst → core', () => {
    const r = classifyRelationship('Cybersecurity Analyst')
    assert.strictEqual(r.relationship_type, 'core')
  })
})

// ── N-06: Geography ───────────────────────────────────────────
describe('N-06: extractGeography', () => {
  test('Cybersecurity for UK → UK', () => {
    assert.strictEqual(extractGeography('Cybersecurity for UK'), 'UK')
  })
  test('Data Analyst for US → US', () => {
    assert.strictEqual(extractGeography('Data Analyst for US'), 'US')
  })
  test('Java Full Stack → Global', () => {
    assert.strictEqual(extractGeography('Java Full Stack'), 'Global')
  })
})

// ── N-07: Canonical title format ─────────────────────────────
describe('N-07: toCanonicalTitle', () => {
  test('IAM → Identity & Access Management', () => {
    assert.strictEqual(toCanonicalTitle('IAM'), 'Identity & Access Management')
  })
  test('SOC → Security Operations Center', () => {
    assert.strictEqual(toCanonicalTitle('SOC'), 'Security Operations Center')
  })
  test('cyber engineer → Cyber Engineer', () => {
    assert.strictEqual(toCanonicalTitle('cyber engineer'), 'Cyber Engineer')
  })
})

// ── Full pipeline ─────────────────────────────────────────────
describe('Full pipeline: normalizeTerms on Cybersecurity CSV', () => {
  const rawInput = [
    'Cybersecurity','Software Developer','Software Engineer','cyber engineer',
    'risk management','Cyber Threat','Information Security','Security Architect',
    'Security Operations Center','SOC','InfoSec','Security Analyst',
    'Security Operations','GRC','IT Security','Incident Response',
    'Network Security','Identity and Access Management','IAM','Cyber',
    'software','developer','frontend','backend','fullstack',
    'front-end','back-end','Application','Software Architect',
    'Software Development Engineer','SDE','Software Programmer',
    'Platform Engineer','Platform Technologist','Tech Consultant',
    'Technology Consultant','Back End','Front End','web',
    'risk analyst','compliance analyst'
  ]

  const result = normalizeTerms(rawInput)
  const titles = result.filter(r => r.type === 'title')
  const keywords = result.filter(r => r.type === 'keyword')

  test('produces fewer unique terms than raw (dedup working)', () => {
    assert.ok(result.length < rawInput.length, `${result.length} < ${rawInput.length}`)
  })
  test('all titles have a relationship_type', () => {
    for (const t of titles) {
      assert.ok(t.relationship_type, `"${t.canonical}" missing relationship_type`)
    }
  })
  test('all keywords have a keyword_type', () => {
    for (const k of keywords) {
      assert.ok(k.keyword_type, `"${k.canonical}" missing keyword_type`)
    }
  })
  test('SOC appears as keyword not title', () => {
    const soc = result.find(r => r.normalized === 'soc')
    assert.strictEqual(soc?.type, 'keyword')
  })
  test('Security Analyst appears as a core title', () => {
    const sa = titles.find(t => /security analyst/i.test(t.canonical))
    assert.ok(sa, 'Security Analyst not found as title')
    assert.strictEqual(sa?.relationship_type, 'core')
  })
  test('Security Architect appears as conditional', () => {
    const arch = titles.find(t => /architect/i.test(t.canonical))
    assert.ok(arch, 'Architect not found')
    assert.strictEqual(arch?.relationship_type, 'conditional')
  })
  test('frontend/front-end/Front End collapsed into one entry', () => {
    const frontendEntries = result.filter(r => r.normalized === 'frontend')
    assert.strictEqual(frontendEntries.length, 1)
  })
})
