'use client'

import React, { useState } from 'react'
import type { SegmentData, AlternateRole } from '@/types/career-gps'

interface AccessibleRoleListProps {
  segments: SegmentData[]
  currentSegment: SegmentData | null
  onSelectSegment: (segment: SegmentData) => void
  onSelectRole: (role: AlternateRole, segment: SegmentData) => void
  searchQuery: string
  selectedRole: AlternateRole | null
}

export function AccessibleRoleList({
  segments,
  currentSegment,
  onSelectSegment,
  onSelectRole,
  searchQuery,
  selectedRole,
}: AccessibleRoleListProps) {
  const queryLower = searchQuery.trim().toLowerCase()

  // Filter segments by search query
  const filteredSegments = segments.filter((s) => {
    if (!queryLower) return true
    return (
      s.segmentName.toLowerCase().includes(queryLower) ||
      s.family.toLowerCase().includes(queryLower) ||
      s.alternateRoles.some((r) => r.canonical.toLowerCase().includes(queryLower))
    )
  })

  // Group by primary domain / career family
  const groupedByFamily: Record<string, SegmentData[]> = {}
  for (const seg of filteredSegments) {
    if (!groupedByFamily[seg.family]) {
      groupedByFamily[seg.family] = []
    }
    groupedByFamily[seg.family].push(seg)
  }

  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({
    'Cybersecurity': true,
  })

  const toggleFamily = (family: string) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [family]: !prev[family],
    }))
  }

  return (
    <nav
      aria-label="Accessible Career Navigation and Role Explorer"
      className="w-full max-w-6xl mx-auto p-4 sm:p-6 space-y-6 text-gray-200"
    >
      <div className="flex items-center justify-between border-b border-[#1E2E42] pb-3">
        <div>
          <h2 className="text-lg font-bold text-white">Career Navigator — Accessible List View</h2>
          <p className="text-xs text-gray-400">
            Keyboard and screen-reader optimized hierarchy of all 8 domains, 140 segments, and roles.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#29FE29]" />
            <span className="text-gray-300 font-medium">Resume-Derived (#29FE29)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-[#2C76FF]" />
            <span className="text-gray-300 font-medium">Candidate Interest (#2C76FF)</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedByFamily).map(([family, famSegments]) => {
          const isExpanded = expandedFamilies[family] ?? false
          return (
            <section
              key={family}
              className="rounded-xl border border-[#1E2E42] bg-[#0A1726] overflow-hidden"
              aria-labelledby={`family-heading-${family.replace(/\s+/g, '-')}`}
            >
              <button
                type="button"
                onClick={() => toggleFamily(family)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between p-4 bg-[#0B1D33] text-left hover:bg-[#10243C] transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C76FF]"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-white tracking-wide" id={`family-heading-${family.replace(/\s+/g, '-')}`}>
                    {family}
                  </span>
                  <span className="rounded-full bg-[#182B42] px-2 py-0.5 text-xs text-gray-300">
                    {famSegments.length} Segments
                  </span>
                </div>
                <span className="text-xs text-gray-400 font-semibold">
                  {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
                </span>
              </button>

              {isExpanded && (
                <div className="p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {famSegments.map((seg) => {
                    const isMatched = seg.isMatched
                    const isCurrent = currentSegment?.id === seg.id

                    return (
                      <article
                        key={seg.id}
                        className={`rounded-lg border p-3.5 transition-all ${
                          isMatched
                            ? 'border-[#29FE29] bg-[#0F3323]/40 shadow-[0_0_10px_rgba(41,254,41,0.15)]'
                            : isCurrent
                            ? 'border-[#2C76FF] bg-[#0F2238]'
                            : 'border-[#1E2E42] bg-[#0C1A2B] hover:border-[#2C486B]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-white text-sm">
                            {seg.canonicalName}
                          </h3>
                          {isMatched && (
                            <span className="rounded bg-[#29FE29] px-1.5 py-0.5 text-[10px] font-bold text-[#0B1D33] tracking-wider uppercase">
                              Matched
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-gray-400 mb-3">
                          {seg.geography} · {seg.alternateRoles.length} roles & keywords
                        </p>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectSegment(seg)}
                            className="rounded-md bg-[#1B2F48] px-2.5 py-1 text-xs text-gray-200 hover:bg-[#254266] hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#2C76FF]"
                          >
                            Explore Segment
                          </button>
                        </div>

                        {/* Top roles list */}
                        <ul className="mt-3 pt-2.5 border-t border-[#18283C] space-y-1 text-xs" aria-label={`Roles for ${seg.canonicalName}`}>
                          {seg.alternateRoles.slice(0, 4).map((role) => (
                            <li key={role.id}>
                              <button
                                type="button"
                                onClick={() => onSelectRole(role, seg)}
                                className={`w-full text-left truncate rounded px-1.5 py-0.5 hover:bg-[#182C44] transition-colors focus:outline-none focus:ring-1 focus:ring-[#2C76FF] ${
                                  selectedRole?.id === role.id ? 'text-[#29FE29] font-bold' : 'text-gray-300'
                                }`}
                              >
                                • {role.canonical}
                              </button>
                            </li>
                          ))}
                        </ul>
                      </article>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
      </div>
    </nav>
  )
}
