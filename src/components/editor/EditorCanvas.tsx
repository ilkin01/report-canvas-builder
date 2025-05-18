import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { CanvasElement } from "./elements/CanvasElement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setActiveReport as setReduxActiveReport, deleteExistingReport, clearActiveReport as clearReduxActiveReport } from "@/redux/slices/reportsSlice";
import { toast } from "sonner";
import { ReportDocument } from "@/types/editor";

interface EditorCanvasProps {
  onClose?: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ onClose }) => {
  const { 
    canvasState, 
    clearSelection,
    setActiveReport: editorSetActiveReport
  } = useEditor();
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId } = useAppSelector(state => state.reports);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize] = useState({ width: 800, height: 1100 }); // A4 size at 96 DPI
  
  const currentPage = canvasState.pages[canvasState.currentPageIndex];

  // Sync Redux activeReportId with EditorContext by passing the full report data
  useEffect(() => {
    if (activeReportId && reports.length > 0) {
      const reportFromRedux = reports.find(r => r.id === activeReportId);
      if (reportFromRedux) {
        console.log("EditorCanvas: Syncing Redux active report to EditorContext:", reportFromRedux.name);
        editorSetActiveReport(reportFromRedux);
      } else {
        // ActiveReportId from Redux exists, but report not found in reports list (e.g., after delete)
        console.log("EditorCanvas: Active report ID from Redux not found in reports list. Clearing context.");
        editorSetActiveReport(null);
      }
    } else if (!activeReportId) {
      // No active report ID in Redux (e.g., all reports closed, or initial state)
      console.log("EditorCanvas: No active report ID in Redux. Clearing context.");
      editorSetActiveReport(null);
    }
  }, [activeReportId, reports, editorSetActiveReport]);
  
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
  
  const handleCloseTab = async (e: React.MouseEvent, reportIdToClose: string) => {
    e.stopPropagation();
    try {
      await dispatch(deleteExistingReport(reportIdToClose)).unwrap();
      
      if (reports.length <= 1) {
        // If this was the last report, go back to the list view
        if (onClose) {
          dispatch(clearReduxActiveReport());
          onClose();
        }
      }
      
      toast.success("Report closed");
    } catch (error) {
      toast.error("Failed to close report");
      console.error("Error closing report:", error);
    }
  };

  const handleBackToList = () => {
    dispatch(clearReduxActiveReport()); 
    if (onClose) {
      onClose();
    }
  };

  // When user clicks a tab, set the active report in Redux.
  const handleTabChange = (newActiveReportId: string) => {
    dispatch(setReduxActiveReport(newActiveReportId));
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {reports.length > 0 && activeReportId ? (
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
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            )}
            <TabsList className="bg-transparent h-12 w-full flex overflow-x-auto">
              {reports.map((report) => (
                <TabsTrigger
                  key={report.id}
                  value={report.id}
                  className="flex items-center gap-2 py-3 px-4 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  <span className="truncate max-w-[150px]">{report.name}</span>
                  <button
                    onClick={(e) => handleCloseTab(e, report.id)}
                    className="rounded-full hover:bg-gray-200 p-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {reports.map((reportTabInfo) => (
            <TabsContent 
              key={reportTabInfo.id} 
              value={reportTabInfo.id} 
              className="flex-1 overflow-auto p-6 bg-gray-100 m-0"
            >
              {reportTabInfo.id === activeReportId && currentPage && (
                <div
                  ref={canvasRef}
                  className="canvas-container relative mx-auto shadow-lg"
                  style={{
                    width: `${canvasSize.width}px`,
                    height: `${canvasSize.height}px`,
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
