import { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PageControls } from "@/components/editor/PageControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { saveUserTemplate } from "@/lib/templates";
import { Template } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";

const TemplateCreatorContent = () => {
  const [templateName, setTemplateName] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const { canvasState, setActiveReport } = useEditor();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're editing an existing template
    const editingTemplate = localStorage.getItem('editingTemplate');
    if (editingTemplate) {
      const template: Template = JSON.parse(editingTemplate);
      setTemplateName(template.name);
      setEditingTemplateId(template.id);
      
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
          ...page,
          elements: page.elements.map(element => ({
            ...element,
            isSelected: false
          }))
        })) : [{
          id: 'page-1',
          name: 'Page 1',
          elements: template.elements ? template.elements.map(element => ({
            ...element,
            isSelected: false
          })) : [],
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
  }, [setActiveReport]);

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (canvasState.pages.length === 0) {
      toast.error("Please add at least one page to the template");
      return;
    }

    // Create or update template with all pages and their elements
    const templateData: Template = {
      id: editingTemplateId || `custom-${Date.now()}`,
      name: templateName,
      category: 'custom',
      pages: canvasState.pages.map(page => ({
        ...page,
        elements: page.elements.map(element => ({
          ...element,
          isSelected: false
        }))
      })),
      // For backward compatibility, include elements from first page
      elements: canvasState.pages[0].elements.map(element => ({
        ...element,
        isSelected: false
      }))
    };

    try {
      saveUserTemplate(templateData);
      toast.success(`Template "${templateName}" ${editingTemplateId ? 'updated' : 'saved'} successfully`);
      console.log("Template saved as JSON:", JSON.stringify(templateData, null, 2));
      
      // Navigate back to main page after saving
      navigate("/");
    } catch (error) {
      toast.error(`Failed to ${editingTemplateId ? 'update' : 'save'} template`);
      console.error("Error saving template:", error);
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

      {/* Page Controls - Always show in template creator */}
      <PageControls />

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <div className="flex-1 h-[calc(100vh-8rem)] overflow-hidden flex flex-col">
          <div className="flex justify-center flex-1 overflow-auto p-6 bg-gray-100">
            <div
              className="canvas-container relative shadow-lg bg-white"
              style={{
                width: `${canvasState.pages[canvasState.currentPageIndex]?.width || 595}px`,
                height: `${canvasState.pages[canvasState.currentPageIndex]?.height || 842}px`,
                backgroundColor: "white",
              }}
            >
              {canvasState.pages[canvasState.currentPageIndex]?.elements.map((element) => (
                <div key={element.id}>
                  {/* Canvas elements will be rendered here by EditorCanvas logic */}
                </div>
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
