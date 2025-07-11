
export type ElementType =
  | 'text'
  | 'chart'
  | 'shape'
  | 'comment'
  | 'signature'
  | 'table';

export type ElementData = {
  type: ElementType | string; // mappingdən sonra həmişə string olacaq
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  style?: Record<string, any>;
  isSelected?: boolean;
  backendId?: number; // Original backend ID for API calls
};

export type ChartData = {
  type: 'bar' | 'line' | 'pie';
  data: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      backgroundColor?: string | string[];
      borderColor?: string | string[];
      borderWidth?: number;
    }>;
  };
};

export type ShapeData = {
  type: 'rectangle' | 'circle' | 'line';
  color: string;
  borderWidth?: number;
  borderColor?: string;
};

export type TextData = {
  text: string;
  fontSize?: number;
  fontWeight?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right';
};

export type CommentData = {
  text: string;
  author?: string;
  timestamp?: string;
};

export type SignatureData = {
  name?: string;
  date?: string;
  signature?: string;
};

export type CellStatus = 'normal' | 'positive' | 'negative' | 'warning' | 'active';

export type ColumnType = 'string' | 'boolean' | 'number';

export type TableData = {
  headers: string[];
  rows: Array<Array<string | number | boolean>>;
  title?: string;
  headerBgColor?: string;
  highlightColor?: string;
  rowHighlights?: boolean[];
  cellStatus?: Array<Array<CellStatus>>;
  referenceRanges?: string[];
  units?: string[];
  columnTypes?: ColumnType[];
};

export type Page = {
  id: string;
  name: string;
  elements: ElementData[];
  width?: number;
  height?: number;
  appointmentId?: string;
  backendId?: number; // Original backend ID for API calls
};

export interface CanvasState {
  pages: Page[];
  currentPageIndex: number;
  selectedElementIds: string[];
  history: {
    past: Page[][];
    future: Page[][];
  };
}

export type Template = {
  id: number;
  name: string;
  hospitalId?: string;
  createdAt?: string;
  updatedAt?: string | null;
  pages?: Array<{
    id: number;
    order: number;
    reportTemplateId: number;
    elements: any[];
  }>;
};

export type ReportDocument = {
  id: string;
  name: string;
  templateId: string;
  patientId?: string;
  patientName?: string;
  patientSurname?: string;
  patientFatherName?: string;
  appointmentId?: string;
  pages: Page[];
  createdAt: string;
  updatedAt: string;
};
