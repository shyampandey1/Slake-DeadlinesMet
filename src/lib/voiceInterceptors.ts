"use client";

export interface VoiceInterceptorResult {
  intercepted: boolean;
  speechResponse?: string;
  interceptorType?: 'WEATHER' | 'TIME' | 'IDENTITY';
}

const WEATHER_REGEX = /\b(?:weather|temperature|how\s+hot|how\s+cold|outside\s+temp|degrees)\b/i;
const TIME_REGEX = /\b(?:what\s+time\s+is\s+it|current\s+time|tell\s+me\s+the\s+time|what\s+is\s+the\s+time)\b/i;
const IDENTITY_REGEX = /\b(?:who\s+are\s+you|your\s+name|what\s+can\s+you\s+do|what\s+are\s+you)\b/i;

/**
 * Zero-mutation conversational interceptors for common read-only queries (Weather, Time, Identity).
 * Runs at Tier 1 before embedding computation or store mutations.
 */
export function evaluateVoiceInterceptors(transcript: string): VoiceInterceptorResult {
  const clean = transcript.trim();
  if (!clean) {
    return { intercepted: false };
  }

  // 1. Weather Interceptor (/weather|temperature|how hot/i)
  if (WEATHER_REGEX.test(clean)) {
    let tempText = 'unavailable';
    if (typeof document !== 'undefined') {
      const weatherNode = document.querySelector('[data-weather-indicator]');
      if (weatherNode && weatherNode.textContent) {
        tempText = weatherNode.textContent.trim();
      }
    }
    return {
      intercepted: true,
      interceptorType: 'WEATHER',
      speechResponse: `The weather is currently ${tempText}.`,
    };
  }

  // 2. Time Interceptor (/what time is it|current time/i)
  if (TIME_REGEX.test(clean)) {
    const formattedTime = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    return {
      intercepted: true,
      interceptorType: 'TIME',
      speechResponse: `The current time is ${formattedTime}.`,
    };
  }

  // 3. Identity Interceptor (/who are you|your name|what can you do/i)
  if (IDENTITY_REGEX.test(clean)) {
    return {
      intercepted: true,
      interceptorType: 'IDENTITY',
      speechResponse: 'I am Agent DM, your focus and routine companion.',
    };
  }

  return { intercepted: false };
}
