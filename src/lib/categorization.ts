import type { ProfileType, LifestyleCategory } from "@/types";

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
        'Hydration': ["Mindful Hydration", "Quick Water Break & Stretch"],
        'Mindfulness & Meditation': ["Morning Idea Dump / Journaling", "Final Idea Capture (on paper)", "Journal / Unwind"],
        'Entertainment & Hobbies': ["Relaxing Hobby", "Relax & Consume Content"],
        'Well-being & Social': ["Social Time with Family/Friends", "Digital Detox (no screens)", "Read Fiction or Listen to Calming Music", "Community Engagement", "Tidy Up Workspace", "Read / Disconnect"]
    },
    'Business Professional': {
        'Productivity': ["Review Day's Top 3 Priorities", "Tackle Most Important Task", "Strategic Thinking / 'No-Meeting' Block", "Meetings & Collaborative Tasks", "Scan & Reply to Emails", "End-of-Day Review & Shutdown Ritual", "Prepare for the Next Day", "Networking & Outreach", "Financial Review", "Pipeline Management", "Follow-ups & Nurturing", "Client Demos & Meetings"],
        'Health': ["Workout/Exercise", "Breakfast & Scan News", "Power Lunch / Quick Walk", "Dinner with Family/Friends", "High-Intensity Workout", "Short Break", "Mindful Rest"],
        'Hydration': ["Mindful Hydration", "Quick Water Break"],
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
        'Hydration': ["Quick Rehydration", "Hydrate & Healthy Snack"],
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


export const categoryColors: { [key in LifestyleCategory]: string } & { Default: string; Uncategorized: string } = {
  'Productivity': '#3b82f6', // blue-500
  'Hydration': '#38bdf8', // sky-400
  'Fitness': '#10b981', // emerald-500
  'Meditation': '#8b5cf6', // violet-500
  'Hygiene': '#ec4899', // pink-500
  'Creativity': '#f59e0b', // amber-500
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

export function getTaskCategoryDetails(taskName: string, profile: ProfileType): { mainCategory: LifestyleCategory; subCategory: string; } {
    const nameLower = taskName.toLowerCase();
    
    // 1. Hydration (water, hydration, rehydrate, drink, tea, coffee, etc.)
    if (nameLower.includes('water') || nameLower.includes('hydration') || nameLower.includes('rehydrate') || nameLower.includes('glass of water') || nameLower.includes('drink')) {
        return { mainCategory: 'Hydration', subCategory: taskName };
    }
    
    // 2. Fitness (workouts, exercises, stretching, cardio, morning flow, run, gym, flow, yoga, dumbbell, sports, physical)
    if (nameLower.includes('workout') || nameLower.includes('exercise') || nameLower.includes('gym') || nameLower.includes('stretching') || nameLower.includes('cardio') || nameLower.includes('morning flow') || nameLower.includes('stretch') || nameLower.includes('run') || nameLower.includes('walk') || nameLower.includes('yoga') || nameLower.includes('dumbbell') || nameLower.includes('sports') || nameLower.includes('physical') || nameLower.includes('oxygenation') || nameLower.includes('mobility')) {
        return { mainCategory: 'Fitness', subCategory: taskName };
    }
    
    // 3. Meditation (mindfulness, breathing, mental reset, deep breathing, breathing & relax, breath, journaling, idea dump, calm, relax, sleep, meditation, wind-down, bedtime, wind down)
    if (nameLower.includes('meditation') || nameLower.includes('breathing') || nameLower.includes('mindful') || nameLower.includes('reset') || nameLower.includes('journaling') || nameLower.includes('idea dump') || nameLower.includes('calm') || nameLower.includes('relax') || nameLower.includes('sleep') || nameLower.includes('wind-down') || nameLower.includes('wind down') || nameLower.includes('bedtime') || nameLower.includes('scribing') || nameLower.includes('breath') || nameLower.includes('reflection')) {
        return { mainCategory: 'Meditation', subCategory: taskName };
    }

    // 4. Hygiene (self-care, domestic setup, personal organization, set the bed, setting bed, freshen up, shower, wash, clean, tidy, meals, breakfast, lunch, dinner, eat, table, tidy up, kitchen, skincare, hygiene)
    if (nameLower.includes('self-care') || nameLower.includes('domestic') || nameLower.includes('hygiene') || nameLower.includes('skincare') || nameLower.includes('bed') || nameLower.includes('shower') || nameLower.includes('wash') || nameLower.includes('clean') || nameLower.includes('tidy') || nameLower.includes('meal') || nameLower.includes('breakfast') || nameLower.includes('lunch') || nameLower.includes('dinner') || nameLower.includes('eat') || nameLower.includes('table') || nameLower.includes('freshen') || nameLower.includes('kitchen') || nameLower.includes('grooming') || nameLower.includes('organization')) {
        return { mainCategory: 'Hygiene', subCategory: taskName };
    }

    // 5. Creativity (brainstorming, design, writing, dynamic writing, art, painting, drawing, sketching, creative, inspiration, storyboard, video editing, recording, filming, thumbnails, ideation, script, script writing, mood board, brainstorming)
    if (nameLower.includes('brainstorm') || nameLower.includes('design') || nameLower.includes('writing') || nameLower.includes('creative') || nameLower.includes('art') || nameLower.includes('paint') || nameLower.includes('draw') || nameLower.includes('sketch') || nameLower.includes('inspiration') || nameLower.includes('storyboard') || nameLower.includes('editing') || nameLower.includes('recording') || nameLower.includes('filming') || nameLower.includes('thumbnail') || nameLower.includes('ideation') || nameLower.includes('script') || nameLower.includes('mood') || nameLower.includes('craft') || nameLower.includes('concept') || nameLower.includes('music')) {
        return { mainCategory: 'Creativity', subCategory: taskName };
    }

    // 6. Productivity (core work, coding, deep focus, analysis, sprint, architecture, code, deployment, logic, debug, test, programming, report, inbox, presentation, meeting, PR review, lead, pitch, call, check network, learn, study, assignment, admin, emails, outreach)
    if (nameLower.includes('work') || nameLower.includes('focus') || nameLower.includes('code') || nameLower.includes('coding') || nameLower.includes('program') || nameLower.includes('analysis') || nameLower.includes('sprint') || nameLower.includes('architecture') || nameLower.includes('deploy') || nameLower.includes('logic') || nameLower.includes('debug') || nameLower.includes('test') || nameLower.includes('report') || nameLower.includes('inbox') || nameLower.includes('presentation') || nameLower.includes('meeting') || nameLower.includes('review') || nameLower.includes('lead') || nameLower.includes('pitch') || nameLower.includes('call') || nameLower.includes('learn') || nameLower.includes('study') || nameLower.includes('assignment') || nameLower.includes('admin') || nameLower.includes('email') || nameLower.includes('outreach') || nameLower.includes('crm') || nameLower.includes('audit') || nameLower.includes('billing') || nameLower.includes('document') || nameLower.includes('planning') || nameLower.includes('task') || nameLower.includes('errand')) {
        return { mainCategory: 'Productivity', subCategory: taskName };
    }

    // Fallbacks based on profiles if taskName didn't hit any keyword
    if (profile) {
        const group = findProfessionalGroup(profile);
        if (group === 'Creative Professional') {
            return { mainCategory: 'Creativity', subCategory: taskName };
        }
    }

    return { mainCategory: 'Productivity', subCategory: taskName };
}
