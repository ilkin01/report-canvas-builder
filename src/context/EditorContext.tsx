import React, { createContext, useContext, useReducer, useEffect } from "react";
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
          if (!elementExists) return state;
          updatedPages[pageIndex] = {
            ...updatedPages[pageIndex],
            elements: currentPageElements.filter(elem => elem.id !== id)
          };
          break;
        }
        case "ADD_PAGE": {
          const { name } = action.payload;
          const newPage: Page = { id: uuidv4(), name, elements: [] };
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
        // Adjust currentPageIndex for ADD_PAGE/REMOVE_PAGE
        currentPageIndex: action.type === "ADD_PAGE" ? updatedPages.length - 1 : 
                          action.type === "REMOVE_PAGE" ? Math.min(state.canvasState.currentPageIndex, updatedPages.length - 1) :
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
      // This action's behavior might need to change. 
      // Loading a template usually means creating a *new report* from that template.
      // This should probably trigger a Redux action to create a new report.
      // For now, it just loads template elements into the current canvas.
      const template = getTemplateById(action.payload.templateId);
      if (!template) return state;

      const newPages = [{
        id: uuidv4(),
        name: "Page 1",
        elements: JSON.parse(JSON.stringify(template.elements)) // Deep copy
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
      let newFuture = [state.canvasState.pages, ...state.canvasState.history.future];
      
      const newCanvasState = {
        ...state.canvasState,
        pages: previousPagesState, // Restore previous pages
        selectedElementIds: [], // Clear selection on undo/redo for simplicity
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
      const newFuture = state.canvasState.history.future.slice(1);

      const newCanvasState = {
        ...state.canvasState,
        pages: nextPagesState, // Restore next pages state
        selectedElementIds: [], // Clear selection
        history: {
          past: [...state.canvasState.history.past, state.canvasState.pages],
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
        // Deep copy pages to prevent direct mutation of Redux state if report object is passed by reference
        const reportPages = JSON.parse(JSON.stringify(report.pages));
        
        // Update openReports cache in context
        const existingReportIndex = state.openReports.findIndex(r => r.id === report.id);
        let updatedOpenReports;
        if (existingReportIndex > -1) {
          updatedOpenReports = [...state.openReports];
          updatedOpenReports[existingReportIndex] = { ...report, pages: reportPages }; // Store with copied pages
        } else {
          updatedOpenReports = [...state.openReports, { ...report, pages: reportPages }];
        }
        
        return {
          ...state,
          activeReportId: report.id,
          canvasState: {
            pages: reportPages,
            currentPageIndex: 0,
            selectedElementIds: [],
            history: { past: [], future: [] },
          },
          openReports: updatedOpenReports,
        };
      } else {
        // report is null, so clear active report in context
        return {
          ...state,
          activeReportId: null,
          canvasState: initialCanvasState,
          // openReports could be cleared or left as is. If cleared, getActiveReport will always be null.
          // Let's not clear openReports entirely, so if user navigates back to an old report, it *might* still be there.
          // However, LOAD_REPORT_DATA should be the sole source for loading a report.
        };
      }
    }
    
    case "SET_CURRENT_PAGE": {
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          currentPageIndex: action.payload.pageIndex,
          selectedElementIds: [], // Clear selection when changing page
        },
      };
    }
    default:
      return state;
  }
};

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(editorReducer, initialEditorReducerState);
  const reduxDispatch = useAppDispatch(); // For dispatching actions to Redux store

  // Effect to sync canvasState.pages changes to Redux store
  useEffect(() => {
    if (state.activeReportId && state.canvasState.pages) {
      // Check if the pages in canvasState are meaningfully different from what might be in openReports cache.
      // This is to avoid loops if the initial load also triggers this.
      // A simple way is to ensure this runs only after an interaction.
      // The history mechanism can be a proxy for "user has made changes".
      // For now, let's assume any change to canvasState.pages for an active report should be synced.

      const activeReportInContextCache = state.openReports.find(r => r.id === state.activeReportId);
      if (activeReportInContextCache && JSON.stringify(activeReportInContextCache.pages) !== JSON.stringify(state.canvasState.pages)) {
         console.log("EditorContext: Page content changed for active report. Syncing to Redux via updateReportPages.");
         reduxDispatch(updateReportPages({
           reportId: state.activeReportId,
           pages: JSON.parse(JSON.stringify(state.canvasState.pages)) // Send a deep copy
         }));
      }
    }
  }, [state.canvasState.pages, state.activeReportId, state.openReports, reduxDispatch]);


  // Auto-save on interval (if an active report is loaded)
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (state.activeReportId) {
        // The SAVE_CANVAS/AUTO_SAVE action itself doesn't change context state here.
        // The actual saving to Redux is handled by the useEffect above, which reacts to page changes.
        // We can dispatch AUTO_SAVE to potentially trigger other logic if needed, or just rely on page changes.
        // For explicit "Save" button, dispatch SAVE_CANVAS.
        console.log("EditorContext: Auto-save interval, changes to pages will be synced by other effect.");
        // If we want to force a sync even if pages haven't "changed" according to the above effect's heuristic:
        // dispatch({ type: "AUTO_SAVE" }); // then handle this in the reducer to mark dirty or directly call reduxDispatch
        if (state.activeReportId && state.canvasState.pages) {
           reduxDispatch(updateReportPages({
             reportId: state.activeReportId,
             pages: JSON.parse(JSON.stringify(state.canvasState.pages))
           }));
           toast.success("Report auto-saved to Redux (simulated)");
        }

      }
    }, 30000); // Auto save every 30 seconds
    
    return () => clearInterval(autoSaveInterval);
  }, [state.activeReportId, state.canvasState.pages, reduxDispatch]);


  const addElement = (element: Omit<ElementData, "id">, pageIndex?: number) => {
    const newElementWithId = {
      ...element,
      id: uuidv4(),
    };
    dispatch({ type: "ADD_ELEMENT", payload: { element: newElementWithId as ElementData, pageIndex } });
  };

  const updateElement = (id: string, updates: Partial<ElementData>, pageIndex?: number) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates, pageIndex } });
  };

  const deleteElement = (id: string, pageIndex?: number) => {
    if (!id) {
      toast.error("Cannot delete element: No element ID provided");
      return;
    }
    if (!state.activeReportId) {
      toast.error("Cannot delete element: No active report loaded in editor");
      return;
    }
    dispatch({ type: "DELETE_ELEMENT", payload: { id, pageIndex } });
    toast.success("Element deleted"); // Optimistic UI
  };

  const selectElement = (id: string) => {
    dispatch({ type: "SELECT_ELEMENT", payload: { id } });
  };

  const clearSelection = () => {
    dispatch({ type: "CLEAR_SELECTION" });
  };

  const loadTemplate = (templateId: string) => {
    // This should ideally trigger creation of a new report using this template via Redux.
    // For now, it loads template into current canvas, which might be confusing.
    // Consider removing this or changing its behavior.
    // If used, it will overwrite current canvasState.pages.
    toast.info("Loading template elements into current view. This may overwrite unsaved changes.");
    dispatch({ type: "LOAD_TEMPLATE", payload: { templateId } });
  };

  const saveCanvas = () => { // Explicit save action
    if (state.activeReportId && state.canvasState.pages) {
      reduxDispatch(updateReportPages({
        reportId: state.activeReportId,
        pages: JSON.parse(JSON.stringify(state.canvasState.pages))
      }));
      toast.success("Report changes saved to Redux (simulated)");
    } else {
      toast.warning("No active report to save."); // Changed from toast.warn to toast.warning
    }
    // dispatch({ type: "SAVE_CANVAS" }); // This action is now mostly a signal
  };

  const undo = () => dispatch({ type: "UNDO" });
  const redo = () => dispatch({ type: "REDO" });
  
  // createReport and closeReport are handled by Redux and App-level logic
  // The EditorContext is informed via setActiveReport.
  
  const setActiveReport = (report: ReportDocument | null) => {
    dispatch({ type: "LOAD_REPORT_DATA", payload: { report } });
  };
  
  const getActiveReport = (): ReportDocument | null => {
    // This gets the version of the report currently cached/worked on within the EditorContext
    if (!state.activeReportId) return null;
    return state.openReports.find(report => report.id === state.activeReportId) || null;
  };

  const addPage = (name: string = `Page ${state.canvasState.pages.length + 1}`) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to add a page.");
      return;
    }
    dispatch({ type: "ADD_PAGE", payload: { name } });
  };

  const removePage = (pageIndex: number) => {
     if (!state.activeReportId) {
      toast.error("Please select a report to remove a page.");
      return;
    }
    dispatch({ type: "REMOVE_PAGE", payload: { pageIndex } });
  };

  const setCurrentPage = (pageIndex: number) => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: { pageIndex } });
  };

  const renamePage = (pageIndex: number, name: string) => {
    if (!state.activeReportId) {
      toast.error("Please select a report to rename a page.");
      return;
    }
    dispatch({ type: "RENAME_PAGE", payload: { pageIndex, name } });
  };

  return (
    <EditorContext.Provider
      value={{
        canvasState: state.canvasState,
        // openReports: state.openReports, // Not directly exposed if Redux is truth
        // activeReportId: state.activeReportId, // Not directly exposed
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
