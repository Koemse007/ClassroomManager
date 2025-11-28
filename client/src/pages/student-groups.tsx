import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GroupWithMembers } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Users, Plus, FolderOpen, Loader2, LogOut } from "lucide-react";

export default function StudentGroups() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [leaveGroupId, setLeaveGroupId] = useState<string | null>(null);

  const { data: groups, isLoading: groupsLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!token,
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (code: string) => {
      return await apiRequest("POST", "/api/groups/join", { joinCode: code });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setJoinDialogOpen(false);
      setJoinCode("");
      toast({
        title: "Joined group successfully",
        description: "You can now view tasks and submit assignments",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to join group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/groups/${id}/leave`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setLeaveGroupId(null);
      toast({
        title: "Left group",
        description: "You have left this group.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to leave group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleJoinGroup = () => {
    if (joinCode.trim()) {
      joinGroupMutation.mutate(joinCode.trim().toUpperCase());
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">My Groups</h1>
          <p className="text-muted-foreground">Classes you're enrolled in</p>
        </div>
        <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-join-group">
              <Plus className="h-4 w-4 mr-2" />
              Join Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join a Group</DialogTitle>
              <DialogDescription>
                Enter the 6-character join code provided by your teacher.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="join-code">Join Code</Label>
              <Input
                id="join-code"
                placeholder="e.g., ABC123"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="mt-2 font-mono uppercase tracking-wider text-center text-lg"
                data-testid="input-join-code"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleJoinGroup}
                disabled={joinCode.length !== 6 || joinGroupMutation.isPending}
                data-testid="button-confirm-join"
              >
                {joinGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Join Group"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Groups</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active class enrollments</p>
          </CardContent>
        </Card>
      </div>

      {groupsLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : groups && groups.length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {groups.map((group) => (
            <Card key={group.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{group.name}</CardTitle>
                    <CardDescription className="mt-1">Teacher: {group.ownerName}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    <Users className="h-3 w-3 mr-1" />
                    {group.memberCount} Students
                  </Badge>
                </div>
                <div className="flex gap-2 pt-2">
                  <Link href={`/groups/${group.id}`} asChild>
                    <Button className="flex-1" variant="outline" data-testid={`button-view-${group.id}`}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setLeaveGroupId(group.id)}
                    data-testid={`button-leave-${group.id}`}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Leave
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Join a group using the code from your teacher
            </p>
            <Button onClick={() => setJoinDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Join Your First Group
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!leaveGroupId} onOpenChange={(open) => !open && setLeaveGroupId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this group? You'll no longer see tasks from this class.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLeaveGroupId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => leaveGroupId && leaveGroupMutation.mutate(leaveGroupId)}
              disabled={leaveGroupMutation.isPending}
            >
              {leaveGroupMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Leaving...
                </>
              ) : (
                "Leave Group"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
