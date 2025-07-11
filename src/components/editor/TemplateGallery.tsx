
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";

interface TemplateGalleryProps {
  onSelectTemplate?: () => void;
  onSelectPatient?: (patient: { id: string; name: string; surname: string }) => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  onSelectTemplate,
  onSelectPatient
}) => {
  const [reportName, setReportName] = useState("New Report");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Patient search state
  const [patientSearch, setPatientSearch] = useState("");
  const [patients, setPatients] = useState<any[]>([]);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [patientPageIndex, setPatientPageIndex] = useState(0);
  const [patientTotalCount, setPatientTotalCount] = useState(0);
  const [selectedPatient, setSelectedPatient] = useState<{ id: string; name: string; surname: string; fatherName: string } | null>(null);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const backendTemplates = await apiService.sendRequest({
          endpoint: "/api/ReportTemplate/GetAllReportTemplates",
          method: "GET"
        });
        setTemplates(backendTemplates || []);
      } catch (error) {
        setTemplates([]);
      }
      setLoading(false);
    };
    fetchTemplates();
  }, []);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      setPatientsLoading(true);
      try {
        const res = await apiService.sendRequest({
          endpoint: "/api/HospitalLab/SearchPatientsForLab",
          method: "POST",
          body: { name: patientSearch, pageIndex: patientPageIndex, pageSize: 10 }
        });
        setPatients(res.users || []);
        setPatientTotalCount(res.totalCount || 0);
      } catch (error) {
        setPatients([]);
        setPatientTotalCount(0);
      }
      setPatientsLoading(false);
    };
    fetchPatients();
  }, [patientSearch, patientPageIndex]);

  // Patient seçimi parent-ə ötür
  useEffect(() => {
    if (selectedPatient && onSelectPatient) {
      onSelectPatient(selectedPatient);
    }
  }, [selectedPatient, onSelectPatient]);

  const handleCreateReport = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template first");
      return;
    }
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    if (!selectedPatient) {
      toast.error("Please select a patient");
      return;
    }
    console.log('Selected patient:', selectedPatient);
    const patientParams = `&patientId=${encodeURIComponent(selectedPatient.id || '')}` +
                         `&patientName=${encodeURIComponent(selectedPatient.name || '')}` +
                         `&patientSurname=${encodeURIComponent(selectedPatient.surname || '')}` +
                         `&patientFatherName=${encodeURIComponent(selectedPatient.fatherName || '')}`;
    navigate(`/report-creator?templateId=${selectedTemplateId}&templateName=${encodeURIComponent(reportName)}${patientParams}`);
    if (onSelectTemplate) {
      onSelectTemplate();
    }
    toast.success(`Created new report: ${reportName}`);
  };

  // Pagination helpers
  const totalPages = Math.ceil(patientTotalCount / 10);

  return (
    <div className="space-y-6 max-w-3xl w-full min-h-[500px]">
      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name</Label>
        <Input
          id="reportName"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="Enter report name"
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label>Search Patient</Label>
        <Input
          value={patientSearch}
          onChange={e => { setPatientSearch(e.target.value); setPatientPageIndex(0); }}
          placeholder="Pasiyent axtar..."
          className="w-full"
        />
        <div className="overflow-auto max-h-[350px] border rounded bg-white">
          {patientsLoading ? (
            <div className="text-center py-4">Loading patients...</div>
          ) : patients.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No patients found</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2 text-left">Ad</th>
                  <th className="p-2 text-left">Soyad</th>
                  <th className="p-2 text-left">Ata adı</th>
                  <th className="p-2 text-left">Doğum tarixi</th>
                  <th className="p-2 text-left">Telefon</th>
                  <th className="p-2 text-left">FIN</th>
                </tr>
              </thead>
              <tbody>
                {patients.map(p => (
                  <tr
                    key={p.id}
                    className={`cursor-pointer hover:bg-blue-50 ${selectedPatient?.id === p.id ? "bg-blue-100 font-bold" : ""}`}
                    onClick={() => setSelectedPatient({ id: p.id, name: p.name, surname: p.surname, fatherName: p.fatherName })}
                  >
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.surname}</td>
                    <td className="p-2">{p.fatherName}</td>
                    <td className="p-2">{p.birthDay}</td>
                    <td className="p-2">{p.phoneNumber}</td>
                    <td className="p-2">{p.finCode}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex gap-2 justify-center mt-2">
            <Button size="sm" variant="outline" disabled={patientPageIndex === 0} onClick={() => setPatientPageIndex(i => i - 1)}>Previous</Button>
            <span className="px-2 text-base">{patientPageIndex + 1} / {totalPages}</span>
            <Button size="sm" variant="outline" disabled={patientPageIndex === totalPages - 1} onClick={() => setPatientPageIndex(i => i + 1)}>Next</Button>
          </div>
        )}
        {selectedPatient && (
          <div className="mt-2 text-green-700 text-sm">Seçilmiş: {selectedPatient.name} {selectedPatient.surname}</div>
        )}
      </div>
      <div className="space-y-3">
        <Label>Select a Template</Label>
        {loading ? (
          <div className="text-center py-4">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary ${
                  String(selectedTemplateId) === String(template.id)
                    ? "border-primary-600 ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
                onClick={() => setSelectedTemplateId(String(template.id))}
                style={{ minWidth: 0 }}
              >
                <p className="font-medium text-sm truncate">{template.name}</p>
                <p className="text-xs text-gray-500">Template</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleCreateReport} disabled={!selectedTemplateId || !selectedPatient} className="bg-blue-600 hover:bg-blue-700">
          Create Report
        </Button>
      </div>
    </div>
  );
};
