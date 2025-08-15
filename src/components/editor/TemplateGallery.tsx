
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
    <div className="space-y-6 max-w-3xl w-full min-h-[500px] mx-auto">
      <div className="space-y-3 text-center">
        <Label htmlFor="reportName" className="text-base font-semibold text-gray-800">{t('templates.reportName')}</Label>
        <Input
          id="reportName"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder={t('templates.enterReportName')}
          className="w-full max-w-md mx-auto h-10 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg transition-all duration-200"
        />
      </div>
      
      <div className="space-y-3 text-center">
        <Label className="text-base font-semibold text-gray-800">{t('templates.searchPatient')}</Label>
        <div className="relative max-w-md mx-auto">
          <Input
            value={patientSearch}
            onChange={e => { setPatientSearch(e.target.value); setPatientPageIndex(0); }}
            placeholder={t('templates.searchPatientPlaceholder')}
            className="w-full h-10 pl-10 text-sm rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg width="18" height="18" fill="none" stroke="currentColor"><circle cx="8" cy="8" r="7" strokeWidth="2"/><path d="M17 17l-3.5-3.5" strokeWidth="2" strokeLinecap="round"/></svg>
          </span>
        </div>
        <div className="text-xs text-gray-500 italic px-3 pt-1 pb-1">{t('templates.patientInfo')}</div>
        
        {selectedPatient && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="rounded-full bg-blue-100 text-blue-700 px-3 py-1 text-sm font-semibold shadow-sm border border-blue-200">
              {t('templates.selectedPatient')}: {selectedPatient.name} {selectedPatient.surname}
            </div>
            <Button size="sm" variant="ghost" onClick={() => setSelectedPatient(null)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              {t('templates.change')}
            </Button>
          </div>
        )}
        
        <div className="overflow-y-auto max-h-[300px] max-w-2xl mx-auto bg-white rounded-lg border border-gray-200 shadow-sm">
          {patientsLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="flex items-center gap-2">
                <span className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
                <span className="text-gray-600 text-sm">{t('common.loading')}</span>
              </div>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-base">{t('templates.noPatientFound')}</div>
          ) : (
            <div className="min-w-full">
              <div className="flex font-semibold border-b bg-gray-50 text-xs py-3">
                <div className="flex-1 px-3 py-2">{t('templates.nameAndSurname')}</div>
                <div className="w-32 px-3 py-2">{t('templates.fatherName')}</div>
                <div className="w-32 px-3 py-2">{t('templates.birthDate')}</div>
                <div className="w-32 px-3 py-2">{t('templates.finCode')}</div>
              </div>
              {patients.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center border-b cursor-pointer text-xs py-3 transition-all duration-200 ${
                    selectedPatient?.id === p.id ? "bg-blue-50 border-l-4 border-l-blue-500" : "hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedPatient({ id: p.id, name: p.name, surname: p.surname, fatherName: p.fatherName })}
                >
                  <div className="flex-1 px-3 font-medium text-blue-800 truncate">{p.name} {p.surname}</div>
                  <div className="w-32 px-3 text-gray-600 truncate">{p.fatherName}</div>
                  <div className="w-32 px-3">{p.birthDay}</div>
                  <div className="w-32 px-3 font-mono">{p.finCode}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Enhanced Pagination */}
        {patients.length > 0 && totalPages > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Button
              size="sm"
              variant="outline"
              aria-label={t('templates.previousPage')}
              disabled={patientPageIndex === 0}
              onClick={() => setPatientPageIndex(i => i - 1)}
              className="h-8 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 text-xs"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('common.prev')}
            </Button>
            
            {getPageNumbers(patientPageIndex + 1, totalPages).map((page, idx) =>
              page === '...'
                ? <span key={idx} className="px-2 py-1 text-gray-400 select-none text-sm">...</span>
                : (
                  <Button
                    key={page}
                    size="sm"
                    aria-label={`Səhifə ${page}`}
                    variant={patientPageIndex + 1 === page ? "default" : "outline"}
                    className={
                      "h-8 px-3 rounded-md font-semibold text-sm transition-all duration-200 " +
                      (patientPageIndex + 1 === page
                        ? "bg-blue-600 text-white shadow-md scale-105"
                        : "hover:bg-blue-50 hover:border-blue-300")
                    }
                    onClick={() => setPatientPageIndex(Number(page) - 1)}
                  >
                    {page}
                  </Button>
                )
            )}
            
            <Button
              size="sm"
              variant="outline"
              aria-label={t('templates.nextPage')}
              disabled={patientPageIndex === totalPages - 1}
              onClick={() => setPatientPageIndex(i => i + 1)}
              className="h-8 px-3 rounded-md transition-all duration-200 hover:bg-blue-50 hover:border-blue-300 text-xs"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
      
      <div className="space-y-3 text-center">
        <Label className="text-base font-semibold text-gray-800">{t('templates.selectTemplate')}</Label>
        {loading ? (
          <div className="text-center py-6">
            <div className="flex items-center justify-center gap-2">
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></span>
              <span className="text-gray-600 text-sm">{t('templates.loadingTemplates')}</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-300 hover:border-blue-400 hover:shadow-md text-center min-h-[100px] flex flex-col justify-center ${
                    String(selectedTemplateId) === String(template.id)
                      ? "border-blue-500 ring-2 ring-blue-200 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedTemplateId(String(template.id))}
                  style={{ minWidth: 0 }}
                >
                  <div className="mb-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-semibold text-sm text-gray-800 mb-1">{template.name}</p>
                  <p className="text-xs text-gray-500">{t('templates.template')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-center pt-2">
        <Button 
          onClick={handleCreateReport} 
          disabled={!selectedTemplateId || !selectedPatient} 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 h-10 text-base font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('templates.createReport')}
        </Button>
      </div>
    </div>
  );
};
