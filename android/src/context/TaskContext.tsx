import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { collection, doc, onSnapshot, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Task, LifestyleCategory } from '../types';
import { HapticService } from '../services/hapticService';
import { audioService } from '../services/audioService';

interface TaskContextType {
  tasks: Task[];
  loading: boolean;
  addTask: (name: string, durationMinutes: number, category?: LifestyleCategory) => Promise<string>;
  toggleTaskCompletion: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  quickLogHabit: (category: LifestyleCategory, name: string) => Promise<void>;
}

const TaskContext = createContext<TaskContextType>({
  tasks: [],
  loading: true,
  addTask: async () => '',
  toggleTaskCompletion: async () => {},
  deleteTask: async () => {},
  quickLogHabit: async () => {},
});

const DEFAULT_OFFLINE_TASKS: Task[] = [
  { id: 'def-1', userId: 'local', name: 'Morning Hydration Primer (500ml)', duration: 5, initialDuration: 5, completed: false, createdAt: new Date().toISOString(), category: 'Hydration' },
  { id: 'def-2', userId: 'local', name: 'Deep Focus Sprint: Core Architecture', duration: 25, initialDuration: 25, completed: false, createdAt: new Date().toISOString(), category: 'Productivity' },
  { id: 'def-3', userId: 'local', name: 'Box Breathing & Posture Reset', duration: 10, initialDuration: 10, completed: false, createdAt: new Date().toISOString(), category: 'Meditation' },
  { id: 'def-4', userId: 'local', name: 'Mobility & Spinal Decompression', duration: 15, initialDuration: 15, completed: false, createdAt: new Date().toISOString(), category: 'Fitness' },
];

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, awardCoins } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Instant boot from offline cache
  useEffect(() => {
    AsyncStorage.getItem('@cached_tasks').then((cached) => {
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setTasks(parsed);
          } else {
            setTasks(DEFAULT_OFFLINE_TASKS);
          }
        } catch {
          setTasks(DEFAULT_OFFLINE_TASKS);
        }
      } else {
        setTasks(DEFAULT_OFFLINE_TASKS);
      }
      setLoading(false);
    });
  }, []);

  // 2. Cloud Firestore Real-Time Synchronization
  useEffect(() => {
    if (!user) return;
    const tasksCol = collection(db, 'users', user.uid, 'tasks');
    const q = query(tasksCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const cloudTasks: Task[] = [];
        snapshot.forEach((d) => {
          cloudTasks.push({ id: d.id, ...d.data() } as Task);
        });

        if (cloudTasks.length > 0) {
          setTasks(cloudTasks);
          AsyncStorage.setItem('@cached_tasks', JSON.stringify(cloudTasks));
        }
        setLoading(false);
      },
      (err) => {
        console.warn("Tasks listener running in offline mode:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTask = useCallback(
    async (name: string, durationMinutes: number, category: LifestyleCategory = 'Productivity') => {
      const newId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      const newTask: Task = {
        id: newId,
        userId: user ? user.uid : 'local',
        name,
        duration: durationMinutes,
        initialDuration: durationMinutes,
        completed: false,
        createdAt: new Date().toISOString(),
        category,
        earnedCoins: 250,
      };

      // Optimistic state & local cache
      setTasks((prev) => {
        const updated = [newTask, ...prev];
        AsyncStorage.setItem('@cached_tasks', JSON.stringify(updated));
        return updated;
      });

      HapticService.light();

      // Cloud sync
      if (user) {
        try {
          const taskDoc = doc(db, 'users', user.uid, 'tasks', newId);
          await setDoc(taskDoc, newTask);
        } catch (e) {
          console.warn("Queued task sync offline:", e);
        }
      }

      return newId;
    },
    [user]
  );

  const toggleTaskCompletion = useCallback(
    async (taskId: string) => {
      let isCompletedNow = false;

      setTasks((prev) => {
        const updated = prev.map((t) => {
          if (t.id === taskId) {
            isCompletedNow = !t.completed;
            return { ...t, completed: isCompletedNow };
          }
          return t;
        });
        AsyncStorage.setItem('@cached_tasks', JSON.stringify(updated));
        return updated;
      });

      if (isCompletedNow) {
        HapticService.success();
        audioService.playCompletionCelebration();
        await awardCoins(250);
      } else {
        HapticService.light();
      }

      if (user) {
        try {
          const taskDoc = doc(db, 'users', user.uid, 'tasks', taskId);
          await updateDoc(taskDoc, { completed: isCompletedNow });
        } catch (e) {
          console.warn("Queued toggle sync offline:", e);
        }
      }
    },
    [user, awardCoins]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== taskId);
        AsyncStorage.setItem('@cached_tasks', JSON.stringify(updated));
        return updated;
      });

      HapticService.medium();

      if (user) {
        try {
          const taskDoc = doc(db, 'users', user.uid, 'tasks', taskId);
          await deleteDoc(taskDoc);
        } catch (e) {
          console.warn("Queued delete sync offline:", e);
        }
      }
    },
    [user]
  );

  const quickLogHabit = useCallback(
    async (category: LifestyleCategory, name: string) => {
      await addTask(name, 5, category);
      HapticService.success();
    },
    [addTask]
  );

  return (
    <TaskContext.Provider
      value={{
        tasks,
        loading,
        addTask,
        toggleTaskCompletion,
        deleteTask,
        quickLogHabit,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
