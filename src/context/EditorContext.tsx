import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { CanvasState, ElementData, Page, ReportDocument, Template } from "@/types/editor";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById, systemTemplates } from "@/lib/templates";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks"; // Import useAppDispatch
import { updateReportPages } from "@/redux/slices/reportsSlice"; // Import Redux action

type EditorAction =
  | { type: "ADD_ELEMENT"; payload: { element: ElementData; pageIndex?: number } }
  | { type: "UPDATE_ELEMENT"; payload: { id: string; updates: Partial<ElementData>; pageIndex?: number } }
  | { type: "DELETE_ELEMENT"; payload: { id: string; pageIndex?: number } }
  | { type: "SELECT_ELEMENT"; payload: { id: string } }
  | { type: "CLEAR_SELECTION" }
  | { type: "LOAD_TEMPLATE"; payload: { templateId: string } } // This might be redundant if templates always create new reports via Redux
  | { type: "SAVE_CANVAS" } // This should trigger sync to Redux
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "LOAD_REPORT_DATA"; payload: { report: ReportDocument | null } } // Changed from SET_ACTIVE_TAB
  // CREATE_REPORT and CLOSE_REPORT are likely managed by Redux now, review if these are still needed in context
  // | { type: "CREATE_REPORT"; payload: { name: string; templateId: string } } 
  // | { type: "CLOSE_REPORT"; payload: { id: string } }
  | { type: "ADD_PAGE"; payload: { name: string } }
  | { type: "REMOVE_PAGE"; payload: { pageIndex: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { pageIndex: number } }
  | { type: "RENAME_PAGE"; payload: { pageIndex: number; name: string } }
  | { type: "AUTO_SAVE" }; // This should trigger sync to Redux

interface EditorContextType {
  canvasState: CanvasState;
  // openReports: ReportDocument[]; // Potentially remove if Redux is sole source of truth
  // activeReportId: string | null; // Potentially remove
  dispatch: React.Dispatch<EditorAction>;
  addElement: (element: Omit<ElementData, "id">, pageIndex?: number) => void;
  updateElement: (id: string, updates: Partial<ElementData>, pageIndex?: number) => void;
  deleteElement: (id: string, pageIndex?: number) => void;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  loadTemplate: (templateId: string) => void; // Review: should this create a new report via Redux?
  saveCanvas: () => void;
  undo: () => void;
  redo: () => void;
  // createReport: (name: string, templateId: string) => void; // Managed by Redux
  // closeReport: (id: string) => void; // Managed by Redux
  setActiveReport: (report: ReportDocument | null) => void; // Signature changed
  getActiveReport: () => ReportDocument | null; // Will rely on internal state still for now
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
      width: 800, // Varsayılan sayfa genişliği
      height: 1100 // Varsayılan sayfa yüksekliği
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

// This state is internal to EditorContext. Redux manages the global list of reports.
// EditorContext's openReports can be seen as a cache or working copy for the active report.
interface EditorReducerState {
  canvasState: CanvasState;
  openReports: ReportDocument[]; // Kept for getActiveReport and local modifications before sync
  activeReportId: string | null; // Tracks the ID of the report loaded into canvasState
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
      // Common logic for actions that modify pages and should update openReports cache
      let newCanvasState: CanvasState;
      let updatedPages: Page[];

      switch (action.type) {
        case "ADD_ELEMENT": {
          const { element, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          const newElement = { ...element };
          updatedPages = [...state.canvasState.pages];
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            elements: [...updatedPages[pageIndex].elements, newElement]
          };
          break;
        }
        case "UPDATE_ELEMENT": {
          const { id, updates, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          updatedPages = [...state.canvasState.pages];
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            elements: updatedPages[pageIndex].elements.map(elem =>
              elem.id === id ? { ...elem, ...updates } : elem
            )
          };
          break;
        }
        case "DELETE_ELEMENT": {
          const { id, pageIndex = state.canvasState.currentPageIndex } = action.payload;
          updatedPages = [...state.canvasState.pages];
          const currentPageElements = updatedPages[pageIndex].elements;
          const elementExists = currentPageElements.some(elem => elem.id === id);
          if (!elementExists) return state; // Element not found, no change
            updatedPages[pageIndex] = {
              ...updatedPages[pageIndex],
              elements: currentPageElements.filter(elem => elem.id !== id)
            };
          break;
        }
        case "ADD_PAGE": {
          const { name } = action.payload;
          const newPage: Page = { 
            id: uuidv4(), 
            name, 
            elements: [],
            width: state.canvasState.pages[state.canvasState.currentPageIndex]?.width || 800, // Yeni sayfa mevcut sayfanın boyutunu alsın veya varsayılan
            height: state.canvasState.pages[state.canvasState.currentPageIndex]?.height || 1100
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
          updatedPages = [...state.canvasState.pages]; // Should not happen
      }
      
      const now = Date.now();
      const shouldAddHistory = now - lastHistoryUpdate > HISTORY_BATCH_TIME || action.type === "DELETE_ELEMENT" || action.type === "ADD_PAGE" || action.type === "REMOVE_PAGE" || action.type === "RENAME_PAGE";
      if (shouldAddHistory) lastHistoryUpdate = now;

      newCanvasState = {
        ...state.canvasState,
        pages: updatedPages,
        currentPageIndex: action.type === "REMOVE_PAGE" ? Math.min(state.canvasState.currentPageIndex, updatedPages.length - 1) : state.canvasState.currentPageIndex,
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
      
      // Ensure page exists
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
      
      // Ensure page exists
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
      // This action's behavior might need to change. 
      // Loading a template usually means creating a *new report* from that template.
      // This should probably trigger a Redux action to create a new report.
      // For now, it just loads template elements into the current canvas.
      const template = getTemplateById(action.payload.templateId);
      if (!template) return state;

      const newPages = [{
        id: uuidv4(),
        name: "Page 1",
        elements: JSON.parse(JSON.stringify(template.elements)), // Deep copy
        width: 800, // Varsayılan boyutlar
        height: 1100
      }];

      const newCanvasState = {
        ...state.canvasState,
        pages: newPages,
        currentPageIndex: 0,
        selectedElementIds: [],
        history: { past: [], future: [] },
      };
      
      // If there's an active report, update its pages and templateId
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

    case "AUTO_SAVE": // Handled by useEffect in Provider to dispatch to Redux
    case "SAVE_CANVAS": { // Handled by useEffect in Provider to dispatch to Redux
      if (action.type === "SAVE_CANVAS") {
        toast.info("Saving report..."); // Actual save is async via Redux
      }
      return state; // No direct state change, relies on effect
    }
    case "UNDO": {
      if (state.canvasState.history.past.length === 0) {
        return state;
      }

      let newPast = [...state.canvasState.history.past];
      let previousPagesState = newPast.pop()!; 
      // Ensure previousPagesState is an array of Pages, not Page[][]
       if (!Array.isArray(previousPagesState) || (previousPagesState.length > 0 && !previousPagesState[0].elements)) {
         console.error("Invalid state in history.past:", previousPagesState);
         // Potentially try to recover or skip this history entry
         return state; // Or try newPast.pop() again if robust recovery is desired
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
      // Ensure nextPagesState is an array of Pages
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
    // CREATE_REPORT and CLOSE_REPORT cases in context are removed as Redux handles report lifecycle.
    // The context is now informed about the active report via LOAD_REPORT_DATA.

    case "LOAD_REPORT_DATA": {
      const { report } = action.payload;
      if (report) {
        const reportPagesWithDefaults = report.pages.map(p => ({
          ...p,
          width: p.width || 800, // Eksikse varsayılan ata
          height: p.height || 1100, // Eksikse varsayılan ata
        }));
        
        const reportPagesString = JSON.stringify(reportPagesWithDefaults);

        if (state.activeReportId === report.id && 
            JSON.stringify(state.canvasState.pages) === reportPagesString) {
          console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Pages are already current. Canvas state will not change.`);
          
          const existingReportIndex = state.openReports.findIndex(r => r.id === report.id);
          let reportNeedsUpdateInCache = true;
          if (existingReportIndex > -1) {
             const cachedReportCopy = JSON.parse(JSON.stringify(state.openReports[existingReportIndex]));
             // Compare pages with defaults applied to the incoming report for consistency
             const incomingReportWithDefaultPages = {...report, pages: reportPagesWithDefaults};
             if (JSON.stringify(cachedReportCopy) === JSON.stringify(incomingReportWithDefaultPages)) {
                reportNeedsUpdateInCache = false;
             }
          }

          if (reportNeedsUpdateInCache) {
            console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Updating openReports cache only (metadata or defaults).`);
            let updatedOpenReports;
            const reportToCache = {...report, pages: reportPagesWithDefaults}; // Cache with defaults
            if (existingReportIndex > -1) {
              updatedOpenReports = [...state.openReports];
              updatedOpenReports[existingReportIndex] = JSON.parse(JSON.stringify(reportToCache));
            } else {
              updatedOpenReports = [...state.openReports, JSON.parse(JSON.stringify(reportToCache))];
            }
            return { ...state, openReports: updatedOpenReports, activeReportId: report.id }; // Ensure activeReportId is set if it changed
          }
          // If activeReportId is different, ensure it's updated even if pages are same
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
            ...initialCanvasState, // Reset canvas state aspects like history
            pages: reportPagesWithDefaults, // Use pages with defaults
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
          // openReports: [] // Optionally clear cache or leave as is. Current behavior seems to keep it.
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

  // Effect to sync canvasState.pages changes to Redux store
  useEffect(() => {
    if (state.activeReportId && state.canvasState.pages) {
      const activeReportInContextCache = state.openReports.find(r => r.id === state.activeReportId);
      // Ensure pages are deeply compared
      if (activeReportInContextCache && JSON.stringify(activeReportInContextCache.pages) !== JSON.stringify(state.canvasState.pages)) {
         console.log("EditorContext: Page content changed for active report. Syncing to Redux via updateReportPages.");
         reduxDispatch(updateReportPages({
           reportId: state.activeReportId,
           pages: JSON.parse(JSON.stringify(state.canvasState.pages)) 
         }));
      } else if (!activeReportInContextCache && state.canvasState.pages.length > 0) {
        // This case might happen if context cache is cleared but canvas state is still there for an active report ID
        // Or, if a report is loaded for the first time directly into canvas state before context cache is populated
        console.log("EditorContext: Active report not in context cache or pages mismatch significantly, syncing to Redux.");
        reduxDispatch(updateReportPages({
          reportId: state.activeReportId,
          pages: JSON.parse(JSON.stringify(state.canvasState.pages))
        }));
      }
    }
  }, [state.canvasState.pages, state.activeReportId, state.openReports, reduxDispatch]);


  // Auto-save on interval
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (state.activeReportId && state.canvasState.pages.length > 0) { // Ensure there are pages to save
        // Check if there are actual changes to save by comparing with the cached version
        const activeReportInContextCache = state.openReports.find(r => r.id === state.activeReportId);
        if (!activeReportInContextCache || JSON.stringify(activeReportInContextCache.pages) !== JSON.stringify(state.canvasState.pages)) {
           console.log("EditorContext: Auto-saving changes to Redux.");
           reduxDispatch(updateReportPages({
             reportId: state.activeReportId,
             pages: JSON.parse(JSON.stringify(state.canvasState.pages))
           }));
           // toast.success("Report auto-saved"); // Might be too frequent
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
    toast.success("Element deleted");
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

  const addPage = useCallback((name?: string) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to add a page.");
      return;
    }
    const newPageName = name || `Page ${state.canvasState.pages.length + 1}`;
    dispatch({ type: "ADD_PAGE", payload: { name: newPageName } });
    toast.success(`Added new page: ${newPageName}`);
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
