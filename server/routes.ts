import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { 
  loginSchema, 
  registerSchema, 
  invitePartnerSchema,
  insertActivitySchema,
  insertAppreciationSchema,
  insertSiteSettingsSchema,
  insertSitePageSchema,
  insertContactSubmissionSchema
} from "@shared/schema";
import { generateActivitySuggestions, categorizeActivity, generateAppreciationMessage, analyzeUserPatterns, generateActivityPredictions, detectRecurringTasks, generateSmartReminders, analyzeRelationshipDynamics, generateCoupleRecommendations, generateRelationshipSummary } from "./services/openai";
import { GamificationService } from "./services/gamification";
import { seedAchievements } from "./services/seed-achievements";
import { seedDefaultAdmin } from "./services/seed-admin";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      service: "together-app" 
    });
  });

  // Ensure achievements and default admin are seeded on startup
  try {
    await seedAchievements();
    await seedDefaultAdmin();
  } catch (error) {
    console.error("Failed to seed startup data:", error);
  }

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(data.password, 12);
      
      const user = await storage.createUser({
        email: data.email,
        password: hashedPassword,
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
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Compare hashed password
      const validPassword = await bcrypt.compare(data.password, user.password);
      if (!validPassword) {
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

      // Trigger gamification updates
      const gamificationUpdate = await GamificationService.updateUserStats(userId, activity);

      // Initialize default milestones for new users if needed  
      const userStats = await storage.getUserStats(userId);
      if (!userStats || userStats.totalActivities === 1) {
        await GamificationService.createDefaultMilestones(userId);
      }

      const category = await storage.getActivityCategory(activity.categoryId);
      res.json({ 
        activity: { ...activity, category },
        gamification: gamificationUpdate
      });
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

        // Trigger gamification updates
        const gamificationUpdate = await GamificationService.updateUserStats(userId, activity);

        // Initialize default milestones for new users if needed  
        const userStats = await storage.getUserStats(userId);
        if (!userStats || userStats.totalActivities === 1) {
          await GamificationService.createDefaultMilestones(userId);
        }

        const category = await storage.getActivityCategory(activity.categoryId);
        res.json({ 
          activity: { ...activity, category },
          gamification: gamificationUpdate
        });
      } else {
        res.status(404).json({ message: "Suggestion not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to accept suggestion" });
    }
  });

  // AI Pattern Analysis routes
  app.get("/api/ai/patterns", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get user's activity history for pattern analysis
      const activities = await storage.getActivitiesByUser(userId, 50); // Last 50 activities
      
      // Map activities to include category names
      const activitiesWithCategories = await Promise.all(
        activities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      const patterns = await analyzeUserPatterns(activitiesWithCategories);
      
      res.json({ patterns });
    } catch (error) {
      console.error("Failed to analyze user patterns:", error);
      res.status(500).json({ message: "Failed to analyze activity patterns" });
    }
  });

  // AI Activity Predictions routes  
  app.get("/api/ai/predictions", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get recent activities and user patterns
      const recentActivities = await storage.getActivitiesByUser(userId, 20);
      const allActivities = await storage.getActivitiesByUser(userId, 50);
      
      // Map activities to include category names for analysis
      const recentActivitiesWithCategories = await Promise.all(
        recentActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      const allActivitiesWithCategories = await Promise.all(
        allActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      const userPatterns = await analyzeUserPatterns(allActivitiesWithCategories);
      
      // Generate predictions based on patterns and current context
      const predictions = await generateActivityPredictions(
        recentActivitiesWithCategories,
        userPatterns,
        new Date()
      );
      
      // Add category info to predictions
      const predictionsWithCategories = await Promise.all(
        predictions.map(async (prediction) => {
          const category = await storage.getActivityCategoryByName(prediction.category);
          return { ...prediction, categoryInfo: category };
        })
      );
      
      res.json({ predictions: predictionsWithCategories });
    } catch (error) {
      console.error("Failed to generate activity predictions:", error);
      res.status(500).json({ message: "Failed to generate activity predictions" });
    }
  });

  // AI Smart Reminders routes
  app.get("/api/ai/reminders", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get user's activity history for pattern analysis
      const allActivities = await storage.getActivitiesByUser(userId, 100); // More data for better recurring task detection
      const recentActivities = await storage.getActivitiesByUser(userId, 20);
      
      if (allActivities.length < 10) {
        return res.json({ 
          reminders: [],
          recurringTasks: [],
          message: "Add more activities to get smart reminders!"
        });
      }
      
      // Map activities to include category names for analysis
      const allActivitiesWithCategories = await Promise.all(
        allActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      const recentActivitiesWithCategories = await Promise.all(
        recentActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      // Detect recurring tasks and user patterns
      const recurringTasks = await detectRecurringTasks(allActivitiesWithCategories);
      const userPatterns = await analyzeUserPatterns(allActivitiesWithCategories);
      
      // Generate smart reminders
      const reminders = await generateSmartReminders(
        recurringTasks,
        recentActivitiesWithCategories,
        userPatterns,
        new Date()
      );
      
      res.json({ 
        reminders,
        recurringTasks: recurringTasks.slice(0, 5), // Limit to top 5 for display
        userPatterns
      });
    } catch (error) {
      console.error("Failed to generate smart reminders:", error);
      res.status(500).json({ message: "Failed to generate smart reminders" });
    }
  });

  // Get recurring tasks separately
  app.get("/api/ai/recurring-tasks", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get user's activity history
      const activities = await storage.getActivitiesByUser(userId, 100);
      
      if (activities.length < 10) {
        return res.json({ 
          recurringTasks: [],
          message: "Need more activity history to detect recurring patterns"
        });
      }
      
      // Map activities to include category names
      const activitiesWithCategories = await Promise.all(
        activities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );
      
      const recurringTasks = await detectRecurringTasks(activitiesWithCategories);
      
      res.json({ recurringTasks });
    } catch (error) {
      console.error("Failed to detect recurring tasks:", error);
      res.status(500).json({ message: "Failed to detect recurring tasks" });
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

      // Check achievements for the user receiving the appreciation
      try {
        // Initialize user stats if they don't exist yet
        const userStats = await GamificationService.initializeUserStats(data.toUserId);
        
        // Only check appreciation_master achievement to avoid awarding time-based achievements incorrectly
        const allAchievements = await storage.getAchievements();
        const userAchievements = await storage.getUserAchievements(data.toUserId);
        const earnedAchievementIds = new Set(userAchievements.map(ua => ua.achievementId));
        
        for (const achievement of allAchievements) {
          if (earnedAchievementIds.has(achievement.id)) {
            continue; // Already earned
          }
          
          const criteria = JSON.parse(achievement.criteria);
          
          // Only check appreciation_master for appreciation events
          if (criteria.type === "special" && criteria.conditions.includes("appreciation_master")) {
            const appreciations = await storage.getAppreciationsByUser(data.toUserId);
            if (appreciations.length >= 10) {
              await storage.awardAchievement({
                userId: data.toUserId,
                achievementId: achievement.id,
                progress: 100,
                isNew: true,
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to check achievements for appreciation:", error);
        // Don't fail the appreciation creation if achievement checking fails
      }

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

  // Gamification routes  
  app.get("/api/gamification/stats", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userStats = await GamificationService.initializeUserStats(userId);
      const currentLevelStart = GamificationService.getPointsForLevelStart(userStats.level);
      const nextLevelPoints = GamificationService.getPointsForNextLevel(userStats.level);
      const progressToNextLevel = nextLevelPoints > currentLevelStart 
        ? ((userStats.totalPoints - currentLevelStart) / (nextLevelPoints - currentLevelStart)) * 100 
        : 0;
      
      res.json({ 
        stats: userStats,
        currentLevelStart,
        nextLevelPoints,
        progressToNextLevel: Math.max(0, Math.min(100, progressToNextLevel))
      });
    } catch (error) {
      console.error("Failed to get user stats:", error);
      res.status(500).json({ message: "Failed to get user stats" });
    }
  });

  app.get("/api/gamification/achievements", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const userAchievements = await storage.getUserAchievements(userId);
      const allAchievements = await storage.getAchievements();
      
      // Map achievements with earned status
      const achievementsWithStatus = allAchievements.map(achievement => {
        const earned = userAchievements.find(ua => ua.achievementId === achievement.id);
        return {
          ...achievement,
          isEarned: !!earned,
          earnedAt: earned?.earnedAt || null,
          isNew: earned?.isNew || false,
          progress: earned?.progress || 0
        };
      });

      res.json({ 
        achievements: achievementsWithStatus,
        totalEarned: userAchievements.length,
        newAchievements: userAchievements.filter(ua => ua.isNew).length
      });
    } catch (error) {
      console.error("Failed to get achievements:", error);
      res.status(500).json({ message: "Failed to get achievements" });
    }
  });

  app.post("/api/gamification/achievements/:achievementId/seen", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      const { achievementId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      await storage.markAchievementSeen(userId, achievementId);
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to mark achievement as seen:", error);
      res.status(500).json({ message: "Failed to mark achievement as seen" });
    }
  });

  app.get("/api/gamification/milestones", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const milestones = await storage.getUserMilestones(userId);
      const userStats = await storage.getUserStats(userId);
      
      // Update milestone progress based on current stats
      const milestonesWithProgress = milestones.map(milestone => {
        let currentProgress = 0;
        
        switch (milestone.type) {
          case "point_milestone":
            currentProgress = userStats?.totalPoints || 0;
            break;
          case "streak_milestone":
            currentProgress = userStats?.currentStreak || 0;
            break;
          default:
            currentProgress = milestone.currentValue;
        }
        
        return {
          ...milestone,
          currentValue: currentProgress,
          progressPercentage: Math.min((currentProgress / milestone.targetValue) * 100, 100)
        };
      });

      res.json({ milestones: milestonesWithProgress });
    } catch (error) {
      console.error("Failed to get milestones:", error);
      res.status(500).json({ message: "Failed to get milestones" });
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

  // Couple Insights Routes
  app.get("/api/couple/overview", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get partner info
      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.status(404).json({ message: "No partner found" });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      // Get activities for both partners (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const userActivities = await storage.getActivitiesByUserBetween(userId, thirtyDaysAgo, new Date());
      const partnerActivities = await storage.getActivitiesByUserBetween(partnerId, thirtyDaysAgo, new Date());

      // Get appreciations between partners
      const userAppreciations = await storage.getAppreciationsByUser(userId);
      const partnerAppreciations = await storage.getAppreciationsByUser(partnerId);

      // Calculate combined statistics
      const totalActivities = userActivities.length + partnerActivities.length;
      const userPoints = userActivities.reduce((sum, a) => sum + a.points, 0);
      const partnerPoints = partnerActivities.reduce((sum, a) => sum + a.points, 0);
      const totalPoints = userPoints + partnerPoints;

      // Calculate category distribution for couple
      const categoryStats: Record<string, { 
        userCount: number; 
        partnerCount: number; 
        userPoints: number; 
        partnerPoints: number; 
        categoryName: string; 
      }> = {};

      for (const activity of userActivities) {
        const category = await storage.getActivityCategory(activity.categoryId);
        const categoryName = category?.name || 'Other';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = {
            userCount: 0,
            partnerCount: 0,
            userPoints: 0,
            partnerPoints: 0,
            categoryName
          };
        }
        categoryStats[categoryName].userCount++;
        categoryStats[categoryName].userPoints += activity.points;
      }

      for (const activity of partnerActivities) {
        const category = await storage.getActivityCategory(activity.categoryId);
        const categoryName = category?.name || 'Other';
        if (!categoryStats[categoryName]) {
          categoryStats[categoryName] = {
            userCount: 0,
            partnerCount: 0,
            userPoints: 0,
            partnerPoints: 0,
            categoryName
          };
        }
        categoryStats[categoryName].partnerCount++;
        categoryStats[categoryName].partnerPoints += activity.points;
      }

      const overview = {
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar
        },
        timeframe: '30 days',
        combined: {
          totalActivities,
          totalPoints,
          averageActivitiesPerDay: Math.round(totalActivities / 30),
          balance: {
            user: {
              activities: userActivities.length,
              points: userPoints,
              percentage: totalActivities > 0 ? Math.round((userActivities.length / totalActivities) * 100) : 50
            },
            partner: {
              activities: partnerActivities.length,
              points: partnerPoints,
              percentage: totalActivities > 0 ? Math.round((partnerActivities.length / totalActivities) * 100) : 50
            }
          }
        },
        appreciations: {
          userReceived: userAppreciations.length,
          partnerReceived: partnerAppreciations.length,
          appreciationRatio: userAppreciations.length + partnerAppreciations.length > 0 
            ? (userAppreciations.length / (userAppreciations.length + partnerAppreciations.length))
            : 0.5
        },
        categoryBreakdown: Object.values(categoryStats)
      };

      res.json(overview);
    } catch (error) {
      console.error("Failed to get couple overview:", error);
      res.status(500).json({ message: "Failed to get couple overview" });
    }
  });

  app.get("/api/couple/patterns", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get partner info
      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.status(404).json({ message: "No partner found" });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      // Get activities for pattern analysis (last 60 days for better patterns)
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      
      const userActivities = await storage.getActivitiesByUserBetween(userId, sixtyDaysAgo, new Date());
      const partnerActivities = await storage.getActivitiesByUserBetween(partnerId, sixtyDaysAgo, new Date());

      // Analyze time patterns
      const userTimePatterns = userActivities.reduce((acc: Record<number, number>, activity) => {
        const hour = activity.completedAt.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      const partnerTimePatterns = partnerActivities.reduce((acc: Record<number, number>, activity) => {
        const hour = activity.completedAt.getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});

      // Analyze day-of-week patterns
      const userDayPatterns = userActivities.reduce((acc: Record<number, number>, activity) => {
        const day = activity.completedAt.getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      const partnerDayPatterns = partnerActivities.reduce((acc: Record<number, number>, activity) => {
        const day = activity.completedAt.getDay();
        acc[day] = (acc[day] || 0) + 1;
        return acc;
      }, {});

      // Find most active times
      const getUserPeakHour = () => {
        const maxHour = Object.entries(userTimePatterns)
          .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 12, count: 0 });
        return maxHour.hour;
      };

      const getPartnerPeakHour = () => {
        const maxHour = Object.entries(partnerTimePatterns)
          .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 12, count: 0 });
        return maxHour.hour;
      };

      const patterns = {
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar
        },
        timeframe: '60 days',
        timePatterns: {
          user: {
            peakHour: getUserPeakHour(),
            hourlyDistribution: userTimePatterns,
            mostActiveTimeLabel: getUserPeakHour() < 12 ? 'Morning Person' : getUserPeakHour() < 18 ? 'Afternoon Active' : 'Evening Active'
          },
          partner: {
            peakHour: getPartnerPeakHour(),
            hourlyDistribution: partnerTimePatterns,
            mostActiveTimeLabel: getPartnerPeakHour() < 12 ? 'Morning Person' : getPartnerPeakHour() < 18 ? 'Afternoon Active' : 'Evening Active'
          },
          overlap: Math.abs(getUserPeakHour() - getPartnerPeakHour()) <= 2 ? 'high' : 'medium'
        },
        dayPatterns: {
          user: userDayPatterns,
          partner: partnerDayPatterns
        },
        collaboration: {
          complementary: Object.keys(userTimePatterns).length > 0 && Object.keys(partnerTimePatterns).length > 0,
          coverageScore: Math.min(Object.keys(userTimePatterns).length + Object.keys(partnerTimePatterns).length, 24) / 24
        }
      };

      res.json(patterns);
    } catch (error) {
      console.error("Failed to analyze couple patterns:", error);
      res.status(500).json({ message: "Failed to analyze couple patterns" });
    }
  });

  app.get("/api/couple/insights", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get partner info
      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.status(404).json({ message: "No partner found" });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }

      // Get recent activities (last 30 days for insights)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const userActivities = await storage.getActivitiesByUserBetween(userId, thirtyDaysAgo, new Date());
      const partnerActivities = await storage.getActivitiesByUserBetween(partnerId, thirtyDaysAgo, new Date());

      // Get appreciations
      const userAppreciations = await storage.getAppreciationsByUser(userId);
      const partnerAppreciations = await storage.getAppreciationsByUser(partnerId);

      // Calculate insights
      const totalActivities = userActivities.length + partnerActivities.length;
      const userPercentage = totalActivities > 0 ? (userActivities.length / totalActivities) * 100 : 50;
      const partnerPercentage = 100 - userPercentage;

      // Analyze category strengths
      const userCategories: Record<string, number> = {};
      const partnerCategories: Record<string, number> = {};

      for (const activity of userActivities) {
        const category = await storage.getActivityCategory(activity.categoryId);
        const categoryName = category?.name || 'Other';
        userCategories[categoryName] = (userCategories[categoryName] || 0) + 1;
      }

      for (const activity of partnerActivities) {
        const category = await storage.getActivityCategory(activity.categoryId);
        const categoryName = category?.name || 'Other';
        partnerCategories[categoryName] = (partnerCategories[categoryName] || 0) + 1;
      }

      // Find strengths and opportunities
      const userTopCategory = Object.entries(userCategories)
        .sort(([,a], [,b]) => b - a)[0];
      const partnerTopCategory = Object.entries(partnerCategories)
        .sort(([,a], [,b]) => b - a)[0];

      // Generate insights based on patterns
      const insights = {
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar
        },
        timeframe: '30 days',
        balance: {
          status: Math.abs(userPercentage - 50) < 10 ? 'balanced' : userPercentage > 60 ? 'user_heavy' : 'partner_heavy',
          userPercentage: Math.round(userPercentage),
          partnerPercentage: Math.round(partnerPercentage),
          recommendation: Math.abs(userPercentage - 50) < 10 
            ? "Great teamwork! You're both contributing equally."
            : userPercentage > 60 
            ? `You're doing ${Math.round(userPercentage)}% of activities. Consider sharing some tasks with ${partner.name}.`
            : `${partner.name} is handling ${Math.round(partnerPercentage)}% of activities. Great support from your partner!`
        },
        strengths: {
          user: {
            category: userTopCategory?.[0] || 'General Support',
            count: userTopCategory?.[1] || 0,
            description: `You excel in ${userTopCategory?.[0] || 'supporting your relationship'}`
          },
          partner: {
            category: partnerTopCategory?.[0] || 'General Support',  
            count: partnerTopCategory?.[1] || 0,
            description: `${partner.name} excels in ${partnerTopCategory?.[0] || 'supporting your relationship'}`
          },
          complementary: userTopCategory?.[0] !== partnerTopCategory?.[0],
          message: userTopCategory?.[0] !== partnerTopCategory?.[0] 
            ? "You complement each other well with different strengths!" 
            : "You both focus on similar areas - great alignment!"
        },
        appreciation: {
          userReceived: userAppreciations.length,
          partnerReceived: partnerAppreciations.length,
          status: userAppreciations.length === partnerAppreciations.length ? 'balanced' 
                 : userAppreciations.length > partnerAppreciations.length ? 'user_appreciated' 
                 : 'partner_appreciated',
          recommendation: userAppreciations.length < partnerAppreciations.length 
            ? `Send more appreciations to ${partner.name} to show gratitude for their efforts!`
            : userAppreciations.length > partnerAppreciations.length
            ? `You receive lots of appreciation! Consider acknowledging ${partner.name}'s contributions too.`
            : "You both appreciate each other equally - wonderful!"
        },
        opportunities: [
          ...(Math.abs(userPercentage - 50) > 15 ? [{
            type: 'balance',
            title: 'Balance Activities',
            description: userPercentage > 65 
              ? `Consider delegating some ${userTopCategory?.[0] || 'tasks'} to ${partner.name}`
              : `You could help more with ${partnerTopCategory?.[0] || 'household activities'}`
          }] : []),
          ...(userAppreciations.length + partnerAppreciations.length < totalActivities * 0.3 ? [{
            type: 'appreciation',
            title: 'Increase Appreciation',
            description: 'Try sending more appreciations to acknowledge each other\'s efforts'
          }] : []),
          ...(totalActivities < 20 ? [{
            type: 'activity',
            title: 'Log More Activities',
            description: 'Track more of your daily contributions to get better insights'
          }] : [])
        ]
      };

      res.json(insights);
    } catch (error) {
      console.error("Failed to generate couple insights:", error);
      res.status(500).json({ message: "Failed to generate couple insights" });
    }
  });

  app.get("/api/couple/ai-analysis", async (req, res) => {
    try {
      const userId = req.headers["x-user-id"] as string;
      
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get partner info
      const couple = await storage.getCouple(userId);
      if (!couple) {
        return res.status(404).json({ message: "No partner found" });
      }

      const partnerId = couple.user1Id === userId ? couple.user2Id : couple.user1Id;
      const partner = await storage.getUser(partnerId);
      if (!partner) {
        return res.status(404).json({ message: "Partner not found" });
      }
      const user = await storage.getUser(userId);

      // Get activities for both partners (last 30 days for analysis)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const userActivities = await storage.getActivitiesByUserBetween(userId, thirtyDaysAgo, new Date());
      const partnerActivities = await storage.getActivitiesByUserBetween(partnerId, thirtyDaysAgo, new Date());

      // Map activities to include category information
      const userActivitiesWithCategories = await Promise.all(
        userActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );

      const partnerActivitiesWithCategories = await Promise.all(
        partnerActivities.map(async (activity) => {
          const category = await storage.getActivityCategory(activity.categoryId);
          return {
            title: activity.title,
            category: category?.name || 'household',
            points: activity.points,
            completedAt: activity.completedAt
          };
        })
      );

      // Get appreciations data
      const userAppreciations = await storage.getAppreciationsByUser(userId);
      const partnerAppreciations = await storage.getAppreciationsByUser(partnerId);

      const appreciationsData = {
        userReceived: userAppreciations.length,
        partnerReceived: partnerAppreciations.length
      };

      // Generate AI-powered relationship analysis
      const relationshipAnalysis = await analyzeRelationshipDynamics(
        userActivitiesWithCategories,
        partnerActivitiesWithCategories,
        user?.name || 'User',
        partner.name,
        appreciationsData
      );

      // Generate personalized recommendations
      const recommendations = await generateCoupleRecommendations(
        relationshipAnalysis.insights,
        userActivitiesWithCategories,
        partnerActivitiesWithCategories,
        user?.name || 'User',
        partner.name
      );

      // Create relationship summary
      const combinedStats = {
        totalActivities: userActivities.length + partnerActivities.length,
        totalPoints: userActivitiesWithCategories.reduce((sum, a) => sum + a.points, 0) + 
                    partnerActivitiesWithCategories.reduce((sum, a) => sum + a.points, 0),
        balance: {
          userPercentage: userActivities.length + partnerActivities.length > 0 
            ? (userActivities.length / (userActivities.length + partnerActivities.length)) * 100 
            : 50,
          partnerPercentage: userActivities.length + partnerActivities.length > 0 
            ? (partnerActivities.length / (userActivities.length + partnerActivities.length)) * 100 
            : 50
        }
      };

      const highlights = relationshipAnalysis.patterns
        .filter(p => p.strength === 'positive')
        .map(p => p.description);
      
      const improvements = relationshipAnalysis.insights
        .filter(i => i.priority === 'high' || i.priority === 'medium')
        .map(i => i.recommendation);

      const relationshipSummary = await generateRelationshipSummary(
        '30 days',
        combinedStats,
        highlights,
        improvements,
        user?.name || 'User',
        partner.name
      );

      const analysis = {
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          avatar: partner.avatar
        },
        timeframe: '30 days',
        summary: relationshipSummary,
        healthScore: relationshipAnalysis.healthScore,
        overallHealth: relationshipAnalysis.overallHealth,
        insights: relationshipAnalysis.insights,
        patterns: relationshipAnalysis.patterns,
        recommendations: recommendations,
        stats: {
          activities: {
            user: userActivities.length,
            partner: partnerActivities.length,
            total: userActivities.length + partnerActivities.length
          },
          points: {
            user: userActivitiesWithCategories.reduce((sum, a) => sum + a.points, 0),
            partner: partnerActivitiesWithCategories.reduce((sum, a) => sum + a.points, 0),
            total: combinedStats.totalPoints
          },
          appreciations: appreciationsData
        }
      };

      res.json(analysis);
    } catch (error) {
      console.error("Failed to generate AI couple analysis:", error);
      res.status(500).json({ message: "Failed to generate couple analysis" });
    }
  });

  // Site Content Management Routes
  
  // Site Settings Routes
  app.get("/api/site/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      console.error("Failed to get site settings:", error);
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });

  app.put("/api/site/settings", async (req, res) => {
    try {
      const data = insertSiteSettingsSchema.parse(req.body);
      const settings = await storage.updateSiteSettings(data);
      res.json(settings);
    } catch (error) {
      console.error("Failed to update site settings:", error);
      res.status(400).json({ message: "Invalid site settings data" });
    }
  });

  // Site Pages Routes
  app.get("/api/site/pages", async (req, res) => {
    try {
      const pages = await storage.getSitePages();
      res.json(pages);
    } catch (error) {
      console.error("Failed to get site pages:", error);
      res.status(500).json({ message: "Failed to get site pages" });
    }
  });

  app.get("/api/site/pages/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const page = await storage.getSitePage(slug);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Failed to get site page:", error);
      res.status(500).json({ message: "Failed to get site page" });
    }
  });

  app.post("/api/site/pages", async (req, res) => {
    try {
      const data = insertSitePageSchema.parse(req.body);
      const page = await storage.createSitePage(data);
      res.json(page);
    } catch (error) {
      console.error("Failed to create site page:", error);
      res.status(400).json({ message: "Invalid site page data" });
    }
  });

  app.put("/api/site/pages/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const data = insertSitePageSchema.parse(req.body);
      const page = await storage.updateSitePage(slug, data);
      if (!page) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json(page);
    } catch (error) {
      console.error("Failed to update site page:", error);
      res.status(400).json({ message: "Invalid site page data" });
    }
  });

  app.delete("/api/site/pages/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const deleted = await storage.deleteSitePage(slug);
      if (!deleted) {
        return res.status(404).json({ message: "Page not found" });
      }
      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Failed to delete site page:", error);
      res.status(500).json({ message: "Failed to delete site page" });
    }
  });

  // Contact Form Routes
  app.post("/api/contact", async (req, res) => {
    try {
      const data = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(data);
      
      // TODO: Send email notification here
      console.log("New contact submission:", submission);
      
      res.json({ message: "Contact form submitted successfully", id: submission.id });
    } catch (error) {
      console.error("Failed to submit contact form:", error);
      res.status(400).json({ message: "Invalid contact form data" });
    }
  });

  app.get("/api/contact/submissions", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error("Failed to get contact submissions:", error);
      res.status(500).json({ message: "Failed to get contact submissions" });
    }
  });

  app.put("/api/contact/submissions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      const submission = await storage.updateContactSubmission(id, updates);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      res.json(submission);
    } catch (error) {
      console.error("Failed to update contact submission:", error);
      res.status(500).json({ message: "Failed to update contact submission" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
