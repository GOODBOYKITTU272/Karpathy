// ============================================================
// data/segments-registry.ts
// Known ApplyWizz segment definitions — compiled from PDF/CSV sources
// This is the source of truth for the import script until the full
// segment database is provided.
// DO NOT fabricate segments. Only add entries from verified source files.
// ============================================================

export interface SegmentDefinition {
  /** Unique slug for this segment */
  slug: string
  /** Original name as it appears in the source file */
  segmentName: string
  /** Canonical name without geography suffix */
  canonicalName: string
  /** Geographic market */
  geography: 'UK' | 'US' | 'Global'
  /** Role family for treemap grouping */
  family: string
  /** Source file this was read from */
  sourceFile: string
  /** Raw alternate roles string — exactly as in source */
  rawAlternateRoles: string
}

// ============================================================
// SEGMENT 1 — Cybersecurity for UK
// Source: "Job Roles 1(Cybersecurity for UK).csv"
// ============================================================
const cybersecurityUK: SegmentDefinition = {
  slug: 'cybersecurity-uk',
  segmentName: 'Cybersecurity for UK',
  canonicalName: 'Cybersecurity',
  geography: 'UK',
  family: 'Technology – Security',
  sourceFile: 'Job Roles 1(Cybersecurity for UK).csv',
  rawAlternateRoles:
    'Cybersecurity, Software Developer, Software Engineer, cyber engineer, risk management, Cyber Threat, Information Security, Security Architect, Security Operations Center, SOC, InfoSec, Security Analyst, Security Operations, GRC, IT Security, Incident Response, Network Security, Identity and Access Management, IAM, Cyber, software, developer, frontend, backend, fullstack, front-end, back-end, Application, Software Architect, Software Development Engineer, SDE, Software Programmer, Platform Engineer, Platform Technologist, Tech Consultant, Technology Consultant, Back End, Front End, web, risk analyst, compliance analyst',
}

// ============================================================
// SEGMENT 2 — Computer Science Internship
// Source: "Job Roles 1.pdf"
// Note: "Aritifical Intelligence" is a known typo in source —
//       preserved as raw, normalized to "Artificial Intelligence"
// ============================================================
const csInternship: SegmentDefinition = {
  slug: 'cs-internship',
  segmentName: 'Computer Science Internship',
  canonicalName: 'Computer Science Internship',
  geography: 'Global',
  family: 'Technology – Engineering',
  sourceFile: 'Job Roles 1.pdf',
  rawAlternateRoles:
    'Software Engineer, Data Analyst, Data Engineer, Data Scientist, Software Developer, Artificial Intelligence, Machine Learning, Intern, Data Science, ML, Aritifical Intelligence, AI, Data Platform Engineer, Data Mining Specialist, Data Specialist, Technologist, Technology, Technology Specialist, software, developer, frontend, backend, sql, automation, devops, Python, web, Java, .Net, Dot Net, Dotnet, fullstack, full-stack, full stack, Microsoft Stack Developer, Dot, Net, front-end, back-end, LAMP Stack, MEAN Stack, MERN Stack, End-to-End Developer, Application Developer, Cross-platform, Web Developer, Front End, Back End',
}

// ============================================================
// REGISTRY — all known segments
// Add new segments here as source files are provided
// ============================================================
export const SEGMENTS_REGISTRY: SegmentDefinition[] = [
  cybersecurityUK,
  csInternship,
]

// ============================================================
// Segment-specific normalization notes
// (used by the import script to override default rules)
// ============================================================
export const SEGMENT_NOTES: Record<string, string[]> = {
  'cs-internship': [
    '"Aritifical Intelligence" is a typo in source — normalize to "Artificial Intelligence"',
    '"Cross-platform" is a development approach, not a job title — classify as keyword',
    '"Intern" is a seniority modifier, not a job title — classify as keyword',
    '"Data Science" as a single entry = domain keyword; "Data Scientist" = title',
    '"Machine Learning" as a noun phrase = title (ML Engineer/Researcher)',
    '"Artificial Intelligence" as a noun phrase = title (AI Engineer)',
    '".Net", "Dot Net", "Dotnet", "Net" all normalize to dotnet — keyword',
    '"LAMP Stack", "MEAN Stack", "MERN Stack" = related titles (framework-specific developer roles)',
  ],
  'cybersecurity-uk': [
    '"Tech Consultant" and "Technology Consultant" are synonyms — deduplicate',
    '"SOC", "IAM", "InfoSec", "GRC" are abbreviation keywords only',
    '"Security Architect" is conditional — requires seniority evidence',
    '"risk management" is a domain phrase — keyword only',
  ],
}

// ============================================================
// Classification overrides per segment
// Segment-specific relationship_type overrides for edge cases
// ============================================================
export const CLASSIFICATION_OVERRIDES: Record<string, Record<string, 'core' | 'related' | 'conditional'>> = {
  'cs-internship': {
    'Software Engineer':         'core',
    'Software Developer':        'core',
    'Data Analyst':              'core',
    'Data Engineer':             'core',
    'Data Scientist':            'core',
    'Data Platform Engineer':    'core',
    'Data Mining Specialist':    'related',
    'Data Specialist':           'related',
    'Machine Learning':          'core',   // → ML Engineer / ML Researcher
    'Artificial Intelligence':   'core',   // → AI Engineer
    'Microsoft Stack Developer': 'related',
    'LAMP Stack':                'related',
    'MEAN Stack':                'related',
    'MERN Stack':                'related',
    'End-to-End Developer':      'related',
    'Application Developer':     'related',
    'Web Developer':             'related',
  },
  'cybersecurity-uk': {
    'Cybersecurity Analyst':              'core',
    'Cyber Security Engineer':           'core',
    'Information Security Analyst':      'core',
    'IT Security Analyst':               'core',
    'Security Operations Analyst':       'core',
    'Network Security Engineer':         'core',
    'Incident Response Analyst':         'core',
    'Identity & Access Management Engineer': 'core',
    'Security Architect':                'conditional',
    'Security Operations Center Analyst':'related',
    'GRC Analyst':                       'related',
    'Risk Analyst':                      'conditional',
    'Compliance Analyst':                'conditional',
  },
}
