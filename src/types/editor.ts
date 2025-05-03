
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

export type TableData = {
  headers: string[];
  rows: Array<Array<string | number>>;
  title?: string;
  headerBgColor?: string;
  highlightColor?: string;
  rowHighlights?: boolean[];
  cellStatus?: Array<Array<'normal' | 'positive' | 'negative' | 'warning' | 'active'>>;
  referenceRanges?: string[];
  units?: string[];
};

export interface CanvasState {
  elements: ElementData[];
  selectedElementIds: string[];
  history: {
    past: ElementData[][];
    future: ElementData[][];
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
  elements: ElementData[];
  createdAt: string;
  updatedAt: string;
};
