
import { ElementData } from "@/types/editor";

interface TextElementProps {
  element: ElementData;
}

export const TextElement: React.FC<TextElementProps> = ({ element }) => {
  const { content } = element;
  const { text, fontSize = 16, fontWeight = "normal", color = "#333333", textAlign = "left" } = content;

  return (
    <div
      className="w-full h-full overflow-auto p-2"
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign,
      }}
    >
      {text}
    </div>
  );
};
