import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Gift } from "lucide-react";
import { format } from "date-fns";

export default function Appreciation() {
  const { user } = useAuth();

  const { data: appreciationsData, isLoading } = useQuery({
    queryKey: ["/api/appreciations"],
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

  const appreciations = appreciationsData?.appreciations || [];

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Appreciation Center ❤️
        </h2>
        <p className="text-muted-foreground">
          See how much you're valued and appreciated
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Received Appreciations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-secondary" />
              <span>Received Appreciations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 bg-muted/50 rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : appreciations.length === 0 ? (
              <div className="text-center py-8">
                <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No appreciations yet</p>
                <p className="text-sm text-muted-foreground">
                  When your partner appreciates your activities, they'll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {appreciations.map((appreciation: any) => (
                  <div 
                    key={appreciation.id} 
                    className="p-4 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-lg border border-border"
                    data-testid={`appreciation-${appreciation.id}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                        <Heart className="w-4 h-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground mb-1" data-testid={`appreciation-message-${appreciation.id}`}>
                          {appreciation.message || "Thank you for everything you do! ❤️"}
                        </p>
                        <p className="text-xs text-muted-foreground" data-testid={`appreciation-date-${appreciation.id}`}>
                          {format(new Date(appreciation.createdAt), 'MMM dd, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appreciation Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Gift className="w-5 h-5 text-primary" />
              <span>Your Impact</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2" data-testid="text-total-appreciations">
                  {appreciations.length}
                </div>
                <p className="text-sm text-muted-foreground">Total Appreciations Received</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-xl font-semibold text-foreground mb-1" data-testid="text-this-week">
                    {appreciations.filter((a: any) => {
                      const appreciationDate = new Date(a.createdAt);
                      const oneWeekAgo = new Date();
                      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                      return appreciationDate >= oneWeekAgo;
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>

                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-xl font-semibold text-foreground mb-1" data-testid="text-this-month">
                    {appreciations.filter((a: any) => {
                      const appreciationDate = new Date(a.createdAt);
                      const oneMonthAgo = new Date();
                      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                      return appreciationDate >= oneMonthAgo;
                    }).length}
                  </div>
                  <p className="text-xs text-muted-foreground">This Month</p>
                </div>
              </div>

              {partner?.partner && (
                <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-border">
                  <p className="text-sm font-medium text-foreground mb-2">
                    From {partner.partner.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your partner has sent you {appreciations.length} appreciations. 
                    Keep up the amazing work! 🌟
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Appreciations Timeline */}
      {appreciations.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Recent Appreciations Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {appreciations.slice(0, 5).map((appreciation: any, index: number) => (
                <div key={appreciation.id} className="flex items-start space-x-4">
                  <div className="relative">
                    <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                      <Heart className="w-4 h-4 text-secondary" />
                    </div>
                    {index !== appreciations.slice(0, 5).length - 1 && (
                      <div className="absolute top-8 left-4 w-0.5 h-8 bg-border"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground" data-testid={`timeline-message-${appreciation.id}`}>
                      {appreciation.message || "Thank you for everything you do! ❤️"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1" data-testid={`timeline-date-${appreciation.id}`}>
                      {format(new Date(appreciation.createdAt), 'EEEE, MMMM dd • h:mm a')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
