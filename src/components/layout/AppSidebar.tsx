import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { ElementType } from "@/types/editor";
import { 
  Square, 
  CircleIcon, 
  FileText, 
  BarChart3, 
  MessageSquare, 
  PenTool 
} from "lucide-react";
import { ElementProperties } from "../editor/properties/ElementProperties";

export const AppSidebar = () => {
  const { addElement, canvasState } = useEditor();
  
  const selectedElement = canvasState.selectedElementIds.length > 0
    ? canvasState.elements.find(el => el.id === canvasState.selectedElementIds[0])
    : null;

  const handleAddElement = (type: ElementType) => {
    const baseElement = {
      type,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
    };

    let content;
    switch (type) {
      case "text":
        content = {
          text: "Enter text here",
          fontSize: 16,
          color: "#333333",
          textAlign: "left",
        };
        break;
      case "chart":
        content = {
          type: "bar",
          data: {
            labels: ["A", "B", "C", "D", "E"],
            datasets: [
              {
                label: "Dataset",
                data: [12, 19, 3, 5, 2],
                backgroundColor: "rgba(14, 165, 233, 0.6)",
              },
            ],
          },
        };
        break;
      case "shape":
        content = {
          type: "rectangle",
          color: "#E5F3FF",
          borderWidth: 1,
          borderColor: "#0EA5E9",
        };
        break;
      case "comment":
        content = {
          text: "Add a comment here",
          author: "User",
          timestamp: new Date().toISOString(),
        };
        break;
      case "signature":
        content = {
          name: "",
          date: "",
          signature: "",
        };
        break;
      case "table":
        content = {
          headers: ["Header 1", "Header 2", "Header 3"],
          rows: [
            ["Cell 1", "Cell 2", "Cell 3"],
            ["Cell 4", "Cell 5", "Cell 6"],
          ],
        };
        break;
      default:
        content = {};
    }

    addElement({
      ...baseElement,
      content,
    });
  };

  return (
    <div className="w-64 border-r bg-white h-[calc(100vh-4rem)] flex flex-col">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg">Elements</h2>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("text")}
        >
          <FileText className="h-8 w-8 mb-2" />
          <span>Text</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("table")}
        >
          <Square className="h-8 w-8 mb-2" />
          <span>Table</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("chart")}
        >
          <BarChart3 className="h-8 w-8 mb-2" />
          <span>Chart</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("shape")}
        >
          <CircleIcon className="h-8 w-8 mb-2" />
          <span>Shape</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("comment")}
        >
          <MessageSquare className="h-8 w-8 mb-2" />
          <span>Comment</span>
        </Button>
        
        <Button
          variant="outline"
          className="h-24 flex flex-col justify-center"
          onClick={() => handleAddElement("signature")}
        >
          <PenTool className="h-8 w-8 mb-2" />
          <span>Signature</span>
        </Button>
      </div>
      
      <div className="mt-auto border-t">
        {selectedElement && (
          <ElementProperties element={selectedElement} />
        )}
      </div>
    </div>
  );
};
