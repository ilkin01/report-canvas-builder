
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ReportDocument, Page } from '@/types/editor';
import { reportsApi } from '../api';
import { toast } from 'sonner';

interface ReportsState {
  reports: ReportDocument[];
  activeReportId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  reports: [],
  activeReportId: null,
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
  async ({ name, templateId }: { name: string; templateId: string }, { rejectWithValue }) => {
    try {
      const newReport = await reportsApi.createReport(name, templateId);
      toast.success(`Created report: ${name}`);
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
      return id;
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
      state.activeReportId = action.payload;
    },
    updateReportPages(state, action: PayloadAction<{ reportId: string; pages: Page[] }>) {
      const { reportId, pages } = action.payload;
      const report = state.reports.find(r => r.id === reportId);
      if (report) {
        report.pages = pages;
        report.updatedAt = new Date().toISOString();
      }
    },
    clearActiveReport(state) {
      state.activeReportId = null;
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
      const index = state.reports.findIndex(r => r.id === action.payload.id);
      if (index >= 0) {
        state.reports[index] = action.payload;
      } else {
        state.reports.push(action.payload);
      }
      state.activeReportId = action.payload.id;
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
      state.reports.push(action.payload);
      state.activeReportId = action.payload.id;
      state.loading = false;
    });
    builder.addCase(createNewReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(`Error: ${action.payload}`);
    });

    // Update existing report
    builder.addCase(updateExistingReport.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(updateExistingReport.fulfilled, (state, action) => {
      const index = state.reports.findIndex(r => r.id === action.payload.id);
      if (index >= 0) {
        state.reports[index] = action.payload;
      }
      state.loading = false;
    });
    builder.addCase(updateExistingReport.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
      toast.error(`Error: ${action.payload}`);
    });

    // Delete report
    builder.addCase(deleteExistingReport.pending, (state) => {
      state.loading = true;
    });
    builder.addCase(deleteExistingReport.fulfilled, (state, action) => {
      state.reports = state.reports.filter(r => r.id !== action.payload);
      if (state.activeReportId === action.payload) {
        state.activeReportId = state.reports.length > 0 ? state.reports[0].id : null;
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

export const { setActiveReport, updateReportPages, clearActiveReport } = reportsSlice.actions;

export default reportsSlice.reducer;
