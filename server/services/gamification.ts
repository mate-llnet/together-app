import { storage } from "../storage";
import type { Achievement, UserStats, Milestone, Activity } from "@shared/schema";

export interface AchievementCheck {
  achievementId: string;
  progress?: number;
  isEarned: boolean;
}

export interface GamificationUpdate {
  newAchievements: Achievement[];
  completedMilestones: Milestone[];
  levelUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
  statsUpdated: UserStats;
}

// Define achievement criteria interfaces
export interface PointsAchievement {
  type: "points";
  threshold: number;
}

export interface ActivityCountAchievement {
  type: "activity_count";
  threshold: number;
  category?: string;
}

export interface StreakAchievement {
  type: "streak";
  threshold: number;
}

export interface CategoryMasterAchievement {
  type: "category_master";
  category: string;
  threshold: number;
}

export interface SpecialAchievement {
  type: "special";
  conditions: string[];
}

export type AchievementCriteria = 
  | PointsAchievement 
  | ActivityCountAchievement 
  | StreakAchievement 
  | CategoryMasterAchievement 
  | SpecialAchievement;

export class GamificationService {
  // Calculate user level based on total points
  static calculateLevel(totalPoints: number): number {
    // Level 1: 0-99 points, Level 2: 100-199 points, Level 3: 200-449 points, Level 4: 450-799 points, etc.
    if (totalPoints < 100) return 1;
    return Math.floor(Math.sqrt(totalPoints / 50)) + 1;
  }

  // Calculate points needed for next level
  static getPointsForNextLevel(currentLevel: number): number {
    if (currentLevel === 1) return 100; // Level 1 -> Level 2 needs 100 points
    return Math.pow(currentLevel, 2) * 50; // Level N needs N^2 * 50 points
  }

  // Calculate points needed to start a level  
  static getPointsForLevelStart(level: number): number {
    if (level === 1) return 0;   // Level 1 starts at 0 points
    if (level === 2) return 100; // Level 2 starts at 100 points
    return Math.pow(level - 1, 2) * 50; // Level N starts at (N-1)^2 * 50 points
  }

  // Initialize user stats when they first join
  static async initializeUserStats(userId: string): Promise<UserStats> {
    let userStats = await storage.getUserStats(userId);
    
    if (!userStats) {
      userStats = await storage.createUserStats({
        userId,
        totalPoints: 0,
        totalActivities: 0,
        currentStreak: 0,
        longestStreak: 0,
        level: 1,
        lastActivityDate: null,
      });
    }
    
    return userStats;
  }

  // Update user stats after completing an activity
  static async updateUserStats(
    userId: string, 
    activity: Activity
  ): Promise<GamificationUpdate> {
    let userStats = await storage.getUserStats(userId);
    
    if (!userStats) {
      userStats = await this.initializeUserStats(userId);
    }

    // Update stats
    const newTotalPoints = userStats.totalPoints + activity.points;
    const newTotalActivities = userStats.totalActivities + 1;
    const oldLevel = userStats.level;
    const newLevel = this.calculateLevel(newTotalPoints);
    
    // Calculate streak
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let newStreak = 1;
    
    if (userStats.lastActivityDate) {
      const lastActivityDate = new Date(userStats.lastActivityDate);
      const diffDays = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        // Same day, keep streak
        newStreak = userStats.currentStreak;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreak = userStats.currentStreak + 1;
      } else {
        // Streak broken, reset to 1
        newStreak = 1;
      }
    }

    const updatedStats = await storage.updateUserStats(userId, {
      totalPoints: newTotalPoints,
      totalActivities: newTotalActivities,
      level: newLevel,
      currentStreak: newStreak,
      longestStreak: Math.max(userStats.longestStreak, newStreak),
      lastActivityDate: today,
      updatedAt: today,
    });

    // Check for new achievements
    const newAchievements = await this.checkAndAwardAchievements(userId, updatedStats!, activity);
    
    // Check for completed milestones
    const completedMilestones = await this.checkAndCompleteMilestones(userId, updatedStats!);

    return {
      newAchievements,
      completedMilestones,
      levelUp: newLevel > oldLevel,
      oldLevel,
      newLevel,
      statsUpdated: updatedStats!,
    };
  }

  // Check and award achievements
  static async checkAndAwardAchievements(
    userId: string,
    userStats: UserStats,
    latestActivity: Activity
  ): Promise<Achievement[]> {
    const allAchievements = await storage.getAchievements();
    const userAchievements = await storage.getUserAchievements(userId);
    const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
    
    const newAchievements: Achievement[] = [];
    
    for (const achievement of allAchievements) {
      if (earnedAchievementIds.has(achievement.id)) {
        continue; // Already earned
      }
      
      const criteria: AchievementCriteria = JSON.parse(achievement.criteria);
      
      if (await this.checkAchievementCriteria(userId, criteria, userStats, latestActivity)) {
        // Award achievement
        await storage.awardAchievement({
          userId,
          achievementId: achievement.id,
          progress: 100,
          isNew: true,
        });
        
        newAchievements.push(achievement);
      }
    }
    
    return newAchievements;
  }

  // Check specific achievement criteria
  static async checkAchievementCriteria(
    userId: string,
    criteria: AchievementCriteria,
    userStats: UserStats,
    latestActivity: Activity
  ): Promise<boolean> {
    switch (criteria.type) {
      case "points":
        return userStats.totalPoints >= criteria.threshold;
        
      case "activity_count":
        if (criteria.category) {
          // Count activities in specific category
          const activities = await storage.getActivitiesByUser(userId, 1000);
          const categoryActivities = await Promise.all(
            activities.map(async (activity) => {
              const category = await storage.getActivityCategory(activity.categoryId);
              return category?.name === criteria.category ? activity : null;
            })
          );
          return categoryActivities.filter(Boolean).length >= criteria.threshold;
        }
        return userStats.totalActivities >= criteria.threshold;
        
      case "streak":
        return userStats.currentStreak >= criteria.threshold;
        
      case "category_master":
        const activities = await storage.getActivitiesByUser(userId, 1000);
        const categoryActivities = await Promise.all(
          activities.map(async (activity) => {
            const category = await storage.getActivityCategory(activity.categoryId);
            // Compare category names in lowercase to avoid case sensitivity issues
            return category?.name.toLowerCase() === criteria.category.toLowerCase() ? activity : null;
          })
        );
        return categoryActivities.filter(Boolean).length >= criteria.threshold;
        
      case "special":
        // Handle special conditions (can be extended)
        for (const condition of criteria.conditions) {
          switch (condition) {
            case "first_activity":
              return userStats.totalActivities >= 1;
            case "weekend_warrior":
              // Check if user has completed 5+ activities on weekends (Saturday/Sunday)
              const userActivities = await storage.getActivitiesByUser(userId, 100);
              const weekendActivities = userActivities.filter(a => {
                const dayOfWeek = a.completedAt.getDay();
                return dayOfWeek === 0 || dayOfWeek === 6; // Sunday = 0, Saturday = 6
              });
              return weekendActivities.length >= 5;
            case "early_bird":
              // Check if user has 5+ activities completed between 5-9 AM
              const earlyActivities = await storage.getActivitiesByUser(userId, 100);
              const morningActivities = earlyActivities.filter(a => {
                const hour = a.completedAt.getHours();
                return hour >= 5 && hour < 9;
              });
              return morningActivities.length >= 5;
            case "night_owl":
              // Check if user has 5+ activities completed between 8 PM - 12 AM
              const lateActivities = await storage.getActivitiesByUser(userId, 100);
              const nightActivities = lateActivities.filter(a => {
                const hour = a.completedAt.getHours();
                return hour >= 20 && hour < 24;
              });
              return nightActivities.length >= 5;
            case "appreciation_master":
              // Check if user has received 10+ appreciations
              const appreciations = await storage.getAppreciationsByUser(userId);
              return appreciations.length >= 10;
            default:
              return false;
          }
        }
        return false;
        
      default:
        return false;
    }
  }

  // Check and complete milestones
  static async checkAndCompleteMilestones(
    userId: string,
    userStats: UserStats
  ): Promise<Milestone[]> {
    const milestones = await storage.getUserMilestones(userId);
    const completedMilestones: Milestone[] = [];
    
    for (const milestone of milestones) {
      if (milestone.isCompleted) continue;
      
      let shouldComplete = false;
      
      switch (milestone.type) {
        case "weekly_goal":
          // Check if weekly activity goal is met (Sunday - Saturday)
          const now = new Date();
          const weekStart = new Date(now);
          weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Go to Sunday
          weekStart.setHours(0, 0, 0, 0);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7); // Next Sunday (exclusive)
          weekEnd.setHours(0, 0, 0, 0);
          
          // Use the new date range query for accurate week counting
          const weekActivities = await storage.getActivitiesByUserBetween(userId, weekStart, weekEnd);
          
          if (weekActivities.length >= milestone.targetValue) {
            shouldComplete = true;
          }
          break;
          
        case "point_milestone":
          if (userStats.totalPoints >= milestone.targetValue) {
            shouldComplete = true;
          }
          break;
          
        case "streak_milestone":
          if (userStats.currentStreak >= milestone.targetValue) {
            shouldComplete = true;
          }
          break;
      }
      
      if (shouldComplete) {
        const completed = await storage.completeMilestone(milestone.id);
        if (completed) {
          completedMilestones.push(completed);
        }
      }
    }
    
    return completedMilestones;
  }

  // Create default milestones for new users
  static async createDefaultMilestones(userId: string): Promise<void> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 7); // Next week
    weekStart.setHours(23, 59, 59, 999);

    await storage.createMilestone({
      userId,
      type: "weekly_goal",
      title: "Weekly Activity Goal",
      description: "Complete 7 activities this week",
      targetValue: 7,
      currentValue: 0,
      expiresAt: weekStart,
    });

    await storage.createMilestone({
      userId,
      type: "point_milestone",
      title: "Century Club",
      description: "Earn 100 total points",
      targetValue: 100,
      currentValue: 0,
      expiresAt: null,
    });
  }
}