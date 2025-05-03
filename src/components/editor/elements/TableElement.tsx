
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
import { Check, AlertTriangle, X } from "lucide-react";

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
  const [cellStatus, setCellStatus] = useState<Array<Array<'normal' | 'positive' | 'negative' | 'warning' | 'active'>>>(
    Array(rows.length).fill(0).map(() => Array(headers.length).fill('normal'))
  );

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

    // Initialize cell status based on content
    if (content.cellStatus && Array.isArray(content.cellStatus)) {
      setCellStatus(content.cellStatus);
    } else {
      setCellStatus(Array(rows.length).fill(0).map(() => Array(headers.length).fill('normal')));
    }
  }, [headers, rows, content.rowHighlights, content.cellStatus]);

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

  const cycleCellStatus = (rowIndex: number, colIndex: number, e: React.MouseEvent) => {
    if (!isSelected) return;
    e.stopPropagation();
    
    const statuses: Array<'normal' | 'positive' | 'negative' | 'warning' | 'active'> = ['normal', 'positive', 'negative', 'warning', 'active'];
    const newCellStatus = [...cellStatus];
    
    const currentStatusIndex = statuses.indexOf(newCellStatus[rowIndex][colIndex]);
    const nextStatusIndex = (currentStatusIndex + 1) % statuses.length;
    
    newCellStatus[rowIndex][colIndex] = statuses[nextStatusIndex];
    setCellStatus(newCellStatus);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        cellStatus: newCellStatus,
      },
    });
  };

  const getCellStatusStyle = (status: 'normal' | 'positive' | 'negative' | 'warning' | 'active') => {
    switch(status) {
      case 'positive':
        return 'bg-green-100 font-medium';
      case 'negative': 
        return 'bg-red-100 font-medium';
      case 'warning':
        return 'bg-yellow-100 font-medium';
      case 'active':
        return 'bg-blue-100 font-medium';
      default:
        return '';
    }
  };

  const getCellStatusIcon = (status: 'normal' | 'positive' | 'negative' | 'warning' | 'active') => {
    switch(status) {
      case 'positive':
        return <Check className="h-3 w-3 text-green-600 inline ml-1" />;
      case 'negative':
        return <X className="h-3 w-3 text-red-600 inline ml-1" />;
      case 'warning':
        return <AlertTriangle className="h-3 w-3 text-amber-500 inline ml-1" />;
      case 'active':
        return <Check className="h-3 w-3 text-blue-600 inline ml-1" />;
      default:
        return null;
    }
  };

  const addRow = () => {
    if (!isSelected) return;
    
    const newRow = Array(localHeaders.length).fill("");
    const newRows = [...localRows, newRow];
    setLocalRows(newRows);
    
    const newHighlights = [...rowHighlights, false];
    setRowHighlights(newHighlights);

    // Fixed this line to properly type the new cell status array
    const newCellStatus = [...cellStatus, Array(localHeaders.length).fill('normal' as 'normal' | 'positive' | 'negative' | 'warning' | 'active')];
    setCellStatus(newCellStatus);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        rows: newRows,
        rowHighlights: newHighlights,
        cellStatus: newCellStatus,
      },
    });
  };

  const addColumn = () => {
    if (!isSelected) return;
    
    const newHeaders = [...localHeaders, "New Column"];
    setLocalHeaders(newHeaders);
    
    const newRows = localRows.map(row => [...row, ""]);
    setLocalRows(newRows);

    // Fixed this line to properly type the new cell status array
    const newCellStatus = cellStatus.map(row => [...row, 'normal' as 'normal' | 'positive' | 'negative' | 'warning' | 'active']);
    setCellStatus(newCellStatus);
    
    updateElement(element.id, {
      content: {
        ...element.content,
        headers: newHeaders,
        rows: newRows,
        cellStatus: newCellStatus,
      },
    });
  };

  return (
    <div className="w-full h-full overflow-auto p-0">
      {content.title && (
        <div className="text-center font-bold pb-2">{content.title}</div>
      )}
      <Table className="w-full border-collapse">
        <TableHeader>
          <TableRow>
            {localHeaders.map((header, index) => (
              <TableHead 
                key={index} 
                className="border p-1" 
                style={{ backgroundColor: content.headerBgColor || '#f3f4f6' }}
              >
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
              className={`${rowHighlights[rowIndex] ? `bg-${content.highlightColor || 'yellow-100'}` : ""} hover:bg-gray-50 cursor-pointer`}
              onClick={() => handleToggleRowHighlight(rowIndex)}
            >
              {row.map((cell, colIndex) => (
                <TableCell 
                  key={colIndex} 
                  className={`border p-1 ${getCellStatusStyle(cellStatus[rowIndex]?.[colIndex] || 'normal')}`}
                  onClick={(e) => isSelected && e.ctrlKey ? cycleCellStatus(rowIndex, colIndex, e) : null}
                >
                  {isSelected ? (
                    <div className="flex items-center">
                      <Input
                        value={cell.toString()}
                        onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                        className="w-full h-7 p-1 text-sm"
                        onClick={(e) => e.stopPropagation()}
                      />
                      {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
                    </div>
                  ) : (
                    <div className="p-1 text-sm">
                      {cell.toString()}
                      {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
                    </div>
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
      {isSelected && (
        <div className="text-xs text-gray-500 mt-2 p-1">
          Tip: Ctrl+Click on cells to toggle status (normal/positive/negative/warning/active)
        </div>
      )}
    </div>
  );
};
