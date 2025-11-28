import { Clock, AlertTriangle, CheckCircle2, Calendar } from "lucide-react";
import { format, isPast, isToday, isTomorrow, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaskWithSubmissionStatus } from "@shared/schema";

interface DeadlineReminderProps {
  tasks: TaskWithSubmissionStatus[];
  title?: string;
}

export function DeadlineReminder({ tasks, title = "Deadline Reminders" }: DeadlineReminderProps) {
  const categorizeTasks = () => {
    const overdue: TaskWithSubmissionStatus[] = [];
    const dueSoon: TaskWithSubmissionStatus[] = [];
    const upcoming: TaskWithSubmissionStatus[] = [];

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const date = new Date(task.dueDate);
      const now = new Date();

      if (isPast(date) && !isToday(date)) {
        overdue.push(task);
      } else if (isToday(date) || isTomorrow(date) || differenceInDays(date, now) <= 2) {
        dueSoon.push(task);
      } else {
        upcoming.push(task);
      }
    });

    return { overdue, dueSoon, upcoming };
  };

  const { overdue, dueSoon, upcoming } = categorizeTasks();

  if (tasks.length === 0) {
    return null;
  }

  const getReminder = (count: number, status: "overdue" | "due_soon" | "upcoming") => {
    if (count === 0) return null;

    if (status === "overdue") {
      return (
        <Card className="border-l-4 border-l-overdue bg-gradient-to-r from-overdue/5 to-transparent">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-overdue flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-overdue">{count} Overdue Assignment{count !== 1 ? "s" : ""}</p>
              <p className="text-sm text-muted-foreground">Complete these as soon as possible</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (status === "due_soon") {
      return (
        <Card className="border-l-4 border-l-due-soon bg-gradient-to-r from-due-soon/5 to-transparent">
          <CardContent className="flex items-start gap-3 pt-6">
            <Clock className="h-5 w-5 text-due-soon flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-due-soon">{count} Task{count !== 1 ? "s" : ""} Due Soon</p>
              <p className="text-sm text-muted-foreground">Due within the next 2 days</p>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  if (overdue.length === 0 && dueSoon.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {getReminder(overdue.length, "overdue")}
      {getReminder(dueSoon.length, "due_soon")}
    </div>
  );
}
