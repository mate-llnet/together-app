import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Mail, X } from "lucide-react";

interface InviteMembersDialogProps {
  groupId: string;
  groupName: string;
  groupType: string;
  children?: React.ReactNode;
}

const roleOptions = {
  romantic: [
    { value: "partner", label: "Partner", description: "Equal partner in the relationship" },
  ],
  family: [
    { value: "parent", label: "Parent", description: "Parent or guardian" },
    { value: "child", label: "Child", description: "Child or dependent" },
    { value: "sibling", label: "Sibling", description: "Brother or sister" },
    { value: "relative", label: "Relative", description: "Extended family member" },
  ],
  roommates: [
    { value: "roommate", label: "Roommate", description: "Equal roommate" },
    { value: "leaseholder", label: "Leaseholder", description: "Primary leaseholder" },
    { value: "subletter", label: "Subletter", description: "Subletting tenant" },
  ],
  friends: [
    { value: "friend", label: "Friend", description: "Close friend" },
    { value: "buddy", label: "Buddy", description: "Activity buddy" },
    { value: "supporter", label: "Supporter", description: "Support network member" },
  ],
  work_team: [
    { value: "teammate", label: "Teammate", description: "Team member" },
    { value: "lead", label: "Team Lead", description: "Team leader" },
    { value: "manager", label: "Manager", description: "Team manager" },
    { value: "intern", label: "Intern", description: "Team intern" },
  ],
  other: [
    { value: "member", label: "Member", description: "Group member" },
    { value: "coordinator", label: "Coordinator", description: "Group coordinator" },
    { value: "participant", label: "Participant", description: "Active participant" },
  ],
};

interface InviteData {
  email: string;
  name: string;
  role: string;
  message: string;
}

export default function InviteMembersDialog({ groupId, groupName, groupType, children }: InviteMembersDialogProps) {
  const [open, setOpen] = useState(false);
  const [invitations, setInvitations] = useState<InviteData[]>([
    { email: "", name: "", role: "", message: "" }
  ]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const roles = roleOptions[groupType as keyof typeof roleOptions] || roleOptions.other;

  const inviteMutation = useMutation({
    mutationFn: async (inviteData: InviteData) => {
      const response = await fetch(`/api/relationships/${groupId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteData.email,
          name: inviteData.name || undefined,
          role: inviteData.role,
          message: inviteData.message || undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send invitation");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "The invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/relationships/${groupId}`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddInvitation = () => {
    setInvitations([...invitations, { email: "", name: "", role: "", message: "" }]);
  };

  const handleRemoveInvitation = (index: number) => {
    if (invitations.length > 1) {
      setInvitations(invitations.filter((_, i) => i !== index));
    }
  };

  const handleInvitationChange = (index: number, field: keyof InviteData, value: string) => {
    const updated = [...invitations];
    updated[index] = { ...updated[index], [field]: value };
    setInvitations(updated);
  };

  const handleSendInvitations = async () => {
    const validInvitations = invitations.filter(inv => inv.email && inv.role);

    if (validInvitations.length === 0) {
      toast({
        title: "No valid invitations",
        description: "Please provide at least one email and role.",
        variant: "destructive",
      });
      return;
    }

    try {
      await Promise.all(validInvitations.map(inv => inviteMutation.mutateAsync(inv)));
      setOpen(false);
      setInvitations([{ email: "", name: "", role: "", message: "" }]);
    } catch (error) {
      // Individual errors are handled by the mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button className="flex items-center space-x-2">
            <UserPlus className="w-4 h-4" />
            <span>Invite Members</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Members to {groupName}</DialogTitle>
          <DialogDescription>
            Send invitations to add new members to your {groupType.replace('_', ' ')} group.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {invitations.map((invitation, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  Invitation {index + 1}
                </h4>
                {invitations.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveInvitation(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`email-${index}`}>Email Address *</Label>
                  <Input
                    id={`email-${index}`}
                    type="email"
                    placeholder="person@example.com"
                    value={invitation.email}
                    onChange={(e) => handleInvitationChange(index, "email", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`name-${index}`}>Name (Optional)</Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="Their name"
                    value={invitation.name}
                    onChange={(e) => handleInvitationChange(index, "name", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`role-${index}`}>Role *</Label>
                <Select
                  value={invitation.role}
                  onValueChange={(value) => handleInvitationChange(index, "role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        <div>
                          <div className="font-medium">{role.label}</div>
                          <div className="text-sm text-muted-foreground">{role.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`message-${index}`}>Personal Message (Optional)</Label>
                <Textarea
                  id={`message-${index}`}
                  placeholder="Add a personal note to the invitation..."
                  value={invitation.message}
                  onChange={(e) => handleInvitationChange(index, "message", e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          ))}

          <Button
            variant="outline"
            onClick={handleAddInvitation}
            className="w-full flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Another Invitation</span>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSendInvitations}
            disabled={inviteMutation.isPending}
          >
            {inviteMutation.isPending ? "Sending..." : `Send ${invitations.filter(inv => inv.email && inv.role).length} Invitation${invitations.filter(inv => inv.email && inv.role).length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}