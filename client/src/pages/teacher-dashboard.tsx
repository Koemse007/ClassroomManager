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
import {
  Users,
  Plus,
  Copy,
  ClipboardList,
  FolderOpen,
  Loader2,
  FileText,
} from "lucide-react";

export default function TeacherDashboard() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");

  const { data: groups, isLoading: groupsLoading } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    enabled: !!token,
  });

  const { data: stats } = useQuery<{ pendingSubmissions: number; totalTasks: number }>({
    queryKey: ["/api/stats"],
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
      <div>
        <h1 className="text-2xl font-semibold">Welcome back, {user?.name?.split(" ")[0]}</h1>
        <p className="text-muted-foreground">Manage your classes and review submissions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalTasks || 0}</div>
            <p className="text-xs text-muted-foreground">Assigned to students</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pendingSubmissions || 0}</div>
            <p className="text-xs text-muted-foreground">Submissions to grade</p>
          </CardContent>
        </Card>
      </div>

      </div>
    </div>
  );
}
