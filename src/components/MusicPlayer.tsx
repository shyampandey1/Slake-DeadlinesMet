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
import { Music, Music2, Music3, Music4, Loader2 } from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { MusicTrack } from '@/types';

export default function MusicPlayer() {
  const [library, setLibrary] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    if (currentTrack && audioRef.current) {
        audioRef.current.src = currentTrack.trackUrl;
        if (isPlaying) {
            audioRef.current.play().catch(e => console.error("Audio play failed", e));
        }
    }
  }, [currentTrack]);


  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error("Audio play failed", e));
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
    return null; // Don't render anything if no music is available
  }

  return (
    <div className="mt-8 flex items-center gap-4 p-2 rounded-lg bg-card/50 border">
      <audio ref={audioRef} loop />
      
      <Button onClick={togglePlayPause} variant="ghost" size="icon" disabled={!currentTrack}>
        {isPlaying ? <Music /> : <Music4 />}
      </Button>

      <div className="flex flex-col items-start">
         <Select onValueChange={handleTrackChange} defaultValue={currentTrack?.trackName}>
            <SelectTrigger className="w-[200px] border-0 bg-transparent shadow-none focus:ring-0">
                <SelectValue placeholder="Select a vibe..." />
            </SelectTrigger>
            <SelectContent>
                {library.map((track) => (
                <SelectItem key={track.trackName} value={track.trackName}>
                    {track.vibe}: {track.trackName}
                </SelectItem>
                ))}
            </SelectContent>
         </Select>
        <span className="text-xs text-muted-foreground ml-3">{currentTrack?.vibe}</span>
      </div>
    </div>
  );
}
