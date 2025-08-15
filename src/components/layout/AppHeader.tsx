import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TemplateGallery } from "../editor/TemplateGallery";
import { ArrowDown, Redo, Square, Undo, User, LogOut, Mail, Phone, Settings as SettingsIcon } from "lucide-react";
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
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile";

export const AppHeader = () => {
  const { undo, redo, canvasState, getActiveReport, setCurrentPage } = useEditor();
  const [newTemplateDialogOpen, setNewTemplateDialogOpen] = useState(false);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  const activeReport = getActiveReport();
  const { user } = useAppSelector((state) => state.auth);

  // Logout funksiyası
  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
    toast.success(t('auth.logoutSuccess'));
  };

  // User initials and name helpers
  const getUserInitials = () => {
    if (!user) return "U";
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };
  const getUserName = () => {
    if (!user) return t('header.user');
    const name = user.name || "";
    const surname = user.surname || "";
    return `${name} ${surname}`.trim() || t('header.user');
  };

  // Generate and download PDF with all pages
  const handleExportPdf = async () => {
    if (!activeReport) {
      toast.error(t('messages.noActiveReport'));
      return;
    }
    
    try {
      toast.info(t('messages.preparingPDF'));
      
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
          toast.error(t('messages.couldNotFindCanvas'));
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
      toast.success(t('messages.pdfExported'));
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error(t('messages.pdfExportFailed'));
      
      // Make sure we restore the current page even if there's an error
      setCurrentPage(canvasState.currentPageIndex);
    }
  };
  
  // Generate and download Excel with data from all pages
  const handleExportExcel = () => {
    if (!activeReport) {
      toast.error(t('messages.noActiveReport'));
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
        toast.error(t('messages.noTableData'));
        return;
      }
      
      // Write and save
      XLSX.writeFile(wb, `${activeReport.name.replace(/\s+/g, '_')}.xlsx`);
      toast.success(t('messages.excelExported'));
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error(t('messages.excelExportFailed'));
    }
  };

  return (
    <header className="flex items-center justify-between px-3 md:px-6 h-16 border-b bg-white shadow-sm">
      {/* Company Logo - Responsive */}
      <div className="flex items-center space-x-2 md:space-x-4">
        <h1 className="text-lg md:text-2xl font-bold text-medical-blue">{t('company.name')}</h1>
      </div>
      
      {/* Desktop Controls - Hidden on Mobile */}
      <div className="hidden lg:flex items-center space-x-2">
        {/* Undo/Redo Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={canvasState.history.past.length === 0}
          title={t('header.undo')}
          className="h-8 px-3"
        >
          <Undo className="h-4 w-4 mr-1" /> {t('header.undo')}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={canvasState.history.future.length === 0}
          title={t('header.redo')}
          className="h-8 px-3"
        >
          <Redo className="h-4 w-4 mr-1" /> {t('header.redo')}
        </Button>
        
        <div className="mx-2 h-6 border-l border-gray-200" />
        
        {/* New Template Dialog - Hidden on Mobile */}
        <Dialog open={newTemplateDialogOpen} onOpenChange={setNewTemplateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" title={t('header.newReport')} className="h-8 px-3">
              <Square className="h-4 w-4 mr-1" /> {t('header.new')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px] mx-4">
            <DialogHeader>
              <DialogTitle>{t('header.chooseTemplate')}</DialogTitle>
            </DialogHeader>
            <TemplateGallery onSelectTemplate={() => setNewTemplateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
        
        <div className="mx-2 h-6 border-l border-gray-200" />
        
        {/* Export Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={!activeReport}
          title={t('header.exportPDF')}
          className="h-8 px-3"
        >
          <ArrowDown className="h-4 w-4 mr-1" /> {t('header.pdf')}
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportExcel}
          disabled={!activeReport}
          title={t('header.exportExcel')}
          className="h-8 px-3"
        >
          <ArrowDown className="h-4 w-4 mr-1" /> {t('header.excel')}
        </Button>

        <div className="mx-2 h-6 border-l border-gray-200" />
        
        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>

      {/* Right Side - Language Switcher (Mobile) + User Profile */}
      <div className="flex items-center space-x-2">
        {/* Language Switcher - Visible on Mobile */}
        <div className="lg:hidden">
          <LanguageSwitcher />
        </div>

        {/* User Profile Dropdown - Always Visible */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 md:h-10 w-auto px-2 md:px-3 rounded-full hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 transition-all">
              <div className="flex items-center space-x-2 md:space-x-3">
                <Avatar className="h-8 w-8 md:h-10 md:w-10 ring-2 ring-blue-400/30">
                  <AvatarImage src={user?.avatarUrl} alt={getUserName()} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm md:text-base font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block text-left">
                  <p className="text-sm md:text-base font-semibold text-gray-900">{getUserName()}</p>
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
                  {user?.role || t('header.user')}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1">
                  <Mail className="h-4 w-4 text-blue-400" />
                  <span className="truncate max-w-[200px]">{user?.email}</span>
                </div>
                {user?.phoneNumber && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mt-1">
                    <Phone className="h-4 w-4 text-green-500" />
                    <span className="truncate max-w-[200px]">{user.phoneNumber}</span>
                  </div>
                )}
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/settings')} className="text-gray-700 font-semibold py-3 flex items-center justify-center hover:bg-blue-50 transition-all">
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>{t('navigation.settings')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
