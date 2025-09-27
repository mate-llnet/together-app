import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

interface RelationshipGroup {
  id: string;
  name: string;
  type: string;
  description?: string;
  avatarUrl?: string;
  settings: any;
  isActive: boolean;
  createdAt: string;
  role: string;
  status: string;
  memberCount?: string;
}

interface GroupContextType {
  currentGroup: RelationshipGroup | null;
  groups: RelationshipGroup[];
  isLoading: boolean;
  setCurrentGroup: (groupId: string) => void;
  refreshGroups: () => void;
}

const GroupContext = createContext<GroupContextType | undefined>(undefined);

export function GroupProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [currentGroupId, setCurrentGroupId] = useState<string | null>(null);

  // Fetch user's groups
  const { data: groupsData, isLoading, refetch } = useQuery({
    queryKey: ["/api/relationships/my-groups"],
    meta: {
      headers: { "x-user-id": user?.id }
    },
    enabled: !!user?.id
  });

  const groups = groupsData?.groups || [];

  // Set default current group when groups are loaded
  useEffect(() => {
    if (groups.length > 0 && !currentGroupId) {
      // Try to restore from localStorage first
      const savedGroupId = localStorage.getItem("current-group-id");
      const validGroup = groups.find(g => g.id === savedGroupId);

      if (validGroup) {
        setCurrentGroupId(savedGroupId);
      } else {
        // Default to first group
        setCurrentGroupId(groups[0].id);
      }
    }
  }, [groups, currentGroupId]);

  // Save current group to localStorage
  useEffect(() => {
    if (currentGroupId) {
      localStorage.setItem("current-group-id", currentGroupId);
    }
  }, [currentGroupId]);

  const currentGroup = groups.find(g => g.id === currentGroupId) || null;

  const setCurrentGroup = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      setCurrentGroupId(groupId);
    }
  };

  const refreshGroups = () => {
    refetch();
  };

  return (
    <GroupContext.Provider value={{
      currentGroup,
      groups,
      isLoading,
      setCurrentGroup,
      refreshGroups
    }}>
      {children}
    </GroupContext.Provider>
  );
}

export function useGroupContext() {
  const context = useContext(GroupContext);
  if (context === undefined) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return context;
}