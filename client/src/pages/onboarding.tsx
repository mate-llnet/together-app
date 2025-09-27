import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Users, Home, UserPlus, Briefcase, Star, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const relationshipTypes = [
  {
    value: "romantic",
    label: "Romantic Partner",
    description: "For couples in romantic relationships",
    icon: Heart,
    color: "bg-pink-500",
    examples: ["My Partner & I", "Our Relationship"]
  },
  {
    value: "family",
    label: "Family",
    description: "For family members living together",
    icon: Users,
    color: "bg-blue-500",
    examples: ["Smith Family", "Mom, Dad & Kids"]
  },
  {
    value: "roommates",
    label: "Roommates",
    description: "For people sharing living space",
    icon: Home,
    color: "bg-green-500",
    examples: ["Apartment 4B", "House Mates"]
  },
  {
    value: "friends",
    label: "Friends",
    description: "For close friends who help each other",
    icon: UserPlus,
    color: "bg-purple-500",
    examples: ["Best Friends", "Support Circle"]
  },
  {
    value: "work_team",
    label: "Work Team",
    description: "For colleagues or work projects",
    icon: Briefcase,
    color: "bg-orange-500",
    examples: ["Project Alpha Team", "Office Squad"]
  },
  {
    value: "other",
    label: "Other",
    description: "Custom relationship type",
    icon: Star,
    color: "bg-gray-500",
    examples: ["Study Group", "Workout Buddies"]
  }
];

interface OnboardingStep1Props {
  selectedType: string;
  onTypeChange: (type: string) => void;
  onNext: () => void;
}

function OnboardingStep1({ selectedType, onTypeChange, onNext }: OnboardingStep1Props) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome to AppreciateMate!</CardTitle>
        <CardDescription>
          Let's set up your first relationship group. What type of relationship would you like to track?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedType} onValueChange={onTypeChange} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {relationshipTypes.map((type) => {
            const Icon = type.icon;
            return (
              <div key={type.value} className="relative">
                <RadioGroupItem
                  value={type.value}
                  id={type.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={type.value}
                  className="flex flex-col items-start space-y-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`p-2 rounded-lg ${type.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{type.label}</div>
                      <div className="text-sm text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {type.examples.map((example) => (
                      <Badge key={example} variant="secondary" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
      <CardFooter>
        <Button
          onClick={onNext}
          disabled={!selectedType}
          className="w-full"
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

interface OnboardingStep2Props {
  selectedType: string;
  groupName: string;
  groupDescription: string;
  onGroupNameChange: (name: string) => void;
  onGroupDescriptionChange: (description: string) => void;
  onBack: () => void;
  onNext: () => void;
}

function OnboardingStep2({
  selectedType,
  groupName,
  groupDescription,
  onGroupNameChange,
  onGroupDescriptionChange,
  onBack,
  onNext
}: OnboardingStep2Props) {
  const selectedTypeData = relationshipTypes.find(t => t.value === selectedType);
  const Icon = selectedTypeData?.icon || Star;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Customize Your Group</CardTitle>
        <CardDescription>
          Give your {selectedTypeData?.label.toLowerCase()} group a name and description
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center space-x-3 p-4 bg-muted/50 rounded-lg">
          <div className={`p-3 rounded-lg ${selectedTypeData?.color} text-white`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <div className="font-semibold">{selectedTypeData?.label}</div>
            <div className="text-sm text-muted-foreground">{selectedTypeData?.description}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder={selectedTypeData?.examples[0] || "My Group"}
              value={groupName}
              onChange={(e) => onGroupNameChange(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This is how your group will be displayed throughout the app
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="groupDescription">Description (Optional)</Label>
            <Textarea
              id="groupDescription"
              placeholder="Tell us about your group..."
              value={groupDescription}
              onChange={(e) => onGroupDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          onClick={onNext}
          disabled={!groupName.trim()}
        >
          Create Group
          <Check className="ml-2 h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

interface OnboardingStep3Props {
  groupName: string;
  onComplete: () => void;
}

function OnboardingStep3({ groupName, onComplete }: OnboardingStep3Props) {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">🎉 All Set!</CardTitle>
        <CardDescription>
          Your group "{groupName}" has been created successfully
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center">
            <Check className="h-10 w-10 text-white" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">What's Next?</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Start logging activities to track contributions</li>
              <li>• Invite other members to join your group</li>
              <li>• Send appreciations to recognize each other's efforts</li>
              <li>• View insights about your relationship dynamics</li>
            </ul>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={onComplete} className="w-full">
          Go to Dashboard
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");

  // Check if user already has groups - if so, redirect to dashboard
  const { data: groups, isLoading } = useQuery({
    queryKey: ["/api/relationships/my-groups"],
    meta: {
      headers: { "x-user-id": user?.id }
    }
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      const response = await fetch("/api/relationships/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(groupData)
      });

      if (!response.ok) {
        throw new Error("Failed to create group");
      }

      return response.json();
    },
    onSuccess: () => {
      setCurrentStep(3);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // If user already has groups, redirect to dashboard
  if (!isLoading && groups?.groups?.length > 0) {
    setLocation("/app");
    return null;
  }

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const typeData = relationshipTypes.find(t => t.value === type);
    if (typeData && !groupName) {
      setGroupName(typeData.examples[0]);
    }
  };

  const handleCreateGroup = () => {
    createGroupMutation.mutate({
      name: groupName.trim(),
      type: selectedType,
      description: groupDescription.trim() || undefined,
    });
  };

  const handleComplete = () => {
    setLocation("/app");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-warm rounded-xl flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full">
        {/* Progress indicator */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step < currentStep
                      ? "bg-primary text-primary-foreground"
                      : step === currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step < currentStep ? <Check className="h-4 w-4" /> : step}
                </div>
                {step < 3 && (
                  <Separator
                    orientation="horizontal"
                    className={`w-16 mx-2 ${
                      step < currentStep ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-muted-foreground max-w-sm mx-auto">
            <span>Choose Type</span>
            <span>Customize</span>
            <span>Complete</span>
          </div>
        </div>

        {/* Step content */}
        {currentStep === 1 && (
          <OnboardingStep1
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
            onNext={() => setCurrentStep(2)}
          />
        )}

        {currentStep === 2 && (
          <OnboardingStep2
            selectedType={selectedType}
            groupName={groupName}
            groupDescription={groupDescription}
            onGroupNameChange={setGroupName}
            onGroupDescriptionChange={setGroupDescription}
            onBack={() => setCurrentStep(1)}
            onNext={handleCreateGroup}
          />
        )}

        {currentStep === 3 && (
          <OnboardingStep3
            groupName={groupName}
            onComplete={handleComplete}
          />
        )}
      </div>
    </div>
  );
}