import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import StatCard from "@/components/dashboard/stat-card";
import TodayActivities from "@/components/dashboard/today-activities";
import AiSuggestions from "@/components/dashboard/ai-suggestions";
import PartnerAppreciation from "@/components/dashboard/partner-appreciation";
import WeeklyProgress from "@/components/dashboard/weekly-progress";
import { ActivityPredictions } from "@/components/dashboard/activity-predictions";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
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

  const currentTime = new Date();
  const timeOfDay = currentTime.getHours() < 12 ? "morning" : 
                   currentTime.getHours() < 17 ? "afternoon" : "evening";

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-greeting">
              Good {timeOfDay}, {user?.name}! 👋
            </h2>
            <p className="text-muted-foreground">
              {partner?.partner ? 
                `Let's see what you and ${partner.partner.name} accomplished today` :
                "Let's see what you accomplished today"
              }
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm text-muted-foreground">Today's Date</p>
              <p className="font-medium text-foreground" data-testid="text-date">
                {formatDate(currentTime)}
              </p>
            </div>
            <Link href="/add-activity">
              <Button className="flex items-center space-x-2" data-testid="button-quick-add">
                <Plus className="w-4 h-4" />
                <span>Quick Add</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <StatCard
          title="Tasks Today"
          value={stats?.stats.todayTasks || 0}
          icon="fas fa-tasks"
          color="primary"
          change="+3 from yesterday"
          emoji="📈"
        />
        <StatCard
          title="Appreciation Score"
          value={`${stats?.stats.appreciationScore || 0}%`}
          icon="fas fa-heart"
          color="secondary"
          change="+2% this week"
          emoji="💝"
        />
        <StatCard
          title="Task Balance"
          value={`${stats?.stats.balance || 50}%`}
          icon="fas fa-balance-scale"
          color="amber-500"
          change="Well balanced"
          emoji="⚖️"
        />
        <StatCard
          title="Day Streak"
          value={stats?.stats.streak || 0}
          icon="fas fa-fire"
          color="green-500"
          change="Keep it up!"
          emoji="🔥"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Today's Activities */}
        <div className="lg:col-span-2 space-y-6">
          <TodayActivities />
          <ActivityPredictions />
          <AiSuggestions />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <PartnerAppreciation />
          <WeeklyProgress />
        </div>
      </div>
    </div>
  );
}
