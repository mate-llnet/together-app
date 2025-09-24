import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Button } from "@/components/ui/button";

export default function WeeklyProgress() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const { data: partner } = useQuery({
    queryKey: ["/api/partner"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  // Calculate balance percentages
  const userPercentage = stats?.stats.balance || 50;
  const partnerPercentage = 100 - userPercentage;

  const getBalanceMessage = () => {
    if (userPercentage >= 45 && userPercentage <= 55) {
      return {
        title: "Great teamwork! 🎉",
        description: "You're both contributing actively to your shared responsibilities"
      };
    } else if (userPercentage > 55) {
      return {
        title: "You're doing amazing! 💪",
        description: `You're taking on ${userPercentage}% of the tasks. Your efforts are appreciated!`
      };
    } else {
      return {
        title: "Strong partnership! 🤝",
        description: `${partner?.partner?.name || 'Your partner'} is taking the lead this week`
      };
    }
  };

  const balanceMessage = getBalanceMessage();

  return (
    <div className="bg-card rounded-xl border border-border p-6" data-testid="weekly-progress">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">This Week</h3>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Details
        </Button>
      </div>
      
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Your contributions</span>
            <span className="font-medium text-foreground" data-testid="text-user-percentage">
              {userPercentage}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${userPercentage}%` }}
              data-testid="progress-user"
            ></div>
          </div>
        </div>
        
        {partner?.partner && (
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-muted-foreground">{partner.partner.name}'s contributions</span>
              <span className="font-medium text-foreground" data-testid="text-partner-percentage">
                {partnerPercentage}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-secondary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${partnerPercentage}%` }}
                data-testid="progress-partner"
              ></div>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-4 p-3 bg-accent/50 rounded-lg">
        <p className="text-sm text-foreground font-medium" data-testid="text-balance-title">
          {balanceMessage.title}
        </p>
        <p className="text-xs text-muted-foreground mt-1" data-testid="text-balance-description">
          {balanceMessage.description}
        </p>
      </div>
    </div>
  );
}
