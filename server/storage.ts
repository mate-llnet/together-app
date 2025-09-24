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
  type InsertAiSuggestion
} from "@shared/schema";
import { randomUUID } from "crypto";

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
      description: activityData.description || null
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

export const storage = new MemStorage();
