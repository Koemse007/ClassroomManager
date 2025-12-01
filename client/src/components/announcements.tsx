import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import type { AnnouncementWithTeacher } from "@shared/schema";

interface AnnouncementsProps {
  groupId: string;
  isTeacher?: boolean;
}

export function Announcements({ groupId, isTeacher = false }: AnnouncementsProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [message, setMessage] = useState("");

  const { data: announcements, isLoading } = useQuery<AnnouncementWithTeacher[]>({
    queryKey: ["/api/announcements", groupId],
    enabled: !!token,
  });

  const markReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      return await apiRequest("POST", `/api/announcements/${announcementId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", groupId] });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (msg: string) => {
      return await apiRequest("POST", "/api/announcements", {
        groupId,
        message: msg,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements", groupId] });
      setMessage("");
      toast({
        title: "Announcement posted",
        description: "Your announcement has been shared with the group",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post announcement",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePostAnnouncement = () => {
    if (message.trim()) {
      createMutation.mutate(message.trim());
    }
  };

  useEffect(() => {
    if (announcements && announcements.length > 0 && !isTeacher) {
      announcements.forEach((ann) => {
        if (!ann.isRead) {
          markReadMutation.mutate(ann.id);
        }
      });
    }
  }, [announcements, isTeacher, markReadMutation]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Announcements</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTeacher && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <Textarea
              placeholder="Write an announcement for your students..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[80px] resize-none"
              data-testid="textarea-announcement"
            />
            <Button
              onClick={handlePostAnnouncement}
              disabled={!message.trim() || createMutation.isPending}
              data-testid="button-post-announcement"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Announcement"
              )}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((ann) => (
              <div key={ann.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{ann.teacherName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ann.createdAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                  {!isTeacher && !ann.isRead && (
                    <Badge className="bg-blue-500 hover:bg-blue-600">New</Badge>
                  )}
                </div>
                <p className="text-sm whitespace-pre-wrap">{ann.message}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No announcements yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
