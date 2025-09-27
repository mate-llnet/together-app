import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGroupContext } from "@/hooks/use-group-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Heart, Gift, Plus, Send, Users } from "lucide-react";
import { format } from "date-fns";
import GroupSelector from "@/components/dashboard/group-selector";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function Appreciation() {
  const { user } = useAuth();
  const { currentGroup, setCurrentGroup } = useGroupContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [appreciationMessage, setAppreciationMessage] = useState("");

  const { data: appreciationsData, isLoading } = useQuery({
    queryKey: ["/api/appreciations"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const { data: groupDetails } = useQuery({
    queryKey: [`/api/relationships/${currentGroup?.id}`],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!currentGroup?.id
  });

  const sendAppreciationMutation = useMutation({
    mutationFn: async ({ toUserId, message }: { toUserId: string; message: string }) => {
      const response = await fetch("/api/appreciations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          toUserId,
          message,
          activityId: null // For general appreciations not tied to specific activities
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send appreciation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appreciation sent! 💝",
        description: "Your appreciation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/appreciations"] });
      setIsDialogOpen(false);
      setSelectedMember("");
      setAppreciationMessage("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send appreciation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const appreciations = appreciationsData?.appreciations || [];
  const members: GroupMember[] = groupDetails?.members || [];
  const otherMembers = members.filter(m => m.id !== user?.id && m.status === 'active');

  const handleSendAppreciation = () => {
    if (!selectedMember || !appreciationMessage.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a member and write a message.",
        variant: "destructive",
      });
      return;
    }

    sendAppreciationMutation.mutate({
      toUserId: selectedMember,
      message: appreciationMessage.trim()
    });
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
              Appreciation Center ❤️
            </h2>
            <p className="text-muted-foreground">
              {currentGroup
                ? `Send and receive appreciation with ${currentGroup.name} members`
                : "Select a group to share appreciation with members"}
            </p>
          </div>
          {otherMembers.length > 0 && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4 lg:mt-0 flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Send Appreciation</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Appreciation</DialogTitle>
                  <DialogDescription>
                    Let a group member know you appreciate their contributions
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Send to
                    </label>
                    <Select value={selectedMember} onValueChange={setSelectedMember}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a member" />
                      </SelectTrigger>
                      <SelectContent>
                        {otherMembers.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                {member.name.charAt(0)}
                              </div>
                              <span>{member.name}</span>
                              <Badge variant="secondary" className="text-xs capitalize">
                                {member.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Your message
                    </label>
                    <Textarea
                      placeholder="Write a heartfelt message of appreciation..."
                      value={appreciationMessage}
                      onChange={(e) => setAppreciationMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSendAppreciation}
                    disabled={sendAppreciationMutation.isPending}
                    className="flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {sendAppreciationMutation.isPending ? "Sending..." : "Send"}
                    </span>
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Group Selector */}
        <div className="mb-6">
          <GroupSelector
            currentGroupId={currentGroup?.id}
            onGroupChange={setCurrentGroup}
          />
        </div>

        {!currentGroup ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Users className="w-16 h-16 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold mb-2">No Group Selected</h3>
                  <p className="text-muted-foreground">
                    Select a group to view and send appreciations to group members.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
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
                      When group members appreciate your activities, they'll appear here
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

            {/* Group Members & Stats */}
            <div className="space-y-6">
              {/* Group Members */}
              {otherMembers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="w-5 h-5" />
                      <span>Group Members</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {otherMembers.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-sm">{member.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {member.role}
                              </div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">{member.status}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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

                    {currentGroup && (
                      <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg border border-border">
                        <p className="text-sm font-medium text-foreground mb-2">
                          In {currentGroup.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your group members have sent you {appreciations.length} appreciations.
                          Keep up the amazing work! 🌟
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Recent Appreciations Timeline */}
        {appreciations.length > 0 && currentGroup && (
          <Card>
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
    </div>
  );
}
