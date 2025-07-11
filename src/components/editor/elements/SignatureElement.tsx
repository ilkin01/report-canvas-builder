
import { ElementData } from "@/types/editor";
import { useRef, useState, useEffect } from "react";
import { useEditor } from "@/context/EditorContext";

interface SignatureElementProps {
  element: ElementData;
}

export const SignatureElement: React.FC<SignatureElementProps> = ({ element }) => {
  const { content } = element;
  const { name, date, signature } = content;
  const { updateElement } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  useEffect(() => {
    if (canvasRef.current && signature) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
          ctx.drawImage(img, 0, 0);
        };
        img.src = signature;
      }
    }
  }, [signature]);
  
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.beginPath();
    ctx.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    setIsDrawing(true);
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    
    ctx.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );
    ctx.stroke();
  };
  
  const endDrawing = async () => {
    setIsDrawing(false);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Save the signature as a data URL
    const dataURL = canvas.toDataURL("image/png");
    await updateElement(element.id, {
      content: {
        ...element.content,
        signature: dataURL,
      },
    });
  };
  
  const clearSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    await updateElement(element.id, {
      content: {
        ...element.content,
        signature: "",
      },
    });
  };

  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="text-sm font-bold mb-1">Signature</div>
      <div className="flex-1 border rounded-md overflow-hidden relative">
        <canvas
          ref={canvasRef}
          width={element.width - 20}
          height={element.height - 60}
          className="w-full h-full cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
        />
        {!signature && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            Sign here
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs">
          {name && <div className="font-medium">{name}</div>}
          {date && <div className="text-gray-500">{date}</div>}
        </div>
        {signature && (
          <button
            className="text-xs text-red-500 hover:underline"
            onClick={clearSignature}
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};
