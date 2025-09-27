import { ActivityWithUser } from "@shared/schema";
import { Button } from "@/components/ui/button";

interface ActivityListProps {
  activities: ActivityWithUser[];
  title: string;
  showUser?: boolean;
}

const categoryIcons: Record<string, { icon: string; color: string }> = {
  household: { icon: "fas fa-home", color: "text-primary" },
  childcare: { icon: "fas fa-baby", color: "text-blue-500" },
  finances: { icon: "fas fa-dollar-sign", color: "text-green-500" },
  maintenance: { icon: "fas fa-wrench", color: "text-purple-500" },
  personal: { icon: "fas fa-user", color: "text-yellow-500" },
  other: { icon: "fas fa-star", color: "text-gray-500" },
};

export default function ActivityList({ activities, title, showUser = false }: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <div className="p-6">
          <div className="text-center py-8">
            <i className="fas fa-clipboard-list text-4xl text-muted-foreground mb-4"></i>
            <p className="text-muted-foreground">No activities found for this period.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
            View All
          </Button>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        {activities.map((activity) => {
          const categoryInfo = categoryIcons[activity.category] || categoryIcons.other;
          
          return (
            <div
              key={activity.id}
              className="flex items-center space-x-4 p-4 bg-muted/30 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              data-testid={`activity-item-${activity.id}`}
            >
              <div className={`w-10 h-10 ${categoryInfo.color.replace('text-', 'bg-')}/10 rounded-lg flex items-center justify-center`}>
                <i className={`${categoryInfo.icon} ${categoryInfo.color}`}></i>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{activity.title}</h4>
                <p className="text-sm text-muted-foreground">
                  {new Date(activity.completedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })} • {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
                  {showUser && ` • ${activity.user.name}`}
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-secondary">+{activity.points} pts</span>
                {activity.isAiSuggested && (
                  <p className="text-xs text-muted-foreground">AI Suggested</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
