
import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { CanvasElement } from "./elements/CanvasElement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setActiveReport, deleteExistingReport } from "@/redux/slices/reportsSlice";

interface EditorCanvasProps {
  onClose?: () => void;
}

export const EditorCanvas: React.FC<EditorCanvasProps> = ({ onClose }) => {
  const { 
    canvasState, 
    clearSelection
  } = useEditor();
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId } = useAppSelector(state => state.reports);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize] = useState({ width: 800, height: 1100 }); // A4 size at 96 DPI
  
  const { pages, currentPageIndex } = canvasState;
  const currentPage = pages[currentPageIndex];
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Only clear selection if clicking directly on the canvas container, not on elements or properties panel
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
  
  const handleCloseTab = (e: React.MouseEvent, reportId: string) => {
    e.stopPropagation();
    dispatch(deleteExistingReport(reportId));
  };

  const handleBackToList = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {reports.length > 0 ? (
        <Tabs 
          value={activeReportId || reports[0].id} 
          onValueChange={(value) => dispatch(setActiveReport(value))}
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
          
          {reports.map((report) => (
            <TabsContent 
              key={report.id} 
              value={report.id} 
              className="flex-1 overflow-auto p-6 bg-gray-100 m-0"
            >
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
                {currentPage && currentPage.elements.map((element) => (
                  <CanvasElement key={element.id} element={element} />
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center p-8 bg-white rounded-lg shadow-sm max-w-md">
            <h2 className="text-2xl font-bold text-medical-blue mb-2">Welcome to Inframed Life</h2>
            <p className="text-gray-600 mb-6">
              Start by creating a new report from one of our templates or from scratch.
            </p>
            <div className="flex justify-center">
              <img 
                src="/placeholder.svg" 
                alt="Inframed Life Logo" 
                className="w-32 h-32 opacity-70"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
