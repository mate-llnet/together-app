import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Target, Flame, TrendingUp, Clock, Gift, Crown, Zap, Medal, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: string;
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isEarned: boolean;
  earnedAt: string | null;
  isNew: boolean;
  progress: number;
}

interface UserStats {
  totalPoints: number;
  totalActivities: number;
  currentStreak: number;
  longestStreak: number;
  level: number;
}

interface Milestone {
  id: string;
  type: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  isCompleted: boolean;
  completedAt: string | null;
}

export function AchievementsMilestones() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);

  const { data: statsData } = useQuery({
    queryKey: ["/api/gamification/stats"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id,
  });

  const { data: achievementsData } = useQuery({
    queryKey: ["/api/gamification/achievements"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id,
  });

  const { data: milestonesData } = useQuery({
    queryKey: ["/api/gamification/milestones"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id,
  });

  const markSeenMutation = useMutation({
    mutationFn: async (achievementId: string) => {
      const response = await fetch(`/api/gamification/achievements/${achievementId}/seen`, {
        method: 'POST',
        headers: {
          'x-user-id': user?.id || '',
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to mark achievement as seen');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gamification/achievements"] });
    },
  });

  const userStats: UserStats | undefined = (statsData as any)?.stats;
  const nextLevelPoints: number = (statsData as any)?.nextLevelPoints || 0;
  const progressToNextLevel: number = (statsData as any)?.progressToNextLevel || 0;

  const achievements: Achievement[] = (achievementsData as any)?.achievements || [];
  const totalEarned: number = (achievementsData as any)?.totalEarned || 0;
  const newAchievements: number = (achievementsData as any)?.newAchievements || 0;

  const milestones: Milestone[] = (milestonesData as any)?.milestones || [];

  // Show celebration for new achievements
  useEffect(() => {
    const newAchievement = achievements.find(a => a.isNew && a.isEarned);
    if (newAchievement && !celebrationAchievement) {
      setCelebrationAchievement(newAchievement);
    }
  }, [achievements, celebrationAchievement]);

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'text-yellow-600 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-300 dark:border-yellow-700';
      case 'epic': return 'text-purple-600 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-300 dark:border-purple-700';
      case 'rare': return 'text-blue-600 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-300 dark:border-blue-700';
      case 'uncommon': return 'text-green-600 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 border-green-300 dark:border-green-700';
      default: return 'text-gray-600 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20 border-gray-300 dark:border-gray-700';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return <Crown className="w-4 h-4" />;
      case 'epic': return <Zap className="w-4 h-4" />;
      case 'rare': return <Medal className="w-4 h-4" />;
      case 'uncommon': return <Star className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const handleCelebrationClose = () => {
    if (celebrationAchievement) {
      markSeenMutation.mutate(celebrationAchievement.id);
      setCelebrationAchievement(null);
    }
  };

  const earnedAchievements = achievements.filter(a => a.isEarned);
  const availableAchievements = achievements.filter(a => !a.isEarned);

  return (
    <>
      <div className="bg-gradient-to-br from-purple-50/50 to-blue-50/50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-xl border border-border p-6" data-testid="achievements-milestones">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Progress & Achievements</h3>
              {newAchievements > 0 && (
                <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 text-xs font-medium rounded-full animate-pulse">
                  {newAchievements} new!
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">Level {userStats?.level || 1}</div>
            <div className="text-sm text-muted-foreground">{userStats?.totalPoints || 0} points</div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-border" data-testid="level-progress">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Level {userStats?.level || 1} Progress</span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progressToNextLevel)}% to Level {(userStats?.level || 1) + 1}
            </span>
          </div>
          <Progress value={progressToNextLevel} className="h-2 mb-2" />
          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Flame className="w-3 h-3" />
              <span>{userStats?.currentStreak || 0} day streak</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>{userStats?.totalActivities || 0} activities</span>
            </div>
          </div>
        </div>

        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements" className="flex items-center space-x-2">
              <Trophy className="w-4 h-4" />
              <span>Achievements ({totalEarned}/{achievements.length})</span>
            </TabsTrigger>
            <TabsTrigger value="milestones" className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Milestones</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="achievements" className="space-y-4">
            {/* Earned Achievements */}
            {earnedAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center space-x-2">
                  <Gift className="w-4 h-4" />
                  <span>Earned Achievements</span>
                </h4>
                <div className="grid gap-3 mb-6">
                  {earnedAchievements.slice(0, 3).map((achievement) => (
                    <div 
                      key={achievement.id}
                      className={`p-3 rounded-lg border-2 ${getRarityColor(achievement.rarity)} ${achievement.isNew ? 'animate-pulse' : ''}`}
                      data-testid={`achievement-earned-${achievement.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium text-foreground">{achievement.name}</h5>
                            {getRarityIcon(achievement.rarity)}
                            <Badge variant="secondary" className="text-xs">+{achievement.points} pts</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Achievements */}
            {availableAchievements.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3">Available Achievements</h4>
                <div className="space-y-2">
                  {availableAchievements.slice(0, 3).map((achievement) => (
                    <div 
                      key={achievement.id}
                      className="p-3 rounded-lg border border-border bg-white/30 dark:bg-gray-900/30 opacity-75"
                      data-testid={`achievement-available-${achievement.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl grayscale">{achievement.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h5 className="font-medium text-foreground">{achievement.name}</h5>
                            <Badge variant="outline" className="text-xs">+{achievement.points} pts</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="milestones" className="space-y-3">
            {milestones.length > 0 ? (
              milestones.map((milestone) => (
                <div 
                  key={milestone.id}
                  className={`p-4 rounded-lg border ${milestone.isCompleted ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' : 'bg-white/50 dark:bg-gray-900/50'}`}
                  data-testid={`milestone-${milestone.id}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-foreground flex items-center space-x-2">
                      {milestone.isCompleted ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Target className="w-4 h-4 text-blue-600" />
                      )}
                      <span>{milestone.title}</span>
                    </h5>
                    <div className="text-xs text-muted-foreground">
                      {milestone.currentValue} / {milestone.targetValue}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{milestone.description}</p>
                  <Progress value={milestone.progressPercentage} className="h-2" />
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No active milestones</p>
                <p className="text-xs mt-1">Complete more activities to unlock new goals!</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Achievement Celebration Dialog */}
      <Dialog open={!!celebrationAchievement} onOpenChange={handleCelebrationClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl flex items-center justify-center space-x-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <span>Achievement Unlocked!</span>
            </DialogTitle>
          </DialogHeader>
          {celebrationAchievement && (
            <div className={`p-6 rounded-lg border-2 ${getRarityColor(celebrationAchievement.rarity)} text-center`}>
              <div className="text-6xl mb-4">{celebrationAchievement.icon}</div>
              <h3 className="text-xl font-bold text-foreground mb-2">{celebrationAchievement.name}</h3>
              <p className="text-muted-foreground mb-4">{celebrationAchievement.description}</p>
              <div className="flex items-center justify-center space-x-2">
                {getRarityIcon(celebrationAchievement.rarity)}
                <Badge variant="secondary" className="text-sm">+{celebrationAchievement.points} points</Badge>
              </div>
              <Button onClick={handleCelebrationClose} className="mt-4 w-full" data-testid="celebration-close">
                Awesome! 🎉
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}