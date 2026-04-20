import type { UserPresetTask, ProfileType } from '@/types';

export const ROUTINE_TEMPLATE_VERSION = 9.0;

const commonEveningWindDown: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Evening Snacks & Hydration", duration: 15, icon: "Coffee", category: "Evening Wind-down" },
    { name: "Dinner", duration: 35, icon: "Utensils", category: "Evening Wind-down" },
    { name: "Deep Breathing & Relax", duration: 15, icon: "Wind", category: "Evening Wind-down" },
];

const commonBedtimeRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Reading a book & Learning", duration: 30, icon: "BookOpen", category: "Bedtime Routine" },
    { name: "Hygiene & Skincare", duration: 15, icon: "ShowerHead", category: "Bedtime Routine" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Bedtime Routine" },
    { name: "Final Journaling & Goal Setting", duration: 10, icon: "PenSquare", category: "Bedtime Routine" },
];

const contentCreatorRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Deep Breathing & Morning Hydration", duration: 4, icon: "Wind", category: "Morning Kickstart" },
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
    { name: "Meditation & Breathing", duration: 13, icon: "Wind", category: "Pre-Production" },
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
    { name: "Breathing & Morning Hydration", duration: 16, icon: "Wind", category: "Morning Kickstart" },
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
    { name: "Breathing & Morning Hydration", duration: 14, icon: "Wind", category: "System Initialization" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "System Initialization" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "System Initialization" },
    { name: "Set table & Breakfast", duration: 30, icon: "Utensils", category: "System Initialization" },
    { name: "Deep Focus Coding Session", duration: 120, icon: "Code", category: "Sync & Sprint" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Sync & Sprint" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Architecture & Logic" },
    { name: "PR Reviews & Bug Fixing", duration: 90, icon: "FileCode", category: "Architecture & Logic" },
    { name: "Architecture & Logic Flow", duration: 60, icon: "BrainCircuit", category: "Architecture & Logic" },
    { name: "Documentation & Deployment", duration: 60, icon: "Laptop", category: "Deployment & Decompression" },
    { name: "Side Project / OSS Contribution", duration: 90, icon: "Puzzle", category: "Late Hustle" },
    { name: "Learning new Frameworks", duration: 45, icon: "BookOpen", category: "Late Hustle" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Deployment & Decompression" },
    ...commonEveningWindDown,
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
    { name: "Inbox Zero & Communications", duration: 45, icon: "Mail", category: "Late Hustle" },
    { name: "Analytics & Growth Metric Review", duration: 30, icon: "TrendingUp", category: "Late Hustle" },
    { name: "Next Day Strategy Planning", duration: 30, icon: "Target", category: "Late Hustle" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Networking & Rest" },
    ...commonEveningWindDown,
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
    { name: "Morning Hydration & Breathing", duration: 6, icon: "Wind", category: "Retention" },
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
    { name: "Upskilling & Coursework", duration: 60, icon: "BrainCircuit", category: "Late Hustle" },
    { name: "Portfolio Updates", duration: 30, icon: "FolderSync", category: "Late Hustle" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Close Out" },
    ...commonEveningWindDown,
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
    { name: "Meditation & Deep Breathing", duration: 15, icon: "Wind", category: "Morning Prep" },
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
    { name: "Deep Breathing & Meditation", duration: 15, icon: "Wind", category: "Morning Prep" },
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
    { name: "Morning Hydration & Breathing", duration: 5, icon: "Wind", category: "Preparation" },
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
    { name: "Morning Hydration & Breathing", duration: 5, icon: "Wind", category: "Hypothesis" },
    { name: "Morning warm-up", duration: 15, icon: "Dumbbell", category: "Hypothesis" },
    { name: "Freshen up & Take a shower", duration: 20, icon: "ShowerHead", category: "Hypothesis" },
    { name: "Set table & Breakfast", duration: 25, icon: "Utensils", category: "Hypothesis" },
    { name: "Experimental Data Collection", duration: 150, icon: "FlaskConical", category: "Lab Session" },
    { name: "Data Interpretation & Synthesis", duration: 120, icon: "Laptop", category: "Computation" },
    { name: "Eye strain & Hydration", duration: 5, icon: "Eye", category: "Computation" },
    { name: "Set table & Lunch", duration: 30, icon: "Utensils", category: "Analysis" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Peer Review" },
    ...commonEveningWindDown,
    ...commonBedtimeRoutine,
];
const enrichTasks = (tasks: ReadonlyArray<Omit<UserPresetTask, "id" | "order" | "profession">>) => {
    const cleanedTasks = tasks.map(t => ({...t})).filter(t => 
        !t.name.toLowerCase().includes('hydration') && 
        !t.name.toLowerCase().includes('rehydrate') && 
        !t.name.toLowerCase().includes('eye strain') && 
        !t.name.toLowerCase().includes('visual rest')
    );

    const enrichedTasks: Omit<UserPresetTask, "id" | "order" | "profession">[] = [];
    
    let waterCount = 0;
    let eyeCount = 0;
    let entertainmentCount = 0;
    const totalWaters = 8;
    const totalEyes = 4;
    const totalEntertainment = 3; // Scheduled leisure slots

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

        // Add entertainment/gaming slots around 33%, 66% and 90% through the routine
        const expectedEnt = Math.floor(((i + 1) / cleanedTasks.length) * (totalEntertainment + 1));
        if (entertainmentCount < expectedEnt && entertainmentCount < totalEntertainment) {
            entertainmentCount++;
            let leisureTask;
            if (entertainmentCount === 1) {
                leisureTask = { name: "Visual Pleasure/Gaming (Morning Break)", duration: 15, icon: "Gamepad2", category: "Entertainment & Gaming" };
            } else if (entertainmentCount === 2) {
                leisureTask = { name: "Digital Entertainment Session", duration: 20, icon: "Tv", category: "Entertainment & Gaming" };
            } else {
                leisureTask = { name: "Gaming/Creative Leisure (Unwind)", duration: 25, icon: "Gamepad2", category: "Entertainment & Gaming" };
            }
            enrichedTasks.push(leisureTask);
        }
    }

    return enrichedTasks;
};
export const defaultRoutines: { version: number, routines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order" | "profession">[] } } = {
    version: 9.0,
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

export const categoryConfig: { [key: string]: { color: string, order: number } } = {
    // Creative Professional
    'Morning Kickstart': { color: 'bg-indigo-800 text-white', order: 1 },
    'Pre-Production': { color: 'bg-blue-800 text-white', order: 2 },
    'Production Block': { color: 'bg-cyan-800 text-white', order: 3 },
    'Post-Production': { color: 'bg-purple-800 text-white', order: 4 },
    'Evening & Close': { color: 'bg-slate-800 text-white', order: 5 },
    'Concept Phase': { color: 'bg-indigo-800 text-white', order: 1 },
    'Visual Research': { color: 'bg-blue-800 text-white', order: 2 },
    'Interface Design': { color: 'bg-cyan-800 text-white', order: 3 },
    'Iteration': { color: 'bg-purple-800 text-white', order: 4 },
    'Morning Flow': { color: 'bg-indigo-800 text-white', order: 1 },
    'Studio Foundation': { color: 'bg-blue-800 text-white', order: 2 },
    'Execution': { color: 'bg-cyan-800 text-white', order: 3 },
    'Management': { color: 'bg-purple-800 text-white', order: 4 },
    'Reflection': { color: 'bg-slate-800 text-white', order: 5 },
    'Early Draft': { color: 'bg-indigo-800 text-white', order: 1 },
    'Research Block': { color: 'bg-blue-800 text-white', order: 2 },
    'Core Writing': { color: 'bg-cyan-800 text-white', order: 3 },
    'Polishing': { color: 'bg-purple-800 text-white', order: 4 },
    'Creative Rest': { color: 'bg-slate-800 text-white', order: 5 },
    
    // Technical Professional
    'System Initialization': { color: 'bg-amber-800 text-white', order: 1 },
    'Sync & Sprint': { color: 'bg-orange-800 text-white', order: 2 },
    'Architecture & Logic': { color: 'bg-rose-800 text-white', order: 3 },
    'Deployment & Decompression': { color: 'bg-indigo-800 text-white', order: 4 },
    'Boot Sequence': { color: 'bg-amber-800 text-white', order: 1 },
    'Deep Logic': { color: 'bg-orange-800 text-white', order: 2 },
    'Sync & Lunch': { color: 'bg-rose-800 text-white', order: 3 },
    'Architecture': { color: 'bg-indigo-800 text-white', order: 4 },
    'Maintenance': { color: 'bg-slate-800 text-white', order: 5 },
    'Rest Mode': { color: 'bg-slate-900 text-white', order: 6 },
    'Preparation': { color: 'bg-teal-800 text-white', order: 1 },
    'Clinical Rounds': { color: 'bg-blue-800 text-white', order: 2 },
    'Nutrition': { color: 'bg-indigo-800 text-white', order: 3 },
    'Updates': { color: 'bg-purple-800 text-white', order: 4 },
    'Decompression': { color: 'bg-slate-800 text-white', order: 5 },
    'Monitoring': { color: 'bg-amber-800 text-white', order: 1 },
    'Infrastructure': { color: 'bg-orange-800 text-white', order: 2 },
    'Troubleshooting': { color: 'bg-rose-800 text-white', order: 3 },
    'Tickets': { color: 'bg-indigo-800 text-white', order: 4 },
    'System Lock': { color: 'bg-slate-800 text-white', order: 5 },
    'Hypothesis': { color: 'bg-emerald-800 text-white', order: 1 },
    'Lab Session': { color: 'bg-blue-800 text-white', order: 2 },
    'Analysis': { color: 'bg-indigo-800 text-white', order: 3 },
    'Computation': { color: 'bg-purple-800 text-white', order: 4 },
    'Peer Review': { color: 'bg-slate-800 text-white', order: 5 },
    
    // Business Professional
    'Visionary Morning': { color: 'bg-sky-800 text-white', order: 1 },
    'Strategic Execution': { color: 'bg-blue-900 text-white', order: 2 },
    'Operations': { color: 'bg-emerald-800 text-white', order: 3 },
    'Late Hustle': { color: 'bg-rose-900 text-white', order: 4 },
    'Networking & Rest': { color: 'bg-slate-900 text-white', order: 5 },
    'Vision Block': { color: 'bg-sky-800 text-white', order: 1 },
    'High Stakes': { color: 'bg-blue-900 text-white', order: 2 },
    'Operation': { color: 'bg-emerald-800 text-white', order: 3 },
    'Business Development': { color: 'bg-indigo-800 text-white', order: 4 },
    'Networking': { color: 'bg-slate-900 text-white', order: 5 },
    'Route Planning': { color: 'bg-teal-800 text-white', order: 1 },
    'Field Execution': { color: 'bg-blue-800 text-white', order: 2 },
    'Review': { color: 'bg-indigo-800 text-white', order: 3 },
    'CRM Reporting': { color: 'bg-purple-800 text-white', order: 4 },
    'Inventory': { color: 'bg-slate-800 text-white', order: 5 },
    'Discovery': { color: 'bg-sky-800 text-white', order: 1 },
    'Recommendations': { color: 'bg-emerald-800 text-white', order: 3 },
    'Deliverables': { color: 'bg-indigo-800 text-white', order: 4 },
    'Strategy Sync': { color: 'bg-slate-900 text-white', order: 5 },
    'Allocation': { color: 'bg-sky-800 text-white', order: 1 },
    'Personnel': { color: 'bg-blue-900 text-white', order: 2 },
    'Reporting': { color: 'bg-emerald-800 text-white', order: 3 },
    'Coordination': { color: 'bg-indigo-800 text-white', order: 4 },
    'Analytics': { color: 'bg-sky-800 text-white', order: 1 },
    'Campaigns': { color: 'bg-pink-800 text-white', order: 2 },
    'Creative Flow': { color: 'bg-rose-800 text-white', order: 3 },
    'Content Strategy': { color: 'bg-purple-800 text-white', order: 4 },
    'Engagement': { color: 'bg-slate-900 text-white', order: 5 },
    'Prospecting': { color: 'bg-sky-800 text-white', order: 1 },
    'Outreach': { color: 'bg-blue-900 text-white', order: 2 },
    'Negotiation': { color: 'bg-emerald-800 text-white', order: 3 },
    'Closings': { color: 'bg-indigo-800 text-white', order: 4 },
    'Pipeline Review': { color: 'bg-slate-900 text-white', order: 5 },
    
    // Medical Rep / On-the-Go
    'Field Prep': { color: 'bg-teal-800 text-white', order: 1 },
    'Clinic Visits': { color: 'bg-blue-800 text-white', order: 2 },
    'Product Demos & Reporting': { color: 'bg-indigo-800 text-white', order: 3 },
    'Inventory & Relax': { color: 'bg-purple-800 text-white', order: 4 },
    
    // Student
    'Learning Ready': { color: 'bg-sky-800 text-white', order: 1 },
    'Academics I': { color: 'bg-blue-800 text-white', order: 2 },
    'Academics II': { color: 'bg-indigo-800 text-white', order: 3 },
    'Review & Rest': { color: 'bg-purple-800 text-white', order: 4 },
    'Retention': { color: 'bg-sky-800 text-white', order: 1 },
    'Focus Block': { color: 'bg-blue-800 text-white', order: 2 },
    'Academic Application': { color: 'bg-indigo-800 text-white', order: 3 },
    'Extracurricular': { color: 'bg-purple-800 text-white', order: 4 },
    'Mastery': { color: 'bg-slate-900 text-white', order: 5 },

    // Education & Others
    'Lesson Logic': { color: 'bg-sky-800 text-white', order: 1 },
    'Instruction': { color: 'bg-blue-800 text-white', order: 2 },
    'Evaluation': { color: 'bg-emerald-800 text-white', order: 3 },
    'Grading': { color: 'bg-orange-800 text-white', order: 4 },
    'Prep': { color: 'bg-slate-800 text-white', order: 5 },
    'Pipeline': { color: 'bg-sky-800 text-white', order: 1 },
    'Billable Work': { color: 'bg-indigo-800 text-white', order: 2 },
    'Fuel': { color: 'bg-orange-800 text-white', order: 3 },
    'Admin': { color: 'bg-purple-800 text-white', order: 4 },
    'Close Out': { color: 'bg-slate-900 text-white', order: 5 },
    'Domestic Start': { color: 'bg-sky-800 text-white', order: 1 },
    'Daily Admin': { color: 'bg-emerald-800 text-white', order: 2 },
    'midday': { color: 'bg-orange-800 text-white', order: 3 },
    'Skills/Hobbies': { color: 'bg-rose-800 text-white', order: 4 },
    'Wrap Up': { color: 'bg-indigo-800 text-white', order: 5 },

    // Fallbacks
    'Morning Routine': { color: 'bg-sky-800 text-white', order: 1 },
    'Work & Focus': { color: 'bg-emerald-800 text-white', order: 2 },
    'Breaks & Meals': { color: 'bg-orange-800 text-white', order: 3 },
    'Health & Wellness': { color: 'bg-rose-800 text-white', order: 4 },
    'Evening Wind-down': { color: 'bg-indigo-800 text-white', order: 5 },
    'Bedtime Routine': { color: 'bg-slate-800 text-white', order: 6 },
    'Entertainment & Gaming': { color: 'bg-indigo-900 text-white', order: 6 },
    'Default': { color: 'bg-slate-800 text-white', order: 99 },
};

export const getAvailableCategories = () => Object.keys(categoryConfig);
export const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag", "Gamepad2", "Eye", "PenTool", "Smartphone", "Car", "Tv", "Apple", "ShowerHead", "Truck", "FileCode", "PenSquare", "Puzzle", "Lightbulb", "Presentation", "BarChart", "ShoppingCart", "Headphones", "Power", "Map", "Wand2", "Camera", "Briefcase", "Megaphone", "Stethoscope", "Laptop", "Code", "FlaskConical", "School", "Network", "GraduationCap", "TrendingUp", "Package", "ClipboardList"];
