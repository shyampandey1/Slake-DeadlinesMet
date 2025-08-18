# DeadlinesMet

![DeadlinesMet Logo](https://placehold.co/600x300/1a1a1a/f5c542?text=DeadlinesMet)

**Your personal space to conquer tasks and achieve goals. Focus on one task at a time. Set your goal and go.**

DeadlinesMet is a modern, task-oriented timer application designed to enhance focus and combat procrastination. By defining a single task and committing to a self-imposed deadline, users can leverage proven productivity techniques like timeboxing to achieve deep work and tangible results.

---

## ✨ Key Features

* **Task-Based Timers:** Create focused work sessions for any task.
* **Custom Deadlines:** Set your own duration to match the task's complexity.
* **Productivity Analytics:** Track your completed tasks, success rate, and focus time.
* **Task Categorization:** Organize your sessions with tags like `#work`, `#study`, or `#personal`.
* **Live Weather Updates:** Get current weather information for your location to better plan your day.
* **Secure Authentication:** Sign up with Email/Password or Google OAuth.

---

## 🛠️ Tech Stack

* **Framework:** [Next.js](https://nextjs.org/)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/)
* **Backend & Database:** [Firebase](https://firebase.google.com/) (Authentication, Firestore, Hosting)
* **Weather Data:** [OpenWeather API](https://openweathermap.org/api)
* **Deployment:** Firebase Studio / Cloud Run

---

## 🚀 Getting Started

Follow these instructions to get a local copy up and running for development and testing purposes.

### Prerequisites

* Node.js (v18 or later recommended)
* npm or yarn
* A Firebase project

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/deadlinesmet.git](https://github.com/your-username/deadlinesmet.git)
    cd deadlinesmet
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up Environment Variables:**
    Create a file named `.env.local` in the root of your project and add the necessary environment variables. See the section below for details.

4.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your `.env.local` file.

First, you need to get your Firebase project configuration. Go to your Firebase project settings and under "Your apps", select your web app to find your config object.


Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSy..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="https://www.google.com/search?q=your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="https://www.google.com/search?q=your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="1:..."


**Weather API Configuration**

This project uses the **OpenWeather API** to display weather data.

1.  Go to [OpenWeatherMap](https://openweathermap.org/api).
2.  Create a free account.
3.  Navigate to the "API keys" tab in your dashboard to find your key.


OpenWeather API Key
NEXT_PUBLIC_OPENWEATHER_API_KEY="YOUR_OPENWEATHER_API_KEY"


---

## ☁️ Deployment

This application is configured for easy deployment using Firebase Hosting and Firebase Studio (Cloud Run).

To deploy, simply connect your repository to your Firebase project and trigger a deployment from the Firebase Studio interface. Ensure that all required environment variables have been added to your backend configuration in the Google Cloud secret manager.

The `start` script in `package.json` is configured to `next start`, which automatically uses the `PORT` environment variable provided by the Cloud Run environment.
