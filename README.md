# DeadlinesMet

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A smart, AI-powered productivity application to automate your focus and achieve your goals with unparalleled efficiency.

DeadlinesMet transforms your daily routine from a list of chores into a seamless, automated workflow. Harnessing the power of AI, this app acts as your personal co-pilot, intelligently organizing your day, motivating you, and providing the tools you need to stay on track. Whether you're a creative professional, a busy student, or a technical expert, DeadlinesMet adapts to your unique workflow.



## ✨ Key Features

### 🤖 AI & Automation
* **AI-Powered Routines:** Select your profession and instantly get a research-backed, structured daily routine tailored to your workflow.
* **AI Task Suggestions:** Simply type a task, and let our AI suggest the perfect icon, category, and duration.
* **Natural Language Routine Builder:** Describe your ideal day in plain English, and watch the AI convert it into an actionable routine.

### 🎯 Core Productivity
* **Quick Start Tasks:** Jump right into your day with categorized, pre-defined tasks based on your chosen routine.
* **Focus-Driven Timer:** A beautifully designed, distraction-free timer with dynamic backgrounds and audio cues to help you concentrate on one task at a time.
* **Dynamic Home Dashboard:** The app's header dynamically changes based on the real time of day and local weather (*powered by the Open-Meteo API*), creating an ambient, personalized experience.

### 📊 Analytics & Insights
* **Comprehensive Log Book:** Keep a detailed history of every task you complete or attempt.
* **Visual Dashboard:** Get a clear overview of your productivity with a clean, interactive donut chart breaking down your time by category.
* **Downloadable Reports:** Export your logbook as a CSV for detailed analysis or as a PNG image to share your progress.

### ⚙️ Planning & Customization
* **Event Scheduling:** Plan your week with a built-in calendar to schedule one-off events that seamlessly integrate with your daily tasks.
* **Full Customization:** Easily add, edit, or delete tasks from any routine in the Routine Editor.
* **Personalization:** Choose your days off, switch between light and dark themes, and configure audio and notification settings.
* **Cloud Sync & Offline Mode:** Secure Google Firebase authentication and Cloud Sync keep your data safe and accessible, with a robust offline/guest mode for productivity without an internet connection.

## 🛠️ Tech Stack

* **Frontend:** Next.js, React, ShadCN UI, Tailwind CSS
* **Backend & AI:** Google Firebase (Auth, Firestore), Google Gemini AI Models, Genkit
* **APIs & Services:** Open-Meteo API for real-time, hyperlocal weather data.

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites
* Node.js (v18 or later)
* npm or yarn
* A Google Firebase project

### Installation

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/your-username/DeadlinesMet.git](https://github.com/your-username/DeadlinesMet.git)
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd DeadlinesMet
    ```
3.  **Install NPM packages:**
    ```sh
    npm install
    ```
4.  **Set up your environment variables:**
    * Create a `.env.local` file in the root of the project.
    * Add your Google Firebase configuration keys to this file.
    ```env
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
    ```
5.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please refer to our `CONTRIBUTING.md` file for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
````
