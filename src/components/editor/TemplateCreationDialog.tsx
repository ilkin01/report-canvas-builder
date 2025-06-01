
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEditor } from "@/context/EditorContext";
import { saveUserTemplate } from "@/lib/templates";
import { Template } from "@/types/editor";

interface TemplateCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateCreationDialog: React.FC<TemplateCreationDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [templateName, setTemplateName] = useState("");
  const { canvasState } = useEditor();

  const handleCreateTemplate = () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (canvasState.pages.length === 0 || canvasState.pages[canvasState.currentPageIndex].elements.length === 0) {
      toast.error("Please add some elements to the page before creating a template");
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
      toast.success(`Template "${templateName}" created successfully`);
      setTemplateName("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create template");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Template</DialogTitle>
          <DialogDescription>
            Create a template from the current page elements. This template can be reused for future reports.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="templateName">Template Name</Label>
            <Input
              id="templateName"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateTemplate}>
            Create Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
