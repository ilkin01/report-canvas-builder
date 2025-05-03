
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

  // Generate and download PDF
  const handleExportPdf = async () => {
    if (!activeReport) {
      toast.error("No active report to export");
      return;
    }
    
    try {
      toast.info("Preparing PDF export...");
      
      // Get the canvas element
      const canvasElement = document.querySelector('.canvas-container');
      if (!canvasElement) {
        toast.error("Could not find report canvas");
        return;
      }
      
      // Use html2canvas to capture the entire canvas with charts and tables
      const canvas = await html2canvas(canvasElement, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
      });
      
      // Create PDF with correct dimensions
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Calculate dimensions to fit the image properly in the PDF
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
      
      // Save PDF
      pdf.save(`${activeReport.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
    }
  };
  
  // Generate and download Excel
  const handleExportExcel = () => {
    if (!activeReport) {
      toast.error("No active report to export");
      return;
    }
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    
    // Process elements to extract tabular data
    const tables = activeReport.elements.filter(el => el.type === "table");
    
    if (tables.length === 0) {
      toast.error("No table data to export");
      return;
    }
    
    tables.forEach((table, index) => {
      if (table.content && table.content.headers && table.content.rows) {
        // Create worksheet from data
        const wsData = [
          table.content.headers,
          ...table.content.rows
        ];
        
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, `Table_${index + 1}`);
      }
    });
    
    // Write and save
    XLSX.writeFile(wb, `${activeReport.name.replace(/\s+/g, '_')}.xlsx`);
    toast.success("Excel file exported successfully");
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
