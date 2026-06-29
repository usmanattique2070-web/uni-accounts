import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Users, UserCog, Crown, User, Calendar, UserPlus, Key, UserX, UserCheck, Trash2 } from "lucide-react";
import { getUsers, updateUserRole, updateUserActive, deleteUser, logActivity } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
};

export default function Staff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "staff">("staff");
  const [creating, setCreating] = useState(false);

  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteUserName, setDeleteUserName] = useState("");

  useEffect(() => { loadStaff(); }, []);

  async function loadStaff() {
    try {
      const data = await getUsers();
      setStaffList(data as unknown as StaffMember[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      toast.error("Fill in all fields");
      return;
    }
    setCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-staff`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: newEmail, password: newPassword, name: newName, role: newRole }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to create staff");

      toast.success("Staff member created");
      setAddOpen(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("staff");
      await loadStaff();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create staff";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  const handleRoleChange = async (id: string, role: "admin" | "staff") => {
    try {
      await updateUserRole(id, role);
      await logActivity("role_change", "staff", id, { role });
      setStaffList((prev) => prev.map((s) => s.id === id ? { ...s, role } : s));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleSuspend = async (id: string, isActive: boolean) => {
    try {
      await updateUserActive(id, isActive);
      await logActivity(isActive ? "unsuspend" : "suspend", "staff", id);
      setStaffList((prev) => prev.map((s) => s.id === id ? { ...s, is_active: isActive } : s));
      toast.success(isActive ? "Staff unsuspended" : "Staff suspended");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    try {
      await deleteUser(deleteUserId);
      await logActivity("delete", "staff", deleteUserId);
      setStaffList((prev) => prev.filter((s) => s.id !== deleteUserId));
      toast.success("Staff member deleted");
      setDeleteOpen(false);
      setDeleteUserId(null);
      setDeleteUserName("");
    } catch {
      toast.error("Failed to delete staff member");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !resetPassword) return;
    setResetting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ userId: resetUserId, newPassword: resetPassword }),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || "Failed to reset password");

      await logActivity("password_reset", "staff", resetUserId);
      toast.success("Password reset successfully");
      setResetOpen(false);
      setResetUserId(null);
      setResetPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      toast.error(message);
    } finally {
      setResetting(false);
    }
  };

  const adminCount = staffList.filter((s) => s.role === "admin").length;
  const staffCount = staffList.filter((s) => s.role === "staff").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Management</h1>
          <p className="text-muted-foreground">Manage staff members and their access</p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="mr-2 h-4 w-4" />Add Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Full name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="Email address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="Initial password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select className="w-full border rounded-md px-3 py-2 text-sm" value={newRole} onChange={(e) => setNewRole(e.target.value as "admin" | "staff")}>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deleteUserName}</strong>? Their account will be removed, but all student data they created will be preserved in the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDeleteUserId(null); setDeleteUserName(""); }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" value={resetPassword} onChange={(e) => setResetPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={resetting}>
              {resetting ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{staffList.length}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{adminCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff</CardTitle>
            <User className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{staffCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4" />All Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((member) => (
                    <TableRow key={member.id} className={!member.is_active ? "opacity-50" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(member.name || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <span className="text-sm font-medium">{member.name || "Unnamed"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{member.email}</TableCell>
                      <TableCell>
                        <select
                          className="border rounded px-2 py-1 text-xs"
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as "admin" | "staff")}
                        >
                          <option value="admin">Admin</option>
                          <option value="staff">Staff</option>
                        </select>
                      </TableCell>
                      <TableCell>
                        {member.is_active ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium">Active</span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">Suspended</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {new Date(member.created_at).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => {
                              setResetUserId(member.id);
                              setResetPassword("");
                              setResetOpen(true);
                            }}
                            title="Reset Password">
                            <Key className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleSuspend(member.id, !member.is_active)}
                            title={member.is_active ? "Suspend" : "Unsuspend"}>
                            {member.is_active ? <UserX className="h-4 w-4 text-orange-500" /> : <UserCheck className="h-4 w-4 text-green-500" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => {
                              setDeleteUserId(member.id);
                              setDeleteUserName(member.name || "Unnamed");
                              setDeleteOpen(true);
                            }}
                            title="Delete">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
