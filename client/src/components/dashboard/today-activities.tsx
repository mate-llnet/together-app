import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function TodayActivities() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: activitiesData, isLoading } = useQuery({
    queryKey: ["/api/activities", { date: today }],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const activities = activitiesData?.activities || [];

  const getIconForCategory = (categoryId: string) => {
    const iconMap: Record<string, string> = {
      household: "fas fa-home",
      childcare: "fas fa-baby",
      finance: "fas fa-dollar-sign",
      maintenance: "fas fa-wrench",
      cooking: "fas fa-utensils",
      shopping: "fas fa-shopping-cart",
      transportation: "fas fa-car",
      emotional_support: "fas fa-heart",
    };
    return iconMap[categoryId] || "fas fa-home";
  };

  const getColorForCategory = (categoryId: string) => {
    const colorMap: Record<string, string> = {
      household: "primary",
      childcare: "blue-500",
      finance: "green-500",
      maintenance: "purple-500",
      cooking: "pink-500",
      shopping: "amber-500",
      transportation: "blue-500",
      emotional_support: "secondary",
    };
    return colorMap[categoryId] || "primary";
  };

  const getColorClasses = (color: string) => {
    switch (color) {
      case "primary":
        return "bg-primary/10 text-primary";
      case "blue-500":
        return "bg-blue-500/10 text-blue-500";
      case "green-500":
        return "bg-green-500/10 text-green-500";
      case "purple-500":
        return "bg-purple-500/10 text-purple-500";
      case "pink-500":
        return "bg-pink-500/10 text-pink-500";
      case "amber-500":
        return "bg-amber-500/10 text-amber-500";
      case "secondary":
        return "bg-secondary/10 text-secondary";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="today-activities">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">Today's Activities</h3>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </div>
      
      <div className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-12 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No activities logged today</p>
            <p className="text-sm text-muted-foreground mt-1">Start by adding your first activity!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity: any) => {
              const icon = getIconForCategory(activity.categoryId);
              const color = getColorForCategory(activity.categoryId);
              const colorClasses = getColorClasses(color);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  data-testid={`activity-${activity.id}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses}`}>
                    <i className={icon}></i>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground" data-testid={`activity-title-${activity.id}`}>
                      {activity.title}
                    </h4>
                    <p className="text-sm text-muted-foreground" data-testid={`activity-time-${activity.id}`}>
                      {format(new Date(activity.completedAt), 'h:mm a')} • {activity.category?.name || 'General'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-secondary" data-testid={`activity-points-${activity.id}`}>
                      +{activity.points} pts
                    </span>
                    {activity.isAiSuggested && (
                      <p className="text-xs text-muted-foreground">AI Suggested</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
