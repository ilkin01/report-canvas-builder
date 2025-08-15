import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit, Trash, PenTool } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReports, fetchReportById, viewReport } from "@/redux/slices/reportsSlice";
import { toast } from "sonner";
import { ReportDocument } from "@/types/editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

interface PatientsListProps {
  onReportSelect?: () => void;
  reports?: ReportDocument[];
}

export const PatientsList: React.FC<PatientsListProps> = ({ onReportSelect, reports: externalReports }) => {
  const dispatch = useAppDispatch();
  const { reports: reduxReports, loading, error } = useAppSelector(state => state.reports);
  const isMobile = useIsMobile();
  // For local state update
  const [localReports, setLocalReports] = useState<ReportDocument[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (externalReports) {
      setLocalReports(externalReports);
    } else {
      setLocalReports(reduxReports);
    }
  }, [externalReports, reduxReports]);

  const reports = localReports;

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState("");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  // New state for selects
  const [patients, setPatients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination helpers for modal patient search
  const pageSize = 6;
  const [patientPageIndex, setPatientPageIndex] = useState(0);
  const [patientTotalCount, setPatientTotalCount] = useState(0);
  const totalPages = Math.ceil(patientTotalCount / pageSize);
  function getPageNumbers(current: number, total: number) {
    const delta = 2;
    const range: (number | string)[] = [];
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      range.push(i);
    }
    if (current - delta > 2) range.unshift('...');
    if (current + delta < total - 1) range.push('...');
    range.unshift(1);
    if (total > 1) range.push(total);
    return range;
  }

  // Fetch patients and templates when modal opens
  useEffect(() => {
    if (showEditModal) {
      // Fetch templates
      setTemplatesLoading(true);
      import("@/services/apiService").then(({ apiService }) => {
        apiService.sendRequest({
          endpoint: "/api/ReportTemplate/GetAllReportTemplates",
          method: "GET"
        }).then((data) => {
          setTemplates(data || []);
        }).catch(() => setTemplates([])).finally(() => setTemplatesLoading(false));
      });
      // Fetch patients (first page, empty search)
      setPatientsLoading(true);
      import("@/services/apiService").then(({ apiService }) => {
        apiService.sendRequest({
          endpoint: "/api/HospitalLab/SearchPatientsForLab",
          method: "POST",
          body: { name: "", pageIndex: 0 }
        }).then((res) => {
          setPatients(res.users || []);
        }).catch(() => setPatients([])).finally(() => setPatientsLoading(false));
      });
    }
  }, [showEditModal]);

  // Pre-select current patient/template when modal opens
  useEffect(() => {
    if (showEditModal && editingReportId) {
      const editingReport = reports.find(r => r.id === editingReportId);
      setSelectedPatientId(editingReport?.patientId ? String(editingReport.patientId) : null);
      setSelectedTemplateId(editingReport?.templateId ? String(editingReport.templateId) : null);
    }
  }, [showEditModal, editingReportId, reports]);

  // Fetch patients with search
  useEffect(() => {
    if (showEditModal) {
      setPatientsLoading(true);
      import("@/services/apiService").then(({ apiService }) => {
        apiService.sendRequest({
          endpoint: "/api/HospitalLab/SearchPatientsForLab",
          method: "POST",
          body: { name: patientSearch, pageIndex: patientPageIndex, pageSize }
        }).then((res) => {
          setPatients(res.users || []);
          setPatientTotalCount(res.totalCount || 0);
        }).catch(() => { setPatients([]); setPatientTotalCount(0); }).finally(() => setPatientsLoading(false));
      });
    }
  }, [showEditModal, patientSearch, patientPageIndex, pageSize]);

  const handleOpenEditModal = (report: ReportDocument) => {
    setEditName(report.name);
    setEditingReportId(report.id);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingReportId || !selectedPatientId || !selectedTemplateId) return;
    setSaving(true);
    try {
      // Find selected patient info
      const selectedPatient = patients.find((p: any) => String(p.id) === String(selectedPatientId));
      const patientName = selectedPatient ? `${selectedPatient.name || ''} ${selectedPatient.surname || ''} ${selectedPatient.fatherName || ''}`.trim() : '';
      // Prepare payload
      const payload = {
        name: editName,
        patientId: selectedPatientId,
        patientName,
        templateId: selectedTemplateId,
        type: 1,
        status: 1
      };
      await import("@/services/apiService").then(({ apiService }) =>
        apiService.sendRequest({
          endpoint: `/api/Report/UpdateReport/${editingReportId}`,
          method: "PUT",
          body: payload
        })
      );
      toast.success("Report updated successfully");
      setShowEditModal(false);
      // Update local report list
      setLocalReports(prev => prev.map(r => r.id === editingReportId ? { ...r, ...payload } : r));
    } catch (err: any) {
      toast.error(err.message || "Failed to update report");
    } finally {
      setSaving(false);
    }
  };

  // useEffect(() => { // Commented out as it might be redundant if called in Index.tsx
  //   // dispatch(fetchAllReports()); 
  // }, [dispatch]);

  // Function to get a short excerpt from the report content
  const getDocumentExcerpt = (report: ReportDocument) => {
    if (!report.pages || !report.pages.length || !report.pages[0].elements) return "No content";
    
    const textElements = report.pages[0].elements.filter(el => el.type === "text");
    if (textElements.length === 0) return "No text content";
    
    const firstTextContent = textElements[0].content;
    // Check if content and content.text exist
    const firstText = firstTextContent && typeof firstTextContent.text === 'string' ? firstTextContent.text : "";
    
    return firstText.length > 60 
      ? firstText.substring(0, 60) + "..." 
      : firstText;
  };
  
  // Function to handle clicking on a report row
  const handleReportClick = async (reportId: string) => {
    try {
      await dispatch(fetchReportById(reportId)).unwrap(); // Raporun tam verisini çek
      dispatch(viewReport(reportId)); // Raporu "görüntülenen" olarak ayarla (sadece bu rapor açık olacak)
      
      if (onReportSelect) {
        onReportSelect();
      }
    } catch (error) {
      toast.error("Failed to load report");
      console.error("Error loading report:", error);
    }
  };

  // Helper to get patient and template info for modal
  const getPatientInfo = (report: ReportDocument) => {
    const name = report.patientName || '';
    const surname = report.patientSurname || '';
    const fatherName = report.patientFatherName || '';
    return `${name} ${surname} ${fatherName}`.trim();
  };
  const getTemplateName = (report: ReportDocument) => {
    if (!report.templateId) return '';
    const template = templates.find((t: any) => String(t.id) === String(report.templateId));
    return template ? template.name : report.templateId;
  };

  // Find the editing report for modal display
  const editingReport = reports.find(r => r.id === editingReportId);

  const handleDeleteReport = async (reportId: string) => {
    setDeletingId(reportId);
    try {
      await import("@/services/apiService").then(({ apiService }) =>
        apiService.sendRequest({
          endpoint: `/api/Report/DeleteReport/${reportId}`,
          method: "DELETE"
        })
      );
      toast.success("Report deleted successfully");
      // Remove from local report list
      setLocalReports(prev => prev.filter(r => r.id !== reportId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete report");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-3 md:p-6">
        <CardTitle className="text-lg md:text-xl">Patient Reports</CardTitle>
      </CardHeader>
      <CardContent className="p-3 md:p-6">
        {loading && reports.length === 0 ? ( // Sadece başlangıç yüklemesinde göster
          <div className="text-center py-6">Loading reports...</div>
        ) : error ? (
          <div className="text-center py-6 text-red-500">
            Error loading reports: {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No reports available. Create a new report to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm md:text-base">Report Name</TableHead>
                  <TableHead className="text-sm md:text-base">Created At</TableHead>
                  <TableHead className="text-sm md:text-base">Patient Name</TableHead>
                  <TableHead className="text-right text-sm md:text-base">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-sm md:text-base">{report.name}</TableCell>
                    <TableCell className="text-sm md:text-base">
                      {report.createdAt ? new Date(report.createdAt).toLocaleString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm md:text-base">{report.patientName ? report.patientName : 'Pasiyent Secilmeyib'}</TableCell>
                    <TableCell className="flex gap-1 md:gap-2 justify-end">
                      {/* Edit Button - Always Visible */}
                      <Button 
                        variant="outline" 
                        size={isMobile ? "sm" : "sm"} 
                        title="Change Name" 
                        onClick={() => handleOpenEditModal(report)}
                        className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                      >
                        <Edit className="h-3 w-3 md:h-4 md:w-4" />
                        {!isMobile && <span className="ml-1">Edit</span>}
                      </Button>
                      
                      {/* Update Button - Hidden on Mobile and Small Screens */}
                      <div className="hidden xl:block">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Update"
                          onClick={async () => {
                            try {
                              // 1. GET report data
                              await import("@/services/apiService").then(async ({ apiService }) => {
                                await apiService.sendRequest({
                                  endpoint: `/api/Report/GetReportById/${report.id}`,
                                  method: "GET"
                                });
                              });
                              // 2. Show warning and navigate
                              toast.warning("Bu, mövcud hesabatın yenilənməsi (update) səhifəsidir.");
                              navigate(`/report-updater?reportId=${report.id}`);
                            } catch (err) {
                              toast.error("Report məlumatı yüklənə bilmədi");
                            }
                          }}
                          className="h-8 px-3"
                        >
                          <PenTool className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </div>
                      
                      {/* Delete Button - Always Visible */}
                      <Button
                        variant="destructive"
                        size={isMobile ? "sm" : "sm"}
                        title="Delete"
                        onClick={() => handleDeleteReport(report.id)}
                        disabled={deletingId === report.id}
                        className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                      >
                        {deletingId === report.id ? (
                          "..." 
                        ) : (
                          <>
                            <Trash className="h-3 w-3 md:h-4 md:w-4" />
                            {!isMobile && <span className="ml-1">Delete</span>}
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Edit Name Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl w-full mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Edit Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">Report Name</label>
              <Input 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">Search Patient</label>
              <Input
                placeholder="Pasiyent axtar..."
                value={patientSearch}
                onChange={e => setPatientSearch(e.target.value)}
                className="mb-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-200"
              />
              <div className="text-xs md:text-sm text-gray-500 italic mb-2">Bu pasiyentlər reception tərəfindən yönləndirilib.</div>
              <div className="overflow-auto max-h-[300px]">
                {patientsLoading ? (
                  <div className="flex justify-center items-center py-8">
                    <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
                  </div>
                ) : patients.length === 0 ? (
                  <div className="text-center py-6 text-gray-400">Heç bir pasiyent tapılmadı</div>
                ) : (
                  <div className="w-full">
                    {selectedPatientId && (
                      <div className="mb-3 flex items-center gap-2">
                        <div className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold shadow">
                          Seçilmiş: {(() => {
                            const p = patients.find(x => String(x.id) === String(selectedPatientId));
                            return p
                              ? (p.fullName || [p.name, p.surname].filter(Boolean).join(' ') || [p.firstName, p.lastName].filter(Boolean).join(' ') || p.name || p.surname || p.firstName || p.lastName || '')
                              : '';
                          })()}
                        </div>
                      </div>
                    )}
                    <div className="overflow-y-auto max-h-[350px]">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="py-2 px-4 text-left font-semibold">Ad Soyad</th>
                            <th className="py-2 px-4 text-left font-semibold">Ata adı</th>
                            <th className="py-2 px-4 text-left font-semibold">Doğum</th>
                            <th className="py-2 px-4 text-left font-semibold">FIN</th>
                          </tr>
                        </thead>
                        <tbody>
                          {patients.map((p: any) => {
                            const selected = selectedPatientId === String(p.id);
                            return (
                              <tr
                                key={p.id}
                                className={
                                  "border-b transition cursor-pointer " +
                                  (selected ? "bg-blue-50" : "hover:bg-gray-50")
                                }
                                onClick={() => setSelectedPatientId(String(p.id))}
                              >
                                <td className="py-2 px-4">
                                  <span className={"font-semibold underline " + (selected ? "text-blue-800" : "text-blue-700 hover:text-blue-900") }>
                                    {p.fullName || [p.name, p.surname].filter(Boolean).join(' ')}
                                  </span>
                                </td>
                                <td className="py-2 px-4 text-gray-500">{p.fatherName || p.middleName || p.patronymic || ''}</td>
                                <td className="py-2 px-4">{p.birthDay}</td>
                                <td className="py-2 px-4">{p.finCode}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              {/* Pagination */}
              {patients.length > 0 && totalPages > 0 && (
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Əvvəlki səhifə"
                    disabled={patientPageIndex === 0}
                    onClick={() => setPatientPageIndex(i => i - 1)}
                    className="rounded-full transition hover:bg-blue-50"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7"/></svg>
                  </Button>
                  {getPageNumbers(patientPageIndex + 1, totalPages).map((page, idx) =>
                    page === '...'
                      ? <span key={idx} className="px-2 text-gray-400 select-none">...</span>
                      : (
                        <Button
                          key={page}
                          size="icon"
                          aria-label={`Səhifə ${page}`}
                          variant={patientPageIndex + 1 === page ? "default" : "outline"}
                          className={
                            "rounded-full font-mono text-lg font-semibold transition " +
                            (patientPageIndex + 1 === page
                              ? "bg-blue-600 text-white shadow-lg scale-110"
                              : "hover:bg-blue-50")
                          }
                          onClick={() => setPatientPageIndex(Number(page) - 1)}
                        >
                          {page}
                        </Button>
                      )
                  )}
                  <Button
                    size="icon"
                    variant="outline"
                    aria-label="Növbəti səhifə"
                    disabled={patientPageIndex === totalPages - 1}
                    onClick={() => setPatientPageIndex(i => i + 1)}
                    className="rounded-full transition hover:bg-blue-50"
                  >
                    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></svg>
                  </Button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm md:text-base font-medium mb-2">Template</label>
              <Input
                type="text"
                value={(() => {
                  const t = templates.find((t: any) => String(t.id) === String(selectedTemplateId));
                  return t ? t.name : '';
                })()}
                disabled
                className="w-full font-bold bg-gray-100 border border-gray-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEdit} disabled={saving} className="w-full md:w-auto">
              {saving ? "Yadda saxlanır..." : "Yadda saxla"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
