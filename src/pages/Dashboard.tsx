import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  UserCheck,
  Clock,
  TrendingUp,
  GraduationCap,
  BookOpen,
  ArrowUpRight,
  Shield,
  Download,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStudents, getStudentStats, getStaffPerformance, getCustomFields, getDegreePrograms } from "@/lib/queries";
import { toast } from "sonner";
import * as XLSX from "xlsx";

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

const breakdownColors = [
  "bg-blue-100 text-blue-800",
  "bg-green-100 text-green-800",
  "bg-purple-100 text-purple-800",
  "bg-orange-100 text-orange-800",
  "bg-cyan-100 text-cyan-800",
  "bg-pink-100 text-pink-800",
  "bg-amber-100 text-amber-800",
  "bg-teal-100 text-teal-800",
];

type Student = {
  id: string;
  created_by_id: string | null;
  status: string;
  data: Record<string, string>;
  created_at: string;
};

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);
  const [staffPerf, setStaffPerf] = useState<Record<string, unknown>[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [fieldLabels, setFieldLabels] = useState<string[]>([]);

  const [filterCourse, setFilterCourse] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStaff, setFilterStaff] = useState("all");
  const [previewOpen, setPreviewOpen] = useState(false);

  const [dbPrograms, setDbPrograms] = useState<string[]>([]);

  const programs = useMemo(() => {
    const fromStudents = new Set(allStudents.map((s) => s.data["Degree Program"]).filter(Boolean));
    return [...new Set([...dbPrograms, ...fromStudents])];
  }, [allStudents, dbPrograms]);

  const courses = useMemo(() => {
    const fromStudents = new Set(allStudents.map((s) => s.data["Interested Course"]).filter(Boolean));
    return [...fromStudents];
  }, [allStudents]);

  const degreeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allStudents.forEach((s) => {
      const degree = s.data["Degree Program"];
      if (degree) {
        counts[degree] = (counts[degree] || 0) + 1;
      }
    });
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
  }, [allStudents]);

  const courseCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allStudents.forEach((s) => {
      const course = s.data["Interested Course"];
      if (course) {
        counts[course] = (counts[course] || 0) + 1;
      }
    });
    return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
  }, [allStudents]);

  const staffNames = useMemo(() => {
    const map = new Map<string, string>();
    staffPerf.forEach((s) => {
      map.set(s.id as string, (s.name as string) || "Unknown");
    });
    return map;
  }, [staffPerf]);

  const filteredStudents = useMemo(() => {
    let result = allStudents;
    if (filterCourse !== "all") {
      result = result.filter((s) => s.data["Interested Course"] === filterCourse);
    }
    if (filterProgram !== "all") {
      result = result.filter((s) => s.data["Degree Program"] === filterProgram);
    }
    if (filterStaff !== "all") {
      result = result.filter((s) => s.created_by_id === filterStaff);
    }
    return result;
  }, [allStudents, filterCourse, filterProgram, filterStaff]);

  useEffect(() => {
    async function load() {
      try {
        const students = (await getStudents()) as unknown as Student[];
        setAllStudents(students);
        setRecentStudents(students.slice(0, 5));

        const fields = (await getCustomFields()) as unknown as { label: string }[];
        setFieldLabels(fields.map((f) => f.label));

        try {
          const progs = (await getDegreePrograms()) as unknown as { name: string }[];
          setDbPrograms(progs.map((p) => p.name));
        } catch { /* ignore */ }

        if (isAdmin) {
          const stats = await getStudentStats();
          setTotal(stats.total);
          setStatusCounts(stats.statusCounts);

          const perf = await getStaffPerformance();
          setStaffPerf(perf);
        } else {
          setTotal(students.length);
          const counts: Record<string, number> = {};
          students.forEach((s) => {
            counts[s.status] = (counts[s.status] || 0) + 1;
          });
          setStatusCounts(counts);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  const exportToExcel = () => {
    const data = filteredStudents.map((s) => {
      const row: Record<string, string> = {
        Status: statusLabels[s.status] ?? s.status,
      };
      fieldLabels.forEach((label) => {
        row[label] = s.data[label] || "";
      });
      row["Registered"] = s.created_at ? new Date(s.created_at).toLocaleDateString() : "";
      if (staffNames.has(s.created_by_id || "")) {
        row["Added By"] = staffNames.get(s.created_by_id || "") || "";
      }
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    const colWidths = Object.keys(data[0] || {}).map((key) => ({
      wch: Math.max(key.length, 15),
    }));
    ws["!cols"] = colWidths;

    XLSX.writeFile(wb, `students_report_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`Exported ${filteredStudents.length} students to Excel`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 mb-2" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const enrolledCount = statusCounts.enrolled || 0;
  const newCount = statusCounts.new || 0;
  const contactedCount = statusCounts.contacted || 0;
  const followUpCount = statusCounts.follow_up || 0;

  return isAdmin ? (
    <AdminDashboard
      user={user}
      total={total}
      enrolledCount={enrolledCount}
      contactedCount={contactedCount}
      degreeCounts={degreeCounts}
      courseCounts={courseCounts}
      staffPerf={staffPerf}
      recentStudents={recentStudents}
      filteredStudents={filteredStudents}
      programs={programs}
      courses={courses}
      staffNames={staffNames}
      filterCourse={filterCourse}
      setFilterCourse={setFilterCourse}
      filterProgram={filterProgram}
      setFilterProgram={setFilterProgram}
      filterStaff={filterStaff}
      setFilterStaff={setFilterStaff}
      previewOpen={previewOpen}
      setPreviewOpen={setPreviewOpen}
      exportToExcel={exportToExcel}
      navigate={navigate}
    />
  ) : (
    <StaffDashboard
      user={user}
      total={total}
      enrolledCount={enrolledCount}
      newCount={newCount}
      followUpCount={followUpCount}
      statusCounts={statusCounts}
      recentStudents={recentStudents}
      navigate={navigate}
    />
  );
}

function AdminDashboard({
  user,
  total,
  enrolledCount,
  contactedCount,
  degreeCounts,
  courseCounts,
  staffPerf,
  recentStudents,
  filteredStudents,
  programs,
  courses,
  staffNames,
  filterCourse,
  setFilterCourse,
  filterProgram,
  setFilterProgram,
  filterStaff,
  setFilterStaff,
  previewOpen,
  setPreviewOpen,
  exportToExcel,
  navigate,
}: {
  user: { name?: string } | null;
  total: number;
  enrolledCount: number;
  contactedCount: number;
  degreeCounts: Record<string, number>;
  courseCounts: Record<string, number>;
  staffPerf: Record<string, unknown>[];
  recentStudents: Student[];
  filteredStudents: Student[];
  programs: string[];
  courses: string[];
  staffNames: Map<string, string>;
  filterCourse: string;
  setFilterCourse: (v: string) => void;
  filterProgram: string;
  setFilterProgram: (v: string) => void;
  filterStaff: string;
  setFilterStaff: (v: string) => void;
  previewOpen: boolean;
  setPreviewOpen: (v: boolean) => void;
  exportToExcel: () => void;
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Admin Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              <Shield className="h-3 w-3" /> Admin
            </span>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here&apos;s the system overview.
          </p>
        </div>
        <Button onClick={() => navigate("/add-student")}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCount}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">
                {total > 0 ? Math.round((enrolledCount / total) * 100) : 0}% rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Staff Performance</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {staffPerf.length === 0 ? (
              <p className="text-xs text-muted-foreground">No staff yet</p>
            ) : (
              <div className="space-y-1.5">
                {staffPerf.slice(0, 3).map((s: Record<string, unknown>, i: number) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-medium text-primary">
                          {(s.name as string)?.charAt(0)?.toUpperCase() || "S"}
                        </span>
                      </div>
                      <span className="text-xs truncate">{String(s.name || "Unnamed")}</span>
                    </div>
                    <span className="text-xs font-medium">{s.enrolled as number} enrolled</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contactedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">In progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Download Report */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Download Student Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">Filter students before downloading</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={filterCourse} onValueChange={setFilterCourse}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Course" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterProgram} onValueChange={setFilterProgram}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Program" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {staffNames.size > 0 && (
                  <Select value={filterStaff} onValueChange={setFilterStaff}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Staff" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Staff</SelectItem>
                      {Array.from(staffNames.entries()).map(([id, name]) => (
                        <SelectItem key={id} value={id}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Preview ({filteredStudents.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      Student Report Preview ({filteredStudents.length} students)
                    </DialogTitle>
                  </DialogHeader>
                  {filteredStudents.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No students match the filters</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Program</TableHead>
                            <TableHead>Course</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((s, i) => (
                            <TableRow key={s.id}>
                              <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                              <TableCell className="font-medium">{s.data["Full Name"] || "Unknown"}</TableCell>
                              <TableCell>{s.data["Phone Number"] || ""}</TableCell>
                              <TableCell>{s.data["Degree Program"] || ""}</TableCell>
                              <TableCell>{s.data["Interested Course"] || ""}</TableCell>
                              <TableCell>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[s.status] ?? ""}`}>
                                  {statusLabels[s.status] ?? s.status}
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {new Date(s.created_at).toLocaleDateString()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </DialogContent>
              </Dialog>

              <Button onClick={exportToExcel} disabled={filteredStudents.length === 0}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Degree Program Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Degree Program Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(degreeCounts).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <GraduationCap className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No degree program data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(degreeCounts).map(([degree, count], i) => (
                <div key={degree} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${breakdownColors[i % breakdownColors.length].split(" ")[0]}`} />
                    <span className="text-sm">{degree}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Course Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Course Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(courseCounts).length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No course data yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(courseCounts).map(([course, count], i) => (
                <div key={course} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${breakdownColors[i % breakdownColors.length].split(" ")[0]}`} />
                    <span className="text-sm">{course}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Students</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
            View All
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No students registered yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/add-student")}>
                Add your first student
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentStudents.map((student) => {
                const data = student.data || {};
                const fullName = data["Full Name"] || "Unknown";
                const degreeProgram = data["Degree Program"] || "";
                const interestedCourse = data["Interested Course"] || "";
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate("/students")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {degreeProgram} {interestedCourse && `— ${interestedCourse}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[student.status] ?? student.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.created_at ? new Date(student.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StaffDashboard({
  user,
  total,
  enrolledCount,
  newCount,
  followUpCount,
  statusCounts,
  recentStudents,
  navigate,
}: {
  user: { name?: string } | null;
  total: number;
  enrolledCount: number;
  newCount: number;
  followUpCount: number;
  statusCounts: Record<string, number>;
  recentStudents: Student[];
  navigate: (path: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">My Dashboard</h1>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
              Staff
            </span>
          </div>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here&apos;s your student overview.
          </p>
        </div>
        <Button onClick={() => navigate("/add-student")}>
          <GraduationCap className="mr-2 h-4 w-4" />
          Add New Student
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">My Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enrolledCount}</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-600" />
              <p className="text-xs text-green-600">
                {total > 0 ? Math.round((enrolledCount / total) * 100) : 0}% rate
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">New Enquiries</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{newCount}</div>
            {newCount > 0 && (
              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Needs attention
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Follow Up</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{followUpCount}</div>
            {followUpCount > 0 && (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Pending follow-ups
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">My Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>You haven&apos;t added any students yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/add-student")}>
                Add your first student
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${statusColors[status]?.split(" ")[0] ?? "bg-gray-200"}`} />
                    <span className="text-sm">{statusLabels[status] ?? status}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${total > 0 ? (count / total) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Students</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
            View All
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {recentStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No students registered yet</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate("/add-student")}>
                Add your first student
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {recentStudents.map((student) => {
                const data = student.data || {};
                const fullName = data["Full Name"] || "Unknown";
                const degreeProgram = data["Degree Program"] || "";
                const interestedCourse = data["Interested Course"] || "";
                return (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-3 hover:bg-muted/50 px-2 rounded-lg transition-colors cursor-pointer"
                    onClick={() => navigate("/students")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {fullName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">{fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {degreeProgram} {interestedCourse && `— ${interestedCourse}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[student.status] ?? "bg-gray-100 text-gray-800"}`}>
                        {statusLabels[student.status] ?? student.status}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {student.created_at ? new Date(student.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
