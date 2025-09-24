import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Lightbulb, Heart, TrendingUp, Users, Award, AlertTriangle, RefreshCw, Mail } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CoupleInsights() {
  const { user } = useAuth();

  const { data: partner } = useQuery({
    queryKey: ["/api/partner"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const { data: insights, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ["/api/couple/insights"],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!partner?.partner
  });

  const { data: analysis, isLoading: analysisLoading, error: analysisError } = useQuery({
    queryKey: ["/api/couple/ai-analysis"],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!partner?.partner
  });

  const refreshInsights = async () => {
    await queryClient.invalidateQueries({ queryKey: ["/api/couple/insights"] });
    await queryClient.invalidateQueries({ queryKey: ["/api/couple/ai-analysis"] });
  };

  if (!partner?.partner) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">No Partner Connected</h2>
          <p className="text-muted-foreground mb-6">
            Connect with your partner to unlock powerful relationship insights and growth recommendations.
          </p>
          <Link href="/settings">
            <Button>
              <Mail className="w-4 h-4 mr-2" />
              Invite Partner
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isLoading = insightsLoading || analysisLoading;
  const hasError = insightsError || analysisError;

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Couple Insights 💕
            </h2>
            <p className="text-muted-foreground">
              AI-powered relationship analytics for you and {partner?.partner?.name}
            </p>
          </div>
          <Button 
            onClick={refreshInsights} 
            variant="outline" 
            className="mt-4 lg:mt-0"
            data-testid="button-refresh"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Insights
          </Button>
        </div>
      </div>

      {hasError ? (
        <Alert className="border-destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Insights</AlertTitle>
          <AlertDescription className="mt-2">
            We couldn't load your relationship insights. This might be due to a connection issue or you may need more activity data.
          </AlertDescription>
          <Button 
            onClick={refreshInsights} 
            variant="outline" 
            className="mt-3"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </Alert>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Relationship Health Score */}
          {analysis && (
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2" data-testid="text-health-title">
                      <Heart className="w-5 h-5 text-red-500" />
                      Relationship Health Score
                    </CardTitle>
                    <CardDescription>
                      Based on activity balance, appreciation, and communication patterns
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary" data-testid="text-health-score">
                      {analysis?.healthScore || 0}/100
                    </div>
                    <Badge 
                      variant={
                        (analysis?.healthScore || 0) >= 80 ? "default" :
                        (analysis?.healthScore || 0) >= 60 ? "secondary" : "destructive"
                      }
                      data-testid="badge-health-status"
                    >
                      {analysis?.overallHealth || "Unknown"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Progress 
                  value={analysis?.healthScore || 0} 
                  className="h-3 mb-4" 
                  data-testid="progress-health"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {analysis?.summary || "No summary available"}
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Activity Balance */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-balance-title">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Activity Balance
                  </CardTitle>
                  <CardDescription>
                    How tasks are distributed between partners
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2" data-testid="text-balance-percentage">
                      {insights?.balance?.userPercentage || 0}% / {insights?.balance?.partnerPercentage || 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You / {partner.partner.name}
                    </p>
                  </div>
                  <Progress value={insights?.balance?.userPercentage || 0} className="h-2" />
                  <p className="text-sm text-center" data-testid="text-balance-message">
                    {insights?.balance?.message || "Loading balance data..."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Relationship Strengths */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-strengths-title">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Relationship Strengths
                  </CardTitle>
                  <CardDescription>
                    Areas where you both excel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-1">Your Strength</h4>
                    <Badge variant="outline" className="mb-2" data-testid="badge-user-strength">
                      {insights?.strengths?.user?.category || "Loading..."}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {insights?.strengths?.user?.count || 0} activities
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-1">Partner's Strength</h4>
                    <Badge variant="outline" className="mb-2" data-testid="badge-partner-strength">
                      {insights?.strengths?.partner?.category || "Loading..."}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {insights?.strengths?.partner?.description || "Loading partner strength data..."}
                    </p>
                  </div>
                  {insights?.strengths?.complementary && (
                    <div className="mt-3 p-2 bg-green-50 dark:bg-green-950 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        🎯 Great complementary strengths!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Appreciation Patterns */}
            {insights && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-appreciation-title">
                    <Heart className="w-5 h-5 text-pink-500" />
                    Appreciation Patterns
                  </CardTitle>
                  <CardDescription>
                    How you show gratitude to each other
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">You sent</span>
                    <Badge variant="secondary" data-testid="badge-user-sent">
                      {insights?.appreciation?.sent || 0} appreciations
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">You received</span>
                    <Badge variant="secondary" data-testid="badge-user-received">
                      {insights?.appreciation?.received || 0} appreciations
                    </Badge>
                  </div>
                  <div className="mt-3">
                    <Badge 
                      variant={
                        (insights?.appreciation?.status || 'unknown') === 'balanced' ? 'default' :
                        (insights?.appreciation?.status || 'unknown') === 'you_appreciated' ? 'secondary' : 'outline'
                      }
                      className="w-full justify-center" 
                      data-testid="badge-appreciation-status"
                    >
                      {(insights?.appreciation?.status || 'unknown').replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm text-center" data-testid="text-appreciation-recommendation">
                    {insights?.appreciation?.recommendation || "Loading recommendation..."}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI Insights and Recommendations */}
          {analysis && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-ai-insights-title">
                    <Lightbulb className="w-5 h-5 text-amber-500" />
                    AI Insights
                  </CardTitle>
                  <CardDescription>
                    Patterns discovered in your relationship dynamics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(analysis?.insights || []).length === 0 ? (
                      <div className="text-center py-8">
                        <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No insights yet</p>
                        <p className="text-sm text-muted-foreground">Add more activities to get AI-powered insights</p>
                      </div>
                    ) : (
                      (analysis?.insights || []).map((insight: any, index: number) => (
                      <div 
                        key={index} 
                        className="border rounded-lg p-3"
                        data-testid={`insight-${index}`}
                      >
                        <div className="flex items-start gap-2 mb-2">
                          <Badge 
                            variant={
                              insight.priority === 'high' ? 'destructive' :
                              insight.priority === 'medium' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {insight.priority} priority
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {insight.category}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium mb-1">{insight.insight}</p>
                        <p className="text-xs text-muted-foreground">{insight.recommendation}</p>
                      </div>
                    ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Growth Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2" data-testid="text-recommendations-title">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    Growth Recommendations
                  </CardTitle>
                  <CardDescription>
                    Personalized suggestions to strengthen your relationship
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(analysis?.recommendations || []).map((rec: any, index: number) => (
                      <div 
                        key={index}
                        className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                        data-testid={`recommendation-${index}`}
                      >
                        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">{index + 1}</span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium mb-1">{rec.action}</p>
                          <p className="text-xs text-muted-foreground">{rec.reason}</p>
                          {rec.expectedOutcome && (
                            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                              Expected: {rec.expectedOutcome}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* General Recommendations */}
          {insights && (insights?.recommendations?.length || 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2" data-testid="text-general-recommendations-title">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Quick Wins
                </CardTitle>
                <CardDescription>
                  Immediate actions to improve your relationship balance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(insights?.recommendations || []).map((rec: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-3 p-4 border rounded-lg"
                      data-testid={`quick-win-${index}`}
                    >
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-950 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-orange-600 dark:text-orange-400">
                          {rec.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                        <p className="text-xs text-muted-foreground">{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}