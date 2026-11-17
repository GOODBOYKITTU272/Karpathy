'use client'

import React, { useState, useMemo } from 'react'
import { Header } from '@/components/career-gps/Header'
import { CareerTreemap } from '@/components/career-gps/CareerTreemap'
import { Legend } from '@/components/career-gps/Legend'
import { RoleDetailDrawer } from '@/components/career-gps/RoleDetailDrawer'
import { AccessibleRoleList } from '@/components/career-gps/AccessibleRoleList'
import { MOCK_SEGMENTS, applyResumeMatch, getSegmentStats } from '@/lib/career-gps/mock-data'
import type { SegmentData, AlternateRole, ViewMode } from '@/types/career-gps'

export default function CareerGPSPage() {
  // Matched segment simulation (defaults to Cybersecurity UK as per user flow)
  const [activeMatchedSlug, setActiveMatchedSlug] = useState<string>('cybersecurity-uk')
  
  // Navigation & Presentation state
  const [viewMode, setViewMode] = useState<ViewMode>('universe')
  const [displayMode, setDisplayMode] = useState<'treemap' | 'list'>('treemap')
  const [currentSegment, setCurrentSegment] = useState<SegmentData | null>(null)
  const [selectedRole, setSelectedRole] = useState<AlternateRole | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Compute segments with current match applied
  const segments = useMemo(() => {
    return applyResumeMatch(MOCK_SEGMENTS, activeMatchedSlug || null)
  }, [activeMatchedSlug])

  // Current segment stats
  const universeStats = useMemo(() => getSegmentStats(segments), [segments])

  const segmentStats = useMemo(() => {
    if (!currentSegment) return null
    const titles = currentSegment.alternateRoles.filter((r) => r.type === 'title')
    const keywords = currentSegment.alternateRoles.filter((r) => r.type === 'keyword')
    return {
      totalRoles: titles.length,
      totalKeywords: keywords.length,
      coreCount: titles.filter((r) => r.relationship_type === 'core').length,
      relatedCount: titles.filter((r) => r.relationship_type === 'related').length,
      conditionalCount: titles.filter((r) => r.relationship_type === 'conditional').length,
    }
  }, [currentSegment])

  const handleSelectSegment = (seg: SegmentData) => {
    setCurrentSegment(seg)
    setViewMode('segment')
    setSelectedRole(null)
  }

  const handleSelectRole = (role: AlternateRole, seg: SegmentData) => {
    setCurrentSegment(seg)
    setSelectedRole(role)
  }

  const handleResetView = () => {
    setViewMode('universe')
    setSelectedRole(null)
  }

  const matchedSegment = segments.find((s) => s.isMatched)

  return (
    <main className="flex min-h-screen lg:min-h-[100dvh] flex-col bg-[#071322]">
      {/* Brand Header */}
      <Header
        matchedSegmentName={matchedSegment?.segmentName}
        totalRoles={universeStats.totalRoles}
        totalSegments={universeStats.totalSegments}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        currentSegmentName={currentSegment?.segmentName}
        onResetView={handleResetView}
        onSelectMatchedSegment={setActiveMatchedSlug}
        activeMatchedSlug={activeMatchedSlug}
      />

      {/* Development Preview Banner */}
      <div className="bg-[#11243A] border-b border-[#1E3654] px-4 py-1.5 text-xs text-gray-300 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-[#2C76FF]/20 text-[#73A6FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-[#2C76FF]/30">
            UI Preview
          </span>
          <span className="text-[11px] text-gray-300">
            Displaying sample career dataset (2 segments, 89 roles). Full 140-segment / 4,551-term catalog is published in database; API connection will follow in Milestone 6.
          </span>
        </div>
        <span className="text-[10px] text-gray-400 hidden sm:inline">
          Resume upload & lead capture are disabled in this preview.
        </span>
      </div>

      {/* Accessible Presentation Mode Switcher */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#1E2E42] bg-[#0A1626] text-xs">
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Visual presentation mode">
          <button
            type="button"
            role="tab"
            aria-selected={displayMode === 'treemap'}
            onClick={() => setDisplayMode('treemap')}
            className={`rounded-md px-3 py-1 font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-[#2C76FF] ${
              displayMode === 'treemap'
                ? 'bg-[#1C3A5E] text-[#29FE29] border border-[#2A517E]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🗺️ Interactive Treemap
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={displayMode === 'list'}
            onClick={() => setDisplayMode('list')}
            className={`rounded-md px-3 py-1 font-semibold transition-colors focus:outline-none focus:ring-1 focus:ring-[#2C76FF] ${
              displayMode === 'list'
                ? 'bg-[#1C3A5E] text-[#29FE29] border border-[#2A517E]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            📋 Accessible List View
          </button>
        </div>
      </div>

      {/* Main Visualization or Accessible List */}
      <div className="relative flex-1">
        {displayMode === 'treemap' ? (
          <CareerTreemap
            segments={segments}
            viewMode={viewMode}
            currentSegment={currentSegment}
            onSelectSegment={handleSelectSegment}
            onSelectRole={handleSelectRole}
            searchQuery={searchQuery}
            selectedRole={selectedRole}
          />
        ) : (
          <AccessibleRoleList
            segments={segments}
            currentSegment={currentSegment}
            onSelectSegment={handleSelectSegment}
            onSelectRole={handleSelectRole}
            searchQuery={searchQuery}
            selectedRole={selectedRole}
          />
        )}

        {/* Role Detail Drawer */}
        <RoleDetailDrawer
          role={selectedRole}
          segment={currentSegment}
          onClose={() => setSelectedRole(null)}
        />
      </div>

      {/* Interactive Legend & Data Lineage Guide */}
      <Legend
        viewMode={viewMode}
        totalRoles={segmentStats?.totalRoles}
        totalKeywords={segmentStats?.totalKeywords}
        coreCount={segmentStats?.coreCount}
        relatedCount={segmentStats?.relatedCount}
        conditionalCount={segmentStats?.conditionalCount}
      />
    </main>
  )
}
