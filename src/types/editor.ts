
export type ElementType = 
  | 'text' 
  | 'chart' 
  | 'shape' 
  | 'comment' 
  | 'signature' 
  | 'table';

export type ElementData = {
  type: ElementType;
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: any;
  style?: Record<string, any>;
  isSelected?: boolean;
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

export type TableData = {
  headers: string[];
  rows: Array<Array<string | number>>;
  title?: string;
  headerBgColor?: string;
  highlightColor?: string;
  rowHighlights?: boolean[];
  cellStatus?: Array<Array<CellStatus>>;
  referenceRanges?: string[];
  units?: string[];
};

export type Page = {
  id: string;
  name: string;
  elements: ElementData[];
  width?: number; // Sayfa genişliği (opsiyonel)
  height?: number; // Sayfa yüksekliği (opsiyonel)
  appointmentId?: string; // Randevu ID'sini ekledik
};

export interface CanvasState {
  pages: Page[];
  currentPageIndex: number;
  selectedElementIds: string[];
  history: {
    past: Page[][]; // History now stores arrays of Page arrays
    future: Page[][]; // History now stores arrays of Page arrays
  };
}

export type Template = {
  id: string;
  name: string;
  thumbnail?: string;
  elements: ElementData[];
  category: 'system' | 'custom';
};

export type ReportDocument = {
  id: string;
  name: string;
  templateId: string;
  patientId?: string; // Hasta ID'sini ekledik
  appointmentId?: string; // Randevu ID'sini ekledik
  pages: Page[];
  createdAt: string;
  updatedAt: string;
};
