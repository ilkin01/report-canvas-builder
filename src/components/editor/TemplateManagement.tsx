
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getUserTemplates, saveUserTemplate } from "@/lib/templates";
import { Template } from "@/types/editor";
import { Trash, Edit, PenTool } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TemplateManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const TemplateManagement: React.FC<TemplateManagementProps> = ({
  open,
  onOpenChange,
}) => {
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [editName, setEditName] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      loadUserTemplates();
    }
  }, [open]);

  const loadUserTemplates = () => {
    const templates = getUserTemplates();
    setUserTemplates(templates);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const updatedTemplates = userTemplates.filter(t => t.id !== templateId);
    setUserTemplates(updatedTemplates);
    localStorage.setItem('userTemplates', JSON.stringify(updatedTemplates));
    toast.success("Template deleted successfully");
  };

  const handleEditTemplateName = (template: Template) => {
    setEditingTemplate(template);
    setEditName(template.name);
  };

  const handleEditTemplateContent = (template: Template) => {
    // Store the template to edit in localStorage temporarily
    localStorage.setItem('editingTemplate', JSON.stringify(template));
    onOpenChange(false);
    navigate("/template-creator");
    toast.info("Template loaded for editing. Make your changes and save.");
  };

  const handleSaveEdit = () => {
    if (!editingTemplate || !editName.trim()) {
      toast.error("Please enter a valid template name");
      return;
    }

    const updatedTemplate = { ...editingTemplate, name: editName.trim() };
    const updatedTemplates = userTemplates.map(t => 
      t.id === editingTemplate.id ? updatedTemplate : t
    );
    
    setUserTemplates(updatedTemplates);
    localStorage.setItem('userTemplates', JSON.stringify(updatedTemplates));
    
    setEditingTemplate(null);
    setEditName("");
    toast.success("Template updated successfully");
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditName("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Template Management</DialogTitle>
            <DialogDescription>
              Manage your custom templates. You can edit names, modify content, or delete templates you no longer need.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {userTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No custom templates found. Create your first template from the editor.
              </div>
            ) : (
              <div className="grid gap-3">
                {userTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{template.name}</h4>
                      <p className="text-sm text-gray-500">
                        {template.pages ? template.pages.length : 1} page(s), {template.elements?.length || 0} elements
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplateName(template)}
                        title="Edit template name"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplateContent(template)}
                        title="Edit template content"
                      >
                        <PenTool className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete template"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Name Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Template Name</DialogTitle>
            <DialogDescription>
              Update the template name.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTemplateName">Template Name</Label>
              <Input
                id="editTemplateName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter template name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
