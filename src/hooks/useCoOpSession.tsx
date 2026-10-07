"use client";

import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, setDoc, serverTimestamp, getDoc, collection, query, where } from "firebase/firestore";
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

export const useCoOpSession = (sessionId?: string, autoDetect: boolean = false) => {
    const { user } = useAuth();
    const [session, setSession] = useState<CoOpSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setSession(null);
            setLoading(false);
            return;
        }

        if (sessionId) {
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
        } else if (autoDetect) {
            // Auto-detect active session for current user (only recent, non-expired sessions)
            const q = query(
                collection(db, "coop_sessions"),
                where("participants", "array-contains", user.uid)
            );

            const unsub = onSnapshot(q, (snap) => {
                if (!snap.empty) {
                    const now = Date.now();
                    const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
                    const activeDocs = snap.docs
                        .map(d => ({ id: d.id, ...d.data() } as CoOpSession))
                        .filter(s => {
                            if (s.status === "finished") return false;
                            if (s.status === "running" && s.expectedEndTime && s.expectedEndTime <= now) return false;
                            const idParts = s.id.split("_");
                            const createdTs = s.startTime || (idParts.length > 1 ? parseInt(idParts[idParts.length - 1], 10) : 0);
                            if (createdTs && !isNaN(createdTs) && (now - createdTs > TWO_HOURS_MS)) return false;
                            return true;
                        })
                        .sort((a, b) => {
                            const tsA = a.startTime || parseInt(a.id.split("_").pop() || "0", 10) || 0;
                            const tsB = b.startTime || parseInt(b.id.split("_").pop() || "0", 10) || 0;
                            return tsA - tsB;
                        });

                    if (activeDocs.length > 0) {
                        setSession(activeDocs[activeDocs.length - 1]);
                    } else {
                        setSession(null);
                    }
                } else {
                    setSession(null);
                }
                setLoading(false);
            }, (error) => {
                console.warn("Auto-detect co-op session query failed:", error);
                setLoading(false);
            });

            return () => unsub();
        } else {
            setSession(null);
            setLoading(false);
        }
    }, [sessionId, autoDetect, user]);

    const updateSession = useCallback(async (updates: Partial<CoOpSession>) => {
        const targetId = sessionId || session?.id;
        if (!targetId || !user) return;
        try {
            await updateDoc(doc(db, "coop_sessions", targetId), {
                ...updates,
                lastActionBy: user.uid,
                lastActionAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Failed to update Co-op session:", error);
        }
    }, [sessionId, session?.id, user]);

    const createSession = useCallback(async (data: Omit<CoOpSession, "id" | "lastActionBy" | "lastActionAt" | "startTime" | "expectedEndTime" | "isPaused" | "timeLeftWhenPaused" | "status"> & {
        startTime?: number | null;
        expectedEndTime?: number | null;
        isPaused?: boolean;
        timeLeftWhenPaused?: number | null;
        status?: "waiting" | "running" | "finished";
    }) => {
        if (!user) return null;
        const id = `${user.uid}_${Date.now()}`;
        const newSession: Omit<CoOpSession, "id"> = {
            taskName: data.taskName,
            initialDuration: data.initialDuration,
            participants: data.participants,
            createdBy: data.createdBy || user.uid,
            startTime: data.startTime !== undefined ? data.startTime : Date.now(),
            expectedEndTime: data.expectedEndTime !== undefined ? data.expectedEndTime : Date.now() + (data.initialDuration * 60 * 1000),
            isPaused: data.isPaused !== undefined ? data.isPaused : false,
            timeLeftWhenPaused: data.isPaused ? (data.timeLeftWhenPaused ?? data.initialDuration * 60) : null,
            status: data.status || "running",
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
                const currentParticipants: string[] = data.participants || [];
                if (!currentParticipants.includes(user.uid)) {
                    await updateDoc(sessionRef, {
                        participants: [...currentParticipants, user.uid],
                        lastActionBy: user.uid,
                        lastActionAt: serverTimestamp()
                    });
                }
            }
        } catch (error) {
            console.error("Failed to join Co-op session:", error);
            throw error;
        }
    }, [user]);

    const endSession = useCallback(async () => {
        const targetId = sessionId || session?.id;
        if (!targetId) return;
        try {
            await updateDoc(doc(db, "coop_sessions", targetId), {
                status: "finished",
                lastActionBy: user?.uid || "system",
                lastActionAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Failed to end Co-op session:", error);
        }
    }, [sessionId, session?.id, user?.uid]);

    return { session, loading, updateSession, createSession, joinSession, endSession };
};
