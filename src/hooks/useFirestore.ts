
"use client";

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, orderBy, deleteDoc, doc, Timestamp, writeBatch, getDocs, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { useAuth } from './useAuth';
import { Task, Preset, PresetTask, UserPresetTask } from '@/types';
import { useProfile } from './useProfile';

const iconMap = {
    ListChecks: "ListChecks",
    Bed: "Bed",
    StretchHorizontal: "StretchHorizontal",
    Dumbbell: "Dumbbell",
    BrainCircuit: "BrainCircuit",
    Mail: "Mail",
    Users: "Users",
    Coffee: "Coffee",
    Footprints: "Footprints",
    Utensils: "Utensils",
    Wind: "Wind",
    Droplets: "Droplets",
    BookOpen: "BookOpen",
    Wrench: "Wrench",
    Target: "Target",
    ShoppingBag: "ShoppingBag",
};
const iconNames = Object.keys(iconMap);

const profilePresets: { [key: string]: Preset } = {
    "Artist": {
        'Studio Time': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Sketching & Ideation', duration: 60, icon: 'BookOpen', order: 0 },
                { name: 'Deep Creative Work', duration: 180, icon: 'BrainCircuit', order: 1 },
                { name: 'Clean Brushes & Studio', duration: 30, icon: 'Droplets', order: 2 },
            ]
        },
        'Inspiration & Admin': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Visit Gallery/Museum', duration: 90, icon: 'Footprints', order: 0 },
                { name: 'Reply to Inquiries', duration: 30, icon: 'Mail', order: 1 },
            ]
        },
    },
    "Consultant": {
        'Client Focus': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Client Call', duration: 60, icon: 'Users', order: 0 },
                { name: 'Prepare Presentation', duration: 90, icon: 'ListChecks', order: 1 },
            ]
        },
        'Project Delivery': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Deep Project Work', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Review Deliverables', duration: 60, icon: 'Target', order: 1 },
            ]
        },
        'Business Development': {
             color: "bg-orange-900/80 text-orange-100",
             tasks: [
                { name: 'Networking', duration: 60, icon: 'Users', order: 0 },
                { name: 'Invoice & Admin', duration: 30, icon: 'Mail', order: 1 },
             ]
        }
    },
    "Content Creator": {
        'Content Production': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Scripting & Planning', duration: 60, icon: 'ListChecks', order: 0 },
                { name: 'Filming / Recording', duration: 120, icon: 'BrainCircuit', order: 1 },
                { name: 'Editing Session', duration: 180, icon: 'Wrench', order: 2 },
            ]
        },
        'Community & Growth': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Engage on Social Media', duration: 45, icon: 'Users', order: 0 },
                { name: 'Analyze Performance', duration: 30, icon: 'Target', order: 1 },
            ]
        }
    },
    "Designer": {
        'Creative & Design': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Moodboarding & Inspiration', duration: 45, icon: 'ShoppingBag', order: 0 },
                { name: 'Deep Design Work', duration: 180, icon: 'BrainCircuit', order: 1 },
                { name: 'Review & Refine', duration: 60, icon: 'Target', order: 2 },
            ]
        },
        'Client & Collaboration': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Client Meeting', duration: 60, icon: 'Users', order: 0 },
                { name: 'Respond to Feedback', duration: 45, icon: 'Mail', order: 1 },
            ]
        }
    },
    "Educator": {
        'Preparation & Planning': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Lesson Planning', duration: 60, icon: 'ListChecks', order: 0 },
                { name: 'Prepare Materials', duration: 45, icon: 'Wrench', order: 1 },
            ]
        },
        'Instruction & Grading': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Teaching Block', duration: 120, icon: 'BrainCircuit', order: 0 },
                { name: 'Grading', duration: 90, icon: 'BookOpen', order: 1 },
            ]
        },
    },
    "Entrepreneur": {
        'Strategy & Vision': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Review Business Goals', duration: 30, icon: 'Target', order: 0 },
                { name: 'Strategic Planning', duration: 60, icon: 'ListChecks', order: 1 },
            ]
        },
        'Execution': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Product Development', duration: 120, icon: 'Wrench', order: 0 },
                { name: 'Team Meeting', duration: 60, icon: 'Users', order: 1 },
                { name: 'Investor/Partner Outreach', duration: 60, icon: 'Mail', order: 2 },
            ]
        }
    },
    "Freelancer": {
        'Client Work': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Project Deep Work', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Client Communication', duration: 30, icon: 'Mail', order: 1 },
            ]
        },
        'Business Management': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Find New Projects', duration: 60, icon: 'ShoppingBag', order: 0 },
                { name: 'Invoicing & Finances', duration: 30, icon: 'ListChecks', order: 1 },
            ]
        }
    },
    "General": {
        'Morning Routine': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Plan Day', duration: 15, icon: 'ListChecks', order: 0 },
                { name: 'Meditate', duration: 10, icon: 'Bed', order: 1 },
            ]
        },
        'Work & Focus': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Focus Session', duration: 50, icon: 'BrainCircuit', order: 1 },
                { name: 'Check Emails', duration: 15, icon: 'Mail', order: 2 },
            ]
        },
        'Health & Wellness': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Workout', duration: 45, icon: 'Dumbbell', order: 0 },
                { name: 'Drink Water', duration: 1, icon: 'Droplets', recurring: true, order: 2 },
            ]
        },
    },
    "Healthcare Professional": {
        'Patient Care': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Patient Rounds', duration: 120, icon: 'Footprints', order: 0 },
                { name: 'Patient Consultations', duration: 180, icon: 'Users', order: 1 },
            ]
        },
        'Admin & Learning': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Update Patient Charts', duration: 60, icon: 'ListChecks', order: 0 },
                { name: 'Medical Research', duration: 45, icon: 'BookOpen', order: 1 },
            ]
        }
    },
    "IT Professional": {
        'Systems & Projects': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'System Maintenance', duration: 60, icon: 'Wrench', order: 0 },
                { name: 'Project Development', duration: 120, icon: 'BrainCircuit', order: 1 },
            ]
        },
        'Support & Communication': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Handle Support Tickets', duration: 90, icon: 'Mail', order: 0 },
                { name: 'Team Stand-up', duration: 15, icon: 'Users', order: 1 },
            ]
        }
    },
    "Manager": {
        'Team & Meetings': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Team Sync', duration: 45, icon: 'Users', order: 0 },
                { name: '1-on-1 Meetings', duration: 90, icon: 'Users', order: 1 },
            ]
        },
        'Strategy & Reporting': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Strategic Planning', duration: 60, icon: 'ListChecks', order: 0 },
                { name: 'Review Reports', duration: 45, icon: 'Target', order: 1 },
                { name: 'Email Correspondence', duration: 60, icon: 'Mail', order: 2 },
            ]
        }
    },
    "Marketer": {
        'Campaigns & Content': {
            color: "bg-orange-900/80 text-orange-100",
            tasks: [
                { name: 'Plan Campaign', duration: 60, icon: 'ListChecks', order: 0 },
                { name: 'Create Content', duration: 120, icon: 'BrainCircuit', order: 1 },
            ]
        },
        'Analytics & Meetings': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Analyze Metrics', duration: 45, icon: 'Target', order: 0 },
                { name: 'Marketing Team Sync', duration: 45, icon: 'Users', order: 1 },
            ]
        }
    },
    "Researcher": {
        'Research & Analysis': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Literature Review', duration: 90, icon: 'BookOpen', order: 0 },
                { name: 'Data Collection', duration: 120, icon: 'Wrench', order: 1 },
                { name: 'Data Analysis', duration: 180, icon: 'BrainCircuit', order: 2 },
            ]
        },
        'Writing & Collaboration': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Write Manuscript', duration: 120, icon: 'BookOpen', order: 0 },
                { name: 'Collaborator Meeting', duration: 60, icon: 'Users', order: 1 },
            ]
        }
    },
    "Sales": {
        'Prospecting & Outreach': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Lead Prospecting', duration: 90, icon: 'ShoppingBag', order: 0 },
                { name: 'Cold Calls & Emails', duration: 120, icon: 'Mail', order: 1 },
            ]
        },
        'Meetings & Follow-ups': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Client Demo', duration: 60, icon: 'Users', order: 0 },
                { name: 'Follow-up with Leads', duration: 45, icon: 'Mail', order: 1 },
                { name: 'Update CRM', duration: 30, icon: 'ListChecks', order: 2 },
            ]
        }
    },
    "Software Engineer": {
        'Morning Foundation': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Freshen Up & Hydrate', duration: 25, icon: 'Droplets', order: 0 },
                { name: 'Meditation', duration: 10, icon: 'Wind', order: 1 },
                { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 2 },
            ]
        },
        'Daily Strategy': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Plan & Prioritize Tasks', duration: 30, icon: 'ListChecks', order: 0 },
            ]
        },
        'Deep Work': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Focus on Top Priority Tasks', duration: 180, icon: 'BrainCircuit', order: 0 },
                { name: 'Focus on Secondary Tasks', duration: 150, icon: 'BrainCircuit', order: 1 },
            ]
        },
        'Breaks & Meals': {
            color: "bg-orange-900/80 text-orange-100",
            tasks: [
                { name: 'Short Drive', duration: 45, icon: 'Footprints', order: 0 },
                { name: 'Lunch', duration: 45, icon: 'Utensils', order: 1 },
            ]
        },
        'Afternoon Wrap-up': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Progress Review & Analysis', duration: 30, icon: 'Target', order: 0 },
                { name: 'Client App Refinements', duration: 30, icon: 'Wrench', order: 1 },
            ]
        }
    },
    "Student": {
        'Morning Routine': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Review Notes', duration: 25, icon: 'BookOpen', order: 0 },
                { name: 'Breakfast', duration: 20, icon: 'Utensils', order: 1 },
            ]
        },
        'Study Blocks': {
            color: "bg-blue-900/80 text-blue-100",
            tasks: [
                { name: 'Study Session 1', duration: 90, icon: 'BrainCircuit', order: 0 },
                { name: 'Study Session 2', duration: 90, icon: 'BrainCircuit', order: 1 },
                { name: 'Practice Problems', duration: 60, icon: 'Wrench', order: 2 },
            ]
        },
        'Breaks & Campus Life': {
            color: "bg-green-900/80 text-green-100",
            tasks: [
                { name: 'Lunch with Friends', duration: 60, icon: 'Users', order: 0 },
                { name: 'Walk on Campus', duration: 20, icon: 'Footprints', order: 1 },
            ]
        }
    },
    "Writer": {
        'Writing & Editing': {
            color: "bg-indigo-900/80 text-indigo-100",
            tasks: [
                { name: 'Morning Writing Session', duration: 120, icon: 'BookOpen', order: 0 },
                { name: 'Research for Article', duration: 60, icon: 'BrainCircuit', order: 1 },
                { name: 'Editing & Proofreading', duration: 90, icon: 'Wrench', order: 2 },
            ]
        },
        'Admin & Outreach': {
            color: "bg-slate-800 text-slate-100",
            tasks: [
                { name: 'Pitch Ideas to Editors', duration: 45, icon: 'Mail', order: 0 },
                { name: 'Social Media Promotion', duration: 30, icon: 'Users', order: 1 },
            ]
        }
    }
};

export function useTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setLoading(false);
      return;
    }
    
    if ('isMockUser' in user && user.isMockUser) {
      const mockTasks: Task[] = [
        { id: 'mock-1', userId: 'mock-user-01', name: 'Finish project proposal (mock)', duration: 60, completed: true, createdAt: new Date().toISOString() },
        { id: 'mock-2', userId: 'mock-user-01', name: 'Review design mockups (mock)', duration: 45, completed: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
      ];
      setTasks(mockTasks);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const userTasks = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp)?.toDate().toISOString() || new Date().toISOString()
          } as Task
      });
      setTasks(userTasks);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching tasks:", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'userId'>) => {
    if (!user) throw new Error("User not authenticated");

    if ('isMockUser' in user && user.isMockUser) {
        const newTask: Task = {
            id: `mock-${Date.now()}`,
            userId: user.uid,
            createdAt: new Date().toISOString(),
            ...task
        };
        setTasks(prev => [newTask, ...prev]);
        console.log("Mock task added:", newTask);
        return;
    }

    await addDoc(collection(db, 'tasks'), {
      ...task,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
  }, [user]);
  
  const clearTasks = useCallback(async () => {
    if (!user) throw new Error("User not authenticated");

    if ('isMockUser' in user && user.isMockUser) {
        setTasks([]);
        console.log("Mock tasks cleared");
        return;
    }
    
    const q = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const snapshot = await getDocs(q);
    const batch = writeBatch(db);
    snapshot.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();

  }, [user]);


  return { tasks, loading, addTask, clearTasks };
}

export function usePresetTasks() {
    const { user } = useAuth();
    const { profile } = useProfile();
    const [presetTasks, setPresetTasks] = useState<Preset>({});
    const [loading, setLoading] = useState(true);

    const isDefaultTask = (task: UserPresetTask) => {
        return !task.id;
    }

    const getAvailableIcons = () => iconNames;
    const getAvailableCategories = () => {
        const basePreset = profilePresets[profile] || profilePresets["General"];
        return Object.keys(basePreset);
    };

    useEffect(() => {
        if (!user) {
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
            return;
        }

        if ('isMockUser' in user && user.isMockUser) {
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            orderBy('order', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const userTasks = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as (UserPresetTask & {category: string})[];
            
            const basePreset = profilePresets[profile] || profilePresets["General"];
            const newPresets: Preset = JSON.parse(JSON.stringify(basePreset));

            // If profile is custom, we don't start with base tasks
            if (profile === 'Custom') {
                Object.keys(newPresets).forEach(category => {
                    newPresets[category].tasks = [];
                });
            }

            userTasks.forEach(task => {
                if (newPresets[task.category]) {
                    // Avoid duplicating default tasks that now have an ID
                    const existingIndex = newPresets[task.category].tasks.findIndex(t => t.name === task.name && !t.id);
                    if (existingIndex !== -1) {
                        newPresets[task.category].tasks.splice(existingIndex, 1);
                    }
                    newPresets[task.category].tasks.push(task);
                } else {
                   // For custom-generated categories
                   if (profile === 'Custom') {
                        newPresets[task.category] = {
                            color: "bg-gray-800 text-gray-100", // A default color
                            tasks: [task]
                        };
                   }
                }
            });
            
            Object.keys(newPresets).forEach(category => {
                newPresets[category].tasks.sort((a, b) => a.order - b.order);
            });

            setPresetTasks(newPresets);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching preset tasks:", error);
            const initialTasks = profilePresets[profile] || profilePresets["General"];
            setPresetTasks(initialTasks);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, profile]);

    const addPresetTask = useCallback(async (task: PresetTask & { category: string }) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;

        const categoryTasks = presetTasks[task.category]?.tasks || [];
        const maxOrder = categoryTasks.reduce((max, t) => Math.max(max, t.order), -1);

        await addDoc(collection(db, 'userPresetTasks'), {
            ...task,
            order: maxOrder + 1,
            userId: user.uid
        });
    }, [user, presetTasks]);
    
    const updatePresetTask = useCallback(async (taskId: string, task: Omit<UserPresetTask, 'id' | 'userId' | 'order'>) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        const taskRef = doc(db, 'userPresetTasks', taskId);
        await updateDoc(taskRef, task);
    }, [user]);

    const deletePresetTask = useCallback(async (taskId: string) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        
        await deleteDoc(doc(db, 'userPresetTasks', taskId));

    }, [user]);

    const findAndSyncPresetTask = useCallback(async (taskName: string, newDuration: number) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;

        const q = query(
            collection(db, 'userPresetTasks'),
            where('userId', '==', user.uid),
            where('name', '==', taskName),
            limit(1)
        );

        try {
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const taskDoc = snapshot.docs[0];
                const taskRef = doc(db, 'userPresetTasks', taskDoc.id);
                await updateDoc(taskRef, { duration: newDuration });
                console.log(`Synced preset task '${taskName}' to duration ${newDuration}.`);
            }
        } catch (error) {
            console.error(`Failed to sync preset task '${taskName}':`, error);
        }

    }, [user]);

    const reorderPresetTask = useCallback(async (taskId: string, direction: 'up' | 'down') => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
        
        try {
            await runTransaction(db, async (transaction) => {
                const taskRef = doc(db, 'userPresetTasks', taskId);
                const taskDoc = await transaction.get(taskRef);

                if (!taskDoc.exists()) {
                    throw "Task does not exist!";
                }

                const taskData = taskDoc.data() as UserPresetTask & { category: string };
                const { category, order } = taskData;
                
                const categoryTasksQuery = query(
                    collection(db, 'userPresetTasks'),
                    where('userId', '==', user.uid),
                    where('category', '==', category),
                    orderBy('order')
                );
                
                const categoryTasksSnapshot = await getDocs(categoryTasksQuery);
                const categoryTasks = categoryTasksSnapshot.docs.map(d => ({...d.data(), id: d.id} as UserPresetTask & {id: string}));

                const taskIndex = categoryTasks.findIndex(t => t.id === taskId);

                if (direction === 'up' && taskIndex > 0) {
                    const otherTask = categoryTasks[taskIndex - 1];
                    const otherTaskRef = doc(db, 'userPresetTasks', otherTask.id);
                    transaction.update(taskRef, { order: otherTask.order });
                    transaction.update(otherTaskRef, { order: order });
                } else if (direction === 'down' && taskIndex < categoryTasks.length - 1) {
                    const otherTask = categoryTasks[taskIndex + 1];
                    const otherTaskRef = doc(db, 'userPresetTasks', otherTask.id);
                    transaction.update(taskRef, { order: otherTask.order });
                    transaction.update(otherTaskRef, { order: order });
                }
            });
        } catch (error) {
            console.error("Failed to reorder task:", error);
        }

    }, [user]);

    const clearAndSetPresetTasks = useCallback(async (tasks: (PresetTask & { category: string })[]) => {
        if (!user || ('isMockUser' in user && user.isMockUser)) return;
    
        const batch = writeBatch(db);
    
        // 1. Delete all existing user preset tasks
        const q = query(collection(db, 'userPresetTasks'), where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
    
        // 2. Add the new tasks
        const tasksByCategory: { [key: string]: (PresetTask & { category: string })[] } = {};
        tasks.forEach(task => {
            if (!tasksByCategory[task.category]) {
                tasksByCategory[task.category] = [];
            }
            tasksByCategory[task.category].push(task);
        });
        
        Object.values(tasksByCategory).forEach(categoryTasks => {
            categoryTasks.forEach((task, index) => {
                const newDocRef = doc(collection(db, 'userPresetTasks'));
                batch.set(newDocRef, {
                    ...task,
                    order: index,
                    userId: user.uid,
                });
            });
        });
    
        // 3. Commit the batch
        await batch.commit();

    }, [user]);

    return { presetTasks, loading, addPresetTask, updatePresetTask, deletePresetTask, isDefaultTask, findAndSyncPresetTask, reorderPresetTask, clearAndSetPresetTasks, getAvailableCategories, getAvailableIcons };
}
