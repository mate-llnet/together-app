import { storage } from "../storage";
import type { InsertAchievement } from "@shared/schema";

export const INITIAL_ACHIEVEMENTS: InsertAchievement[] = [
  // Points-based achievements
  {
    name: "Getting Started",
    description: "Earn your first 25 points by helping around the house",
    icon: "🌟",
    type: "points",
    criteria: JSON.stringify({ type: "points", threshold: 25 }),
    points: 10,
    rarity: "common",
    isActive: true,
  },
  {
    name: "Helper Hero",
    description: "Accumulate 100 points through your amazing contributions",
    icon: "🦸",
    type: "points", 
    criteria: JSON.stringify({ type: "points", threshold: 100 }),
    points: 25,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Household Champion",
    description: "Reach 500 points - you're a relationship rockstar!",
    icon: "🏆",
    type: "points",
    criteria: JSON.stringify({ type: "points", threshold: 500 }),
    points: 50,
    rarity: "rare",
    isActive: true,
  },
  {
    name: "Partnership Pro",
    description: "Achieve 1000 points - a true partner in every way",
    icon: "💎",
    type: "points",
    criteria: JSON.stringify({ type: "points", threshold: 1000 }),
    points: 100,
    rarity: "epic",
    isActive: true,
  },

  // Activity count achievements
  {
    name: "First Steps",
    description: "Complete your very first activity - every journey begins with one step",
    icon: "👶",
    type: "special",
    criteria: JSON.stringify({ type: "special", conditions: ["first_activity"] }),
    points: 5,
    rarity: "common", 
    isActive: true,
  },
  {
    name: "Helping Hand",
    description: "Complete 10 activities - you're building great habits!",
    icon: "🙌",
    type: "activity_count",
    criteria: JSON.stringify({ type: "activity_count", threshold: 10 }),
    points: 15,
    rarity: "common",
    isActive: true,
  },
  {
    name: "Busy Bee",
    description: "Complete 50 activities - your partner notices your efforts!",
    icon: "🐝",
    type: "activity_count",
    criteria: JSON.stringify({ type: "activity_count", threshold: 50 }),
    points: 30,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Activity Addict",
    description: "Complete 100 activities - you're unstoppable!",
    icon: "⚡",
    type: "activity_count",
    criteria: JSON.stringify({ type: "activity_count", threshold: 100 }),
    points: 50,
    rarity: "rare",
    isActive: true,
  },

  // Streak achievements
  {
    name: "Streak Starter",
    description: "Maintain a 3-day activity streak - consistency is key!",
    icon: "🔥",
    type: "streak",
    criteria: JSON.stringify({ type: "streak", threshold: 3 }),
    points: 20,
    rarity: "common",
    isActive: true,
  },
  {
    name: "Week Warrior",
    description: "Keep a 7-day streak going - you're forming amazing habits!",
    icon: "⚡",
    type: "streak",
    criteria: JSON.stringify({ type: "streak", threshold: 7 }),
    points: 35,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Consistency King/Queen", 
    description: "Achieve a 14-day streak - your dedication is inspiring!",
    icon: "👑",
    type: "streak",
    criteria: JSON.stringify({ type: "streak", threshold: 14 }),
    points: 60,
    rarity: "rare",
    isActive: true,
  },
  {
    name: "Unstoppable Force",
    description: "Maintain a 30-day streak - you're a relationship legend!",
    icon: "🚀",
    type: "streak", 
    criteria: JSON.stringify({ type: "streak", threshold: 30 }),
    points: 100,
    rarity: "legendary",
    isActive: true,
  },

  // Category-specific achievements
  {
    name: "Kitchen Master",
    description: "Complete 20 cooking activities - you're the chef of the house!",
    icon: "👨‍🍳",
    type: "category_master",
    criteria: JSON.stringify({ type: "category_master", category: "cooking", threshold: 20 }),
    points: 40,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Cleaning Guru",
    description: "Complete 25 household activities - cleanliness is next to godliness!",
    icon: "🧹",
    type: "category_master",
    criteria: JSON.stringify({ type: "category_master", category: "household", threshold: 25 }),
    points: 40,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Childcare Champion",
    description: "Complete 15 childcare activities - you're an amazing parent!",
    icon: "👶",
    type: "category_master",
    criteria: JSON.stringify({ type: "category_master", category: "childcare", threshold: 15 }),
    points: 45,
    rarity: "rare",
    isActive: true,
  },
  {
    name: "Money Manager", 
    description: "Complete 10 finance activities - financial responsibility rocks!",
    icon: "💰",
    type: "category_master",
    criteria: JSON.stringify({ type: "category_master", category: "finance", threshold: 10 }),
    points: 35,
    rarity: "uncommon",
    isActive: true,
  },

  // Special achievements
  {
    name: "Weekend Warrior",
    description: "Complete 5 activities during weekends - you never rest!",
    icon: "🏖️",
    type: "special",
    criteria: JSON.stringify({ type: "special", conditions: ["weekend_warrior"] }),
    points: 25,
    rarity: "uncommon", 
    isActive: true,
  },
  {
    name: "Early Bird",
    description: "Complete activities consistently in the morning hours",
    icon: "🌅", 
    type: "special",
    criteria: JSON.stringify({ type: "special", conditions: ["early_bird"] }),
    points: 30,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Night Owl",
    description: "Get things done in the evening - dedication has no schedule!",
    icon: "🦉",
    type: "special",
    criteria: JSON.stringify({ type: "special", conditions: ["night_owl"] }),
    points: 30,
    rarity: "uncommon",
    isActive: true,
  },
  {
    name: "Appreciation Master",
    description: "Receive 10 appreciations from your partner - you're loved!",
    icon: "💝",
    type: "special",
    criteria: JSON.stringify({ type: "special", conditions: ["appreciation_master"] }),
    points: 50,
    rarity: "rare",
    isActive: true,
  },
];

export async function seedAchievements(): Promise<void> {
  console.log("🌟 Seeding achievements...");
  
  try {
    const existingAchievements = await storage.getAchievements();
    
    if (existingAchievements.length > 0) {
      console.log(`✅ ${existingAchievements.length} achievements already exist, skipping seed.`);
      return;
    }
    
    for (const achievement of INITIAL_ACHIEVEMENTS) {
      await storage.createAchievement(achievement);
    }
    
    console.log(`✅ Successfully seeded ${INITIAL_ACHIEVEMENTS.length} achievements!`);
  } catch (error) {
    console.error("❌ Failed to seed achievements:", error);
    throw error;
  }
}

// Seeding function is exported and called from registerRoutes()
// No automatic execution to prevent server crashes