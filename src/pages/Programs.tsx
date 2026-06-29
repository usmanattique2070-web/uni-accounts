import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BookOpen, Plus, Trash2, GraduationCap } from "lucide-react";
import { getDegreePrograms, getCourses, createDegreeProgram, deleteDegreeProgram, createCourse, deleteCourse } from "@/lib/queries";

type Program = { id: string; name: string; duration: string; description: string | null; is_active: boolean; };
type Course = { id: string; name: string; code: string; description: string | null; is_active: boolean; degree_programs?: { name: string } | null; };

export default function Programs() {
  const { isAdmin } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [progDialog, setProgDialog] = useState(false);
  const [courseDialog, setCourseDialog] = useState(false);
  const [progName, setProgName] = useState("");
  const [progDuration, setProgDuration] = useState("");
  const [progDesc, setProgDesc] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDesc, setCourseDesc] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const [p, c] = await Promise.all([getDegreePrograms(), getCourses()]);
      setPrograms(p as unknown as Program[]);
      setCourses(c as unknown as Course[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!progName || !progDuration) { toast.error("Name and duration required"); return; }
    setCreating(true);
    try {
      await createDegreeProgram({ name: progName, duration: progDuration, description: progDesc || undefined });
      toast.success("Program created");
      setProgDialog(false);
      setProgName(""); setProgDuration(""); setProgDesc("");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setCreating(false); }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseName || !courseCode) { toast.error("Name and code required"); return; }
    setCreating(true);
    try {
      await createCourse({ name: courseName, code: courseCode, description: courseDesc || undefined });
      toast.success("Course created");
      setCourseDialog(false);
      setCourseName(""); setCourseCode(""); setCourseDesc("");
      await loadData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally { setCreating(false); }
  };

  const handleDeleteProgram = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try { await deleteDegreeProgram(id); await loadData(); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    try { await deleteCourse(id); await loadData(); toast.success("Deleted"); } catch { toast.error("Failed"); }
  };

  if (loading) {
    return <div className="space-y-6"><Skeleton className="h-8 w-64" /><div className="grid grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Programs & Courses</h1>
        <p className="text-muted-foreground">Manage degree programs and courses</p>
      </div>

      <Tabs defaultValue="programs">
        <TabsList>
          <TabsTrigger value="programs" className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Programs ({programs.length})</TabsTrigger>
          <TabsTrigger value="courses" className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Courses ({courses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="programs" className="space-y-4">
          {isAdmin && (
            <Dialog open={progDialog} onOpenChange={setProgDialog}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Program</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Degree Program</DialogTitle></DialogHeader>
                <form onSubmit={handleAddProgram} className="space-y-4">
                  <div className="space-y-2"><Label>Program Name</Label><Input placeholder="e.g. BS Computer Science" value={progName} onChange={(e) => setProgName(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Duration</Label><Input placeholder="e.g. 4 Years" value={progDuration} onChange={(e) => setProgDuration(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Optional description" value={progDesc} onChange={(e) => setProgDesc(e.target.value)} /></div>
                  <Button type="submit" className="w-full" disabled={creating}>{creating ? "Creating..." : "Create Program"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {programs.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{p.name}</CardTitle>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteProgram(p.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Duration: {p.duration}</p>
                  {p.description && <p className="text-sm mt-2">{p.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          {isAdmin && (
            <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
              <DialogTrigger asChild><Button><Plus className="mr-2 h-4 w-4" />Add Course</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Course</DialogTitle></DialogHeader>
                <form onSubmit={handleAddCourse} className="space-y-4">
                  <div className="space-y-2"><Label>Course Name</Label><Input placeholder="e.g. Programming Fundamentals" value={courseName} onChange={(e) => setCourseName(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Course Code</Label><Input placeholder="e.g. CS101" value={courseCode} onChange={(e) => setCourseCode(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Optional" value={courseDesc} onChange={(e) => setCourseDesc(e.target.value)} /></div>
                  <Button type="submit" className="w-full" disabled={creating}>{creating ? "Creating..." : "Create Course"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    {isAdmin && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteCourse(c.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Code: {c.code}</p>
                  {c.degree_programs && <p className="text-sm mt-1">Program: {c.degree_programs.name}</p>}
                  {c.description && <p className="text-sm mt-2">{c.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
