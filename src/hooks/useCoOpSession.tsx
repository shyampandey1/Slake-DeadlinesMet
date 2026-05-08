
"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, deleteDoc, getDoc } from "firebase/firestore";
import { useAuth } from "./useAuth";

export interface CoOpSession {
    id: string;
    taskName: string;
    initialDuration: number;
    startTime: number | null;
    expectedEndTime: number | null;
    isPaused: boolean;
    timeLeftWhenPaused: number | null;
    status: "waiting" | "running" | "finished";
    participants: string[];
    createdBy: string;
    lastActionBy: string;
    lastActionAt: any;
}

export const useCoOpSession = (sessionId?: string) => {
    const { user } = useAuth();
    const [session, setSession] = useState<CoOpSession | null>(null);
    const [loading, setLoading] = useState(!!sessionId);

    useEffect(() => {
        if (!sessionId) return;

        const unsub = onSnapshot(doc(db, "coop_sessions", sessionId), (snap) => {
            if (snap.exists()) {
                setSession({ id: snap.id, ...snap.data() } as CoOpSession);
            } else {
                setSession(null);
            }
            setLoading(false);
        }, (error) => {
            console.error("Co-op session sync failed:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [sessionId]);

    const updateSession = useCallback(async (updates: Partial<CoOpSession>) => {
        if (!sessionId || !user) return;
        try {
            await updateDoc(doc(db, "coop_sessions", sessionId), {
                ...updates,
                lastActionBy: user.uid,
                lastActionAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Failed to update Co-op session:", error);
        }
    }, [sessionId, user]);

    const createSession = useCallback(async (data: Omit<CoOpSession, 'id' | 'lastActionBy' | 'lastActionAt' | 'startTime' | 'expectedEndTime' | 'isPaused' | 'timeLeftWhenPaused' | 'status'>) => {
        if (!user) return null;
        const id = `${user.uid}_${Date.now()}`;
        const newSession: Omit<CoOpSession, 'id'> = {
            ...data,
            startTime: null,
            expectedEndTime: null,
            isPaused: true,
            timeLeftWhenPaused: data.initialDuration * 60,
            status: "waiting",
            lastActionBy: user.uid,
            lastActionAt: serverTimestamp()
        };
        try {
            await setDoc(doc(db, "coop_sessions", id), newSession);
            return id;
        } catch (error) {
            console.error("Failed to create Co-op session:", error);
            return null;
        }
    }, [user]);

    const joinSession = useCallback(async (id: string) => {
        if (!user || !id) return;
        try {
            const sessionRef = doc(db, "coop_sessions", id);
            const snap = await getDoc(sessionRef);
            if (snap.exists()) {
                const data = snap.data();
                if (!data.participants.includes(user.uid)) {
                    await updateDoc(sessionRef, {
                        participants: [...data.participants, user.uid]
                    });
                }
            }
        } catch (error) {
            console.error("Failed to join Co-op session:", error);
            throw error; // Rethrow to let UI handle it
        }
    }, [user]);

    const endSession = useCallback(async () => {
        if (!sessionId) return;
        await deleteDoc(doc(db, "coop_sessions", sessionId));
    }, [sessionId]);

    return { session, loading, updateSession, createSession, joinSession, endSession };
};
