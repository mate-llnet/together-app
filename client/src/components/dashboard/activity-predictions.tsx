import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Brain, Clock, Zap, TrendingUp, Plus } from "lucide-react";

interface ActivityPrediction {
  title: string;
  description: string;
  category: string;
  points: number;
  confidence: number;
  reasoning: string;
  predictedTime: string;
  categoryInfo?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
}

interface UserPatterns {
  commonTimes: string[];
  frequentCategories: string[];
  averageActivitiesPerDay: number;
  longestStreak: number;
  totalActivities: number;
}

export function ActivityPredictions() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: patternsData, isLoading: patternsLoading } = useQuery({
    queryKey: ["/api/ai/patterns"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id
  });

  const { data: predictionsData, isLoading: predictionsLoading } = useQuery({
    queryKey: ["/api/ai/predictions"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id
  });

  const addActivityMutation = useMutation({
    mutationFn: (prediction: ActivityPrediction) =>
      apiRequest("POST", "/api/activities", {
        title: prediction.title,
        categoryId: prediction.categoryInfo?.id || "household",
        points: prediction.points,
        description: prediction.description + " (AI Predicted)"
      }, {
        headers: { "x-user-id": user?.id || "" }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Activity Added",
        description: "AI prediction has been added to your activities!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add predicted activity",
        variant: "destructive",
      });
    }
  });

  const patterns: UserPatterns | undefined = (patternsData as any)?.patterns;
  const predictions: ActivityPrediction[] = (predictionsData as any)?.predictions || [];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return "text-green-600";
    if (confidence >= 70) return "text-blue-600";
    return "text-yellow-600";
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 85) return "High";
    if (confidence >= 70) return "Medium";
    return "Low";
  };

  return (
    <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-border p-6" data-testid="activity-predictions">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Brain className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Smart Predictions</h3>
        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full">
          AI Pattern Analysis
        </span>
      </div>

      {/* User Patterns Summary */}
      {patterns && !patternsLoading && (
        <div className="mb-6 p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-border" data-testid="patterns-summary">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-foreground">Your Activity Patterns</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Most Active:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patterns.commonTimes.slice(0, 2).map((time) => (
                  <Badge key={time} variant="secondary" className="text-xs">
                    {time}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Favorite Categories:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patterns.frequentCategories.slice(0, 2).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Daily Average:</span>
              <span className="ml-2 font-medium text-foreground">
                {patterns.averageActivitiesPerDay.toFixed(1)} activities
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Longest Streak:</span>
              <span className="ml-2 font-medium text-foreground">
                {patterns.longestStreak} days
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Predictions */}
      <div className="space-y-4">
        {predictionsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-border animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : predictions.length > 0 ? (
          predictions.map((prediction, index) => (
            <div key={index} className="p-4 bg-white/70 dark:bg-gray-900/70 rounded-lg border border-border hover:border-blue-200 dark:hover:border-blue-800 transition-colors" data-testid={`prediction-${index}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-foreground">{prediction.title}</h4>
                    <Badge 
                      variant={prediction.confidence >= 85 ? "default" : prediction.confidence >= 70 ? "secondary" : "outline"}
                      className="text-xs"
                    >
                      {getConfidenceBadge(prediction.confidence)} ({prediction.confidence}%)
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{prediction.description}</p>
                  
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Zap className="w-3 h-3" />
                      <span>{prediction.points} points</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{prediction.predictedTime}</span>
                    </div>
                    {prediction.categoryInfo && (
                      <Badge variant="outline" className="text-xs">
                        {prediction.categoryInfo.name}
                      </Badge>
                    )}
                  </div>
                </div>
                
                <Button
                  size="sm"
                  onClick={() => addActivityMutation.mutate(prediction)}
                  disabled={addActivityMutation.isPending}
                  className="ml-4"
                  data-testid={`add-prediction-${index}`}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
              </div>
              
              <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded border">
                <strong>AI Reasoning:</strong> {prediction.reasoning}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground" data-testid="no-predictions">
            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Add more activities to get AI-powered predictions!</p>
            <p className="text-xs">We need some activity history to analyze your patterns.</p>
          </div>
        )}
      </div>

      {patternsLoading && (
        <div className="text-center py-4">
          <div className="animate-pulse text-sm text-muted-foreground">
            Analyzing your activity patterns...
          </div>
        </div>
      )}
    </div>
  );
}