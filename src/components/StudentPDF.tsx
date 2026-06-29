import React from "react";
import { Document, Page, Text, View, StyleSheet, PDFViewer, BlobProvider } from "@react-pdf/renderer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#1a1a1a",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#0f172a",
    paddingBottom: 15,
  },
  universityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    color: "#475569",
    letterSpacing: 0.5,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 12,
    color: "#0f172a",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  table: {
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableRowEven: {
    backgroundColor: "#f8fafc",
  },
  labelCell: {
    width: "35%",
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
  },
  valueCell: {
    width: "65%",
    fontSize: 10,
    color: "#0f172a",
  },
  statusSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingHorizontal: 8,
  },
  statusItem: {
    flexDirection: "row",
    gap: 6,
  },
  statusLabel: {
    fontSize: 9,
    color: "#64748b",
    fontWeight: "bold",
  },
  statusValue: {
    fontSize: 10,
    color: "#0f172a",
  },
  signatureSection: {
    marginTop: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  signatureRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 30,
    paddingHorizontal: 20,
  },
  signatureBlock: {
    width: "40%",
    alignItems: "center",
  },
  signatureLine: {
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#1a1a1a",
    marginTop: 40,
    paddingTop: 5,
  },
  signatureText: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
  },
  stampSection: {
    alignItems: "center",
    marginTop: 20,
  },
  stampBox: {
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderStyle: "dashed",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  stampText: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#94a3b8",
    borderTopWidth: 0.5,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
});

type StudentPDFProps = {
  studentData: Record<string, string>;
  status: string;
  createdAt: string;
  isOpen: boolean;
  onClose: () => void;
};

const statusLabels: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  follow_up: "Follow Up",
  enrolled: "Enrolled",
  rejected: "Rejected",
};

function PDFDocument({ studentData, status, createdAt }: Omit<StudentPDFProps, "isOpen" | "onClose">) {
  const entries = Object.entries(studentData);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.universityName}>NIPPON INSTITUTE OF</Text>
          <Text style={styles.universityName}>ADVANCED SCIENCES</Text>
          <Text style={styles.subtitle}>Excellence in Education & Research</Text>
        </View>

        <Text style={styles.formTitle}>ADMISSION FORM</Text>

        <View style={styles.table}>
          {entries.map(([key, value], index) => (
            <View
              key={key}
              style={[styles.tableRow, index % 2 === 0 ? styles.tableRowEven : {}]}
            >
              <Text style={styles.labelCell}>{key}</Text>
              <Text style={styles.valueCell}>{value || "N/A"}</Text>
            </View>
          ))}
        </View>

        <View style={styles.statusSection}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Status:</Text>
            <Text style={styles.statusValue}>{statusLabels[status] || status}</Text>
          </View>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Registration Date:</Text>
            <Text style={styles.statusValue}>{new Date(createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}</Text>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureRow}>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Student Signature</Text>
              </View>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine}>
                <Text style={styles.signatureText}>Authorized Signature</Text>
              </View>
            </View>
          </View>

          <View style={styles.stampSection}>
            <View style={styles.stampBox}>
              <Text style={styles.stampText}>University{"\n"}Official Stamp</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Nippon Institute of Advanced Sciences | Official Admission Document
        </Text>
      </Page>
    </Document>
  );
}

type StudentPDFDialogProps = StudentPDFProps & {
  studentName?: string;
};

export function StudentPDFDialog({ studentData, status, createdAt, isOpen, onClose, studentName }: StudentPDFDialogProps) {
  const pdfProps = { studentData, status, createdAt };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle>Admission Form - {studentName || "Student"}</DialogTitle>
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
      />
    </>
  );
}
