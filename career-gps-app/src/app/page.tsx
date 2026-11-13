'use client'

import React, { useState, useMemo } from 'react'
import { Header } from '@/components/career-gps/Header'
import { CareerTreemap } from '@/components/career-gps/CareerTreemap'
import { Legend } from '@/components/career-gps/Legend'
import { RoleDetailDrawer } from '@/components/career-gps/RoleDetailDrawer'
import { MOCK_SEGMENTS, applyResumeMatch, getSegmentStats } from '@/lib/career-gps/mock-data'
import type { SegmentData, AlternateRole, ViewMode } from '@/types/career-gps'

export default function CareerGPSPage() {
  // Matched segment simulation (defaults to Cybersecurity UK as per user flow)
  const [activeMatchedSlug, setActiveMatchedSlug] = useState<string>('cybersecurity-uk')
  
  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('universe')
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
    <main className="flex min-h-screen flex-col bg-[#071322]">
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

      {/* Main Karpathy-inspired Treemap Visualization */}
      <div className="relative flex-1">
        <CareerTreemap
          segments={segments}
          viewMode={viewMode}
          currentSegment={currentSegment}
          onSelectSegment={handleSelectSegment}
          onSelectRole={handleSelectRole}
          searchQuery={searchQuery}
          selectedRole={selectedRole}
        />

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
