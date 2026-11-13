// ============================================================
// src/lib/career-gps/mock-data.ts
// Local development data — real segments from verified sources
// ONLY contains data from: Job Roles 1(Cybersecurity for UK).csv
// and Job Roles 1.pdf. No fabricated segments.
// When the master .xlsx is imported and DB is live, swap to API.
// ============================================================

import type { SegmentData, AlternateRole } from '@/types/career-gps'

let _id = 0
const uid = (prefix: string) => `${prefix}-${++_id}`

function makeTitle(
  raw: string,
  canonical: string,
  relationship: 'core' | 'related' | 'conditional',
  opts: Partial<AlternateRole> = {}
): AlternateRole {
  return {
    id: uid('title'),
    raw,
    canonical,
    type: 'title',
    relationship_type: relationship,
    aliases: [],
    ...opts,
  }
}

function makeKeyword(
  raw: string,
  canonical: string,
  kwType: AlternateRole['keyword_type'] = 'generic',
  aliases: string[] = []
): AlternateRole {
  return {
    id: uid('kw'),
    raw,
    canonical,
    type: 'keyword',
    keyword_type: kwType,
    aliases,
  }
}

// ── Segment 1: Cybersecurity for UK ──────────────────────────
const cybersecurityUK: SegmentData = {
  id: 'seg-cybersecurity-uk',
  slug: 'cybersecurity-uk',
  segmentName: 'Cybersecurity for UK',
  canonicalName: 'Cybersecurity',
  geography: 'UK',
  family: 'Technology – Security',
  status: 'active',
  sourceFile: 'Job Roles 1(Cybersecurity for UK).csv',
  isMatched: false,  // set by resume parser
  alternateRoles: [
    // Core titles
    makeTitle('Cybersecurity', 'Cybersecurity Analyst', 'core'),
    makeTitle('cyber engineer', 'Cyber Security Engineer', 'core'),
    makeTitle('Information Security', 'Information Security Analyst', 'core', { aliases: ['InfoSec'] }),
    makeTitle('IT Security', 'IT Security Analyst', 'core'),
    makeTitle('Security Analyst', 'Security Analyst', 'core'),
    makeTitle('Security Operations', 'Security Operations Analyst', 'core'),
    makeTitle('Network Security', 'Network Security Engineer', 'core'),
    makeTitle('Incident Response', 'Incident Response Analyst', 'core'),
    makeTitle('Identity and Access Management', 'Identity & Access Management Engineer', 'core', { aliases: ['IAM'] }),
    // Related titles
    makeTitle('Security Architect', 'Security Architect', 'related', {
      seniority_hint: 'senior',
      requires_evidence: 'Resume must show architecture, design leadership or systems design experience',
    }),
    makeTitle('Security Operations Center', 'Security Operations Center Analyst', 'related', { aliases: ['SOC'] }),
    makeTitle('GRC', 'Governance, Risk & Compliance Analyst', 'related', { aliases: ['GRC'] }),
    // Conditional titles
    makeTitle('risk analyst', 'Risk Analyst', 'conditional', {
      requires_evidence: 'Resume must show risk assessment within a security or compliance context',
    }),
    makeTitle('compliance analyst', 'Compliance Analyst', 'conditional', {
      requires_evidence: 'Resume must show regulatory or compliance responsibilities',
    }),
    makeTitle('Software Developer', 'Software Developer (Security-focused)', 'conditional', {
      requires_evidence: 'Resume must show security tooling, AppSec, or SecDevOps experience',
    }),
    makeTitle('Platform Engineer', 'Platform Engineer', 'conditional', {
      requires_evidence: 'Resume must show infrastructure or platform security experience',
    }),
    makeTitle('Software Architect', 'Software Architect', 'conditional', {
      seniority_hint: 'senior',
      requires_evidence: 'Resume must show architecture leadership and software design at scale',
    }),
    makeTitle('Technology Consultant', 'Technology Consultant', 'conditional', { aliases: ['Tech Consultant'] }),
    // Keywords
    makeKeyword('SOC', 'SOC', 'abbreviation'),
    makeKeyword('IAM', 'IAM', 'abbreviation'),
    makeKeyword('InfoSec', 'InfoSec', 'abbreviation'),
    makeKeyword('GRC', 'GRC', 'abbreviation'),
    makeKeyword('SDE', 'SDE', 'abbreviation'),
    makeKeyword('Cyber', 'Cyber', 'generic'),
    makeKeyword('software', 'software', 'generic'),
    makeKeyword('developer', 'developer', 'generic'),
    makeKeyword('Application', 'Application', 'generic'),
    makeKeyword('web', 'web', 'generic'),
    makeKeyword('frontend', 'frontend', 'generic', ['front-end', 'Front End']),
    makeKeyword('backend', 'backend', 'generic', ['back-end', 'Back End']),
    makeKeyword('fullstack', 'fullstack', 'generic', ['full-stack', 'full stack']),
    makeKeyword('risk management', 'risk management', 'domain'),
    makeKeyword('Cyber Threat', 'Cyber Threat', 'domain'),
  ],
}

// ── Segment 2: Computer Science Internship ───────────────────
const csInternship: SegmentData = {
  id: 'seg-cs-internship',
  slug: 'cs-internship',
  segmentName: 'Computer Science Internship',
  canonicalName: 'Computer Science Internship',
  geography: 'Global',
  family: 'Technology – Engineering',
  status: 'active',
  sourceFile: 'Job Roles 1.pdf',
  isMatched: false,
  alternateRoles: [
    // Core titles
    makeTitle('Software Engineer', 'Software Engineer', 'core'),
    makeTitle('Software Developer', 'Software Developer', 'core'),
    makeTitle('Data Analyst', 'Data Analyst', 'core'),
    makeTitle('Data Engineer', 'Data Engineer', 'core'),
    makeTitle('Data Scientist', 'Data Scientist', 'core'),
    makeTitle('Data Platform Engineer', 'Data Platform Engineer', 'core'),
    makeTitle('Machine Learning', 'Machine Learning Engineer', 'core'),
    makeTitle('Artificial Intelligence', 'AI / ML Engineer', 'core', {
      aliases: ['Aritifical Intelligence'],  // typo preserved
    }),
    // Related titles
    makeTitle('Data Mining Specialist', 'Data Mining Specialist', 'related'),
    makeTitle('Data Specialist', 'Data Specialist', 'related'),
    makeTitle('Microsoft Stack Developer', 'Microsoft Stack Developer', 'related'),
    makeTitle('LAMP Stack', 'LAMP Stack Developer', 'related'),
    makeTitle('MEAN Stack', 'MEAN Stack Developer', 'related'),
    makeTitle('MERN Stack', 'MERN Stack Developer', 'related'),
    makeTitle('End-to-End Developer', 'End-to-End Developer', 'related'),
    makeTitle('Application Developer', 'Application Developer', 'related'),
    makeTitle('Web Developer', 'Web Developer', 'related'),
    // Keywords
    makeKeyword('ML', 'ML', 'abbreviation'),
    makeKeyword('AI', 'AI', 'abbreviation'),
    makeKeyword('sql', 'SQL', 'generic'),
    makeKeyword('automation', 'automation', 'generic'),
    makeKeyword('devops', 'devops', 'generic'),
    makeKeyword('Python', 'Python', 'generic'),
    makeKeyword('web', 'web', 'generic'),
    makeKeyword('Java', 'Java', 'generic'),
    makeKeyword('.Net', '.Net', 'generic', ['Dot Net', 'Dotnet', 'Net']),
    makeKeyword('Dot', 'Dot', 'generic'),
    makeKeyword('fullstack', 'fullstack', 'generic', ['full-stack', 'full stack']),
    makeKeyword('frontend', 'frontend', 'generic', ['front-end', 'Front End']),
    makeKeyword('backend', 'backend', 'generic', ['back-end', 'Back End']),
    makeKeyword('software', 'software', 'generic'),
    makeKeyword('developer', 'developer', 'generic'),
    makeKeyword('Intern', 'Intern', 'generic'),
    makeKeyword('Data Science', 'Data Science', 'domain'),
    makeKeyword('Technology', 'Technology', 'generic'),
    makeKeyword('Technologist', 'Technologist', 'generic'),
    makeKeyword('Technology Specialist', 'Technology Specialist', 'generic'),
    makeKeyword('Cross-platform', 'Cross-platform', 'domain'),
  ],
}

// ── Registry ─────────────────────────────────────────────────
export const MOCK_SEGMENTS: SegmentData[] = [
  cybersecurityUK,
  csInternship,
]

/**
 * Simulate resume matching — sets isMatched on the best-fit segment.
 * In production, this comes from the resume parser + discovery engine.
 */
export function applyResumeMatch(
  segments: SegmentData[],
  matchedSlug: string | null
): SegmentData[] {
  return segments.map(s => ({
    ...s,
    isMatched: s.slug === matchedSlug,
  }))
}

export function getSegmentStats(segments: SegmentData[]) {
  const totalRoles = segments.reduce(
    (sum, s) => sum + s.alternateRoles.filter(r => r.type === 'title').length, 0
  )
  const totalKeywords = segments.reduce(
    (sum, s) => sum + s.alternateRoles.filter(r => r.type === 'keyword').length, 0
  )
  return {
    totalSegments: segments.length,
    totalRoles,
    totalKeywords,
    totalTerms: totalRoles + totalKeywords,
  }
}
