
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PatientsList } from "@/components/patients/PatientsList";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReports } from "@/redux/slices/reportsSlice";
import { fetchAllTemplates } from "@/redux/slices/templatesSlice";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import { TemplateCreationDialog } from "@/components/editor/TemplateCreationDialog";
import { TemplateManagement } from "@/components/editor/TemplateManagement";
import { TemplateGallery } from "@/components/editor/TemplateGallery";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateCreation, setShowTemplateCreation] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  
  const dispatch = useAppDispatch();
  const { reports, activeReportId } = useAppSelector(state => state.reports);
  
  useEffect(() => {
    // Load initial data
    Promise.all([
      dispatch(fetchAllReports()),
      dispatch(fetchAllTemplates())
    ]).catch(err => {
      toast.error("Failed to load initial data");
      console.error("Error loading initial data:", err);
    });
  }, [dispatch]);

  // Go to editor when we have an active report
  useEffect(() => {
    if (activeReportId) {
      setIsEditing(true);
    }
  }, [activeReportId]);

  return (
    <EditorProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          {!isEditing ? (
            <div className="p-6 w-full">
              {/* Template Management Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Template Management</h2>
                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowTemplateCreation(true)}
                    variant="outline"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Template
                  </Button>
                  
                  <Button
                    onClick={() => setShowTemplateManagement(true)}
                    variant="outline"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Templates
                  </Button>
                  
                  <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        New Report from Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Template Gallery</DialogTitle>
                        <DialogDescription>
                          Choose a template to create a new report
                        </DialogDescription>
                      </DialogHeader>
                      <div className="mt-6">
                        <TemplateGallery onSelectTemplate={() => setShowTemplateGallery(false)} />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>

              {/* Patients List */}
              <PatientsList onReportSelect={() => setIsEditing(true)} />

              {/* Template Creation Dialog */}
              <TemplateCreationDialog
                open={showTemplateCreation}
                onOpenChange={setShowTemplateCreation}
              />

              {/* Template Management Dialog */}
              <TemplateManagement
                open={showTemplateManagement}
                onOpenChange={setShowTemplateManagement}
              />
            </div>
          ) : (
            <>
              <AppSidebar />
              <EditorCanvas onClose={() => setIsEditing(false)} />
            </>
          )}
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
