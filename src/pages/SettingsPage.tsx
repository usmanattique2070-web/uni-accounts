import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock, User, Plus, Trash2, GripVertical } from "lucide-react";
import { changePassword, getCustomFields, createCustomField, updateCustomField, deleteCustomField } from "@/lib/queries";

type CustomField = {
  id: string;
  label: string;
  type: string;
  options: string[];
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
};

export default function SettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [fields, setFields] = useState<CustomField[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  const [fieldDialog, setFieldDialog] = useState(false);
  const [fieldLabel, setFieldLabel] = useState("");
  const [fieldType, setFieldType] = useState("text");
  const [fieldOptions, setFieldOptions] = useState("");
  const [fieldRequired, setFieldRequired] = useState(false);
  const [fieldId, setFieldId] = useState<string | null>(null);

  useEffect(() => { loadFields(); }, []);

  async function loadFields() {
    try {
      const data = await getCustomFields();
      setFields(data as unknown as CustomField[]);
    } catch (err) {
      console.error(err);
    } finally {
      setFieldsLoading(false);
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword(newPassword);
      toast.success("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldLabel) { toast.error("Label is required"); return; }

    const optionsArray = fieldType === "select"
      ? fieldOptions.split(",").map((o) => o.trim()).filter(Boolean)
      : [];

    try {
      if (fieldId) {
        await updateCustomField(fieldId, {
          label: fieldLabel,
          type: fieldType,
          options: optionsArray,
          is_required: fieldRequired,
        });
        toast.success("Field updated");
      } else {
        await createCustomField({
          label: fieldLabel,
          type: fieldType,
          options: optionsArray,
          is_required: fieldRequired,
          sort_order: fields.length + 1,
        });
        toast.success("Field created");
      }
      setFieldDialog(false);
      setFieldId(null);
      setFieldLabel("");
      setFieldType("text");
      setFieldOptions("");
      setFieldRequired(false);
      await loadFields();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!confirm("Delete this field? Existing student data for this field will be lost.")) return;
    try {
      await deleteCustomField(id);
      await loadFields();
      toast.success("Field deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const handleToggleField = async (id: string, isActive: boolean) => {
    try {
      await updateCustomField(id, { is_active: isActive });
      await loadFields();
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and application settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-medium text-primary">{user?.name?.charAt(0)?.toUpperCase() || "U"}</span>
            </div>
            <div>
              <h3 className="font-semibold">{user?.name || "User"}</h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize mt-1 inline-block">{user?.role}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" />Change Password</CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={changingPassword}>
              {changingPassword ? "Changing..." : "Change Password"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {user?.role === "admin" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <GripVertical className="h-4 w-4" />Form Builder
                </CardTitle>
                <CardDescription>Customize the student admission form fields</CardDescription>
              </div>
              <Dialog open={fieldDialog} onOpenChange={(open) => {
                setFieldDialog(open);
                if (!open) {
                  setFieldId(null);
                  setFieldLabel("");
                  setFieldType("text");
                  setFieldOptions("");
                  setFieldRequired(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="mr-2 h-3 w-3" />Add Field</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{fieldId ? "Edit Field" : "Add Custom Field"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSaveField} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Field Label</Label>
                      <Input placeholder="e.g. Father's Name" value={fieldLabel} onChange={(e) => setFieldLabel(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select value={fieldType} onValueChange={setFieldType}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text Input</SelectItem>
                          <SelectItem value="textarea">Text Area</SelectItem>
                          <SelectItem value="select">Dropdown/Select</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date Picker</SelectItem>
                          <SelectItem value="boolean">Yes/No Toggle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {fieldType === "select" && (
                      <div className="space-y-2">
                        <Label>Options (comma separated)</Label>
                        <Input placeholder="e.g. Option 1, Option 2, Option 3" value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Switch checked={fieldRequired} onCheckedChange={setFieldRequired} />
                      <Label>Required field</Label>
                    </div>
                    <Button type="submit" className="w-full">{fieldId ? "Update Field" : "Add Field"}</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {fieldsLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : fields.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No fields configured. Add one to start.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Label</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Required</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, i) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{field.label}</TableCell>
                        <TableCell className="text-sm capitalize">{field.type}</TableCell>
                        <TableCell>{field.is_required ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          <Switch checked={field.is_active} onCheckedChange={(checked) => handleToggleField(field.id, checked)} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => {
                              setFieldId(field.id);
                              setFieldLabel(field.label);
                              setFieldType(field.type);
                              setFieldOptions(field.options?.join(", ") || "");
                              setFieldRequired(field.is_required);
                              setFieldDialog(true);
                            }}>Edit</Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteField(field.id)}>
                              <Trash2 className="h-4 w-4" />
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
      )}
    </div>
  );
}
