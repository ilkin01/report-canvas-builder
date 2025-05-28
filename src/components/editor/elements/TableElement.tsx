
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, X, Plus, Minus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TableElementProps {
  element: ElementData;
}

type ColumnType = 'string' | 'boolean' | 'number';

export const TableElement: React.FC<TableElementProps> = ({ element }) => {
  const { content, isSelected } = element;
  const { headers = [], rows = [], columnTypes = [] } = content;
  const { updateElement } = useEditor();
  
  const [localHeaders, setLocalHeaders] = useState<string[]>(headers);
  const [localRows, setLocalRows] = useState<Array<Array<string | number | boolean>>>(rows);
  const [localColumnTypes, setLocalColumnTypes] = useState<ColumnType[]>(
    columnTypes.length > 0 ? columnTypes : Array(headers.length).fill('string')
  );
  const [rowHighlights, setRowHighlights] = useState<boolean[]>(Array(rows.length).fill(false));
  const [cellStatus, setCellStatus] = useState<Array<Array<'normal' | 'positive' | 'negative' | 'warning' | 'active'>>>(
    Array(rows.length).fill(0).map(() => Array(headers.length).fill('normal'))
  );

  // Update local state when element content changes
  useEffect(() => {
    setLocalHeaders(headers);
    setLocalRows(rows);
    setLocalColumnTypes(columnTypes.length > 0 ? columnTypes : Array(headers.length).fill('string'));
    
    if (content.rowHighlights && Array.isArray(content.rowHighlights)) {
      setRowHighlights(content.rowHighlights);
    } else {
      setRowHighlights(Array(rows.length).fill(false));
    }

    if (content.cellStatus && Array.isArray(content.cellStatus)) {
      setCellStatus(content.cellStatus);
    } else {
      setCellStatus(Array(rows.length).fill(0).map(() => Array(headers.length).fill('normal')));
    }
  }, [headers, rows, content.rowHighlights, content.cellStatus, columnTypes]);

  const updateTableData = (updates: any) => {
    updateElement(element.id, {
      content: {
        ...element.content,
        ...updates,
      },
    });
  };

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...localHeaders];
    newHeaders[index] = value;
    setLocalHeaders(newHeaders);
    updateTableData({ headers: newHeaders });
  };

  const handleColumnTypeChange = (index: number, type: ColumnType) => {
    const newColumnTypes = [...localColumnTypes];
    newColumnTypes[index] = type;
    setLocalColumnTypes(newColumnTypes);
    
    // Convert existing data in this column to match the new type
    const newRows = localRows.map(row => {
      const newRow = [...row];
      if (type === 'boolean') {
        newRow[index] = newRow[index] === 'true' || newRow[index] === true;
      } else if (type === 'number') {
        newRow[index] = Number(newRow[index]) || 0;
      } else {
        newRow[index] = String(newRow[index]);
      }
      return newRow;
    });
    
    setLocalRows(newRows);
    updateTableData({ 
      columnTypes: newColumnTypes,
      rows: newRows 
    });
  };

  const handleCellChange = (rowIndex: number, colIndex: number, value: string | boolean) => {
    const newRows = [...localRows];
    const columnType = localColumnTypes[colIndex];
    
    if (columnType === 'boolean') {
      newRows[rowIndex][colIndex] = value as boolean;
    } else if (columnType === 'number') {
      newRows[rowIndex][colIndex] = Number(value) || 0;
    } else {
      newRows[rowIndex][colIndex] = value as string;
    }
    
    setLocalRows(newRows);
    updateTableData({ rows: newRows });
  };

  const handleToggleRowHighlight = (rowIndex: number) => {
    if (!isSelected) return;
    
    const newHighlights = [...rowHighlights];
    newHighlights[rowIndex] = !newHighlights[rowIndex];
    setRowHighlights(newHighlights);
    updateTableData({ rowHighlights: newHighlights });
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
    updateTableData({ cellStatus: newCellStatus });
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
    
    const newRow = localColumnTypes.map(type => {
      switch(type) {
        case 'boolean': return false;
        case 'number': return 0;
        default: return "";
      }
    });
    
    const newRows = [...localRows, newRow];
    setLocalRows(newRows);
    
    const newHighlights = [...rowHighlights, false];
    setRowHighlights(newHighlights);

    const newCellStatus = [...cellStatus, Array(localHeaders.length).fill('normal' as const)];
    setCellStatus(newCellStatus);
    
    updateTableData({
      rows: newRows,
      rowHighlights: newHighlights,
      cellStatus: newCellStatus,
    });
  };

  const deleteRow = (rowIndex: number) => {
    if (!isSelected || localRows.length <= 1) return;
    
    const newRows = localRows.filter((_, index) => index !== rowIndex);
    const newHighlights = rowHighlights.filter((_, index) => index !== rowIndex);
    const newCellStatus = cellStatus.filter((_, index) => index !== rowIndex);
    
    setLocalRows(newRows);
    setRowHighlights(newHighlights);
    setCellStatus(newCellStatus);
    
    updateTableData({
      rows: newRows,
      rowHighlights: newHighlights,
      cellStatus: newCellStatus,
    });
  };

  const addColumn = () => {
    if (!isSelected) return;
    
    const newHeaders = [...localHeaders, "New Column"];
    const newColumnTypes = [...localColumnTypes, 'string' as ColumnType];
    setLocalHeaders(newHeaders);
    setLocalColumnTypes(newColumnTypes);
    
    const newRows = localRows.map(row => [...row, ""]);
    setLocalRows(newRows);

    const newCellStatus = cellStatus.map(row => [...row, 'normal' as const]);
    setCellStatus(newCellStatus);
    
    updateTableData({
      headers: newHeaders,
      columnTypes: newColumnTypes,
      rows: newRows,
      cellStatus: newCellStatus,
    });
  };

  const deleteColumn = (colIndex: number) => {
    if (!isSelected || localHeaders.length <= 1) return;
    
    const newHeaders = localHeaders.filter((_, index) => index !== colIndex);
    const newColumnTypes = localColumnTypes.filter((_, index) => index !== colIndex);
    const newRows = localRows.map(row => row.filter((_, index) => index !== colIndex));
    const newCellStatus = cellStatus.map(row => row.filter((_, index) => index !== colIndex));
    
    setLocalHeaders(newHeaders);
    setLocalColumnTypes(newColumnTypes);
    setLocalRows(newRows);
    setCellStatus(newCellStatus);
    
    updateTableData({
      headers: newHeaders,
      columnTypes: newColumnTypes,
      rows: newRows,
      cellStatus: newCellStatus,
    });
  };

  const renderCellContent = (value: any, rowIndex: number, colIndex: number) => {
    const columnType = localColumnTypes[colIndex];
    
    if (!isSelected) {
      if (columnType === 'boolean') {
        return (
          <div className="flex items-center justify-center">
            {value ? <Check className="h-4 w-4 text-green-600" /> : 
             value === false ? <X className="h-4 w-4 text-red-600" /> : 
             <Minus className="h-4 w-4 text-gray-400" />}
            {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
          </div>
        );
      }
      return (
        <div className="p-1 text-sm">
          {String(value)}
          {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
        </div>
      );
    }

    if (columnType === 'boolean') {
      return (
        <div className="flex items-center justify-center gap-2">
          <Select
            value={value === true ? 'true' : value === false ? 'false' : 'null'}
            onValueChange={(val) => {
              const boolValue = val === 'true' ? true : val === 'false' ? false : null;
              handleCellChange(rowIndex, colIndex, boolValue as boolean);
            }}
          >
            <SelectTrigger className="w-20 h-7">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              <SelectItem value="true">
                <Check className="h-4 w-4 text-green-600" />
              </SelectItem>
              <SelectItem value="false">
                <X className="h-4 w-4 text-red-600" />
              </SelectItem>
              <SelectItem value="null">
                <Minus className="h-4 w-4 text-gray-400" />
              </SelectItem>
            </SelectContent>
          </Select>
          {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <Input
          type={columnType === 'number' ? 'number' : 'text'}
          value={String(value)}
          onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
          className="w-full h-7 p-1 text-sm"
          onClick={(e) => e.stopPropagation()}
        />
        {getCellStatusIcon(cellStatus[rowIndex]?.[colIndex] || 'normal')}
      </div>
    );
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
                className="border p-1 relative" 
                style={{ backgroundColor: content.headerBgColor || '#f3f4f6' }}
              >
                <div className="space-y-1">
                  {isSelected ? (
                    <>
                      <Input
                        value={header}
                        onChange={(e) => handleHeaderChange(index, e.target.value)}
                        className="w-full h-6 p-1 text-sm font-bold mb-1"
                      />
                      <div className="flex items-center gap-1">
                        <Select
                          value={localColumnTypes[index]}
                          onValueChange={(value: ColumnType) => handleColumnTypeChange(index, value)}
                        >
                          <SelectTrigger className="w-full h-6 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border shadow-lg z-50">
                            <SelectItem value="string">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                        {localHeaders.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteColumn(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            title={`Delete column ${header}`}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-1 text-sm font-bold">{header}</div>
                  )}
                </div>
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
                  className={`border p-1 relative ${getCellStatusStyle(cellStatus[rowIndex]?.[colIndex] || 'normal')}`}
                  onClick={(e) => isSelected && e.ctrlKey ? cycleCellStatus(rowIndex, colIndex, e) : null}
                >
                  {renderCellContent(cell, rowIndex, colIndex)}
                  {isSelected && colIndex === 0 && localRows.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRow(rowIndex);
                      }}
                      className="absolute -right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      title={`Delete row ${rowIndex + 1}`}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {isSelected && (
        <div className="flex gap-2 mt-2 justify-between p-1">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={addRow} 
              className="h-8 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Row
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={addColumn} 
              className="h-8 px-3 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Column
            </Button>
          </div>
        </div>
      )}
      
      {isSelected && (
        <div className="text-xs text-gray-500 mt-2 p-1 space-y-1">
          <div>• Double-click page numbers to rename pages</div>
          <div>• Ctrl+Click on cells to toggle status (normal/positive/negative/warning/active)</div>
          <div>• Click on rows to highlight them</div>
          <div>• Set column types: Text, Number, or Boolean</div>
        </div>
      )}
    </div>
  );
};
