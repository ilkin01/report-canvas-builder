
import { useEditor } from "@/context/EditorContext";
import { ElementData } from "@/types/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { ChartProperties } from "./ChartProperties";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ElementPropertiesProps {
  element: ElementData;
}

export const ElementProperties: React.FC<ElementPropertiesProps> = ({ element }) => {
  const { updateElement, deleteElement } = useEditor();

  // Confirm the element exists on mount to prevent errors
  useEffect(() => {
    if (!element || !element.id) {
      console.error("Element is undefined or missing ID in ElementProperties");
    }
  }, [element]);

  const handleChange = async (
    field: string,
    value: string | number | Record<string, any>
  ) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      await updateElement(element.id, {
        content: {
          ...element.content,
          [parent]: {
            ...element.content[parent],
            [child]: value,
          },
        },
      });
    } else {
      await updateElement(element.id, {
        content: {
          ...element.content,
          [field]: value,
        },
      });
    }
  };

  const handlePositionChange = async (
    field: "x" | "y" | "width" | "height",
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      await updateElement(element.id, {
        [field]: numValue,
      });
    }
  };

  const handleDeleteElement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation
    if (element && element.id) {
      console.log("Deleting element with ID:", element.id);
      deleteElement(element.id);
    } else {
      console.error("Cannot delete element - missing ID");
    }
  };

  const handleInputContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling up to parent containers
  };

  const renderPropertiesByType = () => {
    switch (String(element.type)) {
      case "text":
        return (
          <>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                rows={5}
                value={element.content.text || ""}
                onChange={(e) => handleChange("text", e.target.value)}
                className="resize-none whitespace-pre-wrap"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="grid grid-cols-2 gap-2" onClick={handleInputContainerClick}>
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={element.content.fontSize || 16}
                  onChange={(e) => handleChange("fontSize", parseInt(e.target.value, 10))}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textAlign">Alignment</Label>
                <Select
                  value={element.content.textAlign || "left"}
                  onValueChange={(value) => handleChange("textAlign", value)}
                  onOpenChange={(open) => open && event?.stopPropagation()}
                >
                  <SelectTrigger id="textAlign" onClick={(e) => e.stopPropagation()}>
                    <SelectValue placeholder="Alignment" />
                  </SelectTrigger>
                  <SelectContent onClick={(e) => e.stopPropagation()}>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={element.content.color || "#333333"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-12 h-10 p-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={element.content.color || "#333333"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </>
        );

      case "chart":
        return <ChartProperties element={element} handleChange={handleChange} />;

      case "shape":
        return (
          <>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="shapeType">Shape Type</Label>
              <Select
                value={element.content.type || "rectangle"}
                onValueChange={(value) => handleChange("type", value)}
                onOpenChange={(open) => open && event?.stopPropagation()}
              >
                <SelectTrigger id="shapeType" onClick={(e) => e.stopPropagation()}>
                  <SelectValue placeholder="Shape Type" />
                </SelectTrigger>
                <SelectContent onClick={(e) => e.stopPropagation()}>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="shapeColor">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="shapeColor"
                  type="color"
                  value={element.content.color || "#E5F3FF"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-12 h-10 p-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={element.content.color || "#E5F3FF"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="borderWidth">Border Width</Label>
              <Input
                id="borderWidth"
                type="number"
                value={element.content.borderWidth || 1}
                onChange={(e) => handleChange("borderWidth", parseInt(e.target.value, 10))}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="borderColor">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  id="borderColor"
                  type="color"
                  value={element.content.borderColor || "#0EA5E9"}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="w-12 h-10 p-1"
                  onClick={(e) => e.stopPropagation()}
                />
                <Input
                  type="text"
                  value={element.content.borderColor || "#0EA5E9"}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="flex-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </>
        );

      case "comment":
        return (
          <>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="commentText">Comment</Label>
              <Textarea
                id="commentText"
                rows={5}
                value={element.content.text || ""}
                onChange={(e) => handleChange("text", e.target.value)}
                className="resize-none whitespace-pre-wrap"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={element.content.author || ""}
                onChange={(e) => handleChange("author", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </>
        );

      case "signature":
        return (
          <>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="signatureName">Name</Label>
              <Input
                id="signatureName"
                value={element.content.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="space-y-2" onClick={handleInputContainerClick}>
              <Label htmlFor="signatureDate">Date</Label>
              <Input
                id="signatureDate"
                type="date"
                value={element.content.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </>
        );
        
      case "table":
        return (
          <div className="space-y-4" onClick={handleInputContainerClick}>
            <div>
              <Label>Table Settings</Label>
              <div className="mt-2">
                <Label htmlFor="tableTitle">Table Title</Label>
                <Input
                  id="tableTitle"
                  value={element.content.title || ""}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              
              <div className="mt-2">
                <Label htmlFor="headerBgColor">Header Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="headerBgColor"
                    type="color"
                    value={element.content.headerBgColor || "#f3f4f6"}
                    onChange={(e) => handleChange("headerBgColor", e.target.value)}
                    className="w-12 h-10 p-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Input
                    type="text"
                    value={element.content.headerBgColor || "#f3f4f6"}
                    onChange={(e) => handleChange("headerBgColor", e.target.value)}
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
              
              <div className="mt-2">
                <Label htmlFor="highlightColor">Highlight Row Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="highlightColor"
                    type="color"
                    value={element.content.highlightColor || "#fef9c3"}
                    onChange={(e) => handleChange("highlightColor", e.target.value)}
                    className="w-12 h-10 p-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Input
                    type="text"
                    value={element.content.highlightColor || "#fef9c3"}
                    onChange={(e) => handleChange("highlightColor", e.target.value)}
                    className="flex-1"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              <div className="mt-4 border-t pt-2">
                <Label>Table Cell Editing</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Double-click on any cell in the table to edit its content directly.
                </p>
              </div>

              <div className="mt-4 border-t pt-2">
                <Label>Cell Status Colors</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-green-100 p-2 rounded text-sm">Positive</div>
                  <div className="bg-red-100 p-2 rounded text-sm">Negative</div>
                  <div className="bg-yellow-100 p-2 rounded text-sm">Warning</div>
                  <div className="bg-blue-100 p-2 rounded text-sm">Active</div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use Ctrl+Click on cells in the table to cycle through status options
                </p>
              </div>

              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Click on rows in the table to highlight them. 
                  Add rows and columns using buttons below the table.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-13rem)]">
      <div 
        className="p-4 space-y-4" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          {(() => { const typeStr = String(element.type); return <h3 className="font-semibold">{typeStr.charAt(0).toUpperCase() + typeStr.slice(1)} Properties</h3>; })()}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteElement}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2" onClick={handleInputContainerClick}>
          <div className="space-y-2">
            <Label htmlFor="posX">X Position</Label>
            <Input
              id="posX"
              type="number"
              value={element.x}
              onChange={(e) => handlePositionChange("x", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="posY">Y Position</Label>
            <Input
              id="posY"
              type="number"
              value={element.y}
              onChange={(e) => handlePositionChange("y", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              value={element.width}
              onChange={(e) => handlePositionChange("width", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              value={element.height}
              onChange={(e) => handlePositionChange("height", e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>

        {renderPropertiesByType()}
      </div>
    </ScrollArea>
  );
};
