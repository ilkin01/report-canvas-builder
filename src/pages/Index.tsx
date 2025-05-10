
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";
import { PatientsList } from "@/components/patients/PatientsList";
import { useState, useEffect } from "react";

const Index = () => {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <EditorProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          {!isEditing ? (
            <div className="p-6 w-full">
              <PatientsList onReportSelect={() => setIsEditing(true)} />
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
