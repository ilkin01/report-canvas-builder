import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TemplateGallery } from "../editor/TemplateGallery";
import { ArrowDown, Redo, Square, Undo, User, LogOut, Mail, Phone } from "lucide-react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { useState } from "react";
import { toast } from "sonner";
import { useAppSelector, useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LanguageSwitcher } from "./LanguageSwitcher";

export const AppHeader = () => {
  const { undo, redo, canvasState, getActiveReport, setCurrentPage } = useEditor();
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const activeReport = getActiveReport();
  const { user } = useAppSelector((state) => state.auth);

  // Logout funksiyası
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success("Uğurla çıxış etdiniz");
  };

  // User initials and name helpers
  const getUserInitials = () => {
    if (!user) return "U";
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };
  const getUserName = () => {
    if (!user) return "İstifadəçi";
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name} ${surname}`.trim() || "İstifadəçi";
  };

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
      
      // Store current page index to restore it later
      const currentPageIndex = canvasState.currentPageIndex;
      
      // Loop through all pages
      for (let i = 0; i < canvasState.pages.length; i++) {
        // If not the first page, add a new page to the PDF
        if (i > 0) {
          pdf.addPage();
        }
        
        // Set current page
        setCurrentPage(i);
        
        // Give React time to re-render the page before capturing
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get the canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (!canvasContainer) {
          toast.error("Could not find report canvas");
          continue; // Skip this page but try to continue with others
        }
        
        try {
          // Capture the canvas with optimized settings
          // Reduce scale from 2 to 1.5 for better file size
          const canvas = await html2canvas(canvasContainer as HTMLElement, {
            scale: 1.5, // Reduced scale for better file size
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            // Add image quality optimization
            logging: false,
            imageTimeout: 15000,
          });
          
          // Add the image to the PDF with compression
          // Use image compression by specifying quality
          const imgData = canvas.toDataURL('image/jpeg', 0.85); // Use JPEG with 85% quality instead of PNG
          
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgWidth = canvas.width;
          const imgHeight = canvas.height;
          const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
          
          pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth * ratio, imgHeight * ratio, undefined, 'MEDIUM'); // Add compression level
        } catch (err) {
          console.error(`Error capturing page ${i+1}:`, err);
          toast.error(`Failed to capture page ${i+1}`);
        }
      }
      
      // Restore the original page index
      setCurrentPage(currentPageIndex);
      
      // Save PDF
      pdf.save(`${activeReport.name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF exported successfully with all pages");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF. Please try again.");
      
      // Make sure we restore the current page even if there's an error
      setCurrentPage(canvasState.currentPageIndex);
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

        <div className="mx-2 h-6 border-l border-gray-200" />
        <LanguageSwitcher />
        
        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-auto px-3 rounded-full hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10 ring-2 ring-blue-400/30">
                  <AvatarImage src={user?.avatarUrl} alt={getUserName()} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-base font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-base font-semibold text-gray-900">{getUserName()}</p>
                  <p className="text-xs text-blue-600 font-medium">{user?.role || "İstifadəçi"}</p>
                </div>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 p-0 rounded-xl shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50 to-purple-50" align="end" forceMount>
            <div className="p-4 flex flex-col items-center text-center">
              <Avatar className="h-16 w-16 ring-4 ring-blue-400/30 mb-2">
                <AvatarImage src={user?.avatarUrl} alt={getUserName()} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-2xl font-bold">
                  {getUserInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-1 space-y-1">
                <div className="flex items-center justify-center gap-2 text-lg font-bold text-gray-900">
                  <User className="h-5 w-5 text-blue-500" />
                  {getUserName()}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-medium">
                  {user?.role || "İstifadəçi"}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4 text-blue-400" />
                  {user?.email}
                </div>
                {user?.phoneNumber && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 text-green-500" />
                    {user.phoneNumber}
                  </div>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 font-semibold py-3 flex items-center justify-center hover:bg-red-50 transition-all">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Çıxış et</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
