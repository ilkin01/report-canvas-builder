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
import { useEditor } from "@/context/EditorContext";
import { apiService } from "@/services/apiService";

const ReportUpdaterContent = () => {
  const [reportName, setReportName] = useState("");
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const { canvasState, setActiveReport, clearSelection, getActiveReport, deletedPages, deletedElements } = useEditor();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const reportId = searchParams.get('reportId');
    if (reportId) {
      setLoading(true);
      apiService
        .sendRequest({
          endpoint: `/api/Report/GetReportById/${reportId}`,
          method: "GET",
        })
        .then((data) => {
          setReportName(data.name || "");
          setEditingReportId(String(data.id));
          // Map backend data to editor format
          const mappedPages = (data.pages || []).map((page: any, idx: number) => ({
            id: String(page.id),
            backendId: page.id,
            name: `Page ${idx + 1}`,
            width: page.width || 595,
            height: page.height || 842,
            elements: (page.elements || []).map((element: any) => ({
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
            }))
          }));
          setActiveReport({
            id: String(data.id),
            templateId: String(data.templateId),
            patientId: data.patientId,
            patientName: data.patientName,
            name: data.name,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            pages: mappedPages
          });
        })
        .finally(() => { setLoading(false); setInitializing(false); });
    } else {
      setInitializing(false);
    }
  }, [setActiveReport, searchParams]);

  const handleSaveOrUpdateReport = async () => {
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    if (canvasState.pages.length === 0) {
      toast.error("Please add at least one page to the report");
      return;
    }
    try {
      if (editingReportId) {
        console.log("🔄 Starting report update process...");

        // 1. DELETE removed pages
        for (const pageId of deletedPages) {
          try {
            await apiService.sendRequest({
              endpoint: `/api/ReportPage/DeleteReportPage/${pageId}`,
              method: 'DELETE',
            });
            console.log(`🗑️ Deleted page ${pageId}`);
          } catch (err) {
            console.error(`❌ Failed to delete page ${pageId}:`, err);
          }
        }
        // 2. DELETE removed elements
        for (const elementId of deletedElements) {
          try {
            await apiService.sendRequest({
              endpoint: `/api/ReportElement/DeleteReportElement/${elementId}`,
              method: 'DELETE',
            });
            console.log(`🗑️ Deleted element ${elementId}`);
          } catch (err) {
            console.error(`❌ Failed to delete element ${elementId}:`, err);
          }
        }

        // 3. Update/Create pages and elements (as before)
        for (let pageIndex = 0; pageIndex < canvasState.pages.length; pageIndex++) {
          const page = canvasState.pages[pageIndex];
          console.log(`📄 Processing page ${pageIndex + 1}:`, page);
          if (page.backendId) {
            // Update existing page
            console.log(`🔄 Updating page with backendId: ${page.backendId}`);
            await apiService.sendRequest({
              endpoint: `/api/ReportPage/UpdateReportPage/${page.backendId}`,
              method: 'PUT',
              body: {
                width: page.width || 595,
                height: page.height || 842,
                orderIndex: pageIndex + 1,
                reportId: editingReportId
              }
            });
            console.log(`✅ Page ${page.backendId} updated successfully`);
          } else {
            // Create new page
            console.log(`🆕 Creating new page for index ${pageIndex + 1}`);
            const pageRes = await apiService.sendRequest({
              endpoint: '/api/ReportPage/CreateReportPage',
              method: 'POST',
              body: {
                width: page.width || 595,
                height: page.height || 842,
                orderIndex: pageIndex + 1,
                reportId: editingReportId
              }
            });
            const newPageId = pageRes?.id || pageRes?.reportPageId || pageRes?.data?.id;
            if (!newPageId) {
              throw new Error(`Page ${pageIndex + 1} yaradılmadı!`);
            }
            console.log(`✅ New page created with ID: ${newPageId}`);
            page.backendId = newPageId;
          }
          // Process elements for this page
          for (let elementIndex = 0; elementIndex < page.elements.length; elementIndex++) {
            const element = page.elements[elementIndex];
            console.log(`🔧 Processing element ${elementIndex + 1} on page ${pageIndex + 1}:`, element);
            let typeId = 0;
            if (element.type === 'text') typeId = 0;
            else if (element.type === 'chart') typeId = 1;
            else if (element.type === 'table') typeId = 2;
            if (element.backendId) {
              // Update existing element
              console.log(`🔄 Updating element with backendId: ${element.backendId}`);
              await apiService.sendRequest({
                endpoint: `/api/ReportElement/UpdateReportElement/${element.backendId}`,
                method: 'PUT',
                body: {
                  type: typeId,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content,
                  reportPageId: page.backendId
                }
              });
              console.log(`✅ Element ${element.backendId} updated successfully`);
            } else {
              // Create new element
              console.log(`🆕 Creating new element for page ${pageIndex + 1}`);
              const elementRes = await apiService.sendRequest({
                endpoint: '/api/ReportElement/CreateReportElement',
                method: 'POST',
                body: {
                  type: typeId,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content,
                  reportPageId: page.backendId
                }
              });
              const newElementId = elementRes?.id || elementRes?.reportElementId || elementRes?.data?.id;
              if (!newElementId) {
                throw new Error(`Element ${elementIndex + 1} yaradılmadı!`);
              }
              console.log(`✅ New element created with ID: ${newElementId}`);
              element.backendId = newElementId;
            }
          }
        }
        console.log("🎉 All pages and elements updated successfully!");
        toast.success('Bütün səhifələr və elementlər uğurla yeniləndi!');
        setTimeout(() => navigate('/'), 1000);
      }
    } catch (err: any) {
      console.error("❌ Error during report update:", err);
      toast.error('Yadda saxlanılarkən xəta baş verdi: ' + (err?.message || err));
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  if (initializing) return <div>Yüklənir...</div>;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      {editingReportId && (
        <div className="mb-2 p-2 bg-yellow-100 text-yellow-800 rounded text-center">
          Bu, mövcud hesabatın yenilənməsi (update) səhifəsidir.
        </div>
      )}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="reportName" className="font-bold">Report Name:</Label>
            <Input
              id="reportName"
              value={reportName}
              readOnly
              tabIndex={-1}
              style={{ pointerEvents: 'none', background: '#f9fafb' }}
              className="w-64"
            />
          </div>
          {/* Patient Info */}
          {(() => {
            const report = getActiveReport?.();
            if (report && report.patientName) {
              return (
                <div className="ml-4 px-4 py-2 rounded bg-gray-50 border flex flex-col text-sm text-gray-700 min-w-[180px] font-bold">
                  <span>
                    <b>{report.patientName}</b>
                  </span>
                </div>
              );
            }
            return null;
          })()}
        </div>
        <Button onClick={handleSaveOrUpdateReport} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Update Report
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

const ReportUpdater = () => {
  return (
    <EditorProvider>
      <ReportUpdaterContent />
    </EditorProvider>
  );
};

export default ReportUpdater; 