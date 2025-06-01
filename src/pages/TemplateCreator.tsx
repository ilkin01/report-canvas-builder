
import { useState } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
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
  const { canvasState } = useEditor();
  const navigate = useNavigate();

  const handleSaveTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (canvasState.pages.length === 0 || canvasState.pages[canvasState.currentPageIndex].elements.length === 0) {
      toast.error("Please add some elements to the template before saving");
      return;
    }

    const currentPage = canvasState.pages[canvasState.currentPageIndex];
    
    const newTemplate: Template = {
      id: `custom-${Date.now()}`,
      name: templateName,
      category: 'custom',
      elements: currentPage.elements.map(element => ({
        ...element,
        isSelected: false
      }))
    };

    try {
      saveUserTemplate(newTemplate);
      toast.success(`Template "${templateName}" saved successfully`);
      console.log("Template saved as JSON:", JSON.stringify(newTemplate, null, 2));
      
      // Navigate back to main page after saving
      navigate("/");
    } catch (error) {
      toast.error("Failed to save template");
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
        </div>
        
        <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <AppSidebar />
        <EditorCanvas />
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
