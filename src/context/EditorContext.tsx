import React, { createContext, useContext, useReducer, useEffect } from "react";
import { CanvasState, ElementData, Page, ReportDocument, Template } from "@/types/editor";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById, systemTemplates } from "@/lib/templates";
import { toast } from "sonner";

type EditorAction =
  | { type: "ADD_ELEMENT"; payload: { element: ElementData; pageIndex?: number } }
  | { type: "UPDATE_ELEMENT"; payload: { id: string; updates: Partial<ElementData>; pageIndex?: number } }
  | { type: "DELETE_ELEMENT"; payload: { id: string; pageIndex?: number } }
  | { type: "SELECT_ELEMENT"; payload: { id: string } }
  | { type: "CLEAR_SELECTION" }
  | { type: "LOAD_TEMPLATE"; payload: { templateId: string } }
  | { type: "SAVE_CANVAS" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ACTIVE_TAB"; payload: { tabId: string } }
  | { type: "CREATE_REPORT"; payload: { name: string; templateId: string } }
  | { type: "CLOSE_REPORT"; payload: { id: string } }
  | { type: "ADD_PAGE"; payload: { name: string } }
  | { type: "REMOVE_PAGE"; payload: { pageIndex: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { pageIndex: number } }
  | { type: "RENAME_PAGE"; payload: { pageIndex: number; name: string } }
  | { type: "AUTO_SAVE" };

interface EditorContextType {
  canvasState: CanvasState;
  openReports: ReportDocument[];
  activeReportId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  addElement: (element: Omit<ElementData, "id">, pageIndex?: number) => void;
  updateElement: (id: string, updates: Partial<ElementData>, pageIndex?: number) => void;
  deleteElement: (id: string, pageIndex?: number) => void;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  loadTemplate: (templateId: string) => void;
  saveCanvas: () => void;
  undo: () => void;
  redo: () => void;
  createReport: (name: string, templateId: string) => void;
  closeReport: (id: string) => void;
  setActiveReport: (id: string) => void;
  getActiveReport: () => ReportDocument | null;
  addPage: (name: string) => void;
  removePage: (pageIndex: number) => void;
  setCurrentPage: (pageIndex: number) => void;
  renamePage: (pageIndex: number, name: string) => void;
}

const initialCanvasState: CanvasState = {
  pages: [
    {
      id: uuidv4(),
      name: "Page 1",
      elements: []
    }
  ],
  currentPageIndex: 0,
  selectedElementIds: [],
  history: {
    past: [],
    future: [],
  },
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

// Group changes within a timeframe for improved undo functionality
const HISTORY_BATCH_TIME = 2000; // 2 seconds between history snapshots
let lastHistoryUpdate = Date.now();

const editorReducer = (
  state: {
    canvasState: CanvasState;
    openReports: ReportDocument[];
    activeReportId: string | null;
  },
  action: EditorAction
) => {
  switch (action.type) {
    case "ADD_ELEMENT": {
      const { element, pageIndex = state.canvasState.currentPageIndex } = action.payload;
      const newElement = { ...element };
      
      const updatedPages = [...state.canvasState.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        elements: [...updatedPages[pageIndex].elements, newElement]
      };
      
      const now = Date.now();
      const shouldAddHistory = now - lastHistoryUpdate > HISTORY_BATCH_TIME;
      
      if (shouldAddHistory) {
        lastHistoryUpdate = now;
      }

      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        history: shouldAddHistory ? {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        } : state.canvasState.history,
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "UPDATE_ELEMENT": {
      const { id, updates, pageIndex = state.canvasState.currentPageIndex } = action.payload;
      
      const updatedPages = [...state.canvasState.pages];
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        elements: updatedPages[pageIndex].elements.map(elem => 
          elem.id === id ? { ...elem, ...updates } : elem
        )
      };
      
      const now = Date.now();
      const shouldAddHistory = now - lastHistoryUpdate > HISTORY_BATCH_TIME;
      
      if (shouldAddHistory) {
        lastHistoryUpdate = now;
      }

      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        history: shouldAddHistory ? {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        } : state.canvasState.history,
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "DELETE_ELEMENT": {
      const { id, pageIndex = state.canvasState.currentPageIndex } = action.payload;
      console.log("Reducer: DELETE_ELEMENT action received for element ID:", id);
      
      const updatedPages = [...state.canvasState.pages];
      const currentPageElements = updatedPages[pageIndex].elements;
      
      // Check if the element exists before trying to delete it
      const elementExists = currentPageElements.some(elem => elem.id === id);
      
      if (!elementExists) {
        console.error("Element not found for deletion:", id);
        return state;
      }
      
      updatedPages[pageIndex] = {
        ...updatedPages[pageIndex],
        elements: currentPageElements.filter(elem => elem.id !== id)
      };
      
      console.log("Elements before deletion:", currentPageElements.length);
      console.log("Elements after deletion:", updatedPages[pageIndex].elements.length);

      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        selectedElementIds: state.canvasState.selectedElementIds.filter(
          elemId => elemId !== id
        ),
        history: {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "SELECT_ELEMENT": {
      const currentPageIndex = state.canvasState.currentPageIndex;
      const updatedPages = [...state.canvasState.pages];
      
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        elements: updatedPages[currentPageIndex].elements.map(elem => ({
          ...elem,
          isSelected: elem.id === action.payload.id,
        }))
      };

      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: [action.payload.id],
          pages: updatedPages
        },
      };
    }
    case "CLEAR_SELECTION": {
      const currentPageIndex = state.canvasState.currentPageIndex;
      const updatedPages = [...state.canvasState.pages];
      
      updatedPages[currentPageIndex] = {
        ...updatedPages[currentPageIndex],
        elements: updatedPages[currentPageIndex].elements.map(elem => ({
          ...elem,
          isSelected: false,
        }))
      };

      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: [],
          pages: updatedPages
        },
      };
    }
    case "LOAD_TEMPLATE": {
      const template = getTemplateById(action.payload.templateId);
      
      if (!template) {
        return state;
      }
      
      const newPages = [{
        id: uuidv4(),
        name: "Page 1",
        elements: [...template.elements]
      }];
      
      const newCanvasState = {
        ...state.canvasState,
        pages: newPages,
        currentPageIndex: 0,
        selectedElementIds: [],
        history: {
          past: [],
          future: [],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { 
              ...report, 
              pages: newPages, 
              templateId: template.id,
              updatedAt: new Date().toISOString() 
            }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "AUTO_SAVE":
    case "SAVE_CANVAS": {
      // Just show a confirmation for explicit saves
      if (action.type === "SAVE_CANVAS") {
        toast.success("Report saved successfully");
      }
      return state;
    }
    case "UNDO": {
      if (state.canvasState.history.past.length === 0) {
        return state;
      }

      // For improved undo, jump back multiple steps if they were made within a short time
      let newPast = [...state.canvasState.history.past];
      let previous = newPast.pop(); // Get the most recent past state
      let newFuture = [state.canvasState.pages, ...state.canvasState.history.future];
      
      const newCanvasState = {
        ...state.canvasState,
        pages: previous,
        history: {
          past: newPast,
          future: newFuture,
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: previous, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "REDO": {
      if (state.canvasState.history.future.length === 0) {
        return state;
      }

      const next = state.canvasState.history.future[0];
      const newFuture = state.canvasState.history.future.slice(1);

      const newCanvasState = {
        ...state.canvasState,
        pages: next,
        history: {
          past: [...state.canvasState.history.past, state.canvasState.pages],
          future: newFuture,
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: next, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "CREATE_REPORT": {
      const { name, templateId } = action.payload;
      const template = getTemplateById(templateId);
      
      if (!template) {
        return state;
      }
      
      const newReportId = uuidv4();
      const initialPages = [{
        id: uuidv4(),
        name: "Page 1",
        elements: [...template.elements]
      }];
      
      const newReport: ReportDocument = {
        id: newReportId,
        name,
        templateId,
        pages: initialPages,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        openReports: [...state.openReports, newReport],
        activeReportId: newReportId,
        canvasState: {
          pages: initialPages,
          currentPageIndex: 0,
          selectedElementIds: [],
          history: {
            past: [],
            future: [],
          },
        },
      };
    }
    case "CLOSE_REPORT": {
      const updatedReports = state.openReports.filter(report => report.id !== action.payload.id);
      
      // If closing the active report, activate another one if available
      let newActiveId = state.activeReportId;
      if (state.activeReportId === action.payload.id) {
        newActiveId = updatedReports.length > 0 ? updatedReports[0].id : null;
      }
      
      // Update canvas state if we're switching to another report
      let newCanvasState = state.canvasState;
      if (newActiveId && newActiveId !== state.activeReportId) {
        const activeReport = updatedReports.find(report => report.id === newActiveId);
        if (activeReport) {
          newCanvasState = {
            pages: [...activeReport.pages],
            currentPageIndex: 0,
            selectedElementIds: [],
            history: {
              past: [],
              future: [],
            },
          };
        }
      } else if (!newActiveId) {
        // No reports left, clear canvas
        newCanvasState = initialCanvasState;
      }
      
      return {
        ...state,
        openReports: updatedReports,
        activeReportId: newActiveId,
        canvasState: newCanvasState,
      };
    }
    case "SET_ACTIVE_TAB": {
      const { tabId } = action.payload;
      const activeReport = state.openReports.find(report => report.id === tabId);
      
      if (!activeReport) {
        return state;
      }
      
      return {
        ...state,
        activeReportId: tabId,
        canvasState: {
          pages: [...activeReport.pages],
          currentPageIndex: 0,
          selectedElementIds: [],
          history: {
            past: [],
            future: [],
          },
        },
      };
    }
    case "ADD_PAGE": {
      const { name } = action.payload;
      const newPage: Page = {
        id: uuidv4(),
        name,
        elements: []
      };
      
      const updatedPages = [...state.canvasState.pages, newPage];
      const newCurrentIndex = updatedPages.length - 1;
      
      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        currentPageIndex: newCurrentIndex,
        history: {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        },
      };
      
      // Update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );
      
      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "REMOVE_PAGE": {
      const { pageIndex } = action.payload;
      
      // Don't allow removing the last page
      if (state.canvasState.pages.length <= 1) {
        toast.error("Cannot remove the last page");
        return state;
      }
      
      const updatedPages = state.canvasState.pages.filter((_, index) => index !== pageIndex);
      const newCurrentIndex = Math.min(state.canvasState.currentPageIndex, updatedPages.length - 1);
      
      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        currentPageIndex: newCurrentIndex,
        history: {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        },
      };
      
      // Update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );
      
      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "SET_CURRENT_PAGE": {
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          currentPageIndex: action.payload.pageIndex,
        },
      };
    }
    case "RENAME_PAGE": {
      const { pageIndex, name } = action.payload;
      
      const updatedPages = [...state.canvasState.pages];
      if (pageIndex >= 0 && pageIndex < updatedPages.length) {
        updatedPages[pageIndex] = {
          ...updatedPages[pageIndex],
          name
        };
      }
      
      const newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        history: {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        },
      };
      
      // Update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: updatedPages, updatedAt: new Date().toISOString() }
          : report
      );
      
      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    default:
      return state;
  }
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, {
    canvasState: initialCanvasState,
    openReports: [],
    activeReportId: null,
  });

  // Set up autosave
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (state.activeReportId) {
        dispatch({ type: "AUTO_SAVE" });
      }
    }, 30000); // Auto save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [state.activeReportId]);

  // Add autosave on content changes
  useEffect(() => {
    if (state.activeReportId && state.canvasState.pages.length > 0) {
      // Don't display toast notification for auto saves
      dispatch({ type: "AUTO_SAVE" });
    }
  }, [state.canvasState.pages]);

  const addElement = (element: Omit<ElementData, "id">, pageIndex?: number) => {
    const newElement = {
      ...element,
      id: uuidv4(),
    };
    dispatch({ type: "ADD_ELEMENT", payload: { element: newElement as ElementData, pageIndex } });
  };

  const updateElement = (id: string, updates: Partial<ElementData>, pageIndex?: number) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates, pageIndex } });
  };

  const deleteElement = (id: string, pageIndex?: number) => {
    console.log("Deleting element:", id);
    if (!id) {
      console.error("Attempted to delete element with no ID");
      toast.error("Cannot delete element: No element ID provided");
      return;
    }
    
    // Check if there's an active report
    if (!state.activeReportId) {
      console.error("Cannot delete element: No active report");
      toast.error("Cannot delete element: No active report");
      return;
    }
    
    dispatch({ type: "DELETE_ELEMENT", payload: { id, pageIndex } });
    toast.success("Element deleted successfully");
  };

  const selectElement = (id: string) => {
    dispatch({ type: "SELECT_ELEMENT", payload: { id } });
  };

  const clearSelection = () => {
    dispatch({ type: "CLEAR_SELECTION" });
  };

  const loadTemplate = (templateId: string) => {
    dispatch({ type: "LOAD_TEMPLATE", payload: { templateId } });
  };

  const saveCanvas = () => {
    dispatch({ type: "SAVE_CANVAS" });
  };

  const undo = () => {
    dispatch({ type: "UNDO" });
  };

  const redo = () => {
    dispatch({ type: "REDO" });
  };
  
  const createReport = (name: string, templateId: string) => {
    dispatch({ type: "CREATE_REPORT", payload: { name, templateId } });
  };
  
  const closeReport = (id: string) => {
    dispatch({ type: "CLOSE_REPORT", payload: { id } });
  };
  
  const setActiveReport = (id: string) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: { tabId: id } });
  };
  
  const getActiveReport = () => {
    return state.openReports.find(report => report.id === state.activeReportId) || null;
  };

  const addPage = (name: string) => {
    dispatch({ type: "ADD_PAGE", payload: { name } });
  };

  const removePage = (pageIndex: number) => {
    dispatch({ type: "REMOVE_PAGE", payload: { pageIndex } });
  };

  const setCurrentPage = (pageIndex: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: { pageIndex } });
  };

  const renamePage = (pageIndex: number, name: string) => {
    dispatch({ type: "RENAME_PAGE", payload: { pageIndex, name } });
  };

  return (
    <EditorContext.Provider
      value={{
        canvasState: state.canvasState,
        openReports: state.openReports,
        activeReportId: state.activeReportId,
        dispatch,
        addElement,
        updateElement,
        deleteElement,
        selectElement,
        clearSelection,
        loadTemplate,
        saveCanvas,
        undo,
        redo,
        createReport,
        closeReport,
        setActiveReport,
        getActiveReport,
        addPage,
        removePage,
        setCurrentPage,
        renamePage,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = (): EditorContextType => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error("useEditor must be used within an EditorProvider");
  }
  return context;
};
