
"use client";
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import * as icons from "lucide-react";

const professionGroups = {
  "Creative": ["Artist", "Designer", "Writer"],
  "Business": ["Manager", "Consultant", "Marketer"],
  "Technical": ["Software Engineer", "IT Pro", "Researcher"],
  "On-The-Go": ["Sales", "Medical Rep", "Delivery Agent"],
  "Healthcare": ["Healthcare Professional"],
};

const routines = {
  "Creative": {
    "Morning Routine (7:00 AM - 9:00 AM)": [
      { task: "Drink a glass of water", duration: 1, icon: "Droplets", completed: false },
      { task: "Morning Idea Dump / Journaling", duration: 15, icon: "BookOpen", completed: false },
      { task: "Light Stretching or Mobility", duration: 15, icon: "StretchHorizontal", completed: false },
      { task: "Mindful Breakfast", duration: 20, icon: "Utensils", completed: false },
    ],
    "Primary Work Session (9:00 AM - 1:00 PM)": [
      { task: "Uninterrupted Deep Creative Work", duration: 120, icon: "BrainCircuit", completed: false },
      { task: "Inspiration & Research Block", duration: 60, icon: "Lightbulb", completed: false },
    ],
    "Lunch Break (1:00 PM - 2:00 PM)": [
        { task: "Mindful Meal (away from desk)", duration: 30, icon: "Utensils", completed: false },
        { task: "Short Walk", duration: 15, icon: "Footprints", completed: false },
    ],
    "Afternoon Session (2:00 PM - 5:00 PM)": [
        { task: "Skill Practice / Tutorial", duration: 45, icon: "Wrench", completed: false },
        { task: "Admin & Client Communication", duration: 60, icon: "Mail", completed: false },
    ],
    "Post-Work Decompression (5:00 PM - 7:00 PM)":[
        { task: "Main Exercise / Workout", duration: 45, icon: "Dumbbell", completed: false },
        { task: "Relaxing Hobby", duration: 60, icon: "Gamepad2", completed: false },
    ],
    "Evening Routine (7:00 PM - 9:00 PM)":[
        { task: "Mindful Dinner", duration: 30, icon: "Utensils", completed: false },
        { task: "Social Time with Family/Friends", duration: 60, icon: "Users", completed: false },
    ],
    "Bedtime Routine (9:00 PM onwards)":[
        { task: "Final Idea Capture (on paper)", duration: 5, icon: "PenSquare", completed: false },
        { task: "Digital Detox (no screens)", duration: 30, icon: "Smartphone", completed: false },
        { task: "Read Fiction or Listen to Calming Music", duration: 20, icon: "Headphones", completed: false },
    ]
  },
  "Business": {
    "Morning Routine (6:30 AM - 8:30 AM)": [
        { task: "Workout/Exercise", duration: 30, icon: "Dumbbell", completed: false },
        { task: "Review Day's Top 3 Priorities", duration: 10, icon: "ListChecks", completed: false },
        { task: "Breakfast & Scan News", duration: 20, icon: "Utensils", completed: false },
    ],
    "Primary Work Session (8:30 AM - 12:30 PM)": [
        { task: "Tackle Most Important Task", duration: 90, icon: "Target", completed: false },
        { task: "Strategic Thinking / 'No-Meeting' Block", duration: 60, icon: "BrainCircuit", completed: false },
    ],
    "Lunch Break (12:30 PM - 1:30 PM)": [
        { task: "Power Lunch / Quick Walk", duration: 45, icon: "Footprints", completed: false },
    ],
    "Afternoon Session (1:30 PM - 5:00 PM)": [
        { task: "Meetings & Collaborative Tasks", duration: 120, icon: "Users", completed: false },
        { task: "Scan & Reply to Emails", duration: 30, icon: "Mail", completed: false },
    ],
    "Post-Work Decompression (5:00 PM - 7:00 PM)": [
        { task: "End-of-Day Review & Shutdown Ritual", duration: 15, icon: "Power", completed: false },
        { task: "Hobby / Leisure", duration: 60, icon: "Gamepad2", completed: false },
    ],
    "Evening Routine (7:00 PM - 9:00 PM)": [
        { task: "Dinner with Family/Friends (no work talk)", duration: 45, icon: "Utensils", completed: false },
    ],
    "Bedtime Routine (9:00 PM onwards)": [
        { task: "Prepare for the Next Day (clothes, bag)", duration: 10, icon: "ShoppingBag", completed: false },
        { task: "Light Reading (non-work related)", duration: 20, icon: "BookOpen", completed: false },
        { task: "Meditation for Stress Release", duration: 10, icon: "Wind", completed: false },
    ],
  },
  "Technical": {
    "Morning Routine (7:00 AM - 9:00 AM)": [
        { task: "Meditation for Focus", duration: 10, icon: "Wind", completed: false },
        { task: "Review Tech News / Documentation", duration: 20, icon: "FileCode", completed: false },
        { task: "Breakfast (no screens)", duration: 20, icon: "Utensils", completed: false },
    ],
    "Primary Work Session (9:00 AM - 1:00 PM)": [
        { task: "Deep Work on Infrastructure/Code", duration: 120, icon: "BrainCircuit", completed: false },
        { task: "Code Reviews & Lighter Tasks", duration: 60, icon: "Mail", completed: false },
        { task: "CRITICAL: Hourly 20-20-20 Eye Strain Break", duration: 1, icon: "Eye", completed: false },
    ],
    "Lunch Break (1:00 PM - 2:00 PM)": [
        { task: "Screen-Free Lunch & Walk", duration: 45, icon: "Footprints", completed: false },
    ],
    "Afternoon Session (2:00 PM - 5:00 PM)": [
        { task: "Documentation & Runbook Updates", duration: 45, icon: "PenSquare", completed: false },
        { task: "Project Meetings", duration: 60, icon: "Users", completed: false },
    ],
    "Post-Work Decompression (5:00 PM - 7:00 PM)": [
        { task: "Strength Training or Cardio", duration: 45, icon: "Dumbbell", completed: false },
        { task: "Analog Hobby (puzzles, music, etc.)", duration: 60, icon: "Puzzle", completed: false },
    ],
    "Evening Routine (7:00 PM - 9:00 PM)": [
        { task: "Mindful Dinner", duration: 30, icon: "Utensils", completed: false },
        { task: "Personal Project / Learning", duration: 60, icon: "Lightbulb", completed: false },
    ],
    "Bedtime Routine (9:00 PM onwards)": [
        { task: "Strict Screen Cutoff", duration: 60, icon: "Smartphone", completed: false },
        { task: "Stretching to relieve desk posture", duration: 10, icon: "StretchHorizontal", completed: false },
        { task: "Read a physical book", duration: 20, icon: "BookOpen", completed: false },
    ],
  },
  "On-The-Go": {
      "On a Travel Day": [
        { task: "Route & Schedule Review", duration: 15, icon: "Map", completed: false },
        { task: "High-Energy Breakfast", duration: 20, icon: "Utensils", completed: false },
        { task: "In-Car Mental Reset", duration: 5, icon: "Wind", completed: false },
        { task: "Packed Lunch Break", duration: 20, icon: "Utensils", completed: false },
        { task: "Log Reports & Admin on Mobile", duration: 20, icon: "Smartphone", completed: false },
        { task: "Restock & Prep Bag/Vehicle for Tomorrow", duration: 10, icon: "ShoppingBag", completed: false },
        { task: "Stretching for physical tension", duration: 15, icon: "StretchHorizontal", completed: false },
        { task: "Warm shower to relax", duration: 15, icon: "ShowerHead", completed: false },
      ],
      "On a Home / Admin Day": "Business", // This will refer to the Business Professional routine
  },
  "Healthcare": {
      "On a Shift Day (Time-Agnostic)": [
        { task: "High-Energy Meal", duration: 30, icon: "Utensils", completed: false },
        { task: "Gentle Movement & Mental Prep", duration: 15, icon: "BrainCircuit", completed: false },
        { task: "During-Shift Micro-Reset", duration: 1, icon: "Wind", completed: false },
        { task: "Rehydrate immediately with water", duration: 1, icon: "Droplets", completed: false },
        { task: "Mindful Commute", duration: 20, icon: "Headphones", completed: false },
        { task: "Recovery Meal & Connect with Family", duration: 45, icon: "Utensils", completed: false },
        { task: "Warm shower to signal 'end of day'", duration: 15, icon: "ShowerHead", completed: false },
      ],
      "On a Day Off": [
        { task: "Gentle Stretching or a walk", duration: 20, icon: "Footprints", completed: false },
        { task: "Leisurely Breakfast", duration: 30, icon: "Coffee", completed: false },
        { task: "Run errands, appointments, groceries", duration: 90, icon: "ShoppingCart", completed: false },
        { task: "Dedicate time to a relaxing hobby", duration: 60, icon: "Gamepad2", completed: false },
        { task: "Journaling to process and unload stress", duration: 10, icon: "BookOpen", completed: false },
        { task: "Consistent bedtime routine to reset body clock", duration: 30, icon: "Bed", completed: false },
      ]
  }
};

const Icon = ({ name, ...props }) => {
  const LucideIcon = icons[name];
  return LucideIcon ? <LucideIcon {...props} /> : null;
};

export default function RoutinePage() {
  const [selectedProfession, setSelectedProfession] = useState("Creative");
  const [tasks, setTasks] = useState(routines[selectedProfession]);

  const handleProfessionSelect = (profession) => {
    setSelectedProfession(profession);
    let routine = routines[profession];
    if (typeof routine === 'string') {
        routine = routines[routine];
    }
    setTasks(routine);
  };

  const handleTaskToggle = (category, taskIndex) => {
    const newTasks = { ...tasks };
    newTasks[category][taskIndex].completed = !newTasks[category][taskIndex].completed;
    setTasks(newTasks);
  };

  const renderRoutine = (routine) => {
    if (!routine) return null;
    return Object.entries(routine).map(([category, categoryData]) => {
        let tasksInCategory = categoryData;
        if (typeof categoryData === 'string' && routines[categoryData]) {
          tasksInCategory = routines[categoryData];
          return Object.entries(tasksInCategory).map(([subCategory, subTasks]) => renderCategory(subCategory, subTasks));
        }

        if(typeof tasksInCategory === 'object' && !Array.isArray(tasksInCategory)){
            return renderCategory(category, Object.values(tasksInCategory).flat());
        }

        if(!Array.isArray(tasksInCategory)) return null;

        return renderCategory(category, tasksInCategory);
    });
  }

  const renderCategory = (category, tasksInCategory) => {
     if (!Array.isArray(tasksInCategory)) {
      console.warn(`Data for category "${category}" is not an array, skipping render.`);
      return null;
    }
    return (
        <div key={category}>
            <h3 className="text-lg font-semibold mt-4">{category}</h3>
            <Separator className="my-2" />
            <div className="space-y-4">
                {tasksInCategory.map((task, index) => (
                <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                    <Checkbox
                        id={`${category}-${index}`}
                        checked={task.completed}
                        onCheckedChange={() => handleTaskToggle(category, index)}
                    />
                    <Icon name={task.icon} className="h-5 w-5 text-gray-500" />
                    <label
                        htmlFor={`${category}-${index}`}
                        className={`text-sm ${task.completed ? "line-through text-gray-500" : ""}`}
                    >
                        {task.task} ({task.duration} min)
                    </label>
                    </div>
                </div>
                ))}
            </div>
        </div>
    )
  }


  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Daily Routine Planner</h1>

      <Card>
        <CardHeader>
          <CardTitle>Choose Your Profession</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.keys(professionGroups).map((group) => (
              <Badge
                key={group}
                variant={selectedProfession === group ? "default" : "secondary"}
                onClick={() => handleProfessionSelect(group)}
                className="cursor-pointer"
              >
                {group}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

      <Card>
        <CardHeader>
          <CardTitle>Your Routine for a {selectedProfession} Professional</CardTitle>
        </CardHeader>
        <CardContent>
          {renderRoutine(tasks)}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Button>Start My Day</Button>
      </div>
    </div>
  );
}

    