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

## ⚡ What's New: The Neural Architecture Overhaul

### 💎 1. Client-Side WebGPU Semantic Gating (`EmbeddingGemma-300M`)
Zero hallucination. Zero server overhead. Zero API keys.
* **In-Browser Transformer Execution:** Powered by `@huggingface/transformers`, running `google/embeddinggemma-300m` (quantized `q8`) directly inside the browser using **WebGPU hardware acceleration** (with seamless WASM fallback to `all-MiniLM-L6-v2` for older devices).
* **IndexedDB Weight Caching:** Model weights download once and cache locally, enabling instant, fully offline semantic inference.
* **7-Domain Vector Gate:** Every voice utterance is mean-pooled and checked against high-dimensional anchor clusters (`TIMER`, `NAVIGATION`, `ROUTINE`, `COOP`, `SENSORS`, `REWARDS`, `SYSTEM`).
* **Strict Out-of-Domain Rejection:** Commands below a cosine similarity threshold of `0.68` are rejected client-side before any network request or LLM is touched, eliminating runaway timer creation from random chat.

### 🛡️ 2. JEV TypeSafe SystemOne Decision Engine
* **Deterministic Structured AI:** Powered by JEV SystemOne (`https://api.typesafe.ai/v1/systemone`) using strict `choice`, `score`, and `noul` primitives.
* **Routine Optimization & Motivation:** Autonomous task scheduling and personalized encouragement executed with strict 20-second timeout guarantees and zero runtime schema drift.
* **Zero Legacy Bloat:** Purged heavy legacy cloud frameworks in favor of a lean, reliable HTTP client contract with robust offline fallbacks.

### 🎙️ 3. 3-Tier Zero-Latency Voice Intent Pipeline
DeadlinesMet processes voice commands in sub-millisecond tiers:
1. **Tier 1 (Instant Client Interceptor):** Microsecond regex parser handles instant navigation (`go home`, `open routine`), timer controls (`pause`, `resume`, `finish`), sensor toggles (`toggle eye tracking`), and live weather queries (`what's the weather`) by extracting cached DOM metrics with zero network latency.
2. **Tier 2 (WebGPU Semantic Gate):** Pre-evaluates intent relevance in client VRAM before routing to external models.
3. **Tier 3 (JEV SystemOne Resolution):** Resolves ambiguous complex natural language instructions into precise actionable payloads.

### 🎧 4. Agent DM Floating Neural HUD & Multimodal Bio-Sensors
* **16-Bin Real-Time FFT Visualizer:** Agent DM features a floating responsive HUD with a Web Audio equalizer that bounces dynamically to speech synthesis frequencies.
* **Natural Studio Neural TTS:** Ultra-clear synthesized speech feedback with smart pitch modulation, haptic state transitions, and automatic fallback to native Web Speech synthesis.
* **Multimodal Gaze Tracking (Web Worker):** Hands-free gaze detection running in a dedicated background worker with Kalman filtering. Automatically triggers focus pauses when you look away from the workspace.
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
