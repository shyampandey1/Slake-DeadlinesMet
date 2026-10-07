# DeadlinesMet: Reformers Ecosystem - Comprehensive System Architecture Audit

**Document Version:** 1.0.0-PROD  
**Timestamp:** October 2026  
**Target Environment:** Next.js 15 (App Router), React 19, Firebase v11, JEV TypeSafe SystemOne  
**Auditor:** Principal Full-Stack & Systems Architect  

---

## 1. Directory Tree & File Inventory

### 1.1 Complete Repository Topology
```
Slake-DeadlinesMet/
├── public/
│   ├── firebase-messaging-sw.js      # FCM background push service worker (v10.8.0 compat)
│   ├── gaze-worker.js                # Off-thread Web Worker for Eye Gaze & Blink detection
│   ├── presets.json                  # Canonical routine seed definitions for 18 professions
│   ├── manifest.json                 # PWA Web App Manifest
│   ├── sounds/                       # Alert audio assets (chimes, ticks, completion)
│   └── icons/                        # PWA & UI icons
├── src/
│   ├── ai/
│   │   ├── genkit.ts                 # Legacy Genkit AI configuration (to be unified onto JEV)
│   │   └── flows/
│   │       ├── organize-routine.ts   # Dynamic routine generator flow
│   │       └── generate-motivational-message.ts # Contextual motivational quote flow
│   ├── app/
│   │   ├── layout.tsx                # Root layout with comprehensive provider hierarchy
│   │   ├── page.tsx                  # Home route (Dynamic task dashboard / landing)
│   │   ├── timer/page.tsx            # Fullscreen interactive focus & MOVERS timer HUD
│   │   ├── analytics/page.tsx        # Productivity analytics & JEV Behavioral Insights
│   │   ├── rewards/page.tsx          # Reformer Achievement Center & UPI redemption hub
│   │   ├── reformers/page.tsx        # Global Reformer League & Co-Reformer discovery
│   │   ├── presets/page.tsx          # 18-profession routine catalog and switcher
│   │   ├── settings/page.tsx         # Account preferences, sound profiles, TTS voices
│   │   ├── login/page.tsx            # Firebase Auth Google/Email authentication
│   │   ├── signup/page.tsx           # User registration & onboarding kickoff
│   │   ├── onboarding/page.tsx       # Profession selection & initial routine hydration
│   │   ├── privacy/page.tsx          # Privacy policy & data security disclosures
│   │   └── api/
│   │       ├── analytics/
│   │       │   ├── insights/route.ts            # JEV SystemOne 7-day behavioral insights
│   │       │   ├── routine-evaluation/route.ts  # JEV SystemOne routine balance evaluation
│   │       │   └── reformer-evaluation/route.ts # JEV SystemOne co-reformer readiness scoring
│   │       ├── voice/
│   │       │   ├── intent/route.ts              # Speech normalization, dictionary & JEV fallback
│   │       │   └── synthesize/route.ts          # Neural TTS (Google Cloud Journey / ElevenLabs)
│   │       ├── notify-chat/route.ts             # Co-Reformer chat push notifications via FCM
│   │       ├── notify-admin-redemption/route.ts # Admin alerts for UPI cash-out redemption
│   │       └── send-nudge/route.ts              # High-priority automated habit nudges
│   ├── components/
│   │   ├── AppContent.tsx            # Main responsive layout container & mobile dock
│   │   ├── BottomNavbar.tsx          # Floating bottom navigation bar (fixed z-50)
│   │   ├── CoOpOverlay.tsx           # Real-time Coach Co-op session pill HUD
│   │   ├── CoReformerSyncWatcher.tsx # Headless Firestore watcher for instant co-op timer sync
│   │   ├── DwellButton.tsx           # Hands-free gaze dwell countdown action trigger
│   │   ├── GazeTracker.tsx           # WebCam eye tracking, blink detection & gaze HUD
│   │   ├── HydrationFluidAnimation.tsx # Canvas/SVG realistic fluid depletion visualizer
│   │   ├── BoxBreathingAnimation.tsx # 4-4-4-4 harmonic expanding breath ring
│   │   ├── EyeExerciseGuide.tsx      # 8-step directional vision reset visualizer
│   │   ├── RewardsContent.tsx        # Achievement center, certificate generator & redemption
│   │   ├── ReformersContent.tsx      # Leaderboard, partner profiles & live messaging
│   │   ├── SettingsContent.tsx       # System preferences & profile details
│   │   ├── TimerDisplay.tsx          # Core interactive countdown timer & interval flashes
│   │   ├── voice/
│   │   │   ├── AgentDM.tsx           # Floating glassmorphic voice agent HUD & visualizer
│   │   │   └── VoiceVisualizer.tsx   # Multi-frequency dynamic audio spectrum bars
│   │   └── ui/                       # Radix UI primitives & Tailwind design components
│   ├── config/
│   │   └── voiceCommandDictionary.ts # Canonical deterministic voice dictionary (8 categories)
│   ├── hooks/
│   │   ├── useActiveTimer.tsx        # Global timer state provider & Firestore echo suppressor
│   │   ├── useAgentAudio.ts          # Web Audio synth pipe, FFT analyzer & TTS cache
│   │   ├── useAuth.tsx               # Firebase Auth state & user session persistence
│   │   ├── useBreathingAudio.ts      # Procedural Web Audio box breathing harmonic triad synth
│   │   ├── useCalendarEvents.ts      # Google Calendar integration & event synchronization
│   │   ├── useCoOpSession.tsx        # Real-time coach-led co-op session broadcast provider
│   │   ├── useEyeExerciseAudio.ts    # Procedural stereo-panned chime synth for eye strain
│   │   ├── useFCM.ts                 # Browser push notifications, VAPID tokens & permission
│   │   ├── useFirestore.ts           # Real-time Firestore hooks (tasks, presetTasks, events)
│   │   ├── useHydrationAudio.ts      # Procedural brown-noise fluid flow & bubble synthesizer
│   │   ├── useProfile.tsx            # User profile data, streak tracking, currency preferences
│   │   ├── useRoutineStore.ts        # MOVERS 9.0 routine wrapper & local cache synchronization
│   │   └── useVoiceController.tsx    # SpeechRecognition loop, silence detector & action dispatch
│   ├── lib/
│   │   ├── categorization.ts         # 6 lifestyle category classifier & color mappings
│   │   ├── dailyCoins.ts             # Daily Slake Coin rate limiter & midnight reset event
│   │   ├── firebase.ts               # Client Firebase SDK initialization
│   │   ├── firebaseAdmin.ts          # Server-side Firebase Admin SDK initialization
│   │   ├── jevClient.ts              # JEV TypeSafe SystemOne client & question primitives
│   │   └── utils.ts                  # Classname merging and common UI helpers
│   ├── types/
│   │   ├── index.ts                  # Domain models (Tasks, Profiles, MOVERS, Streaks)
│   │   └── voice.ts                  # Voice agent intents, state machines, and schemas
│   └── utils/
│       └── encryption.ts             # AES-GCM client encryption for active sessions and chats
├── firestore.rules                   # Granular Firestore security rules & collection schemas
├── next.config.ts                    # Next.js 15 compiler, headers, and image domain config
├── package.json                      # Dependency manifests & NPM scripts
├── tailwind.config.ts                # Tailwind design system tokens, keyframes, and plugins
└── tsconfig.json                     # Strict TypeScript compiler configuration
```

### 1.2 Dependency Matrix & Runtime Roles
- **Next.js 15.1.11 & React 19.1.1:** Core server-rendering framework, React Server Components, Turbopack, and edge-ready API route handlers.
- **Firebase SDK 11.10.0 & Firebase Admin 13.8.0:** Firestore NoSQL document store, Client Auth, Cloud Messaging (FCM) v1 for background push nudges.
- **JEV TypeSafe SystemOne:** High-reliability deterministic inference protocol (`api.typesafe.ai/v1/systemone`) using structured `choice`, `score`, and `noul` primitives.
- **Framer Motion 12.34.3:** Physics-based spring animations for the floating HUD, fluid levels, and micro-interactions.
- **Tone.js 15.1.22 & Howler 2.2.4 & Web Audio API:** Multi-channel procedural procedural soundscape generation (binaural beats, brown noise, box breathing triads, stereo-panned vision chimes).
- **Zod 3.25.76:** Strict runtime validation schemas for voice intents, analytics payloads, and server responses.
- **html2canvas 1.4.1:** Client-side 3x high-DPI rendering and PNG export of certified Reformer achievement certificates.

---

## 2. Component Hierarchy & Route Map

### 2.1 Provider Architecture (`src/app/layout.tsx`)
```
RootLayout
└── ThemeProvider (attribute="class", default="system")
    └── AuthProvider (Firebase Auth state machine)
        └── ProfileProvider (UserProfile & Firestore synchronization)
            └── TimerProvider (ActiveTimerState, Firestore cross-device listener)
                └── CoReformerSyncWatcher (Headless real-time co-op session listener)
                    └── CoOpProvider (Coach-led broadcast session controller)
                        └── VoiceProvider (AgentDM state machine & SpeechRecognition)
                            ├── AgentDM (Fixed top-center floating glassmorphic HUD)
                            ├── AppContent (Responsive viewport frame)
                            │   ├── {children} (Page route content)
                            │   └── BottomNavbar (Fixed mobile navigation dock)
                            ├── CoOpOverlay (Real-time partner session status HUD)
                            └── Toaster (Radix UI notification toasts)
```

### 2.2 Route Map & Endpoints
| Route Path | Type | Role | Key Integrations |
| :--- | :--- | :--- | :--- |
| `/` | Client Page | Dynamic task dashboard & quick logger | `useFirestore`, `useProfile`, `useActiveTimer` |
| `/timer` | Client Page | Immersive focus & sensory countdown HUD | `GazeTracker`, `HydrationFluid`, `BreathingAudio` |
| `/analytics` | Client Page | 7-day productivity & behavioral insights | `/api/analytics/insights`, `recharts` |
| `/rewards` | Client Page | Achievement center, coins & UPI payouts | `RewardsContent`, `html2canvas`, Firestore |
| `/reformers` | Client Page | Reformer League, co-op discovery & chat | `ReformersContent`, `useCoOpSession` |
| `/presets` | Client Page | 18-profession MOVERS routine selector | `useRoutineStore`, `presets.json` |
| `/settings` | Client Page | User preferences, sound, TTS voices | `useProfile`, `useFCM` |
| `/api/voice/intent` | Route Handler | Voice normalization, dictionary & JEV fallback | `parseVoiceCommand`, `callTypeSafeSystemOne` |
| `/api/voice/synthesize`| Route Handler | Neural TTS synthesis & LRU caching | Google Cloud TTS Journey / ElevenLabs |
| `/api/analytics/insights`| Route Handler | 7-day behavioral telemetry synthesis | `evaluateProductivityInsightsWithJev` |
| `/api/send-nudge` | Route Handler | Server-side FCM automated habit push | `firebaseAdmin.messaging()` |

---

## 3. Data Schemas & State Topology

### 3.1 Domain Models (`src/types/index.ts`)
- **6 Lifestyle Categories:**
  ```typescript
  export type LifestyleCategory = 
    | 'Productivity'  // (+50 Slake Coins) Deep work, coding, analysis, client sprints
    | 'Hydration'     // (+15 Slake Coins) Water intake, hydration reminders, tea/broth
    | 'Fitness'       // (+40 Slake Coins) Gym, cardio, mobility, HIIT, walks
    | 'Meditation'    // (+30 Slake Coins) Mindfulness, breathwork, sleep, reflections
    | 'Hygiene'       // (+15 Slake Coins) Desk organization, setting bed, grooming, meals
    | 'Creativity';   // (+30 Slake Coins) Ideation, writing, sketch, design, audio production
  ```

- **Task & Preset Schemas:**
  ```typescript
  export interface Task {
    id: string;
    userId: string;
    name: string;
    category?: LifestyleCategory;
    subCategory?: string;
    durationMinutes: number;
    completed: boolean;
    createdAt?: string;
    completedAt?: string;
    slakeCoinsAwarded?: number;
    orderIndex?: number;
  }
  
  export interface UserPresetTask {
    id: string;
    name: string;
    duration: number; // minutes
    category: LifestyleCategory;
    orderIndex: number;
    moversPillar?: 'M' | 'O' | 'V' | 'E' | 'R' | 'S';
    isDefaultTemplate?: boolean;
  }
  ```

### 3.2 Firestore Collections & Security Contracts
- `users/{userId}`: Root user record containing `slakeCoins`, `slakeCredits`, `streak`, `pinnedCertificateIds`, `fcmTokens`.
- `users/{userId}/tasks/{taskId}`: Individual user task completion records.
- `users/{userId}/userPresetTasks/{presetId}`: Personalized routine tasks customized from the 18 professions.
- `active_sessions/{userId}`: Single-user active timer state (with AES-GCM encrypted `currentTaskId`) enabling zero-drift cross-device sync.
- `coop_sessions/{sessionId}`: Coach-led multi-user broadcast timer state controlling all connected participants.
- `redemption_requests/{requestId}`: Payout tickets containing `userId`, `upiId`, `creditsRedeemed`, `amountInInr`, and status (`pending` | `approved` | `rejected`).
- `admin_notifications/{notificationId}`: Real-time alerts dispatched to administrators upon UPI cash-out requests.

---

## 4. Current JEV TypeSafe Implementation & Data Flows

### 4.1 JEV SystemOne Protocol (`src/lib/jevClient.ts`)
- **Base Endpoint:** `https://api.typesafe.ai/v1/systemone` (or `process.env.JEV_API_BASE_URL`)
- **Model:** `jev-latest`
- **Request Envelope:**
  ```typescript
  export interface TypeSafeSystemOneRequest {
    model: string;
    data: Record<string, unknown>;
    questions: Record<string, TypeSafeQuestion>;
  }
  ```
- **Question Types:**
  - `choice`: Multiple-choice selection with criterion descriptions for each option.
  - `score`: Continuous numerical evaluation bounded by min/max and rubrics.
  - `noul`: Binary true/false certainty evaluation with confidence criteria.

### 4.2 Route Handlers & Integration Endpoints
1. **`/api/analytics/insights`:**
   - Evaluates a 7-day completion matrix across all 6 lifestyle pillars.
   - Computes: `productivityScore` (0-100), `moversAdherence`, `peakFocusHour`, `tacticalRecommendations` (3 actionable schedule adjustments), and pillar health status (`optimal` | `balanced` | `needs_attention`).
2. **`/api/analytics/routine-evaluation`:**
   - Evaluates routine balance across the 18 professions.
   - Computes: `balanceScore` (0-100), `primaryGap` (e.g., lack of hydration or physical rest), and `isSustainable`.
3. **`/api/analytics/reformer-evaluation`:**
   - Evaluates compatibility between co-reformers based on streak resilience and active schedules.
   - Computes: `readinessTier` (`A` | `B` | `C`), `synergyScore`, and `streakResilience`.

---

## 5. UI Control, Sensors, MOVERS & Voice Intent Pipeline

### 5.1 Voice Engine & Agent DM
```
Microphone Input
    └── SpeechRecognition (1200ms silence auto-finalize)
        └── POST /api/voice/intent
            ├── Step 1: normalizeSpeech(transcript)
            ├── Step 2: parseVoiceCommand(normalized) (Exact regex/dictionary matches)
            └── Step 3: if confidence < 0.85 -> callTypeSafeSystemOne (JEV SystemOne fallback)
                └── useVoiceController.executeIntent()
                    ├── Dispatch to UI State (TimerContext, useTasks, GazeTracker)
                    └── useAgentAudio.speakFeedback()
                        └── POST /api/voice/synthesize (Google Cloud Journey-F / ElevenLabs)
                            └── Web Audio AudioContext + AnalyserNode -> Equalizer visualizer
```

### 5.2 Multimodal Sensors & Procedural Audio
- **Gaze Tracking (`GazeTracker.tsx` & `gaze-worker.js`):**
  - WebCam video downscaled to `128x128` and transferred with 0-copy `ArrayBuffer` to an off-thread Web Worker.
  - Normalized eye-to-nose vector calculations recognize head tilts to trigger `Pause`, `Stop`, or `Skip`.
  - Blink ratio detection (< 82% of 30-frame moving average) acts as hands-free click trigger.
- **Gaze Dwell Countdown (`DwellButton.tsx`):**
  - 1500ms `requestAnimationFrame` SVG radial sweep executes actions automatically upon sustained fixation.
  - Haptic feedback pulse (`navigator.vibrate([50])`) provides tactile confirmation on dwell completion.
- **Procedural Synthesizers:**
  - `HydrationSynth`: Dual bandpass-filtered brown noise (550Hz & 1100Hz) modulated by a 0.4Hz LFO with random sine bubble plinks.
  - `BreathingSynth`: 4-4-4-4 box breathing synthesizer fading between an A3 (220Hz) - A4 (440Hz) sweep and a major triad chord (A4 + C#5 + E5).
  - `EyeExerciseSynth`: 8-phase stereo-panned bell chimes mapped to directional screen gaze points with a 146.83Hz D3 triangle drone.

---

## 6. Performance Bottlenecks & Algorithmic Friction Points

### 6.1 Architectural Bottlenecks Discovered
1. **Unreachable JEV Voice Fallback (`/api/voice/intent/route.ts`):**
   - In the prior implementation, `parseVoiceCommand` returned hardcoded `confidence: 0.98` for all regex matches and `0.95` for default fallback matching. The conditional check `if (localResult.confidence < 0.90)` was completely unreachable dead code, preventing JEV SystemOne from ever resolving ambiguous or conversational queries.
2. **Orphaned Custom Events & Disconnected State Mutators (`useVoiceController.tsx`):**
   - `SENSOR_ENVIRONMENT_TOGGLE` dispatched a custom window event `'slake-sensor-toggle'`, but neither `GazeTracker.tsx` nor the procedural audio hooks subscribed to it.
   - `TIMER_SET_INTERVAL` merely showed a toast without updating the active countdown interval or triggering edge flashes.
   - `ROUTINE_COMPLETE_TASK` did not invoke `toggleTaskCompletion` on the active task.
3. **Static Telemetry Discard in Insights (`/api/analytics/insights/route.ts`):**
   - The handler built a 25-line rich contextual telemetry prompt, but discarded it in favor of static multiple-choice questions (`A`, `B`, `C`, `D`) which mapped back to hardcoded strings.
4. **Fragmented AI Stack & Static Heuristics:**
   - `organize-routine.ts` still imported legacy `@genkit-ai/googleai`, creating unnecessary package bloat.
   - `generate-motivational-message.ts` used static keyword regexes and an artificial `setTimeout(..., 800)` delay instead of live JEV inference.
5. **Coin Ledger Inconsistency & Unbounded Firestore Queries:**
   - Client-side code in `RewardsContent.tsx` was recalculating and overwriting user coin balances on mount.
   - The Reformer leaderboard was performing an unbounded full-collection snapshot (`collection(db, "users")`), creating an O(N) performance bottleneck as the user base expands.

---

## 7. Opportunity Vector for JEV Algorithm Expansion

1. **Autonomous Hybrid Intent Resolution:**
   - Multi-tier confidence scoring routes deterministic commands instantly through the master dictionary (0ms latency), while ambiguous or natural-language phrases route seamlessly to JEV SystemOne with full session context.
2. **Direct Closed-Loop UI Orchestration:**
   - JEV SystemOne intents bind directly to runtime hooks (`TimerContext.setFocusInterval`, `GazeTracker.toggle`, `useTasks.toggleTaskCompletion`, and audio muting).
3. **Continuous Circadian Telemetry Synthesis:**
   - 7-day completion matrices across all 6 lifestyle pillars feed into JEV SystemOne to dynamically output personalized productivity scores, circadian drop-off insights, and 3 high-leverage schedule optimizations.
4. **Unified TypeSafe Ecosystem:**
   - Full elimination of legacy Genkit and Google AI dependencies, centralizing 100% of machine intelligence onto JEV TypeSafe SystemOne.
