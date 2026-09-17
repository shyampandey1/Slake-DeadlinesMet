# DeadlinesMet (Slake)

![DeadlinesMet Banner](https://placehold.co/1200x400/1a1a1a/f5c542?text=DeadlinesMet+%7C+Discipline+as+a+Service)

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-11.1-FFCA28?style=for-the-badge&logo=firebase)](https://firebase.google.com/)
[![Genkit](https://img.shields.io/badge/Genkit-AI-blue?style=for-the-badge&logo=google-cloud)](https://firebase.google.com/docs/genkit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

**Your personal space to conquer tasks and achieve goals. Focus on one task at a time. Set your goal and go.**

</div>

---

## 🚀 The Vision: Discipline as a Service

DeadlinesMet (Slake) is not just a timer; it's a comprehensive discipline ecosystem designed to enhance focus, combat procrastination, and reward consistency. By integrating cutting-edge AI, gamification, and proven productivity protocols, we help you transform your daily routine into a high-performance engine.

---

## ✨ Major Features

### 🧠 AI Routine Intelligence (Powered by Firebase Genkit)
*   **Smart Categorization:** Automatically tags and organizes your tasks using advanced LLM-based understanding.
*   **Personalized Routine Generation:** AI-crafted schedules tailored specifically to your profession and energy patterns.
*   **Motivational Coaching:** Real-time, context-aware encouragement to keep you in the flow state.
*   **Music Vibe Integration:** AI suggests focus soundscapes based on the intensity and nature of your current task.
*   **Voice-to-Task:** Seamless voice input processing for hands-free productivity.

### 🏆 The Reformers League (Gamification)
*   **DM Coins:** Earn currency for every focused session completed and streak maintained.
*   **Achievement Center:** Track your progress and unlock exclusive rewards with your earned credits.
*   **Social Nudges:** Send motivational "nudges" to friends to keep the collective momentum going.
*   **Co-Op Sessions:** Sync your focus with others in real-time collaborative work blocks.

### 📅 MOVERS Protocol & 20+ Specialized Templates
*   **The MOVERS Protocol:** A dedicated system for **M**editation, **O**xygenation, **V**isualization, **E**xercise, **R**eading, and **S**cribing.
*   **Energy Synchronization:** Choose between "The Morning Primer" or "The Evening Restorer" templates to align with your circadian rhythm.
*   **Profession-Specific Routines:** Specialized templates for Software Engineers, Creatives, Doctors, Entrepreneurs, Students, and more.
*   **Routine Enrichment:** Automatic injection of critical health breaks, including hydration reminders and eye-strain exercises.

### 🛡️ Zero-Knowledge Data Privacy & End-to-End Encryption (E2EE)
*   **Client-Side AES-GCM 256-Bit Encryption:** All personal task names, calendar events, active focus sessions, and direct messages are encrypted directly on the client using the browser's native Web Crypto API before being transmitted to the cloud.
*   **Complete Admin Inaccessibility:** Cloud Firestore only ever stores encrypted ciphertexts (`enc:v1:...`). Even Firebase Console viewers, project owners, and database administrators cannot read what users are working on, scheduling, or discussing.
*   **Pairwise Encrypted Messaging:** Direct messages between Reformers League members are encrypted using derived shared conversation secrets, ensuring only the two participants in a chat can read the messages.
*   **Strict Security Rules:** Granular Firestore security rules restrict all private subcollections (`/tasks`, `/userEvents`, `/userPresetTasks`) strictly to the authenticated document owner.

### 🔔 Multi-Tier Task Notification Engine
*   **Guaranteed Notification Delivery:** Tri-layer notification architecture designed to work reliably across all modern browsers and operating systems (Chrome, Safari, Firefox, Edge, iOS, Android).
*   **In-App Precision Scheduler:** Real-time client scheduler that tracks today's upcoming calendar events with a periodic 30-second sweep to fire alerts right when tasks begin.
*   **Service Worker Background Timers:** Active focus sessions communicate directly with `sw.js` to trigger "Session Complete!" notifications accurately, even when tabs are throttled, backgrounded, or minimized.
*   **Hourly Server-Side Cloud Push:** Automated hourly cron triggers via GitHub Actions and Vercel Cron query upcoming deadlines and dispatch FCM multicast notifications directly to user devices.

### 🎧 Immersive Experience
*   **Focus Soundscapes:** High-fidelity ambient audio (White Noise, Nature, Deep Space) powered by **Tone.js** and **Howler.js**.
*   **Dynamic UI:** A fluid, premium interface built with **Framer Motion** and **Shadcn UI**.
*   **Visual Analytics:** Deep insights into your productivity patterns via interactive charts and heatmaps.

---

## 🛠️ Tech Stack

### **Frontend & Framework**
*   **Framework:** [Next.js 15 (App Router)](https://nextjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Animations:** [Framer Motion](https://www.framer.com/motion/)
*   **UI Components:** [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
*   **Icons:** [Lucide React](https://lucide.dev/)

### **Artificial Intelligence**
*   **AI Engine:** [Firebase Genkit](https://firebase.google.com/docs/genkit)
*   **LLM Models:** Google Gemini (via Google AI SDK)

### **Backend & Infrastructure**
*   **Database:** [Cloud Firestore](https://firebase.google.com/docs/firestore)
*   **Authentication:** [Firebase Auth](https://firebase.google.com/docs/auth)
*   **Hosting:** [Firebase Hosting / Google Cloud Run](https://firebase.google.com/docs/hosting)
*   **Notifications:** [Firebase Cloud Messaging (FCM)](https://firebase.google.com/docs/cloud-messaging)

### **Multimedia & Utilities**
*   **Audio Engine:** [Tone.js](https://tonejs.github.io/) & [Howler.js](https://howlerjs.com/)
*   **Charts:** [Recharts](https://recharts.org/)
*   **Form Management:** React Hook Form & Zod

---

## 🔑 Environment Variables

To run this project, add the following to your `.env.local`:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."

# Google AI (Genkit)
GOOGLE_GENAI_API_KEY="YOUR_GEMINI_API_KEY"

# OpenWeather API (Optional for Weather features)
NEXT_PUBLIC_OPENWEATHER_API_KEY="YOUR_KEY"
```

---

## ☁️ Deployment

This application is optimized for **Firebase App Hosting** and **Google Cloud Run**. 

1.  Connect your repository to Firebase.
2.  The `start` script automatically handles the `PORT` environment variable for Cloud Run.
3.  Ensure all environment variables are added to the Google Cloud Secret Manager.

---

## 🤝 Contributing

We welcome contributions! Please see our `docs/CONTRIBUTING.md` (if available) or simply open a PR for any features/bug fixes.

---

<div align="center">
Built with ❤️ for the seekers of discipline.
</div>
