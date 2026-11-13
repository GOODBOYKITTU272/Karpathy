'use client'

import React, { useRef, useState, useEffect, useMemo } from 'react'
import type { SegmentData, AlternateRole, TooltipState } from '@/types/career-gps'
import {
  computeUniverseLayout,
  computeSegmentLayout,
  truncateLabel,
  type SegmentTile,
  type RoleTile,
} from '@/lib/career-gps/treemap-utils'
import { getFamilyColor, getRoleColor } from '@/types/career-gps'

interface CareerTreemapProps {
  segments: SegmentData[]
  viewMode: 'universe' | 'segment'
  currentSegment: SegmentData | null
  onSelectSegment: (segment: SegmentData) => void
  onSelectRole: (role: AlternateRole, segment: SegmentData) => void
  searchQuery: string
  selectedRole: AlternateRole | null
}

export function CareerTreemap({
  segments,
  viewMode,
  currentSegment,
  onSelectSegment,
  onSelectRole,
  searchQuery,
  selectedRole,
}: CareerTreemapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 1200,
    height: 650,
  })

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  })

  // Measure container dimensions
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        setDimensions({
          width: Math.max(clientWidth, 320),
          height: Math.max(clientHeight, 500),
        })
      }
    }

    updateSize()
    const observer = new ResizeObserver(updateSize)
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // Filter terms by search query if present
  const queryLower = searchQuery.trim().toLowerCase()

  // Compute Universe layout
  const universeTiles = useMemo(() => {
    if (viewMode !== 'universe') return []
    return computeUniverseLayout(segments, dimensions.width, dimensions.height)
  }, [segments, viewMode, dimensions.width, dimensions.height])

  // Compute Segment drill-down layout
  const segmentTiles = useMemo(() => {
    if (viewMode !== 'segment' || !currentSegment) return []
    return computeSegmentLayout(currentSegment, dimensions.width, dimensions.height)
  }, [currentSegment, viewMode, dimensions.width, dimensions.height])

  // Tooltip handlers
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      setTooltip((prev) => ({
        ...prev,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }))
    }
  }

  const handleTileHover = (content: TooltipState['content']) => {
    setTooltip((prev) => ({
      ...prev,
      visible: true,
      content,
    }))
  }

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, visible: false, content: null }))
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[calc(100vh-140px)] min-h-[550px] overflow-hidden bg-[#071322] select-none"
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="block w-full h-full"
      >
        <defs>
          {/* Matched segment glow pattern */}
          <filter id="glow-matched" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#29FE29" floodOpacity="0.7" />
          </filter>
          <filter id="shadow-tile" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000000" floodOpacity="0.5" />
          </filter>
        </defs>

        {/* ========================================================
            UNIVERSE VIEW: All ApplyWizz Segments
           ======================================================== */}
        {viewMode === 'universe' && (
          <g className="universe-group">
            {universeTiles.map((tile) => {
              const { segment, width, height, x0, y0 } = tile
              const isMatched = segment.isMatched
              const isSearchMatch = queryLower
                ? segment.segmentName.toLowerCase().includes(queryLower) ||
                  segment.alternateRoles.some((r) => r.canonical.toLowerCase().includes(queryLower))
                : true

              const baseColor = getFamilyColor(segment.family)

              return (
                <g
                  key={segment.id}
                  transform={`translate(${x0}, ${y0})`}
                  onClick={() => onSelectSegment(segment)}
                  onMouseEnter={() =>
                    handleTileHover({
                      title: segment.segmentName,
                      subtitle: `${segment.family} · ${segment.geography}`,
                      body: `${segment.alternateRoles.length} job titles & search keywords configured. Click to explore.`,
                      badge: isMatched ? '★ Matched by Resume' : undefined,
                      badgeColor: '#29FE29',
                    })
                  }
                  className="cursor-pointer transition-all duration-150"
                  style={{ opacity: isSearchMatch ? 1 : 0.25 }}
                >
                  {/* Tile rectangle */}
                  <rect
                    width={Math.max(width - 2, 0)}
                    height={Math.max(height - 2, 0)}
                    rx={6}
                    fill={isMatched ? '#0F3323' : baseColor}
                    stroke={isMatched ? '#29FE29' : '#1A334E'}
                    strokeWidth={isMatched ? 3 : 1}
                    filter={isMatched ? 'url(#glow-matched)' : undefined}
                    className="transition-colors hover:brightness-125"
                  />

                  {/* Top-right Matched indicator badge */}
                  {isMatched && width > 90 && (
                    <g transform={`translate(${width - 80}, 8)`}>
                      <rect
                        width={70}
                        height={18}
                        rx={9}
                        fill="#29FE29"
                        opacity={0.9}
                      />
                      <text
                        x={35}
                        y={12}
                        textAnchor="middle"
                        fill="#0B1D33"
                        fontSize={9}
                        fontWeight="bold"
                        fontFamily="Noto Sans, sans-serif"
                      >
                        MATCHED
                      </text>
                    </g>
                  )}

                  {/* Main label */}
                  {tile.labelVisible && (
                    <g transform="translate(12, 22)">
                      <text
                        fill="#ffffff"
                        fontSize={Math.min(18, Math.max(12, Math.floor(width / 18)))}
                        fontWeight="700"
                        fontFamily="Noto Sans, sans-serif"
                      >
                        {truncateLabel(segment.canonicalName, width - 20)}
                      </text>
                      {height > 65 && (
                        <text
                          y={18}
                          fill="#93B4D8"
                          fontSize={11}
                          fontFamily="Noto Sans, sans-serif"
                        >
                          {segment.geography} · {segment.alternateRoles.length} roles/keywords
                        </text>
                      )}
                      {height > 95 && (
                        <text
                          y={36}
                          fill="#29FE29"
                          fontSize={11}
                          fontWeight="600"
                          fontFamily="Noto Sans, sans-serif"
                        >
                          Click to explore →
                        </text>
                      )}
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        )}

        {/* ========================================================
            SEGMENT DRILL-DOWN VIEW: Alternate Roles & Keywords
           ======================================================== */}
        {viewMode === 'segment' && currentSegment && (
          <g className="segment-group">
            {segmentTiles.map((tile) => {
              const { role, width, height, x0, y0 } = tile
              const isSelected = selectedRole?.id === role.id
              const isSearchMatch = queryLower
                ? role.canonical.toLowerCase().includes(queryLower) ||
                  role.raw.toLowerCase().includes(queryLower) ||
                  role.aliases.some((a) => a.toLowerCase().includes(queryLower))
                : true

              const fillColor = getRoleColor(role)
              const isTitle = role.type === 'title'

              return (
                <g
                  key={role.id}
                  transform={`translate(${x0}, ${y0})`}
                  onClick={() => onSelectRole(role, currentSegment)}
                  onMouseEnter={() =>
                    handleTileHover({
                      title: role.canonical,
                      subtitle: isTitle
                        ? `${role.relationship_type?.toUpperCase()} ROLE TITLE`
                        : `RETRIEVAL KEYWORD (${role.keyword_type})`,
                      body: isTitle
                        ? role.requires_evidence ||
                          'Click to view role evidence and synonym mappings.'
                        : 'Search query hint used for employer vacancy recall.',
                      badge: isTitle ? `${role.relationship_type}` : 'keyword',
                      caution: role.relationship_type === 'conditional' ? 'Requires evidence' : undefined,
                    })
                  }
                  className="cursor-pointer transition-all duration-150"
                  style={{ opacity: isSearchMatch ? 1 : 0.2 }}
                >
                  <rect
                    width={Math.max(width - 2, 0)}
                    height={Math.max(height - 2, 0)}
                    rx={4}
                    fill={fillColor}
                    stroke={
                      isSelected
                        ? '#29FE29'
                        : isTitle
                        ? '#3C82FF'
                        : '#353535'
                    }
                    strokeWidth={isSelected ? 2.5 : 1}
                    className="transition-colors hover:brightness-125"
                  />

                  {/* Conditional caution dot */}
                  {role.relationship_type === 'conditional' && width > 40 && (
                    <circle
                      cx={width - 10}
                      cy={10}
                      r={3.5}
                      fill="#FFDE59"
                    />
                  )}

                  {/* Tile Label */}
                  {tile.labelVisible && (
                    <g transform="translate(8, 16)">
                      <text
                        fill={isTitle ? '#ffffff' : '#b0b0b0'}
                        fontSize={Math.min(13, Math.max(9, Math.floor(width / 12)))}
                        fontWeight={isTitle ? '600' : '400'}
                        fontFamily="Noto Sans, sans-serif"
                      >
                        {truncateLabel(role.canonical, width - 14)}
                      </text>
                      {height > 38 && width > 70 && (
                        <text
                          y={14}
                          fill={
                            role.relationship_type === 'core'
                              ? '#90c0ff'
                              : role.relationship_type === 'conditional'
                              ? '#ffcc66'
                              : '#888888'
                          }
                          fontSize={9}
                          fontWeight="500"
                          fontFamily="Noto Sans, sans-serif"
                        >
                          {isTitle ? role.relationship_type : 'search keyword'}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              )
            })}
          </g>
        )}
      </svg>

      {/* Floating Karpathy-style Interactive Tooltip */}
      {tooltip.visible && tooltip.content && (
        <div
          className="pointer-events-none absolute z-50 max-w-xs rounded-lg border border-[#2A3F58] bg-[#0A1726]/95 p-3 text-xs shadow-2xl backdrop-blur transition-all"
          style={{
            left: Math.min(tooltip.x + 15, dimensions.width - 270),
            top: Math.min(tooltip.y + 15, dimensions.height - 130),
          }}
        >
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-bold text-white text-sm">
              {tooltip.content.title}
            </span>
            {tooltip.content.badge && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#0B1D33]"
                style={{ backgroundColor: tooltip.content.badgeColor || '#2C76FF' }}
              >
                {tooltip.content.badge}
              </span>
            )}
          </div>
          {tooltip.content.subtitle && (
            <p className="text-[11px] font-medium text-gray-400 mb-1.5">
              {tooltip.content.subtitle}
            </p>
          )}
          <p className="text-[11px] text-gray-300 leading-relaxed">
            {tooltip.content.body}
          </p>
          {tooltip.content.caution && (
            <p className="mt-1.5 text-[10px] font-semibold text-[#FFDE59]">
              ⚠️ {tooltip.content.caution}
            </p>
          )}
        </div>
      )}

      {/* Universe bottom status pill */}
      {viewMode === 'universe' && (
        <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3 rounded-full bg-[#0B1D33]/90 px-4 py-2 border border-[#1E2E42] text-xs text-gray-300 shadow-md">
          <span className="flex h-2.5 w-2.5 rounded-full bg-[#29FE29] animate-pulse" />
          <span>Click any segment tile to zoom in and discover its full role universe</span>
        </div>
      )}
    </div>
  )
}
