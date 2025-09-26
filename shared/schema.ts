import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const couples = pgTable("couples", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user1Id: varchar("user1_id").notNull().references(() => users.id),
  user2Id: varchar("user2_id").notNull().references(() => users.id),
  connectionStatus: text("connection_status").notNull().default("pending"), // pending, connected
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const activityCategories = pgTable("activity_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
});

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").notNull().references(() => activityCategories.id),
  points: integer("points").notNull().default(5),
  isAiSuggested: boolean("is_ai_suggested").notNull().default(false),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
});

export const appreciations = pgTable("appreciations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  activityId: varchar("activity_id").notNull().references(() => activities.id),
  message: text("message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  categoryId: varchar("category_id").notNull().references(() => activityCategories.id),
  points: integer("points").notNull().default(5),
  confidence: integer("confidence").notNull(), // 0-100
  isAccepted: boolean("is_accepted").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Gamification tables
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  type: text("type").notNull(), // points, streak, activity_count, category_master, special
  criteria: text("criteria").notNull(), // JSON string with achievement criteria
  points: integer("points").notNull().default(0), // Points awarded for earning this achievement
  rarity: text("rarity").notNull().default("common"), // common, uncommon, rare, epic, legendary
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  achievementId: varchar("achievement_id").notNull().references(() => achievements.id),
  earnedAt: timestamp("earned_at").notNull().defaultNow(),
  progress: integer("progress").default(0), // For achievements requiring multiple steps
  isNew: boolean("is_new").notNull().default(true), // Flag for showing celebration
});

export const userStats = pgTable("user_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  totalPoints: integer("total_points").notNull().default(0),
  totalActivities: integer("total_activities").notNull().default(0),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  level: integer("level").notNull().default(1),
  lastActivityDate: timestamp("last_activity_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const milestones = pgTable("milestones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // weekly_goal, monthly_challenge, point_milestone, streak_milestone
  title: text("title").notNull(),
  description: text("description").notNull(),
  targetValue: integer("target_value").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Site content management tables
export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  siteName: text("site_name").notNull().default("AppreciateMate"),
  tagline: text("tagline").notNull().default("Appreciate Life Together"),
  description: text("description").notNull().default("A relationship appreciation app that helps couples track and appreciate each other's daily contributions."),
  logoUrl: text("logo_url"),
  contactEmail: text("contact_email").notNull().default("hello@appreciatemate.com"),
  contactPhone: text("contact_phone"),
  contactAddress: text("contact_address"),
  socialLinks: text("social_links"), // JSON string for social media links
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const sitePages = pgTable("site_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(), // e.g., "about", "privacy", "terms"
  title: text("title").notNull(),
  content: text("content").notNull(), // HTML/Markdown content
  isPublished: boolean("is_published").notNull().default(true),
  metaDescription: text("meta_description"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject"),
  message: text("message").notNull(),
  status: text("status").notNull().default("new"), // new, read, replied
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCoupleSchema = createInsertSchema(couples).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  userId: true,
  completedAt: true,
});

export const insertAppreciationSchema = createInsertSchema(appreciations).omit({
  id: true,
  createdAt: true,
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
  userId: true,
  createdAt: true,
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  createdAt: true,
});

export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  earnedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMilestoneSchema = createInsertSchema(milestones).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSitePageSchema = createInsertSchema(sitePages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSubmissionSchema = createInsertSchema(contactSubmissions).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Couple = typeof couples.$inferSelect;
export type InsertCouple = z.infer<typeof insertCoupleSchema>;
export type ActivityCategory = typeof activityCategories.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Appreciation = typeof appreciations.$inferSelect;
export type InsertAppreciation = z.infer<typeof insertAppreciationSchema>;
export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type Milestone = typeof milestones.$inferSelect;
export type InsertMilestone = z.infer<typeof insertMilestoneSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SitePage = typeof sitePages.$inferSelect;
export type InsertSitePage = z.infer<typeof insertSitePageSchema>;
export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSubmissionSchema>;

// Extended types for frontend use
export interface ActivityWithCategory extends Activity {
  category?: ActivityCategory;
}

export interface ActivityWithUser extends Activity {
  user: User;
  category?: ActivityCategory;
}

export interface UserWithCouple extends User {
  couple?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = loginSchema.extend({
  name: z.string().min(2),
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const invitePartnerSchema = z.object({
  email: z.string().email(),
});

export type LoginData = z.infer<typeof loginSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type InvitePartnerData = z.infer<typeof invitePartnerSchema>;
