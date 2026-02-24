import type { ProfileType } from "@/types";

const professionalGroups = {
    'Creative Professional': ["Artist", "Designer", "Writer", "Content Creator"],
    'Business Professional': ["Manager", "Consultant", "Marketer", "Entrepreneur", "Sales"],
    'Technical Professional': ["Software Engineer", "IT Professional", "Researcher", "Analyst"],
    'On-The-Go Professional': ["Medical Representative", "Delivery Agent"],
    'Healthcare Professional': ["Healthcare Professional"],
    'General/Other': ["Student", "Educator", "Freelancer", "General", "Day Off"]
};

const categorizationMap = {
    'Creative Professional': {
        'Productivity': ["Uninterrupted Deep Creative Work", "Inspiration & Research Block", "Skill Practice / Tutorial", "Admin & Client Communication", "Scripting & Content Planning", "Filming / Recording Session", "Editing & Post-Production", "Thumbnail Design & Uploads"],
        'Health': ["Light Stretching or Mobility", "Mindful Breakfast", "Mindful Meal", "Short Walk", "Main Exercise / Workout", "Mindful Dinner", "Workout / Physical Activity"],
        'Hydration': ["Drink a glass of water", "Drink a small glass of water"],
        'Mindfulness & Meditation': ["Morning Idea Dump / Journaling", "Final Idea Capture (on paper)", "Journal / Unwind"],
        'Entertainment & Hobbies': ["Relaxing Hobby", "Relax & Consume Content"],
        'Well-being & Social': ["Social Time with Family/Friends", "Digital Detox (no screens)", "Read Fiction or Listen to Calming Music", "Community Engagement", "Tidy Up Workspace", "Read / Disconnect"]
    },
    'Business Professional': {
        'Productivity': ["Review Day's Top 3 Priorities", "Tackle Most Important Task", "Strategic Thinking / 'No-Meeting' Block", "Meetings & Collaborative Tasks", "Scan & Reply to Emails", "End-of-Day Review & Shutdown Ritual", "Prepare for the Next Day", "Networking & Outreach", "Financial Review", "Pipeline Management", "Follow-ups & Nurturing", "Client Demos & Meetings"],
        'Health': ["Workout/Exercise", "Breakfast & Scan News", "Power Lunch / Quick Walk", "Dinner with Family/Friends", "High-Intensity Workout", "Short Break", "Mindful Rest"],
        'Hydration': ["Drink a glass of water", "Quick Water Break"],
        'Mindfulness & Meditation': ["Meditation for Stress Release"],
        'Entertainment & Hobbies': ["Hobby / Leisure"],
        'Well-being & Social': ["Light Reading (non-work related)", "Walk to Decompress"]
    },
    'Technical Professional': {
        'Productivity': ["Review Tech News / Documentation", "Deep Work Coding / Analysis Session", "Code Reviews / Meetings", "Writing Documentation", "Personal Project / Learning", "Plan coding session", "System Design & Architecture", "Push code & clean up"],
        'Health': ["Breakfast (no screens)", "Hourly 20-20-20 Eye Strain Break", "Screen-Free Lunch & Walk", "Strength Training or Cardio", "Mindful Dinner", "Stretching to relieve desk posture"],
        'Hydration': ["Drink a glass of water"],
        'Mindfulness & Meditation': ["Meditation for Focus"],
        'Entertainment & Hobbies': ["Analog Hobby (puzzles, music, etc.)"],
        'Well-being & Social': ["Strict Screen Cutoff (put phone away)", "Read a physical book", "No screens before bed"]
    },
    'On-The-Go Professional': { // This is a combined category now
        'Productivity': ["Route & Schedule Review", "Log Reports & Admin on Mobile", "Restock & Prep Bag/Vehicle for Tomorrow", "First Block of Client Visits", "Second Block of Client Visits", "Update CRM & Log Visits", "Follow-up Emails & Calls", "Vehicle Check & Load-out", "Morning Delivery Block", "Afternoon Delivery Block", "End of Day Unload & Debrief"],
        'Health': ["High-Energy Breakfast", "Packed Lunch Break", "Stretching for physical tension", "Warm shower to relax", "Dinner", "Light Stretch"],
        'Hydration': ["Drink a glass of water"],
        'Mindfulness & Meditation': ["In-Car Mental Reset (Between appointments)"],
        'Entertainment & Hobbies': ["Relax"],
        'Well-being & Social': ["Unwind After a Day of Driving"]
    },
     'Healthcare Professional': { // For shift days
        'Productivity': ["Stay vigilant and support team", "Patient Rounds & Care", "Charting & Patient Notes"],
        'Health': ["High-Energy Meal", "Eat small, healthy snacks", "Recovery Meal & Connect with Family", "Warm shower to signal 'end of day'", "Gentle Movement & Mental Prep"],
        'Hydration': ["Drink a glass of water", "Drink water & have a snack"],
        'Mindfulness & Meditation': ["Pre-Shift Mental Preparation", "During-Shift Micro-Reset", "Mindful Commute (calming music)"],
        'Well-being & Social': ["Connect with friends or family"]
    },
    'General/Other': { // For Day Off, Student, Educator, etc.
        'Productivity': ["Run errands, appointments, groceries", "Review class schedule & assignments", "Attend Class / Lecture", "Library Study Session 1", "Library Study Session 2", "Work on Assignments/Projects", "Pack bag for tomorrow"],
        'Health': ["Gentle Stretching or a walk", "Leisurely Breakfast", "Mindful Dinner", "Sports or Gym"],
        'Hydration': ["Drink a glass of water"],
        'Mindfulness & Meditation': ["Journaling to unload stress"],
        'Entertainment & Hobbies': ["Dedicate time to a relaxing hobby", "Relaxing entertainment"],
        'Well-being & Social': ["Connect with friends or family", "Consistent bedtime routine", "Socializing or Club Activities", "Light reading for fun"]
    }
};


export const categoryColors: { [key: string]: string } = {
  'Productivity': '#3b82f6', // blue-500
  'Health': '#22c55e', // green-500
  'Hydration': '#38bdf8', // sky-400
  'Mindfulness & Meditation': '#a855f7', // purple-500
  'Entertainment & Hobbies': '#f97316', // orange-500
  'Well-being & Social': '#f59e0b', // amber-500
  'Default': '#64748b', // slate-500
  'Uncategorized': '#94a3b8' // slate-400
};


function findProfessionalGroup(profile: ProfileType): keyof typeof categorizationMap {
    for (const group in professionalGroups) {
        if (professionalGroups[group as keyof typeof professionalGroups].includes(profile)) {
            // A bit of a type dance to make TypeScript happy
            const castedGroup = group as keyof typeof professionalGroups;
            return castedGroup as keyof typeof categorizationMap;
        }
    }
    return 'General/Other';
}

export function getTaskCategoryDetails(taskName: string, profile: ProfileType): { mainCategory: string; subCategory: string; } {
    const group = findProfessionalGroup(profile);
    const categories = categorizationMap[group];

    if (!categories) {
        return { mainCategory: 'Uncategorized', subCategory: 'Uncategorized' };
    }

    for (const mainCategory in categories) {
        const subCategories = categories[mainCategory as keyof typeof categories];
        if (subCategories.some(sub => taskName.toLowerCase().includes(sub.toLowerCase()))) {
            return { mainCategory, subCategory: taskName };
        }
    }

    // A special check for hydration as it's a common task
    if (taskName.toLowerCase().includes('drink a glass of water')) {
        return { mainCategory: 'Hydration', subCategory: taskName };
    }
    
    // Default fallback
    return { mainCategory: 'Productivity', subCategory: taskName };
}
