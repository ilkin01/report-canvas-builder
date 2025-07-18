import React, { useEffect, useRef, useState } from "react";
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

// A4 dimensions (in pixels at 72 DPI)
const DEFAULT_CANVAS_WIDTH = 595;  // A4 width
const DEFAULT_CANVAS_HEIGHT = 842; // A4 height

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ onClose }) => {
  const { 
    canvasState, 
    clearSelection,
    setActiveReport: editorSetActiveReport,
    getActiveReport,
    saveCanvas
  } = useEditor();
  const [isSaving, setIsSaving] = useState(false);
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId, openedReportIds } = useAppSelector(state => state.reports);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  
  const currentPage = activeReportId ? canvasState.pages[canvasState.currentPageIndex] : null;

  // Sync active report from Redux to EditorContext
  useEffect(() => {
    const currentEditorReport = getActiveReport(); // Get current report from EditorContext

    if (activeReportId && reports.length > 0) { // Redux has an active report and reports list
      const reportFromRedux = reports.find(r => r.id === activeReportId);

      if (reportFromRedux) {
        // Case 1: Context has no active report, or its active report ID differs from Redux's.
        // This means we need to load the report specified by Redux into the context.
        if (!currentEditorReport || currentEditorReport.id !== reportFromRedux.id) {
          console.log(`EditorCanvas: Syncing. Reason: Context empty or different ID. Redux active: ${reportFromRedux.name}, Context active: ${currentEditorReport ? currentEditorReport.name : 'None'}.`);
          editorSetActiveReport(reportFromRedux);
        }
        // Case 2: Context and Redux agree on the active report ID.
        // In this scenario, EditorContext is considered the source of truth for its page data.
        // Changes flow from EditorContext -> Redux.
        // We don't want Redux (which might be momentarily stale) to overwrite fresh context changes.
        // So, no action needed here if IDs match. EditorContext handles its own state.

      } else {
        // Redux's activeReportId points to a report not in Redux's reports list.
        // This is an inconsistent state. If context still thinks it has a report, clear it.
        if (currentEditorReport) {
          console.log("EditorCanvas: Syncing. Reason: Redux active ID not in Redux reports list. Clearing context.");
          editorSetActiveReport(null);
        }
      }
    } else if (!activeReportId) { // Redux has no active report
      // If context still has an active report, clear it to match Redux.
      if (currentEditorReport) {
        console.log("EditorCanvas: Syncing. Reason: Redux has no active report. Clearing context.");
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

  // Close tab handler
  const handleCloseTab = (e: React.MouseEvent, reportIdToClose: string) => {
    e.stopPropagation();
    if (isSaving) {
      toast.warning("Please wait, saving in progress...");
      return;
    }
    dispatch(reduxCloseReport(reportIdToClose));
    toast.success("Report closed");
  };

  // Back to list handler
  const handleBackToList = () => {
    if (isSaving) {
      toast.warning("Please wait, saving in progress...");
      return;
    }
    dispatch(reduxCloseAllReports()); 
  };

  // Change active tab handler
  const handleTabChange = (newActiveReportId: string) => {
    if (isSaving) {
      toast.warning("Please wait, saving in progress...");
      return;
    }
    dispatch(setReduxActiveReport(newActiveReportId));
  };

  // Filtered report list (only open ones)
  const reportsForTabs = React.useMemo(() => {
    return reports.filter(report => openedReportIds.includes(report.id));
  }, [reports, openedReportIds]);

  // If no reports are left open and onClose exists, go back to list view
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
        <>
          <div className="flex items-center justify-end p-4 bg-white border-b">
            <Button variant="default" onClick={async () => {
              setIsSaving(true);
              try {
                await saveCanvas();
              } finally {
                setIsSaving(false);
              }
            }} disabled={isSaving}>
              {isSaving ? <span className="animate-spin mr-2">⏳</span> : null}
              Update Report
            </Button>
          </div>
          <Tabs 
            value={activeReportId} 
            onValueChange={handleTabChange} 
            className="flex flex-col h-full"
            // Disable tab switching while saving
            style={isSaving ? { pointerEvents: 'none', opacity: 0.7 } : {}}
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
                {/* Page controls */}
                {reportTabInfo.id === activeReportId && (
                  <PageControls />
                )}

                {/* Only render active tab content */}
                {reportTabInfo.id === activeReportId && currentPage && (
                  <div className="flex justify-center mt-4 flex-1">
                    <div
                      ref={canvasRef}
                      className="canvas-container relative shadow-lg bg-white"
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
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
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
