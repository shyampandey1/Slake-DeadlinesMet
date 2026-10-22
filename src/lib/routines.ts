import type { UserPresetTask, ProfileType, Preset } from '@/types';

export const ROUTINE_TEMPLATE_VERSION = 10.0;

export const commonEveningWindDown: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Evening Snacks & Hydration", duration: 15, icon: "Coffee", category: "Evening Wind-down" },
    { name: "Dinner", duration: 35, icon: "Utensils", category: "Evening Wind-down" },
    { name: "Deep Breathing & Relax", duration: 3, icon: "Wind", category: "Evening Wind-down" },
];

export const commonBedtimeRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Reading a book & Learning", duration: 30, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Hygiene & Skincare", duration: 15, icon: "ShowerHead", category: "Bedtime Routine" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Bedtime Routine" },
    { name: "Final Journaling & Goal Setting", duration: 10, icon: "PenSquare", category: "Bedtime Routine" },
];

const contentCreatorRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Deep Breathing & Morning Hydration", duration: 3, icon: "Wind", category: "Morning Kickstart" },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Morning Kickstart" },
    { name: "Morning warm-up workout", duration: 15, icon: "Dumbbell", category: "Morning Kickstart" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Kickstart" },
    { name: "Set the table & Breakfast", duration: 30, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Plan Day's Content & Trend Research", duration: 45, icon: "FileCode", category: "Pre-Production" },
    { name: "Script Writing & Storyboarding", duration: 60, icon: "PenTool", category: "Pre-Production" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Pre-Production" },
    { name: "Recording/Filming Session", duration: 120, icon: "Camera", category: "Production Block" },
    { name: "Set table & Lunch", duration: 35, icon: "Utensils", category: "Production Block" },
    { name: "Video Editing Block", duration: 120, icon: "Smartphone", category: "Post-Production" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Post-Production" },
    { name: "Thumbnail Design & SEO", duration: 45, icon: "Palette", category: "Post-Production" },
    { name: "Evening warm-up workout", duration: 15, icon: "Dumbbell", category: "Evening & Close" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const designerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Morning warm-up & Hydration", duration: 11, icon: "Dumbbell", category: "Morning Kickstart" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Kickstart" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Meditation & Breathing", duration: 3, icon: "Wind", category: "Pre-Production" },
    { name: "Mood Boarding & Color Theory", duration: 60, icon: "Palette", category: "Pre-Production" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Pre-Production" },
    { name: "UI/UX Wireframing Block", duration: 120, icon: "PenTool", category: "Production Block" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Prototyping & Client Feedback", duration: 90, icon: "Laptop", category: "Post-Production" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Post-Production" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Evening & Close" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const artistRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Breathing & Morning Hydration", duration: 3, icon: "Wind", category: "Morning Kickstart" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Kickstart" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Sketching & Composition", duration: 90, icon: "Palette", category: "Pre-Production" },
    { name: "Painting/Sculpting Intensive", duration: 120, icon: "Wand2", category: "Production Block" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Gallery Admin & Portfolio", duration: 60, icon: "PenTool", category: "Post-Production" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Post-Production" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Evening & Close" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const writerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Meditation & Hydration", duration: 11, icon: "BrainCircuit", category: "Morning Kickstart" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "Morning Kickstart" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Kickstart" },
    { name: "Set table & Breakfast", duration: 25, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Topic Research & Fact Checking", duration: 90, icon: "FileCode", category: "Pre-Production" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Pre-Production" },
    { name: "Drafting Creative Content", duration: 120, icon: "BookOpen", category: "Production Block" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Editing & Proofreading", duration: 90, icon: "PenSquare", category: "Post-Production" },
    { name: "Final Polish & Reflection", duration: 10, icon: "Lightbulb", category: "Post-Production" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Evening & Close" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const softwareEngineerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "System Initialization" },
    { name: "Breathing & Morning Hydration", duration: 3, icon: "Wind", category: "System Initialization" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "System Initialization" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "System Initialization" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "System Initialization" },
    { name: "Deep Focus Coding Session", duration: 120, icon: "Code", category: "Sync & Sprint" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Sync & Sprint" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Architecture & Logic" },
    { name: "PR Reviews & Bug Fixing", duration: 90, icon: "FileCode", category: "Architecture & Logic" },
    { name: "Architecture & Logic Flow", duration: 60, icon: "BrainCircuit", category: "Architecture & Logic" },
    { name: "Documentation & Deployment", duration: 60, icon: "Laptop", category: "Deployment & Decompression" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Deployment & Decompression" },
    ...commonEveningWindDown,
    { name: "Side Project / OSS Contribution", duration: 45, icon: "Puzzle", category: "Late Hustle" },
    { name: "Learning new Frameworks", duration: 30, icon: "BookOpen", category: "Late Hustle" },
    ...commonBedtimeRoutine,
];

const medicalRepRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Field Prep" },
    { name: "Morning Warm-up & Hydration", duration: 16, icon: "Dumbbell", category: "Field Prep" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Field Prep" },
    { name: "Breakfast & Prep", duration: 30, icon: "Utensils", category: "Field Prep" },
    { name: "Clinic/Hospital In-person Visits", duration: 180, icon: "Map", category: "Clinic Visits" },
    { name: "Field Hydration Break", duration: 5, icon: "Droplets", category: "Clinic Visits" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Product Demos & Reporting" },
    { name: "Sales Log & Lead Management", duration: 90, icon: "Briefcase", category: "Product Demos & Reporting" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Product Demos & Reporting" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Inventory & Relax" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const entrepreneurRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Visionary Morning" },
    { name: "Meditation & Morning Hydration", duration: 11, icon: "BrainCircuit", category: "Visionary Morning" },
    { name: "Morning warm-up", duration: 20, icon: "Dumbbell", category: "Visionary Morning" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Visionary Morning" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Visionary Morning" },
    { name: "Board & Investor Meetings", duration: 120, icon: "Users", category: "Strategic Execution" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Strategic Execution" },
    { name: "Team Lead Sync & Strategy", duration: 90, icon: "Users", category: "Operations" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Operations" },
    { name: "Sales & Networking Calls", duration: 120, icon: "Briefcase", category: "Operations" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Operations" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Networking & Rest" },
    { name: "Founder Networking & Decompression", duration: 30, icon: "Users", category: "Networking & Rest" },
    ...commonEveningWindDown,
    { name: "Inbox Zero & Communications", duration: 30, icon: "Mail", category: "Late Hustle" },
    { name: "Analytics & Growth Metric Review", duration: 20, icon: "TrendingUp", category: "Late Hustle" },
    { name: "Next Day Strategy Planning", duration: 15, icon: "Target", category: "Late Hustle" },
    ...commonBedtimeRoutine,
];

const consultantRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Discovery" },
    { name: "Meditation & Morning Hydration", duration: 16, icon: "BrainCircuit", category: "Discovery" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Discovery" },
    { name: "Analysis & Client Auditing", duration: 120, icon: "BarChart", category: "Analysis" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Analysis" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Recommendations" },
    { name: "Presentation Deck Creation", duration: 120, icon: "Presentation", category: "Deliverables" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Deliverables" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Strategy Sync" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const managerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Allocation" },
    { name: "Morning Warm-up & Hydration", duration: 16, icon: "Dumbbell", category: "Allocation" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Allocation" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Allocation" },
    { name: "1-on-1 Performance Reviews", duration: 90, icon: "Users", category: "Personnel" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Personnel" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Reporting" },
    { name: "Project Oversight & Resource Check", duration: 120, icon: "ClipboardList", category: "Coordination" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Coordination" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Review" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const marketerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Analytics" },
    { name: "Meditation & Morning Hydration", duration: 12, icon: "BrainCircuit", category: "Analytics" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Analytics" },
    { name: "Ad Set Optimization & Copy", duration: 120, icon: "TrendingUp", category: "Campaigns" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Campaigns" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Creative Flow" },
    { name: "Social Media Scheduling", duration: 90, icon: "Megaphone", category: "Content Strategy" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Content Strategy" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Engagement" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const salesRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Prospecting" },
    { name: "Morning Warm-up & Hydration", duration: 16, icon: "Dumbbell", category: "Prospecting" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Prospecting" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Prospecting" },
    { name: "Cold Calls & Pipeline Building", duration: 150, icon: "Smartphone", category: "Outreach" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Outreach" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Negotiation" },
    { name: "Closing Deals & Contracts", duration: 120, icon: "Briefcase", category: "Closings" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Closings" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Pipeline Review" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const studentRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Retention" },
    { name: "Morning Hydration & Breathing", duration: 3, icon: "Wind", category: "Retention" },
    { name: "Morning warm-up", duration: 15, icon: "Dumbbell", category: "Retention" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Retention" },
    { name: "Set table & Breakfast", duration: 25, icon: "Utensils", category: "Retention" },
    { name: "Intensive Study Session", duration: 150, icon: "BookOpen", category: "Focus Block" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Focus Block" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Academic Application" },
    { name: "Problem Sets & Research", duration: 120, icon: "GraduationCap", category: "Academic Application" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Academic Application" },
    { name: "Evening warm-up", duration: 20, icon: "Dumbbell", category: "Extracurricular" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const educatorRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Lesson Logic" },
    { name: "Morning Warm-up & Hydration", duration: 16, icon: "Dumbbell", category: "Lesson Logic" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Lesson Logic" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Lesson Logic" },
    { name: "Classroom Instruction", duration: 180, icon: "School", category: "Instruction" },
    { name: "Post-Lecture Hydration", duration: 5, icon: "Droplets", category: "Instruction" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Evaluation" },
    { name: "Grading & Feedback", duration: 120, icon: "FileCode", category: "Grading" },
    { name: "Eye strain & Mental Rest", duration: 5, icon: "Eye", category: "Grading" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Prep" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const freelancerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Pipeline" },
    { name: "Meditation & Morning Hydration", duration: 12, icon: "BrainCircuit", category: "Pipeline" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Pipeline" },
    { name: "Core Client Deliverables", duration: 150, icon: "Code", category: "Billable Work" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Billable Work" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Fuel" },
    { name: "Invoicing & Outreach", duration: 90, icon: "FileCode", category: "Admin" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Admin" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Close Out" },
    ...commonEveningWindDown,
    { name: "Upskilling & Coursework", duration: 40, icon: "BrainCircuit", category: "Late Hustle" },
    { name: "Portfolio Updates", duration: 20, icon: "FolderSync", category: "Late Hustle" },
    ...commonBedtimeRoutine,
];

const generalDetailedRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Domestic Start" },
    { name: "Morning Warm-up & Hydration", duration: 16, icon: "Dumbbell", category: "Domestic Start" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Domestic Start" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Domestic Start" },
    { name: "Personal Errands & Admin", duration: 120, icon: "ShoppingCart", category: "Daily Admin" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Daily Admin" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "midday" },
    { name: "Skill Focus & Hobbies", duration: 120, icon: "Gamepad2", category: "Skills/Hobbies" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Skills/Hobbies" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Wrap Up" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];


const dayOffRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Prep" },
    { name: "Meditation & Deep Breathing", duration: 3, icon: "Wind", category: "Morning Prep" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Prep" },
    { name: "Set the table & Breakfast", duration: 30, icon: "Coffee", category: "Morning Prep" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Prep" },
    { name: "Run errands or personal projects", duration: 90, icon: "ShoppingCart", category: "Work & Focus" },
    { name: "Relaxing hobby", duration: 60, icon: "Gamepad2", category: "Health & Wellness" },
    { name: "Set the table & Lunch", duration: 30, icon: "Utensils", category: "Health & Wellness" },
    { name: "Connect with friends or family", duration: 60, icon: "Users", category: "Health & Wellness" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const dayOffRoutineHealthcare: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Prep" },
    { name: "Deep Breathing & Meditation", duration: 3, icon: "Wind", category: "Morning Prep" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Prep" },
    { name: "Set the table & Breakfast", duration: 30, icon: "Coffee", category: "Morning Prep" },
    { name: "Personal projects or errands", duration: 90, icon: "ShoppingCart", category: "Work & Focus" },
    { name: "Relaxing hobby", duration: 60, icon: "Gamepad2", category: "Health & Wellness" },
    { name: "Set the table & Lunch", duration: 30, icon: "Utensils", category: "Health & Wellness" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const healthcareProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Preparation" },
    { name: "Morning Hydration & Breathing", duration: 3, icon: "Wind", category: "Preparation" },
    { name: "Morning warm-up", duration: 15, icon: "Dumbbell", category: "Preparation" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Preparation" },
    { name: "Set table & Breakfast", duration: 25, icon: "Utensils", category: "Preparation" },
    { name: "Patient Chart Review & Rounds", duration: 180, icon: "Stethoscope", category: "Clinical Rounds" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Nutrition" },
    { name: "Patient Record Updates", duration: 90, icon: "FileCode", category: "Updates" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Updates" },
    { name: "Evening warm-up", duration: 20, icon: "Dumbbell", category: "Decompression" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const itProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Monitoring" },
    { name: "Meditation & Morning Hydration", duration: 11, icon: "BrainCircuit", category: "Monitoring" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "Monitoring" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Monitoring" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "Monitoring" },
    { name: "Network & Server Maintenance", duration: 120, icon: "Server", category: "Infrastructure" },
    { name: "Eye strain & Hydration", duration: 3, icon: "Eye", category: "Infrastructure" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Troubleshooting" },
    { name: "Help Desk & Ticket Resolution", duration: 120, icon: "Laptop", category: "Tickets" },
    { name: "Visual Rest & Rehydrate", duration: 3, icon: "Eye", category: "Tickets" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "System Lock" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const researcherRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Hypothesis" },
    { name: "Morning Hydration & Breathing", duration: 3, icon: "Wind", category: "Hypothesis" },
    { name: "Morning warm-up", duration: 15, icon: "Dumbbell", category: "Hypothesis" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Hypothesis" },
    { name: "Set table & Breakfast", duration: 25, icon: "Utensils", category: "Hypothesis" },
    { name: "Experimental Data Collection", duration: 150, icon: "FlaskConical", category: "Lab Session" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Analysis" },
    { name: "Data Interpretation & Synthesis", duration: 120, icon: "Laptop", category: "Computation" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Computation" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Peer Review" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];

const STANDALONE_BREAK_NAMES = new Set([
    "drink a glass of water",
    "eye strain exercise",
    "eye strain & hydration",
    "visual rest & rehydrate",
    "field hydration break",
    "post-lecture hydration",
    "eye strain & mental rest",
]);

const enrichTasks = (tasks: ReadonlyArray<Omit<UserPresetTask, "id" | "order" | "profession">>) => {
    const cleanedTasks = tasks.map(t => ({ ...t })).filter(t => {
        const lower = t.name.toLowerCase().trim();
        return !STANDALONE_BREAK_NAMES.has(lower);
    });

    const enrichedTasks: Omit<UserPresetTask, "id" | "order" | "profession">[] = [];
    
    let waterCount = 0;
    let eyeCount = 0;
    let entertainmentCount = 0;
    const totalWaters = 8;
    const totalEyes = 4;

    for (let i = 0; i < cleanedTasks.length; i++) {
        enrichedTasks.push(cleanedTasks[i]);

        const expectedWater = Math.floor(((i + 1) / cleanedTasks.length) * totalWaters);
        if (waterCount < expectedWater) {
            waterCount++;
            enrichedTasks.push({ name: `Drink a glass of water`, duration: 1, icon: "Droplets", category: cleanedTasks[i].category });
        }

        const expectedEye = Math.floor(((i + 1) / cleanedTasks.length) * totalEyes);
        if (eyeCount < expectedEye) {
            eyeCount++;
            enrichedTasks.push({ name: "Eye strain exercise", duration: 2, icon: "Eye", category: cleanedTasks[i].category });
        }

        // Add entertainment/gaming slots later in the day (After 50%, 75%, and 95% of routine)
        const progress = (i + 1) / cleanedTasks.length;
        if (entertainmentCount === 0 && progress >= 0.5) {
            entertainmentCount++;
            enrichedTasks.push({ name: "Post-Work Visual Break", duration: 15, icon: "Gamepad2", category: "Entertainment & Gaming" });
        } else if (entertainmentCount === 1 && progress >= 0.75) {
            entertainmentCount++;
            enrichedTasks.push({ name: "Digital Entertainment Session", duration: 20, icon: "Tv", category: "Entertainment & Gaming" });
        } else if (entertainmentCount === 2 && progress >= 0.95) {
            entertainmentCount++;
            enrichedTasks.push({ name: "Late Night Gaming/Leisure", duration: 25, icon: "Gamepad2", category: "Entertainment & Gaming" });
        }
    }

    return enrichedTasks;
};

export const wrapRoutineWithMOVERS = (
    tasks: Omit<UserPresetTask, "id" | "order" | "profession">[],
    profession: ProfileType,
    preference: 'morning_primer' | 'evening_restorer'
) => {
    const HIGH_PHYSICAL = ["Healthcare Professional", "Sales", "Medical Representative", "Delivery Agent"];
    const HIGH_COGNITIVE = ["Software Engineer", "Analyst", "Manager", "Consultant", "Entrepreneur", "Researcher"];
    const CREATIVE = ["Artist", "Designer", "Content Creator", "Writer"];

    const isPhysical = HIGH_PHYSICAL.includes(profession);
    const isCognitive = HIGH_COGNITIVE.includes(profession);
    const isCreative = CREATIVE.includes(profession);

    // Protocol Tasks
    const M = { name: "Meditation (M)", duration: 10, icon: "BrainCircuit", category: preference === 'morning_primer' ? "Morning Protocol" : "Evening Protocol" };
    const O = { name: "Oxygenation (O)", duration: 3, icon: "Wind", category: preference === 'morning_primer' ? "Morning Protocol" : "Evening Protocol" };
    
    let vName = "Visualization (V)";
    if (isCognitive) vName = "Strategic Planning (V)";
    const V = { name: vName, duration: 10, icon: "Target", category: preference === 'morning_primer' ? "Morning Protocol" : "Evening Protocol" };
    
    let eName = "Exercise (E)";
    if (isPhysical && preference === 'evening_restorer') eName = "Recovery Stretch (E)";
    const E = { name: eName, duration: 30, icon: "Dumbbell", category: preference === 'morning_primer' ? "Morning Protocol" : "Evening Protocol" };

    let rName = "Reading (R)";
    if (isCreative) rName = "Inspiration Intake (R)";
    const R = { name: rName, duration: 15, icon: "BookOpen", category: "Evening Protocol" };
    
    const S = { name: "Scribing (S)", duration: 15, icon: "PenSquare", category: "Evening Protocol" };

    const result = Array.isArray(tasks) ? [...tasks] : [];

    if (preference === 'morning_primer') {
        // Inject M+O+V+E at the start
        result.unshift(M, O, V, E);
        // Inject R+S at the end
        result.push(R, S);
    } else {
        // Inject E at the start
        const morningE = { ...E, category: "Morning Protocol" };
        result.unshift(morningE);
        // Inject M+O+V+R+S at the end
        result.push(M, O, V, R, S);
    }

    return result;
};

export const defaultRoutines: { version: number, routines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order" | "profession">[] } } = {
    version: 10.0,
    routines: {
        "Analyst": enrichTasks(softwareEngineerRoutine),
        "Artist": enrichTasks(artistRoutine),
        "Consultant": enrichTasks(consultantRoutine),
        "Content Creator": enrichTasks(contentCreatorRoutine),
        "Designer": enrichTasks(designerRoutine),
        "Educator": enrichTasks(educatorRoutine),
        "Entrepreneur": enrichTasks(entrepreneurRoutine),
        "Freelancer": enrichTasks(freelancerRoutine),
        "Healthcare Professional": enrichTasks(healthcareProfessionalRoutine),
        "Day Off - Analyst": enrichTasks(dayOffRoutine),
        "Day Off - Healthcare": enrichTasks(dayOffRoutineHealthcare),
        "Admin Day - On The Go": enrichTasks(entrepreneurRoutine),
        "Day Off": enrichTasks(dayOffRoutine),
        "IT Professional": enrichTasks(itProfessionalRoutine),
        "Manager": enrichTasks(managerRoutine),
        "Marketer": enrichTasks(marketerRoutine),
        "Researcher": enrichTasks(researcherRoutine),
        "Sales": enrichTasks(salesRoutine),
        "Software Engineer": enrichTasks(softwareEngineerRoutine),
        "Student": enrichTasks(studentRoutine),
        "Writer": enrichTasks(writerRoutine),
        "Medical Representative": enrichTasks(medicalRepRoutine),
        "Delivery Agent": enrichTasks(medicalRepRoutine),
        "General": enrichTasks(generalDetailedRoutine)
    }
};

export const profileToRoutineMap: { [key: string]: keyof typeof defaultRoutines.routines } = {
    "Analyst": "Analyst",
    "Artist": "Artist",
    "Consultant": "Consultant",
    "Content Creator": "Content Creator",
    "Designer": "Designer",
    "Educator": "Educator",
    "Entrepreneur": "Entrepreneur",
    "Freelancer": "Freelancer",
    "General": "General",
    "Healthcare Professional": "Healthcare Professional",
    "Day Off": "Day Off",
    "Day Off - Analyst": "Day Off - Analyst",
    "Day Off - Healthcare": "Day Off - Healthcare",
    "Admin Day - On The Go": "Admin Day - On The Go",
    "IT Professional": "IT Professional",
    "Manager": "Manager",
    "Marketer": "Marketer",
    "Researcher": "Researcher",
    "Sales": "Sales",
    "Software Engineer": "Software Engineer",
    "Student": "Student",
    "Writer": "Writer",
    "Medical Representative": "Medical Representative",
    "Delivery Agent": "Delivery Agent"
};

/**
 * Strictly chronological category configuration across all 18 professions:
 * - 5:  Early Morning MOVERS / Primer Protocols (6:00 AM - 7:30 AM)
 * - 10: Morning Initialization & Routine Blocks (6:00 AM - 9:00 AM)
 * - 20: Morning Deep Work & Core Execution Blocks (8:30 AM - 1:00 PM)
 * - 25: Late Morning Production Blocks (10:30 AM - 1:00 PM)
 * - 30: Midday, Lunch & Early Afternoon Blocks (1:00 PM - 5:00 PM)
 * - 40: Afternoon Execution & Deliverables Blocks (2:00 PM - 6:00 PM)
 * - 50: Early Evening Warm-up & Decompression Blocks (6:00 PM - 7:00 PM)
 * - 60: Evening Wind-down & Dinner Block (7:00 PM - 9:00 PM)
 * - 70: Late Hustle Block (9:00 PM - 10:00 PM)
 * - 75: Entertainment & Gaming Block (9:00 PM - 10:00 PM)
 * - 78: Evening Restorer / Day's End Recovery Protocol (9:30 PM - 10:30 PM)
 * - 80: Bedtime Routine Block (10:00 PM - 12:00 AM)
 */
export const categoryConfig: { [key: string]: { color: string, order: number } } = {
    // MOVERS & Morning/Evening Protocols
    'Morning Primer': { color: 'bg-emerald-900 text-emerald-100 border-emerald-500/50', order: 5 },
    'Morning Activation': { color: 'bg-emerald-900 text-emerald-100 border-emerald-500/50', order: 5 },
    'MOVERS Protocol': { color: 'bg-emerald-900 text-emerald-100 border-emerald-500/50', order: 5 },
    // The 4 Primary Reformers Tuned Routine Blocks
    'Morning Protocol': { color: 'bg-emerald-900 text-emerald-100 border-emerald-500/50', order: 10 },
    'Afternoon Execution': { color: 'bg-blue-900 text-blue-100 border-blue-500/50', order: 30 },
    'Evening Recharge & Growth': { color: 'bg-purple-900 text-purple-100 border-purple-500/50', order: 55 },
    'Night Restoration': { color: 'bg-indigo-950 text-indigo-100 border-indigo-500/50', order: 80 },
    "Day's End Recovery": { color: 'bg-indigo-950 text-indigo-100 border-indigo-500/50', order: 78 },
    'Evening Restorer Block': { color: 'bg-indigo-950 text-indigo-100 border-indigo-500/50', order: 78 },
    'Evening Protocol': { color: 'bg-indigo-950 text-indigo-100 border-indigo-500/50', order: 78 },
    
    // Creative Professional
    'Morning Kickstart': { color: 'bg-indigo-800 text-white', order: 10 },
    'Pre-Production': { color: 'bg-blue-800 text-white', order: 20 },
    'Production Block': { color: 'bg-cyan-800 text-white', order: 25 },
    'Post-Production': { color: 'bg-purple-800 text-white', order: 40 },
    'Evening & Close': { color: 'bg-slate-800 text-white', order: 50 },
    'Concept Phase': { color: 'bg-indigo-800 text-white', order: 10 },
    'Visual Research': { color: 'bg-blue-800 text-white', order: 20 },
    'Interface Design': { color: 'bg-cyan-800 text-white', order: 25 },
    'Iteration': { color: 'bg-purple-800 text-white', order: 40 },
    'Morning Flow': { color: 'bg-indigo-800 text-white', order: 10 },
    'Studio Foundation': { color: 'bg-blue-800 text-white', order: 20 },
    'Execution': { color: 'bg-cyan-800 text-white', order: 25 },
    'Management': { color: 'bg-purple-800 text-white', order: 40 },
    'Reflection': { color: 'bg-slate-800 text-white', order: 50 },
    'Early Draft': { color: 'bg-indigo-800 text-white', order: 10 },
    'Research Block': { color: 'bg-blue-800 text-white', order: 20 },
    'Core Writing': { color: 'bg-cyan-800 text-white', order: 25 },
    'Polishing': { color: 'bg-purple-800 text-white', order: 40 },
    'Creative Rest': { color: 'bg-slate-800 text-white', order: 50 },
    
    // Technical Professional
    'System Initialization': { color: 'bg-amber-800 text-white', order: 10 },
    'Sync & Sprint': { color: 'bg-orange-800 text-white', order: 20 },
    'Architecture & Logic': { color: 'bg-rose-800 text-white', order: 30 },
    'Deployment & Decompression': { color: 'bg-indigo-800 text-white', order: 50 },
    'Boot Sequence': { color: 'bg-amber-800 text-white', order: 10 },
    'Deep Logic': { color: 'bg-orange-800 text-white', order: 20 },
    'Sync & Lunch': { color: 'bg-rose-800 text-white', order: 30 },
    'Architecture': { color: 'bg-indigo-800 text-white', order: 40 },
    'Maintenance': { color: 'bg-slate-800 text-white', order: 50 },
    'Rest Mode': { color: 'bg-slate-900 text-white', order: 80 },
    'Preparation': { color: 'bg-teal-800 text-white', order: 10 },
    'Clinical Rounds': { color: 'bg-blue-800 text-white', order: 20 },
    'Nutrition': { color: 'bg-indigo-800 text-white', order: 30 },
    'Updates': { color: 'bg-purple-800 text-white', order: 40 },
    'Decompression': { color: 'bg-slate-800 text-white', order: 50 },
    'Monitoring': { color: 'bg-amber-800 text-white', order: 10 },
    'Infrastructure': { color: 'bg-orange-800 text-white', order: 20 },
    'Troubleshooting': { color: 'bg-rose-800 text-white', order: 30 },
    'Tickets': { color: 'bg-indigo-800 text-white', order: 40 },
    'System Lock': { color: 'bg-slate-800 text-white', order: 50 },
    'Hypothesis': { color: 'bg-emerald-800 text-white', order: 10 },
    'Lab Session': { color: 'bg-blue-800 text-white', order: 20 },
    'Analysis': { color: 'bg-indigo-800 text-white', order: 25 },
    'Computation': { color: 'bg-purple-800 text-white', order: 40 },
    'Peer Review': { color: 'bg-slate-800 text-white', order: 50 },
    
    // Business Professional
    'Visionary Morning': { color: 'bg-sky-800 text-white', order: 10 },
    'Strategic Execution': { color: 'bg-blue-900 text-white', order: 20 },
    'Operations': { color: 'bg-emerald-800 text-white', order: 30 },
    'Networking & Rest': { color: 'bg-slate-900 text-white', order: 50 },
    'Late Hustle': { color: 'bg-rose-900 text-white', order: 70 },
    'Vision Block': { color: 'bg-sky-800 text-white', order: 10 },
    'High Stakes': { color: 'bg-blue-900 text-white', order: 20 },
    'Operation': { color: 'bg-emerald-800 text-white', order: 30 },
    'Business Development': { color: 'bg-indigo-800 text-white', order: 40 },
    'Networking': { color: 'bg-slate-900 text-white', order: 50 },
    'Route Planning': { color: 'bg-teal-800 text-white', order: 10 },
    'Field Execution': { color: 'bg-blue-800 text-white', order: 20 },
    'Review': { color: 'bg-indigo-800 text-white', order: 50 },
    'CRM Reporting': { color: 'bg-purple-800 text-white', order: 40 },
    'Inventory': { color: 'bg-slate-800 text-white', order: 50 },
    'Discovery': { color: 'bg-sky-800 text-white', order: 10 },
    'Recommendations': { color: 'bg-emerald-800 text-white', order: 30 },
    'Deliverables': { color: 'bg-indigo-800 text-white', order: 40 },
    'Strategy Sync': { color: 'bg-slate-900 text-white', order: 50 },
    'Allocation': { color: 'bg-sky-800 text-white', order: 10 },
    'Personnel': { color: 'bg-blue-900 text-white', order: 20 },
    'Reporting': { color: 'bg-emerald-800 text-white', order: 30 },
    'Coordination': { color: 'bg-indigo-800 text-white', order: 40 },
    'Analytics': { color: 'bg-sky-800 text-white', order: 10 },
    'Campaigns': { color: 'bg-pink-800 text-white', order: 20 },
    'Creative Flow': { color: 'bg-rose-800 text-white', order: 30 },
    'Content Strategy': { color: 'bg-purple-800 text-white', order: 40 },
    'Engagement': { color: 'bg-slate-900 text-white', order: 50 },
    'Prospecting': { color: 'bg-sky-800 text-white', order: 10 },
    'Outreach': { color: 'bg-blue-900 text-white', order: 20 },
    'Negotiation': { color: 'bg-emerald-800 text-white', order: 30 },
    'Closings': { color: 'bg-indigo-800 text-white', order: 40 },
    'Pipeline Review': { color: 'bg-slate-900 text-white', order: 50 },
    
    // Medical Rep / On-the-Go
    'Field Prep': { color: 'bg-teal-800 text-white', order: 10 },
    'Clinic Visits': { color: 'bg-blue-800 text-white', order: 20 },
    'Product Demos & Reporting': { color: 'bg-indigo-800 text-white', order: 30 },
    'Inventory & Relax': { color: 'bg-purple-800 text-white', order: 50 },
    
    // Student
    'Learning Ready': { color: 'bg-sky-800 text-white', order: 10 },
    'Academics I': { color: 'bg-blue-800 text-white', order: 20 },
    'Academics II': { color: 'bg-indigo-800 text-white', order: 30 },
    'Review & Rest': { color: 'bg-purple-800 text-white', order: 50 },
    'Retention': { color: 'bg-sky-800 text-white', order: 10 },
    'Focus Block': { color: 'bg-blue-800 text-white', order: 20 },
    'Academic Application': { color: 'bg-indigo-800 text-white', order: 30 },
    'Extracurricular': { color: 'bg-purple-800 text-white', order: 50 },
    'Mastery': { color: 'bg-slate-900 text-white', order: 50 },

    // Education & Others
    'Lesson Logic': { color: 'bg-sky-800 text-white', order: 10 },
    'Instruction': { color: 'bg-blue-800 text-white', order: 20 },
    'Evaluation': { color: 'bg-emerald-800 text-white', order: 30 },
    'Grading': { color: 'bg-orange-800 text-white', order: 40 },
    'Prep': { color: 'bg-slate-800 text-white', order: 50 },
    'Pipeline': { color: 'bg-sky-800 text-white', order: 10 },
    'Billable Work': { color: 'bg-indigo-800 text-white', order: 20 },
    'Fuel': { color: 'bg-orange-800 text-white', order: 30 },
    'Admin': { color: 'bg-purple-800 text-white', order: 40 },
    'Close Out': { color: 'bg-slate-900 text-white', order: 50 },
    'Domestic Start': { color: 'bg-sky-800 text-white', order: 10 },
    'Daily Admin': { color: 'bg-emerald-800 text-white', order: 20 },
    'midday': { color: 'bg-orange-800 text-white', order: 30 },
    'Skills/Hobbies': { color: 'bg-rose-800 text-white', order: 40 },
    'Wrap Up': { color: 'bg-indigo-800 text-white', order: 50 },

    // Interactive Tuner & Scheduled Categories
    'Transit & Prep': { color: 'bg-amber-900 text-amber-100 border-amber-500/50', order: 15 },
    'Work & Academics': { color: 'bg-blue-800 text-white', order: 20 },
    'Morning Work Sprint': { color: 'bg-blue-800 text-white', order: 20 },
    'Nutrition & Energy': { color: 'bg-teal-800 text-white', order: 30 },
    'Midday Nutrition & Recharge': { color: 'bg-teal-800 text-white', order: 30 },
    'Deep Focus & Study': { color: 'bg-violet-900 text-violet-100 border-violet-500/50', order: 45 },
    'Evening Custom': { color: 'bg-slate-800 text-white', order: 55 },

    // Day Off & Fallbacks
    'Morning Prep': { color: 'bg-sky-800 text-white', order: 10 },
    'Morning Recovery': { color: 'bg-sky-800 text-white', order: 10 },
    'Morning Routine': { color: 'bg-sky-800 text-white', order: 10 },
    'Work & Focus': { color: 'bg-emerald-800 text-white', order: 20 },
    'Primary Work Session': { color: 'bg-emerald-800 text-white', order: 20 },
    'Breaks & Meals': { color: 'bg-orange-800 text-white', order: 30 },
    'Lunch Break': { color: 'bg-orange-800 text-white', order: 30 },
    'Afternoon Session': { color: 'bg-indigo-800 text-white', order: 40 },
    'Afternoon Life Admin & Recharge': { color: 'bg-indigo-800 text-white', order: 30 },
    'Health & Wellness': { color: 'bg-rose-800 text-white', order: 50 },
    'Post-Work Decompression': { color: 'bg-slate-800 text-white', order: 50 },
    'Evening Wind-down': { color: 'bg-indigo-800 text-white', order: 60 },
    'Evening Routine': { color: 'bg-indigo-800 text-white', order: 60 },
    'Entertainment & Gaming': { color: 'bg-indigo-900 text-white', order: 75 },
    'Bedtime Routine': { color: 'bg-slate-800 text-white', order: 80 },
    'Evening & Bedtime': { color: 'bg-slate-800 text-white', order: 80 },
    'Evening & Bedtime Reset': { color: 'bg-slate-800 text-white', order: 80 },
    'Default': { color: 'bg-slate-800 text-white', order: 99 },
};

/**
 * Non-overlapping, full-day chronological schedule windows (in 24-hour float format)
 * covering every category across all 18 professions and MOVERS templates.
 */
export const CATEGORY_TIME_BLOCKS: { [category: string]: { start: number; end: number } } = {
    // 5: Early Morning Protocols (6:00 AM - 7:30 AM)
    'Morning Primer': { start: 6, end: 7.5 },
    'Morning Activation': { start: 6, end: 7.5 },
    'MOVERS Protocol': { start: 6, end: 7.5 },
    'Morning Protocol': { start: 5.5, end: 7.0 },

    // 10: Morning Initialization & Routine Blocks
    'Pre-Shift Routine': { start: 5, end: 7 },
    'Visionary Morning': { start: 6, end: 8 },
    'Vision Block': { start: 6, end: 8 },
    'Preparation': { start: 6, end: 8 },
    'Morning Prep': { start: 6, end: 8.5 },
    'Morning Routine': { start: 6, end: 8.5 },
    'Morning Kickstart': { start: 7.0, end: 8.5 },
    'Transit & Prep': { start: 8.5, end: 9.0 },
    'Work & Academics': { start: 9.0, end: 13.0 },
    'Morning Work Sprint': { start: 9.0, end: 13.0 },
    'Nutrition & Energy': { start: 13.0, end: 14.5 },
    'Midday Nutrition & Recharge': { start: 13.0, end: 14.5 },
    'Afternoon Execution': { start: 14.5, end: 17.5 },
    'Deep Focus & Study': { start: 17.5, end: 19.0 },
    'Evening Custom': { start: 19.0, end: 20.5 },
    'Evening Recharge & Growth': { start: 17.5, end: 22.0 },
    'Night Restoration': { start: 22.0, end: 24.0 },
    'Concept Phase': { start: 6.5, end: 8.5 },
    'Morning Flow': { start: 6.5, end: 8.5 },
    'Early Draft': { start: 6.5, end: 8.5 },
    'System Initialization': { start: 7, end: 9 },
    'Boot Sequence': { start: 7, end: 9 },
    'Field Prep': { start: 7, end: 9 },
    'Route Planning': { start: 7, end: 9 },
    'Discovery': { start: 7, end: 9 },
    'Allocation': { start: 7, end: 9 },
    'Analytics': { start: 7, end: 9 },
    'Prospecting': { start: 7, end: 9 },
    'Retention': { start: 7, end: 9 },
    'Learning Ready': { start: 7, end: 9 },
    'Lesson Logic': { start: 7, end: 9 },
    'Pipeline': { start: 7, end: 9 },
    'Domestic Start': { start: 7, end: 9 },
    'Monitoring': { start: 7, end: 9 },
    'Hypothesis': { start: 7, end: 9 },
    'Morning Recovery': { start: 7, end: 11 },

    // 20-25: Morning Deep Work & Core Execution
    'Strategic Execution': { start: 8, end: 13 },
    'High Stakes': { start: 8, end: 13 },
    'Clinical Rounds': { start: 8, end: 13 },
    'Pre-Production': { start: 8.5, end: 10.5 },
    'Visual Research': { start: 8.5, end: 10.5 },
    'Studio Foundation': { start: 8.5, end: 10.5 },
    'Research Block': { start: 8.5, end: 10.5 },
    'Production Block': { start: 10.5, end: 13.5 },
    'Interface Design': { start: 10.5, end: 13.5 },
    'Execution': { start: 10.5, end: 13.5 },
    'Core Writing': { start: 10.5, end: 13.5 },
    'Sync & Sprint': { start: 9, end: 13 },
    'Deep Logic': { start: 9, end: 13 },
    'Clinic Visits': { start: 9, end: 13 },
    'Field Execution': { start: 9, end: 13 },
    'Analysis': { start: 9, end: 13 },
    'Personnel': { start: 9, end: 13 },
    'Campaigns': { start: 9, end: 13 },
    'Outreach': { start: 9, end: 13 },
    'Focus Block': { start: 9, end: 13 },
    'Academics I': { start: 9, end: 13 },
    'Instruction': { start: 9, end: 13 },
    'Billable Work': { start: 9, end: 13 },
    'Daily Admin': { start: 9, end: 13 },
    'Infrastructure': { start: 9, end: 13 },
    'Lab Session': { start: 9, end: 13 },
    'Primary Work Session': { start: 9, end: 13 },
    'Work & Focus': { start: 9, end: 13 },
    'On the Road': { start: 9, end: 17 },
    'During Shift': { start: 7, end: 18 },

    // 30: Midday, Lunch & Afternoon Operations
    'Operations': { start: 13, end: 18 },
    'Operation': { start: 13, end: 18 },
    'Product Demos & Reporting': { start: 13, end: 18 },
    'Academic Application': { start: 13, end: 18 },
    'Academics II': { start: 13, end: 18 },
    'Architecture & Logic': { start: 13, end: 17 },
    'Recommendations': { start: 13, end: 14.5 },
    'Reporting': { start: 13, end: 14.5 },
    'Creative Flow': { start: 13, end: 14.5 },
    'Negotiation': { start: 13, end: 14.5 },
    'Evaluation': { start: 13, end: 14.5 },
    'Fuel': { start: 13, end: 14.5 },
    'midday': { start: 13, end: 14.5 },
    'Nutrition': { start: 13, end: 14.5 },
    'Troubleshooting': { start: 13, end: 14.5 },
    'Lunch Break': { start: 13, end: 14 },
    'Breaks & Meals': { start: 13, end: 14.5 },
    'Sync & Lunch': { start: 13, end: 14.5 },
    'Afternoon Life Admin & Recharge': { start: 11, end: 18 },

    // 40: Afternoon Core Work & Deliverables (1:30/2:30 PM - 6:00 PM)
    'Post-Production': { start: 13.5, end: 18 },
    'Iteration': { start: 13.5, end: 18 },
    'Management': { start: 13.5, end: 18 },
    'Polishing': { start: 13.5, end: 18 },
    'Deliverables': { start: 14.5, end: 18 },
    'Coordination': { start: 14.5, end: 18 },
    'Content Strategy': { start: 14.5, end: 18 },
    'Closings': { start: 14.5, end: 18 },
    'Grading': { start: 14.5, end: 18 },
    'Admin': { start: 14.5, end: 18 },
    'Skills/Hobbies': { start: 14.5, end: 18 },
    'Updates': { start: 14.5, end: 18 },
    'Tickets': { start: 14.5, end: 18 },
    'Computation': { start: 14.5, end: 18 },
    'Architecture': { start: 14.5, end: 18 },
    'Business Development': { start: 14.5, end: 18 },
    'CRM Reporting': { start: 14.5, end: 18 },
    'Afternoon Session': { start: 14, end: 18 },

    // 50: Early Evening Warm-up & Decompression (6:00 PM - 7:00 PM)
    'Networking & Rest': { start: 18, end: 19 },
    'Evening & Close': { start: 18, end: 19 },
    'Deployment & Decompression': { start: 17, end: 19 },
    'Inventory & Relax': { start: 18, end: 19 },
    'Review & Rest': { start: 18, end: 19 },
    'Extracurricular': { start: 18, end: 19 },
    'Strategy Sync': { start: 18, end: 19 },
    'Review': { start: 18, end: 19 },
    'Engagement': { start: 18, end: 19 },
    'Pipeline Review': { start: 18, end: 19 },
    'Prep': { start: 18, end: 19 },
    'Close Out': { start: 18, end: 19 },
    'Wrap Up': { start: 18, end: 19 },
    'Decompression': { start: 18, end: 19 },
    'Post-Shift Decompression': { start: 18, end: 19 },
    'System Lock': { start: 18, end: 19 },
    'Peer Review': { start: 18, end: 19 },
    'Health & Wellness': { start: 14.5, end: 19 },
    'Post-Work Decompression': { start: 18, end: 19 },
    'Post-Work Admin': { start: 17, end: 19 },
    'Reflection': { start: 18, end: 19 },
    'Creative Rest': { start: 18, end: 19 },
    'Maintenance': { start: 18, end: 19 },
    'Networking': { start: 18, end: 19 },
    'Inventory': { start: 18, end: 19 },
    'Mastery': { start: 18, end: 19 },

    // 60: Evening Wind-down (7:00 PM - 9:00 PM)
    'Evening Wind-down': { start: 19, end: 21 },
    'Evening Routine': { start: 19, end: 21 },

    // 70-78: Late Hustle, Entertainment & Evening Recovery Protocols (9:00 PM - 10:00 PM)
    'Late Hustle': { start: 21, end: 22 },
    'Entertainment & Gaming': { start: 21, end: 22 },
    "Day's End Recovery": { start: 21, end: 22.5 },
    'Evening Restorer Block': { start: 21, end: 22.5 },
    'Evening Protocol': { start: 21, end: 22.5 },

    // 80: Bedtime Routine (10:00 PM - 12:00 AM)
    'Bedtime Routine': { start: 22, end: 24 },
    'Rest Mode': { start: 22, end: 24 },
    'Evening & Bedtime': { start: 22, end: 24 },
    'Evening & Bedtime Reset': { start: 22, end: 24 },
};

export const computeCategoryTimeRanges = (
    presetTasks: Preset,
    referenceDate: Date = new Date()
): { [category: string]: { start: Date; end: Date } } => {
    const ranges: { [category: string]: { start: Date; end: Date } } = {};
    if (!presetTasks || Object.keys(presetTasks).length === 0) return ranges;

    // 1. Check if tasks have explicit startTime (from tuned routine)
    const hasExplicitTimes = Object.values(presetTasks).some(
        (cat) => cat.tasks && cat.tasks.some((t) => typeof t.startTime === 'string' && t.startTime.includes(':'))
    );

    if (hasExplicitTimes) {
        Object.keys(presetTasks).forEach((category) => {
            const tasks = presetTasks[category]?.tasks || [];
            const timedTasks = tasks.filter((t) => typeof t.startTime === 'string' && t.startTime.includes(':'));

            if (timedTasks.length > 0) {
                let minStart = 1440;
                let maxEnd = 0;

                timedTasks.forEach((t) => {
                    const [h, m] = (t.startTime || '00:00').split(':').map((v) => parseInt(v, 10));
                    const startMins = (h || 0) * 60 + (m || 0);
                    const endMins = startMins + (t.duration || 15);
                    if (startMins < minStart) minStart = startMins;
                    if (endMins > maxEnd) maxEnd = endMins;
                });

                if (minStart < 1440 && maxEnd > 0) {
                    const startDate = new Date(referenceDate);
                    startDate.setHours(Math.floor(minStart / 60), minStart % 60, 0, 0);

                    const endDate = new Date(referenceDate);
                    endDate.setHours(Math.floor(maxEnd / 60), maxEnd % 60, 0, 0);

                    ranges[category] = { start: startDate, end: endDate };
                }
            }
        });
    }

    // 2. Fill any missing categories from CATEGORY_TIME_BLOCKS or categoryConfig order
    Object.keys(presetTasks).forEach((category) => {
        if (!ranges[category]) {
            let block = CATEGORY_TIME_BLOCKS[category];

            if (!block) {
                const config = categoryConfig[category];
                const order = config?.order ?? 99;
                if (order <= 5) block = { start: 5.5, end: 7.0 };
                else if (order <= 15) block = { start: 7.0, end: 8.5 };
                else if (order <= 28) block = { start: 8.5, end: 13.0 };
                else if (order <= 35) block = { start: 13.0, end: 14.5 };
                else if (order <= 45) block = { start: 14.5, end: 17.5 };
                else if (order <= 55) block = { start: 17.5, end: 19.5 };
                else if (order <= 65) block = { start: 19.5, end: 21.0 };
                else if (order <= 79) block = { start: 21.0, end: 22.5 };
                else block = { start: 22.5, end: 24.0 };
            }

            const startDate = new Date(referenceDate);
            startDate.setHours(Math.floor(block.start), Math.round((block.start % 1) * 60), 0, 0);

            const endDate = new Date(referenceDate);
            if (block.end >= 24) {
                endDate.setHours(23, 59, 59, 999);
            } else {
                endDate.setHours(Math.floor(block.end), Math.round((block.end % 1) * 60), 0, 0);
            }

            ranges[category] = { start: startDate, end: endDate };
        }
    });

    // 3. Mathematical Zero-Overlap Enforcement Pass:
    // Sort all categories by start time, and clamp overlapping ranges so no two blocks overlap
    const sortedCategories = Object.keys(ranges).sort(
        (a, b) => (categoryConfig[a]?.order ?? 99) - (categoryConfig[b]?.order ?? 99) || ranges[a].start.getTime() - ranges[b].start.getTime()
    );

    for (let i = 0; i < sortedCategories.length - 1; i++) {
        const curCat = sortedCategories[i];
        const nextCat = sortedCategories[i + 1];

        if (ranges[curCat].end.getTime() > ranges[nextCat].start.getTime()) {
            ranges[curCat].end = new Date(ranges[nextCat].start.getTime());
        }
    }

    return ranges;
};

/**
 * Computes the best recommended category for the current time.
 * - Matches categories whose time window contains `now`.
 * - If multiple match, prefers the one with the latest start time (most specific to current hour),
 *   breaking ties by chronological `categoryConfig[c].order`.
 * - If `completedTaskNamesToday` is provided and all tasks in a category are already completed today,
 *   automatically advances to the next chronological category that has incomplete tasks!
 */
export const computeActiveCategory = (
    presetTasks: Preset,
    categoryTimeRanges: { [category: string]: { start: Date; end: Date } },
    completedTaskNamesToday?: Set<string>,
    now: Date = new Date()
): string | null => {
    const categories = Object.keys(presetTasks).sort(
        (a, b) => (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99)
    );
    if (categories.length === 0) return null;

    const hasIncompleteTasks = (cat: string): boolean => {
        if (!completedTaskNamesToday || completedTaskNamesToday.size === 0) return true;
        const catTasks = presetTasks[cat]?.tasks || [];
        if (catTasks.length === 0) return false;
        return catTasks.some(t => !completedTaskNamesToday.has(t.name.toLowerCase()));
    };

    // 1. Find all categories whose time window includes `now`
    const matchingCategories = categories.filter(cat => {
        const range = categoryTimeRanges[cat];
        if (!range) return false;
        return now >= range.start && now <= range.end;
    });

    if (matchingCategories.length > 0) {
        // Sort matching categories: prefer incomplete categories first, then latest start time, then lowest order
        const sortedMatches = [...matchingCategories].sort((a, b) => {
            const aInc = hasIncompleteTasks(a) ? 0 : 1;
            const bInc = hasIncompleteTasks(b) ? 0 : 1;
            if (aInc !== bInc) return aInc - bInc;

            const aStart = categoryTimeRanges[a]?.start.getTime() || 0;
            const bStart = categoryTimeRanges[b]?.start.getTime() || 0;
            if (aStart !== bStart) return bStart - aStart; // Latest start time wins

            return (categoryConfig[a]?.order || 99) - (categoryConfig[b]?.order || 99);
        });

        const bestMatch = sortedMatches[0];
        if (hasIncompleteTasks(bestMatch)) {
            return bestMatch;
        }

        // If all matching categories for the current window are 100% completed,
        // advance to the next upcoming category that still has incomplete tasks!
        const bestMatchIdx = categories.indexOf(bestMatch);
        for (let i = bestMatchIdx + 1; i < categories.length; i++) {
            if (hasIncompleteTasks(categories[i])) {
                return categories[i];
            }
        }
        return bestMatch;
    }

    // 2. If `now` falls outside defined ranges (e.g. between 12 AM - 6 AM), pick the next upcoming incomplete category
    const upcoming = categories.find(cat => {
        const range = categoryTimeRanges[cat];
        return range && range.start > now && hasIncompleteTasks(cat);
    });
    if (upcoming) return upcoming;

    const firstIncomplete = categories.find(cat => hasIncompleteTasks(cat));
    return firstIncomplete || categories[0];
};

export const getAvailableCategories = () => Object.keys(categoryConfig);
export const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag", "Gamepad2", "Eye", "PenTool", "Smartphone", "Car", "Tv", "Apple", "ShowerHead", "Truck", "FileCode", "PenSquare", "Puzzle", "Lightbulb", "Presentation", "BarChart", "ShoppingCart", "Headphones", "Power", "Map", "Wand2", "Camera", "Briefcase", "Megaphone", "Stethoscope", "Laptop", "Code", "FlaskConical", "School", "Network", "GraduationCap", "TrendingUp", "Package", "ClipboardList"];


export const applyMoversTemplate = (
    baseTasks: ReadonlyArray<Omit<UserPresetTask, "id" | "order" | "profession">>,
    template: 'morning_primer' | 'evening_restorer' = 'morning_primer'
): Omit<UserPresetTask, "id" | "order" | "profession">[] => {
    // Filter out existing redundant morning/evening wrappers while preserving Evening Wind-down
    const filteredBase = baseTasks.filter(t => {
        const n = t.name.toLowerCase();
        const cat = (t.category || '').toLowerCase();
        if (cat === 'evening wind-down') return false; // Will be re-added cleanly in chronological order
        if (cat === 'bedtime routine') return false;
        return !n.includes('morning kickstart') &&
               !n.includes('morning primer') &&
               !n.includes('evening restorer') &&
               !n.includes('reading a book') &&
               !n.includes('journaling') &&
               !n.includes('meditation');
    });

    if (template === 'evening_restorer') {
        // Evening Restorer: (E) at wake-up; 7-9 PM Evening Wind-down; (M + O + V + R + S) in a consolidated recovery block before sleep
        const morningActivation: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
            { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Activation" },
            { name: "Morning Exercise & Physical Activation (E)", duration: 20, icon: "Dumbbell", category: "Morning Activation" },
            { name: "Morning Hydration & Shower", duration: 15, icon: "ShowerHead", category: "Morning Activation" },
            { name: "Set table & Energizing Breakfast", duration: 25, icon: "Utensils", category: "Morning Activation" },
        ];

        const eveningRestorerBlock: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
            ...commonEveningWindDown,
            { name: "Evening Unwind Meditation (M)", duration: 10, icon: "BrainCircuit", category: "Evening Restorer Block" },
            { name: "Deep Box Breathing & Oxygenation (O)", duration: 3, icon: "Wind", category: "Evening Restorer Block" },
            { name: "Tomorrow's Visualization & Intention Setting (V)", duration: 10, icon: "Target", category: "Evening Restorer Block" },
            { name: "Reading Positive & Uplifting Books (R)", duration: 25, icon: "BookOpen", category: "Evening Restorer Block" },
            { name: "Reflective Scribing & Gratitude Journal (S)", duration: 15, icon: "PenSquare", category: "Evening Restorer Block" },
            { name: "Hygiene & Bed Preparation for Sleep", duration: 10, icon: "Bed", category: "Bedtime Routine" },
        ];

        return enrichTasks([...morningActivation, ...filteredBase, ...eveningRestorerBlock]);
    } else {
        // Morning Primer: (M + O + V + E) before core work; 7-9 PM Evening Wind-down; (R + S) at day's end
        const morningPrimerBlock: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
            { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Primer" },
            { name: "Morning Centering Meditation (M)", duration: 10, icon: "BrainCircuit", category: "Morning Primer" },
            { name: "Deep Breathing & Morning Hydration (O)", duration: 3, icon: "Wind", category: "Morning Primer" },
            { name: "Daily Visualization & Mental Rehearsal (V)", duration: 10, icon: "Target", category: "Morning Primer" },
            { name: "Energizing Exercise & Movement (E)", duration: 15, icon: "Dumbbell", category: "Morning Primer" },
            { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Morning Primer" },
            { name: "Set table & Nutritious Breakfast", duration: 25, icon: "Utensils", category: "Morning Primer" },
        ];

        const daysEndRecovery: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
            ...commonEveningWindDown,
            { name: "Reading Positive & Mindset Expansion (R)", duration: 25, icon: "BookOpen", category: "Day's End Recovery" },
            { name: "Scribing & Evening Reflection Journal (S)", duration: 15, icon: "PenSquare", category: "Day's End Recovery" },
            { name: "Setting bed & room prep for night", duration: 5, icon: "Bed", category: "Bedtime Routine" },
        ];

        return enrichTasks([...morningPrimerBlock, ...filteredBase, ...daysEndRecovery]);
    }
};
