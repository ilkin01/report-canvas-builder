
import { Button } from "@/components/ui/button";
import { useEditor } from "@/context/EditorContext";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";

export const PageControls = () => {
  const { 
    canvasState, 
    addPage, 
    removePage, 
    setCurrentPage, 
    renamePage 
  } = useEditor();
  
  const [editingPageIndex, setEditingPageIndex] = useState<number | null>(null);
  const [newPageName, setNewPageName] = useState("");
  
  const { pages, currentPageIndex } = canvasState;
  const currentPage = pages[currentPageIndex];
  
  const handleAddPage = () => {
    addPage(`Page ${pages.length + 1}`);
    toast.success(`Added new page: Page ${pages.length + 1}`);
  };
  
  const handlePageClick = (index: number) => {
    if (index !== currentPageIndex) {
      setCurrentPage(index);
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
    // Show 5 pages max with current page in the middle if possible
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPageIndex - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pages.length - 1, startPage + maxVisiblePages - 1);
    
    // Adjust start if end is maxed out
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
            <PaginationLink
              isActive={i === currentPageIndex}
              onClick={() => handlePageClick(i)}
              onDoubleClick={() => startEditingPage(i)}
              className="cursor-pointer"
            >
              {i + 1}
            </PaginationLink>
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
