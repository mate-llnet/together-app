import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Settings, Heart, UserPlus } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partnerEmail, setPartnerEmail] = useState("");

  const { data: partner } = useQuery({
    queryKey: ["/api/partner"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const invitePartnerMutation = useMutation({
    mutationFn: (email: string) => 
      apiRequest("POST", "/api/partner/invite", { email }, {
        headers: { "x-user-id": user?.id }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner"] });
      toast({
        title: "Success",
        description: "Partner invitation sent!",
      });
      setPartnerEmail("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to invite partner",
        variant: "destructive",
      });
    }
  });

  const handleInvitePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    invitePartnerMutation.mutate(partnerEmail);
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Settings ⚙️
        </h2>
        <p className="text-muted-foreground">
          Manage your account and relationship settings
        </p>
      </div>

      <div className="space-y-6">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>Account Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Name</Label>
              <p className="text-foreground font-medium" data-testid="text-user-name">
                {user?.name}
              </p>
            </div>
            <div>
              <Label>Email</Label>
              <p className="text-foreground font-medium" data-testid="text-user-email">
                {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Partner Connection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5" />
              <span>Partner Connection</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {partner?.partner ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-4 p-4 bg-secondary/10 rounded-lg">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-medium text-lg">
                      {partner.partner.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground" data-testid="text-partner-name">
                      {partner.partner.name}
                    </p>
                    <p className="text-sm text-muted-foreground" data-testid="text-partner-email">
                      {partner.partner.email}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-secondary">
                  ✨ You're connected! Now you can see each other's activities and send appreciations.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect with your partner to start appreciating each other's daily contributions.
                </p>
                <form onSubmit={handleInvitePartner} className="space-y-4">
                  <div>
                    <Label htmlFor="partnerEmail">Partner's Email Address</Label>
                    <Input
                      id="partnerEmail"
                      type="email"
                      value={partnerEmail}
                      onChange={(e) => setPartnerEmail(e.target.value)}
                      placeholder="Enter your partner's email"
                      required
                      data-testid="input-partner-email"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={invitePartnerMutation.isPending}
                    className="flex items-center space-x-2"
                    data-testid="button-invite-partner"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>
                      {invitePartnerMutation.isPending ? "Sending..." : "Connect Partner"}
                    </span>
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>

        {/* App Information */}
        <Card>
          <CardHeader>
            <CardTitle>About Together</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Together helps couples track and appreciate each other's daily contributions, 
              fostering better understanding and gratitude in relationships.
            </p>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• AI-powered activity suggestions</p>
              <p>• Smart categorization and points</p>
              <p>• Beautiful analytics and insights</p>
              <p>• Relationship balance tracking</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}