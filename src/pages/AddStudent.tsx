import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { UserPlus, ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { getCustomFields, getActiveDegreePrograms, getActiveCourses, createStudent } from "@/lib/queries";

type CustomField = {
  id: string;
  label: string;
  type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
};

type Program = { id: string; name: string; duration: string };
type Course = { id: string; name: string; code: string };

export default function AddStudent() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [fieldsData, programsData, coursesData] = await Promise.all([
          getCustomFields(),
          getActiveDegreePrograms(),
          getActiveCourses(),
        ]);
        setFields(fieldsData as unknown as CustomField[]);
        setPrograms(programsData as unknown as Program[]);
        setCourses(coursesData as unknown as Course[]);

        const initial: Record<string, string> = {};
        fieldsData.forEach((f: unknown) => {
          const field = f as CustomField;
          initial[field.id] = "";
        });
        setFormData(initial);
      } catch (err) {
        toast.error("Failed to load form data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getSelectOptions = (field: CustomField): string[] => {
    if (field.options && field.options.length > 0) {
      return field.options;
    }

    const label = field.label.toLowerCase();
    if (label.includes("degree") || label.includes("program")) {
      return programs.map((p) => `${p.name} (${p.duration})`);
    }
    if (label.includes("course")) {
      return courses.map((c) => `${c.name} (${c.code})`);
    }

    return [];
  };

  const handleChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = fields.filter((f) => f.is_required);
    for (const f of requiredFields) {
      if (!formData[f.id]?.trim()) {
        toast.error(`Please fill in "${f.label}"`);
        return;
      }
    }

    const fieldData: Record<string, string> = {};
    fields.forEach((f) => {
      if (formData[f.id]) {
        fieldData[f.label] = formData[f.id];
      }
    });

    setSubmitting(true);
    try {
      await createStudent(fieldData);
      toast.success("Student registered successfully!");
      const reset: Record<string, string> = {};
      fields.forEach((f) => { reset[f.id] = ""; });
      setFormData(reset);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to register student";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Register New Student</h1>
          <p className="text-muted-foreground">Enter student details for admission enquiry</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {fields.map((field) => {
              const options = getSelectOptions(field);
              return (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.is_required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {field.type === "text" && (
                    <Input
                      id={field.id}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.is_required}
                    />
                  )}
                  {field.type === "textarea" && (
                    <Textarea
                      id={field.id}
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      rows={3}
                    />
                  )}
                  {field.type === "number" && (
                    <Input
                      id={field.id}
                      type="number"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.is_required}
                    />
                  )}
                  {field.type === "date" && (
                    <Input
                      id={field.id}
                      type="date"
                      value={formData[field.id] || ""}
                      onChange={(e) => handleChange(field.id, e.target.value)}
                      required={field.is_required}
                    />
                  )}
                  {field.type === "boolean" && (
                    <div className="flex items-center gap-2">
                      <Switch
                        id={field.id}
                        checked={formData[field.id] === "true"}
                        onCheckedChange={(checked) => handleChange(field.id, checked ? "true" : "false")}
                      />
                      <Label htmlFor={field.id} className="text-sm text-muted-foreground">
                        {formData[field.id] === "true" ? "Yes" : "No"}
                      </Label>
                    </div>
                  )}
                  {field.type === "select" && (
                    <Select
                      value={formData[field.id] || ""}
                      onValueChange={(value) => handleChange(field.id, value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {options.length === 0 ? (
                          <SelectItem value="__none" disabled>No options available</SelectItem>
                        ) : (
                          options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Button type="button" variant="outline" onClick={() => {
            const reset: Record<string, string> = {};
            fields.forEach((f) => { reset[f.id] = ""; });
            setFormData(reset);
          }}>
            Reset
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Registering..." : "Register Student"}
          </Button>
        </div>
      </form>
    </div>
  );
}
