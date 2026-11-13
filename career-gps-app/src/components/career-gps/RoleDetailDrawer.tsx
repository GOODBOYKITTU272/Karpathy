'use client'

import React from 'react'
import type { AlternateRole, SegmentData } from '@/types/career-gps'

interface RoleDetailDrawerProps {
  role: AlternateRole | null
  segment: SegmentData | null
  onClose: () => void
}

export function RoleDetailDrawer({ role, segment, onClose }: RoleDetailDrawerProps) {
  if (!role || !segment) return null

  const isKeyword = role.type === 'keyword'
  const isTitle = role.type === 'title'

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-[#1E2E42] bg-[#0E1F35] shadow-2xl transition-transform duration-300 ease-in-out sm:w-96"
      aria-label="Role Details"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1E2E42] px-5 py-4 bg-[#0B1D33]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-wide text-gray-300">
            {isKeyword ? 'SEARCH KEYWORD HINT' : 'JOB ROLE DETAILS'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-[#1A2C42] hover:text-white"
          aria-label="Close drawer"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm text-gray-200">
        {/* Main Title & Type Pill */}
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {isTitle && (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                  role.relationship_type === 'core'
                    ? 'bg-[#2C76FF]/25 text-[#73A6FF] border border-[#2C76FF]/40'
                    : role.relationship_type === 'related'
                    ? 'bg-[#1C4E80]/40 text-[#A2C7ED] border border-[#2A659E]/40'
                    : 'bg-[#965A00]/30 text-[#FFBE59] border border-[#E08A00]/50'
                }`}
              >
                {role.relationship_type} Role
              </span>
            )}

            {isKeyword && (
              <span className="rounded-full bg-gray-800 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-gray-300 border border-gray-600">
                Retrieval Keyword ({role.keyword_type})
              </span>
            )}

            {role.seniority_hint && (
              <span className="rounded-full bg-purple-900/40 px-2.5 py-0.5 text-xs font-medium text-purple-300 border border-purple-500/30">
                Seniority: {role.seniority_hint}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
            {role.canonical}
          </h2>
          {role.raw !== role.canonical && (
            <p className="text-xs text-gray-400 mt-1">
              Source string in segment: <code className="text-gray-300 bg-[#16273c] px-1 py-0.5 rounded">{role.raw}</code>
            </p>
          )}
        </div>

        {/* What this means */}
        <div className="rounded-xl border border-[#1E2E42] bg-[#0A182B] p-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
            Classification & Strategy
          </h3>
          {isTitle ? (
            <p className="text-xs text-gray-300 leading-relaxed">
              {role.relationship_type === 'core' && (
                <>This is a <strong>Core Job Title</strong> for the {segment.canonicalName} segment. ApplyWizz actively identifies and submits applications under this canonical title when candidate resume evidence establishes relevant experience.</>
              )}
              {role.relationship_type === 'related' && (
                <>This is a <strong>Related Job Title</strong>. Employers often advertise overlapping responsibilities under this title. ApplyWizz leverages it to broaden your candidate discovery horizon.</>
              )}
              {role.relationship_type === 'conditional' && (
                <>This is a <strong>Conditional Role</strong>. It represents an adjacent specialization or seniority-gated title. It is evaluated based on specific evidence in your resume.</>
              )}
            </p>
          ) : (
            <p className="text-xs text-gray-300 leading-relaxed">
              This term is a <strong>Search Keyword Hint</strong> used for job-board recall. It is not an independent vacancy or standalone title. ApplyWizz uses it in candidate search queries to catch overlapping employer listings.
            </p>
          )}
        </div>

        {/* Evidence Requirements for Conditional/Senior roles */}
        {role.requires_evidence && (
          <div className="rounded-xl border border-[#FFDE59]/30 bg-[#FFDE59]/10 p-4">
            <h4 className="text-xs font-bold text-[#FFDE59] uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <span>⚠️</span> Required Resume Evidence
            </h4>
            <p className="text-xs text-gray-200 leading-relaxed">
              {role.requires_evidence}
            </p>
          </div>
        )}

        {/* Aliases & Alternate Spellings */}
        {role.aliases && role.aliases.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Recognized Synonyms & Abbreviations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {role.aliases.map((alias, idx) => (
                <span
                  key={idx}
                  className="rounded-md bg-[#13253B] px-2.5 py-1 text-xs text-gray-300 border border-[#203753]"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Parent Segment Metadata */}
        <div className="border-t border-[#1E2E42] pt-4 space-y-2">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Parent Segment Context
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-lg bg-[#0B1A2C] p-2.5">
              <span className="text-gray-400 block text-[11px]">Segment</span>
              <span className="font-semibold text-white">{segment.segmentName}</span>
            </div>
            <div className="rounded-lg bg-[#0B1A2C] p-2.5">
              <span className="text-gray-400 block text-[11px]">Geography</span>
              <span className="font-semibold text-white">{segment.geography}</span>
            </div>
            <div className="rounded-lg bg-[#0B1A2C] p-2.5">
              <span className="text-gray-400 block text-[11px]">Career Family</span>
              <span className="font-semibold text-white">{segment.family}</span>
            </div>
            <div className="rounded-lg bg-[#0B1A2C] p-2.5">
              <span className="text-gray-400 block text-[11px]">Source</span>
              <span className="font-semibold text-white truncate block">{segment.sourceFile}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer disclaimer per PRD */}
      <div className="border-t border-[#1E2E42] p-4 bg-[#0B1D33] text-[11px] text-gray-400 text-center">
        ApplyWizz Career GPS · Visual exploration only · No numeric fit scores
      </div>
    </aside>
  )
}
