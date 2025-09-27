import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGroupContext } from "@/hooks/use-group-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lightbulb, Heart, TrendingUp, Users, Award, AlertTriangle, RefreshCw, BarChart3 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import GroupSelector from "@/components/dashboard/group-selector";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface ActivityStats {
  todayTasks: number;
  appreciationScore: number;
  balance: number;
  streak: number;
  totalPoints: number;
}

export default function Insights() {
  const { user } = useAuth();
  const { currentGroup, setCurrentGroup } = useGroupContext();

  const { data: groupDetails } = useQuery({
    queryKey: [`/api/relationships/${currentGroup?.id}`],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!currentGroup?.id
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/analytics/stats"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  if (!currentGroup) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Group Insights</h1>
          <p className="text-muted-foreground">Analyze your group's activity patterns and dynamics</p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No Group Selected</AlertTitle>
          <AlertDescription>
            Please select a group to view insights and analytics.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const members: GroupMember[] = groupDetails?.members || [];
  const userStats: ActivityStats = stats?.stats || {
    todayTasks: 0,
    appreciationScore: 0,
    balance: 50,
    streak: 0,
    totalPoints: 0
  };

  const currentUserMember = members.find(m => m.id === user?.id);
  const otherMembers = members.filter(m => m.id !== user?.id);

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Group Insights</h1>
            <p className="text-muted-foreground">
              Analyze activity patterns and group dynamics
            </p>
          </div>
        </div>

        {/* Group Selector */}
        <div className="mb-6">
          <GroupSelector
            currentGroupId={currentGroup?.id}
            onGroupChange={setCurrentGroup}
          />
        </div>

        {/* Group Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
              <p className="text-xs text-muted-foreground">
                Active members in {currentGroup.name}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Tasks Today</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.todayTasks}</div>
              <p className="text-xs text-muted-foreground">
                Activities completed today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.balance}%</div>
              <p className="text-xs text-muted-foreground">
                Your contribution percentage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.streak}</div>
              <p className="text-xs text-muted-foreground">
                Days with activities
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Group Members Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Member Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Member Overview</span>
              </CardTitle>
              <CardDescription>
                See how members contribute to {currentGroup.name}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {member.role}
                        {member.id === user?.id && " (You)"}
                      </div>
                    </div>
                  </div>
                  <Badge variant={member.status === 'active' ? 'default' : 'secondary'}>
                    {member.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Activity Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Activity Insights</span>
              </CardTitle>
              <CardDescription>
                Smart insights about your group's activity patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Group Type: {currentGroup.type.replace('_', ' ')}</p>
                    <p className="text-sm text-muted-foreground">
                      Your group is optimized for {currentGroup.type === 'romantic' ? 'romantic partnerships' :
                      currentGroup.type === 'family' ? 'family dynamics' :
                      currentGroup.type === 'roommates' ? 'shared living' :
                      currentGroup.type === 'work_team' ? 'team collaboration' : 'group coordination'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Appreciation Score: {userStats.appreciationScore}%</p>
                    <p className="text-sm text-muted-foreground">
                      {userStats.appreciationScore >= 70 ? "Great job showing appreciation!" :
                       userStats.appreciationScore >= 40 ? "Consider showing more appreciation to group members" :
                       "Try sending more appreciations to strengthen group bonds"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="font-medium">Total Points: {userStats.totalPoints}</p>
                    <p className="text-sm text-muted-foreground">
                      Your total contribution points in {currentGroup.name}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Health Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Group Health</span>
            </CardTitle>
            <CardDescription>
              Overall health and activity level of your group
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Activity Level</span>
                  <span className="text-sm text-muted-foreground">
                    {userStats.todayTasks > 3 ? "Very Active" :
                     userStats.todayTasks > 1 ? "Active" :
                     userStats.todayTasks > 0 ? "Moderate" : "Low"}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (userStats.todayTasks / 5) * 100)}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Member Engagement</span>
                  <span className="text-sm text-muted-foreground">
                    {members.length > 1 ? "Multi-member" : "Solo"}
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (members.length / 4) * 100)}
                  className="w-full"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Consistency</span>
                  <span className="text-sm text-muted-foreground">
                    {userStats.streak}-day streak
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (userStats.streak / 7) * 100)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Recommendations */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Recommendations</span>
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {userStats.todayTasks === 0 && (
                  <li>• Try logging at least one activity today to maintain momentum</li>
                )}
                {members.length === 1 && (
                  <li>• Consider inviting members to share the workload and build stronger connections</li>
                )}
                {userStats.appreciationScore < 50 && (
                  <li>• Send more appreciations to recognize others' contributions</li>
                )}
                {userStats.streak < 3 && (
                  <li>• Build consistency by logging activities daily for better insights</li>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}