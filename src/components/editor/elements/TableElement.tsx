
import { ElementData } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface TableElementProps {
  element: ElementData;
}

export const TableElement: React.FC<TableElementProps> = ({ element }) => {
  const { content, isSelected } = element;
  const { headers = [], rows = [] } = content;
  const { updateElement } = useEditor();
  const [localHeaders, setLocalHeaders] = useState<string[]>(headers);
  const [localRows, setLocalRows] = useState<Array<Array<string | number>>>(rows);

  // Update local state when element content changes
  useEffect(() => {
    setLocalHeaders(headers);
    setLocalRows(rows);
  }, [headers, rows]);

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...localHeaders];
    newHeaders[index] = value;
    setLocalHeaders(newHeaders);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
      },
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...localRows];
    newRows[rowIndex][colIndex] = value;
    setLocalRows(newRows);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows,
      },
    });
  };

  return (
    <div className="w-full h-full overflow-auto p-0">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {localHeaders.map((header, index) => (
              <th key={index} className="border p-1 bg-medical-light-blue">
                {isSelected ? (
                  <Input
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full h-7 p-1 text-sm font-bold"
                  />
                ) : (
                  <div className="p-1 text-sm font-bold">{header}</div>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {localRows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="border p-1">
                  {isSelected ? (
                    <Input
                      value={cell.toString()}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full h-7 p-1 text-sm"
                    />
                  ) : (
                    <div className="p-1 text-sm">{cell.toString()}</div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
