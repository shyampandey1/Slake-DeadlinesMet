# DeadlinesMet (Slake) — Reformers Ecosystem

![DeadlinesMet Banner](https://placehold.co/1200x400/1a1a1a/f5c542?text=DeadlinesMet+%7C+Discipline+as+a+Service)

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![WebGPU](https://img.shields.io/badge/WebGPU-Accelerated-green?style=for-the-badge&logo=webgpu)](https://www.w3.org/TR/webgpu/)
[![EmbeddingGemma](https://img.shields.io/badge/EmbeddingGemma-300M_Local-blueviolet?style=for-the-badge&logo=huggingface)](https://huggingface.co/google/embeddinggemma-300m)
[![JEV TypeSafe AI](https://img.shields.io/badge/JEV_SystemOne-TypeSafe_AI-f5c542?style=for-the-badge)](https://typesafe.ai/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)

**The Zero-Cost, Edge-Intelligent Discipline Ecosystem. Focus on one task at a time with client-side neural gating, multimodal bio-tracking, and zero server latency.**

</div>

---

## 🚀 The Vision: Discipline as a Service

DeadlinesMet (Slake) is a next-generation focus and discipline operating system designed to eliminate friction, halt procrastination, and reward daily consistency. 

By unifying **Client-Side WebGPU Neural Execution**, deterministic **JEV TypeSafe AI** decision engines, **Agent DM Neural Assistant**, and **Zero-Knowledge End-to-End Encryption**, DeadlinesMet runs with near-zero latency, absolute user privacy, and zero recurring inference costs.

---

## ⚡ What's New: The Dual-Engine WebGPU & JEV TypeSafe Expansion (v2.5)

### 💎 1. Zero-Latency Task Auto-Categorization & Anti-Spam Coin Shield
* **Live Keystroke Categorization (15ms Debounce):** Real-time client-side embedding via `google/embeddinggemma-300m` against canonical anchors for the 6 Lifestyle Categories (`Productivity`, `Hydration`, `Fitness`, `Meditation`, `Hygiene`, `Creativity`). Automatically highlights matching category badges and suggests optimal default durations.
* **Semantic Routine De-Duplication:** Evaluates new tasks against active routine tasks. Tasks with cosine similarity $\ge 0.88$ display an inline warning with 1-click merge and duration boost.
* **Anti-Spam / Gibberish Coin Shield:** Commands or keyboard mash below $0.45$ similarity against canonical pillars are marked as unverified (`isVerifiedForCoins: false`), preventing spam reward farming while keeping timers operational.

### 🤝 2. Smart Vector Co-Reformer Matchmaking & Synergy Engine
* **User Lifestyle Vector Generation:** Concatenates user profession (`ProfileType`), active MOVERS routine (`morning_primer` vs `evening_restorer`), top 3 productive hours, and routine task titles into an embedding stored at `users/{userId}.lifestyleVector`.
* **Client-Side Vector Ranking:** Ranks active online Reformers in client VRAM by cosine similarity to surface the top 5 compatible partners.
* **JEV Synergy Evaluation (`/api/reformers/synergy`):** Deterministic evaluation via JEV TypeSafe SystemOne using `score` (`synergyScore`: 0–100) and `noul` primitives (`sharedStrength`, `recommendedSprintTopic`, `recommendedDurationMinutes`) with 1-click Co-Op session initiation.

### 👁️ 3. Closed-Loop Sensor & Gaze Telemetry for Adaptive Pacing
* **Rolling Distraction & Fatigue Telemetry:** 2-minute rolling window tracking `blinkRatePerMinute`, `gazeAwayCount`, `manualPauseCount`, and `elapsedMinutes` in `GazeTracker` and `TimerDisplay`.
* **Proactive JEV Interventions (`/api/timer/adaptive-pacing`):** When gaze drops or distraction threshold triggers, JEV TypeSafe returns `choice` (`CONTINUE`, `TRIGGER_EYE_BREAK`, `TRIGGER_BREATHING_RESET`, `SPLIT_TASK`) and `noul` (`agentSpeechPrompt`).
* **Tactile Micro-Resets:** Sprint auto-pauses with Agent DM audio alert, `[100, 50, 100]` haptic pulse, and a 2-minute 20-20-20 Eye Exercise or 4-4-4 Box Breathing micro-timer before resuming automatically.

### 🧠 4. Neural Memory Bank & Semantic RAG Search (`/analytics`)
* **Client-Side IndexedDB Vector Store (`deadlinesmet_vector_logs`):** Embedded completed sprint logs and Scribing (S) journal notes indexed locally with automatic backfill of historical Firestore entries.
* **Instant Sub-20ms Neural Search:** Natural language search bar across the Log Book powered by WebGPU without server latency.
* **JEV Behavioral Correlation Synthesis (`/api/analytics/rag-query`):** Synthesizes top retrieved vectors with JEV `noul` primitives (`directAnswer`, `behavioralCorrelation`, `actionableAdjustment`) with executive insights voiced by Agent DM.

### 🛡️ 5. Automated Anti-Gaming & Trust Audit for UPI Payouts
* **Pre-Redemption Telemetry Interception (`/api/rewards/audit-redemption`):** Analyzes the user's last 30 tasks, verified ratio, engagement percentage, and coin velocity.
* **JEV SystemOne Trust Evaluation:** Strict scoring with `trustScore` (`score`: 0–100), `auditVerdict` (`choice`: `AUTO_APPROVED`, `MANUAL_REVIEW_FLAGGED`, `REJECTED_FARMING`), and `auditReasoning` (`noul`).
* **Restored & Unified Reformer Coin Economy:** Unified `slakeCoins`, `slakeCredits`, `coins`, and `slakeBalance` fields with permanent data-loss protection and historical leaderboard balance restorations.

---

### 🎙️ 6. 3-Tier Zero-Latency Voice Intent Pipeline & Semantic Gating
DeadlinesMet processes voice commands in sub-millisecond tiers:
1. **Tier 1 (Instant Client Interceptor):** Microsecond regex parser handles instant navigation (`go home`, `open routine`), timer controls (`pause`, `resume`, `finish`), sensor toggles (`toggle eye tracking`), and live weather queries (`what's the weather`) by extracting cached DOM metrics with zero network latency.
2. **Tier 2 (WebGPU Semantic Gate):** Pre-evaluates intent relevance in client VRAM via `google/embeddinggemma-300m` before routing to external models. Out-of-domain commands below $0.68$ are safely rejected client-side.
3. **Tier 3 (JEV SystemOne Resolution):** Resolves ambiguous complex natural language instructions into precise actionable payloads.

### 🎧 7. Agent DM Floating Neural HUD & Multimodal Bio-Sensors
* **16-Bin Real-Time FFT Visualizer:** Floating responsive HUD with Web Audio equalizer bouncing to synthesized speech frequencies.
* **Natural Studio Neural TTS:** Synthesized speech feedback with smart pitch modulation, haptic state transitions, and fallback to native Web Speech synthesis.
* **Multimodal Gaze Tracking (Web Worker):** Dedicated background worker with Kalman filtering for hands-free gaze detection.
* **Procedural Soundscapes:** Native Web Audio synthesized water droplet harmonics (`useHydrationAudio`) and tuned 432Hz binaural meditation chimes (`useBreathingAudio`).

---

## ✨ Core Platform Features

### 🏆 The Reformers League (Gamification & Co-Op)
* **DM Coins Economy:** Earn coins for every high-intensity focus sprint completed and milestone hit.
* **Achievement Center:** Unlock focus titles, audio packs, and community prestige.
* **Real-Time Co-Op Focus:** Pair up with a focus partner or coach in synchronized focus sessions with real-time status broadcasting.
* **Social Motivation:** Send instant nudges to keep your study or work circles accountable.

### 📅 MOVERS Protocol & Professional Routine Catalog
* **The MOVERS Protocol:** Structured workflows for **M**editation, **O**xygenation, **V**isualization, **E**xercise, **R**eading, and **S**cribing.
* **Circadian Alignment:** Instant one-click scheduling with **The Morning Primer** and **The Evening Restorer**.
* **20+ Industry Blueprints:** Pre-built, battle-tested routines for Software Engineers, Founders, Content Creators, Medical Professionals, and Students.
* **Bio-Break Injections:** Automated micro-pauses for eye strain relief (20-20-20 rule) and hydration intervals.

### 🔒 Zero-Knowledge End-to-End Encryption (E2EE)
* **Client-Side AES-GCM 256-Bit:** All personal routines, task names, active work blocks, and private league communications are encrypted directly in the browser via the native Web Crypto API.
* **Zero Admin Inaccessibility:** Cloud Firestore only stores ciphertexts (`enc:v1:...`). Even administrators and database owners have zero access to your actual tasks or discussions.
* **Pairwise Secret Derivation:** Direct chats in the Reformers League derive unique shared conversation secrets using ECDH key exchange.

### 🔔 Tri-Layer Resilient Notification Architecture
* **In-App Precision Scheduler:** Real-time client sweeps fire alerts at the exact microsecond tasks begin.
* **Service Worker Background Alarms:** Active focus clocks communicate directly with `sw.js` to ensure alarms fire even if the tab is throttled, asleep, or minimized.
* **Serverless Push Multicast:** Scheduled cloud workers dispatch FCM notifications directly to mobile and desktop devices for upcoming critical deadlines.

---

## 🛠️ Modern Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend Framework** | [Next.js 15 (Turbopack, App Router)](https://nextjs.org/), [React 19](https://react.dev/) |
| **Language & Typing** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling & Animation** | [Tailwind CSS 3.4](https://tailwindcss.com/), [Framer Motion](https://www.framer.com/motion/) |
| **Design System** | [Radix UI](https://www.radix-ui.com/), [Shadcn UI](https://ui.shadcn.com/), [Lucide React](https://lucide.dev/) |
| **Client-Side AI & WebGPU** | [`@huggingface/transformers`](https://github.com/huggingface/transformers.js), `EmbeddingGemma-300M` |
| **Autonomous Decision Engine** | [JEV TypeSafe AI SystemOne](https://typesafe.ai/) (`jev-latest`) |
| **Database & Auth** | [Cloud Firestore](https://firebase.google.com/docs/firestore), [Firebase Auth](https://firebase.google.com/docs/auth) |
| **Push Notifications** | [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging), Service Workers |
| **Audio Synthesis & DSP** | Native Web Audio API (16-bin FFT Analyser, Biquad filters), [Tone.js](https://tonejs.github.io/), [Howler.js](https://howlerjs.com/) |
| **Security & Cryptography** | Native Web Crypto API (AES-GCM 256, PBKDF2, ECDH) |

---

## 🔑 Environment Setup

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# JEV TypeSafe AI Decision Engine
JEV_API_BASE_URL="https://api.typesafe.ai/v1"
JEV_API_KEY="your-typesafe-api-key"

# Live Environmental APIs (Optional)
NEXT_PUBLIC_OPENWEATHER_API_KEY="your-openweather-key"
```

---

## 💻 Development & Production Build

```bash
# Install dependencies
npm install

# Run development server with Turbopack
npm run dev

# Run production build
npm run build

# Start production server
npm start
```

---

## ☁️ Deployment

Optimized for instant edge deployment on **Vercel**, **Firebase App Hosting**, and **Google Cloud Run**:

```bash
# Deploy to Vercel
vercel --prod
```

---

<div align="center">
Built with ⚡ and discipline. The Reformers Ecosystem.
</div>
