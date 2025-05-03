
import { ElementData } from "@/types/editor";

interface ShapeElementProps {
  element: ElementData;
}

export const ShapeElement: React.FC<ShapeElementProps> = ({ element }) => {
  const { content } = element;
  const { type, color = "#E5F3FF", borderWidth = 1, borderColor = "#0EA5E9" } = content;

  const renderShape = () => {
    switch (type) {
      case "rectangle":
        return (
          <div
            className="w-full h-full"
            style={{
              backgroundColor: color,
              border: `${borderWidth}px solid ${borderColor}`,
            }}
          />
        );
        
      case "circle":
        return (
          <div
            className="w-full h-full rounded-full"
            style={{
              backgroundColor: color,
              border: `${borderWidth}px solid ${borderColor}`,
            }}
          />
        );
        
      case "line":
        return (
          <div className="w-full h-full flex items-center">
            <div
              style={{
                height: `${borderWidth}px`,
                backgroundColor: borderColor,
                width: "100%",
              }}
            />
          </div>
        );
        
      default:
        return <div className="w-full h-full">Invalid shape</div>;
    }
  };

  return <div className="w-full h-full">{renderShape()}</div>;
};
