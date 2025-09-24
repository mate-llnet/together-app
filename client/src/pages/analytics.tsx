import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Calendar, Award } from "lucide-react";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

export default function Analytics() {
  const { user } = useAuth();

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const { data: activitiesData } = useQuery({
    queryKey: ["/api/activities", { limit: 30 }],
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

  const { data: partnerActivitiesData } = useQuery({
    queryKey: ["/api/activities/partner", { limit: 30 }],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!partner?.partner
  });

  const activities = activitiesData?.activities || [];
  const partnerActivities = partnerActivitiesData?.activities || [];

  // Calculate weekly data
  const weeklyData = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const userDayActivities = activities.filter((activity: any) => {
      const activityDate = new Date(activity.completedAt);
      return activityDate >= dayStart && activityDate < dayEnd;
    });

    const partnerDayActivities = partnerActivities.filter((activity: any) => {
      const activityDate = new Date(activity.completedAt);
      return activityDate >= dayStart && activityDate < dayEnd;
    });

    weeklyData.push({
      date: format(date, 'EEE'),
      user: userDayActivities.length,
      partner: partnerDayActivities.length,
      userPoints: userDayActivities.reduce((sum: number, a: any) => sum + a.points, 0),
      partnerPoints: partnerDayActivities.reduce((sum: number, a: any) => sum + a.points, 0),
    });
  }

  // Category breakdown
  const categoryStats: Record<string, { count: number; points: number }> = {};
  activities.forEach((activity: any) => {
    const categoryName = activity.category?.name || 'Other';
    if (!categoryStats[categoryName]) {
      categoryStats[categoryName] = { count: 0, points: 0 };
    }
    categoryStats[categoryName].count++;
    categoryStats[categoryName].points += activity.points;
  });

  const topCategories = Object.entries(categoryStats)
    .sort(([,a], [,b]) => b.points - a.points)
    .slice(0, 5);

  // Calculate streaks and trends
  const currentWeekActivities = activities.filter((activity: any) => {
    const activityDate = new Date(activity.completedAt);
    const weekStart = startOfWeek(new Date());
    const weekEnd = endOfWeek(new Date());
    return activityDate >= weekStart && activityDate <= weekEnd;
  });

  const lastWeekActivities = activities.filter((activity: any) => {
    const activityDate = new Date(activity.completedAt);
    const lastWeekStart = startOfWeek(subDays(new Date(), 7));
    const lastWeekEnd = endOfWeek(subDays(new Date(), 7));
    return activityDate >= lastWeekStart && activityDate <= lastWeekEnd;
  });

  const weeklyGrowth = lastWeekActivities.length > 0 ? 
    Math.round(((currentWeekActivities.length - lastWeekActivities.length) / lastWeekActivities.length) * 100) : 0;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Analytics Dashboard 📊
        </h2>
        <p className="text-muted-foreground">
          Insights into your relationship contributions and patterns
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Activities</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-activities">
                  {activities.length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-total-points">
                  {stats?.stats.totalPoints || 0}
                </p>
              </div>
              <Award className="w-8 h-8 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current Streak</p>
                <p className="text-2xl font-bold text-foreground" data-testid="text-current-streak">
                  {stats?.stats.streak || 0} days
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Weekly Growth</p>
                <p className={`text-2xl font-bold ${weeklyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} data-testid="text-weekly-growth">
                  {weeklyGrowth >= 0 ? '+' : ''}{weeklyGrowth}%
                </p>
              </div>
              <Calendar className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Weekly Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>7-Day Activity Overview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((day, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-medium">{day.date}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-primary">You: {day.user}</span>
                      {partner?.partner && (
                        <span className="text-secondary">{partner.partner.name}: {day.partner}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (day.user / Math.max(day.user + day.partner, 1)) * 100)}%` }}
                      ></div>
                    </div>
                    {partner?.partner && (
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-secondary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (day.partner / Math.max(day.user + day.partner, 1)) * 100)}%` }}
                        ></div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Top Activity Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topCategories.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No activities to analyze yet</p>
              ) : (
                topCategories.map(([category, data], index) => (
                  <div key={category} className="space-y-2" data-testid={`category-${index}`}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground" data-testid={`category-name-${index}`}>
                        {category}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-muted-foreground" data-testid={`category-count-${index}`}>
                          {data.count} activities
                        </span>
                        <span className="text-secondary font-medium" data-testid={`category-points-${index}`}>
                          {data.points} pts
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min(100, (data.points / Math.max(...topCategories.map(([,d]) => d.points))) * 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Balance & Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Relationship Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2" data-testid="text-balance-score">
                  {stats?.stats.balance || 50}%
                </div>
                <p className="text-sm text-muted-foreground">Your contribution balance</p>
              </div>

              {partner?.partner && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Your activities this week</span>
                      <span className="font-medium text-foreground" data-testid="text-user-week-count">
                        {currentWeekActivities.length}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (currentWeekActivities.length / Math.max(currentWeekActivities.length + (partnerActivities.filter((a: any) => {
                          const date = new Date(a.completedAt);
                          return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
                        }).length), 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-muted-foreground">{partner.partner.name}'s activities this week</span>
                      <span className="font-medium text-foreground" data-testid="text-partner-week-count">
                        {partnerActivities.filter((a: any) => {
                          const date = new Date(a.completedAt);
                          return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
                        }).length}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-secondary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${100 - Math.min(100, (currentWeekActivities.length / Math.max(currentWeekActivities.length + (partnerActivities.filter((a: any) => {
                          const date = new Date(a.completedAt);
                          return date >= startOfWeek(new Date()) && date <= endOfWeek(new Date());
                        }).length), 1)) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Insights & Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm font-medium text-foreground mb-1">
                  🔥 Current Streak
                </p>
                <p className="text-xs text-muted-foreground">
                  You've been active for {stats?.stats.streak || 0} consecutive days! Keep it up!
                </p>
              </div>

              <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/20">
                <p className="text-sm font-medium text-foreground mb-1">
                  💝 Appreciation Score
                </p>
                <p className="text-xs text-muted-foreground">
                  Your current appreciation score is {stats?.stats.appreciationScore || 0}%. 
                  {partner?.partner ? ` ${partner.partner.name} really values your contributions!` : ' Keep logging activities to improve your score!'}
                </p>
              </div>

              {weeklyGrowth !== 0 && (
                <div className={`p-3 rounded-lg border ${
                  weeklyGrowth > 0 
                    ? 'bg-green-500/5 border-green-500/20' 
                    : 'bg-amber-500/5 border-amber-500/20'
                }`}>
                  <p className="text-sm font-medium text-foreground mb-1">
                    {weeklyGrowth > 0 ? '📈 Great Progress' : '📊 Opportunity'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {weeklyGrowth > 0 
                      ? `You've increased your activity by ${weeklyGrowth}% this week compared to last week!`
                      : `Consider adding more activities to match last week's pace.`
                    }
                  </p>
                </div>
              )}

              {topCategories.length > 0 && (
                <div className="p-3 bg-accent/5 rounded-lg border border-accent/20">
                  <p className="text-sm font-medium text-foreground mb-1">
                    🌟 Top Focus Area
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You're most active in <strong>{topCategories[0][0]}</strong> with {topCategories[0][1].count} activities and {topCategories[0][1].points} points.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
