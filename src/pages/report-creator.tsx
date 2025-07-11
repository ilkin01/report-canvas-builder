import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PageControls } from "@/components/editor/PageControls";
import { CanvasElement } from "@/components/editor/elements/CanvasElement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveUserTemplate } from "@/lib/templates";
import { Template } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";
import { apiService } from "@/services/apiService";

const ReportCreatorContent = () => {
  const [reportName, setReportName] = useState("");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const { canvasState, setActiveReport, clearSelection, getActiveReport } = useEditor();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const reportId = searchParams.get('templateId');
    const reportNameParam = searchParams.get('templateName');
    const patientId = searchParams.get('patientId') || '';
    const patientName = searchParams.get('patientName') || '';
    const patientSurname = searchParams.get('patientSurname') || '';
    const patientFatherName = searchParams.get('patientFatherName') || '';
    
    if (reportId && reportNameParam) {
      setReportName(reportNameParam);
      setEditingReportId(reportId);
      
      const loadReportData = async () => {
        try {
          const reportData = await apiService.sendRequest({
            endpoint: `/api/ReportTemplate/GetReportTemplateById/${reportId}`,
            method: "GET",
          });
          // Create a mock report for editing
          const mockReport = {
            id: `report-${reportId}`,
            templateId: reportId,
            patientId,
            patientName,
            patientSurname,
            patientFatherName,
            name: reportNameParam,
            type: 'report-edit',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pages: reportData.pages ? reportData.pages.map((page: any) => ({
              id: String(page.id || `page-${page.order}`),
              backendId: page.id,
              name: `Page ${page.order}`,
              elements: page.elements ? page.elements
                .filter((element: any) => [0, 1, 2].includes(element.type))
                .map((element: any) => ({
                  id: String(element.id),
                  backendId: element.id,
                  type: (() => {
                    switch (element.type) {
                      case 0: return 'text';
                      case 1: return 'chart';
                      case 2: return 'table';
                      default: return 'text';
                    }
                  })(),
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content || { text: '' },
                  isSelected: false
                })) : [],
              width: 595,
              height: 842
            })) : [{
              id: 'page-1',
              name: 'Page 1',
              elements: [],
              width: 595,
              height: 842
            }]
          };
          setActiveReport(mockReport);
        } catch (error: any) {
          console.error("Failed to load report:", error);
          toast.error(error.message || "Failed to load report data");
          navigate("/");
        }
      };
      loadReportData();
    } else {
      // Default new report
      const defaultMockReport = {
        id: 'report-new',
        templateId: 'report',
        patientId,
        patientName,
        patientSurname,
        patientFatherName,
        name: 'New Report',
        type: 'report-edit',
        status: 'draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [{
          id: 'page-1',
          name: 'Page 1',
          elements: [],
          width: 595,
          height: 842
        }]
      };
      setActiveReport(defaultMockReport);
    }
  }, [setActiveReport, searchParams, navigate]);

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    if (canvasState.pages.length === 0) {
      toast.error("Please add at least one page to the report");
      return;
    }

    try {
      console.log("🔄 Starting report creation process...");
      
      // 1. Create Report
      const reportPayload = {
        name: reportName,
        patientId: searchParams.get('patientId') || getActiveReport()?.patientId || '',
        patientName: [getActiveReport()?.patientName, getActiveReport()?.patientSurname, getActiveReport()?.patientFatherName].filter(Boolean).join(' '),
        templateId: getActiveReport()?.templateId ? Number(getActiveReport()?.templateId) : undefined,
        type: 0, // always 0 for report
        status: 1 // always 1 for active
      };
      console.log("📝 Creating report with payload:", reportPayload);
      const reportRes = await apiService.sendRequest({
        endpoint: '/api/Report/CreateReport',
        method: 'POST',
        body: reportPayload
      });
      const newReportId = reportRes?.id || reportRes?.reportId || reportRes?.data?.id;
      if (!newReportId) throw new Error('Report yaradılmadı!');
      console.log(`✅ Report created with ID: ${newReportId}`);

      // 2. Create Report Pages
      const pageIdMap: Record<number, number> = {};
      for (let i = 0; i < canvasState.pages.length; i++) {
        const page = canvasState.pages[i];
        console.log(`📄 Creating page ${i + 1}:`, page);
        const pagePayload = {
          width: page.width || 595,
          height: page.height || 842,
          orderIndex: i + 1,
          reportId: newReportId
        };
        const pageRes = await apiService.sendRequest({
          endpoint: '/api/ReportPage/CreateReportPage',
          method: 'POST',
          body: pagePayload
        });
        const newPageId = pageRes?.id || pageRes?.reportPageId || pageRes?.data?.id;
        if (!newPageId) throw new Error('Report səhifəsi yaradılmadı!');
        pageIdMap[i] = newPageId;
        console.log(`✅ Page ${i + 1} created with ID: ${newPageId}`);

        // 3. Create Report Elements for this page
        for (let j = 0; j < page.elements.length; j++) {
          const element = page.elements[j];
          console.log(`🔧 Creating element ${j + 1} on page ${i + 1}:`, element);
          let typeId = 0;
          if (element.type === 'text') typeId = 0;
          else if (element.type === 'chart') typeId = 1;
          else if (element.type === 'table') typeId = 2;
          const elementPayload = {
            type: typeId,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content,
            reportPageId: newPageId
          };
          const elementRes = await apiService.sendRequest({
            endpoint: '/api/ReportElement/CreateReportElement',
            method: 'POST',
            body: elementPayload
          });
          const newElementId = elementRes?.id || elementRes?.reportElementId || elementRes?.data?.id;
          if (newElementId) {
            console.log(`✅ Element ${j + 1} created with ID: ${newElementId}`);
          }
        }
      }
      
      console.log("🎉 Report creation completed successfully!");
      toast.success('Report və bütün səhifə/elementlər uğurla yaradıldı!');
      setTimeout(() => navigate('/'), 1000);
    } catch (err: any) {
      console.error("❌ Error during report creation:", err);
      toast.error('Yadda saxlanılarkən xəta baş verdi: ' + (err?.message || err));
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="reportName">Report Name:</Label>
            <Input
              id="reportName"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Enter report name"
              className="w-64"
            />
          </div>
          {/* Patient Info */}
          {(() => {
            const report = getActiveReport && getActiveReport();
            if (report && (report.patientName || report.patientSurname || report.patientFatherName)) {
              return (
                <div className="ml-4 px-4 py-2 rounded bg-gray-50 border flex flex-col text-sm text-gray-700 min-w-[180px]">
                  <span>
                    <b>{report.patientName || ''}</b>{report.patientName ? ' ' : ''}
                    <b>{report.patientSurname || ''}</b>{report.patientSurname ? ' ' : ''}
                    <b>{report.patientFatherName || ''}</b>
                  </span>
                </div>
              );
            }
            return null;
          })()}
          {editingReportId && (
            <></>
          )}
        </div>
        <Button onClick={handleSaveReport} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Report
        </Button>
      </div>
      <div className="border-b bg-muted/40">
        <PageControls />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-6 bg-gray-100 flex justify-center">
            <div
              className="canvas-container relative shadow-lg bg-white"
              style={{
                width: `${canvasState.pages[canvasState.currentPageIndex]?.width || 595}px`,
                height: `${canvasState.pages[canvasState.currentPageIndex]?.height || 842}px`,
                backgroundColor: "white",
              }}
              onClick={(e) => {
                if (e.currentTarget === e.target) {
                  clearSelection();
                }
              }}
            >
              {canvasState.pages[canvasState.currentPageIndex]?.elements.map((element) => (
                <CanvasElement key={element.id} element={element} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ReportCreator = () => {
  return (
    <EditorProvider>
      <ReportCreatorContent />
    </EditorProvider>
  );
};

export default ReportCreator; 