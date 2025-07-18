import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReportDocument, Page } from '@/types/editor';
import { reportsApi } from '../api';
import { toast } from 'sonner';

interface ReportsState {
  reports: ReportDocument[];
  activeReportId: string | null;
  openedReportIds: string[]; // Açık olan raporların ID'lerini tutar
  loading: boolean;
  error: string | null;
  reportStats?: {
    dailyReportCount: number;
    monthlyReportCount: number;
  };
  monthlySentFilesCount?: number;
}

const initialState: ReportsState = {
  reports: [],
  activeReportId: null,
  openedReportIds: [],
  loading: false,
  error: null,
  reportStats: undefined,
  monthlySentFilesCount: undefined,
};

// Async thunks for API operations
export const fetchAllReports = createAsyncThunk(
  'reports/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await reportsApi.getAllReports();
    } catch (error) {
      return rejectWithValue('Failed to fetch reports');
    }
  }
);

export const fetchReportById = createAsyncThunk(
  'reports/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const report = await reportsApi.getReportById(id);
      if (!report) {
        return rejectWithValue('Report not found');
      }
      return report;
    } catch (error) {
      return rejectWithValue('Failed to fetch report');
    }
  }
);

export const createNewReport = createAsyncThunk(
  'reports/create',
  async ({
    name,
    templateId,
    patientId,
    appointmentId
  }: {
    name: string;
    templateId: string;
    patientId?: string;
    appointmentId?: string
  }, { rejectWithValue }) => {
    try {
      const newReportData = await reportsApi.createReport(name, templateId);

      const newReport: ReportDocument = {
        ...newReportData,
        ...(patientId && { patientId }),
        ...(appointmentId && { appointmentId }),
      };

      toast.success(`Created report: ${newReport.name}`);
      return newReport;
    } catch (error) {
      return rejectWithValue('Failed to create report');
    }
  }
);

export const updateExistingReport = createAsyncThunk(
  'reports/update',
  async (report: ReportDocument, { rejectWithValue }) => {
    try {
      return await reportsApi.updateReport(report);
    } catch (error) {
      return rejectWithValue('Failed to update report');
    }
  }
);

export const deleteExistingReport = createAsyncThunk(
  'reports/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      const success = await reportsApi.deleteReport(id);
      if (!success) {
        return rejectWithValue('Failed to delete report');
      }
      return id; // Başarılı silme durumunda ID'yi döndür
    } catch (error) {
      return rejectWithValue('Failed to delete report');
    }
  }
);

export const uploadPatientFile = createAsyncThunk(
  'reports/uploadPatientFile',
  async (
    { file, patientId, patientFullName, description }: { file: File; patientId: string; patientFullName: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('patientFullName', patientFullName);
      if (description) formData.append('description', description);

      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/PatientReportFile/CreateReportFile',
        {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            // 'Authorization': 'Bearer ...' // Əgər token lazımdırsa əlavə et
          },
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload file');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to upload file');
    }
  }
);

export const deletePatientFile = createAsyncThunk(
  'reports/deletePatientFile',
  async (id: string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/PatientReportFile/DeleteReportFileById/${id}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete file');
      }
      return id;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete file');
    }
  }
);

export const updatePatientFile = createAsyncThunk(
  'reports/updatePatientFile',
  async (
    { id, file, patientId, patientFullName, description }: { id: string; file: File | null; patientId: string; patientFullName: string; description?: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('patientFullName', patientFullName);
      if (description) formData.append('description', description);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/PatientReportFile/UpdatePatientReportFile/${id}`,
        {
          method: 'PUT',
          body: formData,
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update file');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update file');
    }
  }
);

export const fetchPatientFilesPaginated = createAsyncThunk(
  'reports/fetchPatientFilesPaginated',
  async (
    { name, sort, pageIndex, pageSize }: { name: string; sort: boolean; pageIndex: number; pageSize: number },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/PatientReportFile/GetAllReportFilesPagination',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ name, sort, pageIndex, pageSize }),
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch files');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch files');
    }
  }
);

export const fetchReportStats = createAsyncThunk(
  'reports/fetchReportStats',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/Report/GetReportStats',
        {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch report stats');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch report stats');
    }
  }
);

export const fetchMonthlySentFilesCount = createAsyncThunk(
  'reports/fetchMonthlySentFilesCount',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/HospitalLab/GetUniquePatientCountLastMonth',
        {
          method: 'GET',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          credentials: 'include',
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to fetch monthly sent files count');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to fetch monthly sent files count');
    }
  }
);

// Update a report page
export const updateReportPage = createAsyncThunk(
  'reports/updateReportPage',
  async (
    { pageId, width, height, orderIndex, reportId }: { pageId: number; width: number; height: number; orderIndex: number; reportId: string | number },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportPage/UpdateReportPage/${pageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ width, height, orderIndex, reportId }),
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update report page');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update report page');
    }
  }
);

// Update a report element
export const updateReportElement = createAsyncThunk(
  'reports/updateReportElement',
  async (
    { elementId, type, x, y, width, height, content, reportPageId }: { elementId: number; type: number; x: number; y: number; width: number; height: number; content: any; reportPageId: number },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportElement/UpdateReportElement/${elementId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ type, x, y, width, height, content, reportPageId }),
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update report element');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update report element');
    }
  }
);

// Update report with PDF blob (form-data)
export const updateReportWithBlob = createAsyncThunk(
  'reports/updateReportWithBlob',
  async (
    { id, file, patientId, patientName, type, status, name }: { id: string | number; file: File | Blob; patientId: string; patientName: string; type: number; status: number; name: string },
    { rejectWithValue }
  ) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      formData.append('patientName', patientName);
      formData.append('type', String(type));
      formData.append('status', String(status));
      formData.append('name', name);

      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/Report/UpdateReportBlob/${id}`,
        {
          method: 'PUT',
          body: formData,
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to update report with blob');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to update report with blob');
    }
  }
);

export const deleteReportPage = createAsyncThunk(
  'reports/deleteReportPage',
  async (pageId: number | string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportPage/DeleteReportPage/${pageId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete report page');
      }
      return pageId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete report page');
    }
  }
);

export const deleteReportElement = createAsyncThunk(
  'reports/deleteReportElement',
  async (elementId: number | string, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        `https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportElement/DeleteReportElement/${elementId}`,
        {
          method: 'DELETE',
          credentials: 'include',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to delete report element');
      }
      return elementId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to delete report element');
    }
  }
);

export const createReportPage = createAsyncThunk(
  'reports/createReportPage',
  async (
    { width, height, orderIndex, reportId }: { width: number; height: number; orderIndex: number; reportId: string | number },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportPage/CreateReportPage',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ width, height, orderIndex, reportId }),
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create report page');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create report page');
    }
  }
);

export const createReportElement = createAsyncThunk(
  'reports/createReportElement',
  async (
    { type, x, y, width, height, content, reportPageId }: { type: number; x: number; y: number; width: number; height: number; content: any; reportPageId: number | string },
    { rejectWithValue }
  ) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(
        'https://inframedlife-apigateway-cudnbsd4h5f6czdx.germanywestcentral-01.azurewebsites.net/api/ReportElement/CreateReportElement',
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ type, x, y, width, height, content, reportPageId }),
        }
      );
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to create report element');
      }
      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Failed to create report element');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setActiveReport(state, action: PayloadAction<string>) {
      if (state.openedReportIds.includes(action.payload)) {
        state.activeReportId = action.payload;
      } else {
        console.warn(`setActiveReport called with ID ${action.payload} not in openedReportIds.`);
      }
    },
    updateReportPages(state, action: PayloadAction<{ reportId: string; pages: Page[] }>) {
      const { reportId, pages } = action.payload;
      const report = state.reports.find(r => r.id === reportId);
      if (report) {
        report.pages = pages;
        report.updatedAt = new Date().toISOString();
      }
    },
    viewReport(state, action: PayloadAction<string>) { 
      state.activeReportId = action.payload;
      state.openedReportIds = [action.payload]; 
    },
    closeReport(state, action: PayloadAction<string>) { 
      const reportIdToClose = action.payload;
      state.openedReportIds = state.openedReportIds.filter(id => id !== reportIdToClose);
      if (state.activeReportId === reportIdToClose) {
        state.activeReportId = state.openedReportIds.length > 0 
          ? state.openedReportIds[state.openedReportIds.length - 1] 
          : null;
      }
    },
    closeAllReports(state) { 
      state.activeReportId = null;
      state.openedReportIds = [];
    },
    clearActiveReport(state) {                             
      state.activeReportId = null;
    },
    updateReportPatientInfo(state, action: PayloadAction<{ 
      reportId: string; 
      patientId?: string; 
      appointmentId?: string 
    }>) {
      const { reportId, patientId, appointmentId } = action.payload;
      const report = state.reports.find(r => r.id === reportId);
      if (report) {
        if (patientId !== undefined) report.patientId = patientId;
        if (appointmentId !== undefined) report.appointmentId = appointmentId;
        report.updatedAt = new Date().toISOString();
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch all reports
    builder.addCase(fetchAllReports.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchAllReports.fulfilled, (state, action) => {
      state.reports = action.payload;
      state.loading = false;
    });
    builder.addCase(fetchAllReports.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Fetch report by ID
    builder.addCase(fetchReportById.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReportById.fulfilled, (state, action) => {
      const fetchedReport = action.payload;
      const index = state.reports.findIndex(r => r.id === fetchedReport.id);
      if (index >= 0) {
        state.reports[index] = fetchedReport;
      } else {
        state.reports.push(fetchedReport);
      }
      state.loading = false;
    });
    builder.addCase(fetchReportById.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(`Error: ${action.payload}`);
    });

    // Create new report
    builder.addCase(createNewReport.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createNewReport.fulfilled, (state, action) => {
      const newReport = action.payload;
      state.reports.push(newReport);
      state.activeReportId = newReport.id;
      if (!state.openedReportIds.includes(newReport.id)) {
        state.openedReportIds.push(newReport.id);
      }
      state.loading = false;
    });
    builder.addCase(createNewReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(`Error: ${action.payload}`);
    });

    // Update existing report
    builder.addCase(updateExistingReport.pending, (state) => {
    });
    builder.addCase(updateExistingReport.fulfilled, (state, action) => {
      const index = state.reports.findIndex(r => r.id === action.payload.id);
      if (index >= 0) {
        state.reports[index] = action.payload;
      }
    });
    builder.addCase(updateExistingReport.rejected, (state, action) => {
      state.error = action.payload as string; 
      console.error("Failed to update report in background:", action.payload);
    });

    // Delete report
    builder.addCase(deleteExistingReport.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteExistingReport.fulfilled, (state, action) => {
      const deletedReportId = action.payload;
      state.reports = state.reports.filter(r => r.id !== deletedReportId);
      state.openedReportIds = state.openedReportIds.filter(id => id !== deletedReportId);
      
      if (state.activeReportId === deletedReportId) {
        state.activeReportId = state.openedReportIds.length > 0
          ? state.openedReportIds[state.openedReportIds.length - 1]
          : null;
      }
      state.loading = false;
    });
    builder.addCase(deleteExistingReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(`Error: ${action.payload}`);
    });

    // Fetch report stats
    builder.addCase(fetchReportStats.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchReportStats.fulfilled, (state, action) => {
      state.reportStats = action.payload;
    });
    builder.addCase(fetchReportStats.rejected, (state, action) => {
      state.reportStats = undefined;
    });

    // Fetch monthly sent files count
    builder.addCase(fetchMonthlySentFilesCount.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchMonthlySentFilesCount.fulfilled, (state, action) => {
      state.monthlySentFilesCount = typeof action.payload === 'number' ? action.payload : Number(action.payload) || 0;
    });
    builder.addCase(fetchMonthlySentFilesCount.rejected, (state, action) => {
      state.monthlySentFilesCount = 0;
    });

    // UpdateReportBlobNoFile
    // This thunk and its extraReducer are removed as per the edit hint.
  },
});

export const {
  setActiveReport,
  updateReportPages,
  clearActiveReport,
  viewReport,
  closeReport,
  closeAllReports,
  updateReportPatientInfo
} = reportsSlice.actions;

export default reportsSlice.reducer;
