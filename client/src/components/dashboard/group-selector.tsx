import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Users, Home, UserPlus, Briefcase, Star, ChevronDown, Plus } from "lucide-react";
import { useLocation } from "wouter";

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

interface GroupSelectorProps {
  currentGroupId?: string;
  onGroupChange: (groupId: string) => void;
}

export default function GroupSelector({ currentGroupId, onGroupChange }: GroupSelectorProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/relationships/my-groups"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 bg-muted rounded animate-pulse"></div>
        <div className="w-32 h-6 bg-muted rounded animate-pulse"></div>
      </div>
    );
  }

  const groupsList = groups?.groups || [];
  const currentGroup = groupsList.find(g => g.id === currentGroupId) || groupsList[0];

  if (groupsList.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => setLocation("/onboarding")}
        className="flex items-center space-x-2"
      >
        <Plus className="w-4 h-4" />
        <span>Create Group</span>
      </Button>
    );
  }

  if (groupsList.length === 1) {
    const group = groupsList[0];
    const Icon = relationshipTypeIcons[group.type as keyof typeof relationshipTypeIcons] || Star;
    const bgColor = relationshipTypeColors[group.type as keyof typeof relationshipTypeColors] || "bg-gray-500";

    return (
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${bgColor} text-white`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold">{group.name}</div>
          <div className="text-sm text-muted-foreground capitalize">{group.type.replace('_', ' ')}</div>
        </div>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2 h-auto p-3">
          {currentGroup ? (
            <>
              <div className={`p-2 rounded-lg ${relationshipTypeColors[currentGroup.type as keyof typeof relationshipTypeColors]} text-white`}>
                {(() => {
                  const Icon = relationshipTypeIcons[currentGroup.type as keyof typeof relationshipTypeIcons] || Star;
                  return <Icon className="w-4 h-4" />;
                })()}
              </div>
              <div className="text-left">
                <div className="font-semibold">{currentGroup.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {currentGroup.type.replace('_', ' ')}
                </div>
              </div>
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              <div className="p-2 rounded-lg bg-gray-500 text-white">
                <Star className="w-4 h-4" />
              </div>
              <span>Select Group</span>
              <ChevronDown className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch Group</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {groupsList.map((group) => {
          const Icon = relationshipTypeIcons[group.type as keyof typeof relationshipTypeIcons] || Star;
          const bgColor = relationshipTypeColors[group.type as keyof typeof relationshipTypeColors];
          const isActive = group.id === currentGroupId;

          return (
            <DropdownMenuItem
              key={group.id}
              onClick={() => onGroupChange(group.id)}
              className={`flex items-center space-x-3 p-3 ${isActive ? 'bg-accent' : ''}`}
            >
              <div className={`p-2 rounded-lg ${bgColor} text-white`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="font-medium">{group.name}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {group.type.replace('_', ' ')}
                </div>
              </div>
              {isActive && (
                <Badge variant="secondary" className="text-xs">Active</Badge>
              )}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setLocation("/onboarding")}
          className="flex items-center space-x-3 p-3"
        >
          <div className="p-2 rounded-lg bg-blue-500 text-white">
            <Plus className="w-4 h-4" />
          </div>
          <span>Create New Group</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}