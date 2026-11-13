'use client'

import React from 'react'

interface HeaderProps {
  matchedSegmentName?: string
  totalRoles: number
  totalSegments: number
  searchQuery: string
  onSearchChange: (query: string) => void
  viewMode: 'universe' | 'segment'
  currentSegmentName?: string
  onResetView: () => void
  onSelectMatchedSegment: (slug: string) => void
  activeMatchedSlug: string
}

export function Header({
  matchedSegmentName,
  totalRoles,
  totalSegments,
  searchQuery,
  onSearchChange,
  viewMode,
  currentSegmentName,
  onResetView,
  onSelectMatchedSegment,
  activeMatchedSlug,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#1E2E42] bg-[#0B1D33]/95 backdrop-blur px-4 py-3 sm:px-6">
      <div className="mx-auto flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E1E1E] border border-[#2A3B4E] shadow-sm">
            <span className="font-extrabold text-[#29FE29] text-lg tracking-wider">AW</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white">APPLY WIZZ</span>
              <span className="rounded-full bg-[#1E2E42] px-2 py-0.5 text-xs font-semibold text-[#29FE29]">
                Career GPS 🧭
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Your Career Partner · <span className="text-gray-300 font-medium">One Resume. More Job Roles.</span>
            </p>
          </div>
        </div>

        {/* Matched resume simulation / selector */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-gray-400">Candidate Match:</span>
          <button
            onClick={() => onSelectMatchedSegment('cybersecurity-uk')}
            className={`rounded-full px-3 py-1 font-medium transition-all ${
              activeMatchedSlug === 'cybersecurity-uk'
                ? 'bg-[#29FE29] text-[#0B1D33] shadow-[0_0_12px_rgba(41,254,41,0.35)]'
                : 'bg-[#132338] text-gray-300 hover:bg-[#1C3250] hover:text-white border border-[#233852]'
            }`}
          >
            🛡️ Cybersecurity for UK
          </button>
          <button
            onClick={() => onSelectMatchedSegment('cs-internship')}
            className={`rounded-full px-3 py-1 font-medium transition-all ${
              activeMatchedSlug === 'cs-internship'
                ? 'bg-[#29FE29] text-[#0B1D33] shadow-[0_0_12px_rgba(41,254,41,0.35)]'
                : 'bg-[#132338] text-gray-300 hover:bg-[#1C3250] hover:text-white border border-[#233852]'
            }`}
          >
            💻 CS Internship
          </button>
          <button
            onClick={() => onSelectMatchedSegment('')}
            className={`rounded-full px-2.5 py-1 text-gray-400 transition-all hover:text-white ${
              !activeMatchedSlug ? 'bg-[#1E2E42] text-white' : ''
            }`}
          >
            Clear Match
          </button>
        </div>

        {/* Search input & navigation */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search roles or keywords..."
              className="w-full rounded-lg border border-[#233852] bg-[#112233] px-3.5 py-1.5 text-xs text-white placeholder-gray-400 focus:border-[#2C76FF] focus:outline-none focus:ring-1 focus:ring-[#2C76FF]"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1.5 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {viewMode === 'segment' && (
            <button
              onClick={onResetView}
              className="flex items-center gap-1.5 rounded-lg bg-[#2C76FF] px-3 py-1.5 text-xs font-semibold text-white shadow transition-all hover:bg-[#1d63e6]"
            >
              ← Universe View
            </button>
          )}
        </div>
      </div>

      {/* Breadcrumb bar when in segment mode */}
      {viewMode === 'segment' && currentSegmentName && (
        <div className="mt-2.5 flex items-center justify-between border-t border-[#16273c] pt-2 text-xs">
          <div className="flex items-center gap-2 text-gray-300">
            <button
              onClick={onResetView}
              className="text-[#2C76FF] hover:underline"
            >
              Career Universe ({totalSegments} Segments)
            </button>
            <span>/</span>
            <span className="font-semibold text-white">{currentSegmentName}</span>
            {matchedSegmentName === currentSegmentName && (
              <span className="rounded bg-[#29FE29]/20 px-2 py-0.5 text-[11px] font-bold text-[#29FE29] border border-[#29FE29]/40">
                ★ Matched by Resume
              </span>
            )}
          </div>
          <span className="text-gray-400 text-[11px]">
            Click any tile to inspect role rationale or search provenance
          </span>
        </div>
      )}
    </header>
  )
}
