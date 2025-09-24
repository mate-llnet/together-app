import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/App";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Plus, Sparkles } from "lucide-react";

export default function AddActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categoryId: "",
    points: 5,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["/api/activities/categories"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const addActivityMutation = useMutation({
    mutationFn: (data: typeof formData) => 
      apiRequest("POST", "/api/activities", data, {
        headers: { "x-user-id": user?.id }
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/stats"] });
      toast({
        title: "Success",
        description: "Activity added successfully!",
      });
      setLocation("/");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add activity",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an activity title",
        variant: "destructive",
      });
      return;
    }

    addActivityMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const categories = categoriesData?.categories || [];

  const getIconForCategory = (categoryId: string) => {
    const iconMap: Record<string, string> = {
      household: "fas fa-home",
      childcare: "fas fa-baby",
      finance: "fas fa-dollar-sign",
      maintenance: "fas fa-wrench",
      cooking: "fas fa-utensils",
      shopping: "fas fa-shopping-cart",
      transportation: "fas fa-car",
      emotional_support: "fas fa-heart",
    };
    return iconMap[categoryId] || "fas fa-home";
  };

  return (
    <div className="p-4 lg:p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-page-title">
          Add New Activity
        </h2>
        <p className="text-muted-foreground">
          Log something you've accomplished today
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>Activity Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Activity Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                placeholder="e.g., Made breakfast for the family"
                required
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Add any additional details..."
                rows={3}
                data-testid="input-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleInputChange("categoryId", value)}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue placeholder="Select a category (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category: any) => (
                    <SelectItem key={category.id} value={category.id} data-testid={`option-${category.id}`}>
                      <div className="flex items-center space-x-2">
                        <i className={getIconForCategory(category.id)}></i>
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave empty to let AI categorize automatically
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="points">Points</Label>
              <Select 
                value={formData.points.toString()} 
                onValueChange={(value) => handleInputChange("points", parseInt(value))}
              >
                <SelectTrigger data-testid="select-points">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 points - Simple task</SelectItem>
                  <SelectItem value="8">8 points - Medium task</SelectItem>
                  <SelectItem value="10">10 points - Important task</SelectItem>
                  <SelectItem value="12">12 points - Complex task</SelectItem>
                  <SelectItem value="15">15 points - Major accomplishment</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave as default to let AI suggest points automatically
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={addActivityMutation.isPending}
                className="flex-1"
                data-testid="button-add-activity"
              >
                {addActivityMutation.isPending ? "Adding..." : "Add Activity"}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </form>

          {/* AI Help Section */}
          <div className="mt-6 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-lg border border-border">
            <div className="flex items-center space-x-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">AI Assistant</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Our AI will help categorize your activity and suggest appropriate points based on the complexity and importance of the task.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
