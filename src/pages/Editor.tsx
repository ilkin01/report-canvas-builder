import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PageControls } from "@/components/editor/PageControls";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEditor } from "@/context/EditorContext";
import { apiService } from "@/services/apiService";

const EditorContent = () => {
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const templateName = searchParams.get('templateName');
  const [isLoading, setIsLoading] = useState(true);
  const { setActiveReport } = useEditor();
  const navigate = useNavigate();

  useEffect(() => {
    const loadTemplateData = async () => {
      if (!templateId) {
        toast.error("Template ID not found");
        navigate("/");
        return;
      }

      try {
        setIsLoading(true);
        
        // Load template data from backend
        const templateData = await apiService.sendRequest({
          endpoint: `/api/ReportTemplate/GetReportTemplateById/${templateId}`,
          method: "GET",
        });

        // Create a mock report for editing
        const mockReport = {
          id: `template-${templateId}`,
          templateId: templateId,
          patientId: 'template',
          patientName: templateName || 'Template Editing',
          name: templateName || 'Template',
          type: 'template-edit',
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: templateData.pages ? templateData.pages.map((page: any) => ({
            id: page.id || `page-${page.order}`,
            name: `Page ${page.order}`,
            elements: page.elements ? page.elements.map((element: any) => ({
              id: element.id,
              type: element.type === 0 ? 'text' : element.type === 1 ? 'chart' : element.type === 2 ? 'table' : 'text',
              x: element.x,
              y: element.y,
              width: element.width,
              height: element.height,
              content: element.content,
              isSelected: false
            })) : [],
            width: 595,
            height: 842
          })) : [{
            id: 'page-1',
            name: 'Page 1',
            elements: [],
            width: 595,
            height: 842
          }]
        };

        setActiveReport(mockReport);
        setIsLoading(false);
      } catch (error: any) {
        console.error("Failed to load template:", error);
        toast.error(error.message || "Failed to load template data");
        navigate("/");
      }
    };

    loadTemplateData();
  }, [templateId, templateName, setActiveReport, navigate]);

  const handleGoBack = () => {
    navigate("/");
  };

  const handleSaveTemplate = () => {
    toast.success("Template changes saved automatically");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      {/* Editor Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Editing Template:</span>
            <span className="text-sm font-semibold text-blue-600">{templateName}</span>
          </div>
        </div>
        
        <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      </div>

      {/* Page Controls */}
      <div className="border-b bg-muted/40">
        <PageControls />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 overflow-hidden">
          <EditorCanvas onClose={handleGoBack} />
        </div>
      </div>
    </div>
  );
};

const Editor = () => {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
};

export default Editor; 