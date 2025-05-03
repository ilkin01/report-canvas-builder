
import React, { createContext, useContext, useReducer } from "react";
import { CanvasState, ElementData, ReportDocument, Template } from "@/types/editor";
import { v4 as uuidv4 } from "uuid";
import { getTemplateById, systemTemplates } from "@/lib/templates";
import { toast } from "sonner";

type EditorAction =
  | { type: "ADD_ELEMENT"; payload: { element: ElementData } }
  | { type: "UPDATE_ELEMENT"; payload: { id: string; updates: Partial<ElementData> } }
  | { type: "DELETE_ELEMENT"; payload: { id: string } }
  | { type: "SELECT_ELEMENT"; payload: { id: string } }
  | { type: "CLEAR_SELECTION" }
  | { type: "LOAD_TEMPLATE"; payload: { templateId: string } }
  | { type: "SAVE_CANVAS" }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "SET_ACTIVE_TAB"; payload: { tabId: string } }
  | { type: "CREATE_REPORT"; payload: { name: string; templateId: string } }
  | { type: "CLOSE_REPORT"; payload: { id: string } };

interface EditorContextType {
  canvasState: CanvasState;
  openReports: ReportDocument[];
  activeReportId: string | null;
  dispatch: React.Dispatch<EditorAction>;
  addElement: (element: Omit<ElementData, "id">) => void;
  updateElement: (id: string, updates: Partial<ElementData>) => void;
  deleteElement: (id: string) => void;
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
}

const initialCanvasState: CanvasState = {
  elements: [],
  selectedElementIds: [],
  history: {
    past: [],
    future: [],
  },
};

const EditorContext = createContext<EditorContextType | undefined>(undefined);

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
      const newElement = { ...action.payload.element };
      const newCanvasState = {
        ...state.canvasState,
        elements: [...state.canvasState.elements, newElement],
        history: {
          past: [...state.canvasState.history.past, [...state.canvasState.elements]],
          future: [],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, elements: newCanvasState.elements, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "UPDATE_ELEMENT": {
      const { id, updates } = action.payload;
      const updatedElements = state.canvasState.elements.map(elem => 
        elem.id === id ? { ...elem, ...updates } : elem
      );

      const newCanvasState = {
        ...state.canvasState,
        elements: updatedElements,
        history: {
          past: [...state.canvasState.history.past, [...state.canvasState.elements]],
          future: [],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, elements: updatedElements, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "DELETE_ELEMENT": {
      const updatedElements = state.canvasState.elements.filter(
        elem => elem.id !== action.payload.id
      );

      const newCanvasState = {
        ...state.canvasState,
        elements: updatedElements,
        selectedElementIds: state.canvasState.selectedElementIds.filter(
          id => id !== action.payload.id
        ),
        history: {
          past: [...state.canvasState.history.past, [...state.canvasState.elements]],
          future: [],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, elements: updatedElements, updatedAt: new Date().toISOString() }
          : report
      );

      return {
        ...state,
        canvasState: newCanvasState,
        openReports: updatedReports,
      };
    }
    case "SELECT_ELEMENT": {
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: [action.payload.id],
          elements: state.canvasState.elements.map(elem => ({
            ...elem,
            isSelected: elem.id === action.payload.id,
          })),
        },
      };
    }
    case "CLEAR_SELECTION": {
      return {
        ...state,
        canvasState: {
          ...state.canvasState,
          selectedElementIds: [],
          elements: state.canvasState.elements.map(elem => ({
            ...elem,
            isSelected: false,
          })),
        },
      };
    }
    case "LOAD_TEMPLATE": {
      const template = getTemplateById(action.payload.templateId);
      
      if (!template) {
        return state;
      }

      const newCanvasState = {
        elements: [...template.elements],
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
              elements: [...template.elements], 
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
    case "UNDO": {
      if (state.canvasState.history.past.length === 0) {
        return state;
      }

      const previous = state.canvasState.history.past[state.canvasState.history.past.length - 1];
      const newPast = state.canvasState.history.past.slice(0, -1);

      const newCanvasState = {
        ...state.canvasState,
        elements: previous,
        history: {
          past: newPast,
          future: [state.canvasState.elements, ...state.canvasState.history.future],
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, elements: previous, updatedAt: new Date().toISOString() }
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
        elements: next,
        history: {
          past: [...state.canvasState.history.past, state.canvasState.elements],
          future: newFuture,
        },
      };

      // Also update the active report
      const updatedReports = state.openReports.map(report => 
        report.id === state.activeReportId 
          ? { ...report, elements: next, updatedAt: new Date().toISOString() }
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
      const newReport: ReportDocument = {
        id: newReportId,
        name,
        templateId,
        elements: [...template.elements],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      return {
        ...state,
        openReports: [...state.openReports, newReport],
        activeReportId: newReportId,
        canvasState: {
          elements: [...template.elements],
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
            elements: [...activeReport.elements],
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
          elements: [...activeReport.elements],
          selectedElementIds: [],
          history: {
            past: [],
            future: [],
          },
        },
      };
    }
    case "SAVE_CANVAS": {
      // We're already updating the report data with each change, so just show a confirmation
      toast.success("Report saved successfully");
      return state;
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

  const addElement = (element: Omit<ElementData, "id">) => {
    const newElement = {
      ...element,
      id: uuidv4(),
    };
    dispatch({ type: "ADD_ELEMENT", payload: { element: newElement as ElementData } });
  };

  const updateElement = (id: string, updates: Partial<ElementData>) => {
    dispatch({ type: "UPDATE_ELEMENT", payload: { id, updates } });
  };

  const deleteElement = (id: string) => {
    dispatch({ type: "DELETE_ELEMENT", payload: { id } });
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
