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
}

const initialState: ReportsState = {
  reports: [],
  activeReportId: null,
  openedReportIds: [],
  loading: false,
  error: null,
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
