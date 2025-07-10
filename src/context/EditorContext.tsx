
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { CanvasState, ElementData, Page, ReportDocument } from "@/types/editor";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById } from "@/lib/templates";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { updateReportPages } from "@/redux/slices/reportsSlice";

// A4 dimensions (in pixels at 72 DPI)
const A4_WIDTH_PX = 595;
const A4_HEIGHT_PX = 842;

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
  | { type: "LOAD_REPORT_DATA"; payload: { report: ReportDocument | null } } 
  | { type: "ADD_PAGE"; payload: { name: string } }
  | { type: "REMOVE_PAGE"; payload: { pageIndex: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { pageIndex: number } }
  | { type: "RENAME_PAGE"; payload: { pageIndex: number; name: string } }
  | { type: "AUTO_SAVE" };

interface EditorContextType {
  canvasState: CanvasState;
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
  setActiveReport: (report: ReportDocument | null) => void; 
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
      elements: [],
      width: A4_WIDTH_PX,
      height: A4_HEIGHT_PX
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

const HISTORY_BATCH_TIME = 2000;
let lastHistoryUpdate = Date.now();

interface EditorReducerState {
  canvasState: CanvasState;
  openReports: ReportDocument[]; 
  activeReportId: string | null; 
}

const initialEditorReducerState: EditorReducerState = {
  canvasState: initialCanvasState,
  openReports: [],
  activeReportId: null,
};


const editorReducer = (
  state: EditorReducerState,
  action: EditorAction
): EditorReducerState => {
  switch (action.type) {
    case "ADD_ELEMENT":
    case "UPDATE_ELEMENT":
    case "DELETE_ELEMENT":
    case "ADD_PAGE":
    case "REMOVE_PAGE":
    case "RENAME_PAGE": {
      let newCanvasState: CanvasState;
      let updatedPages: Page[];

      switch (action.type) {
        case "ADD_ELEMENT": {
          const { element, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          const newElement = { ...element };
          updatedPages = [...state.canvasState.pages];
          if (pageIndex >= 0 && pageIndex < updatedPages.length) {
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              elements: [...updatedPages[pageIndex].elements, newElement]
            };
          } else {
            console.error(`ADD_ELEMENT: pageIndex ${pageIndex} is out of bounds. Max index is ${updatedPages.length -1}.`);
            return state;
          }
          break;
        }
        case "UPDATE_ELEMENT": {
          const { id, updates, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          updatedPages = [...state.canvasState.pages];
          if (pageIndex >= 0 && pageIndex < updatedPages.length) {
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              elements: updatedPages[pageIndex].elements.map(elem =>
                elem.id === id ? { ...elem, ...updates } : elem
              )
            };
          } else {
             return state; // pageIndex out of bounds
          }
          break;
        }
        case "DELETE_ELEMENT": {
          const { id, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          updatedPages = [...state.canvasState.pages];
          if (pageIndex >= 0 && pageIndex < updatedPages.length) {
            const currentPageElements = updatedPages[pageIndex].elements;
            const elementExists = currentPageElements.some(elem => elem.id === id);
            if (!elementExists) return state; 
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              elements: currentPageElements.filter(elem => elem.id !== id)
            };
          } else {
            return state; // pageIndex out of bounds
          }
          break;
        }
        case "ADD_PAGE": {
          const { name } = action.payload;
          const currentPageForSize = state.canvasState.pages[state.canvasState.currentPageIndex];
          const newPage: Page = {
            id: uuidv4(),
            name,
            elements: [],
            width: currentPageForSize?.width || A4_WIDTH_PX, // Inherit or default to A4
            height: currentPageForSize?.height || A4_HEIGHT_PX // Inherit or default to A4
          };
          updatedPages = [...state.canvasState.pages, newPage];
          break;
        }
        case "REMOVE_PAGE": {
          const { pageIndex } = action.payload;
          if (state.canvasState.pages.length <= 1) {
            toast.error("Cannot remove the last page");
            return state;
          }
          updatedPages = state.canvasState.pages.filter((_, index) => index !== pageIndex);
          break;
        }
        case "RENAME_PAGE": {
          const { pageIndex, name } = action.payload;
          updatedPages = [...state.canvasState.pages];
          if (pageIndex >= 0 && pageIndex < updatedPages.length) {
            updatedPages[pageIndex] = { ...updatedPages[pageIndex], name };
          }
          break;
        }
        default:
          updatedPages = [...state.canvasState.pages]; 
      }
      
      const now = Date.now();
      const shouldAddHistory = now - lastHistoryUpdate > HISTORY_BATCH_TIME || action.type === "DELETE_ELEMENT" || action.type === "ADD_PAGE" || action.type === "REMOVE_PAGE" || action.type === "RENAME_PAGE";
      if (shouldAddHistory) lastHistoryUpdate = now;

      newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        currentPageIndex: action.type === "REMOVE_PAGE" ? Math.min(state.canvasState.currentPageIndex, updatedPages.length - 1) : 
                          action.type === "ADD_PAGE" ? updatedPages.length - 1 : // Set current page to newly added page
                          state.canvasState.currentPageIndex,
        selectedElementIds: action.type === "DELETE_ELEMENT" ? state.canvasState.selectedElementIds.filter(elemId => elemId !== (action as any).payload.id) : state.canvasState.selectedElementIds,
        history: shouldAddHistory ? {
          past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
          future: [],
        } : state.canvasState.history,
      };

      const updatedOpenReports = state.openReports.map(report =>
        report.id === state.activeReportId
          ? { ...report, pages: newCanvasState.pages, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedOpenReports,
      };
    }

    case "SELECT_ELEMENT": {
      const currentPageIndex = state.canvasState.currentPageIndex;
      const updatedPages = [...state.canvasState.pages];
      
      if (!updatedPages[currentPageIndex]) return state;

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
      
      if (!updatedPages[currentPageIndex]) return state;
      
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
      if (!template) return state;

      const newPages = [{
        id: uuidv4(),
        name: "Page 1", // Or template.name if available
        elements: JSON.parse(JSON.stringify(template.elements)),
        width: A4_WIDTH_PX, // Use A4 default
        height: A4_HEIGHT_PX // Use A4 default
      }];

      const newCanvasState = {
        ...state.canvasState,
        pages: newPages,
        currentPageIndex: 0,
        selectedElementIds: [],
        history: { past: [], future: [] },
      };
      
      const updatedOpenReports = state.openReports.map(report =>
        report.id === state.activeReportId
          ? { ...report, pages: newPages, templateId: template.id, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedOpenReports
      };
    }

    case "AUTO_SAVE": 
    case "SAVE_CANVAS": { 
      if (action.type === "SAVE_CANVAS") {
        toast.info("Saving report..."); 
      }
      return state; 
    }
    case "UNDO": {
      if (state.canvasState.history.past.length === 0) {
        return state;
      }

      let newPast = [...state.canvasState.history.past];
      let previousPagesState = newPast.pop()!; 
       if (!Array.isArray(previousPagesState) || (previousPagesState.length > 0 && !previousPagesState[0].elements)) {
         console.error("Invalid state in history.past:", previousPagesState);
         return state; 
       }

      let newFuture = [JSON.parse(JSON.stringify(state.canvasState.pages)), ...state.canvasState.history.future];
      
      const newCanvasState = {
        ...state.canvasState,
        pages: previousPagesState, 
        selectedElementIds: [], 
        history: {
          past: newPast,
          future: newFuture,
        },
      };

      const updatedOpenReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, pages: previousPagesState, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedOpenReports,
      };
    }
    case "REDO": {
      if (state.canvasState.history.future.length === 0) {
        return state;
      }

      const nextPagesState = state.canvasState.history.future[0];
      if (!Array.isArray(nextPagesState) || (nextPagesState.length > 0 && !nextPagesState[0].elements)) {
          console.error("Invalid state in history.future:", nextPagesState);
          return state;
       }
       const newFuture = state.canvasState.history.future.slice(1);
 
       const newCanvasState = {
         ...state.canvasState,
         pages: nextPagesState, 
         selectedElementIds: [], 
         history: {
           past: [...state.canvasState.history.past, JSON.parse(JSON.stringify(state.canvasState.pages))],
           future: newFuture,
         },
       };

       const updatedOpenReports = state.openReports.map(report => 
         report.id === state.activeReportId 
           ? { ...report, pages: nextPagesState, updatedAt: new Date().toISOString() }
           : report
       );

       return {
         ...state,
         canvasState: newCanvasState,
         openReports: updatedOpenReports,
       };
     }

    case "LOAD_REPORT_DATA": {
      const { report } = action.payload;
      if (report) {
        const reportPagesWithDefaults = report.pages.map(p => ({
          ...p,
          width: p.width || A4_WIDTH_PX, // Default to A4
          height: p.height || A4_HEIGHT_PX, // Default to A4
        }));
        
        const reportPagesString = JSON.stringify(reportPagesWithDefaults);

        if (state.activeReportId === report.id && 
            JSON.stringify(state.canvasState.pages) === reportPagesString) {
          console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Pages are already current. Canvas state will not change.`);
          
          const existingReportIndex = state.openReports.findIndex(r => r.id === report.id);
          let reportNeedsUpdateInCache = true;
          if (existingReportIndex > -1) {
             const cachedReportCopy = JSON.parse(JSON.stringify(state.openReports[existingReportIndex]));
             const incomingReportWithDefaultPages = {...report, pages: reportPagesWithDefaults};
             if (JSON.stringify(cachedReportCopy) === JSON.stringify(incomingReportWithDefaultPages)) {
                reportNeedsUpdateInCache = false;
             }
          }

          if (reportNeedsUpdateInCache) {
            console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Updating openReports cache only (metadata or defaults).`);
            let updatedOpenReports;
            const reportToCache = {...report, pages: reportPagesWithDefaults}; 
            if (existingReportIndex > -1) {
              updatedOpenReports = [...state.openReports];
              updatedOpenReports[existingReportIndex] = JSON.parse(JSON.stringify(reportToCache));
            } else {
              updatedOpenReports = [...state.openReports, JSON.parse(JSON.stringify(reportToCache))];
            }
            return { ...state, openReports: updatedOpenReports, activeReportId: report.id }; 
          }
          if (state.activeReportId !== report.id) {
            return { ...state, activeReportId: report.id };
          }
          return state; 
        }
        
        console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Updating canvasState and openReports cache.`);
        const existingReportIndex = state.openReports.findIndex(r => r.id === report.id);
        let updatedOpenReports;
        const reportToCache = {...report, pages: reportPagesWithDefaults};

        if (existingReportIndex > -1) {
          updatedOpenReports = [...state.openReports];
          updatedOpenReports[existingReportIndex] = JSON.parse(JSON.stringify(reportToCache));
        } else {
          updatedOpenReports = [...state.openReports, JSON.parse(JSON.stringify(reportToCache))];
        }
        
        return {
          ...state,
          activeReportId: report.id,
          canvasState: {
            ...initialCanvasState, 
            pages: reportPagesWithDefaults, 
            currentPageIndex: 0, 
            selectedElementIds: [],
          },
          openReports: updatedOpenReports,
        };
      } else {
        console.log("EditorContext: LOAD_REPORT_DATA with null report. Clearing active report and canvas state.");
        return {
          ...state,
          activeReportId: null,
          canvasState: initialCanvasState,
        };
      }
    }
    
    case "SET_CURRENT_PAGE": {
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          currentPageIndex: action.payload.pageIndex,
          selectedElementIds: [], 
        },
      };
    }
    default:
      return state;
  }
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialEditorReducerState);
  const reduxDispatch = useAppDispatch();

  useEffect(() => {
    if (state.activeReportId && state.canvasState.pages) {
      const activeReportInContextCache = state.openReports.find(r => r.id === state.activeReportId);
      if (activeReportInContextCache && JSON.stringify(activeReportInContextCache.pages) !== JSON.stringify(state.canvasState.pages)) {
         console.log("EditorContext: Page content changed for active report. Syncing to Redux via updateReportPages.");
         reduxDispatch(updateReportPages({
           reportId: state.activeReportId,
           pages: JSON.parse(JSON.stringify(state.canvasState.pages)) 
         }));
      } else if (!activeReportInContextCache && state.canvasState.pages.length > 0) {
        console.log("EditorContext: Active report not in context cache or pages mismatch significantly, syncing to Redux.");
        reduxDispatch(updateReportPages({
          reportId: state.activeReportId,
          pages: JSON.parse(JSON.stringify(state.canvasState.pages))
        }));
      }
    }
  }, [state.canvasState.pages, state.activeReportId, state.openReports, reduxDispatch]);

  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (state.activeReportId && state.canvasState.pages.length > 0) { 
        const activeReportInContextCache = state.openReports.find(r => r.id === state.activeReportId);
        if (!activeReportInContextCache || JSON.stringify(activeReportInContextCache.pages) !== JSON.stringify(state.canvasState.pages)) {
           console.log("EditorContext: Auto-saving changes to Redux.");
           reduxDispatch(updateReportPages({
             reportId: state.activeReportId,
             pages: JSON.parse(JSON.stringify(state.canvasState.pages))
           }));
        } else {
           console.log("EditorContext: Auto-save interval, no changes to sync.");
        }
      }
    }, 30000); 
    
    return () => clearInterval(autoSaveInterval);
  }, [state.activeReportId, state.canvasState.pages, state.openReports, reduxDispatch]);

  const addElement = useCallback((element: Omit<ElementData, "id">, pageIndex?: number) => {
    const newElementWithId = {
      ...element,
      id: uuidv4(),
    };
    
    // Console log for Text, Chart, and Table elements
    if (element.type === "text" || element.type === "chart" || element.type === "table") {
      console.log(`🎯 Element Added - Type: ${element.type.toUpperCase()}`, {
        id: newElementWithId.id,
        type: element.type,
        position: { x: element.x, y: element.y },
        size: { width: element.width, height: element.height },
        content: element.content,
        timestamp: new Date().toISOString()
      });
    }
    
    dispatch({ type: "ADD_ELEMENT", payload: { element: newElementWithId as ElementData, pageIndex } });
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<ElementData>, pageIndex?: number) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates, pageIndex } });
  }, []);

  const deleteElement = useCallback((id: string, pageIndex?: number) => {
    if (!id) {
      toast.error("Cannot delete element: No element ID provided");
      return;
    }
    if (!state.activeReportId) {
      toast.error("Cannot delete element: No active report loaded in editor");
      return;
    }
    dispatch({ type: "DELETE_ELEMENT", payload: { id, pageIndex } });
  }, [state.activeReportId]);

  const selectElement = useCallback((id: string) => {
    dispatch({ type: "SELECT_ELEMENT", payload: { id } });
  }, []);

  const clearSelection = useCallback(() => {
    dispatch({ type: "CLEAR_SELECTION" });
  }, []);

  const loadTemplate = useCallback((templateId: string) => {
    toast.info("Loading template elements. This will overwrite current report's content.");
    dispatch({ type: "LOAD_TEMPLATE", payload: { templateId } });
  }, []);

  const saveCanvas = useCallback(() => { 
    if (state.activeReportId && state.canvasState.pages) {
      console.log("EditorContext: saveCanvas dispatching updateReportPages.");
      reduxDispatch(updateReportPages({
        reportId: state.activeReportId,
        pages: JSON.parse(JSON.stringify(state.canvasState.pages))
      }));
      toast.success("Report changes saved"); 
    } else {
      toast.warning("No active report to save.");
    }
  }, [state.activeReportId, state.canvasState.pages, reduxDispatch]);

  const undo = useCallback(() => dispatch({ type: "UNDO" }), []);
  const redo = useCallback(() => dispatch({ type: "REDO" }), []);
  
  const setActiveReport = useCallback((report: ReportDocument | null) => {
    console.log("EditorContext: public setActiveReport called via context with report:", report ? `${report.name} (ID: ${report.id})` : 'null');
    dispatch({ type: "LOAD_REPORT_DATA", payload: { report } });
  }, []); 
  
  const getActiveReport = useCallback((): ReportDocument | null => {
    if (!state.activeReportId) return null;
    return state.openReports.find(report => report.id === state.activeReportId) || null;
  }, [state.activeReportId, state.openReports]);

  const addPage = useCallback((name: string) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to add a page.");
      return;
    }
    const pageName = name || `Page ${state.canvasState.pages.length + 1}`;
    dispatch({ type: "ADD_PAGE", payload: { name: pageName } });
    console.log(`Adding new page: ${pageName}`);
  }, [state.activeReportId, state.canvasState.pages.length]);

  const removePage = useCallback((pageIndex: number) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to remove a page.");
      return;
    }
    dispatch({ type: "REMOVE_PAGE", payload: { pageIndex } });
  }, [state.activeReportId]);

  const setCurrentPage = useCallback((pageIndex: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: { pageIndex } });
  }, []);

  const renamePage = useCallback((pageIndex: number, name: string) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to rename a page.");
      return;
    }
    dispatch({ type: "RENAME_PAGE", payload: { pageIndex, name } });
  }, [state.activeReportId]);

  return (
    <EditorContext.Provider
      value={{
        canvasState: state.canvasState,
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
