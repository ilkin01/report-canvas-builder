
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TemplateGallery } from "../editor/TemplateGallery";
import { ArrowDown, Layers, Redo, Square, Undo } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { useState } from "react";
import { toast } from "sonner";

export const AppHeader = () => {
  const { undo, redo, saveCanvas, canvasState, getActiveReport } = useEditor();
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  
  const activeReport = getActiveReport();

  // Generate and download PDF with all pages
  const handleExportPdf = async () => {
    if (!activeReport) {
      toast.error("No active report to export");
      return;
    }
    
    try {
      toast.info("Preparing PDF export...");
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Loop through all pages
      for (let i = 0; i < canvasState.pages.length; i++) {
        // If not the first page, add a new page to the PDF
        if (i > 0) {
          pdf.addPage();
        }
        
        // Get the canvas container - we'll clone it for each page to avoid state changes
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvasContainer) {
          toast.error("Could not find report canvas");
          return;
        }
        
        // Store current page index
        const currentPageIndex = canvasState.currentPageIndex;
        
        // Temporarily switch to the page we want to export
        // This is just to make sure the page's elements are rendered in the DOM
        const { setCurrentPage } = useEditor();
        setCurrentPage(i);
        
        // Give time for the React to re-render the page
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Capture the canvas for the current page
        const canvas = await html2canvas(canvasContainer as HTMLElement, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
        });
        
        // Add the image to the PDF
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
        
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        
        // Restore the original page index after capturing
        if (i !== currentPageIndex) {
          setCurrentPage(currentPageIndex);
        }
      }
      
      // Save PDF
      pdf.save(`${activeReport.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF exported successfully with all pages");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };
  
  // Generate and download Excel with data from all pages
  const handleExportExcel = () => {
    if (!activeReport) {
      toast.error("No active report to export");
      return;
    }
    
    try {
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Process all pages
      let hasTableData = false;
      
      for (let i = 0; i < canvasState.pages.length; i++) {
        const currentPage = canvasState.pages[i];
        // Process elements to extract tabular data
        const tables = currentPage.elements.filter(el => el.type === "table");
        
        tables.forEach((table, tableIndex) => {
          if (table.content && table.content.headers && table.content.rows) {
            hasTableData = true;
            // Create worksheet from data
            const wsData = [
              table.content.headers,
              ...table.content.rows
            ];
            
            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(
              wb, 
              ws, 
              `Page_${i+1}_Table_${tableIndex+1}`
            );
          }
        });
      }
      
      if (!hasTableData) {
        toast.error("No table data to export");
        return;
      }
      
      // Write and save
      XLSX.writeFile(wb, `${activeReport.name.replace(/\s+/g, '_')}.xlsx`);
      toast.success("Excel file exported successfully with data from all pages");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel. Please try again.");
    }
  };

  return (
    <header className="flex items-center justify-between px-6 h-16 border-b bg-white shadow-sm">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-medical-blue">Inframed Life</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={canvasState.history.past.length === 0}
          title="Undo"
        >
          <Undo className="h-4 w-4 mr-1" /> Undo
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={canvasState.history.future.length === 0}
          title="Redo"
        >
          <Redo className="h-4 w-4 mr-1" /> Redo
        </Button>
        
        <div className="mx-2 h-6 border-l border-gray-200" />
        
        <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" title="New Report">
              <Square className="h-4 w-4 mr-1" /> New
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Choose a Template</DialogTitle>
            </DialogHeader>
            <TemplateGallery onSelectTemplate={() => setNewTemplateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <Button
          variant="outline"
          size="sm"
          onClick={saveCanvas}
          title="Save Report"
        >
          <Layers className="h-4 w-4 mr-1" /> Save
        </Button>
        
        <div className="mx-2 h-6 border-l border-gray-200" />
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={!activeReport}
          title="Export as PDF"
        >
          <ArrowDown className="h-4 w-4 mr-1" /> PDF
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={!activeReport}
          title="Export as Excel"
        >
          <ArrowDown className="h-4 w-4 mr-1" /> Excel
        </Button>
      </div>
    </header>
  );
};
