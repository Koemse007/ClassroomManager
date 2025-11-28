import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import type { GroupWithMembers } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Users, FileText, CheckCircle2, Clock } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";

export default function TeacherGroups() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");

  const { data: groups, isLoading: groupsLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!token,
  });

  const createGroupMutation = useMutation({
    mutationFn: async (name: string) => {
      return await apiRequest("POST", "/api/groups", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setCreateDialogOpen(false);
      setGroupName("");
      toast({
        title: "Group created",
        description: "Your new group is ready. Share the join code with your students.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/groups/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Group deleted",
        description: "The group has been removed.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete group",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyJoinCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Join code copied",
      description: "Share this code with your students",
    });
  };

  const handleCreateGroup = () => {
    if (groupName.trim()) {
      createGroupMutation.mutate(groupName.trim());
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Class Groups</h1>
          <p className="text-muted-foreground">Manage all your class groups and students</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-group">
              <Plus className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Create a new class group. A unique join code will be generated automatically.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., Math 101 - Fall 2024"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="mt-2"
                data-testid="input-group-name"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || createGroupMutation.isPending}
                data-testid="button-confirm-create"
              >
                {createGroupMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{groups?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Active class groups</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {groups?.reduce((sum, g) => sum + g.memberCount, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all groups</p>
          </CardContent>
        </Card>
      </div>

      {groupsLoading ? (
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
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
                    <CardDescription className="mt-1">
                      {group.memberCount} students enrolled
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="inline-block bg-muted px-3 py-2 rounded-lg">
                      <code className="font-mono text-sm font-semibold">{group.joinCode}</code>
                    </div>
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
                    variant="ghost"
                    size="icon"
                    onClick={() => copyJoinCode(group.joinCode)}
                    data-testid={`button-copy-${group.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => deleteGroupMutation.mutate(group.id)}
                    disabled={deleteGroupMutation.isPending}
                    data-testid={`button-delete-${group.id}`}
                  >
                    {deleteGroupMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Delete"
                    )}
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
              Create your first group to manage students and assign tasks
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Group
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
