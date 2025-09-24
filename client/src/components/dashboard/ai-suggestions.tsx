import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Sparkles, Wand2 } from "lucide-react";

export default function AiSuggestions() {
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: suggestionsData, isLoading } = useQuery({
    queryKey: ["/api/ai/suggestions"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const generateMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/suggestions/generate", {}, {
      headers: { "x-user-id": user?.id }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/suggestions"] });
      toast({
        title: "Success",
        description: "New AI suggestions generated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate suggestions",
        variant: "destructive",
      });
    }
  });

  const acceptMutation = useMutation({
    mutationFn: (suggestionId: string) => 
      apiRequest("POST", `/api/ai/suggestions/${suggestionId}/accept`, {}, {
        headers: { "x-user-id": user?.id }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/suggestions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Success",
        description: "Activity added to your list!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to accept suggestion",
        variant: "destructive",
      });
    }
  });

  const suggestions = suggestionsData?.suggestions || [];

  return (
    <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl border border-border p-6" data-testid="ai-suggestions">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">AI Suggestions</h3>
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
          Smart
        </span>
      </div>
      
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-40"></div>
              </div>
              <div className="w-12 h-6 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-muted-foreground mb-4">No AI suggestions available</p>
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
            data-testid="button-generate-suggestions"
          >
            <Wand2 className="w-4 h-4" />
            <span>{generateMutation.isPending ? "Generating..." : "Generate Suggestions"}</span>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {suggestions.map((suggestion: any) => (
            <div 
              key={suggestion.id} 
              className="flex items-center justify-between p-3 bg-card/50 rounded-lg border border-border"
              data-testid={`suggestion-${suggestion.id}`}
            >
              <div className="flex items-center space-x-3">
                <i className="fas fa-magic text-muted-foreground"></i>
                <span className="text-sm text-foreground" data-testid={`suggestion-title-${suggestion.id}`}>
                  {suggestion.title}
                </span>
                {suggestion.confidence && (
                  <span className="text-xs text-muted-foreground">
                    ({suggestion.confidence}% confidence)
                  </span>
                )}
              </div>
              <Button
                onClick={() => acceptMutation.mutate(suggestion.id)}
                disabled={acceptMutation.isPending}
                size="sm"
                className="text-xs"
                data-testid={`button-accept-${suggestion.id}`}
              >
                {acceptMutation.isPending ? "Adding..." : "Add"}
              </Button>
            </div>
          ))}
          
          <div className="pt-3 border-t border-border/50">
            <Button
              onClick={() => generateMutation.mutate()}
              disabled={generateMutation.isPending}
              variant="outline"
              size="sm"
              className="w-full flex items-center justify-center space-x-2"
              data-testid="button-refresh-suggestions"
            >
              <Wand2 className="w-4 h-4" />
              <span>{generateMutation.isPending ? "Generating..." : "Refresh Suggestions"}</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
