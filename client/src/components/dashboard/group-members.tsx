import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useGroupContext } from "@/hooks/use-group-context";
import { Button } from "@/components/ui/button";
import { Users, Heart, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function GroupMembers() {
  const { user } = useAuth();
  const { currentGroup } = useGroupContext();

  const { data: groupDetails, isLoading } = useQuery({
    queryKey: [`/api/relationships/${currentGroup?.id}`],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!currentGroup?.id
  });

  const members: GroupMember[] = groupDetails?.members || [];
  const otherMembers = members.filter(m => m.id !== user?.id && m.status === 'active');

  if (!currentGroup) {
    return (
      <div className="bg-card rounded-xl border border-border p-6" data-testid="group-members">
        <h3 className="text-lg font-semibold text-foreground mb-4">Group Members</h3>
        <div className="text-center py-6">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Select a group to see members</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden" data-testid="group-members">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>{currentGroup.name}</span>
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs capitalize">
            {currentGroup.type.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <div className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-2 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current User */}
            <div className="flex items-center space-x-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-primary font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  {user?.name} (You)
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {members.find(m => m.id === user?.id)?.role || 'member'}
                </p>
              </div>
            </div>

            {/* Other Members */}
            {otherMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg"
                data-testid={`group-member-${member.id}`}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground" data-testid={`member-name-${member.id}`}>
                    {member.name}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize" data-testid={`member-role-${member.id}`}>
                    {member.role}
                  </p>
                </div>
                <Link href="/app/appreciation">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-secondary hover:text-secondary/80 p-1"
                    data-testid={`button-appreciate-${member.id}`}
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ))}

            {otherMembers.length === 0 && (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-3">
                  No other members in this group yet
                </p>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Invite Members</span>
                </Button>
              </div>
            )}
          </div>
        )}

        {otherMembers.length > 0 && (
          <Link href="/app/appreciation">
            <Button
              className="w-full mt-4 bg-secondary/10 text-secondary hover:bg-secondary/20 flex items-center justify-center space-x-2"
              variant="ghost"
              data-testid="button-send-group-appreciation"
            >
              <Heart className="w-4 h-4" />
              <span>Send Appreciation</span>
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}