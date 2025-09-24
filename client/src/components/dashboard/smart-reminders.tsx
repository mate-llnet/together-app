import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, AlertCircle, CheckCircle, X, Lightbulb, Calendar } from "lucide-react";
import { useState } from "react";

interface SmartReminder {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  type: 'overdue' | 'upcoming' | 'balance' | 'streak';
  reminderTime: string;
  reasoning: string;
  actionSuggested: string;
}

interface RecurringTask {
  title: string;
  category: string;
  frequency: string;
  lastCompleted: string;
  averageGap: number;
  confidence: number;
  nextDueDate: string;
}

export function SmartReminders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

  const { data: remindersData, isLoading } = useQuery({
    queryKey: ["/api/ai/reminders"],
    meta: {
      headers: { "x-user-id": user?.id || "" }
    },
    enabled: !!user?.id,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const reminders: SmartReminder[] = (remindersData as any)?.reminders || [];
  const recurringTasks: RecurringTask[] = (remindersData as any)?.recurringTasks || [];
  const message = (remindersData as any)?.message;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'overdue': return <AlertCircle className="w-4 h-4" />;
      case 'upcoming': return <Clock className="w-4 h-4" />;
      case 'balance': return <CheckCircle className="w-4 h-4" />;
      case 'streak': return <CheckCircle className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const dismissReminder = (reminderId: string) => {
    setDismissedReminders(prev => new Set([...Array.from(prev), reminderId]));
    toast({
      title: "Reminder dismissed",
      description: "We'll check for updates in a few minutes.",
    });
  };

  const visibleReminders = reminders.filter(r => !dismissedReminders.has(r.id));

  return (
    <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-xl border border-border p-6" data-testid="smart-reminders">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
          <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Smart Reminders</h3>
        <span className="px-2 py-1 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 text-xs font-medium rounded-full">
          AI-Powered
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 bg-white/50 dark:bg-gray-900/50 rounded-lg border border-border animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : visibleReminders.length > 0 ? (
        <div className="space-y-4" data-testid="reminders-list">
          {visibleReminders.map((reminder, index) => (
            <div 
              key={reminder.id} 
              className="p-4 bg-white/70 dark:bg-gray-900/70 rounded-lg border border-border hover:border-amber-200 dark:hover:border-amber-800 transition-colors"
              data-testid={`reminder-${index}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg ${getPriorityColor(reminder.priority)}`}>
                    {getTypeIcon(reminder.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-medium text-foreground">{reminder.title}</h4>
                      <Badge variant={reminder.priority === 'high' ? 'destructive' : reminder.priority === 'medium' ? 'default' : 'secondary'} className="text-xs">
                        {reminder.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {reminder.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-foreground mb-2">{reminder.message}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{reminder.reminderTime}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground bg-gray-50 dark:bg-gray-800 p-2 rounded border mb-2">
                      <div className="mb-1">
                        <strong>Why now:</strong> {reminder.reasoning}
                      </div>
                      <div>
                        <strong>Suggested:</strong> {reminder.actionSuggested}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => dismissReminder(reminder.id)}
                  className="ml-2 text-muted-foreground hover:text-foreground"
                  data-testid={`dismiss-reminder-${index}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : message ? (
        <div className="text-center py-6 text-muted-foreground" data-testid="no-reminders-message">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{message}</p>
          <p className="text-xs mt-1">Keep logging activities to get personalized reminders!</p>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground" data-testid="no-reminders">
          <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500 opacity-50" />
          <p>You're all caught up!</p>
          <p className="text-xs mt-1">No reminders right now. Great job staying on track!</p>
        </div>
      )}

      {/* Recurring Tasks Summary */}
      {recurringTasks.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border" data-testid="recurring-tasks">
          <div className="flex items-center space-x-2 mb-3">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Your Recurring Tasks</span>
          </div>
          <div className="space-y-2">
            {recurringTasks.slice(0, 3).map((task, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-white/50 dark:bg-gray-900/50 rounded border">
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {task.category}
                  </Badge>
                  <span className="text-muted-foreground">{task.title}</span>
                </div>
                <div className="text-muted-foreground">
                  Every {task.averageGap} days
                </div>
              </div>
            ))}
            {recurringTasks.length > 3 && (
              <div className="text-xs text-muted-foreground text-center pt-1">
                +{recurringTasks.length - 3} more patterns detected
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className="text-center py-2">
          <div className="animate-pulse text-sm text-muted-foreground">
            Analyzing your activity patterns...
          </div>
        </div>
      )}
    </div>
  );
}