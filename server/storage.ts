import { 
  type User, 
  type InsertUser, 
  type Couple, 
  type InsertCouple,
  type Activity,
  type InsertActivity,
  type ActivityCategory,
  type Appreciation,
  type InsertAppreciation,
  type AiSuggestion,
  type InsertAiSuggestion,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type UserStats,
  type InsertUserStats,
  type Milestone,
  type InsertMilestone,
  users,
  couples,
  activityCategories,
  activities,
  appreciations,
  aiSuggestions,
  achievements,
  userAchievements,
  userStats,
  milestones
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/neon-serverless";
import { neonConfig, Pool } from "@neondatabase/serverless";
import { eq, and, desc, gte, lt } from "drizzle-orm";
import ws from "ws";

// Configure for server-side usage
neonConfig.fetchConnectionCache = true;
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL
});
const db = drizzle(pool);

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Couples
  getCouple(userId: string): Promise<Couple | undefined>;
  createCouple(couple: InsertCouple): Promise<Couple>;
  updateCouple(id: string, updates: Partial<Couple>): Promise<Couple | undefined>;
  getCoupleByUsers(user1Id: string, user2Id: string): Promise<Couple | undefined>;

  // Activity Categories
  getActivityCategories(): Promise<ActivityCategory[]>;
  getActivityCategory(id: string): Promise<ActivityCategory | undefined>;
  getActivityCategoryByName(name: string): Promise<ActivityCategory | undefined>;

  // Activities
  getActivitiesByUser(userId: string, limit?: number): Promise<Activity[]>;
  getActivitiesByUserAndDate(userId: string, date: string): Promise<Activity[]>;
  getActivitiesByUserBetween(userId: string, startDate: Date, endDate: Date): Promise<Activity[]>;
  createActivity(activity: InsertActivity & { userId: string }): Promise<Activity>;
  getActivity(id: string): Promise<Activity | undefined>;

  // Appreciations
  getAppreciationsByUser(userId: string): Promise<Appreciation[]>;
  createAppreciation(appreciation: InsertAppreciation): Promise<Appreciation>;

  // AI Suggestions
  getAiSuggestionsByUser(userId: string): Promise<AiSuggestion[]>;
  createAiSuggestion(suggestion: InsertAiSuggestion & { userId: string }): Promise<AiSuggestion>;
  updateAiSuggestion(id: string, updates: Partial<AiSuggestion>): Promise<AiSuggestion | undefined>;
  getAiSuggestion(id: string): Promise<AiSuggestion | undefined>;

  // Gamification - Achievements
  getAchievements(): Promise<Achievement[]>;
  getAchievement(id: string): Promise<Achievement | undefined>;
  createAchievement(achievement: InsertAchievement): Promise<Achievement>;
  updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined>;

  // Gamification - User Achievements  
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement>;
  markAchievementSeen(userId: string, achievementId: string): Promise<void>;

  // Gamification - User Stats
  getUserStats(userId: string): Promise<UserStats | undefined>;
  createUserStats(userStats: InsertUserStats & { userId: string }): Promise<UserStats>;
  updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | undefined>;

  // Gamification - Milestones
  getUserMilestones(userId: string): Promise<Milestone[]>;
  createMilestone(milestone: InsertMilestone & { userId: string }): Promise<Milestone>;
  updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined>;
  completeMilestone(id: string): Promise<Milestone | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private couples: Map<string, Couple>;
  private activityCategories: Map<string, ActivityCategory>;
  private activities: Map<string, Activity>;
  private appreciations: Map<string, Appreciation>;
  private aiSuggestions: Map<string, AiSuggestion>;

  constructor() {
    this.users = new Map();
    this.couples = new Map();
    this.activityCategories = new Map();
    this.activities = new Map();
    this.appreciations = new Map();
    this.aiSuggestions = new Map();
    
    this.initializeCategories();
  }

  private initializeCategories() {
    const categories: ActivityCategory[] = [
      { id: "household", name: "Household", icon: "fas fa-home", color: "primary" },
      { id: "childcare", name: "Childcare", icon: "fas fa-baby", color: "blue-500" },
      { id: "finance", name: "Finance", icon: "fas fa-dollar-sign", color: "green-500" },
      { id: "maintenance", name: "Maintenance", icon: "fas fa-wrench", color: "purple-500" },
      { id: "cooking", name: "Cooking", icon: "fas fa-utensils", color: "pink-500" },
      { id: "shopping", name: "Shopping", icon: "fas fa-shopping-cart", color: "amber-500" },
      { id: "transportation", name: "Transportation", icon: "fas fa-car", color: "blue-500" },
      { id: "emotional_support", name: "Emotional Support", icon: "fas fa-heart", color: "secondary" },
    ];

    categories.forEach(category => {
      this.activityCategories.set(category.id, category);
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date(),
      avatar: null 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Couples
  async getCouple(userId: string): Promise<Couple | undefined> {
    return Array.from(this.couples.values()).find(
      couple => couple.user1Id === userId || couple.user2Id === userId
    );
  }

  async createCouple(insertCouple: InsertCouple): Promise<Couple> {
    const id = randomUUID();
    const couple: Couple = { 
      ...insertCouple, 
      id, 
      createdAt: new Date(),
      connectionStatus: insertCouple.connectionStatus || "pending"
    };
    this.couples.set(id, couple);
    return couple;
  }

  async updateCouple(id: string, updates: Partial<Couple>): Promise<Couple | undefined> {
    const couple = this.couples.get(id);
    if (!couple) return undefined;
    
    const updatedCouple = { ...couple, ...updates };
    this.couples.set(id, updatedCouple);
    return updatedCouple;
  }

  async getCoupleByUsers(user1Id: string, user2Id: string): Promise<Couple | undefined> {
    return Array.from(this.couples.values()).find(
      couple => 
        (couple.user1Id === user1Id && couple.user2Id === user2Id) ||
        (couple.user1Id === user2Id && couple.user2Id === user1Id)
    );
  }

  // Activity Categories
  async getActivityCategories(): Promise<ActivityCategory[]> {
    return Array.from(this.activityCategories.values());
  }

  async getActivityCategory(id: string): Promise<ActivityCategory | undefined> {
    return this.activityCategories.get(id);
  }

  async getActivityCategoryByName(name: string): Promise<ActivityCategory | undefined> {
    return Array.from(this.activityCategories.values()).find(
      category => category.name.toLowerCase() === name.toLowerCase()
    );
  }

  // Activities
  async getActivitiesByUser(userId: string, limit?: number): Promise<Activity[]> {
    const userActivities = Array.from(this.activities.values())
      .filter(activity => activity.userId === userId)
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
    
    return limit ? userActivities.slice(0, limit) : userActivities;
  }

  async getActivitiesByUserAndDate(userId: string, date: string): Promise<Activity[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return Array.from(this.activities.values())
      .filter(activity => 
        activity.userId === userId &&
        activity.completedAt >= startOfDay &&
        activity.completedAt < endOfDay
      )
      .sort((a, b) => b.completedAt.getTime() - a.completedAt.getTime());
  }

  async createActivity(activityData: InsertActivity & { userId: string }): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = { 
      ...activityData, 
      id, 
      completedAt: new Date(),
      isAiSuggested: activityData.isAiSuggested || false,
      description: activityData.description || null,
      points: activityData.points ?? 5
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    return this.activities.get(id);
  }

  // Appreciations
  async getAppreciationsByUser(userId: string): Promise<Appreciation[]> {
    return Array.from(this.appreciations.values())
      .filter(appreciation => appreciation.toUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAppreciation(insertAppreciation: InsertAppreciation): Promise<Appreciation> {
    const id = randomUUID();
    const appreciation: Appreciation = { 
      ...insertAppreciation, 
      id, 
      createdAt: new Date(),
      message: insertAppreciation.message || null
    };
    this.appreciations.set(id, appreciation);
    return appreciation;
  }

  // AI Suggestions
  async getAiSuggestionsByUser(userId: string): Promise<AiSuggestion[]> {
    return Array.from(this.aiSuggestions.values())
      .filter(suggestion => suggestion.userId === userId && !suggestion.isAccepted)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createAiSuggestion(suggestionData: InsertAiSuggestion & { userId: string }): Promise<AiSuggestion> {
    const id = randomUUID();
    const suggestion: AiSuggestion = { 
      ...suggestionData, 
      id, 
      createdAt: new Date(),
      description: suggestionData.description || null,
      points: suggestionData.points || 5,
      isAccepted: suggestionData.isAccepted || false
    };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }

  async updateAiSuggestion(id: string, updates: Partial<AiSuggestion>): Promise<AiSuggestion | undefined> {
    const suggestion = this.aiSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, ...updates };
    this.aiSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async getAiSuggestion(id: string): Promise<AiSuggestion | undefined> {
    return this.aiSuggestions.get(id);
  }
}

export class DrizzleStorage implements IStorage {
  constructor() {
    this.initializeCategories();
  }

  private async initializeCategories() {
    const existingCategories = await db.select().from(activityCategories);
    if (existingCategories.length === 0) {
      const categories: ActivityCategory[] = [
        { id: "household", name: "Household", icon: "fas fa-home", color: "primary" },
        { id: "childcare", name: "Childcare", icon: "fas fa-baby", color: "blue-500" },
        { id: "finance", name: "Finance", icon: "fas fa-dollar-sign", color: "green-500" },
        { id: "maintenance", name: "Maintenance", icon: "fas fa-wrench", color: "purple-500" },
        { id: "cooking", name: "Cooking", icon: "fas fa-utensils", color: "pink-500" },
        { id: "shopping", name: "Shopping", icon: "fas fa-shopping-cart", color: "amber-500" },
        { id: "transportation", name: "Transportation", icon: "fas fa-car", color: "blue-500" },
        { id: "emotional_support", name: "Emotional Support", icon: "fas fa-heart", color: "secondary" },
      ];

      await db.insert(activityCategories).values(categories);
    }
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Couples
  async getCouple(userId: string): Promise<Couple | undefined> {
    const result = await db.select().from(couples).where(
      and(
        eq(couples.user1Id, userId)
      )
    ).union(
      db.select().from(couples).where(eq(couples.user2Id, userId))
    );
    return result[0];
  }

  async createCouple(insertCouple: InsertCouple): Promise<Couple> {
    const result = await db.insert(couples).values(insertCouple).returning();
    return result[0];
  }

  async updateCouple(id: string, updates: Partial<Couple>): Promise<Couple | undefined> {
    const result = await db.update(couples).set(updates).where(eq(couples.id, id)).returning();
    return result[0];
  }

  async getCoupleByUsers(user1Id: string, user2Id: string): Promise<Couple | undefined> {
    const result = await db.select().from(couples).where(
      and(
        eq(couples.user1Id, user1Id),
        eq(couples.user2Id, user2Id)
      )
    ).union(
      db.select().from(couples).where(
        and(
          eq(couples.user1Id, user2Id),
          eq(couples.user2Id, user1Id)
        )
      )
    );
    return result[0];
  }

  // Activity Categories
  async getActivityCategories(): Promise<ActivityCategory[]> {
    return await db.select().from(activityCategories);
  }

  async getActivityCategory(id: string): Promise<ActivityCategory | undefined> {
    const result = await db.select().from(activityCategories).where(eq(activityCategories.id, id));
    return result[0];
  }

  async getActivityCategoryByName(name: string): Promise<ActivityCategory | undefined> {
    const result = await db.select().from(activityCategories).where(eq(activityCategories.name, name));
    return result[0];
  }

  // Activities
  async getActivitiesByUser(userId: string, limit?: number): Promise<Activity[]> {
    const query = db.select().from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.completedAt));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getActivitiesByUserAndDate(userId: string, date: string): Promise<Activity[]> {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    return await db.select().from(activities).where(
      and(
        eq(activities.userId, userId),
        gte(activities.completedAt, startOfDay),
        lt(activities.completedAt, endOfDay)
      )
    ).orderBy(desc(activities.completedAt));
  }

  async createActivity(activityData: InsertActivity & { userId: string }): Promise<Activity> {
    const dataWithDefaults = {
      ...activityData,
      points: activityData.points ?? 5,
      isAiSuggested: activityData.isAiSuggested ?? false
    };
    const result = await db.insert(activities).values(dataWithDefaults).returning();
    return result[0];
  }

  async getActivitiesByUserBetween(userId: string, startDate: Date, endDate: Date): Promise<Activity[]> {
    return await db.select().from(activities).where(
      and(
        eq(activities.userId, userId),
        gte(activities.completedAt, startDate),
        lt(activities.completedAt, endDate)
      )
    ).orderBy(desc(activities.completedAt));
  }

  async getActivity(id: string): Promise<Activity | undefined> {
    const result = await db.select().from(activities).where(eq(activities.id, id));
    return result[0];
  }

  // Appreciations
  async getAppreciationsByUser(userId: string): Promise<Appreciation[]> {
    return await db.select().from(appreciations)
      .where(eq(appreciations.toUserId, userId))
      .orderBy(desc(appreciations.createdAt));
  }

  async createAppreciation(insertAppreciation: InsertAppreciation): Promise<Appreciation> {
    const result = await db.insert(appreciations).values(insertAppreciation).returning();
    return result[0];
  }

  // AI Suggestions
  async getAiSuggestionsByUser(userId: string): Promise<AiSuggestion[]> {
    return await db.select().from(aiSuggestions).where(
      and(
        eq(aiSuggestions.userId, userId),
        eq(aiSuggestions.isAccepted, false)
      )
    ).orderBy(desc(aiSuggestions.createdAt));
  }

  async createAiSuggestion(suggestionData: InsertAiSuggestion & { userId: string }): Promise<AiSuggestion> {
    const result = await db.insert(aiSuggestions).values(suggestionData).returning();
    return result[0];
  }

  async updateAiSuggestion(id: string, updates: Partial<AiSuggestion>): Promise<AiSuggestion | undefined> {
    const result = await db.update(aiSuggestions).set(updates).where(eq(aiSuggestions.id, id)).returning();
    return result[0];
  }

  async getAiSuggestion(id: string): Promise<AiSuggestion | undefined> {
    const result = await db.select().from(aiSuggestions).where(eq(aiSuggestions.id, id));
    return result[0];
  }

  // Gamification - Achievements
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements).where(eq(achievements.isActive, true));
  }

  async getAchievement(id: string): Promise<Achievement | undefined> {
    const result = await db.select().from(achievements).where(eq(achievements.id, id));
    return result[0];
  }

  async createAchievement(achievement: InsertAchievement): Promise<Achievement> {
    const result = await db.insert(achievements).values(achievement).returning();
    return result[0];
  }

  async updateAchievement(id: string, updates: Partial<Achievement>): Promise<Achievement | undefined> {
    const result = await db.update(achievements).set(updates).where(eq(achievements.id, id)).returning();
    return result[0];
  }

  // Gamification - User Achievements  
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select().from(userAchievements)
      .where(eq(userAchievements.userId, userId))
      .orderBy(desc(userAchievements.earnedAt));
  }

  async awardAchievement(userAchievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await db.insert(userAchievements).values(userAchievement).returning();
    return result[0];
  }

  async markAchievementSeen(userId: string, achievementId: string): Promise<void> {
    await db.update(userAchievements)
      .set({ isNew: false })
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      );
  }

  // Gamification - User Stats
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const result = await db.select().from(userStats).where(eq(userStats.userId, userId));
    return result[0];
  }

  async createUserStats(userStatsData: InsertUserStats & { userId: string }): Promise<UserStats> {
    const result = await db.insert(userStats).values(userStatsData).returning();
    return result[0];
  }

  async updateUserStats(userId: string, updates: Partial<UserStats>): Promise<UserStats | undefined> {
    const result = await db.update(userStats).set(updates).where(eq(userStats.userId, userId)).returning();
    return result[0];
  }

  // Gamification - Milestones
  async getUserMilestones(userId: string): Promise<Milestone[]> {
    return await db.select().from(milestones)
      .where(eq(milestones.userId, userId))
      .orderBy(desc(milestones.createdAt));
  }

  async createMilestone(milestoneData: InsertMilestone & { userId: string }): Promise<Milestone> {
    const result = await db.insert(milestones).values(milestoneData).returning();
    return result[0];
  }

  async updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone | undefined> {
    const result = await db.update(milestones).set(updates).where(eq(milestones.id, id)).returning();
    return result[0];
  }

  async completeMilestone(id: string): Promise<Milestone | undefined> {
    const result = await db.update(milestones)
      .set({ isCompleted: true, completedAt: new Date() })
      .where(eq(milestones.id, id))
      .returning();
    return result[0];
  }
}

export const storage = new DrizzleStorage();
