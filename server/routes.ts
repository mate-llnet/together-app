import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema, 
  registerSchema, 
  invitePartnerSchema,
  insertActivitySchema,
  insertAppreciationSchema
} from "@shared/schema";
import { generateActivitySuggestions, categorizeActivity, generateAppreciationMessage } from "./services/openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const user = await storage.createUser({
        email: data.email,
        password: data.password, // In production, hash this
        name: data.name,
      });

      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(data.email);
      if (!user || user.password !== data.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Partner routes
  app.post("/api/partner/invite", async (req, res) => {
    try {
      const data = invitePartnerSchema.parse(req.body);
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const partner = await storage.getUserByEmail(data.email);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      // Check if couple already exists
      const existingCouple = await storage.getCoupleByUsers(userId, partner.id);
      if (existingCouple) {
        return res.status(400).json({ message: "Already connected to this partner" });
      }

      const couple = await storage.createCouple({
        user1Id: userId,
        user2Id: partner.id,
        connectionStatus: "connected"
      });

      res.json({ couple });
    } catch (error) {
      res.status(400).json({ message: "Invalid invite data" });
    }
  });

  app.get("/api/partner", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.json({ partner: null });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partner = await storage.getUser(partnerId);
      
      res.json({ 
        partner: partner ? { 
          id: partner.id, 
          name: partner.name, 
          email: partner.email,
          avatar: partner.avatar 
        } : null 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get partner" });
    }
  });

  // Activity routes
  app.get("/api/activities/categories", async (req, res) => {
    try {
      const categories = await storage.getActivityCategories();
      res.json({ categories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get categories" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const date = req.query.date as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      let activities;
      if (date) {
        activities = await storage.getActivitiesByUserAndDate(userId, date);
      } else {
        activities = await storage.getActivitiesByUser(userId, limit);
      }

      // Get category info for each activity
      const activitiesWithCategories = await Promise.all(
        activities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return { ...activity, category };
        })
      );

      res.json({ activities: activitiesWithCategories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get activities" });
    }
  });

  app.get("/api/activities/partner", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const date = req.query.date as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get partner
      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.json({ activities: [] });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      
      let activities;
      if (date) {
        activities = await storage.getActivitiesByUserAndDate(partnerId, date);
      } else {
        activities = await storage.getActivitiesByUser(partnerId, limit);
      }

      // Get category info for each activity
      const activitiesWithCategories = await Promise.all(
        activities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return { ...activity, category };
        })
      );

      res.json({ activities: activitiesWithCategories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get partner activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const data = insertActivitySchema.parse(req.body);
      
      // If no category provided, use AI to categorize
      let categoryId = data.categoryId;
      let points = data.points;
      
      if (!categoryId || !points) {
        const aiResult = await categorizeActivity(data.title);
        const category = await storage.getActivityCategoryByName(aiResult.category);
        categoryId = category?.id || "household";
        points = aiResult.points;
      }

      const activity = await storage.createActivity({
        ...data,
        userId,
        categoryId,
        points,
      });

      const category = await storage.getActivityCategory(activity.categoryId);
      res.json({ activity: { ...activity, category } });
    } catch (error) {
      res.status(400).json({ message: "Invalid activity data" });
    }
  });

  // AI Suggestions routes
  app.get("/api/ai/suggestions", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const suggestions = await storage.getAiSuggestionsByUser(userId);
      
      // Get category info for each suggestion
      const suggestionsWithCategories = await Promise.all(
        suggestions.map(async (suggestion) => {
          const category = await storage.getActivityCategory(suggestion.categoryId);
          return { ...suggestion, category };
        })
      );

      res.json({ suggestions: suggestionsWithCategories });
    } catch (error) {
      res.status(500).json({ message: "Failed to get AI suggestions" });
    }
  });

  app.post("/api/ai/suggestions/generate", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get recent activities for context
      const userActivities = await storage.getActivitiesByUser(userId, 10);
      const userActivityTitles = userActivities.map(a => a.title);
      
      // Get partner's recent activities
      let partnerActivityTitles: string[] = [];
      const couple = await storage.getCouple(userId);
      if (couple) {
        const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
        const partnerActivities = await storage.getActivitiesByUser(partnerId, 10);
        partnerActivityTitles = partnerActivities.map(a => a.title);
      }

      const now = new Date();
      const timeOfDay = now.getHours() < 12 ? "morning" : now.getHours() < 17 ? "afternoon" : "evening";
      const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });

      const aiSuggestions = await generateActivitySuggestions(
        userActivityTitles,
        partnerActivityTitles,
        timeOfDay,
        dayOfWeek
      );

      // Save suggestions to storage
      const savedSuggestions = await Promise.all(
        aiSuggestions.map(async (suggestion) => {
          const category = await storage.getActivityCategoryByName(suggestion.category);
          return storage.createAiSuggestion({
            userId,
            title: suggestion.title,
            description: suggestion.description,
            categoryId: category?.id || "household",
            points: suggestion.points,
            confidence: suggestion.confidence,
          });
        })
      );

      res.json({ suggestions: savedSuggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI suggestions" });
    }
  });

  app.post("/api/ai/suggestions/:id/accept", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const suggestionId = req.params.id;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Mark suggestion as accepted
      await storage.updateAiSuggestion(suggestionId, { isAccepted: true });
      
      // Create activity from suggestion
      const suggestion = await storage.getAiSuggestion(suggestionId);
      if (suggestion) {
        const activity = await storage.createActivity({
          userId,
          title: suggestion.title,
          description: suggestion.description,
          categoryId: suggestion.categoryId,
          points: suggestion.points,
          isAiSuggested: true,
        });

        const category = await storage.getActivityCategory(activity.categoryId);
        res.json({ activity: { ...activity, category } });
      } else {
        res.status(404).json({ message: "Suggestion not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to accept suggestion" });
    }
  });

  // Appreciation routes
  app.post("/api/appreciations", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const data = insertAppreciationSchema.parse(req.body);
      
      // If no message provided, generate one with AI
      let message = data.message;
      if (!message) {
        const activity = await storage.getActivity(data.activityId);
        if (activity) {
          message = await generateAppreciationMessage(activity.title);
        }
      }

      const appreciation = await storage.createAppreciation({
        ...data,
        fromUserId: userId,
        message,
      });

      res.json({ appreciation });
    } catch (error) {
      res.status(400).json({ message: "Invalid appreciation data" });
    }
  });

  app.get("/api/appreciations", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const appreciations = await storage.getAppreciationsByUser(userId);
      res.json({ appreciations });
    } catch (error) {
      res.status(500).json({ message: "Failed to get appreciations" });
    }
  });

  // Analytics routes
  app.get("/api/analytics/stats", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const today = new Date().toISOString().split('T')[0];
      const todayActivities = await storage.getActivitiesByUserAndDate(userId, today);
      
      const allActivities = await storage.getActivitiesByUser(userId);
      const totalPoints = allActivities.reduce((sum, activity) => sum + activity.points, 0);
      
      // Calculate appreciation score (simplified)
      const appreciations = await storage.getAppreciationsByUser(userId);
      const appreciationScore = Math.min(100, appreciations.length * 10);
      
      // Calculate streak (simplified - consecutive days with activities)
      let streak = 0;
      const currentDate = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(currentDate);
        checkDate.setDate(checkDate.getDate() - i);
        const dayActivities = await storage.getActivitiesByUserAndDate(
          userId, 
          checkDate.toISOString().split('T')[0]
        );
        if (dayActivities.length > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      // Calculate balance with partner
      let balance = 50; // Default if no partner
      const couple = await storage.getCouple(userId);
      if (couple) {
        const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
        const partnerActivities = await storage.getActivitiesByUser(partnerId);
        const partnerPoints = partnerActivities.reduce((sum, activity) => sum + activity.points, 0);
        
        if (totalPoints + partnerPoints > 0) {
          balance = Math.round((totalPoints / (totalPoints + partnerPoints)) * 100);
        }
      }

      res.json({
        stats: {
          todayTasks: todayActivities.length,
          appreciationScore,
          balance,
          streak,
          totalPoints,
        }
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
