import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Heart, Users, Home, UserPlus, Briefcase, Star, Check, X, Mail, Clock } from "lucide-react";

const relationshipTypeIcons = {
  romantic: Heart,
  family: Users,
  roommates: Home,
  friends: UserPlus,
  work_team: Briefcase,
  other: Star,
} as const;

const relationshipTypeColors = {
  romantic: "bg-pink-500",
  family: "bg-blue-500",
  roommates: "bg-green-500",
  friends: "bg-purple-500",
  work_team: "bg-orange-500",
  other: "bg-gray-500",
} as const;

interface PendingInvitation {
  id: string;
  groupName: string;
  groupType: string;
  groupDescription?: string;
  inviterName: string;
  role: string;
  message?: string;
  token: string;
  createdAt: string;
  expiresAt?: string;
}

export default function PendingInvitations() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invitationsData, isLoading } = useQuery({
    queryKey: ["/api/relationships/invitations/pending"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const respondMutation = useMutation({
    mutationFn: async ({ token, action }: { token: string; action: 'accept' | 'decline' }) => {
      const response = await fetch("/api/relationships/invitations/respond", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, action }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to respond to invitation");
      }

      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.action === 'accept' ? "Invitation accepted!" : "Invitation declined",
        description: variables.action === 'accept'
          ? "You've successfully joined the group."
          : "The invitation has been declined.",
      });

      // Refresh pending invitations and user groups
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/invitations/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/relationships/my-groups"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to respond",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleResponse = (token: string, action: 'accept' | 'decline') => {
    respondMutation.mutate({ token, action });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span className="font-medium">Loading invitations...</span>
        </div>
        <div className="grid gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const invitations: PendingInvitation[] = invitationsData?.invitations || [];

  if (invitations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-medium">No pending invitations</h3>
            <p className="text-muted-foreground">
              You don't have any group invitations at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Mail className="w-5 h-5" />
        <span className="font-medium">Pending Invitations ({invitations.length})</span>
      </div>

      <div className="grid gap-4">
        {invitations.map((invitation) => {
          const Icon = relationshipTypeIcons[invitation.groupType as keyof typeof relationshipTypeIcons] || Star;
          const bgColor = relationshipTypeColors[invitation.groupType as keyof typeof relationshipTypeColors] || "bg-gray-500";
          const isExpiringSoon = invitation.expiresAt &&
            new Date(invitation.expiresAt).getTime() - Date.now() < 24 * 60 * 60 * 1000; // 24 hours

          return (
            <Card key={invitation.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${bgColor} text-white`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{invitation.groupName}</CardTitle>
                      <CardDescription className="capitalize">
                        {invitation.groupType.replace('_', ' ')} group
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="capitalize">
                      {invitation.role}
                    </Badge>
                    {isExpiringSoon && (
                      <Badge variant="destructive" className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Expires Soon</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">{invitation.inviterName}</span> invited you to join their group
                    {invitation.role && (
                      <span> as a <span className="font-medium capitalize">{invitation.role}</span></span>
                    )}
                  </p>

                  {invitation.groupDescription && (
                    <p className="text-sm text-muted-foreground mt-1">
                      "{invitation.groupDescription}"
                    </p>
                  )}

                  {invitation.message && (
                    <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm italic">"{invitation.message}"</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Invited {new Date(invitation.createdAt).toLocaleDateString()}
                    {invitation.expiresAt && (
                      <span> • Expires {new Date(invitation.expiresAt).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResponse(invitation.token, 'decline')}
                      disabled={respondMutation.isPending}
                      className="flex items-center space-x-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Decline</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleResponse(invitation.token, 'accept')}
                      disabled={respondMutation.isPending}
                      className="flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accept</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}