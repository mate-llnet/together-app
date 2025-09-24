import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface ActivitySuggestion {
  title: string;
  description: string;
  category: string;
  points: number;
  confidence: number;
}

export async function generateActivitySuggestions(
  userActivities: string[],
  partnerActivities: string[],
  timeOfDay: string,
  dayOfWeek: string
): Promise<ActivitySuggestion[]> {
  try {
    const prompt = `Based on the following context, suggest 3 household/relationship activities that this person might do:

User's recent activities: ${userActivities.join(", ")}
Partner's recent activities: ${partnerActivities.join(", ")}
Current time: ${timeOfDay}
Day of week: ${dayOfWeek}

Categories: household, childcare, finance, maintenance, cooking, shopping, transportation, emotional_support

Respond with JSON in this format:
{
  "suggestions": [
    {
      "title": "Activity title",
      "description": "Brief description",
      "category": "category_name",
      "points": 5-15,
      "confidence": 70-95
    }
  ]
}

Make suggestions realistic and contextual based on time and recent patterns.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that helps couples track and appreciate their daily contributions. Suggest realistic household and relationship activities."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.suggestions || [];
  } catch (error) {
    console.error("Failed to generate AI suggestions:", error);
    return [];
  }
}

export async function categorizeActivity(activityTitle: string): Promise<{
  category: string;
  points: number;
  confidence: number;
}> {
  try {
    const prompt = `Categorize this activity and suggest points:

Activity: "${activityTitle}"

Categories: household, childcare, finance, maintenance, cooking, shopping, transportation, emotional_support

Respond with JSON:
{
  "category": "category_name",
  "points": 5-15,
  "confidence": 80-95
}

Points scale:
- Simple tasks (5-7 points): tidying up, basic cooking
- Medium tasks (8-10 points): grocery shopping, school pickup
- Complex tasks (11-15 points): bill paying, major cleaning, repairs`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI that categorizes household activities and assigns point values based on effort and importance."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      category: result.category || "household",
      points: Math.max(5, Math.min(15, result.points || 5)),
      confidence: Math.max(80, Math.min(95, result.confidence || 85))
    };
  } catch (error) {
    console.error("Failed to categorize activity:", error);
    return {
      category: "household",
      points: 5,
      confidence: 80
    };
  }
}

export async function generateAppreciationMessage(activityTitle: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Generate a warm, heartfelt appreciation message for a partner's activity. Keep it personal and genuine, 1-2 sentences."
        },
        {
          role: "user",
          content: `Generate an appreciation message for: "${activityTitle}"`
        }
      ],
    });

    return response.choices[0].message.content || "Thank you for everything you do! ❤️";
  } catch (error) {
    console.error("Failed to generate appreciation message:", error);
    return "Thank you for everything you do! ❤️";
  }
}

export interface ActivityPrediction {
  title: string;
  description: string;
  category: string;
  points: number;
  confidence: number;
  reasoning: string;
  predictedTime: string;
}

export interface UserPatterns {
  commonTimes: string[];
  frequentCategories: string[];
  averageActivitiesPerDay: number;
  longestStreak: number;
  totalActivities: number;
}

export async function analyzeUserPatterns(activities: Array<{
  title: string;
  category: string;
  points: number;
  completedAt: Date;
}>): Promise<UserPatterns> {
  try {
    const activitySummary = activities.map(a => ({
      title: a.title,
      category: a.category,
      time: a.completedAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      day: a.completedAt.toLocaleDateString('en-US', { weekday: 'long' }),
      points: a.points
    }));

    const prompt = `Analyze these user activity patterns and provide insights:

Activities (last ${activities.length} entries):
${activitySummary.map(a => `- ${a.title} (${a.category}) at ${a.time} on ${a.day} - ${a.points} pts`).join('\n')}

Respond with JSON:
{
  "commonTimes": ["morning", "afternoon", "evening"],
  "frequentCategories": ["category1", "category2"],
  "averageActivitiesPerDay": 3.5,
  "longestStreak": 7,
  "totalActivities": ${activities.length}
}

Analyze when they're most active, which categories they prefer, and their consistency patterns.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI that analyzes user behavior patterns from activity data to identify trends and habits."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      commonTimes: result.commonTimes || [],
      frequentCategories: result.frequentCategories || [],
      averageActivitiesPerDay: result.averageActivitiesPerDay || 0,
      longestStreak: result.longestStreak || 0,
      totalActivities: activities.length
    };
  } catch (error) {
    console.error("Failed to analyze user patterns:", error);
    return {
      commonTimes: [],
      frequentCategories: [],
      averageActivitiesPerDay: 0,
      longestStreak: 0,
      totalActivities: activities.length
    };
  }
}

export interface RecurringTask {
  title: string;
  category: string;
  frequency: string; // daily, weekly, biweekly, monthly
  lastCompleted: Date;
  averageGap: number; // days between completions
  confidence: number;
  nextDueDate: Date;
}

export interface SmartReminder {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  type: 'overdue' | 'upcoming' | 'balance' | 'streak';
  reminderTime: string;
  reasoning: string;
  actionSuggested: string;
}

export async function detectRecurringTasks(activities: Array<{
  title: string;
  category: string;
  points: number;
  completedAt: Date;
}>): Promise<RecurringTask[]> {
  if (activities.length < 10) {
    return []; // Need sufficient data to detect patterns
  }

  try {
    // Group activities by similar titles and categories
    const activitySummary = activities.map(a => ({
      title: a.title.toLowerCase().trim(),
      category: a.category,
      date: a.completedAt.toISOString().split('T')[0], // YYYY-MM-DD format
      points: a.points
    }));

    const prompt = `Analyze these activities to identify recurring tasks:

Activities (last ${activities.length} entries):
${activitySummary.map(a => `- ${a.title} (${a.category}) on ${a.date}`).join('\n')}

Identify patterns where similar activities occur regularly. Look for:
1. Exact title matches or very similar activities
2. Regular timing intervals (daily, weekly, biweekly, monthly)
3. Category-based patterns (e.g., weekly grocery shopping)

Respond with JSON:
{
  "recurringTasks": [
    {
      "title": "Activity name",
      "category": "category_name",
      "frequency": "weekly",
      "lastCompleted": "2025-01-15",
      "averageGap": 7,
      "confidence": 85,
      "nextDueDate": "2025-01-22"
    }
  ]
}

Only include tasks with high confidence (80%+) and clear patterns.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI that detects recurring task patterns from activity history. Be precise and only identify clear, repeated patterns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return (result.recurringTasks || []).map((task: any) => ({
      ...task,
      lastCompleted: new Date(task.lastCompleted),
      nextDueDate: new Date(task.nextDueDate)
    }));
  } catch (error) {
    console.error("Failed to detect recurring tasks:", error);
    return [];
  }
}

export async function generateSmartReminders(
  recurringTasks: RecurringTask[],
  recentActivities: Array<{
    title: string;
    category: string;
    points: number;
    completedAt: Date;
  }>,
  userPatterns: UserPatterns,
  currentTime: Date
): Promise<SmartReminder[]> {
  try {
    const now = currentTime;
    const timeOfDay = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    let timeContext = "morning";
    const hour = now.getHours();
    if (hour >= 12 && hour < 17) timeContext = "afternoon";
    else if (hour >= 17) timeContext = "evening";

    // Analyze recent activity to identify gaps and opportunities
    const recentCategories = recentActivities.slice(0, 7).map(a => a.category);
    const recentTitles = recentActivities.slice(0, 5).map(a => a.title);
    
    const overdueTasks = recurringTasks.filter(task => {
      const daysSinceLastCompleted = Math.floor((now.getTime() - task.lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastCompleted > task.averageGap + 1;
    });

    const upcomingTasks = recurringTasks.filter(task => {
      const daysSinceLastCompleted = Math.floor((now.getTime() - task.lastCompleted.getTime()) / (1000 * 60 * 60 * 24));
      return daysSinceLastCompleted >= task.averageGap - 1 && daysSinceLastCompleted <= task.averageGap + 1;
    });

    const prompt = `Generate gentle, encouraging reminders based on user patterns and task status:

Current Context:
- Time: ${timeOfDay} (${timeContext})
- Day: ${dayOfWeek}
- Recent activities: ${recentTitles.join(', ')}
- Recent categories: ${recentCategories.join(', ')}

User Patterns:
- Common active times: ${userPatterns.commonTimes.join(', ')}
- Frequent categories: ${userPatterns.frequentCategories.join(', ')}
- Average activities per day: ${userPatterns.averageActivitiesPerDay}

Overdue Tasks:
${overdueTasks.map(t => `- ${t.title} (${t.category}) - last done ${Math.floor((now.getTime() - t.lastCompleted.getTime()) / (1000 * 60 * 60 * 24))} days ago`).join('\n')}

Upcoming Tasks:
${upcomingTasks.map(t => `- ${t.title} (${t.category}) - usually done every ${t.averageGap} days`).join('\n')}

Generate 2-4 gentle, contextual reminders. Make them encouraging, not pushy.

Respond with JSON:
{
  "reminders": [
    {
      "id": "unique-id",
      "title": "Brief reminder title",
      "message": "Gentle, encouraging message",
      "category": "category_name",
      "priority": "medium",
      "type": "overdue",
      "reminderTime": "Good time to do this",
      "reasoning": "Why this reminder makes sense now",
      "actionSuggested": "Specific action user can take"
    }
  ]
}

Types: overdue, upcoming, balance, streak
Priorities: low, medium, high`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a caring AI assistant that helps couples stay on track with their activities. Generate gentle, encouraging reminders that motivate rather than pressure."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.reminders || [];
  } catch (error) {
    console.error("Failed to generate smart reminders:", error);
    return [];
  }
}

export async function generateActivityPredictions(
  recentActivities: Array<{
    title: string;
    category: string;
    points: number;
    completedAt: Date;
  }>,
  userPatterns: UserPatterns,
  currentTime: Date
): Promise<ActivityPrediction[]> {
  try {
    const timeOfDay = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dayOfWeek = currentTime.toLocaleDateString('en-US', { weekday: 'long' });
    const hour = currentTime.getHours();
    
    let timeContext = "morning";
    if (hour >= 12 && hour < 17) timeContext = "afternoon";
    else if (hour >= 17) timeContext = "evening";

    const recentTitles = recentActivities.slice(0, 5).map(a => a.title);
    const recentCategories = recentActivities.slice(0, 10).map(a => a.category);

    const prompt = `Based on user patterns and current context, predict 3 activities they might do next:

User Patterns:
- Common active times: ${userPatterns.commonTimes.join(', ')}
- Frequent categories: ${userPatterns.frequentCategories.join(', ')}
- Average activities per day: ${userPatterns.averageActivitiesPerDay}
- Total activities: ${userPatterns.totalActivities}

Current Context:
- Time: ${timeOfDay} (${timeContext})
- Day: ${dayOfWeek}
- Recent activities: ${recentTitles.join(', ')}
- Recent categories: ${recentCategories.join(', ')}

Categories: household, childcare, finance, maintenance, cooking, shopping, transportation, emotional_support

Respond with JSON:
{
  "predictions": [
    {
      "title": "Specific activity title",
      "description": "Why this makes sense now",
      "category": "category_name",
      "points": 5-15,
      "confidence": 60-95,
      "reasoning": "Based on patterns, time, and context",
      "predictedTime": "next 1-2 hours"
    }
  ]
}

Make predictions intelligent based on:
1. Time-based patterns (cooking at dinner, cleaning on weekends)
2. Avoiding recent duplicates
3. Logical activity sequences
4. User's established preferences`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an AI that predicts future activities based on user patterns, habits, and current context. Make realistic, personalized predictions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.predictions || [];
  } catch (error) {
    console.error("Failed to generate activity predictions:", error);
    return [];
  }
}
