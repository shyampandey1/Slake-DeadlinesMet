
'use client';

import { useState, useEffect, useRef } from 'react';
import { getMusicLibrary } from '@/ai/flows/get-music-library';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Music, Music4 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { MusicTrack } from '@/types';

export default function MusicPlayer() {
  const [library, setLibrary] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    async function fetchLibrary() {
      try {
        const musicLibrary = await getMusicLibrary();
        const validTracks = musicLibrary.tracks.filter(t => t.trackUrl);
        setLibrary(validTracks);
        if (validTracks.length > 0) {
          setCurrentTrack(validTracks[0]);
        }
      } catch (error) {
        console.error('Failed to fetch music library:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLibrary();
  }, []);

  useEffect(() => {
    if (audioRef.current && currentTrack) {
      if (audioRef.current.src !== currentTrack.trackUrl) {
        audioRef.current.src = currentTrack.trackUrl;
      }
      if (isPlaying) {
        audioRef.current.load();
        audioRef.current.play().catch(e => console.error("Error playing new track:", e));
      }
    }
  }, [currentTrack, isPlaying]);

  const togglePlayPause = () => {
    if (!audioRef.current || !currentTrack) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      if (audioRef.current.src !== currentTrack.trackUrl) {
         audioRef.current.src = currentTrack.trackUrl;
      }
      audioRef.current.play().catch(e => console.error("Error playing audio:", e));
    }
    setIsPlaying(!isPlaying);
  };
  
  const handleTrackChange = (trackName: string) => {
    const newTrack = library.find(t => t.trackName === trackName);
    if (newTrack) {
      setCurrentTrack(newTrack);
    }
  };

  if (isLoading) {
    return <Skeleton className="h-10 w-64" />;
  }

  if (!library.length) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-card/50 backdrop-blur-sm border border-border">
      <audio
        ref={audioRef}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        loop
        src={currentTrack?.trackUrl}
      />
      <Button onClick={togglePlayPause} variant="ghost" size="icon" disabled={!currentTrack}>
        {isPlaying ? <Music /> : <Music4 />}
      </Button>

      <div className="w-[220px]">
        <Select onValueChange={handleTrackChange} value={currentTrack?.trackName ?? ""}>
          <SelectTrigger className="border-0 bg-transparent shadow-none focus:ring-0">
            <SelectValue asChild>
              <div className='flex flex-col items-start'>
                <span className='text-sm'>{currentTrack?.trackName}</span>
                <span className="text-xs text-muted-foreground">{currentTrack?.vibe}</span>
              </div>
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {library.map((track) => (
              <SelectItem key={track.trackName} value={track.trackName}>
                {track.vibe}: {track.trackName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
