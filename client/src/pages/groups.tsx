import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGroupContext } from "@/hooks/use-group-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Heart, Users, Home, UserPlus, Briefcase, Star, Plus, Settings, Crown, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import InviteMembersDialog from "@/components/groups/invite-members-dialog";
import PendingInvitations from "@/components/groups/pending-invitations";

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

const relationshipTypeLabels = {
  romantic: "Romantic Partnership",
  family: "Family Group",
  roommates: "Roommates",
  friends: "Friends Circle",
  work_team: "Work Team",
  other: "Other Group",
} as const;

interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: string;
  status: string;
  joinedAt: string;
}

function GroupCard({ group }: { group: any }) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { setCurrentGroup } = useGroupContext();

  const { data: groupDetails } = useQuery({
    queryKey: [`/api/relationships/${group.id}`],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const Icon = relationshipTypeIcons[group.type as keyof typeof relationshipTypeIcons] || Star;
  const bgColor = relationshipTypeColors[group.type as keyof typeof relationshipTypeColors];
  const typeLabel = relationshipTypeLabels[group.type as keyof typeof relationshipTypeLabels] || "Group";

  const members: GroupMember[] = groupDetails?.members || [];
  const isAdmin = group.role === 'admin';

  const handleSwitchToGroup = () => {
    setCurrentGroup(group.id);
    setLocation("/app");
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-lg ${bgColor} text-white`}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl">{group.name}</CardTitle>
              <CardDescription>{typeLabel}</CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isAdmin && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Crown className="w-3 h-3" />
                <span>Admin</span>
              </Badge>
            )}
          </div>
        </div>

        {group.description && (
          <p className="text-sm text-muted-foreground mt-2">{group.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Members Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Members ({members.length})</span>
            </h4>
            {isAdmin && (
              <InviteMembersDialog
                groupId={group.id}
                groupName={group.name}
                groupType={group.type}
              >
                <Button variant="outline" size="sm" className="flex items-center space-x-1">
                  <UserPlus className="w-3 h-3" />
                  <span>Invite</span>
                </Button>
              </InviteMembersDialog>
            )}
          </div>

          <div className="space-y-2">
            {members.slice(0, 3).map((member) => (
              <div key={member.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-medium">{member.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{member.role}</div>
                  </div>
                </div>
                {member.id === user?.id && (
                  <Badge variant="outline" className="text-xs">You</Badge>
                )}
              </div>
            ))}

            {members.length > 3 && (
              <div className="text-xs text-muted-foreground">
                +{members.length - 3} more member{members.length - 3 !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleSwitchToGroup}>
              View Dashboard
            </Button>
            {isAdmin && (
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Groups() {
  const { groups, isLoading } = useGroupContext();

  if (isLoading) {
    return (
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        <div className="space-y-6">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold">My Groups</h1>
            <p className="text-muted-foreground">
              Manage your relationship groups and invitations
            </p>
          </div>
          <Link href="/onboarding">
            <Button className="mt-4 lg:mt-0 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Create New Group</span>
            </Button>
          </Link>
        </div>

        {/* Pending Invitations */}
        <PendingInvitations />

        {/* Groups Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Your Groups ({groups.length})</h2>

          {groups.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto flex items-center justify-center">
                    <Users className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No groups yet</h3>
                    <p className="text-muted-foreground">
                      Create your first group to start tracking activities and building connections.
                    </p>
                  </div>
                  <Link href="/onboarding">
                    <Button className="flex items-center space-x-2">
                      <Plus className="w-4 h-4" />
                      <span>Create Your First Group</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}