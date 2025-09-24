import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function PartnerAppreciation() {
  const { user } = useAuth();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: partner } = useQuery({
    queryKey: ["/api/partner"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const { data: partnerActivitiesData, isLoading } = useQuery({
    queryKey: ["/api/activities/partner", { date: today }],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!partner?.partner
  });

  const appreciationMutation = useMutation({
    mutationFn: (activityId: string) => 
      apiRequest("POST", "/api/appreciations", {
        toUserId: partner?.partner?.id,
        activityId: activityId,
      }, {
        headers: { "x-user-id": user?.id }
      }),
    onSuccess: () => {
      toast({
        title: "Appreciation Sent! ❤️",
        description: "Your partner will love knowing you noticed!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send appreciation",
        variant: "destructive",
      });
    }
  });

  const partnerActivities = partnerActivitiesData?.activities || [];

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

  if (!partner?.partner) {
    return (
      <div className="bg-card rounded-xl border border-border p-6" data-testid="partner-appreciation">
        <h3 className="text-lg font-semibold text-foreground mb-4">Partner Connection</h3>
        <div className="text-center py-6">
          <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Connect with your partner to see their activities</p>
          <Button variant="outline" size="sm" data-testid="button-invite-partner">
            Invite Partner
          </Button>
        </div>
      </div>
    );
  }

  // Calculate completion percentage (simplified)
  const completionPercentage = Math.min(100, partnerActivities.length * 10);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="partner-appreciation">
      <div className="p-6 border-b border-border">
        <h3 className="text-lg font-semibold text-foreground">{partner.partner.name}'s Day ❤️</h3>
        <p className="text-sm text-muted-foreground mt-1">What your partner accomplished</p>
      </div>
      
      <div className="p-6">
        {/* Partner's Profile Section */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-medium text-lg">
              {partner.partner.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="font-medium text-foreground" data-testid="text-partner-name">
              {partner.partner.name}
            </p>
            <p className="text-sm text-muted-foreground" data-testid="text-partner-activities-count">
              {partnerActivities.length} activities today
            </p>
          </div>
          <div className="text-right">
            <div className="w-12 h-12 relative">
              <svg className="w-12 h-12 progress-ring" viewBox="0 0 36 36">
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-muted/20"
                ></circle>
                <circle 
                  cx="18" 
                  cy="18" 
                  r="16" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray={`${completionPercentage},${100 - completionPercentage}`}
                  className="text-secondary"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-foreground" data-testid="text-completion-percentage">
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
                <div className="w-6 h-6 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        ) : partnerActivities.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No activities from {partner.partner.name} today</p>
          </div>
        ) : (
          <div className="space-y-3">
            {partnerActivities.slice(0, 3).map((activity: any) => {
              const icon = getIconForCategory(activity.categoryId);
              const color = getColorForCategory(activity.categoryId);
              const colorClasses = getColorClasses(color);
              
              return (
                <div 
                  key={activity.id} 
                  className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                  data-testid={`partner-activity-${activity.id}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses}`}>
                    <i className={`${icon} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground" data-testid={`partner-activity-title-${activity.id}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid={`partner-activity-time-${activity.id}`}>
                      {format(new Date(activity.completedAt), 'h:mm a')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => appreciationMutation.mutate(activity.id)}
                    disabled={appreciationMutation.isPending}
                    className="text-secondary hover:text-secondary/80 p-1"
                    data-testid={`button-appreciate-${activity.id}`}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {partnerActivities.length > 0 && (
          <Button 
            className="w-full mt-4 bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center space-x-2"
            variant="ghost"
            data-testid="button-send-appreciation"
          >
            <Heart className="w-4 h-4" />
            <span>Send Appreciation</span>
          </Button>
        )}
      </div>
    </div>
  );
}
