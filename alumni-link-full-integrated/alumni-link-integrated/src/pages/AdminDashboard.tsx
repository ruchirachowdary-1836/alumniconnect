import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAllProfiles } from "@/hooks/useProfiles";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { adminUsersApi, type AdminUser } from "@/integrations/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, Search, Shield, Trash2 } from "lucide-react";
import PlacementCharts from "@/components/PlacementCharts";
import { toast } from "sonner";

function fmtDate(s?: string | null) {
  if (!s) return "—";
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString();
}

export default function AdminDashboard() {
  const { data: profiles = [], isLoading } = useAllProfiles();
  const qc = useQueryClient();

  const pendingUsers = useQuery({
    queryKey: ["admin-pending-users"],
    queryFn: () => adminUsersApi.getPending(),
  });

  const approve = useMutation({
    mutationFn: (id: string) => adminUsersApi.approve(id),
    onSuccess: (u: AdminUser) => {
      toast.success(`Approved: ${u.email}`);
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to approve user"),
  });

  const reject = useMutation({
    mutationFn: (id: string) => adminUsersApi.reject(id),
    onSuccess: () => {
      toast.success("Rejected user");
      qc.invalidateQueries({ queryKey: ["admin-pending-users"] });
      qc.invalidateQueries({ queryKey: ["all-profiles"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reject user"),
  });

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = profiles.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const stats = {
    total: profiles.length,
    students: profiles.filter((u) => u.role === "student").length,
    alumni: profiles.filter((u) => u.role === "alumni").length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 bg-muted/20">
        <div className="gradient-hero py-10">
          <div className="container">
            <h1 className="font-display text-3xl font-bold text-primary-foreground">
              <Shield className="inline h-8 w-8 mr-2" />Admin Dashboard
            </h1>
            <p className="text-primary-foreground/70 mt-1">Manage users and view placement analytics</p>
          </div>
        </div>

        <div className="container py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Users", value: stats.total, color: "bg-primary text-primary-foreground" },
              { label: "Students", value: stats.students, color: "gradient-accent text-secondary-foreground" },
              { label: "Alumni", value: stats.alumni, color: "gradient-warm text-accent-foreground" },
            ].map((s) => (
              <div key={s.label} className={`${s.color} rounded-xl p-5 text-center`}>
                <div className="text-3xl font-display font-bold">{s.value}</div>
                <div className="text-sm mt-1 opacity-80">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Pending approvals */}
          <div className="bg-card rounded-xl border border-border overflow-hidden mb-8">
            <div className="p-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-xl font-bold">Pending Approvals</h2>
                <p className="text-sm text-muted-foreground mt-1">New student/alumni accounts must be approved before they can sign in.</p>
              </div>
              <Badge variant="outline" className="shrink-0">
                {(pendingUsers.data ?? []).length} pending
              </Badge>
            </div>

            {pendingUsers.isLoading ? (
              <div className="p-6 pt-0">
                <Skeleton className="h-40 rounded-xl" />
              </div>
            ) : pendingUsers.isError ? (
              <div className="px-6 pb-6 text-sm text-destructive">
                Failed to load pending users.
              </div>
            ) : (pendingUsers.data ?? []).length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                No pending accounts.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Name</th>
                      <th className="text-left p-4 font-semibold">Email</th>
                      <th className="text-left p-4 font-semibold">Role</th>
                      <th className="text-left p-4 font-semibold">Requested</th>
                      <th className="text-right p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(pendingUsers.data ?? []).map((u) => {
                      const isApproving = approve.isPending && approve.variables === u.id;
                      const isRejecting = reject.isPending && reject.variables === u.id;
                      const busy = approve.isPending || reject.isPending;
                      return (
                        <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                          <td className="p-4 font-medium">{u.name}</td>
                          <td className="p-4 text-muted-foreground">{u.email}</td>
                          <td className="p-4"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                          <td className="p-4 text-muted-foreground">{fmtDate(u.createdAt)}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                className="gradient-accent text-secondary-foreground"
                                disabled={busy}
                                onClick={() => approve.mutate(u.id)}
                              >
                                <Check className="h-4 w-4" /> {isApproving ? "Approving..." : "Approve"}
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="destructive" disabled={busy}>
                                    <Trash2 className="h-4 w-4" /> {isRejecting ? "Rejecting..." : "Reject"}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Reject this account?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will delete the user and they will need to register again.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => reject.mutate(u.id)}>
                                      Reject
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Placement Charts */}
          <PlacementCharts showTitle />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6 mt-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="h-10 px-4 rounded-md border border-input bg-background text-sm min-w-[150px]">
              <option value="">All Roles</option>
              <option value="student">Students</option>
              <option value="alumni">Alumni</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* User Table */}
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-semibold">Name</th>
                      <th className="text-left p-4 font-semibold">Department</th>
                      <th className="text-left p-4 font-semibold">Company</th>
                      <th className="text-left p-4 font-semibold">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <tr key={u.id} className="border-t border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4 font-medium">{u.name}</td>
                        <td className="p-4 text-muted-foreground">{u.department || "—"}</td>
                        <td className="p-4 text-muted-foreground">{u.company || "—"}</td>
                        <td className="p-4"><Badge variant="outline" className="capitalize">{u.role}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && <p className="text-center text-muted-foreground py-12">No users found.</p>}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
