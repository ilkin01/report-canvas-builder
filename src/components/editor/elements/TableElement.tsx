
import { ElementData } from "@/types/editor";
import { useEditor } from "@/context/EditorContext";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from "@/components/ui/table";

interface TableElementProps {
  element: ElementData;
}

export const TableElement: React.FC<TableElementProps> = ({ element }) => {
  const { content, isSelected } = element;
  const { headers = [], rows = [] } = content;
  const { updateElement } = useEditor();
  const [localHeaders, setLocalHeaders] = useState<string[]>(headers);
  const [localRows, setLocalRows] = useState<Array<Array<string | number>>>(rows);
  const [rowHighlights, setRowHighlights] = useState<boolean[]>(Array(rows.length).fill(false));

  // Update local state when element content changes
  useEffect(() => {
    setLocalHeaders(headers);
    setLocalRows(rows);
    
    // Initialize highlights based on content
    if (content.rowHighlights && Array.isArray(content.rowHighlights)) {
      setRowHighlights(content.rowHighlights);
    } else {
      setRowHighlights(Array(rows.length).fill(false));
    }
  }, [headers, rows, content.rowHighlights]);

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

  const handleToggleRowHighlight = (rowIndex: number) => {
    if (!isSelected) return;
    
    const newHighlights = [...rowHighlights];
    newHighlights[rowIndex] = !newHighlights[rowIndex];
    setRowHighlights(newHighlights);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        rowHighlights: newHighlights,
      },
    });
  };

  const addRow = () => {
    if (!isSelected) return;
    
    const newRow = Array(localHeaders.length).fill("");
    const newRows = [...localRows, newRow];
    setLocalRows(newRows);
    
    const newHighlights = [...rowHighlights, false];
    setRowHighlights(newHighlights);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows,
        rowHighlights: newHighlights,
      },
    });
  };

  const addColumn = () => {
    if (!isSelected) return;
    
    const newHeaders = [...localHeaders, "New Column"];
    setLocalHeaders(newHeaders);
    
    const newRows = localRows.map(row => [...row, ""]);
    setLocalRows(newRows);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        rows: newRows,
      },
    });
  };

  return (
    <div className="w-full h-full overflow-auto p-0">
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow>
            {localHeaders.map((header, index) => (
              <TableHead key={index} className="border p-1 bg-gray-100">
                {isSelected ? (
                  <Input
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full h-7 p-1 text-sm font-bold"
                  />
                ) : (
                  <div className="p-1 text-sm font-bold">{header}</div>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {localRows.map((row, rowIndex) => (
            <TableRow 
              key={rowIndex} 
              className={`${rowHighlights[rowIndex] ? "bg-yellow-100" : ""} hover:bg-gray-50 cursor-pointer`}
              onClick={() => handleToggleRowHighlight(rowIndex)}
            >
              {row.map((cell, colIndex) => (
                <TableCell key={colIndex} className="border p-1">
                  {isSelected ? (
                    <Input
                      value={cell.toString()}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full h-7 p-1 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <div className="p-1 text-sm">{cell.toString()}</div>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {isSelected && (
        <div className="flex gap-2 mt-2 justify-end p-1">
          <button 
            onClick={addRow} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Add Row
          </button>
          <button 
            onClick={addColumn} 
            className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
          >
            Add Column
          </button>
        </div>
      )}
    </div>
  );
};
