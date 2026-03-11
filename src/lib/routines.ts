import type { UserPresetTask, ProfileType } from '@/types';

// Version for the default routines data structure
export const ROUTINE_TEMPLATE_VERSION = '1.5';

const contentCreatorRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Kickstart" },
    { name: "Deep Breathing", duration: 3, icon: "Wind", category: "Morning Kickstart" },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Morning Kickstart" },
    { name: "Morning warm-up workout", duration: 15, icon: "Dumbbell", category: "Morning Kickstart" },
    { name: "Set the table", duration: 5, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Pre-Production" },
    { name: "Plan Day's Content & Scripting", duration: 90, icon: "FileCode", category: "Pre-Production" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Pre-Production" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Production Block" },
    { name: "Recording/Filming Session", duration: 120, icon: "Camera", category: "Production Block" },
    { name: "Set the table", duration: 5, icon: "Utensils", category: "Production Block" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Production" },
    { name: "Video Editing & Thumbnails", duration: 150, icon: "Smartphone", category: "Post-Production" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Post-Production" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Post-Production" },
    { name: "Evening warm-up workout", duration: 15, icon: "Dumbbell", category: "Evening & Close" },
    { name: "Snacks & Hydration", duration: 15, icon: "Coffee", category: "Evening & Close" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening & Close" },
    { name: "Set the table", duration: 5, icon: "Utensils", category: "Evening & Close" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening & Close" },
    { name: "Deep Breathing", duration: 3, icon: "Wind", category: "Evening & Close" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Evening & Close" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening & Close" },
];

const designerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Kickstart" },
    { name: "Morning warm-up workout", duration: 15, icon: "Dumbbell", category: "Morning Kickstart" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Pre-Production" },
    { name: "Mood Boarding & Planning", duration: 60, icon: "Palette", category: "Pre-Production" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Pre-Production" },
    { name: "Work Block: Wireframing", duration: 120, icon: "PenTool", category: "Production Block" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Work Block: UI/UX Design", duration: 150, icon: "Laptop", category: "Post-Production" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Post-Production" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening & Close" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Evening & Close" },
];

const artistRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Kickstart" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Sketching & Research", duration: 90, icon: "Palette", category: "Pre-Production" },
    { name: "Painting / Sculpting Session", duration: 120, icon: "Wand2", category: "Production Block" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Gallery Prep & Coloring", duration: 150, icon: "PenTool", category: "Post-Production" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening & Close" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Evening & Close" },
];

const writerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Morning Kickstart" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Kickstart" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "Morning Kickstart" },
    { name: "Drafting & Brainstorming", duration: 90, icon: "FileCode", category: "Pre-Production" },
    { name: "Focused Writing Session", duration: 120, icon: "BookOpen", category: "Production Block" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Production Block" },
    { name: "Editing & Research", duration: 150, icon: "PenSquare", category: "Post-Production" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening & Close" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Evening & Close" },
];

const softwareEngineerRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "System Initialization" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "System Initialization" },
    { name: "Meditation & Breathing", duration: 13, icon: "Wind", category: "System Initialization" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "System Initialization" },
    { name: "Set the table & Breakfast", duration: 30, icon: "Utensils", category: "System Initialization" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Sync & Sprint" },
    { name: "Daily Stand-up & PR Reviews", duration: 45, icon: "Users", category: "Sync & Sprint" },
    { name: "Deep Coding Block", duration: 120, icon: "Code", category: "Sync & Sprint" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Sync & Sprint" },
    { name: "Set the table & Lunch", duration: 30, icon: "Utensils", category: "Architecture & Logic" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Architecture & Logic" },
    { name: "Debugging & Documentation", duration: 90, icon: "FileCode", category: "Architecture & Logic" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Architecture & Logic" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Architecture & Logic" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Deployment & Decompression" },
    { name: "Snacks", duration: 15, icon: "Coffee", category: "Deployment & Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Deployment & Decompression" },
    { name: "Set the table & Dinner", duration: 30, icon: "Utensils", category: "Deployment & Decompression" },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Deployment & Decompression" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Deployment & Decompression" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Deployment & Decompression" },
];

const medicalRepRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Field Prep" },
    { name: "Hydration & Meditation", duration: 12, icon: "BrainCircuit", category: "Field Prep" },
    { name: "Morning warm-up", duration: 10, icon: "Dumbbell", category: "Field Prep" },
    { name: "Breakfast (Set table)", duration: 25, icon: "Utensils", category: "Field Prep" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Clinic Visits" },
    { name: "Hospital/Clinic Route", duration: 180, icon: "Map", category: "Clinic Visits" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Clinic Visits" },
    { name: "Lunch (Set table)", duration: 30, icon: "Utensils", category: "Product Demos & Reporting" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Product Demos & Reporting" },
    { name: "Sales Pitch & CRM Updates", duration: 120, icon: "Briefcase", category: "Product Demos & Reporting" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Product Demos & Reporting" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Product Demos & Reporting" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Inventory & Relax" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Inventory & Relax" },
    { name: "Dinner (Set table)", duration: 30, icon: "Utensils", category: "Inventory & Relax" },
    { name: "Meditation", duration: 10, icon: "BrainCircuit", category: "Inventory & Relax" },
    { name: "Bed setup & Water", duration: 6, icon: "Bed", category: "Inventory & Relax" },
];

const entrepreneurRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Visionary Morning" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Visionary Morning" },
    { name: "Meditation & Breathing", duration: 15, icon: "Wind", category: "Visionary Morning" },
    { name: "Morning warm-up workout", duration: 20, icon: "Dumbbell", category: "Visionary Morning" },
    { name: "Set the table & Breakfast", duration: 30, icon: "Utensils", category: "Visionary Morning" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Strategic Execution" },
    { name: "Investor/Team Meetings", duration: 120, icon: "Users", category: "Strategic Execution" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Strategic Execution" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Strategic Execution" },
    { name: "Set the table & Lunch", duration: 40, icon: "Utensils", category: "Operations" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Operations" },
    { name: "Business Development", duration: 120, icon: "Briefcase", category: "Operations" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Operations" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Operations" },
    { name: "Evening warm-up", duration: 15, icon: "Dumbbell", category: "Networking & Rest" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Networking & Rest" },
    { name: "Set the table & Dinner", duration: 30, icon: "Utensils", category: "Networking & Rest" },
    { name: "Meditation & Night Prep", duration: 15, icon: "BrainCircuit", category: "Networking & Rest" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Networking & Rest" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Networking & Rest" },
];

const studentRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "Learning Ready" },
    { name: "Water & Breathing", duration: 5, icon: "Droplets", category: "Learning Ready" },
    { name: "Morning warm-up", duration: 15, icon: "Dumbbell", category: "Learning Ready" },
    { name: "Set the table & Breakfast", duration: 25, icon: "Utensils", category: "Learning Ready" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Academics I" },
    { name: "Lectures/Self-Study", duration: 150, icon: "GraduationCap", category: "Academics I" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Academics I" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Academics I" },
    { name: "Lunch (Set table)", duration: 30, icon: "Utensils", category: "Academics II" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Academics II" },
    { name: "Assignments/Research", duration: 120, icon: "BookOpen", category: "Academics II" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Academics II" },
    { name: "Eye strain exercise", duration: 2, icon: "Eye", category: "Academics II" },
    { name: "Evening warm-up", duration: 20, icon: "Dumbbell", category: "Review & Rest" },
    { name: "Snacks & Water", duration: 15, icon: "Coffee", category: "Review & Rest" },
    { name: "Set the table & Dinner", duration: 30, icon: "Utensils", category: "Review & Rest" },
    { name: "Meditation & Reading", duration: 20, icon: "Wind", category: "Review & Rest" },
    { name: "Set bed & Final Water", duration: 6, icon: "Bed", category: "Review & Rest" },
];

const generalDetailedRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Prep" },
    { name: "Set Table & Breakfast", duration: 25, icon: "Utensils", category: "Morning Prep" },
    { name: "Personal Grooming", duration: 15, icon: "ShowerHead", category: "Morning Prep" },
    { name: "Client Work / Admin Tasks", duration: 120, icon: "Laptop", category: "Work & Focus" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Work & Focus" },
    { name: "Lunch Break", duration: 30, icon: "Utensils", category: "Breaks & Meals" },
    { name: "Focused Session", duration: 120, icon: "BrainCircuit", category: "Work & Focus" },
    { name: "Evening Exercise", duration: 45, icon: "Dumbbell", category: "Health & Wellness" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
    { name: "Wind Down & Read", duration: 45, icon: "BookOpen", category: "Bedtime Routine" },
];


const dayOffRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Prep" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Prep" },
    { name: "Leisurely Breakfast", duration: 30, icon: "Coffee", category: "Morning Prep" },
    { name: "Run errands, appointments, groceries", duration: 90, icon: "ShoppingCart", category: "Work & Focus" },
    { name: "Dedicate time to a relaxing hobby", duration: 60, icon: "Gamepad2", category: "Health & Wellness" },
    { name: "Connect with friends or family", duration: 60, icon: "Users", category: "Health & Wellness" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
    { name: "Relaxing entertainment", duration: 60, icon: "Tv", category: "Evening Wind-down" },
    { name: "Consistent bedtime routine", duration: 30, icon: "Bed", category: "Bedtime Routine" },
];

const dayOffRoutineHealthcare: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Morning Prep" },
    { name: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", category: "Morning Prep" },
    { name: "Leisurely Breakfast", duration: 30, icon: "Coffee", category: "Morning Prep" },
    { name: "Run errands, appointments, groceries", duration: 90, icon: "ShoppingCart", category: "Work & Focus" },
    { name: "Dedicate time to a relaxing hobby", duration: 60, icon: "Gamepad2", category: "Health & Wellness" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "Evening Wind-down" },
    { name: "Mindful Dinner", duration: 30, icon: "Utensils", category: "Evening Wind-down" },
    { name: "Journaling to unload stress", duration: 10, icon: "BookOpen", category: "Evening Wind-down" },
    { name: "Consistent bedtime routine", duration: 30, icon: "Bed", category: "Bedtime Routine" },
];

const healthcareProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "System Initialization" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "System Initialization" },
    { name: "Morning warm-up workout", duration: 15, icon: "Dumbbell", category: "System Initialization" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "System Initialization" },
    { name: "Patient Care Session I", duration: 150, icon: "Stethoscope", category: "Sync & Sprint" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Sync & Sprint" },
    { name: "Patient Care Session II", duration: 120, icon: "Stethoscope", category: "Architecture & Logic" },
    { name: "Medical Records & Admin", duration: 90, icon: "FileCode", category: "Architecture & Logic" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Deployment & Decompression" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Deployment & Decompression" },
];

const itProfessionalRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "System Initialization" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "System Initialization" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "System Initialization" },
    { name: "Server Maintenance & Security", duration: 120, icon: "Server", category: "Sync & Sprint" },
    { name: "IT Support & Troubleshooting", duration: 90, icon: "Wrench", category: "Sync & Sprint" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Sync & Sprint" },
    { name: "System Monitoring & Documentation", duration: 150, icon: "Laptop", category: "Architecture & Logic" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Deployment & Decompression" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Deployment & Decompression" },
];

const researcherRoutine: Omit<UserPresetTask, "id" | "order" | "profession">[] = [
    { name: "Set the bed", duration: 5, icon: "Bed", category: "System Initialization" },
    { name: "Drink a glass of water", duration: 1, icon: "Droplets", category: "System Initialization" },
    { name: "Breakfast", duration: 25, icon: "Utensils", category: "System Initialization" },
    { name: "Lab Work & Experimentation", duration: 150, icon: "FlaskConical", category: "Sync & Sprint" },
    { name: "Lunch", duration: 30, icon: "Utensils", category: "Sync & Sprint" },
    { name: "Data Analysis & Literature Review", duration: 150, icon: "BookOpen", category: "Architecture & Logic" },
    { name: "Dinner", duration: 30, icon: "Utensils", category: "Deployment & Decompression" },
    { name: "Setting bed for night", duration: 5, icon: "Bed", category: "Deployment & Decompression" },
];

export const defaultRoutines: { version: string, routines: { [key in ProfileType]: Omit<UserPresetTask, "id" | "order" | "profession">[] } } = {
    version: ROUTINE_TEMPLATE_VERSION,
    routines: {
        "Analyst": softwareEngineerRoutine,
        "Artist": artistRoutine,
        "Consultant": entrepreneurRoutine,
        "Content Creator": contentCreatorRoutine,
        "Designer": designerRoutine,
        "Educator": generalDetailedRoutine,
        "Entrepreneur": entrepreneurRoutine,
        "Freelancer": generalDetailedRoutine,
        "Healthcare Professional": healthcareProfessionalRoutine,
        "Day Off - Analyst": dayOffRoutine,
        "Day Off - Healthcare": dayOffRoutineHealthcare,
        "Admin Day - On The Go": entrepreneurRoutine,
        "Day Off": dayOffRoutine,
        "IT Professional": itProfessionalRoutine,
        "Manager": entrepreneurRoutine,
        "Marketer": entrepreneurRoutine,
        "Researcher": researcherRoutine,
        "Sales": medicalRepRoutine,
        "Software Engineer": softwareEngineerRoutine,
        "Student": studentRoutine,
        "Writer": writerRoutine,
        "Medical Representative": medicalRepRoutine,
        "Delivery Agent": medicalRepRoutine,
        "General": generalDetailedRoutine
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
    
    // Technical Professional
    'System Initialization': { color: 'bg-amber-800 text-white', order: 1 },
    'Sync & Sprint': { color: 'bg-orange-800 text-white', order: 2 },
    'Architecture & Logic': { color: 'bg-rose-800 text-white', order: 3 },
    'Deployment & Decompression': { color: 'bg-indigo-800 text-white', order: 4 },
    
    // Business Professional
    'Visionary Morning': { color: 'bg-sky-800 text-white', order: 1 },
    'Strategic Execution': { color: 'bg-blue-900 text-white', order: 2 },
    'Operations': { color: 'bg-emerald-800 text-white', order: 3 },
    'Networking & Rest': { color: 'bg-slate-900 text-white', order: 4 },
    
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

    // Fallbacks
    'Morning Routine': { color: 'bg-sky-800 text-white', order: 1 },
    'Work & Focus': { color: 'bg-emerald-800 text-white', order: 2 },
    'Breaks & Meals': { color: 'bg-orange-800 text-white', order: 3 },
    'Health & Wellness': { color: 'bg-rose-800 text-white', order: 4 },
    'Evening Wind-down': { color: 'bg-indigo-800 text-white', order: 5 },
    'Bedtime Routine': { color: 'bg-slate-800 text-white', order: 6 },
    'Default': { color: 'bg-slate-800 text-white', order: 99 },
};

export const getAvailableCategories = () => Object.keys(categoryConfig);
export const getAvailableIcons = () => ["ListChecks", "Bed", "StretchHorizontal", "Dumbbell", "BrainCircuit", "Mail", "Users", "Coffee", "Footprints", "Wind", "Droplets", "BookOpen", "Utensils", "Target", "Wrench", "ShoppingBag", "Gamepad2", "Eye", "PenTool", "Smartphone", "Car", "Tv", "Apple", "ShowerHead", "Truck", "FileCode", "PenSquare", "Puzzle", "Lightbulb", "Presentation", "BarChart", "ShoppingCart", "Headphones", "Power", "Map", "Wand2", "Camera", "Briefcase", "Megaphone", "Stethoscope", "Laptop", "Code", "FlaskConical", "School", "Network", "GraduationCap", "TrendingUp", "Package"];
