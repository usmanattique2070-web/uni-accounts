import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Search, Filter, Eye, Trash2, FileSpreadsheet, Users, ArrowUpDown } from "lucide-react";
import { getStudents, deleteStudent, updateStudent, logActivity } from "@/lib/queries";
import { PrintButton } from "@/components/StudentPDF";
import * as XLSX from "xlsx";

type Student = {
  id: string;
  created_by_id: string | null;
  status: string;
  data: Record<string, string>;
  created_at: string;
  updated_at: string;
};

const statusColors: Record<string, string> = {
  new: "bg-blue-100 text-blue-800",
  contacted: "bg-yellow-100 text-yellow-800",
  follow_up: "bg-orange-100 text-orange-800",
  enrolled: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow Up",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

export default function Students() {
  const { isAdmin } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState<"name" | "date" | "status">("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    try {
      const data = await getStudents();
      setStudents(data as unknown as Student[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const filteredStudents = useMemo(() => {
    let result = students;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => {
        const d = s.data;
        return (
          (d["Full Name"]?.toLowerCase().includes(q)) ||
          (d["Phone Number"]?.toLowerCase().includes(q)) ||
          (d["CNIC"]?.toLowerCase().includes(q)) ||
          (d["Email"]?.toLowerCase().includes(q))
        );
      });
    }
    if (statusFilter !== "all") {
      result = result.filter((s) => s.status === statusFilter);
    }
    result = [...result].sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1;
      if (sortField === "name") {
        return ((a.data["Full Name"] || "").localeCompare(b.data["Full Name"] || "")) * dir;
      }
      if (sortField === "status") return a.status.localeCompare(b.status) * dir;
      return ((new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir);
    });
    return result;
  }, [students, searchQuery, statusFilter, sortField, sortDirection]);

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    try {
      await updateStudent(studentId, { status: newStatus });
      setStudents((prev) => prev.map((s) => s.id === studentId ? { ...s, status: newStatus } : s));
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStudent(id);
      await logActivity("delete", "student", id);
      setStudents((prev) => prev.filter((s) => s.id !== id));
      toast.success("Student deleted");
    } catch {
      toast.error("Failed to delete student");
    }
  };

  const exportToExcel = () => {
    const data = filteredStudents.map((s) => {
      const row: Record<string, string> = { Status: statusLabels[s.status] ?? s.status };
      Object.entries(s.data).forEach(([k, v]) => { row[k] = v; });
      row["Created At"] = new Date(s.created_at).toLocaleDateString();
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, `students_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Exported to Excel");
  };

  const toggleSort = (field: "name" | "date" | "status") => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage student admission enquiries</p>
        </div>
        <Button variant="outline" onClick={exportToExcel}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name, phone, CNIC..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Students ({filteredStudents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-lg font-medium">No students found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("name")}>
                        Name <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("status")}>
                        Status <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggleSort("date")}>
                        Date <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-medium text-primary">
                              {(student.data["Full Name"] || "U").charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{student.data["Full Name"] || "Unknown"}</p>
                            <p className="text-xs text-muted-foreground">{student.data["CNIC"] || ""}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{student.data["Phone Number"] || ""}</div>
                        {student.data["Email"] && <div className="text-xs text-muted-foreground">{student.data["Email"]}</div>}
                      </TableCell>
                      <TableCell className="text-sm">{student.data["Degree Program"] || ""}</TableCell>
                      <TableCell>
                        <Select value={student.status} onValueChange={(v) => handleStatusChange(student.id, v)}>
                          <SelectTrigger className="w-32 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="follow_up">Follow Up</SelectItem>
                            <SelectItem value="enrolled">Enrolled</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(student.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <PrintButton
                            studentData={student.data}
                            status={student.status}
                            createdAt={student.created_at}
                            studentName={student.data["Full Name"]}
                          />
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedStudent(student)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle className="flex items-center justify-between">
                                  Student Details
                                  {selectedStudent && (
                                    <PrintButton
                                      studentData={selectedStudent.data}
                                      status={selectedStudent.status}
                                      createdAt={selectedStudent.created_at}
                                      studentName={selectedStudent.data["Full Name"]}
                                      variant="outline"
                                    />
                                  )}
                                </DialogTitle>
                              </DialogHeader>
                              {selectedStudent && (
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  {Object.entries(selectedStudent.data).map(([key, value]) => (
                                    <div key={key}>
                                      <p className="text-muted-foreground">{key}</p>
                                      <p className="font-medium">{value || "N/A"}</p>
                                    </div>
                                  ))}
                                  <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[selectedStudent.status]}`}>
                                      {statusLabels[selectedStudent.status]}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">Registered</p>
                                    <p className="font-medium">{new Date(selectedStudent.created_at).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              )}
                            </DialogContent>
                          </Dialog>
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                              onClick={() => {
                                if (confirm("Delete this student?")) handleDelete(student.id);
                              }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
