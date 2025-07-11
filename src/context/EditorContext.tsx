
import React, { createContext, useContext, useReducer, useEffect, useCallback, useState } from "react";
import { CanvasState, ElementData, Page, ReportDocument } from "@/types/editor";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById } from "@/lib/templates";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { updateReportPages } from "@/redux/slices/reportsSlice";
import { apiService } from "@/services/apiService";
import { useSearchParams } from "react-router-dom";

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
  | { type: "ADD_PAGE"; payload: { name: string; backendId?: number } }
  | { type: "REMOVE_PAGE"; payload: { pageIndex: number } }
  | { type: "SET_CURRENT_PAGE"; payload: { pageIndex: number } }
  | { type: "RENAME_PAGE"; payload: { pageIndex: number; name: string } }
  | { type: "AUTO_SAVE" };

interface EditorContextType {
  canvasState: CanvasState;
  dispatch: React.Dispatch<EditorAction>;
  addElement: (element: Omit<ElementData, "id">, pageIndex?: number) => Promise<void>;
  updateElement: (id: string, updates: Partial<ElementData>, pageIndex?: number) => Promise<void>;
  deleteElement: (id: string, pageIndex?: number) => Promise<void>;
  selectElement: (id: string) => void;
  clearSelection: () => void;
  loadTemplate: (templateId: string) => void; 
  saveCanvas: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  setActiveReport: (report: ReportDocument | null) => void; 
  getActiveReport: () => ReportDocument | null; 
  addPage: (name: string) => Promise<void>;
  removePage: (pageIndex: number) => Promise<void>;
  setCurrentPage: (pageIndex: number) => void;
  renamePage: (pageIndex: number, name: string) => void;
  deletedPages: number[];
  deletedElements: number[];
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
          const { name, backendId } = action.payload;
          const currentPageForSize = state.canvasState.pages[state.canvasState.currentPageIndex];
          const newPage: Page = {
            id: uuidv4(),
            name,
            elements: [],
            width: currentPageForSize?.width || A4_WIDTH_PX, // Inherit or default to A4
            height: currentPageForSize?.height || A4_HEIGHT_PX // Inherit or default to A4
          };
          if (backendId) {
            newPage.backendId = backendId;
          }
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
        elements: template.pages && template.pages.length > 0 
          ? template.pages[0].elements || []
          : [],
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
          ? { ...report, pages: newPages, templateId: String(template.id), updatedAt: new Date().toISOString() }
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
        // Universal mapping tətbiq et
        const mappedPages = report.pages.map(page => ({
          ...page,
          elements: page.elements.map(element => ({
            ...element,
            type: mapElementType(element.type),
            content:
              mapElementType(element.type) === 'chart'
                ? normalizeChartContent(element.content)
                : mapElementType(element.type) === 'text'
                  ? (element.content && typeof element.content.text === 'string'
                      ? element.content
                      : { text: '' })
                  : element.content,
            width: element.width && element.width >= 120 ? element.width : 120,
            height: element.height && element.height >= 180 ? element.height : 180,
          }))
        }));
        
        const reportPagesString = JSON.stringify(mappedPages);

        if (state.activeReportId === report.id && 
            JSON.stringify(state.canvasState.pages) === reportPagesString) {
          console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Pages are already current. Canvas state will not change.`);
          
          const existingReportIndex = state.openReports.findIndex(r => r.id === report.id);
          let reportNeedsUpdateInCache = true;
          if (existingReportIndex > -1) {
             const cachedReportCopy = JSON.parse(JSON.stringify(state.openReports[existingReportIndex]));
             const incomingReportWithDefaultPages = {...report, pages: mappedPages};
             if (JSON.stringify(cachedReportCopy) === JSON.stringify(incomingReportWithDefaultPages)) {
                reportNeedsUpdateInCache = false;
             }
          }

          if (reportNeedsUpdateInCache) {
            console.log(`EditorContext: LOAD_REPORT_DATA for report ${report.id}. Updating openReports cache only (metadata or defaults).`);
            let updatedOpenReports;
            const reportToCache = {...report, pages: mappedPages}; 
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
        const reportToCache = {...report, pages: mappedPages};

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
            pages: mappedPages, 
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
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('templateId');
  const [deletedPages, setDeletedPages] = useState<number[]>([]);
  const [deletedElements, setDeletedElements] = useState<number[]>([]);

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

  const addPage = useCallback(async (name: string): Promise<void> => {
    const pageName = name || `Page ${state.canvasState.pages.length + 1}`;
    dispatch({ type: "ADD_PAGE", payload: { name: pageName } });
  }, [state.canvasState.pages.length]);

  const addElement = useCallback(async (element: Omit<ElementData, "id">, pageIndex?: number): Promise<void> => {
    // Yalnız 'text', 'chart', 'table' üçün type ver, əks halda 'text' olsun
    const allowedTypes = ['text', 'chart', 'table'];
    const safeType = allowedTypes.includes(String(element.type)) ? String(element.type) : 'text';
    const newElementWithId = {
      ...element,
      type: safeType,
      id: uuidv4(),
    };
    
    // Console log üçün də type mapping göstər:
    if (safeType === "text" || safeType === "chart" || safeType === "table") {
      console.log(`🎯 Element Added - Type: ${safeType.toUpperCase()} (backend type: ${getBackendType(safeType)})`, {
        id: newElementWithId.id,
        type: safeType,
        backendType: getBackendType(safeType),
        position: { x: element.x, y: element.y },
        size: { width: element.width, height: element.height },
        content: element.content,
        timestamp: new Date().toISOString()
      });
    }
    
    // If we're editing a template, create template element
    if (templateId) {
      try {
        const backendType = getBackendType(safeType);
        const body = {
          type: backendType,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          content: element.content,
          pageId: parseInt(templateId)
        };
        const res = await apiService.sendRequest({
          endpoint: "/api/ReportTemplateElement/CreateReportTemplateElement",
          method: "POST",
          body
        });
        const newBackendId = res?.id || res?.elementId || res?.data?.id;
        if (newBackendId) {
          newElementWithId.backendId = newBackendId;
          console.log(`✅ Template element created with backendId: ${newBackendId}`);
        }
      } catch (error: any) {
        console.error("Failed to create template element:", error);
        // Continue with local element creation even if backend fails
      }
    }
    // If we're editing a report, create report element
    else if (state.activeReportId) {
      try {
        const currentPage = state.canvasState.pages[pageIndex || state.canvasState.currentPageIndex];
        if (currentPage && currentPage.backendId) {
          let typeId = 0;
          if (safeType === 'text') typeId = 0;
          else if (safeType === 'chart') typeId = 1;
          else if (safeType === 'table') typeId = 2;
          
          const body = {
            type: typeId,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content,
            reportPageId: currentPage.backendId
          };
          const res = await apiService.sendRequest({
            endpoint: "/api/ReportElement/CreateReportElement",
            method: "POST",
            body
          });
          const newBackendId = res?.id || res?.reportElementId || res?.data?.id;
          if (newBackendId) {
            newElementWithId.backendId = newBackendId;
            console.log(`✅ Report element created with backendId: ${newBackendId}`);
          }
        }
      } catch (error: any) {
        console.error("Failed to create report element:", error);
        // Continue with local element creation even if backend fails
      }
    }
    
    dispatch({ type: "ADD_ELEMENT", payload: { element: newElementWithId as ElementData, pageIndex } });
  }, [templateId, state.activeReportId, state.canvasState.pages, state.canvasState.currentPageIndex]);

  const updateElement = useCallback(async (id: string, updates: Partial<ElementData>, pageIndex?: number): Promise<void> => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates, pageIndex } });
    
    const currentPage = state.canvasState.pages[pageIndex || state.canvasState.currentPageIndex];
    const element = currentPage?.elements.find(el => el.id === id);
    
    if (!element) {
      console.warn("Element not found for update:", id);
      return;
    }
    
    // If we're editing a template, update template element
    if (templateId) {
      try {
        const backendType = getBackendType(mapElementType(element.type));
        const body = {
          type: backendType,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          content: element.content,
          pageId: parseInt(templateId)
        };
        await apiService.sendRequest({
          endpoint: `/api/ReportTemplateElement/UpdateReportTemplateElement/${id}`,
          method: "PUT",
          body
        });
      } catch (error: any) {
        // Suppress or debounce error logs for drag/resize spam
        const w: any = window;
        if (!w.__lastTemplateUpdateErrorLog || Date.now() - w.__lastTemplateUpdateErrorLog > 1000) {
          console.error("Failed to update template element:", error);
          w.__lastTemplateUpdateErrorLog = Date.now();
        }
        // Do not show toast
      }
    }
    // If we're editing a report and element has backendId, update report element
    else if (state.activeReportId && element.backendId) {
      try {
        console.log(`🔄 Updating report element with backendId: ${element.backendId}`);
        let typeId = 0;
        if (element.type === 'text') typeId = 0;
        else if (element.type === 'chart') typeId = 1;
        else if (element.type === 'table') typeId = 2;
        
        await apiService.sendRequest({
          endpoint: `/api/ReportElement/UpdateReportElement/${element.backendId}`,
          method: "PUT",
          body: {
            type: typeId,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
            content: element.content,
            reportPageId: currentPage.backendId
          }
        });
        console.log(`✅ Report element ${element.backendId} updated successfully`);
      } catch (error: any) {
        // Suppress or debounce error logs for drag/resize spam
        const w: any = window;
        if (!w.__lastReportUpdateErrorLog || Date.now() - w.__lastReportUpdateErrorLog > 1000) {
          console.error("Failed to update report element:", error);
          w.__lastReportUpdateErrorLog = Date.now();
        }
        // Do not show toast for drag/resize operations
      }
    }
  }, [templateId, state.canvasState.pages, state.canvasState.currentPageIndex, state.activeReportId]);

  const deleteElement = useCallback(async (id: string, pageIndex?: number): Promise<void> => {
    const page = state.canvasState.pages[pageIndex ?? state.canvasState.currentPageIndex];
    const element = page.elements.find(e => e.id === id);
    if (element && element.backendId) {
      setDeletedElements(prev => [...prev, element.backendId]);
    }
    dispatch({ type: "DELETE_ELEMENT", payload: { id, pageIndex } });
  }, [state.canvasState.pages, dispatch]);

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

  const saveCanvas = useCallback(async (): Promise<void> => { 
    if (state.activeReportId && state.canvasState.pages) {
      console.log("EditorContext: saveCanvas dispatching updateReportPages.");
      reduxDispatch(updateReportPages({
        reportId: state.activeReportId,
        pages: JSON.parse(JSON.stringify(state.canvasState.pages))
      }));
      
      // If we're editing a report, also sync all changes to backend
      if (!templateId && state.activeReportId) {
        try {
          console.log("🔄 Syncing all report changes to backend...");
          
          // Update all pages and their elements
          for (let pageIndex = 0; pageIndex < state.canvasState.pages.length; pageIndex++) {
            const page = state.canvasState.pages[pageIndex];
            
            if (page.backendId) {
              // Update existing page
              await apiService.sendRequest({
                endpoint: `/api/ReportPage/UpdateReportPage/${page.backendId}`,
                method: 'PUT',
                body: {
                  width: page.width || 595,
                  height: page.height || 842,
                  orderIndex: pageIndex + 1,
                  reportId: state.activeReportId
                }
              });
              
              // Update all elements on this page
              for (const element of page.elements) {
                if (element.backendId) {
                  let typeId = 0;
                  if (element.type === 'text') typeId = 0;
                  else if (element.type === 'chart') typeId = 1;
                  else if (element.type === 'table') typeId = 2;
                  
                  await apiService.sendRequest({
                    endpoint: `/api/ReportElement/UpdateReportElement/${element.backendId}`,
                    method: "PUT",
                    body: {
                      type: typeId,
                      x: element.x,
                      y: element.y,
                      width: element.width,
                      height: element.height,
                      content: element.content,
                      reportPageId: page.backendId
                    }
                  });
                }
              }
            }
          }
          
          console.log("✅ All report changes synced to backend successfully!");
        } catch (error: any) {
          console.error("❌ Error syncing report changes to backend:", error);
          toast.error("Backend-ə sinxronizasiya xətası baş verdi");
        }
      }
      
      toast.success("Report changes saved"); 
    } else {
      toast.warning("No active report to save.");
    }
  }, [state.activeReportId, state.canvasState.pages, reduxDispatch, templateId]);

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

  const removePage = useCallback(async (pageIndex: number): Promise<void> => {
    const page = state.canvasState.pages[pageIndex];
    if (page && page.backendId) {
      setDeletedPages(prev => [...prev, page.backendId]);
    }
    dispatch({ type: "REMOVE_PAGE", payload: { pageIndex } });
  }, [state.canvasState.pages]);

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
        deletedPages,
        deletedElements,
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

// Type mapping util
function mapElementType(type: number | string): string {
  if (typeof type === 'number') {
    switch (type) {
      case 0: return 'text';
      case 1: return 'chart';
      case 2: return 'table';
      default: return 'text';
    }
  }
  return String(type);
}

function getBackendType(type: string): number {
  switch (String(type)) {
    case "text": return 0;
    case "chart": return 1;
    case "table": return 2;
    default: return 0;
  }
}

// Chart content normalization
function normalizeChartContent(content: any) {
  if (!content) return { type: 'bar', data: [], title: '' };
  // Köhnə format: {labels, datasets}
  if (content.data && content.data.labels && content.data.datasets) {
    return {
      ...content,
      data: content.data.labels.map((label: string, idx: number) => ({
        name: label,
        value: content.data.datasets[0]?.data?.[idx] ?? 0,
      })),
    };
  }
  // Array formatdadırsa, olduğu kimi saxla
  return content;
}
