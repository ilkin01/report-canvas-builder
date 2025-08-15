
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
import { apiService } from "@/services/apiService";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (open) {
      loadTemplatesFromBackend();
    }
  }, [open]);

  const loadTemplatesFromBackend = async () => {
    try {
      setLoading(true);
      const templates = await apiService.sendRequest({
        endpoint: "/api/ReportTemplate/GetAllReportTemplates",
        method: "GET",
      });
      setUserTemplates(templates);
    } catch (error) {
      toast.error("Failed to load templates from backend");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    try {
      await apiService.sendRequest({
        endpoint: `/api/ReportTemplate/DeleteReportTemplate/${templateId}`,
        method: "DELETE",
      });
      toast.success("Template deleted successfully");
      loadTemplatesFromBackend();
    } catch (error: any) {
      if (error && error.message && error.message.includes('409')) {
        toast.error("Bu template artıq hər hansı bir reportda istifadə olunduğu üçün silinə bilməz");
      } else if (error && error.status === 409) {
        toast.error("Bu template artıq hər hansı bir reportda istifadə olunduğu üçün silinə bilməz");
      } else {
        toast.error(error.message || "Failed to delete template");
      }
    }
  };

  const handleEditTemplateName = (template: Template) => {
    setEditingTemplate(template);
    setEditName(template.name);
  };

  const handleEditTemplateContent = async (template: Template) => {
    try {
      // Load template elements from backend
      const templateElements = await apiService.sendRequest({
        endpoint: `/api/ReportTemplate/GetReportTemplateById/${template.id}`,
        method: "GET",
      });
      
      // Navigate to template-creator with template data
      navigate(`/template-creator?templateId=${template.id}&templateName=${encodeURIComponent(template.name)}`);
      onOpenChange(false); // Close template management dialog
    } catch (error: any) {
      toast.error(error.message || "Failed to load template content");
    }
  };

  const handleSaveEdit = async () => {
    if (!editingTemplate || !editName.trim()) {
      toast.error("Please enter a valid template name");
      return;
    }
    try {
      await apiService.sendRequest({
        endpoint: `/api/ReportTemplate/UpdateReportTemplate/${editingTemplate.id}`,
        method: "PUT",
        body: { name: editName.trim() },
      });
      toast.success("Template updated successfully");
      setEditingTemplate(null);
      setEditName("");
      loadTemplatesFromBackend();
    } catch (error: any) {
      toast.error(error.message || "Failed to update template");
    }
  };

  const handleCancelEdit = () => {
    setEditingTemplate(null);
    setEditName("");
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Template Management</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Manage your custom templates. You can edit names, modify content, or delete templates you no longer need.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-3">
                {[1,2].map(i => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse bg-gray-100">
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-gray-300 rounded mb-2"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-8 bg-gray-300 rounded" />
                      {!isMobile && <div className="h-8 w-8 bg-gray-300 rounded" />}
                      <div className="h-8 w-8 bg-gray-300 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : userTemplates.length === 0 ? (
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
                      <h4 className="font-medium text-sm md:text-base">{template.name}</h4>
                    </div>
                    <div className="flex gap-2">
                      {/* Edit Template Name Button - Always Visible */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTemplateName(template)}
                        title="Edit template name"
                        className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                      >
                        <Edit className="h-4 w-4" />
                        {!isMobile && <span className="ml-1">Edit</span>}
                      </Button>
                      
                      {/* Edit Template Content Button - Hidden on Mobile */}
                      {!isMobile && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditTemplateContent(template)}
                          title="Edit template content"
                          className="h-8 px-3"
                        >
                          <PenTool className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      )}
                      
                      {/* Delete Button - Always Visible */}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        title="Delete template"
                        className="h-8 w-8 md:h-9 md:w-auto p-0 md:px-3"
                      >
                        <Trash className="h-4 w-4" />
                        {!isMobile && <span className="ml-1">Delete</span>}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} className="w-full md:w-auto">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Template Name Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="max-w-md w-full mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Edit Template Name</DialogTitle>
            <DialogDescription className="text-sm md:text-base">
              Update the template name.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTemplateName" className="text-sm md:text-base">Template Name</Label>
              <Input
                id="editTemplateName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter template name"
                className="text-sm md:text-base"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelEdit} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} className="w-full md:w-auto">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
