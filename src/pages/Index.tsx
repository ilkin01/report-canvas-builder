
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { EditorCanvas } from "@/components/editor/EditorCanvas";
import { EditorProvider } from "@/context/EditorContext";

const Index = () => {
  return (
    <EditorProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden">
          <AppSidebar />
          <EditorCanvas />
        </div>
      </div>
    </EditorProvider>
  );
};

export default Index;
