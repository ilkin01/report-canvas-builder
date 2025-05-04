
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";
import { ElementData } from "@/types/editor";
import { TextElement } from "./TextElement";
import { ChartElement } from "./ChartElement";
import { ShapeElement } from "./ShapeElement";
import { CommentElement } from "./CommentElement";
import { SignatureElement } from "./SignatureElement";
import { TableElement } from "./TableElement";

interface CanvasElementProps {
  element: ElementData;
}

export const CanvasElement: React.FC<CanvasElementProps> = ({ element }) => {
  const { selectElement, updateElement, canvasState } = useEditor();
  const elementRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  
  const isSelected = element.isSelected;

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;

        updateElement(element.id, {
          x: element.x + dx,
          y: element.y + dy,
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      } else if (isResizing && resizeHandle) {
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        let newWidth = element.width;
        let newHeight = element.height;
        let newX = element.x;
        let newY = element.y;
        
        // Handle different resize handles
        if (resizeHandle.includes("r")) {
          newWidth = Math.max(50, element.width + dx);
        }
        
        if (resizeHandle.includes("l")) {
          const widthChange = element.width - Math.max(50, element.width - dx);
          newWidth = Math.max(50, element.width - dx);
          newX = element.x + widthChange;
        }
        
        if (resizeHandle.includes("b")) {
          newHeight = Math.max(50, element.height + dy);
        }
        
        if (resizeHandle.includes("t")) {
          const heightChange = element.height - Math.max(50, element.height - dy);
          newHeight = Math.max(50, element.height - dy);
          newY = element.y + heightChange;
        }

        updateElement(element.id, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        });

        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isDragging, dragStart, element, updateElement, isResizing, resizeHandle]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isSelected) {
      selectElement(element.id);
    }
  };

  const handleDragStart = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Don't start dragging when clicking on text content or form controls
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' || 
      target.tagName === 'TEXTAREA' || 
      target.tagName === 'SELECT' ||
      target.tagName === 'BUTTON' ||
      target.contentEditable === 'true'
    ) {
      return;
    }
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };
  
  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const renderElementContent = () => {
    switch (element.type) {
      case "text":
        return <TextElement element={element} />;
      case "chart":
        return <ChartElement element={element} />;
      case "shape":
        return <ShapeElement element={element} />;
      case "comment":
        return <CommentElement element={element} />;
      case "signature":
        return <SignatureElement element={element} />;
      case "table":
        return <TableElement element={element} />;
      default:
        return <div>Unknown element type</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`absolute canvas-element group ${isSelected ? "selected" : ""}`}
      style={{
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        zIndex: isSelected ? 10 : 1,
      }}
      onClick={handleMouseDown}
      onMouseDown={handleDragStart}
    >
      {renderElementContent()}
      
      {isSelected && (
        <>
          <div className="resizer resizer-t" onMouseDown={(e) => handleResizeStart(e, "t")}></div>
          <div className="resizer resizer-b" onMouseDown={(e) => handleResizeStart(e, "b")}></div>
          <div className="resizer resizer-l" onMouseDown={(e) => handleResizeStart(e, "l")}></div>
          <div className="resizer resizer-r" onMouseDown={(e) => handleResizeStart(e, "r")}></div>
          <div className="resizer resizer-tl" onMouseDown={(e) => handleResizeStart(e, "tl")}></div>
          <div className="resizer resizer-tr" onMouseDown={(e) => handleResizeStart(e, "tr")}></div>
          <div className="resizer resizer-bl" onMouseDown={(e) => handleResizeStart(e, "bl")}></div>
          <div className="resizer resizer-br" onMouseDown={(e) => handleResizeStart(e, "br")}></div>
        </>
      )}
    </div>
  );
};
