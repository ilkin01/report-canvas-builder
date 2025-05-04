
import React, { useState, useRef, useEffect } from "react";
import { ElementData } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";
import { Textarea } from "@/components/ui/textarea";

interface TextElementProps {
  element: ElementData;
}

export const TextElement: React.FC<TextElementProps> = ({ element }) => {
  const { updateElement } = useEditor();
  const { content } = element;
  const { text, fontSize = 16, fontWeight = "normal", color = "#333333", textAlign = "left" } = content;
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Update local state if element content changes
  useEffect(() => {
    setEditText(text || "");
  }, [text]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editText !== text) {
      updateElement(element.id, {
        content: {
          ...element.content,
          text: editText
        }
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      // Allow line breaks with shift+enter
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === "Escape") {
      setEditText(text || "");
      setIsEditing(false);
    }
  };

  return (
    <div
      className="w-full h-full overflow-auto p-2"
      style={{
        fontSize: `${fontSize}px`,
        fontWeight,
        color,
        textAlign,
        cursor: isEditing ? "text" : "default",
      }}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <Textarea
          ref={textareaRef}
          value={editText}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-0 border-0 focus-visible:ring-0 resize-none bg-transparent"
          style={{
            fontSize: `${fontSize}px`,
            fontWeight,
            color,
            textAlign,
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="whitespace-pre-wrap">{text}</div>
      )}
    </div>
  );
};
