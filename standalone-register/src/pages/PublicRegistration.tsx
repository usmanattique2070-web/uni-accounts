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
import { UserPlus, CheckCircle, Edit3 } from "lucide-react";
import { getCustomFields, getActiveDegreePrograms, getActiveCourses, submitPublicRegistration } from "@/lib/queries";

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

export default function PublicRegistration() {
  const [fields, setFields] = useState<CustomField[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "review" | "success">("form");

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

  const getFieldData = (): Record<string, string> => {
    const fieldData: Record<string, string> = {};
    fields.forEach((f) => {
      if (formData[f.id]) {
        fieldData[f.label] = formData[f.id];
      }
    });
    return fieldData;
  };

  const handleReview = (e: React.FormEvent) => {
    e.preventDefault();
    setStep("review");
  };

  const handleSubmit = async () => {
    const fieldData = getFieldData();
    setSubmitting(true);
    try {
      await submitPublicRegistration(fieldData);
      toast.success("Registration submitted successfully!");
      setStep("success");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit registration";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    const reset: Record<string, string> = {};
    fields.forEach((f) => { reset[f.id] = ""; });
    setFormData(reset);
    setStep("form");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const fieldData = getFieldData();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Registration</h1>
          <p className="text-gray-600 mt-1">Fill out the form below to register</p>
        </div>

        {/* Success State */}
        {step === "success" && (
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-green-800 mb-2">Registration Submitted!</h2>
              <p className="text-green-600 mb-6">Thank you for registering. We will contact you soon.</p>
              <Button onClick={handleReset} variant="outline">
                Register Another Student
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Review State */}
        {step === "review" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Review Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fields.map((field) => {
                  const value = fieldData[field.label] || "—";
                  return (
                    <div key={field.id} className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">{field.label}</p>
                      <p className="text-sm">{value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setStep("form")}>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? "Submitting..." : "Confirm & Submit"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Form State */}
        {step === "form" && (
          <form onSubmit={handleReview}>
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
                          required={field.is_required}
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
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button type="submit">
                Review Registration
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
