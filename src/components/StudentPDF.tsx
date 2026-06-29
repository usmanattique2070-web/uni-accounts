import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFViewer, BlobProvider } from "@react-pdf/renderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

// ============ FIELD ORDERING & GROUPING ============

const PERSONAL_KEYWORDS = ["name", "cnic", "passport", "dob", "birth", "gender", "age", "nationality", "father", "mother", "guardian", "relation"];
const CONTACT_KEYWORDS = ["phone", "email", "address", "city", "country", "contact", "mobile"];
const ACADEMIC_KEYWORDS = ["degree", "program", "course", "education", "school", "college", "university", "qualification", "board", "grade", "gpa", "percentage", "subject"];

function matchSection(label: string, keywords: string[]): boolean {
  const lower = label.toLowerCase();
  return keywords.some((kw) => lower.includes(kw));
}

function sortAndGroupFields(
  data: Record<string, string>,
  fields?: { label: string; sort_order: number }[]
): { section: string; entries: [string, string][] }[] {
  let entries: [string, string][];

  if (fields && fields.length > 0) {
    const orderMap = new Map(fields.map((f, i) => [f.label, f.sort_order ?? i]));
    entries = Object.entries(data).sort((a, b) => {
      const oa = orderMap.get(a[0]) ?? 9999;
      const ob = orderMap.get(b[0]) ?? 9999;
      return oa - ob;
    });
  } else {
    const priority: Record<string, number> = {
      "full name": 0, "phone number": 1, "cnic": 2, "email": 3, "degree program": 4, "interested course": 5,
    };
    entries = Object.entries(data).sort((a, b) => {
      const pa = priority[a[0].toLowerCase()] ?? 9999;
      const pb = priority[b[0].toLowerCase()] ?? 9999;
      if (pa !== pb) return pa - pb;
      return a[0].localeCompare(b[0]);
    });
  }

  const personal: [string, string][] = [];
  const contact: [string, string][] = [];
  const academic: [string, string][] = [];
  const other: [string, string][] = [];

  entries.forEach(([key, value]) => {
    if (matchSection(key, PERSONAL_KEYWORDS)) personal.push([key, value]);
    else if (matchSection(key, CONTACT_KEYWORDS)) contact.push([key, value]);
    else if (matchSection(key, ACADEMIC_KEYWORDS)) academic.push([key, value]);
    else other.push([key, value]);
  });

  const sections: { section: string; entries: [string, string][] }[] = [];
  if (personal.length > 0) sections.push({ section: "PERSONAL INFORMATION", entries: personal });
  if (contact.length > 0) sections.push({ section: "CONTACT DETAILS", entries: contact });
  if (academic.length > 0) sections.push({ section: "ACADEMIC INFORMATION", entries: academic });
  if (other.length > 0) sections.push({ section: "ADDITIONAL INFORMATION", entries: other });

  return sections;
}

// ============ STYLES ============

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: "#1a1a1a",
  },

  // Outer decorative border
  borderFrame: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: "#0f172a",
  },
  borderFrameInner: {
    position: "absolute",
    top: 24,
    left: 24,
    right: 24,
    bottom: 24,
    borderWidth: 0.5,
    borderColor: "#94a3b8",
  },

  // Header
  header: {
    textAlign: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1.5,
    borderBottomColor: "#0f172a",
  },
  universityName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 2,
    marginBottom: 2,
  },
  universitySubtitle: {
    fontSize: 9,
    color: "#475569",
    letterSpacing: 0.5,
  },

  // Form title
  formTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
  },
  formTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1.5,
  },
  refLine: {
    fontSize: 7,
    color: "#64748b",
    textAlign: "right",
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    marginTop: 10,
  },
  sectionBar: {
    width: 3,
    height: 12,
    backgroundColor: "#0f172a",
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1,
  },
  sectionDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    marginBottom: 6,
    marginLeft: 11,
  },

  // Table rows
  table: {
    marginLeft: 11,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.3,
    borderBottomColor: "#f1f5f9",
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  labelCell: {
    width: "38%",
    fontSize: 8,
    color: "#64748b",
    fontWeight: "bold",
  },
  valueCell: {
    width: "62%",
    fontSize: 9,
    color: "#0f172a",
  },

  // Status section
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingHorizontal: 11,
  },
  statusItem: {
    flexDirection: "row",
    gap: 4,
  },
  statusLabel: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: "bold",
  },
  statusValue: {
    fontSize: 9,
    color: "#0f172a",
  },

  // Declaration
  declaration: {
    marginTop: 16,
    paddingTop: 10,
    paddingHorizontal: 11,
  },
  declarationText: {
    fontSize: 8,
    color: "#475569",
    fontStyle: "italic",
    lineHeight: 1.4,
    marginBottom: 4,
  },

  // Signatures
  signatureSection: {
    marginTop: 12,
    paddingHorizontal: 30,
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  signatureBlock: {
    width: "42%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    marginTop: 35,
    paddingTop: 4,
  },
  signatureText: {
    fontSize: 8,
    color: "#475569",
    textAlign: "center",
  },
  dateLine: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 2,
  },

  // Stamp
  stampSection: {
    alignItems: "center",
    marginTop: 14,
  },
  stampBox: {
    width: 90,
    height: 90,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
  },
  stampText: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 1.3,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 28,
    left: 35,
    right: 35,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
  },
  footerLeft: {
    fontSize: 7,
    color: "#94a3b8",
    width: "60%",
  },
  footerRight: {
    fontSize: 7,
    color: "#94a3b8",
    width: "40%",
    textAlign: "right",
  },
});

// ============ PDF TYPES ============

type StudentPDFProps = {
  studentData: Record<string, string>;
  status: string;
  createdAt: string;
  isOpen: boolean;
  onClose: () => void;
};

type CustomFieldDef = {
  label: string;
  sort_order: number;
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow Up",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

// ============ PDF DOCUMENT ============

function PDFDocument({
  studentData,
  status,
  createdAt,
  fields,
  refNumber,
}: Omit<StudentPDFProps, "isOpen" | "onClose"> & {
  fields?: CustomFieldDef[];
  refNumber?: string;
}) {
  const sections = sortAndGroupFields(studentData, fields);
  const dateStr = new Date(createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const ref = refNumber || `NIAS-${new Date(createdAt).getFullYear()}-${studentData["Full Name"]?.slice(0, 3).toUpperCase() || "XXX"}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Decorative border */}
        <View style={styles.borderFrame} />
        <View style={styles.borderFrameInner} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.universityName}>NIPPON INSTITUTE OF ADVANCED SCIENCES</Text>
          <Text style={styles.universitySubtitle}>Excellence in Education & Research</Text>
        </View>

        {/* Form title + reference */}
        <View style={styles.formTitleRow}>
          <Text style={styles.formTitle}>ADMISSION ENQUIRY FORM</Text>
          <View>
            <Text style={styles.refLine}>Ref: {ref}</Text>
            <Text style={styles.refLine}>Date: {dateStr}</Text>
          </View>
        </View>

        {/* Dynamic sections */}
        {sections.map((sec, si) => (
          <View key={si}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionBar} />
              <Text style={styles.sectionTitle}>{sec.section}</Text>
            </View>
            <View style={styles.sectionDivider} />
            <View style={styles.table}>
              {sec.entries.map(([key, value], index) => (
                <View
                  key={key}
                  style={[styles.tableRow, index % 2 === 0 ? styles.tableRowAlt : {}]}
                >
                  <Text style={styles.labelCell}>{key}</Text>
                  <Text style={styles.valueCell}>{value || "N/A"}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Status */}
        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusValue}>{statusLabels[status] || status}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Registered:</Text>
            <Text style={styles.statusValue}>{dateStr}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationText}>
            I hereby declare that the information provided above is true and correct to the best of my knowledge.
            I understand that any false information may result in the cancellation of my admission.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Student Signature</Text>
                <Text style={styles.dateLine}>Date: _______________</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Authorized Signature</Text>
                <Text style={styles.dateLine}>Date: _______________</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stamp */}
        <View style={styles.stampSection}>
          <View style={styles.stampBox}>
            <Text style={styles.stampText}>Official{"\n"}Stamp</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            Nippon Institute of Advanced Sciences — This is a computer-generated document.
          </Text>
          <Text style={styles.footerRight}>Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}

// ============ DIALOG & BUTTON ============

type StudentPDFDialogProps = StudentPDFProps & {
  studentName?: string;
  fields?: CustomFieldDef[];
};

export function StudentPDFDialog({
  studentData,
  status,
  createdAt,
  isOpen,
  onClose,
  studentName,
  fields,
}: StudentPDFDialogProps) {
  const pdfProps = { studentData, status, createdAt, fields };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle>Admission Form — {studentName || "Student"}</DialogTitle>
          <BlobProvider document={<PDFDocument {...pdfProps} />}>
            {({ url, loading }) => (
              <Button
                variant="outline"
                size="sm"
                disabled={loading || !url}
                onClick={() => {
                  if (url) {
                    const link = document.createElement("a");
                    link.href = url;
                    link.download = `admission_form_${studentName?.replace(/\s+/g, "_") || "student"}.pdf`;
                    link.click();
                  }
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            )}
          </BlobProvider>
        </DialogHeader>
        <div className="flex-1 px-6 pb-6">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            <PDFDocument {...pdfProps} />
          </PDFViewer>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PrintButton({
  studentData,
  status,
  createdAt,
  studentName,
  fields,
  variant = "ghost",
}: Omit<StudentPDFDialogProps, "isOpen" | "onClose"> & { variant?: "ghost" | "outline" | "default" }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant={variant} size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <Printer className="h-4 w-4" />
      </Button>
      <StudentPDFDialog
        studentData={studentData}
        status={status}
        createdAt={createdAt}
        isOpen={open}
        onClose={() => setOpen(false)}
        studentName={studentName}
        fields={fields}
      />
    </>
  );
}
