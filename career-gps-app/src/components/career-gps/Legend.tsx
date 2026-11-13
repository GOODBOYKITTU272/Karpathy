'use client'

import React from 'react'

interface LegendProps {
  viewMode: 'universe' | 'segment'
  totalRoles?: number
  totalKeywords?: number
  coreCount?: number
  relatedCount?: number
  conditionalCount?: number
}

export function Legend({
  viewMode,
  totalRoles = 0,
  totalKeywords = 0,
  coreCount = 0,
  relatedCount = 0,
  conditionalCount = 0,
}: LegendProps) {
  if (viewMode === 'universe') {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#16273c] bg-[#09182A] px-4 py-2.5 text-xs text-gray-300">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
            Universe Guide:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#0F3323] border border-[#29FE29]" />
            <span>Matched Segment (from candidate resume)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-[#1a3a6c] border border-[#234B7D]" />
            <span>Available ApplyWizz Career Segments</span>
          </div>
        </div>

        <div className="text-[11px] text-gray-400">
          Tile size reflects breadth of configured search terms · No arbitrary job counts
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#16273c] bg-[#09182A] px-4 py-2.5 text-xs text-gray-300">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-semibold text-gray-400 uppercase tracking-wider text-[11px]">
          Role Types:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#2C76FF]" />
          <span>Core Titles ({coreCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#1a4a7a]" />
          <span>Related Titles ({relatedCount})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#7a4a00]" />
          <span className="flex items-center gap-1">
            Conditional Titles ({conditionalCount})
            <span className="text-[#FFDE59] text-[10px]">⚠️</span>
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-[#2a2a2a] border border-[#444]" />
          <span>Search Keywords ({totalKeywords})</span>
        </div>
      </div>

      <div className="text-[11px] text-gray-400">
        Total {totalRoles + totalKeywords} terms in this segment
      </div>
    </div>
  )
}
