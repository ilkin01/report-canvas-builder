import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PageControls } from "@/components/editor/PageControls";
import { CanvasElement } from "@/components/editor/elements/CanvasElement";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { saveUserTemplate } from "@/lib/templates";
import { Template } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";
import { apiService } from "@/services/apiService";

const TemplateCreatorContent = () => {
  const [templateName, setTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const { canvasState, setActiveReport, clearSelection, deletedPages, deletedElements } = useEditor();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const templateId = searchParams.get('templateId');
    const templateNameParam = searchParams.get('templateName');
    
    // Check if we're editing an existing template from URL params
    if (templateId && templateNameParam) {
      setTemplateName(templateNameParam);
      setEditingTemplateId(templateId);
      
      // Load template data from backend
      const loadTemplateData = async () => {
        try {
          const templateData = await apiService.sendRequest({
            endpoint: `/api/ReportTemplate/GetReportTemplateById/${templateId}`,
            method: "GET",
          });
          console.log('GetReportTemplateById response:', templateData);
          
          // Create a mock report for editing
          const mockReport = {
            id: `template-${templateId}`,
            templateId: templateId,
            patientId: 'template',
            patientName: templateNameParam,
            name: templateNameParam,
            type: 'template-edit',
            status: 'draft' as const,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            pages: templateData.pages ? templateData.pages.map((page: any) => ({
              id: String(page.id || `page-${page.order}`),
              backendId: page.id, // Save original backend ID for page
              name: `Page ${page.order}`,
              elements: page.elements ? page.elements
                .filter((element: any) => [0, 1, 2].includes(element.type))
                .map((element: any) => ({
                  id: String(element.id),
                  backendId: element.id, // Save original backend ID
                  type: (() => {
                    switch (element.type) {
                      case 0: return 'text';
                      case 1: return 'chart';
                      case 2: return 'table';
                      default: return 'text';
                    }
                  })(),
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content || { text: '' }, // Ensure content is always present
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
        } catch (error: any) {
          console.error("Failed to load template:", error);
          toast.error(error.message || "Failed to load template data");
          navigate("/");
        }
      };
      
      loadTemplateData();
    } else {
      // Check if we're editing an existing template from localStorage
      const editingTemplate = localStorage.getItem('editingTemplate');
      if (editingTemplate) {
        const template: Template = JSON.parse(editingTemplate);
        setTemplateName(template.name);
        setEditingTemplateId(String(template.id));
        
        // Load template into editor
        const mockReport = {
          id: 'temp-editing',
          templateId: 'temp',
          patientId: 'temp',
          patientName: 'Template Editing',
          name: template.name,
          type: 'template-edit',
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: template.pages && template.pages.length > 0 ? template.pages.map(page => ({
            id: String(page.id || `page-${page.order}`),
            name: `Page ${page.order}`,
            elements: page.elements ? page.elements.map(element => ({
              ...element,
              id: String(element.id),
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
        localStorage.removeItem('editingTemplate');
      } else {
        // Create a default template editing environment with one page
        const defaultMockReport = {
          id: 'temp-new',
          templateId: 'temp',
          patientId: 'temp',
          patientName: 'New Template',
          name: 'New Template',
          type: 'template-edit',
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          pages: [{
            id: 'page-1',
            name: 'Page 1',
            elements: [],
            width: 595,
            height: 842
          }]
        };
        
        setActiveReport(defaultMockReport);
      }
    }
  }, [setActiveReport, searchParams, navigate]);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (canvasState.pages.length === 0) {
      toast.error("Please add at least one page to the template");
      return;
    }

    try {
      if (editingTemplateId) {
        toast.info("Updating template...");
        // 1. DELETE removed pages
        for (const pageId of deletedPages) {
          try {
            await apiService.sendRequest({
              endpoint: `/api/ReportTemplatePage/DeleteReportTemplatePage/${pageId}`,
              method: 'DELETE',
            });
            console.log(`🗑️ Deleted template page ${pageId}`);
          } catch (err) {
            console.error(`❌ Failed to delete template page ${pageId}:`, err);
          }
        }
        // 2. DELETE removed elements
        for (const elementId of deletedElements) {
          try {
            await apiService.sendRequest({
              endpoint: `/api/ReportTemplateElement/DeleteReportTemplateElement/${elementId}`,
              method: 'DELETE',
            });
            console.log(`🗑️ Deleted template element ${elementId}`);
          } catch (err) {
            console.error(`❌ Failed to delete template element ${elementId}:`, err);
          }
        }
        // 3. Update template name
        await apiService.sendRequest({
          endpoint: `/api/ReportTemplate/UpdateReportTemplate/${editingTemplateId}`,
          method: "PUT",
          body: { name: templateName },
        });
        // 4. Update/Create pages and elements
        for (const [pageIndex, page] of canvasState.pages.entries()) {
          if (page.backendId) {
            // Update existing page
            await apiService.sendRequest({
              endpoint: `/api/ReportTemplatePage/UpdateReportTemplatePage/${page.backendId}`,
              method: "PUT",
              body: { 
                order: pageIndex + 1, 
                templateId: parseInt(editingTemplateId) 
              },
            });
          } else {
            // Create new page
            const pageRes = await apiService.sendRequest({
              endpoint: "/api/ReportTemplatePage/CreateReportTemplatePage",
              method: "POST",
              body: {
                order: pageIndex + 1,
                templateId: parseInt(editingTemplateId)
              }
            });
            const newPageId = pageRes?.id || pageRes?.pageId || pageRes?.data?.id;
            if (!newPageId) throw new Error(`Template page ${pageIndex + 1} yaradılmadı!`);
            page.backendId = newPageId;
          }
          // Update/Create elements for this page
          for (const element of page.elements) {
            if (element.backendId) {
              // Update existing element
              await apiService.sendRequest({
                endpoint: `/api/ReportTemplateElement/UpdateReportTemplateElement/${element.backendId}`,
                method: "PUT",
                body: {
                  type: element.type === 'text' ? 0 : element.type === 'chart' ? 1 : 2,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content,
                  pageId: page.backendId
                }
              });
            } else {
              // Create new element
              await apiService.sendRequest({
                endpoint: "/api/ReportTemplateElement/CreateReportTemplateElement",
                method: "POST",
                body: {
                  type: element.type === 'text' ? 0 : element.type === 'chart' ? 1 : 2,
                  x: element.x,
                  y: element.y,
                  width: element.width,
                  height: element.height,
                  content: element.content,
                  pageId: page.backendId
                }
              });
            }
          }
        }
        toast.success("Template updated successfully!");
        setTimeout(() => navigate("/"), 1000);
      } else {
        // CREATE NEW TEMPLATE
        toast.info("Creating new template...");
        
        // 1. Template yaradılır
        const templateRes = await apiService.sendRequest({
          endpoint: "/api/ReportTemplate/CreateReportTemplate",
          method: "POST",
          body: { name: templateName },
        });
        const templateId = templateRes.id || templateRes.templateId || templateRes.data?.id;
        if (!templateId) throw new Error("Template ID alınmadı");

        // 2. Hər səhifə üçün page yaradılır
        for (const [pageIndex, page] of canvasState.pages.entries()) {
          const pageRes = await apiService.sendRequest({
            endpoint: "/api/ReportTemplatePage/CreateReportTemplatePage",
            method: "POST",
            body: { order: pageIndex + 1, templateId },
          });
          const pageId = pageRes.id || pageRes.pageId || pageRes.data?.id;
          if (!pageId) throw new Error("Page ID alınmadı");

          // 3. Hər element üçün element yaradılır
          for (const element of page.elements) {
            // Element tipini backend-in gözlədiyi rəqəmlə uyğunlaşdır
            let typeId = 0;
            if (element.type === "text") typeId = 0;
            else if (element.type === "chart") typeId = 1;
            else if (element.type === "table") typeId = 2;

            await apiService.sendRequest({
              endpoint: "/api/ReportTemplateElement/CreateReportTemplateElement",
              method: "POST",
              body: {
                type: typeId,
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                content: element.content,
                pageId,
              },
            });
          }
        }

        toast.success(`Template "${templateName}" uğurla yaradıldı!`);
      }
      
      navigate("/");
    } catch (error: any) {
      toast.error(`Template əməliyyatı uğursuz oldu: ${error.message}`);
      console.error("Template save error:", error);
    }
  };

  const handleGoBack = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      
      {/* Template Creation Header */}
      <div className="bg-white border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Main
          </Button>
          <div className="flex items-center gap-2">
            <Label htmlFor="templateName">Template Name:</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
              className="w-64"
            />
          </div>
          {editingTemplateId && (
            <span className="text-sm text-blue-600 font-medium">
              (Editing existing template)
            </span>
          )}
        </div>
        
        <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          {editingTemplateId ? 'Update Template' : 'Save Template'}
        </Button>
      </div>

      {/* Page Controls - Always visible in template creator */}
      <div className="border-b bg-muted/40">
        <PageControls />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto p-6 bg-gray-100 flex justify-center">
            <div
              className="canvas-container relative shadow-lg bg-white"
              style={{
                width: `${canvasState.pages[canvasState.currentPageIndex]?.width || 595}px`,
                height: `${canvasState.pages[canvasState.currentPageIndex]?.height || 842}px`,
                backgroundColor: "white",
              }}
              onClick={(e) => {
                if (e.currentTarget === e.target) {
                  clearSelection();
                }
              }}
            >
              {canvasState.pages[canvasState.currentPageIndex]?.elements.map((element) => (
                <CanvasElement key={element.id} element={element} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateCreator = () => {
  return (
    <EditorProvider>
      <TemplateCreatorContent />
    </EditorProvider>
  );
};

export default TemplateCreator;
