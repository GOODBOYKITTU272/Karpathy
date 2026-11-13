# ApplyWizz Career GPS — Multi-Platform Architecture Blueprint
*Web (Next.js 16) → Mobile (React Native + Expo: Android & iOS)*
*Status: Approved Baseline Architecture*

---

## 1. Executive Strategy & Phased Roadmap

| Phase | Target Platform | Technology Stack | Core Focus |
|---|---|---|---|
| **Phase 1 (Current)** | **Desktop & Mobile Web** | Next.js 16 + TypeScript + D3.js + Tailwind CSS | Website launch first. Full Karpathy-inspired dense treemap on large screens, resume evidence parsing, Supabase integration, and Excel workbook ingestion. |
| **Phase 2** | **Android App** | React Native + Expo + TypeScript | Native mobile app targeting Google Play. Reuses shared backend, types, and career engine. Mobile-optimized touch gestures and list/treemap hybrid views. |
| **Phase 3** | **iPhone App** | React Native + Expo (iOS target) | App Store submission using the unified Expo codebase with iOS-specific navigation and Haptic feedback. |

---

## 2. Target Monorepo Structure

To ensure zero code duplication between the Web and Mobile apps, the codebase is architected with clear boundaries:

```text
applywizz-career-gps/
├── apps/
│   ├── web/                          # Next.js 16 Web application (current career-gps-app)
│   │   ├── src/app/                  # App router routes & pages
│   │   ├── src/components/           # Web UI components & SVG/D3 treemap
│   │   └── vercel.json               # Vercel deployment configuration
│   │
│   └── mobile/                       # Expo (React Native) Android & iOS app
│       ├── app/                      # Expo Router (tabs, stack navigation)
│       ├── components/               # Native touch components, drawer, bottom-sheets
│       └── app.json                  # Expo config (bundle IDs, permissions)
│
├── packages/
│   ├── shared/                       # Shared TypeScript definitions
│   │   ├── types/career-gps.ts       # Segment, AlternateRole, RelationshipType
│   │   └── constants/colors.ts       # ApplyWizz brand tokens (#0B1D33, #29FE29, #2C76FF)
│   │
│   ├── career-engine/                # Universal business logic (zero DOM dependencies)
│   │   ├── normalization-rules.ts    # Rules N-01 → N-07 (parse, dedup, title vs keyword)
│   │   └── treemap-math.ts           # Pure coordinate math for treemap layout
│   │
│   └── api-client/                   # Unified API & Supabase data access
│       ├── supabase.ts               # Authenticated Supabase client
│       └── queries.ts                # Fetch segments, discoveries, and role mappings
│
└── supabase/
    └── migrations/                   # Shared PostgreSQL schema, RLS, and functions
```

> [!NOTE]
> **Implementation Discipline:** As agreed, `career-gps-app/` remains as-is for the immediate Phase 1 launch. All shared types and normalization modules created today already have **zero DOM dependencies**, making extraction into `packages/shared` and `packages/career-engine` seamless when Expo is initialized.

---

## 3. Shared vs Platform-Specific Feature Matrix

| Feature | Website (Phase 1) | Mobile App (Phases 2 & 3) | Implementation Strategy |
|---|---|---|---|
| **Resume Upload** | Drag & drop PDF/DOCX | Native Document Picker (`expo-document-picker`) | Uploads to private Supabase Storage bucket `resumes` |
| **Resume Extraction** | Server-side parsing | Reuses Web Server API `/api/career-gps/discover` | Shared server pipeline |
| **Segment Identification** | Server-side classification | Reuses Web Server API | Single source of truth |
| **Career Treemap** | Full-width dense D3 SVG canvas | Touch-friendly pan/pinch treemap + native accessible list view | Web: D3 SVG<br>Mobile: React Native Skia / SVG with gesture handlers |
| **Role Inspection** | Right-side slide-over drawer | Native Bottom Sheet modal (`@gorhom/bottom-sheet`) | Identical data fields & evidence explanations |
| **User Accounts & Auth** | Supabase Auth (web cookies) | Supabase Auth (`expo-secure-store` for tokens) | Shared candidate history |
| **Branding** | ApplyWizz Navy/Green/Blue | ApplyWizz Navy/Green/Blue | Shared color constants & Noto Sans font |

---

## 4. Mobile Visualization UX Strategy

On desktop screens, candidates have ample horizontal space for a dense 50+ tile rectangular treemap. On mobile devices, cramming 50 small rectangular tiles into a vertical 390px viewport can impair legibility.

### Mobile-Native Adaptation Pattern
1. **Interactive Universe Map:** Touch-pan and pinch-to-zoom on the top-level career universe.
2. **List-First Discovery Option:** A responsive tab toggle allowing candidates to switch between:
   * **Visual Map:** Zoomable treemap with large family clusters.
   * **Categorized List:** Structured groups (Core Roles, Related Roles, Conditional Roles, Search Keywords) with badge counters.
3. **Bottom Sheet Drawer:** Tapping any role opens a smooth, native iOS/Android sheet displaying the exact evidence requirements and synonyms.

---

## 5. Technology Stack Specifications

* **Language:** TypeScript 5.x (Strict mode)
* **Web:** Next.js 16 (App Router), Tailwind CSS 4, D3.js 7
* **Mobile:** React Native 0.76+ with Expo SDK 52+, Expo Router
* **Database & Storage:** Supabase PostgreSQL 17 + Private Storage Buckets
* **Security & Auth:** Row Level Security (RLS) on all candidate profiles and discoveries
* **Deployment & CI:**
  * Web: Vercel ([applywizz-career-gps.vercel.app](https://applywizz-career-gps.vercel.app))
  * Mobile: EAS Build (Expo Application Services) for Google Play & Apple App Store
