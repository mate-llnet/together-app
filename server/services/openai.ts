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
