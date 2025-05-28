
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllTemplates } from "@/redux/slices/templatesSlice";
import { createNewReport } from "@/redux/slices/reportsSlice";
import { getUserTemplates } from "@/lib/templates";
import { Template } from "@/types/editor";

interface TemplateGalleryProps {
  onSelectTemplate?: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  onSelectTemplate 
}) => {
  const [reportName, setReportName] = useState("New Report");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [userTemplates, setUserTemplates] = useState<Template[]>([]);
  
  const dispatch = useAppDispatch();
  const { templates, loading } = useAppSelector(state => state.templates);
  
  useEffect(() => {
    dispatch(fetchAllTemplates());
    // Load user templates from localStorage
    const customTemplates = getUserTemplates();
    setUserTemplates(customTemplates);
  }, [dispatch]);

  const handleCreateReport = async () => {
    if (!selectedTemplateId) {
      toast.error("Please select a template first");
      return;
    }
    
    if (!reportName.trim()) {
      toast.error("Please enter a report name");
      return;
    }
    
    try {
      await dispatch(createNewReport({ name: reportName, templateId: selectedTemplateId })).unwrap();
      
      if (onSelectTemplate) {
        onSelectTemplate();
      }
      
      toast.success(`Created new report: ${reportName}`);
    } catch (error) {
      toast.error("Failed to create report");
    }
  };

  // Combine system and user templates
  const allTemplates = [...templates, ...userTemplates];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name</Label>
        <Input
          id="reportName"
          value={reportName}
          onChange={(e) => setReportName(e.target.value)}
          placeholder="Enter report name"
        />
      </div>
      
      <div className="space-y-3">
        <Label>Select a Template</Label>
        {loading ? (
          <div className="text-center py-4">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {allTemplates.map((template) => (
              <div
                key={template.id}
                className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-primary ${
                  selectedTemplateId === template.id
                    ? "border-primary-600 ring-2 ring-primary ring-offset-2"
                    : ""
                }`}
                onClick={() => setSelectedTemplateId(template.id)}
              >
                <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center">
                  {template.thumbnail ? (
                    <img
                      src={template.thumbnail}
                      alt={template.name}
                      className="h-full w-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-sm text-gray-500">{template.name}</div>
                  )}
                </div>
                <p className="font-medium text-sm truncate">{template.name}</p>
                <p className="text-xs text-gray-500">
                  {template.category === "system" ? "System Template" : "Custom Template"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <Button
          onClick={handleCreateReport}
          disabled={!selectedTemplateId || !reportName.trim() || loading}
        >
          Create Report
        </Button>
      </div>
    </div>
  );
};
