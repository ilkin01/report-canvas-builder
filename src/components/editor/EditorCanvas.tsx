
import React, { useEffect, useRef } from "react";
import { useEditor } from "@/context/EditorContext";
import { CanvasElement } from "./elements/CanvasElement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { 
  setActiveReport as setReduxActiveReport, 
  closeReport as reduxCloseReport,
  closeAllReports as reduxCloseAllReports,
} from "@/redux/slices/reportsSlice";
import { toast } from "sonner";
import { PageControls } from "./PageControls";

interface EditorCanvasProps {
  onClose?: () => void;
}

const DEFAULT_CANVAS_WIDTH = 800;
const DEFAULT_CANVAS_HEIGHT = 1100;

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ onClose }) => {
  const { 
    canvasState, 
    clearSelection,
    setActiveReport: editorSetActiveReport,
    getActiveReport
  } = useEditor();
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId, openedReportIds } = useAppSelector(state => state.reports);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const currentPage = activeReportId ? canvasState.pages[canvasState.currentPageIndex] : null;

  // Redux'taki aktif raporu EditorContext ile senkronize et
  useEffect(() => {
    if (activeReportId && reports.length > 0) {
      const reportFromRedux = reports.find(r => r.id === activeReportId);
      if (reportFromRedux) {
        const currentEditorReport = getActiveReport();
        // Sync if there's no report in context, or if the report ID or pages differ
        if (!currentEditorReport || currentEditorReport.id !== reportFromRedux.id || 
            JSON.stringify(currentEditorReport.pages) !== JSON.stringify(reportFromRedux.pages)) {
          console.log("EditorCanvas: Syncing Redux active report to EditorContext:", reportFromRedux.name);
          editorSetActiveReport(reportFromRedux);
        }
      } else {
        // Active report ID exists in Redux store, but the report itself isn't found in the `reports` list.
        // This might happen if `reports` list is not up-to-date. Clear context if it has a different report.
        if (getActiveReport()) {
           console.log("EditorCanvas: Active report ID from Redux not found in reports list. Clearing context.");
           editorSetActiveReport(null);
        }
      }
    } else if (!activeReportId) {
      // No active report ID in Redux. Clear context if it has an active report.
      if (getActiveReport()) {
        console.log("EditorCanvas: No active report ID in Redux. Clearing context.");
        editorSetActiveReport(null);
      }
    }
  }, [activeReportId, reports, editorSetActiveReport, getActiveReport]);
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (canvasRef.current && 
          e.target instanceof Node && 
          canvasRef.current.contains(e.target) && 
          e.target === canvasRef.current) {
        clearSelection();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [clearSelection]);

  // Sekme kapatma işlemi
  const handleCloseTab = (e: React.MouseEvent, reportIdToClose: string) => {
    e.stopPropagation();
    dispatch(reduxCloseReport(reportIdToClose));
    toast.success("Report closed");
    // Eğer kapatılan rapor son raporsa ve onClose varsa, useEffect tetikleyecek
  };

  // Liste görünümüne dönme
  const handleBackToList = () => {
    dispatch(reduxCloseAllReports()); 
    // onClose çağrısı aşağıdaki useEffect tarafından yönetilecek
  };

  // Aktif sekmeyi değiştirme
  const handleTabChange = (newActiveReportId: string) => {
    dispatch(setReduxActiveReport(newActiveReportId));
  };

  // Filtrelenmiş rapor listesi (sadece açık olanlar)
  const reportsForTabs = React.useMemo(() => {
    return reports.filter(report => openedReportIds.includes(report.id));
  }, [reports, openedReportIds]);

  // Eğer hiç açık rapor kalmazsa ve onClose varsa, liste görünümüne dön
  useEffect(() => {
    if (onClose && activeReportId === null && openedReportIds && openedReportIds.length === 0) {
      console.log("EditorCanvas: No open reports left. Calling onClose to go back to list.");
      onClose();
    }
  }, [activeReportId, openedReportIds, onClose]);

  const currentCanvasWidth = currentPage?.width || DEFAULT_CANVAS_WIDTH;
  const currentCanvasHeight = currentPage?.height || DEFAULT_CANVAS_HEIGHT;

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {reportsForTabs.length > 0 && activeReportId ? (
        <Tabs 
          value={activeReportId} 
          onValueChange={handleTabChange} 
          className="flex flex-col h-full"
        >
          <div className="border-b bg-gray-50 flex items-center">
            {onClose && (
              <Button 
                variant="ghost" 
                onClick={handleBackToList} 
                className="ml-2"
                title="Back to reports list"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            )}
            <TabsList className="bg-transparent h-12 flex-grow flex-shrink min-w-0 overflow-x-auto px-2">
              {reportsForTabs.map((report) => (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className="flex items-center gap-2 py-3 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex-shrink-0"
                  title={report.name}
                >
                  <span className="truncate max-w-[150px]">{report.name}</span>
                  <button
                    onClick={(e) => handleCloseTab(e, report.id)}
                    className="rounded-full hover:bg-gray-200 p-1"
                    title={`Close ${report.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {reportsForTabs.map((reportTabInfo) => (
            <TabsContent 
              key={reportTabInfo.id} 
              value={reportTabInfo.id} 
              className="flex-1 overflow-auto p-6 bg-gray-100 m-0 flex flex-col"
            >
              {/* Sayfa kontrollerini ekle */}
              {reportTabInfo.id === activeReportId && (
                <PageControls />
              )}

              {/* Sadece aktif sekmenin içeriğini render et */}
              {reportTabInfo.id === activeReportId && currentPage && (
                <div
                  ref={canvasRef}
                  className="canvas-container relative mx-auto shadow-lg mt-4"
                  style={{
                    width: `${currentCanvasWidth}px`,
                    height: `${currentCanvasHeight}px`,
                    backgroundColor: "white",
                  }}
                  onClick={(e) => {
                    if (e.currentTarget === e.target) {
                      clearSelection();
                    }
                  }}
                >
                  {currentPage.elements && currentPage.elements.map((element) => (
                    <CanvasElement key={element.id} element={element} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
            <h2 className="text-2xl font-bold text-medical-blue mb-2">Welcome to Inframed Life</h2>
            <p className="text-gray-600 mb-6">
              No report is currently open. Start by creating a new report or opening an existing one from the list.
            </p>
            {onClose && (
              <Button 
                onClick={handleBackToList} 
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
