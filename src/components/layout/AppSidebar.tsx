
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TemplateGallery } from "@/components/editor/TemplateGallery";
import { TemplateManagement } from "@/components/editor/TemplateManagement";
import { TemplateCreationDialog } from "@/components/editor/TemplateCreationDialog";
import { Plus } from "lucide-react";

export const AppSidebar = () => {
  const [showTemplateCreation, setShowTemplateCreation] = useState(false);
  const [showTemplateManagement, setShowTemplateManagement] = useState(false);

  return (
    <div className="w-80 border-r bg-gray-50 p-4 space-y-4">
      {/* Create Template Section */}
      <div className="space-y-2">
        <h3 className="font-semibold text-lg">Templates</h3>
        <div className="space-y-2">
          <Button
            onClick={() => setShowTemplateCreation(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
          
          <Button
            onClick={() => setShowTemplateManagement(true)}
            className="w-full"
            variant="outline"
          >
            Manage Templates
          </Button>
        </div>
      </div>

      {/* Template Gallery */}
      <div className="space-y-2">
        <h4 className="font-medium">New Report from Template</h4>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="w-full">
              Browse Templates
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[600px] sm:w-[700px]">
            <SheetHeader>
              <SheetTitle>Template Gallery</SheetTitle>
              <SheetDescription>
                Choose a template to create a new report
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6">
              <TemplateGallery />
            </div>
          </SheetContent>
        </Sheet>
      </div>

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
  );
};
