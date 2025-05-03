
import { useEditor } from "@/context/EditorContext";
import { ElementData } from "@/types/editor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash } from "lucide-react";
import { ChartProperties } from "./ChartProperties";

interface ElementPropertiesProps {
  element: ElementData;
}

export const ElementProperties: React.FC<ElementPropertiesProps> = ({ element }) => {
  const { updateElement, deleteElement } = useEditor();

  const handleChange = (
    field: string,
    value: string | number | Record<string, any>
  ) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      updateElement(element.id, {
        content: {
          ...element.content,
          [parent]: {
            ...element.content[parent],
            [child]: value,
          },
        },
      });
    } else {
      updateElement(element.id, {
        content: {
          ...element.content,
          [field]: value,
        },
      });
    }
  };

  const handlePositionChange = (
    field: "x" | "y" | "width" | "height",
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue)) {
      updateElement(element.id, {
        [field]: numValue,
      });
    }
  };

  const renderPropertiesByType = () => {
    switch (element.type) {
      case "text":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="text">Text Content</Label>
              <Textarea
                id="text"
                rows={3}
                value={element.content.text || ""}
                onChange={(e) => handleChange("text", e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="fontSize">Font Size</Label>
                <Input
                  id="fontSize"
                  type="number"
                  value={element.content.fontSize || 16}
                  onChange={(e) => handleChange("fontSize", parseInt(e.target.value, 10))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textAlign">Alignment</Label>
                <Select
                  value={element.content.textAlign || "left"}
                  onValueChange={(value) => handleChange("textAlign", value)}
                >
                  <SelectTrigger id="textAlign">
                    <SelectValue placeholder="Alignment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="left">Left</SelectItem>
                    <SelectItem value="center">Center</SelectItem>
                    <SelectItem value="right">Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="textColor">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={element.content.color || "#333333"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={element.content.color || "#333333"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1"
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
            <div className="space-y-2">
              <Label htmlFor="shapeType">Shape Type</Label>
              <Select
                value={element.content.type || "rectangle"}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger id="shapeType">
                  <SelectValue placeholder="Shape Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rectangle">Rectangle</SelectItem>
                  <SelectItem value="circle">Circle</SelectItem>
                  <SelectItem value="line">Line</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shapeColor">Fill Color</Label>
              <div className="flex gap-2">
                <Input
                  id="shapeColor"
                  type="color"
                  value={element.content.color || "#E5F3FF"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={element.content.color || "#E5F3FF"}
                  onChange={(e) => handleChange("color", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="borderWidth">Border Width</Label>
              <Input
                id="borderWidth"
                type="number"
                value={element.content.borderWidth || 1}
                onChange={(e) => handleChange("borderWidth", parseInt(e.target.value, 10))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="borderColor">Border Color</Label>
              <div className="flex gap-2">
                <Input
                  id="borderColor"
                  type="color"
                  value={element.content.borderColor || "#0EA5E9"}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="w-12 h-10 p-1"
                />
                <Input
                  type="text"
                  value={element.content.borderColor || "#0EA5E9"}
                  onChange={(e) => handleChange("borderColor", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </>
        );

      case "comment":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="commentText">Comment</Label>
              <Textarea
                id="commentText"
                rows={3}
                value={element.content.text || ""}
                onChange={(e) => handleChange("text", e.target.value)}
                className="resize-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={element.content.author || ""}
                onChange={(e) => handleChange("author", e.target.value)}
              />
            </div>
          </>
        );

      case "signature":
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="signatureName">Name</Label>
              <Input
                id="signatureName"
                value={element.content.name || ""}
                onChange={(e) => handleChange("name", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signatureDate">Date</Label>
              <Input
                id="signatureDate"
                type="date"
                value={element.content.date || ""}
                onChange={(e) => handleChange("date", e.target.value)}
              />
            </div>
          </>
        );
        
      case "table":
        return (
          <div className="space-y-4">
            <div>
              <Label>Table Data</Label>
              <p className="text-sm text-gray-500 mt-1">
                Use the canvas to edit table data
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{element.type.charAt(0).toUpperCase() + element.type.slice(1)} Properties</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteElement(element.id)}
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <Label htmlFor="posX">X Position</Label>
          <Input
            id="posX"
            type="number"
            value={element.x}
            onChange={(e) => handlePositionChange("x", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="posY">Y Position</Label>
          <Input
            id="posY"
            type="number"
            value={element.y}
            onChange={(e) => handlePositionChange("y", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="width">Width</Label>
          <Input
            id="width"
            type="number"
            value={element.width}
            onChange={(e) => handlePositionChange("width", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          <Input
            id="height"
            type="number"
            value={element.height}
            onChange={(e) => handlePositionChange("height", e.target.value)}
          />
        </div>
      </div>

      {renderPropertiesByType()}
    </div>
  );
};
