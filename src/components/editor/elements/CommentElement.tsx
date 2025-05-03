
import { ElementData } from "@/types/editor";

interface CommentElementProps {
  element: ElementData;
}

export const CommentElement: React.FC<CommentElementProps> = ({ element }) => {
  const { content } = element;
  const { text, author, timestamp } = content;
  
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) 
    : '';

  return (
    <div className="w-full h-full bg-yellow-50 p-2 border-l-4 border-yellow-500 overflow-auto">
      <div className="text-sm font-medium mb-1">{text}</div>
      {(author || timestamp) && (
        <div className="text-xs text-gray-500">
          {author && <span className="font-medium">{author}</span>}
          {author && timestamp && <span> • </span>}
          {timestamp && <span>{formattedTime}</span>}
        </div>
      )}
    </div>
  );
};
