import { NextResponse } from 'next/server';

export interface SynthesizeVoicePayload {
  text: string;
  voiceProfile?: 'assistant_female' | 'assistant_male' | 'mentor_calm';
  speed?: number; // default 1.05 for punchy assistant feel
}

// In-memory server LRU/Map cache for frequent recurring micro-confirmations
const serverAudioCache = new Map<string, { buffer: Buffer; contentType: string }>();

// Predefined profile mapping for Google Cloud TTS (Neural2 / Journey)
const GOOGLE_VOICE_MAP = {
  assistant_female: {
    languageCode: 'en-US',
    name: 'en-US-Journey-F',
    ssmlGender: 'FEMALE',
  },
  assistant_male: {
    languageCode: 'en-US',
    name: 'en-US-Journey-D',
    ssmlGender: 'MALE',
  },
  mentor_calm: {
    languageCode: 'en-US',
    name: 'en-US-Neural2-F',
    ssmlGender: 'FEMALE',
  },
};

// ElevenLabs voice mapping fallback
const ELEVENLABS_VOICE_MAP = {
  assistant_female: '21m00Tcm4TlvDq8ikWAM', // Rachel
  assistant_male: 'pNInz6obpgDQGcFmaJgB',   // Adam
  mentor_calm: 'EXAVITQu4vr4xnSDxMaL',      // Bella / calm
};

async function synthesizeWithGoogle(
  text: string,
  voiceProfile: 'assistant_female' | 'assistant_male' | 'mentor_calm',
  speed: number,
  apiKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const voice = GOOGLE_VOICE_MAP[voiceProfile] || GOOGLE_VOICE_MAP.assistant_female;

  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(apiKey)}`;

  const payload = {
    input: { text },
    voice: {
      languageCode: voice.languageCode,
      name: voice.name,
      ssmlGender: voice.ssmlGender,
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: Math.max(0.7, Math.min(1.5, speed || 1.05)),
      sampleRateHertz: 24000,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    console.warn(`[TTS] Google TTS direct synthesize failed (${res.status}): ${errorText}`);
    // If Journey voice returns 400 in unsupported region, fallback to Neural2-F
    if (voice.name.includes('Journey')) {
      const fallbackPayload = {
        ...payload,
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-F',
          ssmlGender: 'FEMALE',
        },
      };
      const fallbackRes = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fallbackPayload),
      });
      if (fallbackRes.ok) {
        const data = await fallbackRes.json();
        if (data.audioContent) {
          return {
            buffer: Buffer.from(data.audioContent, 'base64'),
            contentType: 'audio/mpeg',
          };
        }
      }
    }
    return null;
  }

  const data = await res.json();
  if (!data.audioContent) {
    return null;
  }

  return {
    buffer: Buffer.from(data.audioContent, 'base64'),
    contentType: 'audio/mpeg',
  };
}

async function synthesizeWithElevenLabs(
  text: string,
  voiceProfile: 'assistant_female' | 'assistant_male' | 'mentor_calm',
  apiKey: string
): Promise<{ buffer: Buffer; contentType: string } | null> {
  const voiceId = ELEVENLABS_VOICE_MAP[voiceProfile] || ELEVENLABS_VOICE_MAP.assistant_female;
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream?model_id=eleven_turbo_v2_5&output_format=mp3_24000_64`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      text,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    console.warn(`[TTS] ElevenLabs synthesize failed (${res.status}): ${errText}`);
    return null;
  }

  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType: 'audio/mpeg',
  };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<SynthesizeVoicePayload>;
    const text = (body?.text || '').trim();
    const voiceProfile = body?.voiceProfile || 'assistant_female';
    const speed = body?.speed ?? 1.05;

    if (!text) {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    // Edge & Server Caching: Check server-side in-memory cache
    const cacheKey = `${voiceProfile}_${speed}_${text.toLowerCase()}`;
    if (serverAudioCache.has(cacheKey)) {
      const cached = serverAudioCache.get(cacheKey)!;
      return new Response(new Uint8Array(cached.buffer), {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Content-Length': cached.buffer.length.toString(),
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          'X-TTS-Cache': 'HIT',
        },
      });
    }

    const provider = (process.env.TTS_PROVIDER || 'google').toLowerCase();
    const googleApiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
    const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;

    let result: { buffer: Buffer; contentType: string } | null = null;

    if (provider === 'elevenlabs' && elevenlabsApiKey) {
      result = await synthesizeWithElevenLabs(text, voiceProfile, elevenlabsApiKey);
      if (!result && googleApiKey) {
        result = await synthesizeWithGoogle(text, voiceProfile, speed, googleApiKey);
      }
    } else if (googleApiKey) {
      result = await synthesizeWithGoogle(text, voiceProfile, speed, googleApiKey);
      if (!result && elevenlabsApiKey) {
        result = await synthesizeWithElevenLabs(text, voiceProfile, elevenlabsApiKey);
      }
    } else if (elevenlabsApiKey) {
      result = await synthesizeWithElevenLabs(text, voiceProfile, elevenlabsApiKey);
    }

    if (!result) {
      return NextResponse.json(
        {
          error: 'No active TTS credentials or synthesis provider response unavailable. Falling back to native browser speech.',
          fallback: true,
        },
        { status: 502 }
      );
    }

    // Cache frequent phrases in memory (keep memory bounded to max 200 items)
    if (serverAudioCache.size > 200) {
      const firstKey = serverAudioCache.keys().next().value;
      if (firstKey) serverAudioCache.delete(firstKey);
    }
    serverAudioCache.set(cacheKey, result);

    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Length': result.buffer.length.toString(),
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'X-TTS-Cache': 'MISS',
      },
    });
  } catch (error: any) {
    console.error('[TTS Route Error]:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal TTS server error', fallback: true },
      { status: 500 }
    );
  }
}
