import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Users, Globe, Shield, CheckCircle, XCircle, Clock, FileSpreadsheet } from "lucide-react";
import { getRegistrations, updateRegistrationStatus, getRegistrationStats } from "@/lib/queries";
import * as XLSX from "xlsx";

type Registration = {
  id: string;
  data: Record<string, string>;
  status: 'pending' | 'approved' | 'rejected';
  submission_type: 'online' | 'staff';
  staff_id: string | null;
  student_name: string;
  student_phone: string | null;
  created_at: string;
  users?: { name: string } | null;
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function RegistrationsAdmin() {
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, online: 0, byStaff: 0, statusCounts: { pending: 0, approved: 0, rejected: 0 } });

  useEffect(() => {
    async function load() {
      try {
        const data = await getRegistrations();
        setRegistrations(data as unknown as Registration[]);

        const statsData = await getRegistrationStats();
        setStats(statsData);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load registrations");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredRegistrations = useMemo(() => {
    let result = registrations;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.student_name?.toLowerCase().includes(q) ||
          r.student_phone?.toLowerCase().includes(q) ||
          Object.values(r.data).some((v) => String(v).toLowerCase().includes(q))
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((r) => r.submission_type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }

    return result;
  }, [registrations, searchQuery, typeFilter, statusFilter]);

  const handleStatusChange = async (id: string, newStatus: 'approved' | 'rejected') => {
    try {
      await updateRegistrationStatus(id, newStatus);
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
      toast.success(`Registration ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const exportToExcel = () => {
    const data = filteredRegistrations.map((r, i) => ({
      "#": i + 1,
      Name: r.student_name,
      Phone: r.student_phone || "",
      ...Object.fromEntries(
        Object.entries(r.data).map(([key, value]) => [key, value])
      ),
      Type: r.submission_type === "online" ? "Online Submit" : `Staff: ${r.users?.name || "Unknown"}`,
      Status: statusLabels[r.status] || r.status,
      Date: r.created_at ? new Date(r.created_at).toLocaleDateString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Registrations");

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `registrations_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`Exported ${filteredRegistrations.length} registrations to Excel`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Registration Management</h1>
          <p className="text-muted-foreground">View and manage all student registrations</p>
        </div>
        <Button onClick={exportToExcel} disabled={filteredRegistrations.length === 0}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Online Submit</CardTitle>
            <Globe className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.online}</div>
            <p className="text-xs text-muted-foreground mt-1">From website</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Submit</CardTitle>
            <Shield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.byStaff}</div>
            <p className="text-xs text-muted-foreground mt-1">By staff members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.statusCounts.pending}</div>
            <p className="text-xs text-muted-foreground mt-1">Needs review</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or data..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Submission Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online Submit</SelectItem>
                <SelectItem value="staff">Staff Submit</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Registrations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Registrations ({filteredRegistrations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No registrations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Submission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((reg, i) => (
                    <TableRow key={reg.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{reg.student_name}</TableCell>
                      <TableCell>{reg.student_phone || "—"}</TableCell>
                      <TableCell>{reg.data["Degree Program"] || reg.data["Program"] || "—"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={reg.submission_type === "online" ? "default" : "secondary"}
                          className="flex items-center gap-1 w-fit"
                        >
                          {reg.submission_type === "online" ? (
                            <>
                              <Globe className="h-3 w-3" />
                              Online Submit
                            </>
                          ) : (
                            <>
                              <Shield className="h-3 w-3" />
                              Staff: {reg.users?.name || "Unknown"}
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[reg.status]}>
                          {statusLabels[reg.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {reg.created_at ? new Date(reg.created_at).toLocaleDateString() : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {reg.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleStatusChange(reg.id, "approved")}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleStatusChange(reg.id, "rejected")}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                        {reg.status !== "pending" && (
                          <Badge className={statusColors[reg.status]}>
                            {statusLabels[reg.status]}
                          </Badge>
                        )}
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
