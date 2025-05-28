
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Plus, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useState, useCallback } from "react";

export const PageControls = () => {
  const { 
    canvasState, 
    addPage, 
    setCurrentPage, 
    renamePage,
    removePage 
  } = useEditor();
  
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [newPageName, setNewPageName] = useState("");
  
  const { pages, currentPageIndex } = canvasState;
  
  const handleAddPage = useCallback(() => {
    addPage(`Page ${pages.length + 1}`);
  }, [pages.length, addPage]);
  
  const handlePageClick = (index: number) => {
    if (index !== currentPageIndex) {
      setCurrentPage(index);
    }
  };
  
  const handleDeletePage = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (pages.length > 1) {
      removePage(index);
    }
  };
  
  const startEditingPage = (index: number) => {
    setEditingPageIndex(index);
    setNewPageName(pages[index].name);
  };
  
  const handleRenameSubmit = (e: React.FormEvent, index: number) => {
    e.preventDefault();
    if (newPageName.trim()) {
      renamePage(index, newPageName.trim());
      setEditingPageIndex(null);
    }
  };
  
  const renderPaginationItems = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPageIndex - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages.length - 1, startPage + maxVisiblePages - 1);
    
    startPage = Math.max(0, endPage - maxVisiblePages + 1);
    
    const items = [];
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          {editingPageIndex === i ? (
            <form onSubmit={(e) => handleRenameSubmit(e, i)} className="flex">
              <Input
                autoFocus
                value={newPageName}
                onChange={(e) => setNewPageName(e.target.value)}
                onBlur={() => setEditingPageIndex(null)}
                className="w-20 h-8 px-2"
              />
            </form>
          ) : (
            <div className="flex items-center gap-1">
              <PaginationLink
                isActive={i === currentPageIndex}
                onClick={() => handlePageClick(i)}
                onDoubleClick={() => startEditingPage(i)}
                className="cursor-pointer"
              >
                {i + 1}
              </PaginationLink>
              {pages.length > 1 && (
                <button
                  onClick={(e) => handleDeletePage(e, i)}
                  className="rounded-full hover:bg-red-100 p-1 text-red-500 hover:text-red-700 transition-colors"
                  title={`Delete page ${i + 1}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
        </PaginationItem>
      );
    }
    
    return items;
  };
  
  const hasPrevious = currentPageIndex > 0;
  const hasNext = currentPageIndex < pages.length - 1;
  
  return (
    <div className="border-b border-t p-2 flex flex-col gap-2 bg-muted/40">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-medium">Pages</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAddPage}
          className="h-8 px-2"
          title="Add new page"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <Pagination>
        <PaginationContent className="flex-wrap">
          <PaginationItem>
            <PaginationPrevious
              onClick={() => hasPrevious && setCurrentPage(currentPageIndex - 1)}
              className={`cursor-pointer ${!hasPrevious ? 'opacity-50 pointer-events-none' : ''}`}
            />
          </PaginationItem>
          
          {renderPaginationItems()}
          
          <PaginationItem>
            <PaginationNext
              onClick={() => hasNext && setCurrentPage(currentPageIndex + 1)}
              className={`cursor-pointer ${!hasNext ? 'opacity-50 pointer-events-none' : ''}`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
};
