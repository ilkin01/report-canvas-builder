
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Type, BarChart3, Square, MessageSquare, PenTool, Table } from "lucide-react";
import { useEditor } from "@/context/EditorContext";
import { ElementProperties } from "@/components/editor/properties/ElementProperties";
import { ScrollArea } from "@/components/ui/scroll-area";

export const AppSidebar = () => {
  const { addElement, canvasState } = useEditor();

  const selectedElement = canvasState.pages[canvasState.currentPageIndex]?.elements.find(
    (el) => el.isSelected
  );

  const handleAddElement = (type: string) => {
    const elementData = {
      type,
      x: 50,
      y: 50,
      width: type === "text" ? 200 : type === "table" ? 400 : 150,
      height: type === "text" ? 50 : type === "table" ? 200 : 100,
      content: getDefaultContent(type),
    };
    
    addElement(elementData as any);
  };

  const getDefaultContent = (type: string) => {
    switch (type) {
      case "text":
        return { text: "Sample Text", fontSize: 16, color: "#333333", textAlign: "left" };
      case "chart":
        return {
          type: "bar",
          data: [
            { name: "A", value: 100 },
            { name: "B", value: 200 },
            { name: "C", value: 150 }
          ],
          title: "Sample Chart"
        };
      case "shape":
        return { 
          type: "rectangle", 
          color: "#E5F3FF", 
          borderColor: "#0EA5E9", 
          borderWidth: 1 
        };
      case "comment":
        return { text: "Add your comment here", author: "User" };
      case "signature":
        return { name: "", date: new Date().toISOString().split('T')[0] };
      case "table":
        return {
          title: "Sample Table",
          headers: ["Column 1", "Column 2", "Column 3"],
          columnTypes: ["string", "string", "string"],
          rows: [
            ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
            ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
          ],
          highlightedRows: [],
          headerBgColor: "#f3f4f6",
          highlightColor: "#fef9c3"
        };
      default:
        return {};
    }
  };

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
      {/* Elements Section */}
      <div className="p-4 border-b">
        <h3 className="font-semibold text-lg mb-3">Add Elements</h3>
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => handleAddElement("text")}
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3"
          >
            <Type className="h-4 w-4 mb-1" />
            <span className="text-xs">Text</span>
          </Button>
          <Button
            onClick={() => handleAddElement("chart")}
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3"
          >
            <BarChart3 className="h-4 w-4 mb-1" />
            <span className="text-xs">Chart</span>
          </Button>
          <Button
            onClick={() => handleAddElement("table")}
            variant="outline"
            size="sm"
            className="flex flex-col h-auto py-3"
          >
            <Table className="h-4 w-4 mb-1" />
            <span className="text-xs">Table</span>
          </Button>
        </div>
      </div>

      {/* Properties Section */}
      <div className="flex-1 flex flex-col">
        {selectedElement ? (
          <div className="flex-1">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Element Properties</h3>
            </div>
            <ElementProperties element={selectedElement} />
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>Select an element to edit its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};
