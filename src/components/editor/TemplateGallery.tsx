
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/apiService";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

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
          body: { name: patientSearch, pageIndex: patientPageIndex, pageSize: 6 }
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
      toast.error(t('templates.selectTemplateFirst'));
      return;
    }
    if (!reportName.trim()) {
      toast.error(t('templates.enterReportNameFirst'));
      return;
    }
    if (!selectedPatient) {
      toast.error(t('templates.selectPatientFirst'));
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
    toast.success(`${t('templates.createReport')}: ${reportName}`);
  };

  // Pagination helpers
  const totalPages = Math.ceil(patientTotalCount / 6);

  // Helper for pagination with ellipsis
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

  return (
    <div className="space-y-6 max-w-3xl w-full min-h-[500px]">
      <div className="space-y-2">
        <Label htmlFor="reportName">{t('templates.reportName')}</Label>
        <Input
          id="reportName"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder={t('templates.enterReportName')}
          className="w-full"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('templates.searchPatient')}</Label>
        <div className="relative">
          <Input
            value={patientSearch}
            onChange={e => { setPatientSearch(e.target.value); setPatientPageIndex(0); }}
            placeholder={t('templates.searchPatientPlaceholder')}
            className="w-full pl-10 rounded-xl border-2 border-gray-200 focus:border-blue-400 transition"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="7" strokeWidth="2"/><path d="M17 17l-3.5-3.5" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
        <div className="text-xs text-gray-500 italic px-3 pt-2 pb-1">{t('templates.patientInfo')}</div>
        {selectedPatient && (
          <div className="flex items-center gap-2 mb-2">
            <div className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold shadow">
              {t('templates.selectedPatient')}: {selectedPatient.name} {selectedPatient.surname}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)}>{t('templates.change')}</Button>
          </div>
        )}
        <div className="overflow-y-auto max-h-[350px]">
          {patientsLoading ? (
            <div className="flex justify-center items-center py-8">
              <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-6 text-gray-400">{t('templates.noPatientFound')}</div>
          ) : (
            <div className="min-w-full">
              <div className="flex font-semibold border-b bg-gray-50 text-xs">
                <div className="flex-1 px-2 py-2">{t('templates.nameAndSurname')}</div>
                <div className="w-32 px-2 py-2">{t('templates.fatherName')}</div>
                <div className="w-32 px-2 py-2">{t('templates.birthDate')}</div>
                <div className="w-32 px-2 py-2">{t('templates.finCode')}</div>
              </div>
              {patients.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center border-b cursor-pointer text-xs transition ${
                    selectedPatient?.id === p.id ? "bg-blue-50 border-blue-400" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedPatient({ id: p.id, name: p.name, surname: p.surname, fatherName: p.fatherName })}
                >
                  <div className="flex-1 px-2 py-2 font-medium text-blue-800 truncate">{p.name} {p.surname}</div>
                  <div className="w-32 px-2 py-2 text-gray-500 truncate">{p.fatherName}</div>
                  <div className="w-32 px-2 py-2">{p.birthDay}</div>
                  <div className="w-32 px-2 py-2">{p.finCode}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Pagination */}
        {patients.length > 0 && totalPages > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Button
              size="icon"
              variant="outline"
              aria-label={t('templates.previousPage')}
              disabled={patientPageIndex === 0}
              onClick={() => setPatientPageIndex(i => i - 1)}
              className="rounded-full transition hover:bg-blue-50"
            >
              <ChevronLeft className="w-5 h-5" />
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
              aria-label={t('templates.nextPage')}
              disabled={patientPageIndex === totalPages - 1}
              onClick={() => setPatientPageIndex(i => i + 1)}
              className="rounded-full transition hover:bg-blue-50"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>
      <div className="space-y-3">
        <Label>{t('templates.selectTemplate')}</Label>
        {loading ? (
          <div className="text-center py-4">{t('templates.loadingTemplates')}</div>
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
                <p className="text-xs text-gray-500">{t('templates.template')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Button onClick={handleCreateReport} disabled={!selectedTemplateId || !selectedPatient} className="bg-blue-600 hover:bg-blue-700">
          {t('templates.createReport')}
        </Button>
      </div>
    </div>
  );
};
