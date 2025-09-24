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
