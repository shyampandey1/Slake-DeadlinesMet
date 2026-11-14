# Changelog

All notable changes to the DeadlinesMet (Slake) ecosystem will be documented in this file.

## [2.7.3] - 2026-11-14

### Fixed Closed-App Offline Notifications & Cron Delivery
- **Firebase Admin Service Account Auto-Repair (`firebase-admin.ts`):**
  - Resolved `malformed_client_email` error (`fireba***@://gserviceaccount.com`) that disabled server-side OAuth2 token minting and caused all background notification endpoints (`/api/cron/notifications`, `/api/send-nudge`, `/api/timer/schedule-notification`) to return HTTP 500.
  - Implemented `repairServiceAccountEmail` with dual-tier self-healing:
    1. Canonical extraction directly from Google Cloud's `client_x509_cert_url` (which holds the exact URL-encoded authentic client email).
    2. Intelligent syntax reconstruction when protocol artifacts (`://`, `http:`, `https:`) or truncated domains are present in environment variables.
  - Live production health check (`/api/notifications/health`) confirmed restored: `readyForClosedAppPush: true`, `diagnosisCode: ok`, and `userMessage: "Background alerts are active."`.
- **Periodic Notification Cron Health & GitHub Actions Pipeline (`hourly-notifications.yml`):**
  - Enhanced GitHub Actions periodic cron workflow (`.github/workflows/hourly-notifications.yml`) with verbose status code reporting, human-actionable error messages, and response body logging.
  - Resolved recurring cron failure emails caused by HTTP 500 responses from `/api/cron/notifications`.
- **Cross-Platform Environment Fixes (`package.json`, `TimerDisplay.tsx`):**
  - Made postinstall cache-clearing script cross-platform using native Node `fs.rmSync` instead of Unix-only `rm -rf`.
  - Fixed CoOp session status typing (`"PAUSED"` literal) and non-null narrowing in `TimerDisplay.tsx`.

## [2.7.2] - 2026-11-07

### Technical Debt, Performance & Bundle Sweep
- **Dynamic CJS `require()` Removal (`reformers/page.tsx`):**
  - Replaced inline `require("firebase/firestore")` inside the follower count listener hook with top-level static ES6 imports, eliminating redundant module evaluation and improving Turbopack bundler optimization.
- **Production Console Log Sanitization (`reformers/page.tsx`, `ServiceWorkerRegistrar.tsx`, `useAuth.tsx`, `useFCM.ts`, `useProfile.tsx`, `fcm.ts`, `jevClient.ts`):**
  - Cleaned up unminified `console.log` statements across auth, service worker, profile synchronization, JEV LLM metrics, and notification registration.
- **Client-Side ML Runtime Code-Splitting (`clientEmbedder.ts`):**
  - Converted static `@huggingface/transformers` import into a dynamic lazy `await import('@huggingface/transformers')` within `getExtractor()`, reducing critical initial bundle size by preventing premature loading of WebAssembly/ONNX models.
- **Unused Dependency Pruning (`package.json`):**
  - Removed unused `tone` dependency (audio synthesized via native Web Audio API oscillators and Howler.js).

### UX & Accessibility Fixes
- **Radix ScrollArea Viewport Block Wrapper (`scroll-area.tsx`):**
  - Added `[&>div]:!block` to `ScrollAreaPrimitive.Viewport` to eliminate Radix's default `display: table !important; min-width: 100%` wrapper behavior.
  - Resolved issue where table expansion allowed flex child text to exceed parent bounds and push the Play button halfway off the right card boundary.
- **Adaptive Multi-Line Task Title Wrapping (`TaskForm.tsx`, `routine/page.tsx`):**
  - Replaced rigid single-line `truncate` and fixed `h-11` with adaptive `min-h-[44px] h-auto py-2 px-3 sm:px-3.5` and `line-clamp-2 break-words leading-tight sm:leading-snug`.
  - Ensures multi-word task titles (e.g. "Evening Return Transit & Cognitive Decompression", "Hydration Check-in #6 (Post-Commute Refuel)") remain completely readable and visible on mobile screens.
- **Play Button Visibility, Sizing & Alignment (`TaskForm.tsx`):**
  - Guaranteed play button stays 100% visible inside the card container with `shrink-0 min-w-[40px] sm:min-w-[44px]`.
  - Added optical center nudge `ml-0.5` on the `<Play />` icon for visual balance.
  - Added explicit accessibility labels (`title` and `aria-label`) on both the task select button and the play trigger button.
- **Modern Lucide Icons for MOVERS Template Switcher (`routine/page.tsx`, `RoutineTunerModal.tsx`):**
  - Replaced legacy `🌅` and `🌙` emojis with clean, themed Lucide `Sun` and `Moon` icons across the MOVERS template selectors and routine tuner blocks for consistent design language.
- **Session Completion Modal Theme Styling (`TimerDisplay.tsx`):**
  - Replaced discordant generic red and green buttons with theme-aligned controls in the "Session Over!" dialog: styled "No" with clean outline `rounded-2xl` and "Yes!" with primary amber/gold `bg-primary hover:bg-primary/90 rounded-2xl shadow-md`.
- **Restored Immersive Header Stacking on Mobile (`DynamicHeader.tsx`, `app/page.tsx`):**
  - Restored header height (`h-[22rem] sm:h-[24rem] md:h-[26rem] lg:h-[30rem]`) and responsive negative overlap margins (`-mt-24 sm:-mt-28 md:-mt-32 lg:-mt-40`) on mobile.
  - Ensures the "Quick Start Tasks" card and title stack directly on top of the dynamic sky/header background identically to the intended desktop view.
- **Card Height & Vertical Clearance Optimization (`TaskForm.tsx`):**
  - Increased preset card height from `h-[280px]` to `h-[310px] sm:h-[320px]` (and matched skeleton).
  - Eliminates vertical clipping on the 3rd task item and provides comfortable breathing room above the "+ Add Task" button.

## [2.7.1] - 2026-11-06

### Fixed & Enhanced Agent DM Voice Engine
- **Microphone Hardware Contention Elimination (`useAgentAudio.ts`):**
  - Removed secondary `navigator.mediaDevices.getUserMedia` calls from `startMicVisualizer` that were contending with `webkitSpeechRecognition` and locking the microphone on Chromium and Android devices.
  - Implemented organic acoustic wave generation for the 16-bar HUD visualizer while listening, reserving hardware FFT audio contexts exclusively for TTS voice playback.
- **Robust Speech Recognition on Mobile & Desktop (`useVoiceController.tsx`):**
  - Configured `recognition.continuous = false` to resolve Android Chrome speech recognition aborts, freezes, and silent audio drops.
  - Added instant dispatch on `isFinal` speech recognition results for near-instant zero-latency command execution.
- **Intelligent Local Fuzzy Candidate Task Launcher (Tier 1C & Tier 1D in `useVoiceController.tsx`):**
  - Added local candidate task matching (`scoreTaskMatch`) across the user's active routine tasks and presets (e.g., "Evening Return Transit", "Night Owl Focus", "Meditation", "Drink Water").
  - Added dynamic task launcher fallback supporting any spoken task and duration (e.g., "start math revision for 30 minutes") without falling through to out-of-domain rejections.
- **Expanded Natural Speech Navigation & Direct Logbook Route (`voiceCommandDictionary.ts`, `useVoiceController.tsx`):**
  - Updated regex to match single-word and flexible voice commands: `"logbook"`, `"open logbook"`, `"task log"`, `"task logbook"`, `"routine"`, `"home"`, `"reformers"`, `"rewards"`, `"settings"`.
  - Mapped logbook commands directly to `/logbook` (previously routed to `/analytics`).
  - Automatically dismisses Agent DM HUD modal upon successful navigation commands.
- **Theme Consistency & Ping Removal (`AgentDM.tsx`, `VoiceInput.tsx`):**
  - Harmonized Agent DM pill, visualizer bars, modal dialog, and status indicators with the app's gold/amber/slate design language (replaced all rogue `emerald-*` styles).
  - Eliminated distracting idle `animate-ping` pulses from both `AgentDM.tsx` and `VoiceInput.tsx`.

## [2.7.0] - 2026-11-06

### UX & Interface Overhaul
- **Single-Line Task Cards & Modern Rounded Aesthetics (`TaskForm.tsx`, `routine/page.tsx`):**
  - Redesigned task cards so that every task title, category header, and duration badge appears strictly on **one clean line** with `truncate min-w-0` and `whitespace-nowrap shrink-0`.
  - Replaced boxy rectangular buttons with modern `rounded-2xl` contour borders for task buttons, play trigger actions, and add-task controls.
  - Resolved ugly 2-line duration wrapping (`3h\n9m`) in the current task section header with `whitespace-nowrap shrink-0` and `rounded-full` badge styling.
- **Header Height & Spatial Proportions (`DynamicHeader.tsx`, `app/page.tsx`):**
  - Reduced oversized top header height (`17rem` down from `22rem`) and scaled down internal gaps/padding to eliminate excessive empty space and bring task cards into comfortable reach on mobile screens.
- **Theme-Aligned Voice Input (`VoiceInput.tsx`):**
  - Styled floating Agent DM microphone button to match app theme colors (primary amber/gold) rather than discordant green.
  - Removed continuous idle `animate-ping` effect to eliminate visual distraction while keeping active listening states responsive.
- **Dark Mode by Default (`app/layout.tsx`):**
  - Configured `defaultTheme="dark"` with `enableSystem={false}` in `ThemeProvider`, ensuring first-time visitors receive the polished dark mode experience out of the box.
- **Reworked Task Names & Routine Version Bump (`route.ts`, `routines.ts`):**
  - Replaced verbose multi-phrase titles across all 8 circadian routine sections and 24 preset profiles with concise, elegant 1–3 word names (e.g., `Evening Commute`, `Make Bed`, `Morning Hydration`, `Deep Coding`, `Rest Break`, `Dinner`).
  - Bumped `ROUTINE_TEMPLATE_VERSION` to `11.0` for automatic client-side synchronization and cache refreshes.


## [2.6.0] - 2026-11-03

### Fixed
- **Microphone Audio Loopback & Feedback Rupture in Agent DM (`useAgentAudio.ts`, `useVoiceController.tsx`, `AgentDM.tsx`):**
  - Eliminated live mic loopback by splitting the Web Audio pipeline into a strict **Dual-Analyser Architecture**:
    1. `ttsAnalyser`: Dedicated speech output analyser connected `ttsMediaElementSource -> ttsAnalyser -> AudioContext.destination` (Agent DM voice output audible to user).
    2. `micAnalyser`: Dedicated microphone input visualizer connected `micStreamSource -> micAnalyser` and strictly **isolated from `audioContext.destination`**, preventing user mic audio from being broadcasted out of device speakers.
  - Implemented dynamic FFT source routing in the visualizer loop: samples `ttsAnalyser` when the agent is speaking and `micAnalyser` when the user is speaking.
  - Configured hardware/OS acoustic echo cancellation, noise suppression, and auto gain control: `{ echoCancellation: true, noiseSuppression: true, autoGainControl: true }`.
  - Enforced clean teardown: all active microphone tracks (`stream.getTracks().forEach(t => t.stop())`) and source nodes are immediately disconnected when transitioning out of `LISTENING`.
  - Guaranteed `stopAudio()` cancellation of any pending speech synthesis or TTS audio element upon starting listening to prevent voice collisions.

### Added
- **Tier 1 Instant Zero-Latency Voice Interceptors (`src/lib/voiceInterceptors.ts`):**
  - **Remaining Timer Check:** `/how much time is left|time remaining|check clock|minutes left/i` -> Instant live readout of active timer status without server roundtrips.
  - **Next Scheduled Task Query:** `/what is my next task|what's next|upcoming task|next on schedule/i` -> Speaks the next pending routine item and duration.
  - **Daily Progress & Streak Readout:** `/how many tasks completed|my progress today|what is my streak|current streak/i` -> Spoken report of tasks completed and streak count.
  - **Slake Coin Balance Check:** `/how many coins|my coin balance|slake coins today/i` -> Speaks the user's cached coin balance.
  - Preserved fast-path header weather, current local time, and Agent DM identity readouts.

- **Expanded Voice Recognition Taxonomy (60+ New Intents across Categories A–F):**
  - **Category A: Pomodoro & Custom Flow Sprints:**
    - `start pomodoro` / `25 minute pomodoro` (25m, 50 SC)
    - `start 50 10 sprint` / `50 minute flow block` (50m, 50 SC)
    - `take a 5 minute break` / `short break` (5m, 15 SC)
    - `take a 15 minute break` / `long break` (15m, 15 SC)
    - `double the time` / `double timer` (`TIMER_MULTIPLY`, 2x factor)
    - `add 2 minutes` / `two more minutes` (`TIMER_EXTEND`, +2m)
    - `add 30 minutes` / `half hour more` (`TIMER_EXTEND`, +30m)
  - **Category B: Study, Coding, Research & Exam Prep:**
    - `start coding session` / `debug code 45 minutes` (45m, 50 SC)
    - `start research block` / `deep research 30 minutes` (30m, 50 SC)
    - `start exam prep` / `revision session 40 minutes` (40m, 50 SC)
    - `brainstorming session` / `ideation 15 minutes` (15m, 30 SC)
  - **Category C: Physical Wellness, Posture & Micro-Resets:**
    - `posture check` / `fix my posture` (`TASK_LOG_QUICK`, 15 SC)
    - `standing desk mode` / `stand up and work` (`TASK_LOG_QUICK`, 15 SC)
    - `power nap 20 minutes` / `start 20 minute nap` (20m, 30 SC)
    - `neck and shoulder stretch` / `5 minute desk stretch` (5m, 40 SC)
    - `evening walk 20 minutes` / `go for a walk` (20m, 40 SC)
    - `logged healthy meal` / `ate clean lunch` (`TASK_LOG_QUICK`, 15 SC)
  - **Category D: Interactive Routine Tuner & `.dm` Container Controls:**
    - `tune my routine` / `open routine tuner` (`OPEN_TUNER_WIZARD`)
    - `export my routine` / `download dm file` (`EXPORT_DM_FILE`)
    - `import routine file` / `load dm file` (`IMPORT_DM_FILE`)
    - `share my routine` / `publish routine to reformers` (`SHARE_ROUTINE_COMMUNITY`)
    - `switch to smart weave` / `enable jev smart weave` (`WRAPPER_SMART_WEAVE`)
  - **Category E: Co-Op Matchmaking & Partner Sync:**
    - `find focus partner` / `match me with a reformer` (`FIND_MATCH`)
    - `sync routine with partner` / `clone partner routine` (`SYNC_PARTNER_ROUTINE`)
    - `mute co op alerts` / `silence group` (`MUTE_COOP`)
  - **Category F: Hands-Free UI Controls & Analytics:**
    - `enter fullscreen` / `go fullscreen` (`FULLSCREEN_ENTER`)
    - `exit fullscreen` / `leave fullscreen` (`FULLSCREEN_EXIT`)
    - `zen mode` / `toggle zen mode` (`TOGGLE_ZEN_MODE`)
    - `read my insights summary` / `how did i do this week` (`SPEAK_INSIGHTS_SUMMARY`)

- **Domain Anchor Phrases & WebGPU Embedding Indexing (`semanticGate.ts`):**
  - Added anchor phrases across `TIMER`, `ROUTINE`, `COOP`, `NAVIGATION`, and `ANALYTICS` domains for `google/embeddinggemma-300m` local WebGPU semantic gating.
  - Ensured all spoken feedback phrases are concise and under 6 words for natural interaction.
