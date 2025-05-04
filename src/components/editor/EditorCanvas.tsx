
import React, { useEffect, useRef, useState } from "react";
import { useEditor } from "@/context/EditorContext";
import { ElementData } from "@/types/editor";
import { CanvasElement } from "./elements/CanvasElement";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X } from "lucide-react";

export const EditorCanvas = () => {
  const { 
    canvasState, 
    clearSelection, 
    openReports, 
    activeReportId, 
    setActiveReport, 
    closeReport 
  } = useEditor();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1100 }); // A4 size at 96 DPI
  
  const { pages, currentPageIndex } = canvasState;
  const currentPage = pages[currentPageIndex];
  
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (canvasRef.current && !canvasRef.current.contains(e.target as Node)) {
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
    closeReport(reportId);
  };

  return (
    <div className="flex-1 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
      {openReports.length > 0 ? (
        <Tabs 
          value={activeReportId || openReports[0].id} 
          onValueChange={setActiveReport}
          className="flex flex-col h-full"
        >
          <div className="border-b bg-gray-50">
            <TabsList className="bg-transparent h-12 w-full flex overflow-x-auto">
              {openReports.map((report) => (
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
          
          {openReports.map((report) => (
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
