import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Clock, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { TaskWithSubmissionStatus } from "@shared/schema";

export function UrgentDeadlineReminder() {
  const { toast } = useToast();

  const { data: urgentTasks, isLoading } = useQuery<TaskWithSubmissionStatus[]>({
    queryKey: ["/api/tasks/urgent"],
  });

  const dismissMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return await apiRequest("POST", `/api/tasks/${taskId}/dismiss-reminder`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks/urgent"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (!urgentTasks || urgentTasks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 mb-6">
      {urgentTasks.map((task) => (
        <Card key={task.id} className="border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950">
          <CardContent className="p-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Clock className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-red-900 dark:text-red-100">{task.title}</h3>
                <p className="text-sm text-red-800 dark:text-red-200">
                  Due in {formatDistanceToNow(new Date(task.dueDate))}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => dismissMutation.mutate(task.id)}
              disabled={dismissMutation.isPending}
              data-testid={`button-dismiss-reminder-${task.id}`}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              I know
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
